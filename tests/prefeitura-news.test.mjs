import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

const root = new URL("../", import.meta.url);
await import(new URL("js/admin/prefeitura-news.js", root).href);
const P = globalThis.PrefeituraNews;
const feed = createRequire(import.meta.url)("../functions/prefeitura-feed.js");
const fixture = (name) => readFile(new URL("tests/fixtures/prefeitura/" + name, root), "utf8");

const sample = (over) => Object.assign({
  sourceId: "1", titulo: "", resumo: "", conteudo: "", categorias: [], publishedAt: "2026-10-01T10:00:00-03:00"
}, over);

test("RSS da categoria Cultura e Turismo: campos reais, link canônico e categorias múltiplas separadas", async () => {
  const items = P.parseRss(await fixture("rss50.xml"));
  assert.equal(items.length, 5);
  const pierogui = items.find((i) => i.sourceId === "3737");
  assert.ok(pierogui, "notícia 3737 presente");
  assert.equal(pierogui.titulo, "São Mateus do Sul abre inscrições para o Concurso Municipal do Melhor Pierogui");
  assert.equal(pierogui.link, "https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3737/sao-mateus-do-sul-abre-inscricoes-para-o-concurso-municipal-do-melhor-pierogui");
  assert.equal(pierogui.publishedAt, "2026-10-13T16:12:00-03:00");
  assert.match(pierogui.imagem, /^https:\/\/www\.saomateusdosul\.pr\.gov\.br\/fotos\/[0-9a-f]+\.png$/);
  assert.match(pierogui.resumo, /gastronomia de origem polonesa/);
  assert.ok(pierogui.conteudo.split("\n\n").length > 2, "texto em parágrafos");
  assert.deepEqual(pierogui.categorias, ["Cultura e Turismo"]);
  const multi = items.find((i) => i.categorias.length > 1);
  assert.ok(multi && multi.categorias.every((c) => !c.includes(",")), "categorias com vírgula viram itens separados");
});

test("página da notícia: título, data, categorias, foto, resumo, texto e autor", async () => {
  const item = P.parseArticle(await fixture("artigo-3699.html"),
    "https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3699/arte-historia-e-memoria-exposicao-de-ludovico-bieniek-atrai-1290-visitantes");
  assert.equal(item.sourceId, "3699");
  assert.equal(item.titulo, "Arte, história e memória: exposição de Ludovico Bieniek atrai 1.290 visitantes");
  assert.equal(item.publishedAt, "2026-10-05T12:00:00-03:00");
  assert.deepEqual(item.categorias, ["Cultura e Turismo", "Educação e Cultura"]);
  assert.match(item.imagem, /\/fotos\/ca2d7fff6718a95b70a2bb2b813a5903\.png$/);
  assert.match(item.conteudo, /1\.290 visitantes/);
  assert.doesNotMatch(item.conteudo, /<|&nbsp;|&quot;/, "sem HTML nem entidades");
  assert.match(item.autor, /Comunica/);
  assert.equal(P.classify(item).decision, "elegivel");
});

test("listagem: identidades e títulos das 30 notícias da página", async () => {
  const items = P.parseListing(await fixture("listagem-50.html"));
  assert.ok(items.length >= 10);
  assert.ok(items.every((i) => /^\d+$/.test(i.sourceId) && i.link.startsWith(P.BASE_URL + "/portal/noticias/0/3/")));
  assert.equal(new Set(items.map((i) => i.sourceId)).size, items.length, "sem repetição");
});

test("RSS geral: notícias de outras áreas ficam fora do escopo", async () => {
  const items = P.parseRss(await fixture("rss-geral.xml"));
  assert.ok(items.length > 0);
  const professores = sample({ titulo: "Prefeitura abre Processo Seletivo para contratação de professores em São Mateus do Sul", categorias: ["Educação"] });
  assert.equal(P.classify(professores).decision, "descartada");
});

