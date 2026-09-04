"use strict";

const crypto = require("node:crypto");

const AUDITED_COLLECTIONS = new Set([
  "usuarios", "eventos_pendentes", "estabelecimentos_pendentes",
  "eventos_aprovados", "estabelecimentos_aprovados", "establishment_claims",
  "establishment_managers", "establishment_update_requests", "cms_establishments",
  "rotas", "noticias", "media_library", "banners", "gallery_items", "site_config"
]);

const AUDITABLE_CHANGED_FIELDS = new Set([
  "status", "publicado", "published", "role", "ativo",
  "mediaReview", "reviewedAt", "reviewedBy"
]);
const AUDITABLE_ROLES = new Set(["admin", "moderator", "user"]);

function auditDocumentId(eventId) {
  const value = String(eventId || "");
  const safe = value.length > 0 && value !== "." && value !== ".." && !value.includes("/") && Buffer.byteLength(value, "utf8") <= 1500;
  return safe ? value : crypto.createHash("sha256").update(value).digest("hex");
}

function changedFields(before, after) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  return [...keys]
    .filter((key) => AUDITABLE_CHANGED_FIELDS.has(key))
    .filter((key) => JSON.stringify(before && before[key]) !== JSON.stringify(after && after[key]))
    .sort();
}

function statusOf(data) {
  if (!data) return undefined;
  if (typeof data.status === "string") {
    const status = data.status.toLowerCase();
    const aliases = {
      active: "active",
      aprovado: "approved",
      approved: "approved",
      publicado: "published",
      published: "published",
      pendente: "pending",
      pending: "pending",
      rascunho: "draft",
      draft: "draft",
      despublicado: "unpublished",
      unpublished: "unpublished",
      arquivado: "archived",
      archived: "archived",
      removido: "removed",
      removed: "removed",
      rejeitado: "rejected",
      rejected: "rejected",
      request_changes: "changes_requested",
      alteracoes_solicitadas: "changes_requested",
      changes_requested: "changes_requested"
    };
    if (aliases[status] !== undefined) return aliases[status];
  }
  if (typeof data.publicado === "boolean") return data.publicado ? "published" : "unpublished";
  if (typeof data.published === "boolean") return data.published ? "published" : "unpublished";
  return undefined;
}

function deriveAction(collectionId, before, after) {
  if (before && !after) return "delete";
  const fields = changedFields(before, after);
  const previousStatus = statusOf(before);
  const nextStatus = statusOf(after);
  const statusChanged = previousStatus !== nextStatus;
  const previousPublication = publicationOf(before);
  const nextPublication = publicationOf(after);
  const hasPublicationFlag = previousPublication !== undefined || nextPublication !== undefined;

  if (before && after) {
    if (collectionId === "usuarios" && fields.includes("role")) return "change_user_role";
    if (collectionId === "usuarios" && fields.includes("ativo")) return "change_user_status";
    if (collectionId === "establishment_update_requests" && fields.includes("mediaReview")) return "media_review";
    if (collectionId === "establishment_claims" && statusChanged && nextStatus === "approved") return "approve_claim";
    if (collectionId === "establishment_update_requests" && statusChanged && nextStatus === "approved") return "approve_update_request";
    if (["eventos_pendentes", "estabelecimentos_pendentes", "eventos_aprovados", "estabelecimentos_aprovados"].includes(collectionId) && statusChanged && nextStatus === "approved") return "approve_event_or_establishment";
    if (statusChanged && nextStatus === "changes_requested") return "request_changes";
    if (statusChanged && nextStatus === "rejected") return "reject";
    if (statusChanged && nextStatus === "archived") return "archive";
    if (statusChanged && previousStatus === "archived" && nextStatus === "draft") return "restore";
    if (previousPublication === true && nextPublication === false) return "unpublish";
    if (previousPublication !== true && nextPublication === true) return "publish";
    if (hasPublicationFlag) return "update";
    if (statusChanged && previousStatus === "published" && nextStatus !== "published") return "unpublish";
    if (statusChanged && previousStatus !== "published" && nextStatus === "published") return "publish";
    return "update";
  }

  if (!before && after) {
    if (["eventos_aprovados", "estabelecimentos_aprovados"].includes(collectionId) && nextStatus === "approved") return "approve_event_or_establishment";
    if (nextPublication === true || (!hasPublicationFlag && nextStatus === "published")) return "publish";
    return "create";
  }

  return "update";
}

