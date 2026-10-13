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
    var sanitizedError = sanitizeError(error, reason) || {
      code: "unknown",
      message: "Leitura CMS indisponivel."
    };
    return {
      items: [],
      count: 0,
      authoritativeCount: null,
      rejectedCount: 0,
      rejections: [],
      source: "static-fallback",
      state: "TECHNICAL_FAILURE",
      collection: COLLECTION,
      queriedStatus: STATUS,
      fallbackReason: sanitizedError.code,
      error: sanitizedError,
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

  function normalizeStringList(value) {
    var seen = {};
    return ensureArray(value).map(function (item) {
      return typeof item === "string" ? clean(item) : "";
    }).filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function diagnoseDocument(data, docId) {
    data = data || {};
    var reasons = [];
    if (data.status !== STATUS) reasons.push("STATUS_NOT_PUBLISHED");
    if (!clean(data.id) && !clean(docId)) reasons.push("MISSING_ID");
    if (!clean(data.name)) reasons.push("MISSING_NAME");
    if (!clean(data.categoryLabel)) reasons.push("MISSING_CATEGORY_LABEL");
    return {
      accepted: reasons.length === 0,
      reasons: reasons
    };
  }

  function normalizeDocument(data, docId) {
    data = data || {};
    if (!diagnoseDocument(data, docId).accepted) return null;

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
    var summary = clean(content.summary);
    var description = clean(content.description) || summary;
    var longDescription = clean(content.longDescription);
    var openingHours = clean(content.openingHours);
    var accessibility = clean(content.accessibility);
    var tags = normalizeStringList(content.tags);
    var address = clean(location.address);
    var name = clean(data.name);
    var slug = clean(data.slug) || clean(data.id) || clean(docId);
    var id = clean(data.id) || clean(docId);
    var routeIds = normalizeStringList(data.relationships && data.relationships.routeIds);
    var display = data.display && typeof data.display === "object" ? data.display : {};
    var seo = data.seo && typeof data.seo === "object" ? data.seo : {};
    var coordinates = normalizeCoordinates(location);
    var publicUrl = clean(seo.canonicalPath) || "/local?id=" + encodeURIComponent(slug || id);

    return {
      id: id,
      slug: slug,
      name: name,
      nome: name,
      category: category,
      categoria: category.label,
      description: description,
      descricao: description,
      summary: summary,
      content: {
        summary: summary,
        description: description,
        longDescription: longDescription,
        openingHours: openingHours,
        accessibility: accessibility,
        tags: tags.slice()
      },
      address: address,
      endereco: address,
      localizacao: address,
      coordinates: coordinates,
      coordenadas: coordinates,
      lat: coordinates ? coordinates.lat : null,
      lng: coordinates ? coordinates.lng : null,
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
      location: {
        address: address,
        neighborhood: clean(location.neighborhood),
        city: clean(location.city),
        state: clean(location.state),
        postalCode: clean(location.postalCode),
        coordinates: coordinates,
        mapsUrl: clean(location.mapsUrl)
      },
      imagem: mainImage ? mainImage.url : "",
      galeria: gallery.map(function (item) { return item.url; }),
      tags: tags,
      subtitulo: summary,
      historia: longDescription,
      descricaoLonga: longDescription,
      horario: openingHours,
      acessibilidade: accessibility,
      telefone: clean(contact.phone),
      whatsapp: clean(contact.whatsapp),
      email: clean(contact.email),
      site: clean(contact.website),
      instagram: clean(contact.instagram),
      facebook: clean(contact.facebook),
      mapsUrl: clean(location.mapsUrl),
      relationships: {
        routeIds: routeIds.slice()
      },
      routeIds: routeIds.slice(),
      rota: routeIds.join(" · "),
      display: {
        featured: display.featured === true,
        priority: isFiniteNumber(display.priority) ? display.priority : 0,
        mapVisible: display.mapVisible !== false,
        claimable: display.claimable !== false
      },
      seo: {
        title: clean(seo.title),
        description: clean(seo.description),
        canonicalPath: clean(seo.canonicalPath)
      },
      url: publicUrl,
      status: STATUS,
      source: COLLECTION
    };
  }

  function resolveDocuments(documents) {
    documents = ensureArray(documents);
    if (!documents.length) {
      return {
        items: [],
        count: 0,
        authoritativeCount: 0,
        rejectedCount: 0,
        rejections: [],
        source: "firestore",
        state: "AUTHORITATIVE_EMPTY",
        collection: COLLECTION,
        queriedStatus: STATUS,
        fallbackReason: null,
        message: "Leitura permitida, mas nao ha empreendimentos published.",
        error: null,
        generatedAt: new Date().toISOString()
      };
    }

    var items = [];
    var rejections = [];
    documents.forEach(function (entry) {
      var docId = clean(entry && entry.id);
      var data = entry && entry.data || {};
      var diagnosis = diagnoseDocument(data, docId);
      var item = diagnosis.accepted ? normalizeDocument(data, docId) : null;
      if (item) items.push(item);
      else rejections.push({ id: docId, reasons: diagnosis.reasons.slice() });
    });

    return {
      items: items,
      count: items.length,
      authoritativeCount: documents.length,
      rejectedCount: rejections.length,
      rejections: rejections,
      source: "firestore",
      state: rejections.length
        ? (items.length ? "AUTHORITATIVE_PARTIAL" : "AUTHORITATIVE_INVALID")
        : "SUCCESS",
      collection: COLLECTION,
      queriedStatus: STATUS,
      fallbackReason: null,
      message: rejections.length
        ? "Leitura concluida com documentos published rejeitados pelo contrato publico."
        : "Leitura concluida.",
      error: null,
      generatedAt: new Date().toISOString()
    };
  }

  function localEmulatorRequested() {
    try {
      return /^(?:localhost|127\.0\.0\.1)$/.test(window.location.hostname || "") &&
        new URLSearchParams(window.location.search || "").get("emulator") === "1";
    } catch (_) {
      return false;
    }
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
    var useEmulator = localEmulatorRequested();
    var runtimeConfig = useEmulator
      ? Object.assign({}, window.CONFIG.firebase, {
          projectId: "demo-turismo-sms-admin-finalization",
          authDomain: "demo-turismo-sms-admin-finalization.firebaseapp.com",
          storageBucket: "demo-turismo-sms-admin-finalization.appspot.com"
        })
      : window.CONFIG.firebase;
    var existing = appMod.getApps().find(function (app) { return app.name === APP_NAME; });
    var app = existing || appMod.initializeApp(runtimeConfig, APP_NAME);
    var db = useEmulator && !existing
      ? fsMod.initializeFirestore(app, { experimentalForceLongPolling: true })
      : fsMod.getFirestore(app);

    if (useEmulator && !existing) {
      fsMod.connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }

    if (!useEmulator && appCheckMod && typeof appCheckMod.initModularAppCheck === "function") {
      try {
        await appCheckMod.initModularAppCheck(app);
      } catch (error) {
        log(debug, "App Check indisponivel; seguindo para fallback se a leitura falhar.", sanitizeError(error));
      }
    }

    return {
      db: db,
      fs: fsMod
    };
  }

  async function queryPublished(debug) {
    var ctx = await ensureFirestore(debug);
    var q = ctx.fs.query(
      ctx.fs.collection(ctx.db, COLLECTION),
      ctx.fs.where("status", "==", STATUS)
    );
    var snapshot = await ctx.fs.getDocs(q);
    // Sem servidor (rede bloqueada, offline, erro), o SDK devolve o cache local — vazio
    // nesta página. Isso não prova ausência de registros publicados: tratar como falha
    // técnica preserva o snapshot oficial estático em vez de esvaziar o catálogo.
    if (snapshot && snapshot.metadata && snapshot.metadata.fromCache === true) {
      throw { code: "unavailable", message: "Resultado apenas do cache local; servidor inacessivel." };
    }
    var documents = [];
    snapshot.forEach(function (doc) {
      documents.push({ id: doc.id, data: doc.data() });
    });
    return documents;
  }

  async function readPublished(options) {
    options = options || {};
    var debug = options.debug === true || getDebugFlag();
    var timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;

    if (inflight && options.force !== true) return inflight;

    var reader = typeof options.reader === "function" ? options.reader : function () {
      return queryPublished(debug);
    };
    inflight = withTimeout(Promise.resolve().then(reader), timeoutMs).then(function (documents) {
      lastResult = resolveDocuments(documents);
      log(debug, "leitura concluida", {
        state: lastResult.state,
        count: lastResult.count,
        rejectedCount: lastResult.rejectedCount
      });
      return lastResult;
    }).catch(function (error) {
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
    diagnoseDocument: diagnoseDocument,
    normalizeDocument: normalizeDocument,
    resolveDocuments: resolveDocuments,
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
