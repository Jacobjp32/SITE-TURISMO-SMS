import { strict as assert } from "node:assert";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, test } from "node:test";

import {
  APPROVED_PLAN_SHA256,
  COMMIT_ENDPOINT,
  MigrationExecError,
  buildCommitWrites,
  runMigration,
  submitCommitOnce,
  validateCommitWrites,
} from "../scripts/rotas-v1.1-production-migration-exec.mjs";

const APPROVED_MANIFEST =
  "D:\\PROJETOS CODEX\\_RUN_ARTIFACTS\\SITE-TURISMO-SMS\\ROTAS-V1.1\\20260824T112945Z\\migration-plan.json";

async function manifestFixture() {
  return JSON.parse(await readFile(APPROVED_MANIFEST, "utf8"));
}

async function writesFixture(actor = "approved-test-actor") {
  return buildCommitWrites(await manifestFixture(), actor);
}

function response({ ok = true, count = 8, commitTime = "2026-08-24T12:00:00.000Z" } = {}) {
  return {
    ok,
    async json() {
      return { writeResults: Array.from({ length: count }, () => ({})), commitTime };
    },
  };
}

async function expectCode(promise, code) {
  await assert.rejects(promise, (error) =>
    error instanceof MigrationExecError && error.code === code);
}

describe("Executor one-shot da migration Rotas V1.1", () => {
  test("builder produz exatamente 6 creates e 2 updates nos nomes aprovados", async () => {
    const writes = await writesFixture();
    assert.equal(writes.length, 8);
    assert.equal(writes.filter((item) => item.currentDocument?.exists === false).length, 6);
    assert.equal(writes.filter((item) => item.currentDocument?.updateTime).length, 2);
    assert.deepEqual(writes.map((item) => item.update.name), [
      "projects/turismo-sms/databases/(default)/documents/rotas/caminhos-de-fluviopolis",
      "projects/turismo-sms/databases/(default)/documents/rotas/rota-da-terra",
      "projects/turismo-sms/databases/(default)/documents/rotas/rota-das-aguas",
      "projects/turismo-sms/databases/(default)/documents/rotas/rota-erva-mate",
      "projects/turismo-sms/databases/(default)/documents/rotas/rota-polonesa",
      "projects/turismo-sms/databases/(default)/documents/rotas/sabores-memorias",
      ...writes.slice(6).map((item) => item.update.name),
    ]);
    assert.deepEqual(writes.slice(6).map((item) => item.update.name),
      (await manifestFixture()).plan.cmsUpdates.map((item) =>
        `projects/turismo-sms/databases/(default)/documents/cms_establishments/${item.technicalDocumentId}`));
  });

  test("preconditions, fields, masks e REQUEST_TIME são exatos", async () => {
    const manifest = await manifestFixture();
    const writes = buildCommitWrites(manifest, "approved-test-actor");
    for (const write of writes.slice(0, 6)) {
      assert.deepEqual(write.currentDocument, { exists: false });
      assert.deepEqual(write.updateTransforms, [
        { fieldPath: "createdAt", setToServerValue: "REQUEST_TIME" },
        { fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" },
      ]);
      assert.equal(write.update.fields.createdBy.stringValue, "approved-test-actor");
      assert.equal(write.update.fields.updatedBy.stringValue, "approved-test-actor");
    }
    writes.slice(6).forEach((write, index) => {
      assert.deepEqual(write.currentDocument, {
        updateTime: manifest.plan.cmsUpdates[index].observedUpdateTime,
      });
      assert.deepEqual(write.updateMask.fieldPaths, [
        "relationships.routeIds", "updatedAt", "updatedBy",
      ]);
      assert.deepEqual(Object.keys(write.update.fields).sort(), ["relationships", "updatedBy"]);
      assert.deepEqual(write.updateTransforms, [
        { fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" },
      ]);
    });
    assert.equal(validateCommitWrites(writes), true);
  });

  test("missing actor e confirmação de plano incorreta bloqueiam antes de rede", async () => {
    let calls = 0;
    const fetchImpl = async () => { calls += 1; return response(); };
    await expectCode(runMigration({
      manifestPath: APPROVED_MANIFEST,
      apply: true,
      confirmPlanSha256: APPROVED_PLAN_SHA256,
      actorUid: "",
      token: "test-token",
      fetchImpl,
    }), "APPLY_ACTOR_UID_REQUIRED");
    await expectCode(runMigration({
      manifestPath: APPROVED_MANIFEST,
      apply: true,
      confirmPlanSha256: "0".repeat(64),
      actorUid: "approved-test-actor",
      token: "test-token",
      fetchImpl,
    }), "PLAN_CONFIRMATION_FAILURE");
    assert.equal(calls, 0);
  });

  test("manifest com SHA incorreto bloqueia antes de rede", async (context) => {
    const alteredPath = path.join(tmpdir(), `rotas-manifest-altered-${process.pid}.json`);
    context.after(() => rm(alteredPath, { force: true }));
    await writeFile(alteredPath, `${await readFile(APPROVED_MANIFEST, "utf8")} `, "utf8");
    let calls = 0;
    await expectCode(runMigration({
      manifestPath: alteredPath,
      apply: true,
      confirmPlanSha256: APPROVED_PLAN_SHA256,
      actorUid: "approved-test-actor",
      token: "test-token",
      fetchImpl: async () => { calls += 1; return response(); },
    }), "MANIFEST_INTEGRITY_FAILURE");
    assert.equal(calls, 0);
  });

  test("sem --apply valida contrato sem qualquer rede", async () => {
    let calls = 0;
    const result = await runMigration({
      manifestPath: APPROVED_MANIFEST,
      fetchImpl: async () => { calls += 1; return response(); },
    });
    assert.equal(calls, 0);
    assert.equal(result.commitAttempted, false);
    assert.equal(result.writeCount, 8);
  });

  test("apply faz um único POST no endpoint e exige oito resultados", async () => {
    const writes = await writesFixture();
    const calls = [];
    const result = await submitCommitOnce({
      writes,
      apply: true,
      token: "secret-test-token",
      fetchImpl: async (...args) => { calls.push(args); return response(); },
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], COMMIT_ENDPOINT);
    assert.equal(calls[0][1].method, "POST");
    assert.equal(JSON.parse(calls[0][1].body).writes.length, 8);
    assert.equal(result.writeResultsCount, 8);
    assert.equal(result.commitResponseProven, true);
  });

  test("non-2xx e resposta malformada falham fechados e sem retry", async () => {
    const writes = await writesFixture();
    let non2xxCalls = 0;
    await expectCode(submitCommitOnce({
      writes, apply: true, token: "test-token",
      fetchImpl: async () => { non2xxCalls += 1; return response({ ok: false }); },
    }), "COMMIT_HTTP_FAILURE");
    assert.equal(non2xxCalls, 1);

    for (const malformed of [response({ count: 7 }), response({ commitTime: "invalid" }), {
      ok: true, async json() { throw new Error("invalid json"); },
    }]) {
      let calls = 0;
      await expectCode(submitCommitOnce({
        writes, apply: true, token: "test-token",
        fetchImpl: async () => { calls += 1; return malformed; },
      }), "COMMIT_RESPONSE_MALFORMED");
      assert.equal(calls, 1);
    }
  });

  test("incerteza de rede é indeterminada e nunca reenviada", async () => {
    const writes = await writesFixture();
    let calls = 0;
    await expectCode(submitCommitOnce({
      writes, apply: true, token: "test-token",
      fetchImpl: async () => { calls += 1; throw new Error("network reset"); },
    }), "COMMIT_EFFECT_INDETERMINATE");
    assert.equal(calls, 1);
  });

  test("relatórios e erros sanitizados não expõem actor nem token", async () => {
    const actor = "actor-must-not-appear";
    const token = "token-must-not-appear";
    const report = await runMigration({ manifestPath: APPROVED_MANIFEST });
    assert.equal(JSON.stringify(report).includes(actor), false);
    assert.equal(JSON.stringify(report).includes(token), false);
    try {
      await submitCommitOnce({
        writes: await writesFixture(actor), apply: true, token,
        fetchImpl: async () => { throw new Error(`${actor}:${token}`); },
      });
      assert.fail("erro esperado");
    } catch (error) {
      assert.equal(JSON.stringify({ classification: error.code }).includes(actor), false);
      assert.equal(JSON.stringify({ classification: error.code }).includes(token), false);
    }
  });

  test("source contém um único site de POST e nenhuma alternativa/retry", async () => {
    const source = await readFile(
      new URL("../scripts/rotas-v1.1-production-migration-exec.mjs", import.meta.url),
      "utf8",
    );
    assert.equal((source.match(/await fetchImpl\s*\(/g) ?? []).length, 1);
    assert.equal((source.match(/method:\s*"POST"/g) ?? []).length, 1);
    for (const forbidden of [
      /batchWrite/, /createDocument/, /firebase-admin/, /@google-cloud\/firestore/,
      /method:\s*"PATCH"/, /method:\s*"DELETE"/, /setTimeout/, /\bgcloud\b/,
    ]) assert.equal(forbidden.test(source), false);
  });
});
