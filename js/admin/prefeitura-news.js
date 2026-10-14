// Importador de notícias do portal oficial da Prefeitura de São Mateus do Sul.
// Módulo puro (sem DOM, sem Firebase): coleta RSS/HTML por meio de um fetcher
// injetado, extrai os campos, classifica Cultura e Turismo e planeja a importação
// idempotente contra a coleção `noticias`. Usado pelo painel (navegador) e pelo
// script scripts/prefeitura-news-sync.mjs (Node).
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PrefeituraNews = api;
})(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this), function () {
  "use strict";

  var BASE_URL = "https://www.saomateusdosul.pr.gov.br";

  // Categorias oficiais do portal da Prefeitura (ids do filtro /portal/noticias/3/1/<id>).
  var CATEGORIES = {
    50: { label: "Cultura e Turismo", weight: "strong" },
    36: { label: "Turismo", weight: "strong" },
    52: { label: "AgroSamas", weight: "strong" },
    54: { label: "Natal 2024", weight: "strong" },
    44: { label: "Educação e Cultura", weight: "mixed" }
  };
  var DEFAULT_CATEGORY_IDS = [50, 36, 52, 44];

  var STRONG_CATEGORY_RE = /^(cultura e turismo|turismo|agrosamas|natal\b.*)$/;
  var MIXED_CATEGORY_RE = /^(educacao e cultura|cultura)$/;
  var OTHER_AREA_CATEGORY_RE = /^(saude|educacao|infraestrutura|transito|concurso|pss|gestao publica|contas publicas|transparencia publica|audiencia publica|defesa civil|seguranca publica|assistencia social|ipresmat|conselhos|transporte publico|participacao popular|meio ambiente|agricultura|industria e comercio|economia solidaria|esporte|cidade|imprensa|notas rapidas)$/;

  // Termos que caracterizam Cultura e Turismo. Genéricos ("são mateus do sul",
  // "município", "prefeitura") não contam.
  var POSITIVE_TERMS = [
    "turismo", "turistic[oa]s?", "turistas?", "roteiros?", "visitantes?", "visitacao",
    "cultura", "culturais", "cultural", "patrimonio", "historico cultural", "museu",
    "casa da memoria", "exposicao", "exposicoes", "artistas?", "artisticos?", "artesanato", "artesaos?",
    "teatro", "musica", "musical", "festival", "festa", "festas", "festividades?", "folclore", "folcloric[oa]s?",
    "danca", "dancas", "cinema", "biblioteca", "poesia", "literatura", "mural", "grafite", "pintor(es)?", "pintura", "livros?",
    "polones", "polonesa", "polonia", "poloneses", "polskie", "tradycje", "mes polones",
    "imigrantes?", "imigracao", "ucranian[oa]s?", "tradicao", "tradicoes", "tradicionais",
    "erva-mate", "ervateiras?", "chimarrao", "mathe", "rua do mathe",
    "gastronomia", "gastronomic[oa]", "culinaria", "pierogi", "pierogui",
    "agrosamas", "natal ouro verde", "vapor pery", "lei paulo gustavo", "aldir blanc",
    "fanfarras?", "coral", "banda municipal", "carnaval", "desfile de abertura"
  ];
  // Termos de outras áreas que, no título, tiram a notícia da importação automática.
  var NEGATIVE_TERMS = [
    "licitacao", "pregao", "processo seletivo", "pss", "concurso publico", "vacina", "vacinacao",
    "saude", "epidemiologico", "dengue", "ubs", "preventivo", "obras?", "pavimentacao", "asfalto",
    "transito", "interdicao", "interditad[ao]", "iptu", "tributos?", "decreto", "conselho tutelar",
    "matriculas?", "cmei", "defesa civil", "tempestades?", "policia", "acidentes?", "obitos?"
  ];
  // Avisos administrativos: relevantes às vezes (chamamento de artistas), mas sempre revisados.
  var ADMIN_TERMS = ["chamamento publico", "patrocinadores?", "credenciamento", "edital", "inscricoes para comercializacao"];

  function normalize(value) {
    return String(value == null ? "" : value)
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/\s+/g, " ").trim();
  }

  function buildMatcher(terms) {
    return terms.map(function (term) {
      return { term: term, re: new RegExp("(^|[^a-z0-9])(" + term + ")(?=$|[^a-z0-9])") };
    });
  }
  var POSITIVE = buildMatcher(POSITIVE_TERMS);
  var NEGATIVE = buildMatcher(NEGATIVE_TERMS);
  var ADMIN = buildMatcher(ADMIN_TERMS);

  function findTerms(matchers, text) {
    var found = [];
    matchers.forEach(function (m) {
      var hit = m.re.exec(text);
      if (hit && found.indexOf(hit[2]) === -1) found.push(hit[2]);
    });
    return found;
  }

  var ENTITIES = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…",
    ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", ordm: "º", ordf: "ª", deg: "°", middot: "·" };
  function decodeEntities(text) {
    return String(text || "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (all, code) {
      if (code[0] === "#") {
        var n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "";
      }
      var key = code.toLowerCase();
      return Object.prototype.hasOwnProperty.call(ENTITIES, key) ? ENTITIES[key] : all;
    });
  }

  function stripCdata(text) {
    return String(text || "").replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
  }

  // HTML do editor da Prefeitura -> texto puro em parágrafos separados por "\n\n".
  function htmlToText(html) {
    var text = String(html || "")
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n\n")
      .replace(/<[^>]+>/g, "");
    return tidyParagraphs(decodeEntities(text));
  }

  function tidyParagraphs(text) {
    return String(text || "")
      .replace(/\r/g, "")
      .replace(/[ \t ]+/g, " ")
      .split(/\n\s*\n+/)
      .map(function (p) { return p.replace(/\s*\n\s*/g, " ").trim(); })
      .filter(Boolean)
      .join("\n\n");
  }

  function plainLine(text) {
    return decodeEntities(String(text || "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
  }

  function absoluteUrl(path) {
    var value = String(path || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value.replace(/^http:\/\//i, "https://");
    if (value[0] !== "/") value = "/" + value;
    return BASE_URL + value;
  }

  // Identidade estável: o número da notícia no portal (…/noticias/0/3/<id>/<slug>).
  function parseNewsUrl(url) {
    var match = /saomateusdosul\.pr\.gov\.br\/portal\/noticias\/0\/\d+\/(\d+)\/([^/?#]*)/i.exec(String(url || ""))
      || /^\/portal\/noticias\/0\/\d+\/(\d+)\/([^/?#]*)/i.exec(String(url || ""));
    if (!match) return null;
    var slug = match[2].replace(/\/+$/, "");
    return {
      sourceId: match[1],
      slug: slug,
      link: BASE_URL + "/portal/noticias/0/3/" + match[1] + (slug ? "/" + slug : "")
    };
  }

  var MONTHS = { JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6, JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12 };
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // "2026-10-13 16:12:00" (RSS) ou "05 OUT 2026 - 11h15" (página) -> ISO com fuso de Brasília.
  function parseSourceDate(value) {
    var text = String(value || "").trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(text);
    if (m) return m[1] + "-" + m[2] + "-" + m[3] + "T" + m[4] + ":" + m[5] + ":" + (m[6] || "00") + "-03:00";
    m = /(\d{1,2})\s+([A-Z]{3})\s+(\d{4})(?:\s*-\s*(\d{1,2})h(\d{2}))?/i.exec(text);
    if (m && MONTHS[m[2].toUpperCase()]) {
      return m[3] + "-" + pad(MONTHS[m[2].toUpperCase()]) + "-" + pad(Number(m[1])) + "T" +
        (m[4] ? pad(Number(m[4])) + ":" + m[5] : "12:00") + ":00-03:00";
    }
    return "";
  }

  function tag(block, name) {
    var m = new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i").exec(block);
    return m ? stripCdata(m[1]) : "";
  }

  function parseRss(xml) {
    var items = [];
    String(xml || "").replace(/<item>([\s\S]*?)<\/item>/gi, function (all, block) {
      var link = plainLine(tag(block, "link"));
      var identity = parseNewsUrl(link);
      if (!identity) return all;
      var imageBlock = tag(block, "image");
      var description = tidyParagraphs(decodeEntities(tag(block, "description")).replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
      var categories = [];
      block.replace(/<category>([\s\S]*?)<\/category>/gi, function (a, c) {
        plainLine(stripCdata(c)).split(/\s*,\s*/).forEach(function (part) {
          var label = part ? prettyCategory(part) : "";
          if (label && categories.indexOf(label) === -1) categories.push(label);
        });
        return a;
      });
      items.push({
        sourceId: identity.sourceId,
        sourceSlug: identity.slug,
        link: identity.link,
        titulo: plainLine(tag(block, "title")),
        resumo: plainLine(tag(block, "resumo")),
        conteudo: description,
        imagem: absoluteUrl(plainLine(tag(imageBlock, "url"))),
        galeria: [],
        categorias: categories,
        publishedAt: parseSourceDate(plainLine(tag(block, "pubDate"))),
        autor: "",
        via: "rss"
      });
      return all;
    });
    return items;
  }

  // Página de listagem: só identidade, título, data e capa (sem categoria nem texto).
  function parseListing(html) {
    var items = [];
    var seen = {};
    var re = /<a href="(\/portal\/noticias\/0\/3\/\d+\/[^"]*)">\s*<div class="ntc_noticia">([\s\S]*?)(?=<a href="\/portal\/noticias\/0\/3\/|<!-- Pagina|ntc_area_paginacao|$)/gi;
    var m;
    while ((m = re.exec(String(html || "")))) {
      var identity = parseNewsUrl(m[1]);
      if (!identity || seen[identity.sourceId]) continue;
      seen[identity.sourceId] = true;
      var body = m[2];
      var img = /<img src="([^"]+)"/i.exec(body);
      var date = /ntc_data_noticia[^"]*">([^<]+)</i.exec(body);
      var title = /ntc_titulo_noticia[^"]*">([\s\S]*?)<\/div>/i.exec(body);
      items.push({
        sourceId: identity.sourceId,
        sourceSlug: identity.slug,
        link: identity.link,
        titulo: title ? plainLine(title[1]) : "",
        publishedAt: date ? parseSourceDate(date[1]) : "",
        imagem: img ? absoluteUrl(img[1]) : "",
        via: "listagem"
      });
    }
    return items;
  }

  // Página da notícia: título, data, categorias, resumo, texto, fotos e autor.
  function parseArticle(html, url) {
    var page = String(html || "");
    var identity = parseNewsUrl(url) || parseNewsUrl((/<meta property="og:url" content="([^"]+)"/i.exec(page) || [])[1]);
    var start = page.indexOf("<!-- Data extenso -->");
    if (start < 0) start = page.search(/ntc_data_noticia/);
    var titleIdx = page.indexOf("ntc_titulo_noticia", start);
    var header = start >= 0 && titleIdx > start ? page.slice(start, titleIdx + 600) : "";
    var date = /ntc_data_noticia[^"]*">([^<]+)</i.exec(header);
    var title = /ntc_titulo_noticia[^"]*">([\s\S]*?)<\/div>/i.exec(header);
    var categories = [];
    header.replace(/ntc_categoria_noticia[^>]*>([\s\S]*?)<\/div>/gi, function (a, c) {
      var label = prettyCategory(plainLine(c));
      if (label && categories.indexOf(label) === -1) categories.push(label);
      return a;
    });
    var gallery = [];
    page.replace(/<a href="([^"]+)"[^>]*data-fancybox="galeria_principal"/gi, function (a, href) {
      var abs = absoluteUrl(href);
      if (gallery.indexOf(abs) === -1) gallery.push(abs);
      return a;
    });
    var ogImage = (/<meta property="og:image" content="([^"]+)"/i.exec(page) || [])[1];
    var summary = /ntc_resumo_noticia[^>]*>([\s\S]*?)<\/div>/i.exec(page);
    var bodyMatch = /ntc_cont_descricao_noticia[^>]*>([\s\S]*?)<!-- Info not/i.exec(page);
    var author = /Autor:\s*<\/strong>\s*<span>([\s\S]*?)<\/span>/i.exec(page);
    var cover = gallery[0] || absoluteUrl(ogImage || "");
    return {
      sourceId: identity ? identity.sourceId : "",
      sourceSlug: identity ? identity.slug : "",
      link: identity ? identity.link : "",
      titulo: title ? plainLine(title[1]) : plainLine((/<meta property="og:title" content="([^"]+)"/i.exec(page) || [])[1]),
      resumo: summary ? plainLine(summary[1]) : "",
      conteudo: bodyMatch ? htmlToText(bodyMatch[1].replace(/<\/div>\s*$/i, "")) : "",
      imagem: cover,
      galeria: gallery.filter(function (u) { return u !== cover; }),
      categorias: categories,
      publishedAt: date ? parseSourceDate(date[1]) : "",
      autor: author ? plainLine(author[1]) : "",
      via: "pagina"
    };
  }

  function prettyCategory(label) {
    var key = normalize(label);
    for (var id in CATEGORIES) {
      if (normalize(CATEGORIES[id].label) === key) return CATEGORIES[id].label;
    }
    // "SAÚDE" -> "Saúde"
    return label.toLowerCase().replace(/(^|\s)(\S)/g, function (a, s, c) { return s + c.toUpperCase(); })
      .replace(/\b(E|De|Da|Do)\b/g, function (w) { return w.toLowerCase(); });
  }

  function mergeItem(base, extra) {
    var out = Object.assign({}, base);
    Object.keys(extra || {}).forEach(function (key) {
      var value = extra[key];
      if (key === "categorias") {
        var merged = (out.categorias || []).slice();
        (value || []).forEach(function (c) { if (merged.indexOf(c) === -1) merged.push(c); });
        out.categorias = merged;
      } else if (key === "galeria") {
        if ((value || []).length > (out.galeria || []).length) out.galeria = value;
      } else if (value && (!out[key] || (key === "conteudo" && value.length > out[key].length))) {
        out[key] = value;
      }
    });
    return out;
  }

  // ---------- Classificação Cultura e Turismo ----------
  function classify(item) {
    var cats = (item.categorias || []).map(normalize);
    var strongCat = (item.categorias || []).filter(function (c) { return STRONG_CATEGORY_RE.test(normalize(c)); });
    var mixedCat = (item.categorias || []).filter(function (c) { return MIXED_CATEGORY_RE.test(normalize(c)); });
    var otherCat = (item.categorias || []).filter(function (c) { return OTHER_AREA_CATEGORY_RE.test(normalize(c)); });
    var title = normalize(item.titulo);
    var body = normalize([item.resumo, item.conteudo].join(" "));
    var titlePos = findTerms(POSITIVE, title);
    var bodyPos = findTerms(POSITIVE, body).filter(function (t) { return titlePos.indexOf(t) === -1; });
    var titleNeg = findTerms(NEGATIVE, title);
    var titleAdmin = findTerms(ADMIN, title);
    var reasons = [];
    var decision;

    if (strongCat.length) reasons.push("Categoria oficial da Prefeitura: " + strongCat.join(", "));
    else if (mixedCat.length) reasons.push("Categoria oficial mista: " + mixedCat.join(", "));
    else if (cats.length) reasons.push("Categoria oficial de outra área: " + item.categorias.join(", "));
    else reasons.push("Sem categoria oficial informada");
    if (titlePos.length) reasons.push("Termos de cultura/turismo no título: " + titlePos.join(", "));
    if (bodyPos.length) reasons.push("Termos no texto: " + bodyPos.slice(0, 6).join(", "));
    if (titleNeg.length) reasons.push("Assunto de outra área no título: " + titleNeg.join(", "));
    if (titleAdmin.length) reasons.push("Aviso administrativo: " + titleAdmin.join(", "));

    if (strongCat.length) {
      // A Prefeitura costuma marcar várias categorias: a turística sozinha não basta
      // quando o título não fala de cultura/turismo e outras áreas também aparecem.
      if (titleNeg.length) decision = titlePos.length ? "revisao" : "descartada";
      else if (titleAdmin.length) decision = "revisao";
      else if (titlePos.length) decision = "elegivel";
      else decision = !otherCat.length && bodyPos.length ? "elegivel" : "revisao";
    } else if (mixedCat.length) {
      if (titleNeg.length) decision = titlePos.length ? "revisao" : "descartada";
      else if (titlePos.length) decision = titleAdmin.length ? "revisao" : "elegivel";
      else decision = bodyPos.length >= 3 ? "revisao" : "descartada";
    } else {
      // Sem categoria turística oficial nunca entra automaticamente.
      decision = titlePos.length && !titleNeg.length ? "revisao" : "descartada";
    }
    if (otherCat.length && !strongCat.length && decision === "elegivel") decision = "revisao";

    var label = { elegivel: "Cultura e Turismo", revisao: "Revisão editorial", descartada: "Fora do escopo" }[decision];
    return { decision: decision, label: label, reasons: reasons };
  }

  // ---------- Coleta ----------
  function rssPath(categoryId) { return categoryId ? "/portal/rss/" + categoryId : "/portal/rss"; }
  function listingPath(categoryId, page) { return "/portal/noticias/3/" + (page || 1) + "/" + (categoryId || 0) + "/0/0/0"; }
  function articlePath(item) { return "/portal/noticias/0/3/" + item.sourceId + "/" + (item.sourceSlug || ""); }

  var ALLOWED_PATH_RE = /^\/portal\/(rss(\/\d{1,3})?|noticias\/3\/\d{1,3}\/\d{1,3}\/0\/0\/0|noticias\/0\/3\/\d{1,7}\/[a-z0-9-]{0,220}\/?)$/;
  function isAllowedPath(path) { return ALLOWED_PATH_RE.test(String(path || "")); }

  // fetchMany(paths) -> Promise<{ [path]: { ok, status, body } }>
  async function collect(fetchMany, options) {
    var opts = Object.assign({
      categoryIds: DEFAULT_CATEGORY_IDS,
      listingPages: 1,
      includeGeneral: true,
      maxArticles: 120
    }, options || {});
    var errors = [];
    var byId = {};
    var order = [];
    function add(item) {
      if (!item || !item.sourceId) return;
      if (!byId[item.sourceId]) { byId[item.sourceId] = item; order.push(item.sourceId); }
      else byId[item.sourceId] = mergeItem(byId[item.sourceId], item);
    }
    function note(path, res) {
      if (!res) errors.push({ path: path, status: 0, message: "Sem resposta" });
      else if (!res.ok) errors.push({ path: path, status: res.status || 0, message: res.error || "Falha na consulta" });
      return res && res.ok ? String(res.body || "") : "";
    }

    var firstPaths = [];
    opts.categoryIds.forEach(function (id) { firstPaths.push(rssPath(id)); });
    if (opts.includeGeneral) firstPaths.push(rssPath(0));
    var listingIds = opts.categoryIds.slice();
    if (opts.includeGeneral) listingIds.push(0);
    listingIds.forEach(function (id) {
      for (var p = 1; p <= opts.listingPages; p += 1) firstPaths.push(listingPath(id, p));
    });

    var first = await fetchMany(firstPaths);
    var rssItems = 0;
    firstPaths.forEach(function (path) {
      var body = note(path, first[path]);
      if (!body) return;
      if (path.indexOf("/portal/rss") === 0) {
        parseRss(body).forEach(function (item) { rssItems += 1; add(item); });
      } else {
        parseListing(body).forEach(add);
      }
    });

    // Itens sem texto completo ou sem categoria precisam da página da notícia.
    var needArticle = order.filter(function (id) {
      var item = byId[id];
      return !item.conteudo || !(item.categorias || []).length || !item.autor;
    }).slice(0, opts.maxArticles);
    var articlePaths = needArticle.map(function (id) { return articlePath(byId[id]); });
    if (articlePaths.length) {
      var pages = await fetchMany(articlePaths);
      articlePaths.forEach(function (path, i) {
        var body = note(path, pages[path]);
        if (body) add(Object.assign(parseArticle(body, BASE_URL + path), { sourceId: needArticle[i] }));
      });
    }

    var items = order.map(function (id) {
      var item = byId[id];
      item.classificacao = classify(item);
      return item;
    }).sort(function (a, b) { return String(b.publishedAt).localeCompare(String(a.publishedAt)); });

    return {
      fetchedAt: new Date().toISOString(),
      source: BASE_URL,
      requested: firstPaths.length + articlePaths.length,
      rssItems: rssItems,
      errors: errors,
      items: items
    };
  }

  // ---------- Deduplicação e plano de importação ----------
  function fnv1a(text) {
    var hash = 0x811c9dc5;
    var str = String(text || "");
    for (var i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
    }
    return ("0000000" + hash.toString(16)).slice(-8);
  }

  function contentHash(fields) {
    return fnv1a([fields.titulo, fields.resumo, fields.conteudo, fields.imagem].map(function (v) { return String(v || "").trim(); }).join("␞"));
  }

  function docIdFor(item) { return "noticia_prefeitura_" + item.sourceId; }

  function existingSourceId(doc) {
    if (doc && doc.origemTipo === "prefeitura" && doc.origemId) return String(doc.origemId);
    var parsed = parseNewsUrl(doc && doc.linkOrigem);
    return parsed ? parsed.sourceId : "";
  }

  function titleDateKey(title, date) {
    var day = String(date || "").slice(0, 10);
    var t = normalize(title).replace(/[^a-z0-9]+/g, " ").trim();
    return t && day ? t + "|" + day : "";
  }

  // estado: nova | existente | atualizada | conflito | vinculada
  function planImport(items, existingDocs) {
    var bySource = {};
    var byKey = {};
    (existingDocs || []).forEach(function (doc) {
      var sid = existingSourceId(doc);
      if (sid && !bySource[sid]) bySource[sid] = doc;
      var key = titleDateKey(doc.titulo, doc.publishedAt || doc.data);
      if (key && !byKey[key]) byKey[key] = doc;
    });
    return (items || []).map(function (item) {
      var hash = contentHash(sourceFields(item));
      var doc = bySource[item.sourceId] || byKey[titleDateKey(item.titulo, item.publishedAt)] || null;
      var state = "nova";
      var detail = "Ainda não existe no CMS.";
      if (doc) {
        var imported = doc.origemTipo === "prefeitura";
        if (!imported) {
          state = "vinculada";
          detail = "Já existe no CMS uma notícia ligada a esta publicação (" + (doc.id || "sem id") + "). Não será alterada.";
        } else if (doc.origemHash === hash) {
          state = "existente";
          detail = "Já importada e sem mudanças na origem.";
        } else if (contentHash(doc) === doc.origemHash) {
          state = "atualizada";
          detail = "A Prefeitura alterou a publicação; o CMS não foi editado desde a importação.";
        } else {
          state = "conflito";
          detail = "A Prefeitura alterou a publicação e a notícia também foi editada no CMS. Atualizar sobrescreve a edição.";
        }
      }
      return { item: item, hash: hash, state: state, detail: detail, docId: doc ? doc.id : docIdFor(item) };
    });
  }

  function makeSlug(text) {
    return normalize(text).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
  }

  function excerpt(text, max) {
    var value = String(text || "").split("\n\n")[0].trim();
    if (value.length <= max) return value;
    var cut = value.slice(0, max + 1);
    var space = cut.lastIndexOf(" ");
    return cut.slice(0, space > max * 0.6 ? space : max).replace(/[\s,;:.–—-]+$/, "") + "…";
  }

  function pickCategory(item) {
    var cats = item.categorias || [];
    for (var i = 0; i < cats.length; i += 1) {
      if (STRONG_CATEGORY_RE.test(normalize(cats[i])) || MIXED_CATEGORY_RE.test(normalize(cats[i]))) return cats[i];
    }
    return cats[0] || "Cultura e Turismo";
  }

  // Campos de conteúdo vindos da origem (gravados em create e em atualização).
  function sourceFields(item) {
    var resumo = item.resumo || excerpt(item.conteudo, 220);
    return {
      titulo: item.titulo,
      resumo: resumo,
      conteudo: item.conteudo || resumo,
      imagem: item.imagem || "",
      galeria: (item.galeria || []).slice(0, 12),
      categoria: pickCategory(item),
      linkOrigem: item.link,
      data: item.publishedAt,
      publishedAt: item.publishedAt,
      autor: item.autor || "Prefeitura de São Mateus do Sul",
      origemTipo: "prefeitura",
      origemId: String(item.sourceId),
      origemCategorias: (item.categorias || []).slice(0, 8),
      origemClassificacao: item.classificacao ? item.classificacao.decision : ""
    };
  }

  // Documento completo para uma notícia nova: entra como rascunho, nunca publicada.
  function buildNewDoc(item, extra) {
    var fields = sourceFields(item);
    fields.origemHash = contentHash(fields);
    return Object.assign({
      id: docIdFor(item),
      slug: makeSlug(item.sourceSlug || item.titulo) || docIdFor(item),
      videoUrl: "",
      destaque: false,
      publicado: false,
      status: "rascunho"
    }, fields, extra || {});
  }

  // Atualização de uma notícia já importada: só conteúdo da origem; publicação,
  // destaque e slug ficam como estão no CMS.
  function buildUpdatePatch(item, extra) {
    var fields = sourceFields(item);
    fields.origemHash = contentHash(fields);
    return Object.assign(fields, extra || {});
  }

  function summarize(collected, plan) {
    var items = (collected && collected.items) || [];
    var count = function (fn) { return items.filter(fn).length; };
    var states = {};
    (plan || []).forEach(function (row) { states[row.state] = (states[row.state] || 0) + 1; });
    return {
      encontradas: items.length,
      elegiveis: count(function (i) { return i.classificacao.decision === "elegivel"; }),
      revisao: count(function (i) { return i.classificacao.decision === "revisao"; }),
      descartadas: count(function (i) { return i.classificacao.decision === "descartada"; }),
      estados: states
    };
  }

  return {
    BASE_URL: BASE_URL,
    CATEGORIES: CATEGORIES,
    DEFAULT_CATEGORY_IDS: DEFAULT_CATEGORY_IDS,
    normalize: normalize,
    htmlToText: htmlToText,
    parseNewsUrl: parseNewsUrl,
    parseSourceDate: parseSourceDate,
    parseRss: parseRss,
    parseListing: parseListing,
    parseArticle: parseArticle,
    classify: classify,
    rssPath: rssPath,
    listingPath: listingPath,
    articlePath: articlePath,
    isAllowedPath: isAllowedPath,
    collect: collect,
    contentHash: contentHash,
    docIdFor: docIdFor,
    planImport: planImport,
    buildNewDoc: buildNewDoc,
    buildUpdatePatch: buildUpdatePatch,
    summarize: summarize
  };
});