test("filtro Cultura e Turismo: categoria oficial e conteúdo decidem; dúvida vai para revisão", () => {
  const c = (over) => P.classify(sample(over)).decision;
  assert.equal(c({ titulo: "Casa da Memória Padre Bauer recebe 700 visitantes em agosto", categorias: ["Cultura e Turismo", "Educação e Cultura"] }), "elegivel");
  assert.equal(c({ titulo: "Inscrições abertas para o Miss São Mateus do Sul 2026", categorias: ["AgroSamas"], conteudo: "O concurso integra a programação da festa." }), "elegivel");
  assert.equal(c({ titulo: "Boletim Epidemiológico apresenta dados sobre tuberculose", categorias: ["Saúde"] }), "descartada");
  assert.equal(c({ titulo: "Vacina Pneumo 20 passa a ser disponibilizada para idosos", categorias: ["Saúde"], conteudo: "Festa de vacinação" }), "descartada");
  // Educação e Cultura é categoria mista: sem tema cultural no título, fica fora.
  assert.equal(c({ titulo: "Tomam posse novos membros do Conselho de Alimentação Escolar", categorias: ["Educação e Cultura"] }), "descartada");
  assert.equal(c({ titulo: "São Mateus do Sul recebe projeto Cinema na Praça", categorias: ["Educação e Cultura"] }), "elegivel");
  // Categoria turística, mas assunto de trânsito/aviso administrativo: revisão humana.
  assert.equal(c({ titulo: "Alterações temporárias no trânsito durante o Desfile de Abertura do Mês Polonês", categorias: ["Cultura e Turismo", "Trânsito"] }), "revisao");
  assert.equal(c({ titulo: "Prefeitura abre chamamento público para patrocinadores oficiais do 5º AgroSamas", categorias: ["AgroSamas"] }), "revisao");
  assert.equal(c({ titulo: "Município aprimora normativas de contratações públicas com novo decreto", categorias: ["Cultura e Turismo", "Gestão Pública"] }), "descartada");
  // Várias categorias e nenhum tema turístico no título.
  assert.equal(c({ titulo: "PROJETO SER MULHER", categorias: ["Assistência Social", "Cultura e Turismo", "Saúde"] }), "revisao");
  // Sem categoria turística oficial nunca entra automaticamente.
  assert.equal(c({ titulo: "Festival de música reúne artistas", categorias: ["Cidade"] }), "revisao");
  // "São Mateus do Sul" sozinho não é sinal turístico.
  assert.equal(c({ titulo: "São Mateus do Sul recebe nova ambulância", categorias: ["Cidade"] }), "descartada");
});

test("deduplicação: nova, existente, atualizada, conflito e vinculada", () => {
  const item = sample({ sourceId: "3737", titulo: "Concurso do Pierogui", conteudo: "Texto.", link: P.BASE_URL + "/portal/noticias/0/3/3737/concurso" });
  item.classificacao = P.classify(item);
  const imported = P.buildNewDoc(item);
  assert.equal(imported.id, "noticia_prefeitura_3737");
  assert.equal(imported.publicado, false, "entra como rascunho");
  assert.equal(imported.status, "rascunho");

  assert.equal(P.planImport([item], [])[0].state, "nova");
  assert.equal(P.planImport([item], [imported])[0].state, "existente");

  const changed = Object.assign({}, item, { conteudo: "Texto corrigido pela Prefeitura." });
  assert.equal(P.planImport([changed], [imported])[0].state, "atualizada");

  const edited = Object.assign({}, imported, { resumo: "Resumo reescrito pela equipe." });
  assert.equal(P.planImport([changed], [edited])[0].state, "conflito");
  assert.equal(P.planImport([item], [edited])[0].state, "existente", "origem sem mudança não sobrescreve edição");

  const manual = { id: "noticia_manual", titulo: "Outro título", linkOrigem: P.BASE_URL + "/portal/noticias/0/3/3737/concurso/" };
  const linked = P.planImport([item], [manual])[0];
  assert.equal(linked.state, "vinculada");
  assert.equal(linked.docId, "noticia_manual");
});

