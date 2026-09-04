"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  AUDITED_COLLECTIONS, HUMAN_FIRESTORE_AUTH_TYPES, auditDocumentId, buildAuditRecord,
  deriveAction, resolveActorRoleSnapshot, sanitizeMetadata
} = require("../functions/audit-core");

test("allowlist exata exclui audit_logs e coleções desconhecidas", () => {
  assert.equal(AUDITED_COLLECTIONS.size, 15);
  assert.equal(AUDITED_COLLECTIONS.has("gallery_items"), true);
  assert.equal(AUDITED_COLLECTIONS.has("site_config"), true);
  assert.equal(AUDITED_COLLECTIONS.has("audit_logs"), false);
  assert.equal(AUDITED_COLLECTIONS.has("unknown"), false);
});

test("ID de evento seguro é idempotente e slash usa SHA-256", () => {
  assert.equal(auditDocumentId("evt-1"), "evt-1");
  assert.equal(auditDocumentId("evt-1"), auditDocumentId("evt-1"));
  assert.match(auditDocumentId("evt/unsafe"), /^[a-f0-9]{64}$/);
});

test("deriva ações base e semânticas por diff estrutural", () => {
  assert.equal(deriveAction("banners", null, { status: "draft" }), "create");
  assert.equal(deriveAction("banners", { status: "draft" }, null), "delete");
  assert.equal(deriveAction("banners", { status: "draft" }, { status: "published" }), "publish");
  assert.equal(deriveAction("banners", { status: "draft" }, { status: "publicado" }), "publish");
  assert.equal(deriveAction("banners", { status: "published" }, { status: "draft" }), "unpublish");
  assert.equal(deriveAction("rotas", { status: "draft" }, { status: "archived" }), "archive");
  assert.equal(deriveAction("eventos_pendentes", { status: "pending" }, { status: "rejected" }), "reject");
  assert.equal(deriveAction("eventos_pendentes", { status: "pending" }, { status: "changes_requested" }), "request_changes");
  assert.equal(deriveAction("usuarios", { role: "user", ativo: true }, { role: "admin", ativo: true }), "change_user_role");
  assert.equal(deriveAction("usuarios", { role: "admin", ativo: true }, { role: "admin", ativo: false }), "change_user_status");
  assert.equal(deriveAction("establishment_claims", { status: "pending" }, { status: "approved" }), "approve_claim");
  assert.equal(deriveAction("establishment_update_requests", { status: "pending" }, { status: "approved" }), "approve_update_request");
  assert.equal(deriveAction("eventos_aprovados", { status: "pending" }, { status: "approved" }), "approve_event_or_establishment");
  assert.equal(deriveAction("eventos_aprovados", null, { status: "aprovado" }), "approve_event_or_establishment");
  assert.equal(deriveAction("estabelecimentos_aprovados", null, { status: "approved" }), "approve_event_or_establishment");
  assert.equal(deriveAction("establishment_update_requests", { status: "pending", mediaReview: null }, { status: "pending", mediaReview: { images: [] } }), "media_review");
  assert.equal(deriveAction("banners", null, { status: "published" }), "publish");
  assert.equal(deriveAction("banners", null, { status: "publicado" }), "publish");
  assert.equal(deriveAction("noticias", null, { status: "draft", publicado: true }), "publish");
  assert.equal(deriveAction("banners", { title: "A" }, { title: "B" }), "update");
  assert.equal(deriveAction("eventos_aprovados", null, { status: "draft" }), "create");
  assert.equal(deriveAction("media_library", { review: null }, { review: { status: "accepted" } }), "update");
  assert.equal(deriveAction("establishment_update_requests", { status: "pending", reviewedAt: null }, { status: "pending", reviewedAt: "time" }), "update");
  assert.equal(deriveAction("eventos_aprovados", { status: "approved", title: "A" }, { status: "approved", title: "B" }), "update");
  assert.equal(deriveAction("establishment_claims", { status: "approved", note: "A" }, { status: "approved", note: "B" }), "update");
  assert.equal(deriveAction("banners", { status: "archived", title: "A" }, { status: "archived", title: "B" }), "update");
  assert.equal(deriveAction("noticias", { status: "draft", publicado: false }, { status: "draft", publicado: true }), "publish");
  assert.equal(deriveAction("noticias", { status: "published", publicado: true }, { status: "published", publicado: false }), "unpublish");
  assert.equal(deriveAction("noticias", { status: "draft", publicado: false }, { status: "published", publicado: false }), "update");
  assert.equal(deriveAction("noticias", { status: "published", publicado: true }, { status: "draft", publicado: true }), "update");
});

