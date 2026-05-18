import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "docs", "auditoria-output");
const ignoredDirs = new Set([".git", ".codex", "EMPREENDIMENTOS", "node_modules", "dist", "build", ".cache", "auditoria-output"]);
const mediaExts = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp4", ".webm", ".mov", ".heic", ".dng"]);
const textExts = new Set([".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".xml", ".webmanifest"]);

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function sha256(file) {
  const buffer = await fs.readFile(file);
  return createHash("sha256").update(buffer).digest("hex");
}

function readUInt24BE(buffer, offset) {
  return buffer.readUIntBE(offset, 3);
}

function getPngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function getGifDimensions(buffer) {
  if (buffer.length < 10 || !buffer.toString("ascii", 0, 3).startsWith("GIF")) return null;
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function getWebpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X" && buffer.length >= 30) {
    return { width: readUInt24BE(Buffer.from(buffer.subarray(26, 29)).reverse(), 0) + 1, height: readUInt24BE(Buffer.from(buffer.subarray(29, 32)).reverse(), 0) + 1 };
  }
  if (chunk === "VP8 " && buffer.length >= 30) {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L" && buffer.length >= 25) {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) };
  }
  return null;
}

function getJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3 && offset + 8 < buffer.length) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

async function getDimensions(file, ext) {
  if (ext === ".svg") {
    const text = await fs.readFile(file, "utf8");
    const width = text.match(/\bwidth=["']?([\d.]+)/i);
    const height = text.match(/\bheight=["']?([\d.]+)/i);
    if (width && height) return { width: Number(width[1]), height: Number(height[1]) };
    const viewBox = text.match(/\bviewBox=["'][^"']*?\s([\d.]+)\s([\d.]+)["']/i);
    return viewBox ? { width: Number(viewBox[1]), height: Number(viewBox[2]) } : null;
  }
  if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return null;
  const buffer = await fs.readFile(file);
  return getPngDimensions(buffer) || getJpegDimensions(buffer) || getWebpDimensions(buffer) || getGifDimensions(buffer);
}

function normalizeReference(value) {
  let item = String(value || "").trim().replace(/\\/g, "/");
  item = item.replace(/^https?:\/\/[^/]+/i, "");
  item = item.replace(/^\/+/, "");
  item = item.split(/[?#]/)[0];
  try {
    item = decodeURIComponent(item);
  } catch (_) {
    // Keep original when decoding malformed URLs.
  }
  return item;
}

function normalizeName(file) {
  return path.basename(file, path.extname(file))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-\s()[\].]+/g, "")
    .replace(/\d+/g, "#");
}

function groupBy(items, mapper) {
  return items.reduce((groups, item) => {
    const key = mapper(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

async function collectReferences(files) {
  const refs = new Map();
  const missingCandidates = new Map();
  const pattern = /(?:["'(=\s]|url\()\s*(\/?(?:images|videos|assets|uploads)\/[^"')\s,;]+?\.(?:png|jpe?g|webp|gif|svg|mp4|webm|mov|heic|dng))/gi;

  for (const file of files) {
    if (rel(file).startsWith("docs/")) continue;
    if (!textExts.has(path.extname(file).toLowerCase())) continue;
    const text = await fs.readFile(file, "utf8").catch(() => "");
    for (const match of text.matchAll(pattern)) {
      const refPath = normalizeReference(match[1]);
      if (!refPath) continue;
      const list = refs.get(refPath) || [];
      list.push(rel(file));
      refs.set(refPath, [...new Set(list)]);
      missingCandidates.set(refPath, true);
    }
  }
  return { refs, missingCandidates };
}

function mdTable(rows, headers, limit = 80) {
  const safeRows = rows.slice(0, limit);
  if (!safeRows.length) return "_Nenhum item encontrado._\n";
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = safeRows.map((row) => `| ${headers.map((key) => String(row[key] ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ")} |`);
  const extra = rows.length > limit ? `\n\n_Lista truncada em ${limit} de ${rows.length} itens. Consulte o JSON completo._` : "";
  return [head, sep, ...body].join("\n") + extra + "\n";
}

await fs.mkdir(outputDir, { recursive: true });
const files = await walk(root);
const mediaFiles = files.filter((file) => mediaExts.has(path.extname(file).toLowerCase()));
const { refs } = await collectReferences(files);

const assets = [];
for (const file of mediaFiles) {
  const ext = path.extname(file).toLowerCase();
  const stat = await fs.stat(file);
  const relativePath = rel(file);
  assets.push({
    path: relativePath,
    ext,
    bytes: stat.size,
    dimensions: await getDimensions(file, ext),
    sha256: await sha256(file),
    usedBy: refs.get(relativePath) || refs.get(relativePath.replace(/^\.?\//, "")) || [],
  });
}

const assetsByPath = new Map(assets.map((asset) => [asset.path, asset]));
const duplicates = Object.values(groupBy(assets, (asset) => asset.sha256)).filter((group) => group.length > 1);
const missingReferences = [...refs.keys()]
  .filter((reference) => !assetsByPath.has(reference))
  .map((reference) => ({ reference, usedBy: refs.get(reference).join(", ") }));
const orphanLikely = assets.filter((asset) => asset.usedBy.length === 0).sort((a, b) => b.bytes - a.bytes);
const heavy = assets.filter((asset) => (asset.ext === ".mp4" ? asset.bytes > 10 * 1024 * 1024 : asset.bytes > 1024 * 1024)).sort((a, b) => b.bytes - a.bytes);
const similarGroups = Object.values(groupBy(assets, (asset) => normalizeName(asset.path)))
  .filter((group) => group.length > 1)
  .map((group) => group.map((asset) => asset.path));

const canonicalSuggestions = duplicates.map((group) => {
  const sorted = [...group].sort((a, b) => b.usedBy.length - a.usedBy.length || a.bytes - b.bytes || a.path.localeCompare(b.path));
  return {
    canonical: sorted[0].path,
    alternatives: sorted.slice(1).map((asset) => asset.path).join(", "),
    usedBy: sorted.map((asset) => `${asset.path}: ${asset.usedBy.join(", ") || "sem referencia"}`).join(" / "),
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    mediaFiles: assets.length,
    referencedMedia: assets.filter((asset) => asset.usedBy.length > 0).length,
    likelyOrphans: orphanLikely.length,
    duplicateGroups: duplicates.length,
    missingReferences: missingReferences.length,
    heavyMedia: heavy.length,
  },
  assets,
  duplicateGroups: duplicates,
  similarGroups,
  missingReferences,
  orphanLikely,
  heavy,
  canonicalSuggestions,
};

const duplicateRows = duplicates.flatMap((group, index) => group.map((asset) => ({
  grupo: `D${index + 1}`,
  arquivo: asset.path,
  bytes: asset.bytes,
  uso: asset.usedBy.join(", ") || "sem referencia",
})));

const similarRows = similarGroups.map((group, index) => ({
  grupo: `N${index + 1}`,
  arquivos: group.join(", "),
}));

const markdown = `# Saida da auditoria de assets\n\nGerado em ${report.generatedAt}.\n\n## Resumo\n\n- Midias encontradas: ${report.totals.mediaFiles}\n- Midias referenciadas: ${report.totals.referencedMedia}\n- Orfas provaveis: ${report.totals.likelyOrphans}\n- Grupos duplicados por SHA-256: ${report.totals.duplicateGroups}\n- Referencias quebradas: ${report.totals.missingReferences}\n- Midias pesadas: ${report.totals.heavyMedia}\n\n## Imagens duplicadas reais\n\n${mdTable(duplicateRows, ["grupo", "arquivo", "bytes", "uso"], 120)}\n\n## Imagens com nomes parecidos\n\n${mdTable(similarRows, ["grupo", "arquivos"], 120)}\n\n## Referencias sem arquivo\n\n${mdTable(missingReferences.map((item) => ({ referencia: item.reference, usadoEm: item.usedBy })), ["referencia", "usadoEm"], 120)}\n\n## Orfas provaveis\n\n${mdTable(orphanLikely.map((asset) => ({ arquivo: asset.path, bytes: asset.bytes, dimensoes: asset.dimensions ? `${asset.dimensions.width}x${asset.dimensions.height}` : "" })), ["arquivo", "bytes", "dimensoes"], 120)}\n\n## Midias pesadas\n\n${mdTable(heavy.map((asset) => ({ arquivo: asset.path, bytes: asset.bytes, uso: asset.usedBy.join(", ") || "sem referencia" })), ["arquivo", "bytes", "uso"], 120)}\n\n## Sugestao de canonica para duplicatas reais\n\n${mdTable(canonicalSuggestions, ["canonical", "alternatives", "usedBy"], 80)}\n`;

await fs.writeFile(path.join(outputDir, "assets-report.json"), JSON.stringify(report, null, 2), "utf8");
await fs.writeFile(path.join(outputDir, "assets-report.md"), markdown, "utf8");

console.log(`Asset audit: ${assets.length} media, ${duplicates.length} duplicate groups, ${missingReferences.length} missing references.`);
