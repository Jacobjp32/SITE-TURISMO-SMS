import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(MODULE_DIR, "../..");

export const CANONICAL_ROUTE_IDS = Object.freeze([
  "sabores-memorias",
  "rota-erva-mate",
  "rota-polonesa",
  "rota-das-aguas",
  "caminhos-de-fluviopolis",
  "rota-da-terra",
]);

// Allowlist fechada: seis chaves legadas comprovadas e o unico alias
// nao canonico encontrado no preview local (em duas ocorrencias).
export const ROUTE_ALIAS_MAP = Object.freeze({
  sabores: "sabores-memorias",
  mate: "rota-erva-mate",
  polonesa: "rota-polonesa",
  aguas: "rota-das-aguas",
  fluviop: "caminhos-de-fluviopolis",
  terra: "rota-da-terra",
  "rota-da-erva-mate": "rota-erva-mate",
});

export const ROUTE_STATUS = Object.freeze([
  "draft",
  "published",
  "archived",
]);

export const ROUTE_DOCUMENT_FIELDS = Object.freeze([
  "id",
  "slug",
  "name",
  "category",
  "description",
  "color",
  "icon",
  "status",
  "displayOrder",
  "cover",
  "tags",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy",
  "publishedAt",
  "publishedBy",
  "archivedAt",
  "archivedBy",
]);

const CANONICAL_ROUTE_ID_SET = new Set(CANONICAL_ROUTE_IDS);
const APPROVED_ALIAS_KEYS = Object.keys(ROUTE_ALIAS_MAP);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clone(value) {
  return structuredClone(value);
}

function uniqueStable(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

async function evaluateWindowSource(relativePath, globalName, rootDir) {
  const absolutePath = path.join(rootDir, relativePath);
  const source = await readFile(absolutePath, "utf8");
  const context = { window: {} };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: relativePath, timeout: 1_000 });
  return clone(context.window[globalName]);
}

export async function loadCanonicalRouteSource(rootDir = PROJECT_ROOT) {
  const routes = await evaluateWindowSource(
    "js/data/rotas.js",
    "TURISMO_ROTAS",
    rootDir,
  );
  assert(Array.isArray(routes), "js/data/rotas.js nao exportou TURISMO_ROTAS.");
  assert(
    routes.length === CANONICAL_ROUTE_IDS.length,
    `Fonte canonica deve conter ${CANONICAL_ROUTE_IDS.length} rotas.`,
  );
  assert(
    JSON.stringify(routes.map((route) => route.id)) ===
      JSON.stringify(CANONICAL_ROUTE_IDS),
    "IDs ou ordem da fonte canonica divergiram da allowlist aprovada.",
  );
  return routes;
}

export async function loadRelationshipPreview(rootDir = PROJECT_ROOT) {
  const source = await readFile(
    path.join(rootDir, "docs/cms-establishments-seed-preview.json"),
    "utf8",
  );
  const preview = JSON.parse(source);
  assert(Array.isArray(preview.records), "Preview local nao contem records[].");
  return clone(preview.records);
}

export function buildRouteSeedDocuments(
  routes,
  { actorId, timestamp },
) {
  assert(Array.isArray(routes), "Fonte de rotas deve ser uma lista.");
  assert(typeof actorId === "string" && actorId.length > 0, "actorId obrigatorio.");
  assert(timestamp != null, "timestamp obrigatorio.");

  return routes.map((route, index) => ({
    id: route.id,
    slug: route.id,
    name: route.nome,
    category: route.categoria,
    description: route.descricao,
    color: route.cor,
    icon: route.icone,
    status: "draft",
    displayOrder: (index + 1) * 10,
    cover: {
      mediaId: "",
      url: route.imagem,
      path: "",
      alt: route.nome,
    },
    tags: clone(route.tags || []),
    createdAt: timestamp,
    createdBy: actorId,
    updatedAt: timestamp,
    updatedBy: actorId,
    publishedAt: null,
    publishedBy: "",
    archivedAt: null,
    archivedBy: "",
  }));
}