test("restore exige transição real de archived para draft", () => {
  assert.equal(deriveAction("cms_establishments", { status: "archived" }, { status: "draft" }), "restore");
  assert.equal(deriveAction("cms_establishments", { status: "arquivado" }, { status: "rascunho" }), "restore");
  assert.equal(deriveAction("cms_establishments", { status: "archived", publicado: false }, { status: "draft", publicado: false }), "restore");
  assert.equal(deriveAction("cms_establishments", { status: "draft", title: "A" }, { status: "draft", title: "B" }), "update");
  assert.equal(deriveAction("cms_establishments", { status: "draft" }, { status: "archived" }), "archive");
  assert.equal(deriveAction("cms_establishments", { status: "archived", title: "A" }, { status: "archived", title: "B" }), "update");
  assert.equal(deriveAction("cms_establishments", { status: "archived" }, { status: "published" }), "publish");
});

test("metadata usa somente a allowlist canônica e não copia conteúdo sensível", () => {
  const before = { status: "draft", email: "old@example.invalid", token: "secret" };
  const after = { status: "published", email: "new@example.invalid", token: "other", summary: "client supplied" };
  const metadata = sanitizeMetadata("noticias", before, after);
  assert.deepEqual(Object.keys(metadata).sort(), ["changedFields", "fromStatus", "toStatus"]);
  assert.deepEqual(metadata.changedFields, ["status"]);
  const allowed = new Set([
    "changedFields", "fromStatus", "toStatus", "publicationFrom", "publicationTo",
    "roleFrom", "roleTo", "activeFrom", "activeTo", "requestStatusFrom", "requestStatusTo"
  ]);
  const userMetadata = sanitizeMetadata("usuarios", { role: "moderator", ativo: true }, { role: "admin", ativo: false });
  assert.deepEqual(userMetadata, {
    changedFields: ["ativo", "role"], roleFrom: "moderator", roleTo: "admin", activeFrom: true, activeTo: false
  });
  const requestMetadata = sanitizeMetadata("establishment_claims", { status: "pending" }, { status: "approved" });
  assert.deepEqual(requestMetadata, {
    changedFields: ["status"], fromStatus: "pending", toStatus: "approved",
    requestStatusFrom: "pending", requestStatusTo: "approved"
  });
  const publicationMetadata = sanitizeMetadata("gallery_items", { published: false }, { published: true });
  assert.deepEqual(publicationMetadata, {
    changedFields: ["published"], fromStatus: "unpublished", toStatus: "published",
    publicationFrom: false, publicationTo: true
  });
  const unknownStatusMetadata = sanitizeMetadata("eventos_pendentes", { status: "pending" }, { status: "token-like-free-text" });
  assert.deepEqual(unknownStatusMetadata, { changedFields: ["status"], fromStatus: "pending" });
  for (const sample of [metadata, userMetadata, requestMetadata, publicationMetadata, unknownStatusMetadata]) {
    assert.deepEqual(Object.keys(sample).filter((key) => !allowed.has(key)), []);
  }
  const record = buildAuditRecord({ eventId: "evt", authId: "principal", authType: "service_account", actorRoleSnapshot: "admin", collectionId: "noticias", documentId: "doc", before, after, timestamp: "time" });
  assert.equal(record.actorPrincipalId, "principal");
  assert.equal("actorRoleSnapshot" in record, false);
  assert.equal(record.summary, "publish: noticias/doc");
  assert.equal(JSON.stringify(record).includes("example.invalid"), false);
  assert.equal(JSON.stringify(record).includes("secret"), false);
  assert.equal(JSON.stringify(record).includes("client supplied"), false);
});

