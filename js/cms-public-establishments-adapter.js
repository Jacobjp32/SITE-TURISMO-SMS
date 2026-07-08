(function (window) {
  "use strict";

  var COLLECTION = "cms_establishments";
  var STATUS = "published";
  var APP_NAME = "cms-public-establishments-debug";
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

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  function getDebugFlag() {
    var queryDebug = false;
    try {
      var params = new URLSearchParams(window.location.search || "");
      queryDebug = ["1", "true", "yes", "on"].indexOf(String(params.get("cmsDebug") || "").toLowerCase()) !== -1;
    } catch (_) {}

    var storedDebug = false;
    try {
      storedDebug = ["1", "true", "yes", "on"].indexOf(String(window.localStorage.getItem("sms-cms-debug") || "").toLowerCase()) !== -1;
    } catch (_) {}

    return queryDebug || storedDebug;
  }

  function log(debug, message, payload) {
    if (!debug || !window.console || typeof console.info !== "function") return;
    if (payload === undefined) {
      console.info("[cms-public-establishments]", message);
      return;
    }
    console.info("[cms-public-establishments]", message, payload);
  }

  function sanitizeError(error, reason) {
    if (!error && !reason) return null;
    var code = clean(error && (error.code || error.name)) || clean(reason) || "unknown";
    var message = clean(error && error.message) || "Leitura CMS indisponivel.";

    if (code === "permission-denied" || /permission|denied|missing or insufficient/i.test(message)) {
      return {
        code: "permission-denied",
        message: "Leitura publica de cms_establishments ainda nao autorizada pelas rules."
      };
    }

    if (/timeout/i.test(code) || /timeout/i.test(message)) {
      return {
        code: "timeout",
        message: "Tempo limite excedido ao consultar cms_establishments."
      };
    }

    if (/app.?check|recaptcha/i.test(code + " " + message)) {
      return {
        code: "app-check-unavailable",
        message: "App Check indisponivel para leitura publica de diagnostico."
      };
    }

    if (/network|offline|failed to fetch|unavailable/i.test(code + " " + message)) {
      return {
        code: "network-unavailable",
        message: "Rede ou Firestore indisponivel para leitura publica de diagnostico."
      };
    }

    return {
      code: code,
      message: message.slice(0, 220)
    };
  }

  function makeFallback(error, reason) {
    return {
      items: [],
      count: 0,
      source: "fallback",
      collection: COLLECTION,
      queriedStatus: STATUS,
      error: sanitizeError(error, reason),
      generatedAt: new Date().toISOString()
    };
  }

  function withTimeout(promise, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        reject({ code: "timeout", message: "cms_establishments read timeout" });
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

  function isPublicImage(image) {
    if (!image || typeof image !== "object") return false;
    var status = clean(image.status).toLowerCase();
    var source = clean(image.source).toLowerCase();
    var path = clean(image.path);
    var url = clean(image.url);

    if (!url) return false;
    if (status && status !== "active") return false;
    if (source === "submission") return false;
    if (/^submissions\//i.test(path)) return false;
    return true;
  }

  function normalizeImage(image) {
    if (!isPublicImage(image)) return null;
    var normalized = {
      url: clean(image.url),
      alt: clean(image.alt),
      caption: clean(image.caption),
      credit: clean(image.credit),
      source: clean(image.source)
    };

    if (isFiniteNumber(image.position)) {
      normalized.position = image.position;
    }

    return normalized;
  }

  function normalizeGallery(media) {
    return ensureArray(media && media.gallery)
      .map(normalizeImage)
      .filter(Boolean)
      .sort(function (a, b) {
        var posA = isFiniteNumber(a.position) ? a.position : 9999;
        var posB = isFiniteNumber(b.position) ? b.position : 9999;
        return posA - posB;
      });
  }

  function normalizeCoordinates(location) {
    var coords = location && location.coordinates;
    if (!coords || !isFiniteNumber(coords.lat) || !isFiniteNumber(coords.lng)) return null;
    return {
      lat: coords.lat,
      lng: coords.lng
    };
  }

  function normalizeDocument(data, docId) {
    data = data || {};
    if (data.status !== STATUS) return null;

    var content = data.content || {};
    var contact = data.contact || {};
    var location = data.location || {};
    var media = data.media || {};
    var mainImage = normalizeImage(media.mainImage);
    var gallery = normalizeGallery(media);
    var category = {
      id: clean(data.categoryId),
      label: clean(data.categoryLabel),
      original: clean(data.source && data.source.originalCategory)
    };
    var description = clean(content.summary) || clean(content.description);
    var address = clean(location.address);
    var name = clean(data.name);
    var slug = clean(data.slug) || clean(data.id) || clean(docId);
    var id = clean(data.id) || clean(docId);

    if (!id || !name || !category.label) return null;

    return {
      id: id,
      slug: slug,
      name: name,
      nome: name,
      category: category,
      categoria: category.label,
      description: description,
      descricao: description,
      address: address,
      endereco: address,
      localizacao: address,
      coordinates: normalizeCoordinates(location),
      coordenadas: normalizeCoordinates(location),
      contact: {
        phone: clean(contact.phone),
        whatsapp: clean(contact.whatsapp),
        email: clean(contact.email),
        website: clean(contact.website),
        instagram: clean(contact.instagram),
        facebook: clean(contact.facebook)
      },
      media: {
        mainImage: mainImage,
        gallery: gallery
      },
      imagem: mainImage ? mainImage.url : "",
      galeria: gallery.map(function (item) { return item.url; }),
      tags: ensureArray(content.tags).map(clean).filter(Boolean),
      status: STATUS,
      source: COLLECTION
    };
  }

  async function ensureFirestore(debug) {
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
      try {
        await appCheckMod.initModularAppCheck(app);
      } catch (error) {
        log(debug, "App Check indisponivel; seguindo para fallback se a leitura falhar.", sanitizeError(error));
      }
    }

    return {
      db: fsMod.getFirestore(app),
      fs: fsMod
    };
  }

  async function readPublished(options) {
    options = options || {};
    var debug = options.debug === true || getDebugFlag();
    var timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;

    if (inflight && options.force !== true) return inflight;

    inflight = withTimeout((async function () {
      try {
        var ctx = await ensureFirestore(debug);
        var q = ctx.fs.query(
          ctx.fs.collection(ctx.db, COLLECTION),
          ctx.fs.where("status", "==", STATUS)
        );
        var snapshot = await ctx.fs.getDocs(q);
        var items = [];

        snapshot.forEach(function (doc) {
          var item = normalizeDocument(doc.data(), doc.id);
          if (item) items.push(item);
        });

        if (!items.length) {
          lastResult = {
            items: [],
            count: 0,
            source: COLLECTION,
            collection: COLLECTION,
            queriedStatus: STATUS,
            state: "empty-published",
            message: "Leitura permitida, mas nao ha empreendimentos published.",
            error: null,
            generatedAt: new Date().toISOString()
          };
          log(debug, "leitura permitida sem published", lastResult);
          return lastResult;
        }

        lastResult = {
          items: items,
          count: items.length,
          source: COLLECTION,
          collection: COLLECTION,
          queriedStatus: STATUS,
          state: "success",
          message: "Leitura concluida.",
          error: null,
          generatedAt: new Date().toISOString()
        };
        log(debug, "leitura concluida", { count: items.length });
        return lastResult;
      } catch (error) {
        lastResult = makeFallback(error);
        log(debug, "fallback por falha", lastResult);
        return lastResult;
      }
    })(), timeoutMs).catch(function (error) {
      lastResult = makeFallback(error);
      log(debug, "fallback por timeout/falha", lastResult);
      return lastResult;
    }).finally(function () {
      inflight = null;
    });

    return inflight;
  }

  function autoRunIfDebug() {
    if (!getDebugFlag()) return;
    readPublished({ debug: true }).then(function (result) {
      window.CMSPublicEstablishmentsDebugResult = result;
    });
  }

  window.CMSPublicEstablishmentsAdapter = {
    collection: COLLECTION,
    status: STATUS,
    isDebugEnabled: getDebugFlag,
    normalizeDocument: normalizeDocument,
    readPublished: readPublished,
    load: readPublished,
    getLastResult: function () {
      return lastResult;
    },
    makeFallback: makeFallback
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoRunIfDebug);
  } else {
    autoRunIfDebug();
  }
})(window);
