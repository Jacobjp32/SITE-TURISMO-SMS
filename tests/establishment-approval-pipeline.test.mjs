import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
// Normaliza CRLF: no Windows (core.autocrlf=true) a cópia de trabalho usa CRLF
// e as âncoras dos testes procuram "\n".
const readLf = async (path) => (await readFile(new URL(path, root), "utf8")).replace(/\r\n/g, "\n");
const [bridgeSource, moduleSource, publicationSource, authSource, adminHtml, portalHtml, moderationSource] = await Promise.all([
  readLf("js/establishment-submission-bridge.js"),
  readLf("js/admin/modules/empreendimentos.js"),
  readLf("js/publication-contracts.js"),
  readLf("js/firebase-auth.js"),
  readLf("admin-firebase.html"),
  readLf("portal-usuario.html"),
  readLf("js/establishment-moderation.js"),
]);

const bridgeContext = { URL, encodeURIComponent };
vm.runInNewContext(moderationSource, bridgeContext);
vm.runInNewContext(bridgeSource, bridgeContext);
const bridge = bridgeContext.EstablishmentSubmissionBridge;

const contractsContext = { URL, TextEncoder };
vm.runInNewContext(publicationSource, contractsContext);
const contracts = contractsContext.SMSPublicationContracts;

function loadAdminModule() {
  const window = {
    EstablishmentSubmissionBridge: bridge,
    SMSPublicationContracts: contracts,
    firebase: { firestore: { FieldValue: { serverTimestamp: () => ({ server: true }), delete: () => ({ delete: true }) } } },
    currentUser: { uid: "admin-synthetic" },
    crypto: globalThis.crypto,
  };
  const context = { window, document: { getElementById: () => null }, console, URL, Date, Promise };
  vm.runInNewContext(moduleSource, context);
  return window.AdminEstablishmentsModule;
}

const adminModule = loadAdminModule();

function provenanceId(submissionId) {
  return "submission-sha256-" + createHash("sha256")
    .update(`establishment-submission:${submissionId}`)
    .digest("hex");
}

function submission(overrides = {}) {
  const id = overrides.id || "est_1001";
  return {
    id,
    name: "Chess Choperia",
    nome: "Chess Choperia",
    category: "restaurante",
    categoria: "restaurante",
    address: "R. Barão do Rio Branco, 1085, Centro",
    endereco: "R. Barão do Rio Branco, 1085, Centro",
    description: "Cadastro sintético para teste.",
    phone: "(42) 99832-0172",
    whatsapp: "",
    website: "https://chess.example/cardapio",
    openingHours: "18:00–23:00",
    submittedBy: "private-uid",
    submittedByEmail: "private@example.test",
    ownerUid: "private-owner",
    ownerEmail: "owner@example.test",
    reviewedBy: "private-reviewer",
    reviewNotes: "nota privada",
    images: Array.from({ length: 5 }, (_, index) => ({
      url: `https://firebasestorage.googleapis.com/v0/b/demo/o/approved-media%2Fcms-establishments%2Fchess-choperia%2F${id}-${index + 1}.webp?alt=media`,
      path: `approved-media/cms-establishments/chess-choperia/${id}-${index + 1}.webp`,
      name: `${index + 1}.webp`,
      contentType: "image/webp",
      size: 100 + index,
    })),
    ...overrides,
  };
}

function mapDraft(raw = submission()) {
  return bridge.mapSubmissionToCmsDraft(raw, {
    id: bridge.makeCanonicalSlug(raw.name || raw.nome),
    submissionId: raw.id,
    provenanceId: provenanceId(raw.id),
    uid: "admin-synthetic",
    createBase: adminModule._defaultDoc,
    safeAsset: contracts.url.publicAsset,
    safeExternalUrl: contracts.url.externalHttps,
  });
}