test("changedFields aplica allowlist positiva a nomes sensíveis e desconhecidos", () => {
  const forbiddenNames = ["credential", "email", "password", "phone", "summary", "token", "unknownClientField"];
  const before = {
    status: "draft", credential: "credential-before", email: "old@example.invalid", password: "password-before",
    phone: "phone-before", summary: "summary-before", token: "token-before", unknownClientField: "unknown-before"
  };
  const after = {
    status: "published", credential: "credential-after", email: "new@example.invalid", password: "password-after",
    phone: "phone-after", summary: "summary-after", token: "token-after", unknownClientField: "unknown-after"
  };

  const metadata = sanitizeMetadata("noticias", before, after);
  assert.deepEqual(metadata.changedFields, ["status"]);
  assert.deepEqual(metadata.changedFields.filter((field) => forbiddenNames.includes(field)), []);
  assert.deepEqual(sanitizeMetadata("noticias", { unknownClientField: "A" }, { unknownClientField: "B" }).changedFields, []);
  assert.deepEqual(sanitizeMetadata("noticias", null, after).changedFields, ["status"]);
  assert.deepEqual(sanitizeMetadata("noticias", before, null).changedFields, ["status"]);

  const allowedMetadata = sanitizeMetadata("establishment_update_requests", {
    status: "pending", publicado: false, published: false, role: "user", ativo: true,
    mediaReview: null, reviewedAt: null, reviewedBy: null
  }, {
    status: "approved", publicado: true, published: true, role: "admin", ativo: false,
    mediaReview: { images: [] }, reviewedAt: "time", reviewedBy: "reviewer"
  });
  assert.deepEqual(allowedMetadata.changedFields, [
    "ativo", "mediaReview", "publicado", "published", "reviewedAt", "reviewedBy", "role", "status"
  ]);

  const invalidRoleMetadata = sanitizeMetadata("usuarios", { role: "user" }, { role: "token-secret-role" });
  assert.deepEqual(invalidRoleMetadata, { changedFields: ["role"], roleFrom: "user" });

  const serialized = JSON.stringify(buildAuditRecord({
    eventId: "privacy", authId: "principal", authType: "service_account", actorRoleSnapshot: null,
    collectionId: "noticias", documentId: "doc", before, after, timestamp: "time"
  }));
  const serializedMetadata = JSON.stringify(metadata);
  for (const forbiddenName of forbiddenNames) {
    assert.equal(serializedMetadata.includes(forbiddenName), false);
  }
  for (const sensitiveValue of [
    "credential-before", "credential-after", "old@example.invalid", "new@example.invalid",
    "password-before", "password-after", "phone-before", "phone-after",
    "summary-before", "summary-after", "token-before", "token-after",
    "unknown-before", "unknown-after", "token-secret-role"
  ]) {
    assert.equal(serialized.includes(sensitiveValue), false);
  }
});

test("contextos Firestore não humanos nunca consultam perfil nem recebem role", async () => {
  assert.equal(HUMAN_FIRESTORE_AUTH_TYPES.size, 0);
  for (const authType of ["service_account", "api_key", "system", "unauthenticated", "unknown"]) {
    let lookupAttempts = 0;
    const actorRoleSnapshot = await resolveActorRoleSnapshot({
      authType,
      actorPrincipalId: "colliding-user-document-id",
      lookupUserProfile: async () => {
        lookupAttempts += 1;
        return { role: "admin", ativo: true };
      }
    });
    assert.equal(lookupAttempts, 0);
    assert.equal(actorRoleSnapshot, null);
    const record = buildAuditRecord({ eventId: authType, authId: "colliding-user-document-id", authType, actorRoleSnapshot: "admin", collectionId: "rotas", documentId: "r", before: null, after: {}, timestamp: "time" });
    assert.equal(record.actorPrincipalId, "colliding-user-document-id");
    assert.equal("actorRoleSnapshot" in record, false);
    assert.equal(record.actorAuthType, authType);
  }
});
