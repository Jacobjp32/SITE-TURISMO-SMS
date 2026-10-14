"use strict";

// Ponte de leitura para o importador de notícias do painel.
// O navegador do painel não consegue ler o portal da Prefeitura (sem CORS e fora
// da CSP); esta função busca somente caminhos públicos e fixos desse portal para
// um administrador ativo. Não grava nada: a importação acontece no painel.

const ORIGIN = "https://www.saomateusdosul.pr.gov.br";
const ALLOWED_PATH_RE = /^\/portal\/(rss(\/\d{1,3})?|noticias\/3\/\d{1,3}\/\d{1,3}\/0\/0\/0|noticias\/0\/3\/\d{1,7}\/[a-z0-9-]{0,220}\/?)$/;
const MAX_PATHS = 140;
const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 12000;
const CONCURRENCY = 4;
const USER_AGENT = "TurismoSMS-Importador/1.0 (+https://turismo.saomateusdosul.pr.gov.br)";

function isAllowedPath(path) {
  return typeof path === "string" && ALLOWED_PATH_RE.test(path);
}

// Reduz a resposta ao trecho que o parser do painel usa (limite de tamanho do callable).
function trimBody(path, body) {
  let text = String(body || "").replace(/<svg[\s\S]*?<\/svg>/gi, "");
  if (path.indexOf("/portal/rss") === 0) return text;
  if (path.indexOf("/portal/noticias/3/") === 0) {
    const start = text.indexOf("ntc_cont_noticias");
    return start >= 0 ? text.slice(Math.max(0, start - 200), start + 400000) : text.slice(0, 400000);
  }
  const head = (text.match(/<meta property="og:[^>]+>/gi) || []).join("\n");
  const start = text.indexOf("<!-- Data extenso -->");
  const end = text.indexOf("ntc_area_info_noticia", start);
  const article = start >= 0 ? text.slice(start, end > start ? end + 1500 : start + 200000) : text.slice(0, 200000);
  return head + "\n" + article;
}

async function fetchOne(path, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(ORIGIN + path, {
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.5" },
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) return { ok: false, status: response.status, error: "HTTP " + response.status };
    const finalUrl = new URL(response.url || ORIGIN + path);
    if (finalUrl.origin !== ORIGIN) return { ok: false, status: 0, error: "Redirecionamento para fora do portal" };
    const text = await response.text();
    if (text.length > MAX_BYTES) return { ok: false, status: response.status, error: "Resposta grande demais" };
    return { ok: true, status: response.status, body: trimBody(path, text) };
  } catch (error) {
    return { ok: false, status: 0, error: error && error.name === "AbortError" ? "Tempo esgotado" : "Falha de conexão" };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPaths(paths, fetchImpl) {
  const results = {};
  let next = 0;
  async function worker() {
    while (next < paths.length) {
      const path = paths[next++];
      results[path] = await fetchOne(path, fetchImpl);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, paths.length) }, worker));
  return results;
}

function validatePaths(input) {
  const paths = input && Array.isArray(input.paths) ? input.paths : null;
  if (!paths || !paths.length) return { error: "Informe os caminhos a consultar." };
  if (paths.length > MAX_PATHS) return { error: "Caminhos demais em uma consulta." };
  const unique = Array.from(new Set(paths));
  if (!unique.every(isAllowedPath)) return { error: "Caminho fora do portal de notícias da Prefeitura." };
  return { paths: unique };
}

function isActiveAdmin(profile) {
  return Boolean(profile) && profile.role === "admin" && profile.ativo === true;
}

module.exports = { ORIGIN, isAllowedPath, trimBody, fetchPaths, validatePaths, isActiveAdmin };
