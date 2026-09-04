"use strict";

const { onDocumentWrittenWithAuthContext } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { AUDITED_COLLECTIONS, auditDocumentId, buildAuditRecord, resolveActorRoleSnapshot } = require("./audit-core");

initializeApp();

function snapshotData(snapshot) {
  return snapshot && snapshot.exists ? snapshot.data() : null;
}

exports.writeAdminAuditLog = onDocumentWrittenWithAuthContext({
  document: "{collectionId}/{documentId}",
  region: "southamerica-east1",
  retry: true
}, async (event) => {
  const { collectionId, documentId } = event.params;
  if (!AUDITED_COLLECTIONS.has(collectionId)) return;

  const db = getFirestore();
  const eventId = String(event.id || "");
  const actorPrincipalId = event.authId ? String(event.authId) : undefined;
  const actorRoleSnapshot = await resolveActorRoleSnapshot({
    authType: event.authType,
    actorPrincipalId,
    lookupUserProfile: async (principalId) => {
      const snapshot = await db.collection("usuarios").doc(principalId).get();
      return snapshot.exists ? snapshot.data() : null;
    }
  });
  const record = buildAuditRecord({
    eventId,
    authId: actorPrincipalId,
    authType: event.authType,
    actorRoleSnapshot,
    collectionId,
    documentId,
    before: snapshotData(event.data && event.data.before),
    after: snapshotData(event.data && event.data.after),
    timestamp: Timestamp.fromDate(new Date(event.time))
  });

  try {
    await db.collection("audit_logs").doc(auditDocumentId(eventId)).create(record);
  } catch (error) {
    if (error && (error.code === 6 || error.code === "already-exists")) return;
    throw error;
  }
});
