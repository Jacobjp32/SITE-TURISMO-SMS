import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

import {
  analyzeCmsSnapshot,
  buildMigrationManifest,
  canonicalSerialize,
  fixtureExpectedProfile,
  sha256Utf8,
} from "../scripts/rotas-v1.1-production-migration-dry-run.mjs";

const SOURCE_METADATA = Object.freeze({
  contractHead: "a".repeat(40),
  modelSha256: "b".repeat(64),
  canonicalRoutesSourceSha256: "c".repeat(64),
  dryRunToolSha256: "d".repeat(64),
});

function stringValue(value) {
  return { stringValue: value };
}

function cmsDocument(id, routeIds, updateTime = "2026-08-22T20:00:00.000000Z") {
  const routeIdsField = Array.isArray(routeIds)
    ? { arrayValue: { values: routeIds.map(stringValue) } }
    : routeIds;
  return {
    name: `projects/demo/databases/(default)/documents/cms_establishments/${id}`,
    updateTime,
    fields: {
      relationships: {
        mapValue: { fields: { routeIds: routeIdsField } },
      },
    },
  };
}

function rotaDocument(id = "existing-route") {
  return {
    name: `projects/demo/databases/(default)/documents/rotas/${id}`,
    updateTime: "2026-08-22T20:00:00.000000Z",
    fields: {
      id: stringValue(id),
      slug: stringValue(id),
      status: stringValue("draft"),
      displayOrder: { integerValue: "10" },
    },
  };
}

function snapshots(routeIdsByDocument) {
  return {
    rotasSnapshot: { documents: [] },
    cmsSnapshot: {
      documents: routeIdsByDocument.map((routeIds, index) =>
        cmsDocument(`synthetic-${String(index + 1).padStart(2, "0")}`, routeIds)),
    },
  };
}

async function approvedFixture(routeIdsByDocument, options = {}) {
  const fixture = snapshots(routeIdsByDocument);
  const analysis = analyzeCmsSnapshot(fixture.cmsSnapshot);
  return buildMigrationManifest({
    ...fixture,
    baselineFingerprint: options.baselineFingerprint ?? analysis.relationshipFingerprintSha256,
    generatedAt: options.generatedAt,
    sourceMetadata: SOURCE_METADATA,
    expectedProfile: options.expectedProfile ?? fixtureExpectedProfile(fixture.cmsSnapshot),
  });
}