test("Chess usa um único slug e identidade apesar da variação de telefone", () => {
  const a = submission({ id: "est_1001", phone: "(42) 99832-0172" });
  const b = submission({ id: "est_1002", phone: "42 9832-0172" });
  assert.equal(bridge.makeCanonicalSlug(a.name), "chess-choperia");
  assert.equal(bridge.semanticIdentityLockId(a), bridge.semanticIdentityLockId(b));
  assert.notEqual(bridge.normalizePhone(a.phone), bridge.normalizePhone(b.phone));
  assert.equal(bridge.normalizeAddress("Rua Barão do Rio Branco, 1085, Centro"), bridge.normalizeAddress(a.address));
});

test("identidade semântica coincide entre o shape plano do Portal e o shape aninhado do CMS", () => {
  const portal = submission();
  const nestedCms = {
    name: portal.name,
    slug: "chess-choperia",
    location: { address: portal.address },
    contact: { phone: portal.phone, website: portal.website },
  };
  assert.deepEqual({ ...bridge.semanticIdentity(nestedCms) }, { ...bridge.semanticIdentity(portal) });
  assert.equal(bridge.semanticIdentityLockId(nestedCms), bridge.semanticIdentityLockId(portal));
});

test("submissão nova mapeia para draft CMS V2 sem publicação automática", () => {
  const draft = mapDraft();
  assert.equal(draft.id, "chess-choperia");
  assert.equal(draft.slug, "chess-choperia");
  assert.equal(draft.status, "draft");
  assert.equal(draft.schemaVersion, 2);
  assert.deepEqual(Object.keys(draft.validatedGroups), []);
  assert.equal(draft.publishing.publishedAt, null);
  assert.equal(draft.publishing.publishedBy, "");
  assert.deepEqual(draft.media.publicPaths, draft.media.gallery.map((image) => image.path));
  assert.equal(adminModule._GROUP_ORDER.length, 13);
});