test("atualização de notícia publicada fica guardada para revisão e não toca o conteúdo no ar", () => {
  const item = sample({ sourceId: "11", titulo: "Título novo da origem", conteudo: "Texto novo.", link: P.BASE_URL + "/portal/noticias/0/3/11/a" });
  const live = { id: "noticia_prefeitura_11", origemTipo: "prefeitura", origemId: "11", publicado: true, titulo: "Título no ar", conteudo: "Texto no ar." };
  const patch = P.buildUpdate(item, { updatedBy: "admin-1", origemImportadoEm: "agora" }, live);
  for (const key of ["titulo", "resumo", "conteudo", "imagem", "galeria", "publicado", "status", "slug", "origemHash"]) {
    assert.equal(key in patch, false, key + " não pode mudar no ar");
  }
  assert.equal(patch.atualizacaoPendente, true);
  assert.equal(patch.atualizacaoOrigem.titulo, "Título novo da origem");
  assert.equal(patch.atualizacaoOrigem.origemHash, P.contentHash(patch.atualizacaoOrigem));
  assert.equal(patch.atualizacaoOrigem.detectadaEm, "agora");
  assert.equal(patch.updatedBy, "admin-1");

  const stored = Object.assign({}, live, { origemHash: "antigo" }, patch);
  assert.equal(P.planImport([item], [stored])[0].state, "pendente", "repetir não grava de novo");

  const draft = Object.assign({}, live, { publicado: false });
  const draftPatch = P.buildUpdate(item, { updatedBy: "admin-1" }, draft);
  assert.equal(draftPatch.titulo, "Título novo da origem", "rascunho recebe o texto novo");
  assert.equal(draftPatch.atualizacaoPendente, false);
  assert.equal("publicado" in draftPatch, false);
});

test("atualização preserva publicação, destaque e slug do CMS", () => {
  const patch = P.buildUpdatePatch(sample({ sourceId: "9", titulo: "Novo", conteudo: "x", link: P.BASE_URL + "/portal/noticias/0/3/9/a" }));
  for (const key of ["publicado", "status", "destaque", "slug", "createdAt"]) assert.equal(key in patch, false, key);
  assert.equal(patch.origemTipo, "prefeitura");
  assert.equal(patch.origemHash, P.contentHash(patch));
});

test("coleta tolera falha de conexão e relata os caminhos com erro", async () => {
  const rss = await fixture("rss50.xml");
  const fetchMany = async (paths) => Object.fromEntries(paths.map((p) => [p, p === "/portal/rss/50" ? { ok: true, status: 200, body: rss } : { ok: false, status: 0, error: "Falha de conexão" }]));
  const out = await P.collect(fetchMany, { categoryIds: [50], includeGeneral: false, maxArticles: 0 });
  assert.equal(out.items.length, 5);
  assert.ok(out.errors.length >= 1);
  const allDown = await P.collect(async (paths) => Object.fromEntries(paths.map((p) => [p, { ok: false, status: 503 }])), { categoryIds: [50] });
  assert.equal(allDown.items.length, 0);
  assert.ok(allDown.errors.every((e) => e.status === 503));
});

test("função prefeituraFeed: só caminhos públicos fixos, admin ativo, sem redirecionamento externo", async () => {
  assert.equal(feed.isAllowedPath("/portal/rss/50"), true);
  assert.equal(feed.isAllowedPath("/portal/noticias/3/2/50/0/0/0"), true);
  assert.equal(feed.isAllowedPath("/portal/noticias/0/3/3699/arte-historia"), true);
  for (const bad of ["/portal/admin", "https://evil.example/portal/rss", "/portal/rss/50?x=1", "/portal/noticias/0/3/1/../../x", "//evil.example"]) {
    assert.equal(feed.isAllowedPath(bad), false, bad);
  }
  assert.ok(feed.validatePaths({ paths: ["/portal/rss/50", "/etc/passwd"] }).error);
  assert.ok(feed.validatePaths({ paths: [] }).error);
  assert.equal(feed.isActiveAdmin({ role: "admin", ativo: true }), true);
  assert.equal(feed.isActiveAdmin({ role: "admin", ativo: "true" }), false);
  assert.equal(feed.isActiveAdmin({ role: "moderator", ativo: true }), false);
  // Paridade com a allowlist do painel.
  for (const p of ["/portal/rss", "/portal/rss/36", "/portal/noticias/3/1/0/0/0/0", "/portal/x"]) assert.equal(feed.isAllowedPath(p), P.isAllowedPath(p), p);

  const redirected = await feed.fetchPaths(["/portal/rss/50"], async () => ({ ok: true, status: 200, url: "https://evil.example/", text: async () => "x" }));
  assert.equal(redirected["/portal/rss/50"].ok, false);
  const failed = await feed.fetchPaths(["/portal/rss/50"], async () => { throw new Error("offline"); });
  assert.deepEqual(failed["/portal/rss/50"], { ok: false, status: 0, error: "Falha de conexão" });
});
