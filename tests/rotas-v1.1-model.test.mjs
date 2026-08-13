import { strict as assert } from "node:assert";
import { describe, test } from "node:test";

import {
  CANONICAL_ROUTE_IDS,
  ROUTE_ALIAS_MAP,
  approvedAliasKeys,
  buildRouteSeedDocuments,
  buildSanitizedDryRunReport,
  loadCanonicalRouteSource,
  normalizeRelationshipDocuments,
  normalizeRouteIds,
  validRelationshipRouteIdsShape,
  validateRouteSeedDocuments,
} from "../scripts/lib/rotas-v1.1-model.mjs";

const routes = await loadCanonicalRouteSource();
const seed = buildRouteSeedDocuments(routes, {
  actorId: "synthetic-admin",
  timestamp: new Date("2026-08-13T12:00:00.000Z"),
});
const dryRunReport = await buildSanitizedDryRunReport();

describe("Modelo local de Rotas V1.1", () => {
  test("contém exatamente seis IDs canônicos", () => {
    assert.equal(CANONICAL_ROUTE_IDS.length, 6);
    assert.deepEqual(routes.map((route) => route.id), [...CANONICAL_ROUTE_IDS]);
  });

  test("mantém IDs únicos", () => {
    assert.equal(new Set(seed.map((route) => route.id)).size, 6);
  });

  test("mantém slugs únicos", () => {
    assert.equal(new Set(seed.map((route) => route.slug)).size, 6);
  });

  test("usa document id igual a data.id", () => {
    assert.ok(seed.every((route) => route.id === route.slug));
  });

  test("usa draft como status padrão", () => {
    assert.ok(seed.every((route) => route.status === "draft"));
  });

  test("gera displayOrder determinístico", () => {
    assert.deepEqual(seed.map((route) => route.displayOrder), [10, 20, 30, 40, 50, 60]);
  });

  test("preserva descrições editoriais", () => {
    assert.deepEqual(seed.map((route) => route.description), routes.map((route) => route.descricao));
  });

  test("preserva identidade visual", () => {
    assert.deepEqual(
      seed.map(({ color, icon }) => ({ color, icon })),
      routes.map(({ cor: color, icone: icon }) => ({ color, icon })),
    );
  });

  test("normaliza cover sem duplicar media_library", () => {
    assert.ok(seed.every((route, index) =>
      route.cover.mediaId === "" &&
      route.cover.path === "" &&
      route.cover.url === routes[index].imagem &&
      route.cover.alt === routes[index].nome));
  });

  test("preserva tags justificadas pela busca editorial existente", () => {
    assert.deepEqual(seed.map((route) => route.tags), routes.map((route) => route.tags));
  });

  test("alias map contém somente aliases aprovados", () => {
    assert.deepEqual(Object.keys(ROUTE_ALIAS_MAP), approvedAliasKeys());
    assert.deepEqual(Object.keys(ROUTE_ALIAS_MAP), [
      "sabores", "mate", "polonesa", "aguas", "fluviop", "terra",
      "rota-da-erva-mate",
    ]);
  });

  test("agrupamento desconhecido não vira rota", () => {
    const result = normalizeRouteIds(["centro-historico"]);
    assert.deepEqual(result.routeIds, ["centro-historico"]);
    assert.equal(result.canonicalAfter, 0);
    assert.equal(result.nonCanonicalPreserved, 1);
  });

  test("preserva relação N:N", () => {
    const result = normalizeRouteIds(["rota-das-aguas", "fluviop"]);
    assert.deepEqual(result.routeIds, ["rota-das-aguas", "caminhos-de-fluviopolis"]);
    assert.equal(result.canonicalAfter, 2);
  });

  test("remove duplicata de routeId de forma estável", () => {
    const result = normalizeRouteIds(["mate", "rota-erva-mate", "mate"]);
    assert.deepEqual(result.routeIds, ["rota-erva-mate"]);
    assert.equal(result.duplicatesRemoved, 2);
  });

  test("normalização é idempotente", () => {
    const input = [{ relationships: { routeIds: ["mate", "centro"] } }];
    const first = normalizeRelationshipDocuments(input);
    const second = normalizeRelationshipDocuments(first.records);
    assert.deepEqual(second.records, first.records);
    assert.equal(second.totals.aliasesNormalized, 0);
    assert.equal(second.totals.duplicatesRemoved, 0);
  });

  test("não adiciona placeIds, geometry ou ordem de pontos", () => {
    assert.ok(seed.every((route) =>
      !("placeIds" in route) &&
      !("geometry" in route) &&
      !("coordinates" in route) &&
      !("orderedPlaceIds" in route)));
  });

  test("validador aprova o seed canônico", () => {
    assert.deepEqual(validateRouteSeedDocuments(seed, routes), { valid: true, errors: [] });
  });
});

describe("Dry-run sanitizado de relações", () => {
  const report = dryRunReport;

  test("revalida as contagens do discovery", () => {
    assert.equal(report.canonicalRelationshipsBefore, 58);
    assert.equal(report.aliasesNormalized, 2);
    assert.equal(report.canonicalRelationshipsAfter, 60);
    assert.equal(report.documentsWithCanonicalRoutes, 51);
    assert.equal(report.nonCanonicalGroupingsPreserved, 11);
  });

  test("preserva os nove documentos multirrota", () => {
    assert.equal(report.multiRouteDocuments, 9);
  });

  test("segunda passagem não produz mudança", () => {
    assert.equal(report.idempotent, true);
    assert.equal(report.secondPassAliasesNormalized, 0);
    assert.equal(report.secondPassDuplicatesRemoved, 0);
  });

  test("gera seis payloads futuros em draft sem acesso remoto", () => {
    assert.equal(report.seedGeneratorImplemented, true);
    assert.equal(report.seedRouteCount, 6);
    assert.equal(report.seedDefaultStatus, "draft");
    assert.equal(report.seedValid, true);
  });
});

describe("Shape local de cms_establishments.relationships.routeIds[]", () => {
  test("aceita array vazio", () => {
    assert.equal(validRelationshipRouteIdsShape([]), true);
  });

  test("aceita uma rota", () => {
    assert.equal(validRelationshipRouteIdsShape(["synthetic-route-a"]), true);
  });

  test("aceita duas rotas e preserva N:N", () => {
    assert.equal(validRelationshipRouteIdsShape([
      "synthetic-route-a",
      "synthetic-route-b",
    ]), true);
  });

  test("aceita duplicatas no shape; normalizador remove antes da migração", () => {
    assert.equal(validRelationshipRouteIdsShape([
      "synthetic-route-a",
      "synthetic-route-a",
    ]), true);
  });

  test("nega valor não-list", () => {
    assert.equal(validRelationshipRouteIdsShape("synthetic-route"), false);
  });

  test("nega null", () => {
    assert.equal(validRelationshipRouteIdsShape(null), false);
  });

  test("nega campo ausente no schema atual", () => {
    assert.equal(validRelationshipRouteIdsShape(undefined, { present: false }), false);
  });

  test("aceita unknown routeId no shape sem fingir integridade referencial", () => {
    assert.equal(validRelationshipRouteIdsShape(["unknown-synthetic-route"]), true);
  });
});