test("projeção CMS exclui PII e notas privadas", () => {
  const serialized = JSON.stringify(mapDraft());
  for (const forbidden of ["private-uid", "private@example.test", "private-owner", "owner@example.test", "private-reviewer", "nota privada"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.equal(mapDraft().source.origin, "portal_usuario");
  assert.equal(mapDraft().source.originalId, provenanceId("est_1001"));
});

test("Portal acompanha submissões próprias sem confundir aprovação com publicação", () => {
  assert.match(authSource, /getUserEstablishments:[\s\S]*collection\('estabelecimentos_pendentes'\)[\s\S]*where\('submittedBy', '==', currentUser\.uid\)/);
  assert.match(portalHtml, /id="myEstablishmentSubmissions"/);
  assert.match(portalHtml, /carregarEstabelecimentos\(\)/);
  assert.match(portalHtml, /status === 'pendente'[\s\S]*aguardando análise/);
  assert.match(portalHtml, /status === 'aprovado'[\s\S]*catálogo editorial como rascunho/);
  assert.match(portalHtml, /ainda não significa que ele foi publicado no portal/);
  assert.match(portalHtml, /'rejeitado', 'correcao_solicitada'[\s\S]*reviewNotes/);
});

test("mídia preparada é reutilizada sem path privado nem galeria duplicada", () => {
  const raw = submission({ images: [submission().images[0], submission().images[0], submission().images[1]] });
  const draft = mapDraft(raw);
  assert.equal(draft.media.gallery.length, 2);
  assert.equal(draft.media.mainImage.path.startsWith("approved-media/cms-establishments/chess-choperia/"), true);
  assert.equal(JSON.stringify(draft.media).includes("submissions/"), false);
  assert.equal(draft.media.mainImage.source, "portal_request");
});

test("projeção publicável rejeita path aprovado órfão ou incoerente com a URL", () => {
  const path = "approved-media/cms-establishments/chess-choperia/orphan.webp";
  assert.deepEqual(adminModule._approvedPublicMediaPaths({ url: "", path, status: "active" }, [], "chess-choperia"), []);
  assert.deepEqual(adminModule._approvedPublicMediaPaths({ url: "https://example.test/other.webp", path, status: "active" }, [], "chess-choperia"), []);
  assert.deepEqual(adminModule._approvedPublicMediaPaths({
    url: "https://example.test/approved-media/cms-establishments/outro/orphan.webp",
    path: "approved-media/cms-establishments/outro/orphan.webp",
    status: "active",
  }, [], "chess-choperia"), []);
  assert.match(moduleSource, /preserveMainImageProvenance[\s\S]*requestedMainImageUrl === clean\(base\.media\.mainImage\.url\)/);
});

test("path privado e website inseguro falham fechados", () => {
  assert.throws(() => mapDraft(submission({ images: [{ url: "https://example.test/x.webp", path: "submissions/establishments/private/x.webp" }] })), {
    code: "establishment-bridge/private-media",
  });
  assert.throws(() => mapDraft(submission({ images: [{ url: "https://example.test/x.webp", path: "approved-media/cms-establishments/outro/x.webp" }] })), {
    code: "establishment-bridge/private-media",
  });
  assert.throws(() => mapDraft(submission({ website: "javascript:alert(1)" })), {
    code: "publication/invalid-field",
  });
});

test("categoria sem mapeamento não vira serviço silenciosamente", () => {
  assert.throws(() => mapDraft(submission({ category: "categoria-inventada", categoria: "categoria-inventada" })), {
    code: "establishment-bridge/unknown-category",
  });
});

test("duplicata Chess com IDs e telefones diferentes é semântica e não cria sufixo", () => {
  const first = submission({ id: "est_1001", phone: "(42) 99832-0172" });
  const second = submission({ id: "est_1002", phone: "42 9832-0172" });
  const result = bridge.classifyDuplicate(second, {
    cms: [{ id: "chess-choperia", data: mapDraft(first) }],
    pending: [], legacyApproved: [], excludeSubmissionId: second.id,
  });
  assert.equal(result.kind, "EXACT_CMS_MATCH");
  assert.equal(result.candidates[0].id, "chess-choperia");
  assert.equal(bridge.makeCanonicalSlug(second.name).endsWith("-2"), false);
});

test("CMS existente em draft, published ou archived é identificado no mesmo candidato", () => {
  for (const status of ["draft", "published", "archived"]) {
    const existing = mapDraft();
    existing.status = status;
    const result = bridge.classifyDuplicate(submission({ id: "est_other" }), {
      cms: [{ id: existing.id, data: existing }], pending: [], legacyApproved: [], excludeSubmissionId: "est_other",
    });
    assert.equal(result.kind, "EXACT_CMS_MATCH", status);
    assert.equal(result.candidates[0].status, status);
  }
});

test("mesmo nome com endereço diferente exige revisão e nenhum auto-match", () => {
  const existing = mapDraft();
  existing.location.address = "Rua Outra, 99";
  const result = bridge.classifyDuplicate(submission({ id: "est_other" }), {
    cms: [{ id: existing.id, data: existing }], pending: [], legacyApproved: [], excludeSubmissionId: "est_other",
  });
  assert.equal(result.kind, "AMBIGUOUS_MATCH");
});

test("mesmo endereço com nome diferente exige revisão", () => {
  const existing = mapDraft();
  existing.name = "Outro Comércio";
  existing.slug = "outro-comercio";
  existing.id = "outro-comercio";
  const result = bridge.classifyDuplicate(submission({ id: "est_other" }), {
    cms: [{ id: existing.id, data: existing }], pending: [], legacyApproved: [], excludeSubmissionId: "est_other",
  });
  assert.equal(result.kind, "AMBIGUOUS_MATCH");
});

test("duplicatas em pending e legado têm classificações explícitas", () => {
  const current = submission({ id: "est_current" });
  assert.equal(bridge.classifyDuplicate(current, {
    cms: [], pending: [{ id: "est_other", data: submission({ id: "est_other" }) }], legacyApproved: [], excludeSubmissionId: current.id,
  }).kind, "PENDING_DUPLICATE");
  assert.equal(bridge.classifyDuplicate(current, {
    cms: [], pending: [], legacyApproved: [{ id: "legacy", data: submission({ id: "legacy" }) }], excludeSubmissionId: current.id,
  }).kind, "LEGACY_APPROVED_DUPLICATE");
});

test("match simultâneo em pending e legado é ambíguo e nunca libera o mais antigo", () => {
  const current = submission({ id: "est_oldest", submittedAt: "2026-09-14T09:00:00Z" });
  const result = bridge.classifyDuplicate(current, {
    pending: [{ id: "est_newer", data: submission({ id: "est_newer", submittedAt: "2026-09-14T10:00:00Z" }) }],
    legacyApproved: [{ id: "legacy-chess", data: submission({ id: "legacy-chess", status: "aprovado" }) }],
    excludeSubmissionId: current.id,
  });
  assert.equal(result.kind, "AMBIGUOUS_MATCH");
  assert.deepEqual(new Set(result.candidates.map((candidate) => candidate.scope)), new Set(["pending", "legacy-approved"]));
});

test("entre duplicatas pendentes somente a submissão mais antiga pode reservar primeiro", () => {
  const first = submission({ id: "est_1001", submittedAt: "2026-09-14T10:00:00.000Z" });
  const second = submission({ id: "est_1002", submittedAt: "2026-09-14T10:01:00.000Z" });
  assert.equal(bridge.isPreferredPendingSubmission(first, [{ id: second.id, data: second }]), true);
  assert.equal(bridge.isPreferredPendingSubmission(second, [{ id: first.id, data: first }]), false);
});

// Exercise the real approval entry point and classifier, with database snapshots
// isolated in memory. A reservation sentinel proves the preflight did not mutate.
async function approvalDuplicatePreflight(otherStatus, sameSubmission = false) {
  const target = submission({ id: "est_duplicate_target", status: "pendente" });
  const other = submission({
    id: sameSubmission ? target.id : "est_duplicate_other",
    name: "Outro Restaurante Sintético", nome: "Outro Restaurante Sintético",
    website: "https://outro-restaurante.example", status: otherStatus,
  });
  let classified;
  let reservations = 0;
  const snapshot = (data) => ({ exists: true, data: () => data });
  const fakeDb = {
    collection(name) {
      return {
        doc: () => ({ get: async () => snapshot(target) }),
        get: async () => ({ docs: name === "estabelecimentos_pendentes"
          ? [{ id: other.id, data: () => other }] : [] }),
      };
    },
  };
  const classifier = Object.assign({}, bridge, {
    classifyDuplicate(raw, options) {
      classified = bridge.classifyDuplicate(raw, options);
      return classified;
    },
  });
  const body = authSource.match(/approveEstablishment:\s*(async function[\s\S]*?)\n\s*},\n\s*\n\s*rejectEstablishment:/)?.[1];
  assert.ok(body, "approval entry point available");
  const approve = vm.runInNewContext("(" + body + "\n})", {
    requirePublicationContracts: () => contracts,
    requireEstablishmentSubmissionBridge: () => classifier,
    establishmentSubmissionProvenanceId: async (id) => provenanceId(id),
    firebase: { firestore: () => fakeDb },
    snapshotItems: (value) => value.docs.map((item) => ({ id: item.id, data: item.data() })),
    sanitizeLogMessage: (error) => String(error && error.message || error),
    currentUser: { uid: "admin-synthetic" },
    console: { error() {} },
    window: {
      EstablishmentModeration: bridgeContext.EstablishmentModeration,
      AdminEstablishmentsModule: {
        importSubmissionDraft() { assert.fail("must not import during preflight"); },
        reserveSubmissionImport() {
          reservations += 1;
          throw Object.assign(new Error("preflight completed"), { code: "test/reservation-sentinel" });
        },
      },
    },
  });
  const result = await approve.call({ isAdmin: () => true }, target.id);
  return { result, classified, reservations };
}

for (const status of ["pendente", "em_analise", "correcao_solicitada"]) {
  test(`aprovação bloqueia identidade ambígua em solicitação ${status}`, async () => {
    const { result, classified, reservations } = await approvalDuplicatePreflight(status);
    assert.equal(classified.kind, "AMBIGUOUS_MATCH");
    assert.equal(result.success, false);
    assert.equal(result.code, "POSSIBLE_DUPLICATE_REQUIRES_REVIEW");
    assert.equal(result.candidates.length, 1);
    assert.equal(reservations, 0, "no reservation, media promotion or draft import");
  });
}

for (const status of ["aprovado", "rejeitado", "estado_desconhecido"]) {
  test(`aprovação exclui solicitação ${status} da comparação de solicitações abertas`, async () => {
    const { result, classified, reservations } = await approvalDuplicatePreflight(status);
    assert.equal(classified.kind, "NO_MATCH");
    assert.equal(result.code, "test/reservation-sentinel");
    assert.equal(reservations, 1);
  });
}

test("aprovação exclui a própria solicitação da comparação em análise", async () => {
  const { classified, reservations } = await approvalDuplicatePreflight("em_analise", true);
  assert.equal(classified.kind, "NO_MATCH");
  assert.equal(reservations, 1);
});

test("runtime não grava novos estabelecimentos_aprovados e exige admin", () => {
  const approvalBody = authSource.match(/approveEstablishment:\s*async function[\s\S]*?\n\s*},\n\s*\n\s*rejectEstablishment:/)?.[0] || "";
  assert.match(approvalBody, /if \(!this\.isAdmin\(\)\)/);
  assert.doesNotMatch(approvalBody, /collection\(['"]estabelecimentos_aprovados['"]\)\.doc/);
  assert.match(approvalBody, /reserveSubmissionImport/);
  assert.match(approvalBody, /preparePublicSubmissionMedia\(submission, 'establishment', cmsId, submissionId\)/);
  assert.match(authSource, /approvedMediaSourceToken\(sourcePath\)/);
  assert.match(authSource, /SHA-256/);
});

test("criação e edição manual compartilham preflight e alias permanente", () => {
  assert.match(moduleSource, /assertNoManualSemanticDuplicate\(db, payload\)/);
  assert.match(moduleSource, /prepareUploads\(storage, uid, payload, mainFile, galleryFiles\)[\s\S]*reserveManualIdentityLock\(db, ref, payload, base, uid\)/);
  assert.match(moduleSource, /policy:\s*["']permanent_alias_v1["']/);
  assert.match(authSource, /flow:\s*'approved-text-request'[\s\S]*enforceSemanticIdentity:/);
  assert.match(moduleSource, /options\.enforceSemanticIdentity === true[\s\S]*assertNoManualSemanticDuplicate[\s\S]*reserveManualIdentityLock/);
});

test("mídia de solicitação aplicada ao CMS não projeta path privado nem identidade de revisão", () => {
  const start = authSource.indexOf("function buildReviewedCatalogImage");
  const end = authSource.indexOf("function createMediaApplicationError", start);
  const body = authSource.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(body, /sourceRequestId|sourceImagePath|uploadedBy|reviewedBy/);
  assert.doesNotMatch(body, /sourceImage\.name/);
  assert.match(body, /source:\s*'portal_request'/);
  assert.match(authSource, /'establishment-update'[\s\S]*approved-media/);
  assert.match(authSource, /getExistingApprovedMediaUrl\(destinationRef\)[\s\S]*if \(!destinationUrl\)[\s\S]*destinationRef\.put/);
  assert.match(authSource, /acceptedEntries\[i\]\.index/);
  assert.match(authSource, /reviewedAcceptedSelections = buildSafeImageMetadata\(request\.images\)\.map[\s\S]*index: index[\s\S]*selection\.index/);
  assert.match(authSource, /mediaApplyState:\s*'applying'[\s\S]*mediaApplyFingerprint:\s*fingerprint/);
  assert.match(authSource, /mediaApplyState, 40\) === 'applying'/);
  assert.match(authSource, /readOpaqueFingerprint\(currentRequest\.mediaApplyFingerprint\) !== mediaApplyFingerprint/);
  assert.doesNotMatch(authSource, /sanitizeSimpleText\(currentRequest\.mediaApplyFingerprint/);
  assert.match(authSource, /destinationFileName = entityKind === 'event'[\s\S]*sourceToken[\s\S]*approvedMediaExtension/);
  assert.doesNotMatch(authSource, /establishmentUpdate\[['"]review\.lastApplied(?:RequestId|By)['"]\]/);
  assert.doesNotMatch(authSource, /additionalNotes:\s*['"]review\.lastReviewNotes['"]/);
  assert.match(authSource, /mediaApplyBaseFingerprint[\s\S]*expectedRevision:\s*mediaExpectedRevision/);
  assert.match(authSource, /textApplyState:\s*'applying'[\s\S]*textApplyBaseValues[\s\S]*expectedRevision:\s*textReservation\.expectedRevision/);
  assert.match(authSource, /cmsTextValuesRemainResumable[\s\S]*isResumablePublishedLifecycle/);
  assert.match(authSource, /workflowProgressHas\(progress,[\s\S]*allTextApplyGroupsCompleted/);
  assert.match(moduleSource, /workflowProgress\.field === ["']textApplyProgress["'][\s\S]*workflowProgress\.field === ["']mediaApplyProgress["']/);
  assert.match(authSource, /establishmentSubmissionProvenanceId[\s\S]*submission-sha256-/);
  assert.match(bridgeSource, /unsafe-provenance[\s\S]*source\.originalId\s*=\s*provenanceId/);
  assert.match(moduleSource, /Number\.isInteger\(options\.expectedRevision\)[\s\S]*base\.revision !== options\.expectedRevision/);
});

test("copy e UI descrevem draft, não publicação", () => {
  assert.match(authSource, /Cadastro aprovado e enviado ao catálogo editorial como rascunho/);
  assert.match(adminHtml, /Nada será publicado automaticamente/);
  assert.match(adminHtml, /Abrir solicitação/);
  assert.match(authSource, /Somente administradores podem aprovar e criar o rascunho/);
});

test("website opcional não ressuscita Instagram legado e correção mantém o original", () => {
  assert.throws(() => mapDraft(submission({ name: undefined, nome: undefined })), { code: "establishment-bridge/invalid-content" });
  assert.equal(mapDraft(submission({ images: [], mainImage: "", website: "" })).media.gallery.length, 0);
  const original = submission({ website: "", site: "@hotel", instagram: "@hotel" });
  assert.equal(mapDraft(original).contact.website, "");
  assert.equal(mapDraft(original).contact.instagram, "@hotel");
  assert.equal(mapDraft({ ...original, moderation: { revision: 1, corrections: { instagram: null } } }).contact.instagram, "");
  const invalid = submission({ website: "hotel.example", site: "hotel.example" });
  assert.throws(() => mapDraft(invalid), { code: "publication/invalid-field", field: "website" });
  const corrected = { ...invalid, moderation: { revision: 1, corrections: { website: "https://hotel.example" } } };
  assert.equal(mapDraft(corrected).contact.website, "https://hotel.example");
  assert.equal(corrected.website, "hotel.example");
  assert.notEqual(bridge.approvalFingerprint(invalid), bridge.approvalFingerprint(corrected));
  assert.equal(mapDraft({ ...corrected, moderation: { revision: 2, corrections: { website: null } } }).contact.website, "");
});

test("fingerprint ignora workflow e PII, mas cobre metadados editoriais que afetam a saga", () => {
  const base = submission();
  assert.equal(bridge.approvalFingerprint(base), bridge.approvalFingerprint({
    ...base, cmsImportState: "media_preparing", reviewedBy: "outro", submittedBy: "other-owner", submittedByEmail: "changed@example.test",
  }));
  assert.notEqual(bridge.approvalFingerprint(base), bridge.approvalFingerprint({ ...base, description: "Conteúdo alterado" }));
  assert.notEqual(bridge.approvalFingerprint(base), bridge.approvalFingerprint({ ...base, mainImage: "changed-cover" }));
  assert.notEqual(bridge.approvalFingerprint(base), bridge.approvalFingerprint({
    ...base,
    images: base.images.map((image, index) => index === 0 ? { ...image, alt: "Alt alterado" } : image),
  }));
});

// ---- Regressão: endereço genérico não bloqueia cadastros legítimos ----
function cmsRecord(id, name, address, phone = "", website = "") {
  return { id, data: { id, slug: id, name, status: "published", location: { address }, contact: { phone, website } } };
}

function classifyEdit(id, catalog) {
  const self = catalog.find((entry) => entry.id === id);
  return bridge.classifyDuplicate({ ...self.data, id }, {
    cms: catalog.filter((entry) => entry.id !== id), pending: [], legacyApproved: [], excludeSubmissionId: id,
  });
}

test("endereço sem número (bairro, localidade, cidade) com nomes e telefones diferentes não é duplicidade", () => {
  const catalog = [
    cmsRecord("hotel-sao-mateus", "Hotel São Mateus", "Centro", "(42) 3532-1802"),
    cmsRecord("hotel-dom-leopoldo", "Hotel Dom Leopoldo", "Centro", "(42) 3282-3000"),
    cmsRecord("hotel-nora", "Hotel Nora", "Centro", "(42) 3532-1111"),
    cmsRecord("ervateira-rei-verde", "Ervateira Rei Verde", "Localidade de Fluviópolis", "(42) 99111-0001"),
    cmsRecord("canil-sao-jose", "Canil São José", "Localidade de Fluviópolis", "(42) 99111-0002"),
    cmsRecord("ginasio-polacao", "Ginásio Polacão", "São Mateus do Sul, PR", "(42) 3532-0000"),
  ];
  for (const { id } of catalog) assert.equal(classifyEdit(id, catalog).kind, "NO_MATCH", id);
});

test("telefone institucional repetido em vários cadastros não transforma endereço genérico em duplicidade", () => {
  const dept = "(42) 3532-4163";
  const catalog = [
    cmsRecord("arena-cultural", "Arena Cultural", "São Mateus do Sul, PR", dept),
    cmsRecord("miss-sao-mateus", "Miss São Mateus do Sul", "São Mateus do Sul, PR", dept),
    cmsRecord("casa-da-memoria", "Casa da Memória", "São Mateus do Sul, PR", dept),
    cmsRecord("rua-do-mathe", "Rua do Mathe", "São Mateus do Sul, PR", dept),
  ];
  for (const { id } of catalog) assert.equal(classifyEdit(id, catalog).kind, "NO_MATCH", id);
});

test("endereço genérico com telefone ou site exclusivo em comum continua exigindo revisão", () => {
  const byPhone = [
    cmsRecord("parada-a", "Parada do Chimarrão", "Fluviópolis", "(42) 99960-0496"),
    cmsRecord("parada-b", "Posto Parada Nova", "Fluviópolis", "42 99960-0496"),
  ];
  assert.equal(classifyEdit("parada-a", byPhone).kind, "AMBIGUOUS_MATCH");
  const bySite = [
    cmsRecord("loja-a", "Loja do Mate", "Centro", "", "https://mate.example/"),
    cmsRecord("loja-b", "Empório do Mate", "Centro", "", "https://www.mate.example"),
  ];
  assert.equal(classifyEdit("loja-a", bySite).kind, "AMBIGUOUS_MATCH");
});

test("duplicidade real com mesmo nome continua detectada mesmo com endereço incompleto", () => {
  const catalog = [
    cmsRecord("churrascaria-dallas", "Restaurante e Churrascaria Dallas", "Localidade de Fluviópolis", "(42) 98845-6741"),
    cmsRecord("restaurante-dallas", "Restaurante e Churrascaria Dallas", "Fluviópolis", "(42) 98845-6741"),
  ];
  const result = classifyEdit("restaurante-dallas", catalog);
  assert.equal(result.kind, "AMBIGUOUS_MATCH");
  assert.deepEqual(result.candidates.map((c) => c.id), ["churrascaria-dallas"]);
  const sameEverything = [
    cmsRecord("bar-a", "Bar Central", "Centro"),
    cmsRecord("bar-b", "Bar Central", "Centro"),
  ];
  assert.equal(classifyEdit("bar-a", sameEverything).kind, "SEMANTIC_CMS_MATCH");
});

test("endereço com número continua bloqueando nome diferente no mesmo imóvel", () => {
  const catalog = [
    cmsRecord("loja-1", "Loja Um", "Rua XV de Novembro, 120", "(42) 91111-1111"),
    cmsRecord("loja-2", "Loja Dois", "R. XV de Novembro, 120", "(42) 92222-2222"),
    cmsRecord("loja-3", "Loja Três", "Rua XV de Novembro, 300", "(42) 93333-3333"),
  ];
  assert.equal(classifyEdit("loja-1", catalog).kind, "AMBIGUOUS_MATCH");
  assert.deepEqual(classifyEdit("loja-1", catalog).candidates.map((c) => c.id), ["loja-2"]);
  assert.equal(classifyEdit("loja-3", catalog).kind, "NO_MATCH");
});

test("edição de registro existente não colide consigo mesmo nem com vizinhos do mesmo bairro", () => {
  const catalog = [
    cmsRecord("hotel-sao-mateus", "Hotel São Mateus", "Centro", "(42) 3532-1802"),
    cmsRecord("hotel-dom-leopoldo", "Hotel Dom Leopoldo", "Centro", "(42) 3282-3000"),
  ];
  const edited = { ...catalog[0].data, media: { mainImage: { url: "images/empreendimentos/hotel-sao-mateus/hotel-sao-mateus-09.jpeg" } } };
  // O painel compara a edição com todos os outros registros (assertNoManualSemanticDuplicate).
  const result = bridge.classifyDuplicate(edited, {
    cms: catalog.filter((entry) => entry.id !== edited.id), pending: [], legacyApproved: [], excludeSubmissionId: edited.id,
  });
  assert.equal(result.kind, "NO_MATCH");
  assert.match(moduleSource, /candidate\.id !== desired\.id/, "painel exclui o próprio registro antes de comparar");
});

test("aprovação de cadastro do Portal com endereço genérico só para em duplicidade verdadeira", () => {
  const portal = submission({ id: "est_portal", name: "Pesqueiro Novo", nome: "Pesqueiro Novo", address: "Localidade de Fluviópolis", endereco: "Localidade de Fluviópolis", phone: "(42) 97777-0000", website: "" });
  const cms = [
    cmsRecord("canil-sao-jose", "Canil São José", "Localidade de Fluviópolis", "(42) 99111-0002"),
    cmsRecord("ervateira-rei-verde", "Ervateira Rei Verde", "Localidade de Fluviópolis", "(42) 99111-0001"),
  ];
  assert.equal(bridge.classifyDuplicate(portal, { cms, pending: [], legacyApproved: [], excludeSubmissionId: portal.id }).kind, "NO_MATCH");
  const resend = submission({ id: "est_portal_2", name: "Canil São José", nome: "Canil São José", address: "Localidade de Fluviópolis", endereco: "Localidade de Fluviópolis", phone: "(42) 99111-0002", website: "" });
  const dup = bridge.classifyDuplicate(resend, { cms, pending: [], legacyApproved: [], excludeSubmissionId: resend.id });
  assert.notEqual(dup.kind, "NO_MATCH");
  assert.deepEqual(dup.candidates.map((c) => c.id), ["canil-sao-jose"]);
});
