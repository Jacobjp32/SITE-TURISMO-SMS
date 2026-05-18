import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const metaPath = path.join(root, "js", "site-meta.js");

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatLocalIso(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offset = `${sign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`;
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
    offset
  ].join("");
}

const source = await fs.readFile(metaPath, "utf8");
const nextUpdatedAt = formatLocalIso(new Date());
const nextSource = source.replace(
  /(updatedAt:\s*")[^"]*(")/,
  `$1${nextUpdatedAt}$2`
);

if (nextSource === source) {
  throw new Error("Campo updatedAt nao encontrado em js/site-meta.js");
}

await fs.writeFile(metaPath, nextSource, "utf8");
console.log(`SITE_META updatedAt atualizado para ${nextUpdatedAt}`);
