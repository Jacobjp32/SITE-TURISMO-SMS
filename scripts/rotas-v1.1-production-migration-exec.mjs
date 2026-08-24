#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import {
  MANIFEST_SCHEMA_VERSION,
  canonicalSerialize,
  sha256Utf8,
} from "./rotas-v1.1-production-migration-dry-run.mjs";

export const PROJECT_ID = "turismo-sms";
export const DATABASE_ID = "(default)";
export const APPROVED_MANIFEST_SHA256 =
  "528e0547b0bcf40da04a50e8bac6c8a317e7cf65df16dbad74299ccbd2176557";
export const APPROVED_PLAN_SHA256 =
  "888ef5ffadcc44d9fc1a3cd7459e39e83cb11bd88f40a4b93ed29298a4722fe5";
export const COMMIT_ENDPOINT =
  "https://firestore.googleapis.com/v1/projects/turismo-sms/databases/(default)/documents:commit";

const ROUTE_IDS = Object.freeze([
  "sabores-memorias",
  "rota-erva-mate",
  "rota-polonesa",
  "rota-das-aguas",
  "caminhos-de-fluviopolis",
  "rota-da-terra",
]);
const ROUTE_ID_SET = new Set(ROUTE_IDS);
const ROUTE_STATIC_FIELDS = Object.freeze([
  "archivedAt", "archivedBy", "category", "color", "cover", "description",
  "displayOrder", "icon", "id", "name", "publishedAt", "publishedBy",
  "slug", "status", "tags",
]);
const ROUTE_ITEM_KEYS = Object.freeze([
  "auditTemplate", "documentId", "mustNotExist", "operation", "staticDocumentFields",
]);
const CMS_ITEM_KEYS = Object.freeze([
  "afterRouteIds", "auditTemplate", "beforeRouteIds", "futurePrecondition",
  "futureUpdateMask", "observedUpdateTime", "operation", "technicalDocumentId",
]);
const CMS_MASK = Object.freeze(["relationships.routeIds", "updatedAt", "updatedBy"]);
const ROUTE_WRITE_FIELDS = Object.freeze([
  ...ROUTE_STATIC_FIELDS, "createdBy", "updatedBy",
]);
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export class MigrationExecError extends Error {
  constructor(code) {
    super(code);
    this.name = "MigrationExecError";
    this.code = code;
  }
}

function fail(code) {
  throw new MigrationExecError(code);
}

function exactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
}

function sameArray(left, right) {
  return Array.isArray(left) && JSON.stringify(left) === JSON.stringify(right);
}

function validActorUid(actorUid) {
  return typeof actorUid === "string" && actorUid.length > 0 && actorUid.length <= 128 &&
    actorUid.trim() === actorUid && !/[\u0000-\u001f\u007f]/.test(actorUid);
}

function validateRoutePlanItem(item) {
  if (!exactKeys(item, ROUTE_ITEM_KEYS)) fail("MANIFEST_CONTRACT_FAILURE");
  if (item.operation !== "CREATE_ROUTE" || item.mustNotExist !== true ||
      !ROUTE_ID_SET.has(item.documentId)) fail("MANIFEST_CONTRACT_FAILURE");
  if (!exactKeys(item.staticDocumentFields, ROUTE_STATIC_FIELDS)) {
    fail("MANIFEST_CONTRACT_FAILURE");
  }
  const fields = item.staticDocumentFields;
  if (fields.id !== item.documentId || fields.slug !== item.documentId ||
      fields.status !== "draft" || fields.publishedAt !== null ||
      fields.publishedBy !== "" || fields.archivedAt !== null || fields.archivedBy !== "") {
    fail("MANIFEST_CONTRACT_FAILURE");
  }
  if (!exactKeys(item.auditTemplate, ["createdAt", "createdBy", "updatedAt", "updatedBy"]) ||
      item.auditTemplate.createdAt !== "APPLY_TIMESTAMP" ||
      item.auditTemplate.updatedAt !== "APPLY_TIMESTAMP" ||
      item.auditTemplate.createdBy !== "APPLY_ACTOR_UID" ||
      item.auditTemplate.updatedBy !== "APPLY_ACTOR_UID") {
    fail("MANIFEST_CONTRACT_FAILURE");
  }
}

