(function (window) {
  "use strict";

  var COLLECTION = "rotas";
  var STATUS = "published";
  var APP_NAME = "cms-public-routes";
  var DEFAULT_TIMEOUT_MS = 8000;
  var FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  var FIREBASE_FS_URL = "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
  var APP_CHECK_MODULE = "./firebase-app-check.js";
  var inflight = null;
  var lastResult = null;

  function clean(value) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u001F\u007F]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cloneArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function sanitizeError(error) {
    var code = clean(error && (error.code || error.name)) || "unknown";
    var message = clean(error && error.message) || "Leitura publica de rotas indisponivel.";

    if (code === "permission-denied" || /permission|denied|missing or insufficient/i.test(message)) {
      return { code: "permission-denied", message: "Leitura publica de rotas nao autorizada pelas rules." };
    }
    if (/timeout/i.test(code + " " + message)) {
      return { code: "timeout", message: "Tempo limite excedido ao consultar rotas." };
    }
    if (/app.?check|recaptcha/i.test(code + " " + message)) {
      return { code: "app-check-unavailable", message: "App Check indisponivel para leitura publica de rotas." };
    }
    if (/network|offline|failed to fetch|unavailable/i.test(code + " " + message)) {
      return { code: "network-unavailable", message: "Rede ou Firestore indisponivel para leitura publica de rotas." };
    }
    return { code: code, message: message.slice(0, 220) };
  }

  function staticRoutes() {
    return cloneArray(window.TURISMO_ROTAS).map(function (item) {
      return Object.assign({}, item, {
        slug: clean(item && (item.slug || item.id)),
        status: STATUS,
        url: "/mapa-turistico?grupo=roteiros&rota=" + encodeURIComponent(clean(item && (item.slug || item.id)))
      });
    });
  }

  function makeTechnicalFailure(error) {
    var sanitized = sanitizeError(error);
    var items = staticRoutes();
    return {
      items: items,
      count: items.length,
      authoritativeCount: null,
      source: "static-fallback",
      state: "TECHNICAL_FAILURE",
      collection: COLLECTION,
      queriedStatus: STATUS,
      fallbackReason: sanitized.code,
      error: sanitized
    };
  }

  function normalizeDocument(data, docId) {
    data = data || {};
    if (data.status !== STATUS) return null;

    var id = clean(data.id) || clean(docId);
    var slug = clean(data.slug) || id;
    var name = clean(data.name);
    var category = clean(data.category);
    var description = clean(data.description);
    var color = clean(data.color);
    var icon = clean(data.icon);
    var coverUrl = clean(data.cover && data.cover.url);
    if (!id || !slug || !name || !category || !description || !color || !icon || !coverUrl) return null;

    return {
      id: id,
      slug: slug,
      nome: name,
      categoria: category,
      descricao: description,
      imagem: coverUrl,
      galeria: [coverUrl],
      url: "/mapa-turistico?grupo=roteiros&rota=" + encodeURIComponent(slug),
      cor: color,
      icone: icon,
      tags: cloneArray(data.tags).filter(function (tag) { return typeof tag === "string"; }),
      status: STATUS,
      _displayOrder: typeof data.displayOrder === "number" ? data.displayOrder : Number.MAX_SAFE_INTEGER
    };
  }

  function resolveDocuments(documents) {
    documents = Array.isArray(documents) ? documents : [];
    if (!documents.length) {
      return {
        items: [], count: 0, authoritativeCount: 0, source: "firestore",
        state: "AUTHORITATIVE_EMPTY", collection: COLLECTION, queriedStatus: STATUS,
        fallbackReason: null, error: null
      };
    }

    var malformed = 0;
    var items = documents.map(function (entry) {
      var item = normalizeDocument(entry && entry.data, entry && entry.id);
      if (!item) malformed += 1;
      return item;
    }).filter(Boolean);

    if (malformed) {
      return makeTechnicalFailure({ code: "malformed-route", message: "Documento published de rota invalido." });
    }

    var ids = {};
    var slugs = {};
    var duplicateIdentity = items.some(function (item) {
      if (ids[item.id] || slugs[item.slug]) return true;
      ids[item.id] = true;
      slugs[item.slug] = true;
      return false;
    });
    if (duplicateIdentity) {
      return makeTechnicalFailure({ code: "duplicate-route-identity", message: "IDs ou slugs de rotas published duplicados." });
    }

    items.sort(function (a, b) {
      return a._displayOrder - b._displayOrder || a.nome.localeCompare(b.nome, "pt-BR");
    }).forEach(function (item) { delete item._displayOrder; });

    return {
      items: items, count: items.length, authoritativeCount: items.length, source: "firestore",
      state: "SUCCESS", collection: COLLECTION, queriedStatus: STATUS,
      fallbackReason: null, error: null
    };
  }

  function withTimeout(promise, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        reject({ code: "timeout", message: "rotas read timeout" });
      }, timeoutMs);
      promise.then(function (value) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      }).catch(function (error) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(error);
      });
    });
  }

  async function ensureFirestore() {
    if (!window.CONFIG || !window.CONFIG.firebase) {
      throw { code: "config-missing", message: "CONFIG.firebase ausente" };
    }
    var mods = await Promise.all([
      import(FIREBASE_APP_URL),
      import(FIREBASE_FS_URL),
      import(APP_CHECK_MODULE).catch(function () { return null; })
    ]);
    var appMod = mods[0];
    var fsMod = mods[1];
    var appCheckMod = mods[2];
    var existing = appMod.getApps().find(function (app) { return app.name === APP_NAME; });
    var app = existing || appMod.initializeApp(window.CONFIG.firebase, APP_NAME);
    if (appCheckMod && typeof appCheckMod.initModularAppCheck === "function") {
      try { await appCheckMod.initModularAppCheck(app); } catch (_) {}
    }
    return { db: fsMod.getFirestore(app), fs: fsMod };
  }

  async function queryPublished() {
    var ctx = await ensureFirestore();
    var q = ctx.fs.query(
      ctx.fs.collection(ctx.db, COLLECTION),
      ctx.fs.where("status", "==", STATUS)
    );
    var snapshot = await ctx.fs.getDocs(q);
    var documents = [];
    snapshot.forEach(function (doc) { documents.push({ id: doc.id, data: doc.data() }); });
    return documents;
  }

  async function readPublished(options) {
    options = options || {};
    var timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;
    if (inflight && options.force !== true) return inflight;
    var reader = typeof options.reader === "function" ? options.reader : queryPublished;

    inflight = withTimeout(Promise.resolve().then(reader), timeoutMs)
      .then(resolveDocuments)
      .catch(makeTechnicalFailure)
      .then(function (result) { lastResult = result; return result; })
      .finally(function () { inflight = null; });
    return inflight;
  }

  window.CMSPublicRoutesAdapter = {
    collection: COLLECTION,
    status: STATUS,
    normalizeDocument: normalizeDocument,
    resolveDocuments: resolveDocuments,
    makeTechnicalFailure: makeTechnicalFailure,
    readPublished: readPublished,
    load: readPublished,
    getLastResult: function () { return lastResult; }
  };
})(window);
