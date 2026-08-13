#!/usr/bin/env node
import { buildSanitizedDryRunReport } from "./lib/rotas-v1.1-model.mjs";

const report = await buildSanitizedDryRunReport();
const expected = {
  canonicalRouteCount: 6,
  canonicalRelationshipsAfter: 60,
  documentsWithCanonicalRoutes: 51,
  aliasesNormalized: 2,
  nonCanonicalGroupingsPreserved: 11,
  multiRouteDocuments: 9,
  idempotent: true,
  seedRouteCount: 6,
  seedValid: true,
};

const mismatches = Object.entries(expected)
  .filter(([key, value]) => report[key] !== value)
  .map(([key, value]) => ({ key, expected: value, actual: report[key] }));

console.log(JSON.stringify({
  block: "POST-V1-ROTAS-V1.1-DATA-MODEL-RULES-AND-EMULATOR",
  mode: "LOCAL_DRY_RUN",
  productionAccess: false,
  ...report,
  pass: mismatches.length === 0,
  mismatches,
}, null, 2));

if (mismatches.length > 0) process.exitCode = 1;