function validateCmsPlanItem(item) {
  if (!exactKeys(item, CMS_ITEM_KEYS) || item.operation !== "UPDATE_CMS_ROUTE_IDS") {
    fail("MANIFEST_CONTRACT_FAILURE");
  }
  if (typeof item.technicalDocumentId !== "string" || item.technicalDocumentId.length === 0 ||
      item.technicalDocumentId.includes("/") || !Array.isArray(item.beforeRouteIds) ||
      !Array.isArray(item.afterRouteIds) || item.beforeRouteIds.some((value) => typeof value !== "string") ||
      item.afterRouteIds.some((value) => typeof value !== "string") ||
      !RFC3339.test(item.observedUpdateTime) || !sameArray(item.futureUpdateMask, CMS_MASK) ||
      !exactKeys(item.futurePrecondition, ["currentDocument.updateTime"]) ||
      item.futurePrecondition["currentDocument.updateTime"] !== item.observedUpdateTime ||
      !exactKeys(item.auditTemplate, ["updatedAt", "updatedBy"]) ||
      item.auditTemplate.updatedAt !== "APPLY_TIMESTAMP" ||
      item.auditTemplate.updatedBy !== "APPLY_ACTOR_UID") {
    fail("MANIFEST_CONTRACT_FAILURE");
  }
}

export function validateApprovedManifest(manifest, manifestFileSha256) {
  if (manifestFileSha256 !== APPROVED_MANIFEST_SHA256 || manifestFileSha256.length !== 64) {
    fail("MANIFEST_INTEGRITY_FAILURE");
  }
  if (!manifest || manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION ||
      manifest.manifestApproved !== true || !Array.isArray(manifest.failureReasons) ||
      manifest.failureReasons.length !== 0 || manifest.planSha256 !== APPROVED_PLAN_SHA256 ||
      sha256Utf8(canonicalSerialize(manifest.plan)) !== APPROVED_PLAN_SHA256 ||
      manifest.baseline?.matched !== true || manifest.summary?.remoteRotasDocuments !== 0 ||
      manifest.summary?.remoteCmsDocuments !== 67 || manifest.summary?.plannedRouteCreates !== 6 ||
      manifest.summary?.plannedCmsDocumentUpdates !== 2 || manifest.summary?.plannedTotalWrites !== 8 ||
      manifest.summary?.aliasesToNormalize !== 2 || manifest.summary?.unknownValuesPreserved !== 11 ||
      manifest.summary?.malformedRelationshipDocuments !== 0 || manifest.summary?.seedValidation !== true ||
      manifest.summary?.idempotency !== true || manifest.plan?.routeCreatePrecondition !== "MUST_NOT_EXIST" ||
      manifest.plan?.cmsUpdatePrecondition !== "EXACT_OBSERVED_UPDATE_TIME" ||
      !Array.isArray(manifest.plan?.routeCreates) || manifest.plan.routeCreates.length !== 6 ||
      !Array.isArray(manifest.plan?.cmsUpdates) || manifest.plan.cmsUpdates.length !== 2) {
    fail("MANIFEST_INTEGRITY_FAILURE");
  }
  manifest.plan.routeCreates.forEach(validateRoutePlanItem);
  manifest.plan.cmsUpdates.forEach(validateCmsPlanItem);
  const routeIds = manifest.plan.routeCreates.map((item) => item.documentId);
  if (new Set(routeIds).size !== 6 || ROUTE_IDS.some((id) => !routeIds.includes(id))) {
    fail("MANIFEST_CONTRACT_FAILURE");
  }
  if (new Set(manifest.plan.cmsUpdates.map((item) => item.technicalDocumentId)).size !== 2) {
    fail("MANIFEST_CONTRACT_FAILURE");
  }
  return manifest;
}

