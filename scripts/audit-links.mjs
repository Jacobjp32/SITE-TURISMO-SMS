import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "docs", "auditoria-output");
const ignoredDirs = new Set([".git", ".codex", "EMPREENDIMENTOS", "node_modules", "dist", "build", ".cache", "auditoria-output", "scripts"]);
const textExts = new Set([".html", ".js", ".mjs", ".json", ".md", ".xml", ".css"]);
const assetExts = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp4", ".webm", ".mov", ".pdf", ".docx", ".css", ".js", ".json", ".xml", ".ico", ".webmanifest"]);

function rel(file) {
  return path.relative(root, file).replace(/\\/g, "/");
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

function stripOrigin(value) {
  return String(value || "").replace(/^https?:\/\/(?:www\.)?saomateusdosul(?:\.pr)?[^/]*/i, "");
}

function cleanUrl(value) {
  let url = stripOrigin(String(value || "").trim());
  if (!url || /^(mailto:|tel:|whatsapp:|javascript:|data:|#)/i.test(url)) return "";
  if (/^https?:\/\//i.test(url)) return url;
  url = url.replace(/\\/g, "/").replace(/^\.?\//, "/");
  try {
    url = decodeURIComponent(url);
  } catch (_) {
    // Keep malformed URL as-is.
  }
  return url;
}

function splitInternal(url) {
  const [withoutHash, hash = ""] = url.split("#");
  const [pathname, query = ""] = withoutHash.split("?");
  return {
    pathname: pathname || "/",
    query,
    hash,
  };
}

function resolveProjectPath(source, pathname) {
  if (!pathname || pathname === "/") return "index.html";
  if (pathname.startsWith("/")) return pathname.replace(/^\/+/, "");
  const base = path.posix.dirname(source.replace(/\\/g, "/"));
  return path.posix.normalize(path.posix.join(base === "." ? "" : base, pathname)).replace(/^\/+/, "");
}

function normalizeRoutePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  let p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  p = p.replace(/\/index\.html$/i, "/").replace(/\/index$/i, "/");
  p = p.replace(/\/+$/, "") || "/";
  return p;
}

function htmlAnchors(text) {
  const anchors = new Set();
  for (const match of text.matchAll(/\s(?:id|name)=["']([^"']+)["']/gi)) {
    anchors.add(match[1]);
  }
  return anchors;
}

function extractLinks(text, source) {
  const links = [];
  const attrPattern = /\b(?:href|src|action)=["']([^"']+)["']/gi;
  const stringPattern = /["'`]((?:\/|\.\/|\.\.\/)[^"'`\s]+|[A-Za-z0-9_-]+\.html(?:[?#][^"'`\s]*)?)["'`]/g;
  for (const match of text.matchAll(attrPattern)) {
    const url = cleanUrl(match[1]);
    if (url) links.push({ source, raw: match[1], url, kind: "attr" });
  }
  for (const match of text.matchAll(stringPattern)) {
    const url = cleanUrl(match[1]);
    if (url) links.push({ source, raw: match[1], url, kind: "string" });
  }
  return links;
}

function isAssetPath(pathname) {
  return assetExts.has(path.extname(pathname).toLowerCase());
}

function mdTable(rows, headers, limit = 100) {
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
const textFiles = files.filter((file) => textExts.has(path.extname(file).toLowerCase()) && !rel(file).startsWith("docs/"));
const htmlFiles = files.filter((file) => path.extname(file).toLowerCase() === ".html");
const existingFileSet = new Set(files.map(rel));
const routes = new Map();
const anchorsByRoute = new Map();

for (const file of htmlFiles) {
  const relative = rel(file);
  const text = await fs.readFile(file, "utf8");
  let route;
  if (relative === "index.html") route = "/";
  else if (relative.endsWith("/index.html")) route = `/${path.dirname(relative).replace(/\\/g, "/")}`;
  else route = `/${relative.replace(/\.html$/i, "")}`;
  const htmlRoute = relative === "index.html" ? "/" : `/${relative}`;
  routes.set(normalizeRoutePath(route), relative);
  routes.set(normalizeRoutePath(htmlRoute), relative);
  anchorsByRoute.set(normalizeRoutePath(route), htmlAnchors(text));
  anchorsByRoute.set(normalizeRoutePath(htmlRoute), htmlAnchors(text));
}

const links = [];
for (const file of textFiles) {
  const text = await fs.readFile(file, "utf8").catch(() => "");
  links.push(...extractLinks(text, rel(file)));
}

const uniqueLinks = [];
const seen = new Set();
for (const link of links) {
  const key = `${link.source}|${link.url}`;
  if (seen.has(key)) continue;
  seen.add(key);
  uniqueLinks.push(link);
}

const broken = [];
const external = [];
const legacy = [];
const redundant = [];
const decisions = [];
const verDetalhesNavigation = [];

const legacyPathPatterns = [/^\/rotas-completas(?:\.html)?$/i, /^\/o-que-fazer(?:\.html)?$/i, /^\/sabores(?:\.html)?$/i, /^\/onde-ficar(?:\.html)?$/i, /^\/mapa-completo(?:\.html)?$/i, /^\/mapa-3d(?:\.html)?$/i];

for (const link of uniqueLinks) {
  if (link.url.includes("${")) continue;
  if (/^https?:\/\//i.test(link.url)) {
    if (/exemplo|example|maps\.app\.goo\.gl\/exemplo/i.test(link.url)) {
      decisions.push({ source: link.source, url: link.url, issue: "link externo placeholder ou exemplo" });
    }
    external.push(link);
    continue;
  }

  const { pathname, hash } = splitInternal(link.url);
  const normalized = normalizeRoutePath(pathname);
  const relativePath = resolveProjectPath(link.source, pathname);

  if (isAssetPath(pathname)) {
    const exists = existingFileSet.has(relativePath);
    if (!exists) broken.push({ source: link.source, url: link.url, issue: "asset interno inexistente" });
    continue;
  }

  const routeExists = routes.has(normalized);
  const fileExists = existingFileSet.has(relativePath) || existingFileSet.has(`${relativePath}.html`) || existingFileSet.has(`${relativePath}/index.html`);

  if (!routeExists && !fileExists) {
    broken.push({ source: link.source, url: link.url, issue: "rota interna inexistente" });
  }

  if (hash && routeExists) {
    const anchors = anchorsByRoute.get(normalized) || new Set();
    if (!anchors.has(hash)) {
      broken.push({ source: link.source, url: link.url, issue: "anchor inexistente no destino" });
    }
  }

  if (legacyPathPatterns.some((pattern) => pattern.test(normalized) || pattern.test(pathname))) {
    legacy.push({ source: link.source, url: link.url, issue: "rota legada ou concorrente ao mapa" });
  }

  if (/\.html(?:$|[?#])/i.test(link.url) && routes.has(normalized.replace(/\.html$/i, ""))) {
    redundant.push({ source: link.source, url: link.url, issue: "existe variante sem .html" });
  }

  if (/\/local(?:\.html)?(?:$|[?#/])/i.test(pathname) || /^\/local$/i.test(normalized)) {
    decisions.push({ source: link.source, url: link.url, issue: "fluxo local legado precisa decisao: manter pagina individual ou usar modal/mapa" });
  }
}

for (const file of textFiles) {
  const text = await fs.readFile(file, "utf8").catch(() => "");
  const detailLinkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>\s*(?:Ver detalhes|View details|Ver detalle|Zobacz szczegoly)/gi;
  for (const match of text.matchAll(detailLinkPattern)) {
    verDetalhesNavigation.push({ source: rel(file), url: match[1], issue: "Ver detalhes ainda e link de navegacao" });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    filesScanned: textFiles.length,
    links: uniqueLinks.length,
    routes: routes.size,
    broken: broken.length,
    legacy: legacy.length,
    redundant: redundant.length,
    humanDecision: decisions.length,
    verDetalhesNavigation: verDetalhesNavigation.length,
  },
  routes: [...routes.entries()].map(([route, file]) => ({ route, file })),
  broken,
  legacy,
  redundant,
  humanDecision: decisions,
  verDetalhesNavigation,
  externalPlaceholders: decisions.filter((item) => item.issue.includes("placeholder")),
};

const markdown = `# Saida da auditoria de links e rotas\n\nGerado em ${report.generatedAt}.\n\n## Resumo\n\n- Arquivos varridos: ${report.totals.filesScanned}\n- Links internos/externos coletados: ${report.totals.links}\n- Rotas HTML conhecidas: ${report.totals.routes}\n- Links quebrados: ${report.totals.broken}\n- Links legados/concorrentes: ${report.totals.legacy}\n- Links redundantes com .html: ${report.totals.redundant}\n- Decisoes humanas: ${report.totals.humanDecision}\n- Ver detalhes ainda como link: ${report.totals.verDetalhesNavigation}\n\n## Links quebrados\n\n${mdTable(broken, ["source", "url", "issue"], 150)}\n\n## Links legados ou concorrentes\n\n${mdTable(legacy, ["source", "url", "issue"], 150)}\n\n## Links redundantes com .html\n\n${mdTable(redundant, ["source", "url", "issue"], 150)}\n\n## Links que precisam de decisao humana\n\n${mdTable(decisions, ["source", "url", "issue"], 150)}\n\n## Ver detalhes ainda como link\n\n${mdTable(verDetalhesNavigation, ["source", "url", "issue"], 150)}\n\n## Rotas conhecidas\n\n${mdTable(report.routes, ["route", "file"], 200)}\n`;

await fs.writeFile(path.join(outputDir, "links-report.json"), JSON.stringify(report, null, 2), "utf8");
await fs.writeFile(path.join(outputDir, "links-report.md"), markdown, "utf8");

console.log(`Link audit: ${uniqueLinks.length} links, ${broken.length} broken, ${legacy.length} legacy/redundant candidates.`);
