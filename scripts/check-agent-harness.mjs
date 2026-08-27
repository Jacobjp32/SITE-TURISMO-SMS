#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const failures = [];
const passes = [];

function check(condition, message) {
  (condition ? passes : failures).push(message);
}

function git(...args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} falhou: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

if (process.argv.length !== 3 || process.argv[2] !== "--check") {
  console.error("Uso: node scripts/check-agent-harness.mjs --check");
  process.exit(2);
}

const root = resolve(git("rev-parse", "--show-toplevel"));
check(root === resolve(process.cwd()), "execução na raiz do repositório");

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const firebaseJson = JSON.parse(readFileSync(resolve(root, "firebase.json"), "utf8"));
const rulesHarness = packageJson.scripts?.["test:rules"] || "";

check(
  rulesHarness.includes("firebase emulators:exec --only firestore,storage"),
  "test:rules inicia Firestore + Storage Emulator"
);
check(
  rulesHarness.includes("--project demo-turismo-sms-rules-test"),
  "test:rules usa o projeto demo canônico"
);
check(firebaseJson.firestore?.rules === "firestore.rules", "firebase.json aponta para firestore.rules");
check(firebaseJson.storage?.rules === "storage.rules", "firebase.json aponta para storage.rules");

for (const path of [
  "AGENTS.md",
  "docs/agent-runbook/README.md",
  "docs/agent-runbook/firebase-and-emulators.md",
  "docs/agent-runbook/git-integrity.md",
  "docs/agent-runbook/release-and-production.md",
  "docs/agent-runbook/cms-establishments-v2.md"
]) {
  check(readFileSync(resolve(root, path), "utf8").length > 0, `${path} existe e não está vazio`);
}

const protectedPaths = new Set([
  ".claude/settings.local.json",
  "IMAGENS_MES_POLONES_2026_WEB.zip",
  "images/mascotes/mascotes.zip"
]);
const statusPaths = git("status", "--porcelain=v1", "--untracked-files=all")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => line.slice(3));
const protectedPresent = statusPaths.filter((path) => protectedPaths.has(path));

for (const message of passes) console.log(`PASS: ${message}`);
for (const message of failures) console.error(`FAIL: ${message}`);
console.log(`INFO: protected-untracked observados somente por nome: ${protectedPresent.length}`);
console.log("INFO: após versionar, use commit SHA + blob Git + árvore rastreada limpa;");
console.log("INFO: não compare SHA-256 raw de checkout CRLF com blob LF como hard gate.");

process.exit(failures.length === 0 ? 0 : 1);
