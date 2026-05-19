import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: false,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} saiu com codigo ${code}`));
    });
  });
}

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath), constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

console.log("Preparando atualizacao publica do portal...");
await run(process.execPath, ["scripts/update-site-meta.mjs"]);

const checkTargets = [
  "js/site-meta.js",
  "scripts/update-site-meta.mjs",
  "scripts/prepare-update.mjs",
  "js/nav-shared.js",
  "js/weather.js",
  "translations.js",
  "config.js",
  "sw.js"
];

for (const target of checkTargets) {
  if (await exists(target)) {
    await run(process.execPath, ["--check", target]);
  }
}

console.log("Preparacao concluida.");
console.log("Revise o diff, rode as auditorias completas quando necessario e siga com git add/commit/push.");