export function validateRouteSeedDocuments(documents, sourceRoutes) {
  const errors = [];
  const ids = documents.map((document) => document.id);
  const slugs = documents.map((document) => document.slug);
  const expectedFields = [...ROUTE_DOCUMENT_FIELDS].sort();

  if (documents.length !== CANONICAL_ROUTE_IDS.length) {
    errors.push("canonicalRouteCount");
  }
  if (new Set(ids).size !== ids.length) errors.push("uniqueIds");
  if (new Set(slugs).size !== slugs.length) errors.push("uniqueSlugs");

  documents.forEach((document, index) => {
    const source = sourceRoutes[index];
    if (document.id !== CANONICAL_ROUTE_IDS[index]) errors.push(`id:${index}`);
    if (document.id !== document.slug) errors.push(`slug:${index}`);
    if (document.status !== "draft") errors.push(`status:${index}`);
    if (document.displayOrder !== (index + 1) * 10) errors.push(`displayOrder:${index}`);
    if (document.description !== source.descricao) errors.push(`description:${index}`);
    if (document.color !== source.cor || document.icon !== source.icone) {
      errors.push(`visualIdentity:${index}`);
    }
    if (
      document.cover.url !== source.imagem ||
      document.cover.alt !== source.nome
    ) {
      errors.push(`cover:${index}`);
    }
    if (JSON.stringify(document.tags) !== JSON.stringify(source.tags || [])) {
      errors.push(`tags:${index}`);
    }
    if (
      !Array.isArray(document.tags) ||
      document.tags.length > 30 ||
      document.tags.some((tag) => typeof tag !== "string")
    ) {
      errors.push(`tagsShape:${index}`);
    }
    if (JSON.stringify(Object.keys(document).sort()) !== JSON.stringify(expectedFields)) {
      errors.push(`fields:${index}`);
    }
    for (const forbidden of [
      "placeIds",
      "geometry",
      "coordinates",
      "orderedPlaceIds",
    ]) {
      if (forbidden in document) errors.push(`${forbidden}:${index}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function normalizeRouteIds(routeIds) {
  assert(Array.isArray(routeIds), "relationships.routeIds deve ser uma lista.");
  const normalized = [];
  let canonicalBefore = 0;
  let aliasesNormalized = 0;
  let nonCanonicalPreserved = 0;
  let duplicatesRemoved = 0;

  for (const rawValue of routeIds) {
    assert(typeof rawValue === "string", "routeIds local deve conter strings.");
    const mapped = ROUTE_ALIAS_MAP[rawValue] || rawValue;
    if (CANONICAL_ROUTE_ID_SET.has(rawValue)) canonicalBefore += 1;
    else if (Object.hasOwn(ROUTE_ALIAS_MAP, rawValue)) aliasesNormalized += 1;
    else nonCanonicalPreserved += 1;

    if (normalized.includes(mapped)) duplicatesRemoved += 1;
    else normalized.push(mapped);
  }

  return {
    routeIds: normalized,
    canonicalBefore,
    aliasesNormalized,
    canonicalAfter: normalized.filter((value) => CANONICAL_ROUTE_ID_SET.has(value)).length,
    nonCanonicalPreserved,
    duplicatesRemoved,
  };
}

// Espelha a garantia efetivamente possivel no contrato atual das Rules:
// presenca, tipo list e limite. A linguagem de Rules nao itera genericamente
// todos os elementos nem garante existencia referencial em /rotas.
export function validRelationshipRouteIdsShape(value, { present = true } = {}) {
  return present && Array.isArray(value) && value.length <= 50;
}

export function normalizeRelationshipDocuments(records) {
  assert(Array.isArray(records), "records deve ser uma lista.");
  const normalizedRecords = clone(records);
  const totals = {
    documentsInspected: normalizedRecords.length,
    documentsWithCanonicalRoutes: 0,
    canonicalRelationshipsBefore: 0,
    aliasesNormalized: 0,
    canonicalRelationshipsAfter: 0,
    multiRouteDocuments: 0,
    nonCanonicalGroupingsPreserved: 0,
    duplicatesRemoved: 0,
    unknownValues: 0,
  };

  for (const record of normalizedRecords) {
    const routeIds = record?.relationships?.routeIds;
    const result = normalizeRouteIds(routeIds);
    record.relationships.routeIds = result.routeIds;
    totals.canonicalRelationshipsBefore += result.canonicalBefore;
    totals.aliasesNormalized += result.aliasesNormalized;
    totals.canonicalRelationshipsAfter += result.canonicalAfter;
    totals.nonCanonicalGroupingsPreserved += result.nonCanonicalPreserved;
    totals.duplicatesRemoved += result.duplicatesRemoved;
    totals.unknownValues += result.nonCanonicalPreserved;
    if (result.canonicalAfter > 0) totals.documentsWithCanonicalRoutes += 1;
    if (result.canonicalAfter > 1) totals.multiRouteDocuments += 1;
  }

  return { records: normalizedRecords, totals };
}

export async function buildSanitizedDryRunReport(rootDir = PROJECT_ROOT) {
  const [routes, records] = await Promise.all([
    loadCanonicalRouteSource(rootDir),
    loadRelationshipPreview(rootDir),
  ]);
  const seed = buildRouteSeedDocuments(routes, {
    actorId: "LOCAL_DRY_RUN",
    timestamp: new Date(0),
  });
  const seedValidation = validateRouteSeedDocuments(seed, routes);
  const firstPass = normalizeRelationshipDocuments(records);
  const secondPass = normalizeRelationshipDocuments(firstPass.records);
  const idempotent =
    JSON.stringify(secondPass.records) === JSON.stringify(firstPass.records) &&
    secondPass.totals.aliasesNormalized === 0 &&
    secondPass.totals.duplicatesRemoved === 0;

  return {
    canonicalRoutes: [...CANONICAL_ROUTE_IDS],
    canonicalRouteCount: CANONICAL_ROUTE_IDS.length,
    routeAliasMap: { ...ROUTE_ALIAS_MAP },
    ...firstPass.totals,
    idempotent,
    secondPassAliasesNormalized: secondPass.totals.aliasesNormalized,
    secondPassDuplicatesRemoved: secondPass.totals.duplicatesRemoved,
    seedGeneratorImplemented: true,
    seedRouteCount: seed.length,
    seedDefaultStatus: "draft",
    seedValid: seedValidation.valid,
    aliasAllowlistCount: APPROVED_ALIAS_KEYS.length,
  };
}

export function approvedAliasKeys() {
  return [...APPROVED_ALIAS_KEYS];
}

export function uniqueValues(values) {
  return uniqueStable(values);
}
