import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "docs", "auditoria-output");
const ignoredDirs = new Set([".git", ".codex", "EMPREENDIMENTOS", "node_modules", "dist", "build", ".cache", "auditoria-output"]);
const textExts = new Set([".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".xml"]);

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

function groupBy(items, mapper) {
  return items.reduce((groups, item) => {
    const key = mapper(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
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

function normalizeScriptSrc(src) {
  return String(src || "").split(/[?#]/)[0].replace(/^\//, "");
}

function extractHtmlAssets(text, file) {
  const scripts = [...text.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)].map((match) => normalizeScriptSrc(match[1]));
  const styles = [...text.matchAll(/<link[^>]+href=["']([^"']+\.css(?:[?#][^"']*)?)["'][^>]*>/gi)].map((match) => normalizeScriptSrc(match[1]));
  const anchors = [...text.matchAll(/\s(?:id|name)=["']([^"']+)["']/gi)].map((match) => match[1]);
  return { file, scripts, styles, anchors };
}

function analyzeCss(text, file) {
  const important = (text.match(/!important/g) || []).length;
  const media = (text.match(/@media/g) || []).length;
  const selectors = [...text.matchAll(/(^|})\s*([^@{}][^{}]+)\s*\{/g)]
    .map((match) => match[2].trim())
    .filter((selector) => selector && selector.length < 180);
  return { file, bytes: text.length, important, media, selectors };
}

function analyzeJs(text, file) {
  const globals = [
    ...[...text.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)/g)].map((match) => `window.${match[1]}`),
    ...[...text.matchAll(/\bconst\s+([A-Z][A-Z0-9_]{2,})\b/g)].map((match) => `const ${match[1]}`),
    ...[...text.matchAll(/\blet\s+([A-Z][A-Z0-9_]{2,})\b/g)].map((match) => `let ${match[1]}`),
    ...[...text.matchAll(/\bvar\s+([A-Z][A-Z0-9_]{2,})\b/g)].map((match) => `var ${match[1]}`),
  ];
  const functions = [...text.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]);
  return {
    file,
    bytes: text.length,
    globals: [...new Set(globals)].sort(),
    functions: [...new Set(functions)].sort(),
    localStorage: (text.match(/localStorage/g) || []).length,
    serviceWorker: (text.match(/serviceWorker/g) || []).length,
    addEventListeners: (text.match(/addEventListener/g) || []).length,
  };
}

await fs.mkdir(outputDir, { recursive: true });
const files = await walk(root);
const stats = [];
for (const file of files) {
  const stat = await fs.stat(file);
  stats.push({
    path: rel(file),
    ext: path.extname(file).toLowerCase() || "(sem ext)",
    dir: path.dirname(rel(file)).replace(/\\/g, "/"),
    bytes: stat.size,
  });
}

const htmlFiles = stats.filter((item) => item.ext === ".html");
const cssFiles = stats.filter((item) => item.ext === ".css");
const jsFiles = stats.filter((item) => item.ext === ".js");
const directoryIndexes = htmlFiles.filter((item) => item.path.endsWith("/index.html"));
const rootHtml = htmlFiles.filter((item) => !item.path.includes("/"));
const htmlAssets = [];
const cssAnalysis = [];
const jsAnalysis = [];

for (const item of [...htmlFiles, ...cssFiles, ...jsFiles]) {
  const text = await fs.readFile(path.join(root, item.path), "utf8").catch(() => "");
  if (item.ext === ".html") htmlAssets.push(extractHtmlAssets(text, item.path));
  if (item.ext === ".css") cssAnalysis.push(analyzeCss(text, item.path));
  if (item.ext === ".js") jsAnalysis.push(analyzeJs(text, item.path));
}

const scriptLoads = [];
for (const page of htmlAssets) {
  for (const script of page.scripts) scriptLoads.push({ page: page.file, script });
}

const scriptsByPage = scriptLoads.filter((load) => load.script && !/^https?:\/\//i.test(load.script));
const scriptDuplicateLoads = Object.entries(groupBy(scriptsByPage, (load) => `${load.page}|${load.script}`))
  .filter(([, loads]) => loads.length > 1)
  .map(([key, loads]) => ({ key, count: loads.length }));

const scriptUsageCount = Object.entries(groupBy(scriptsByPage, (load) => load.script))
  .map(([script, loads]) => ({ script, pages: loads.length, examples: loads.slice(0, 8).map((load) => load.page).join(", ") }))
  .sort((a, b) => b.pages - a.pages || a.script.localeCompare(b.script));

const allCssSelectors = cssAnalysis.flatMap((item) => item.selectors.map((selector) => ({ file: item.file, selector })));
const duplicateSelectors = Object.entries(groupBy(allCssSelectors, (item) => item.selector))
  .filter(([, items]) => new Set(items.map((item) => item.file)).size > 1)
  .map(([selector, items]) => ({ selector, files: [...new Set(items.map((item) => item.file))].join(", ") }))
  .sort((a, b) => a.selector.localeCompare(b.selector));

const globals = jsAnalysis.flatMap((item) => item.globals.map((global) => ({ file: item.file, global })));
const sharedGlobals = Object.entries(groupBy(globals, (item) => item.global))
  .filter(([, items]) => new Set(items.map((item) => item.file)).size > 1)
  .map(([global, items]) => ({ global, files: [...new Set(items.map((item) => item.file))].join(", ") }))
  .sort((a, b) => a.global.localeCompare(b.global));

const likelyLegacy = stats.filter((item) => /rotas-completas|mapa-completo|mapa-3d|roteiro-ia|reservas|admin|firebase|portal-usuario|para-o-trade/i.test(item.path));
const largest = [...stats].sort((a, b) => b.bytes - a.bytes).slice(0, 80);
const byExt = Object.entries(groupBy(stats, (item) => item.ext)).map(([ext, list]) => ({ ext, files: list.length, bytes: list.reduce((sum, item) => sum + item.bytes, 0) })).sort((a, b) => b.bytes - a.bytes);
const byDir = Object.entries(groupBy(stats, (item) => item.dir)).map(([dir, list]) => ({ dir, files: list.length, bytes: list.reduce((sum, item) => sum + item.bytes, 0) })).sort((a, b) => b.bytes - a.bytes);

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    files: stats.length,
    html: htmlFiles.length,
    css: cssFiles.length,
    js: jsFiles.length,
    directoryIndexes: directoryIndexes.length,
    rootHtml: rootHtml.length,
  },
  byExt,
  byDir,
  largest,
  rootHtml,
  directoryIndexes,
  likelyLegacy,
  htmlAssets,
  cssAnalysis: cssAnalysis.map(({ selectors, ...rest }) => ({ ...rest, selectorCount: selectors.length })),
  duplicateSelectors,
  jsAnalysis,
  scriptUsageCount,
  scriptDuplicateLoads,
  sharedGlobals,
};

const markdown = `# Saida da auditoria geral do projeto\n\nGerado em ${report.generatedAt}.\n\n## Resumo\n\n- Arquivos mapeados: ${report.totals.files}\n- HTMLs: ${report.totals.html}\n- CSS: ${report.totals.css}\n- JS: ${report.totals.js}\n- Diretórios com index.html: ${report.totals.directoryIndexes}\n- HTMLs na raiz: ${report.totals.rootHtml}\n\n## Distribuicao por extensao\n\n${mdTable(byExt, ["ext", "files", "bytes"], 80)}\n\n## Maiores arquivos\n\n${mdTable(largest, ["path", "bytes"], 80)}\n\n## HTMLs principais na raiz\n\n${mdTable(rootHtml, ["path", "bytes"], 80)}\n\n## Rotas com index.html\n\n${mdTable(directoryIndexes, ["path", "bytes"], 80)}\n\n## Arquivos legados/compatibilidade provaveis\n\n${mdTable(likelyLegacy, ["path", "bytes"], 120)}\n\n## Scripts mais carregados por HTML\n\n${mdTable(scriptUsageCount, ["script", "pages", "examples"], 120)}\n\n## Loads duplicados no mesmo HTML\n\n${mdTable(scriptDuplicateLoads, ["key", "count"], 80)}\n\n## CSS por arquivo\n\n${mdTable(report.cssAnalysis, ["file", "bytes", "important", "media", "selectorCount"], 80)}\n\n## Seletores CSS em multiplos arquivos\n\n${mdTable(duplicateSelectors, ["selector", "files"], 120)}\n\n## Globais JS compartilhados\n\n${mdTable(sharedGlobals, ["global", "files"], 120)}\n`;

await fs.writeFile(path.join(outputDir, "project-report.json"), JSON.stringify(report, null, 2), "utf8");
await fs.writeFile(path.join(outputDir, "project-report.md"), markdown, "utf8");

console.log(`Project audit: ${stats.length} files, ${htmlFiles.length} html, ${cssFiles.length} css, ${jsFiles.length} js.`);
