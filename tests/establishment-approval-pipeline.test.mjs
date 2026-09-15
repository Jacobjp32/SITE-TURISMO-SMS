import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const [bridgeSource, moduleSource, publicationSource, authSource, adminHtml, portalHtml] = await Promise.all([
  readFile(new URL("js/establishment-submission-bridge.js", root), "utf8"),
  readFile(new URL("js/admin/modules/empreendimentos.js", root), "utf8"),
  readFile(new URL("js/publication-contracts.js", root), "utf8"),
  readFile(new URL("js/firebase-auth.js", root), "utf8"),
  readFile(new URL("admin-firebase.html", root), "utf8"),
  readFile(new URL("portal-usuario.html", root), "utf8"),
]);

const bridgeContext = { URL, encodeURIComponent };
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
  assert.match(portalHtml, /status === 'rejeitado'[\s\S]*reviewNotes/);
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
  assert.match(adminHtml, /Aprovar e criar draft/);
  assert.match(adminHtml, /Aprovação exige admin/);
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