describe("Plano local de migration Rotas V1.1", () => {
  test("empty rotas e fixture CMS geram seis CREATE_ROUTE", async () => {
    const manifest = await approvedFixture([["rota-erva-mate"]]);
    assert.equal(manifest.manifestApproved, true);
    assert.equal(manifest.plan.routeCreates.length, 6);
    assert.ok(manifest.plan.routeCreates.every((item) =>
      item.operation === "CREATE_ROUTE" &&
      item.mustNotExist === true &&
      item.staticDocumentFields.status === "draft"));
  });

  test("alias gera UPDATE_CMS_ROUTE_IDS", async () => {
    const manifest = await approvedFixture([["mate"]]);
    assert.equal(manifest.plan.cmsUpdates.length, 1);
    assert.deepEqual(manifest.plan.cmsUpdates[0].beforeRouteIds, ["mate"]);
    assert.deepEqual(manifest.plan.cmsUpdates[0].afterRouteIds, ["rota-erva-mate"]);
  });

  test("valor canônico não gera update", async () => {
    const manifest = await approvedFixture([["rota-erva-mate"]]);
    assert.equal(manifest.plan.cmsUpdates.length, 0);
  });

  test("unknown value é preservado", async () => {
    const manifest = await approvedFixture([["grupo-desconhecido"]]);
    assert.equal(manifest.summary.unknownValuesPreserved, 1);
    assert.equal(manifest.plan.cmsUpdates.length, 0);
  });

  test("duplicate segue normalizeRouteIds com ordem estável", async () => {
    const manifest = await approvedFixture([["mate", "rota-erva-mate", "mate"]]);
    assert.deepEqual(manifest.plan.cmsUpdates[0].afterRouteIds, ["rota-erva-mate"]);
    assert.equal(manifest.summary.duplicatesToRemove, 2);
  });

  test("malformed bloqueia manifestApproved", async () => {
    const cmsSnapshot = { documents: [cmsDocument("bad", { stringValue: "mate" })] };
    const manifest = await buildMigrationManifest({
      rotasSnapshot: { documents: [] },
      cmsSnapshot,
      baselineFingerprint: "0".repeat(64),
      sourceMetadata: SOURCE_METADATA,
      expectedProfile: {
        rotasDocuments: 0,
        cmsDocuments: 1,
        documentsWithCanonicalRoutes: 0,
        canonicalRelationshipsBefore: 0,
        aliasesNormalized: 0,
        canonicalRelationshipsAfter: 0,
        multiRouteDocuments: 0,
        nonCanonicalGroupingsPreserved: 0,
        duplicatesRemoved: 0,
        unknownValues: 0,
      },
    });
    assert.equal(manifest.manifestApproved, false);
    assert.ok(manifest.failureReasons.includes("malformedRelationshipDocuments"));
  });

  test("baseline fingerprint mismatch bloqueia", async () => {
    const manifest = await approvedFixture([["mate"]], {
      baselineFingerprint: "f".repeat(64),
    });
    assert.equal(manifest.manifestApproved, false);
    assert.ok(manifest.failureReasons.includes("baselineFingerprintMismatch"));
  });

  test("rotas não vazias bloqueiam", async () => {
    const fixture = snapshots([["mate"]]);
    fixture.rotasSnapshot.documents.push(rotaDocument());
    const analysis = analyzeCmsSnapshot(fixture.cmsSnapshot);
    const manifest = await buildMigrationManifest({
      ...fixture,
      baselineFingerprint: analysis.relationshipFingerprintSha256,
      sourceMetadata: SOURCE_METADATA,
      expectedProfile: fixtureExpectedProfile(fixture.cmsSnapshot, 0),
    });
    assert.equal(manifest.manifestApproved, false);
    assert.ok(manifest.failureReasons.includes("rotasDocuments"));
  });

  test("cms updateTime é obrigatório para target", async () => {
    const fixture = snapshots([["mate"]]);
    delete fixture.cmsSnapshot.documents[0].updateTime;
    const analysis = analyzeCmsSnapshot(fixture.cmsSnapshot);
    const manifest = await buildMigrationManifest({
      ...fixture,
      baselineFingerprint: analysis.relationshipFingerprintSha256,
      sourceMetadata: SOURCE_METADATA,
      expectedProfile: fixtureExpectedProfile(fixture.cmsSnapshot),
    });
    assert.equal(manifest.manifestApproved, false);
    assert.ok(manifest.failureReasons.includes("cmsObservedUpdateTimeMissing"));
  });

  test("manifest e plano são determinísticos", async () => {
    const first = await approvedFixture([["mate"], ["rota-das-aguas"]], {
      generatedAt: "2026-08-22T20:00:00.000Z",
    });
    const second = await approvedFixture([["mate"], ["rota-das-aguas"]], {
      generatedAt: "2026-08-22T20:00:00.000Z",
    });
    assert.equal(canonicalSerialize(first), canonicalSerialize(second));
    assert.equal(first.planSha256, second.planSha256);
  });

  test("plan hash é estável com generatedAt diferente", async () => {
    const first = await approvedFixture([["mate"]], {
      generatedAt: "2026-08-22T20:00:00.000Z",
    });
    const second = await approvedFixture([["mate"]], {
      generatedAt: "2026-08-22T21:00:00.000Z",
    });
    assert.notEqual(first.metadata.generatedAt, second.metadata.generatedAt);
    assert.equal(first.planSha256, second.planSha256);
    assert.equal(first.planSha256, sha256Utf8(canonicalSerialize(first.plan)));
  });

  test("segunda passagem é idempotente", async () => {
    const manifest = await approvedFixture([["mate", "rota-erva-mate"], ["unknown"]]);
    assert.equal(manifest.summary.idempotency, true);
    assert.equal(manifest.summary.secondPassAliasesNormalized, 0);
    assert.equal(manifest.summary.secondPassDuplicatesRemoved, 0);
    assert.equal(manifest.summary.secondPassCmsUpdatesRequired, 0);
  });

  test("ferramenta não possui transporte de write", async () => {
    const source = await readFile(
      new URL("../scripts/rotas-v1.1-production-migration-dry-run.mjs", import.meta.url),
      "utf8",
    );
    const forbidden = [
      /\bfetch\s*\(/,
      /firebase-admin/,
      /@google-cloud\/firestore/,
      /\.commit\s*\(/,
      /\.batchWrite\s*\(/,
      /\.createDocument\s*\(/,
      /\.patch\s*\(/,
      /\.delete\s*\(/,
    ];
    assert.deepEqual(forbidden.filter((pattern) => pattern.test(source)), []);
  });

  test("operações e masks seguem o contrato simbólico", async () => {
    const manifest = await approvedFixture([["mate"]]);
    const create = manifest.plan.routeCreates[0];
    const update = manifest.plan.cmsUpdates[0];
    assert.deepEqual(create.auditTemplate, {
      createdAt: "APPLY_TIMESTAMP",
      updatedAt: "APPLY_TIMESTAMP",
      createdBy: "APPLY_ACTOR_UID",
      updatedBy: "APPLY_ACTOR_UID",
    });
    assert.deepEqual(update.futureUpdateMask, [
      "relationships.routeIds", "updatedAt", "updatedBy",
    ]);
    assert.equal(manifest.plan.routeCreatePrecondition, "MUST_NOT_EXIST");
    assert.equal(manifest.plan.cmsUpdatePrecondition, "EXACT_OBSERVED_UPDATE_TIME");
  });
});
