import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "docs", "auditoria-output");
const indexPath = path.join(root, "index.html");
const swPath = path.join(root, "sw.js");
const textExts = new Set([".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".xml", ".webmanifest"]);
const mediaExts = new Set([".mp4", ".webm", ".mov", ".m4v", ".jpg", ".jpeg", ".png", ".webp"]);
const ignoredDirs = new Set([".git", ".codex", "EMPREENDIMENTOS", "node_modules", "dist", "build", ".cache", "auditoria-output"]);

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
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

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function parseAttributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/\s([:\w-]+)(?:=(["'])(.*?)\2|=([^\s>]+))?/g)) {
    const name = match[1].toLowerCase();
    attrs[name] = match[3] ?? match[4] ?? true;
  }
  return attrs;
}

function mdTable(rows, headers) {
  if (!rows.length) return "_Nenhum item encontrado._\n";
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${headers.map((key) => String(row[key] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
  return [head, sep, ...body].join("\n") + "\n";
}

async function collectReferences(files) {
  const refs = new Map();
  const pattern = /(?:["'(=\s]|url\()\s*(\/?(?:images|videos|assets|uploads)\/[^"')\s,;]+?\.(?:png|jpe?g|webp|gif|svg|mp4|webm|mov|m4v))/gi;
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
    }
  }
  return refs;
}

async function getAsset(refPath, refs) {
  const full = path.join(root, refPath);
  const stat = await fs.stat(full).catch(() => null);
  if (!stat) return null;
  return {
    path: refPath,
    ext: path.extname(refPath).toLowerCase(),
    bytes: stat.size,
    size: formatMB(stat.size),
    usedBy: refs.get(refPath) || [],
  };
}

const html = await fs.readFile(indexPath, "utf8");
const sw = await fs.readFile(swPath, "utf8").catch(() => "");
const heroMatch = html.match(/<section[^>]+id=["']map-hero["'][\s\S]*?<\/section>/i);
const heroHtml = heroMatch ? heroMatch[0] : "";
const videoTagMatch = heroHtml.match(/<video\b[^>]*>/i);
const videoTag = videoTagMatch ? videoTagMatch[0] : "";
const videoAttrs = parseAttributes(videoTag);
const sources = [...heroHtml.matchAll(/<source[^>]+src=["']([^"']+)["'][^>]*>/gi)].map((match) => normalizeReference(match[1]));
const poster = normalizeReference(videoAttrs.poster || "");
const files = await walk(root);
const refs = await collectReferences(files);

const heroVideos = (await Promise.all(sources.map((source) => getAsset(source, refs)))).filter(Boolean);
const originalHeroVideoPath = "videos/ROTA_DO_TURISMO.mp4";
const originalHeroVideo = await getAsset(originalHeroVideoPath, refs);
const posterAsset = poster ? await getAsset(poster, refs) : null;
const allMedia = (await Promise.all(files
  .filter((file) => mediaExts.has(path.extname(file).toLowerCase()))
  .map((file) => getAsset(rel(file), refs)))).filter(Boolean);

const projectVideos = allMedia
  .filter((asset) => [".mp4", ".webm", ".mov", ".m4v"].includes(asset.ext))
  .sort((a, b) => b.bytes - a.bytes);

const homeHeavyImages = allMedia
  .filter((asset) => [".jpg", ".jpeg", ".png", ".webp"].includes(asset.ext))
  .filter((asset) => asset.usedBy.includes("index.html"))
  .filter((asset) => asset.bytes > 1024 * 1024 || asset.path === poster)
  .sort((a, b) => b.bytes - a.bytes);

const swPrecacheItems = [...sw.matchAll(/['"]([^'"]+\.(?:png|jpe?g|webp|mp4|webm|mov|m4v|js|css|html))['"]/gi)].map((match) => normalizeReference(match[1]));
const neverCacheExtMatch = sw.match(/const\s+NEVER_CACHE_EXT\s*=\s*\[([\s\S]*?)\]/);
const neverCacheExt = neverCacheExtMatch ? [...neverCacheExtMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]) : [];

const report = {
  generatedAt: new Date().toISOString(),
  heroFound: Boolean(heroMatch),
  videoFound: Boolean(videoTagMatch),
  attrs: videoAttrs,
  sources,
  poster,
  originalHeroVideo: originalHeroVideo ? {
    ...originalHeroVideo,
    preserved: true,
    referencedByHero: sources.includes(originalHeroVideoPath),
  } : {
    path: originalHeroVideoPath,
    preserved: false,
    referencedByHero: false,
  },
  heroVideos: heroVideos.map((asset) => ({
    ...asset,
    inServiceWorkerPrecache: swPrecacheItems.includes(asset.path),
    neverCacheByExtension: neverCacheExt.includes(asset.ext),
  })),
  posterAsset: posterAsset ? {
    ...posterAsset,
    inServiceWorkerPrecache: swPrecacheItems.includes(posterAsset.path),
  } : null,
  projectVideos,
  homeHeavyImages,
  sw: {
    cacheName: sw.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/)?.[1] || null,
    neverCacheExt,
    videoExtensionsCovered: [".mp4", ".webm", ".mov", ".m4v"].every((ext) => neverCacheExt.includes(ext)),
  },
  recommendations: [
    "Manter o video fora do precache e impedir cache dinamico por extensao.",
    "Produzir MP4 H.264 menor para hero, com alvo entre 3 MB e 8 MB.",
    "Gerar WebM opcional para navegadores compativeis.",
    "Manter poster otimizado abaixo de 300 KB e com dimensoes proximas de 1600x900 ou 1920x1080.",
    "Preferir duracao de 8 a 15 segundos, sem audio relevante, em loop suave.",
  ],
};

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "hero-video-report.json"), JSON.stringify(report, null, 2), "utf8");

const markdown = `# Saida da auditoria da hero com video

Gerado em ${report.generatedAt}.

## Hero

- Hero encontrada: ${report.heroFound ? "sim" : "nao"}
- Video encontrado: ${report.videoFound ? "sim" : "nao"}
- Poster: ${posterAsset ? `${posterAsset.path} (${posterAsset.size})` : "nao encontrado"}
- Cache SW atual: ${report.sw.cacheName || "nao detectado"}
- Original preservado: ${report.originalHeroVideo.preserved ? "sim" : "nao"}
- Original referenciado pela hero: ${report.originalHeroVideo.referencedByHero ? "sim" : "nao"}
- Extensoes de video em NEVER_CACHE_EXT: ${report.sw.videoExtensionsCovered ? "sim" : "nao"}

## Atributos do video

${mdTable(Object.entries(videoAttrs).map(([attr, value]) => ({ attr, valor: value === true ? "presente" : value })), ["attr", "valor"])}

## Video da hero

${mdTable(report.heroVideos.map((asset) => ({
  tipo: asset.ext === ".webm" ? "WebM" : "MP4",
  arquivo: asset.path,
  tamanho: asset.size,
  uso: asset.usedBy.join(", ") || "sem referencia",
  precache: asset.inServiceWorkerPrecache ? "sim" : "nao",
  neverCacheExt: asset.neverCacheByExtension ? "sim" : "nao",
})), ["tipo", "arquivo", "tamanho", "uso", "precache", "neverCacheExt"])}

## Original preservado

${mdTable([{
  arquivo: report.originalHeroVideo.path,
  tamanho: report.originalHeroVideo.size || "nao encontrado",
  preservado: report.originalHeroVideo.preserved ? "sim" : "nao",
  hero: report.originalHeroVideo.referencedByHero ? "sim" : "nao",
}], ["arquivo", "tamanho", "preservado", "hero"])}

## Maiores videos do projeto

${mdTable(projectVideos.map((asset) => ({ arquivo: asset.path, tamanho: asset.size, uso: asset.usedBy.join(", ") || "sem referencia" })), ["arquivo", "tamanho", "uso"])}

## Imagens pesadas da home e poster

${mdTable(homeHeavyImages.map((asset) => ({ arquivo: asset.path, tamanho: asset.size, uso: asset.usedBy.join(", ") || "sem referencia" })), ["arquivo", "tamanho", "uso"])}

## Recomendacoes

${report.recommendations.map((item) => `- ${item}`).join("\n")}
`;

await fs.writeFile(path.join(outputDir, "hero-video-report.md"), markdown, "utf8");

console.log(`Hero video audit: ${heroVideos.length} video(s), poster ${posterAsset ? "ok" : "missing"}, SW ${report.sw.cacheName || "unknown"}.`);
for (const asset of report.heroVideos) {
  console.log(`- ${asset.path}: ${asset.size}; precache=${asset.inServiceWorkerPrecache ? "yes" : "no"}; never-cache-ext=${asset.neverCacheByExtension ? "yes" : "no"}`);
}
