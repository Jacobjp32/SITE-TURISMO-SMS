/**
 * Atribuição de imagens do portal (crédito, fonte, licença e modificações).
 *
 * Duas origens, combinadas por URL da imagem:
 *  1. CMS — `media.mainImage.credit` / `media.gallery[].credit` / `caption`
 *     (texto livre, editado no painel; tratado como entrada não confiável).
 *  2. REGISTRY (abaixo) — dados estruturados de licença por arquivo do portal
 *     (autor, fonte e link, licença e link, modificações). Fica versionado junto
 *     com as imagens em images/; o esquema de imagem do Firestore não tem esses
 *     campos e ampliá-lo exige publicar Rules (bloco próprio).
 *
 * Os links só vêm do REGISTRY e só são aceitos com https://. Todo texto é escapado.
 * Usado por local.html, js/public-establishments-renderer.js, js/mapa-turistico.js
 * e pelo painel (js/admin/modules/empreendimentos.js).
 */
(function (root) {
  "use strict";

  var SITE_ORIGIN = "https://turismo.saomateusdosul.pr.gov.br";
  var LANGS = ["pt", "en", "es", "pl"];

  var STRINGS = {
    pt: { photo: "Foto", source: "Fonte", license: "Licença", changes: "Modificações", credits: "Créditos das fotos", opensNewTab: "abre em nova aba" },
    en: { photo: "Photo", source: "Source", license: "License", changes: "Changes", credits: "Photo credits", opensNewTab: "opens in a new tab" },
    es: { photo: "Foto", source: "Fuente", license: "Licencia", changes: "Modificaciones", credits: "Créditos de las fotos", opensNewTab: "se abre en una pestaña nueva" },
    pl: { photo: "Zdjęcie", source: "Źródło", license: "Licencja", changes: "Zmiany", credits: "Autorzy zdjęć", opensNewTab: "otwiera się w nowej karcie" }
  };

  var AEN_TERMS = "https://www.parana.pr.gov.br/servicos/Servicos/Canais-de-Comunicacao/Acessar-a-Agencia-de-Noticias-do-Parana-Ok3b6P3b";
  var AEN_ARTICLE = "https://www.parana.pr.gov.br/aen/Noticia/Tradicional-erva-mate-de-Sao-Mateus-do-Sul-se-reinventa-e-ganha-novos-mercados";
  var AEN_LICENSE = {
    pt: "Reprodução permitida com indicação da fonte",
    en: "Reproduction permitted with source credit",
    es: "Reproducción permitida citando la fuente",
    pl: "Powielanie dozwolone z podaniem źródła"
  };
  var AEN_LICENSE_SHORT = {
    pt: "uso com crédito",
    en: "use with credit",
    es: "uso con crédito",
    pl: "użycie z podaniem źródła"
  };
  var CC_BY_SA_40 = "https://creativecommons.org/licenses/by-sa/4.0/";
  var WEBP_RESIZED = {
    pt: "redimensionada e convertida para WebP",
    en: "resized and converted to WebP",
    es: "redimensionada y convertida a WebP",
    pl: "zmniejszone i przekonwertowane do WebP"
  };
  var WEBP_ONLY = {
    pt: "convertida para WebP",
    en: "converted to WebP",
    es: "convertida a WebP",
    pl: "przekonwertowane do WebP"
  };

  function aen(file) {
    return {
      author: "Gilson Abreu/AEN",
      sourceName: "Agência Estadual de Notícias do Paraná (AEN)",
      sourceShort: "AEN",
      sourceUrl: AEN_ARTICLE,
      sourceFile: "https://www.parana.pr.gov.br/sites/default/arquivos_restritos/files/imagem/2023-10/" + file,
      license: AEN_LICENSE,
      licenseLabel: AEN_LICENSE_SHORT,
      licenseUrl: AEN_TERMS,
      modifications: WEBP_RESIZED
    };
  }

  function commonsMenegati(title, fileTitle) {
    return {
      author: "Simplus Menegati",
      title: title,
      sourceName: "Wikimedia Commons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:" + fileTitle,
      license: "CC BY-SA 4.0",
      licenseShort: "CC BY-SA 4.0",
      licenseUrl: CC_BY_SA_40,
      modifications: WEBP_ONLY
    };
  }

  // Chave: caminho relativo do arquivo no portal (sem origem, barra inicial ou query).
  // Autoria e licença conferidas na fonte em 2026-10-15.
  var REGISTRY = {
    "images/empreendimentos/ervateira-baldo/ervateira-baldo-01.webp": aen("erva_mate_baldo_sao_mateus-3.jpg"),
    "images/empreendimentos/ervateira-baldo/ervateira-baldo-02.webp": aen("erva_mate_baldo_sao_mateus-8.jpg"),
    "images/empreendimentos/ervateira-baldo/ervateira-baldo-03.webp": aen("leandro_beninho_gheno002.jpg"),
    "images/empreendimentos/ervateira-baldo/ervateira-baldo-04.webp": aen("erva_mate_baldo_sao_mateus-11.jpg"),
    "images/empreendimentos/ervateira-taquaral/ervateira-taquaral-01.webp": commonsMenegati(
      "Embalagem de erva-mate para chimarrão em São Mateus do Sul, Paraná",
      "Embalagem_de_erva-mate_para_chimarr%C3%A3o_em_S%C3%A3o_Mateus_do_Sul,_Paran%C3%A1.jpg"
    ),
    "images/empreendimentos/ervateira-taquaral/ervateira-taquaral-02.webp": commonsMenegati(
      "Embalagem de erva-mate para chimarrão em São Mateus do Sul, Paraná (2)",
      "Embalagem_de_erva-mate_para_chimarr%C3%A3o_em_S%C3%A3o_Mateus_do_Sul,_Paran%C3%A1.2.jpg"
    )
  };

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeHttps(value) {
    var raw = clean(value);
    if (!/^https:\/\/[^\s"'<>\\]+$/i.test(raw)) return "";
    try {
      var parsed = new URL(raw);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.href : "";
    } catch (error) {
      return "";
    }
  }

  function normalizeKey(url) {
    var raw = clean(url);
    if (!raw) return "";
    if (raw.toLowerCase().indexOf(SITE_ORIGIN) === 0) raw = raw.slice(SITE_ORIGIN.length);
    raw = raw.split("#")[0].split("?")[0].replace(/^(?:\.\/)+/, "").replace(/^\/+/, "");
    try { raw = decodeURI(raw); } catch (error) { /* mantém como veio */ }
    return raw;
  }

  function detectLang() {
    var stored = "";
    try { stored = root.localStorage && root.localStorage.getItem("sms-lang") || ""; } catch (error) { stored = ""; }
    var nav = root.navigator && root.navigator.language || "pt";
    var lang = String(stored || nav || "pt").toLowerCase().split("-")[0];
    return LANGS.indexOf(lang) !== -1 ? lang : "pt";
  }

  function langOf(lang) {
    var normalized = String(lang || "").toLowerCase().split("-")[0];
    return LANGS.indexOf(normalized) !== -1 ? normalized : detectLang();
  }

  function localized(value, lang) {
    if (!value) return "";
    if (typeof value === "string") return clean(value);
    return clean(value[lang] || value.pt || "");
  }

  // "Foto: Fulano" vindo do CMS vira "Fulano"; o prefixo é recolocado no idioma da página.
  function stripCreditPrefix(value) {
    return clean(value).replace(/^(?:fotos?|photos?|zdj[eę]cie|cr[eé]ditos?|credits?|imagem|image)\s*[:\-–—]\s*/i, "");
  }

  function lookup(url) {
    var key = normalizeKey(url);
    return key && Object.prototype.hasOwnProperty.call(REGISTRY, key) ? REGISTRY[key] : null;
  }

  /**
   * Junta o crédito do CMS com o registro. Retorna null se não houver nada a mostrar.
   * `image` pode ser string (URL) ou objeto { url, credit, caption }.
   */
  function resolve(image) {
    var record = typeof image === "string" ? { url: image } : (image && typeof image === "object" ? image : null);
    if (!record) return null;
    var entry = lookup(record.url);
    var cmsCredit = stripCreditPrefix(record.credit);
    var author = entry ? clean(entry.author) : cmsCredit;
    var caption = clean(record.caption);
    if (!author && !caption && !entry) return null;
    return {
      url: clean(record.url),
      author: author,
      caption: caption,
      title: entry ? clean(entry.title) : "",
      sourceName: entry ? clean(entry.sourceName) : "",
      sourceShort: entry ? clean(entry.sourceShort) : "",
      sourceUrl: entry ? safeHttps(entry.sourceUrl) : "",
      license: entry ? entry.license || "" : "",
      licenseLabel: entry ? entry.licenseLabel || "" : "",
      licenseShort: entry ? clean(entry.licenseShort) : "",
      licenseUrl: entry ? safeHttps(entry.licenseUrl) : "",
      modifications: entry ? entry.modifications || "" : "",
      registered: !!entry
    };
  }

  // Procura o registro da imagem (capa ou galeria) no item do catálogo público.
  function forItemImage(item, url) {
    var key = normalizeKey(url);
    if (!key) return null;
    var media = item && item.media || {};
    var candidates = [media.mainImage].concat(Array.isArray(media.gallery) ? media.gallery : []);
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      if (candidate && typeof candidate === "object" && normalizeKey(candidate.url) === key) {
        var resolved = resolve(candidate);
        if (resolved && (resolved.author || resolved.registered)) return resolved;
      }
    }
    var fromRegistry = resolve(url);
    return fromRegistry && fromRegistry.registered ? fromRegistry : null;
  }

  function hasCredit(attr) {
    return !!(attr && (attr.author || attr.registered));
  }

  // Linha curta sem links (para cards e botões, onde não cabe link aninhado).
  function text(attr, lang) {
    if (!hasCredit(attr)) return "";
    var s = STRINGS[langOf(lang)];
    var parts = [];
    if (attr.author) parts.push(s.photo + ": " + attr.author);
    var license = attr.licenseShort;
    if (license) parts.push(license);
    return parts.join(" · ");
  }

  // `fullLabel` vai no aria-label quando o texto visível é a forma curta.
  function link(href, label, lang, rel, fullLabel) {
    var safe = safeHttps(href);
    if (!safe) return escapeHtml(label);
    var s = STRINGS[langOf(lang)];
    return '<a href="' + escapeHtml(safe) + '" target="_blank" rel="' + (rel || "noopener noreferrer") + '" aria-label="' +
      escapeHtml((fullLabel || label) + " (" + s.opensNewTab + ")") + '">' + escapeHtml(label) + "</a>";
  }

  // Linha com links: autor, fonte, licença e modificações. Por padrão usa rótulos curtos
  // (ficha, mapa); `full` mostra os nomes completos (imagem ampliada).
  function html(attr, lang, mode) {
    if (!hasCredit(attr)) return "";
    var l = langOf(lang);
    var s = STRINGS[l];
    var full = mode === "full";
    var parts = [];
    if (attr.author) parts.push(escapeHtml(s.photo) + ": " + escapeHtml(attr.author));
    if (attr.sourceName) {
      var sourceLabel = full ? attr.sourceName : (attr.sourceShort || attr.sourceName);
      parts.push(escapeHtml(s.source) + ": " + (attr.sourceUrl ? link(attr.sourceUrl, sourceLabel, l, "", attr.sourceName) : escapeHtml(sourceLabel)));
    }
    var license = localized(attr.license, l);
    var licenseLabel = full ? license : (localized(attr.licenseLabel, l) || license);
    if (license) parts.push(escapeHtml(s.license) + ": " + (attr.licenseUrl ? link(attr.licenseUrl, licenseLabel, l, "license noopener noreferrer", license) : escapeHtml(licenseLabel)));
    var changes = localized(attr.modifications, l);
    if (changes) parts.push(escapeHtml(s.changes) + ": " + escapeHtml(changes));
    return parts.join(" · ");
  }

  function label(key, lang) {
    var s = STRINGS[langOf(lang)];
    return s[key] || STRINGS.pt[key] || key;
  }

  var api = {
    REGISTRY: REGISTRY,
    normalizeKey: normalizeKey,
    lookup: lookup,
    resolve: resolve,
    forItemImage: forItemImage,
    hasCredit: hasCredit,
    text: text,
    html: html,
    label: label,
    lang: detectLang,
    safeHttps: safeHttps,
    escapeHtml: escapeHtml
  };

  root.SMSImageAttribution = api;
})(typeof window !== "undefined" ? window : globalThis);