function publicationOf(data) {
  if (!data) return undefined;
  if (typeof data.publicado === "boolean") return data.publicado;
  if (typeof data.published === "boolean") return data.published;
  return undefined;
}

function sanitizeMetadata(collectionId, before, after) {
  const fields = changedFields(before, after);
  const metadata = { changedFields: fields };
  const fromStatus = statusOf(before);
  const toStatus = statusOf(after);
  if (fromStatus !== undefined) metadata.fromStatus = fromStatus;
  if (toStatus !== undefined) metadata.toStatus = toStatus;

  const publicationFrom = publicationOf(before);
  const publicationTo = publicationOf(after);
  if (publicationFrom !== undefined) metadata.publicationFrom = publicationFrom;
  if (publicationTo !== undefined) metadata.publicationTo = publicationTo;

  if (collectionId === "usuarios" && fields.includes("role")) {
    if (before && AUDITABLE_ROLES.has(before.role)) metadata.roleFrom = before.role;
    if (after && AUDITABLE_ROLES.has(after.role)) metadata.roleTo = after.role;
  }
  if (collectionId === "usuarios" && fields.includes("ativo")) {
    if (before && typeof before.ativo === "boolean") metadata.activeFrom = before.ativo;
    if (after && typeof after.ativo === "boolean") metadata.activeTo = after.ativo;
  }
  if (["establishment_claims", "establishment_update_requests"].includes(collectionId) && fields.includes("status")) {
    if (fromStatus !== undefined) metadata.requestStatusFrom = fromStatus;
    if (toStatus !== undefined) metadata.requestStatusTo = toStatus;
  }
  return metadata;
}

const HUMAN_FIRESTORE_AUTH_TYPES = new Set();

async function resolveActorRoleSnapshot({ authType, actorPrincipalId, lookupUserProfile }) {
  if (!actorPrincipalId || !HUMAN_FIRESTORE_AUTH_TYPES.has(String(authType || "unknown"))) return null;
  const profile = await lookupUserProfile(String(actorPrincipalId));
  return profile && profile.ativo === true && ["moderator", "admin"].includes(profile.role) ? profile.role : null;
}

function summaryFor(action, entityType, entityId) {
  return `${action}: ${entityType}/${entityId}`;
}

function buildAuditRecord({ eventId, authId, authType, actorRoleSnapshot, collectionId, documentId, before, after, timestamp }) {
  const action = deriveAction(collectionId, before, after);
  const record = {
    eventId: String(eventId),
    actorAuthType: String(authType || "unknown"),
    action,
    entityType: collectionId,
    entityId: documentId,
    timestamp,
    summary: summaryFor(action, collectionId, documentId),
    metadata: sanitizeMetadata(collectionId, before, after),
    source: "firestore-auth-context-v2"
  };
  if (authId) record.actorPrincipalId = String(authId);
  if (HUMAN_FIRESTORE_AUTH_TYPES.has(record.actorAuthType) && ["moderator", "admin"].includes(actorRoleSnapshot)) {
    record.actorRoleSnapshot = actorRoleSnapshot;
  }
  return record;
}

module.exports = {
  AUDITED_COLLECTIONS,
  HUMAN_FIRESTORE_AUTH_TYPES,
  auditDocumentId,
  changedFields,
  deriveAction,
  sanitizeMetadata,
  resolveActorRoleSnapshot,
  summaryFor,
  buildAuditRecord
};
