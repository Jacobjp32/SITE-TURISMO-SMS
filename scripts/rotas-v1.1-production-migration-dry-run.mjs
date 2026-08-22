#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CANONICAL_ROUTE_IDS,
  PROJECT_ROOT,
  buildRouteSeedDocuments,
  loadCanonicalRouteSource,
  normalizeRouteIds,
  validateRouteSeedDocuments,
} from "./lib/rotas-v1.1-model.mjs";

export const MANIFEST_SCHEMA_VERSION = "rotas-v1.1-migration-plan-1.0";
export const SYMBOLIC_AUDIT = Object.freeze({
  timestamp: "APPLY_TIMESTAMP",
  actorUid: "APPLY_ACTOR_UID",
});

export const PRODUCTION_EXPECTED = Object.freeze({
  rotasDocuments: 0,
  cmsDocuments: 67,
  documentsWithCanonicalRoutes: 51,
  canonicalRelationshipsBefore: 58,
  aliasesNormalized: 2,
  canonicalRelationshipsAfter: 60,
  multiRouteDocuments: 9,
  nonCanonicalGroupingsPreserved: 11,
  duplicatesRemoved: 0,
  unknownValues: 11,
});

const TOOL_PATH = fileURLToPath(import.meta.url);
const SOURCE_FILES = Object.freeze({
  model: path.join(PROJECT_ROOT, "scripts/lib/rotas-v1.1-model.mjs"),
  canonicalRoutes: path.join(PROJECT_ROOT, "js/data/rotas.js"),
  tool: TOOL_PATH,
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return structuredClone(value);
}

function ordinalCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function canonicalSerialize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalSerialize(item)).join(",")}]`;
  }
  const entries = Object.keys(value)
    .sort(ordinalCompare)
    .map((key) => `${JSON.stringify(key)}:${canonicalSerialize(value[key])}`);
  return `{${entries.join(",")}}`;
}

export function sha256Utf8(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function sha256File(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

function snapshotDocuments(snapshot) {
  if (Array.isArray(snapshot)) return snapshot;
  if (snapshot && Array.isArray(snapshot.documents)) return snapshot.documents;
  throw new Error("Snapshot deve conter documents[].");
}

function technicalDocumentId(name) {
  assert(typeof name === "string" && name.length > 0, "Document.name obrigatorio.");
  const segments = name.split("/");
  const technicalId = segments.at(-1);
  assert(technicalId, "Document.name sem technical document ID.");
  return technicalId;
}

function firestoreString(field) {
  assert(
    field && typeof field === "object" && typeof field.stringValue === "string",
    "Firestore stringValue invalido.",
  );
  return field.stringValue;
}

function firestoreInteger(field) {
  assert(field && typeof field === "object", "Firestore integerValue invalido.");
  const value = field.integerValue;
  assert(
    (typeof value === "string" && /^-?\d+$/.test(value)) || Number.isSafeInteger(value),
    "Firestore integerValue invalido.",
  );
  const parsed = Number(value);
  assert(Number.isSafeInteger(parsed), "Firestore integerValue fora do intervalo seguro.");
  return parsed;
}

function cmsRouteIds(document) {
  const relationships = document?.fields?.relationships;
  assert(relationships?.mapValue?.fields, "relationships ausente ou malformado.");
  const fields = relationships.mapValue.fields;
  assert(Object.hasOwn(fields, "routeIds"), "relationships.routeIds ausente.");
  const routeIds = fields.routeIds;
  assert(routeIds && Object.hasOwn(routeIds, "arrayValue"), "routeIds nao e array.");
  const values = routeIds.arrayValue?.values ?? [];
  assert(Array.isArray(values) && values.length <= 50, "routeIds excede shape permitido.");
  return values.map(firestoreString);
}

function parseRotasSnapshot(snapshot) {
  const parsed = [];
  let malformedRouteDocuments = 0;
  for (const document of snapshotDocuments(snapshot)) {
    try {
      const fields = document?.fields;
      assert(fields && typeof fields === "object", "fields de rota ausente.");
      parsed.push({
        technicalDocumentId: technicalDocumentId(document.name),
        updateTime: document.updateTime,
        id: firestoreString(fields.id),
        slug: firestoreString(fields.slug),
        status: firestoreString(fields.status),
        displayOrder: firestoreInteger(fields.displayOrder),
      });
    } catch {
      malformedRouteDocuments += 1;
    }
  }
  return { records: parsed, malformedRouteDocuments, documents: snapshotDocuments(snapshot).length };
}

export function analyzeCmsSnapshot(snapshot) {
  const records = [];
  let malformedRelationshipDocuments = 0;
  for (const document of snapshotDocuments(snapshot)) {
    try {
      records.push({
        technicalDocumentId: technicalDocumentId(document.name),
        observedUpdateTime: document.updateTime,
        routeIds: cmsRouteIds(document),
      });
    } catch {
      malformedRelationshipDocuments += 1;
    }
  }

  const totals = {
    documentsInspected: snapshotDocuments(snapshot).length,
    documentsWithCanonicalRoutes: 0,
    canonicalRelationshipsBefore: 0,
    aliasesNormalized: 0,
    canonicalRelationshipsAfter: 0,
    multiRouteDocuments: 0,
    nonCanonicalGroupingsPreserved: 0,
    duplicatesRemoved: 0,
    unknownValues: 0,
  };

  for (const record of records) {
    const result = normalizeRouteIds(record.routeIds);
    totals.canonicalRelationshipsBefore += result.canonicalBefore;
    totals.aliasesNormalized += result.aliasesNormalized;
    totals.canonicalRelationshipsAfter += result.canonicalAfter;
    totals.nonCanonicalGroupingsPreserved += result.nonCanonicalPreserved;
    totals.duplicatesRemoved += result.duplicatesRemoved;
    totals.unknownValues += result.nonCanonicalPreserved;
    if (result.canonicalAfter > 0) totals.documentsWithCanonicalRoutes += 1;
    if (result.canonicalAfter > 1) totals.multiRouteDocuments += 1;
  }

  let relationshipFingerprintSha256 = null;
  if (malformedRelationshipDocuments === 0) {
    const lines = records
      .map((record) => [
        record.technicalDocumentId,
        [...normalizeRouteIds(record.routeIds).routeIds].sort(ordinalCompare),
      ])
      .sort((left, right) => ordinalCompare(left[0], right[0]))
      .map((record) => JSON.stringify(record));
    relationshipFingerprintSha256 = sha256Utf8(lines.join("\n"));
  }

  return { records, totals, malformedRelationshipDocuments, relationshipFingerprintSha256 };
}

function expectedFromAnalysis(analysis, rotasDocuments = 0) {
  return {
    rotasDocuments,
    cmsDocuments: analysis.totals.documentsInspected,
    documentsWithCanonicalRoutes: analysis.totals.documentsWithCanonicalRoutes,
    canonicalRelationshipsBefore: analysis.totals.canonicalRelationshipsBefore,
    aliasesNormalized: analysis.totals.aliasesNormalized,
    canonicalRelationshipsAfter: analysis.totals.canonicalRelationshipsAfter,
    multiRouteDocuments: analysis.totals.multiRouteDocuments,
    nonCanonicalGroupingsPreserved: analysis.totals.nonCanonicalGroupingsPreserved,
    duplicatesRemoved: analysis.totals.duplicatesRemoved,
    unknownValues: analysis.totals.unknownValues,
  };
}

export function fixtureExpectedProfile(cmsSnapshot, rotasDocuments = 0) {
  return expectedFromAnalysis(analyzeCmsSnapshot(cmsSnapshot), rotasDocuments);
}

function staticSeedFields(seedDocument) {
  const {
    createdAt: _createdAt,
    createdBy: _createdBy,
    updatedAt: _updatedAt,
    updatedBy: _updatedBy,
    ...staticDocumentFields
  } = seedDocument;
  return staticDocumentFields;
}

function buildRouteCreatePlan(seedDocuments) {
  return seedDocuments
    .map((document) => ({
      operation: "CREATE_ROUTE",
      documentId: document.id,
      mustNotExist: true,
      staticDocumentFields: staticSeedFields(document),
      auditTemplate: {
        createdAt: SYMBOLIC_AUDIT.timestamp,
        updatedAt: SYMBOLIC_AUDIT.timestamp,
        createdBy: SYMBOLIC_AUDIT.actorUid,
        updatedBy: SYMBOLIC_AUDIT.actorUid,
      },
    }))
    .sort((left, right) => ordinalCompare(left.documentId, right.documentId));
}

function arraysEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildCmsUpdatePlan(records) {
  return records
    .map((record) => {
      const normalized = normalizeRouteIds(record.routeIds);
      if (arraysEqual(record.routeIds, normalized.routeIds)) return null;
      assert(
        typeof record.observedUpdateTime === "string" && record.observedUpdateTime.length > 0,
        "observedUpdateTime obrigatorio para target CMS.",
      );
      return {
        operation: "UPDATE_CMS_ROUTE_IDS",
        technicalDocumentId: record.technicalDocumentId,
        beforeRouteIds: clone(record.routeIds),
        afterRouteIds: clone(normalized.routeIds),
        observedUpdateTime: record.observedUpdateTime,
        futureUpdateMask: ["relationships.routeIds", "updatedAt", "updatedBy"],
        futurePrecondition: {
          "currentDocument.updateTime": record.observedUpdateTime,
        },
        auditTemplate: {
          updatedAt: SYMBOLIC_AUDIT.timestamp,
          updatedBy: SYMBOLIC_AUDIT.actorUid,
        },
      };
    })
    .filter(Boolean)
    .sort((left, right) => ordinalCompare(left.technicalDocumentId, right.technicalDocumentId));
}

function profileMismatches(rotas, cms, expectedProfile) {
  const actual = {
    rotasDocuments: rotas.documents,
    cmsDocuments: cms.totals.documentsInspected,
    documentsWithCanonicalRoutes: cms.totals.documentsWithCanonicalRoutes,
    canonicalRelationshipsBefore: cms.totals.canonicalRelationshipsBefore,
    aliasesNormalized: cms.totals.aliasesNormalized,
    canonicalRelationshipsAfter: cms.totals.canonicalRelationshipsAfter,
    multiRouteDocuments: cms.totals.multiRouteDocuments,
    nonCanonicalGroupingsPreserved: cms.totals.nonCanonicalGroupingsPreserved,
    duplicatesRemoved: cms.totals.duplicatesRemoved,
    unknownValues: cms.totals.unknownValues,
  };
  return Object.entries(expectedProfile)
    .filter(([key, expected]) => actual[key] !== expected)
    .map(([key]) => key);
}

export async function buildMigrationManifest({
  rotasSnapshot,
  cmsSnapshot,
  baselineFingerprint,
  generatedAt = new Date().toISOString(),
  sourceMetadata,
  expectedProfile = PRODUCTION_EXPECTED,
}) {
  assert(/^[0-9a-f]{64}$/.test(baselineFingerprint), "baseline fingerprint invalido.");
  const rotas = parseRotasSnapshot(rotasSnapshot);
  const cms = analyzeCmsSnapshot(cmsSnapshot);
  const routes = await loadCanonicalRouteSource();
  const symbolicSeed = buildRouteSeedDocuments(routes, {
    actorId: SYMBOLIC_AUDIT.actorUid,
    timestamp: SYMBOLIC_AUDIT.timestamp,
  });
  const seedValidation = validateRouteSeedDocuments(symbolicSeed, routes);

  const failureReasons = [];
  if (rotas.malformedRouteDocuments !== 0) failureReasons.push("malformedRouteDocuments");
  if (cms.malformedRelationshipDocuments !== 0) failureReasons.push("malformedRelationshipDocuments");
  if (cms.relationshipFingerprintSha256 !== baselineFingerprint) failureReasons.push("baselineFingerprintMismatch");
  failureReasons.push(...profileMismatches(rotas, cms, expectedProfile));
  if (!seedValidation.valid) failureReasons.push("seedValidation");

  let routeCreates = [];
  let cmsUpdates = [];
  let plan = null;
  let planSha256 = null;
  let idempotency = false;
  let secondPassAliasesNormalized = null;
  let secondPassDuplicatesRemoved = null;
  let secondPassCmsUpdatesRequired = null;

  if (failureReasons.length === 0) {
    try {
      routeCreates = buildRouteCreatePlan(symbolicSeed);
      cmsUpdates = buildCmsUpdatePlan(cms.records);
      const secondPass = cms.records.map((record) => ({
        ...record,
        routeIds: normalizeRouteIds(record.routeIds).routeIds,
      }));
      const secondResults = secondPass.map((record) => normalizeRouteIds(record.routeIds));
      secondPassAliasesNormalized = secondResults.reduce((sum, item) => sum + item.aliasesNormalized, 0);
      secondPassDuplicatesRemoved = secondResults.reduce((sum, item) => sum + item.duplicatesRemoved, 0);
      secondPassCmsUpdatesRequired = secondPass.filter((record) => {
        const normalized = normalizeRouteIds(record.routeIds).routeIds;
        return !arraysEqual(record.routeIds, normalized);
      }).length;
      idempotency = secondPassAliasesNormalized === 0 &&
        secondPassDuplicatesRemoved === 0 &&
        secondPassCmsUpdatesRequired === 0 &&
        cms.totals.canonicalRelationshipsAfter === expectedProfile.canonicalRelationshipsAfter &&
        routeCreates.length === CANONICAL_ROUTE_IDS.length;
      if (!idempotency) failureReasons.push("idempotency");

      if (failureReasons.length === 0) {
        plan = {
          routeCreatePrecondition: "MUST_NOT_EXIST",
          cmsUpdatePrecondition: "EXACT_OBSERVED_UPDATE_TIME",
          routeCreates,
          cmsUpdates,
        };
        planSha256 = sha256Utf8(canonicalSerialize(plan));
      }
    } catch (error) {
      failureReasons.push(error.message === "observedUpdateTime obrigatorio para target CMS."
        ? "cmsObservedUpdateTimeMissing"
        : "planGenerationFailed");
    }
  }

  const manifestApproved = failureReasons.length === 0 && plan !== null;
  const summary = {
    remoteRotasDocuments: rotas.documents,
    remoteCmsDocuments: cms.totals.documentsInspected,
    plannedRouteCreates: manifestApproved ? routeCreates.length : 0,
    plannedCmsDocumentUpdates: manifestApproved ? cmsUpdates.length : 0,
    plannedRelationshipChanges: manifestApproved
      ? cms.totals.aliasesNormalized + cms.totals.duplicatesRemoved
      : 0,
    aliasesToNormalize: cms.totals.aliasesNormalized,
    duplicatesToRemove: cms.totals.duplicatesRemoved,
    unknownValuesPreserved: cms.totals.unknownValues,
    plannedTotalWrites: manifestApproved ? routeCreates.length + cmsUpdates.length : 0,
    malformedRouteDocuments: rotas.malformedRouteDocuments,
    malformedRelationshipDocuments: cms.malformedRelationshipDocuments,
    seedValidation: seedValidation.valid,
    idempotency,
    secondPassAliasesNormalized,
    secondPassDuplicatesRemoved,
    secondPassCmsUpdatesRequired,
  };

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    metadata: { generatedAt },
    source: clone(sourceMetadata),
    baseline: {
      expectedRelationshipFingerprintSha256: baselineFingerprint,
      currentRelationshipFingerprintSha256: cms.relationshipFingerprintSha256,
      matched: cms.relationshipFingerprintSha256 === baselineFingerprint,
    },
    plan,
    summary,
    planSha256,
    manifestApproved,
    failureReasons: [...new Set(failureReasons)],
  };
}

export async function buildSourceMetadata(rootDir = PROJECT_ROOT) {
  const contractHead = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();
  assert(/^[0-9a-f]{40}$/.test(contractHead), "contractHead invalido.");
  return {
    contractHead,
    modelSha256: await sha256File(SOURCE_FILES.model),
    canonicalRoutesSourceSha256: await sha256File(SOURCE_FILES.canonicalRoutes),
    dryRunToolSha256: await sha256File(SOURCE_FILES.tool),
  };
}

function parseArgs(argv) {
  const allowed = new Set([
    "--rotas-snapshot",
    "--cms-snapshot",
    "--baseline-fingerprint",
    "--output-manifest",
  ]);
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    assert(allowed.has(key) && value, `Argumento invalido: ${key ?? "ausente"}.`);
    assert(!(key in result), `Argumento duplicado: ${key}.`);
    result[key] = value;
  }
  assert(Object.keys(result).length === allowed.size, "Quatro argumentos obrigatorios.");
  return result;
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const [rotasSnapshot, cmsSnapshot, sourceMetadata] = await Promise.all([
    readFile(args["--rotas-snapshot"], "utf8").then(JSON.parse),
    readFile(args["--cms-snapshot"], "utf8").then(JSON.parse),
    buildSourceMetadata(),
  ]);
  const manifest = await buildMigrationManifest({
    rotasSnapshot,
    cmsSnapshot,
    baselineFingerprint: args["--baseline-fingerprint"],
    sourceMetadata,
  });
  await mkdir(path.dirname(path.resolve(args["--output-manifest"])), { recursive: true });
  await writeFile(args["--output-manifest"], `${JSON.stringify(manifest, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  console.log(JSON.stringify({
    ...manifest.summary,
    currentFingerprint: manifest.baseline.currentRelationshipFingerprintSha256,
    baselineFingerprintMatched: manifest.baseline.matched,
    planSha256: manifest.planSha256,
    manifestApproved: manifest.manifestApproved,
    failureReasons: manifest.failureReasons,
  }));
  if (!manifest.manifestApproved) process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(TOOL_PATH)) {
  await runCli();
}
