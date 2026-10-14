// Coleta as notícias do portal da Prefeitura e grava a cópia usada pelo painel
// quando a consulta ao vivo (função prefeituraFeed) não está disponível.
//   node scripts/prefeitura-news-sync.mjs            -> grava data/noticias-prefeitura.json
//   node scripts/prefeitura-news-sync.mjs --print    -> só imprime o resumo
// Somente leitura na Prefeitura; não acessa o Firebase.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUTPUT = resolve(ROOT, "data/noticias-prefeitura.json");
const USER_AGENT = "TurismoSMS-Importador/1.0 (+https://turismo.saomateusdosul.pr.gov.br)";

await import(pathToFileURL(resolve(ROOT, "js/admin/prefeitura-news.js")).href);
const P = globalThis.PrefeituraNews;

async function fetchMany(paths) {
  const out = {};
  let next = 0;
  async function worker() {
    while (next < paths.length) {
      const path = paths[next++];
      if (!P.isAllowedPath(path)) { out[path] = { ok: false, status: 0, error: "Caminho não permitido" }; continue; }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(P.BASE_URL + path, { headers: { "user-agent": USER_AGENT }, signal: controller.signal });
        out[path] = { ok: response.ok, status: response.status, body: response.ok ? await response.text() : "" };
      } catch (error) {
        out[path] = { ok: false, status: 0, error: error.name === "AbortError" ? "Tempo esgotado" : "Falha de conexão" };
      } finally {
        clearTimeout(timer);
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  return out;
}

const collected = await P.collect(fetchMany);
const summary = P.summarize(collected, []);
console.log(`Prefeitura: ${summary.encontradas} notícias | ${summary.elegiveis} Cultura e Turismo | ${summary.revisao} revisão | ${summary.descartadas} fora do escopo | ${collected.errors.length} falha(s) de consulta`);

if (!collected.items.length) {
  console.error("Nenhuma notícia coletada; a cópia existente não foi alterada.");
  process.exit(1);
}
if (!process.argv.includes("--print")) {
  // A classificação é recalculada no painel; a cópia guarda só os dados da origem.
  const items = collected.items.map(({ classificacao, ...item }) => item);
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify({ fetchedAt: collected.fetchedAt, source: collected.source, errors: collected.errors, items }, null, 1) + "\n", "utf8");
  console.log(`Gravado ${OUTPUT}`);
}