export async function loadApprovedManifest(manifestPath) {
  let bytes;
  try {
    bytes = await readFile(manifestPath);
  } catch {
    fail("MANIFEST_READ_FAILURE");
  }
  const fileSha256 = createHash("sha256").update(bytes).digest("hex");
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString("utf8"));
  } catch {
    fail("MANIFEST_PARSE_FAILURE");
  }
  return validateApprovedManifest(manifest, fileSha256);
}

export function toFirestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return { integerValue: String(value) };
  }
  if (typeof value === "number" && Number.isFinite(value)) return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (value && typeof value === "object") {
    return { mapValue: { fields: Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, toFirestoreValue(child)]),
    ) } };
  }
  fail("MANIFEST_CONTRACT_FAILURE");
}

function firestoreFields(value) {
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, toFirestoreValue(child)]));
}

export function buildCommitWrites(manifest, actorUid) {
  if (!validActorUid(actorUid)) fail("APPLY_ACTOR_UID_REQUIRED");
  manifest.plan.routeCreates.forEach(validateRoutePlanItem);
  manifest.plan.cmsUpdates.forEach(validateCmsPlanItem);

  const routeWrites = manifest.plan.routeCreates.map((item) => ({
    update: {
      name: `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/rotas/${item.documentId}`,
      fields: firestoreFields({
        ...item.staticDocumentFields,
        createdBy: actorUid,
        updatedBy: actorUid,
      }),
    },
    currentDocument: { exists: false },
    updateTransforms: [
      { fieldPath: "createdAt", setToServerValue: "REQUEST_TIME" },
      { fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" },
    ],
  }));
  const cmsWrites = manifest.plan.cmsUpdates.map((item) => ({
    update: {
      name: `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/cms_establishments/${item.technicalDocumentId}`,
      fields: firestoreFields({
        relationships: { routeIds: item.afterRouteIds },
        updatedBy: actorUid,
      }),
    },
    updateMask: { fieldPaths: [...CMS_MASK] },
    currentDocument: { updateTime: item.observedUpdateTime },
    updateTransforms: [{ fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" }],
  }));
  const writes = [...routeWrites, ...cmsWrites];
  validateCommitWrites(writes);
  return writes;
}

export function validateCommitWrites(writes) {
  if (!Array.isArray(writes) || writes.length !== 8) fail("WRITE_CONTRACT_FAILURE");
  const expectedRouteNames = new Set(ROUTE_IDS.map((id) =>
    `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/rotas/${id}`));
  const routeWrites = writes.filter((write) => expectedRouteNames.has(write?.update?.name));
  const cmsPrefix = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/cms_establishments/`;
  const cmsWrites = writes.filter((write) => write?.update?.name?.startsWith(cmsPrefix));
  if (routeWrites.length !== 6 || cmsWrites.length !== 2 ||
      new Set(routeWrites.map((write) => write.update.name)).size !== 6 ||
      new Set(cmsWrites.map((write) => write.update.name)).size !== 2) {
    fail("WRITE_CONTRACT_FAILURE");
  }
  for (const write of routeWrites) {
    if (!exactKeys(write, ["currentDocument", "update", "updateTransforms"]) ||
        !exactKeys(write.update, ["fields", "name"]) ||
        !exactKeys(write.update.fields, ROUTE_WRITE_FIELDS) ||
        !exactKeys(write.currentDocument, ["exists"]) || write.currentDocument.exists !== false ||
        !sameArray(write.updateTransforms, [
          { fieldPath: "createdAt", setToServerValue: "REQUEST_TIME" },
          { fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" },
        ])) fail("WRITE_CONTRACT_FAILURE");
  }
  for (const write of cmsWrites) {
    if (!exactKeys(write, ["currentDocument", "update", "updateMask", "updateTransforms"]) ||
        !exactKeys(write.update, ["fields", "name"]) ||
        !exactKeys(write.currentDocument, ["updateTime"]) ||
        !RFC3339.test(write.currentDocument.updateTime) ||
        !sameArray(write.updateMask?.fieldPaths, CMS_MASK) ||
        !sameArray(write.updateTransforms, [
          { fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" },
        ]) || !exactKeys(write.update?.fields, ["relationships", "updatedBy"]) ||
        !exactKeys(write.update.fields.relationships, ["mapValue"]) ||
        !exactKeys(write.update.fields.relationships.mapValue, ["fields"]) ||
        !exactKeys(write.update.fields.relationships.mapValue.fields, ["routeIds"]) ||
        !exactKeys(write.update.fields.relationships.mapValue.fields.routeIds, ["arrayValue"]) ||
        !exactKeys(write.update.fields.updatedBy, ["stringValue"])) {
      fail("WRITE_CONTRACT_FAILURE");
    }
  }
  return true;
}

export async function submitCommitOnce({ writes, apply, token, fetchImpl = globalThis.fetch }) {
  validateCommitWrites(writes);
  if (apply !== true) {
    return { commitAttempted: false, commitResponseProven: false, writeResultsCount: 0 };
  }
  if (typeof token !== "string" || token.length === 0) fail("FIRESTORE_REST_TOKEN_REQUIRED");
  let response;
  try {
    response = await fetchImpl(COMMIT_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ writes }),
    });
  } catch {
    fail("COMMIT_EFFECT_INDETERMINATE");
  }
  if (!response || typeof response.ok !== "boolean") fail("COMMIT_EFFECT_INDETERMINATE");
  if (!response.ok) fail("COMMIT_HTTP_FAILURE");
  let result;
  try {
    result = await response.json();
  } catch {
    fail("COMMIT_RESPONSE_MALFORMED");
  }
  if (!Array.isArray(result?.writeResults) || result.writeResults.length !== 8 ||
      typeof result.commitTime !== "string" || !RFC3339.test(result.commitTime) ||
      !Number.isFinite(Date.parse(result.commitTime))) {
    fail("COMMIT_RESPONSE_MALFORMED");
  }
  return {
    commitAttempted: true,
    commitResponseProven: true,
    writeResultsCount: 8,
    commitTime: result.commitTime,
  };
}

export async function runMigration({
  manifestPath,
  apply = false,
  confirmPlanSha256,
  actorUid = process.env.ROTAS_APPLY_ACTOR_UID,
  token = process.env.FIRESTORE_REST_TOKEN,
  fetchImpl = globalThis.fetch,
}) {
  if (typeof manifestPath !== "string" || manifestPath.length === 0) fail("MANIFEST_PATH_REQUIRED");
  if (apply === true && confirmPlanSha256 !== APPROVED_PLAN_SHA256) fail("PLAN_CONFIRMATION_FAILURE");
  if (apply === true && !validActorUid(actorUid)) fail("APPLY_ACTOR_UID_REQUIRED");
  const manifest = await loadApprovedManifest(manifestPath);
  const writes = buildCommitWrites(manifest, apply ? actorUid : "DRY_RUN_ACTOR");
  const result = await submitCommitOnce({ writes, apply, token, fetchImpl });
  return {
    manifestFileSha256Matched: true,
    planSha256Matched: true,
    writeCount: writes.length,
    routeCreates: 6,
    cmsUpdates: 2,
    ...result,
  };
}

function parseArgs(argv) {
  const parsed = { apply: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") {
      if (parsed.apply) fail("ARGUMENT_FAILURE");
      parsed.apply = true;
    } else if (arg === "--manifest" || arg === "--confirm-plan-sha256") {
      if (Object.hasOwn(parsed, arg)) fail("ARGUMENT_FAILURE");
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) fail("ARGUMENT_FAILURE");
      parsed[arg] = value;
      index += 1;
    } else {
      fail("ARGUMENT_FAILURE");
    }
  }
  if (!parsed["--manifest"]) fail("MANIFEST_PATH_REQUIRED");
  if (parsed.apply && !parsed["--confirm-plan-sha256"]) fail("PLAN_CONFIRMATION_FAILURE");
  return parsed;
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const report = await runMigration({
    manifestPath: args["--manifest"],
    apply: args.apply,
    confirmPlanSha256: args["--confirm-plan-sha256"],
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runCli().catch((error) => {
    const code = error instanceof MigrationExecError ? error.code : "EXECUTOR_INTERNAL_FAILURE";
    process.stderr.write(`${JSON.stringify({ classification: code })}\n`);
    process.exitCode = 1;
  });
}
