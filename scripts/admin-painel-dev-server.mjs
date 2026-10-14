// Servidor estático de DESENVOLVIMENTO para testar o painel contra o Firebase Emulator.
// Escuta somente em 127.0.0.1. Nas páginas HTML, acrescenta ao connect-src da meta CSP
// os endereços locais dos emuladores (Auth 9099, Firestore 8080, Storage 9199, Functions 5001).
// Nenhum arquivo do repositório é alterado: a reescrita acontece só na resposta local.
//   node scripts/admin-painel-dev-server.mjs [porta]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.argv[2] || 4173);
const EMULATOR_ORIGINS = "http://127.0.0.1:9099 http://127.0.0.1:8080 http://127.0.0.1:9199 http://127.0.0.1:5001 http://localhost:9099 http://localhost:8080 http://localhost:9199 http://localhost:5001";
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".mp4": "video/mp4", ".webm": "video/webm", ".txt": "text/plain; charset=utf-8",
};

function relaxCspForEmulators(html) {
  return html.replace(/connect-src ([^;"]*)/, (match, sources) => `connect-src ${sources} ${EMULATOR_ORIGINS}`);
}

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^([\\/])+/, "");
  let file = join(ROOT, clean);
  if (!file.startsWith(ROOT)) return null;
  for (const candidate of [file, `${file}.html`, join(file, "index.html")]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const file = await resolveFile(req.url || "/");
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Não encontrado");
    return;
  }
  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
  let body = await readFile(file);
  if (type.startsWith("text/html")) body = Buffer.from(relaxCspForEmulators(body.toString("utf8")));
  res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}).listen(PORT, "127.0.0.1", () => console.log(`admin-painel dev server em http://127.0.0.1:${PORT}`));
