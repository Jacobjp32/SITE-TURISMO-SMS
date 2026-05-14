(function () {
  "use strict";

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function cloneItem(item) {
    return JSON.parse(JSON.stringify(item || {}));
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  function getCoordinates(item) {
    if (isFiniteNumber(item && item.lat) && isFiniteNumber(item && item.lng)) {
      return { lat: item.lat, lng: item.lng };
    }
    if (item && item.coordenadas && isFiniteNumber(item.coordenadas.lat) && isFiniteNumber(item.coordenadas.lng)) {
      return { lat: item.coordenadas.lat, lng: item.coordenadas.lng };
    }
    return { lat: null, lng: null };
  }

  function hasCoordinates(item) {
    var coordinates = getCoordinates(item);
    return isFiniteNumber(coordinates.lat) && isFiniteNumber(coordinates.lng);
  }

  function classifyBroadCategory(itemType, item) {
    var rawCategory = item && item.categoria;
    var source = normalizeText([
      rawCategory,
      item && item.nome,
      item && item.descricao,
      Array.isArray(item && item.tags) ? item.tags.join(" ") : item && item.tags
    ].join(" "));
    var normalizedCategory = normalizeText(rawCategory);

    if (normalizedCategory.indexOf("historia") !== -1) return "history";
    if (normalizedCategory.indexOf("cultura") !== -1 || normalizedCategory.indexOf("cultural") !== -1) return "culture";
    if (normalizedCategory.indexOf("natureza") !== -1) return "nature";
    if (normalizedCategory.indexOf("gastronomia") !== -1 || normalizedCategory.indexOf("gastronom") !== -1) return "gastronomy";
    if (normalizedCategory.indexOf("hospedagem") !== -1) return "lodging";
    if (normalizedCategory.indexOf("evento") !== -1) return "events";
    if (normalizedCategory.indexOf("servico") !== -1 || normalizedCategory.indexOf("institucional") !== -1) return "services";

    if (itemType === "hospedagem") return "lodging";
    if (itemType === "restaurante") return "gastronomy";
    if (itemType === "evento") return "events";
    if (itemType === "servico") return "services";

    if (source.indexOf("historia") !== -1 || source.indexOf("historico") !== -1 || source.indexOf("patrimonio") !== -1 || source.indexOf("memoria") !== -1 || source.indexOf("vapor") !== -1) {
      return "history";
    }
    if (source.indexOf("natureza") !== -1 || source.indexOf("rio") !== -1 || source.indexOf("iguacu") !== -1 || source.indexOf("lazer") !== -1 || source.indexOf("parque") !== -1 || source.indexOf("mirante") !== -1) {
      return "nature";
    }
    if (source.indexOf("gastronomia") !== -1 || source.indexOf("erva-mate") !== -1 || source.indexOf("mate") !== -1 || source.indexOf("chimarrao") !== -1 || source.indexOf("culinaria") !== -1 || source.indexOf("sabores") !== -1) {
      return "gastronomy";
    }
    if (source.indexOf("evento") !== -1 || source.indexOf("agenda") !== -1 || source.indexOf("festa") !== -1) {
      return "events";
    }
    if (source.indexOf("servico") !== -1 || source.indexOf("atendimento") !== -1 || source.indexOf("contato") !== -1 || source.indexOf("informacoes") !== -1 || source.indexOf("roteiro") !== -1 || source.indexOf("institucional") !== -1) {
      return "services";
    }

    if (itemType === "rota") return "culture";
    return "culture";
  }

  function collectBroadCategories(snapshot) {
    var categoryOrder = ["history", "culture", "nature", "gastronomy", "lodging", "events", "services"];
    var found = {};
    var collections = [
      { key: "pontos", itemType: "ponto" },
      { key: "rotas", itemType: "rota" },
      { key: "hospedagens", itemType: "hospedagem" },
      { key: "restaurantes", itemType: "restaurante" },
      { key: "eventos", itemType: "evento" },
      { key: "informacoesEssenciais", itemType: "servico" }
    ];

    collections.forEach(function (entry) {
      ensureArray(snapshot[entry.key]).forEach(function (item) {
        var broadCategory = classifyBroadCategory(entry.itemType, item);
        if (broadCategory) {
          found[broadCategory] = true;
        }
      });
    });

    return categoryOrder.filter(function (categoryId) {
      return !!found[categoryId];
    });
  }

  function uniqueTags() {
    var values = [];
    Array.prototype.slice.call(arguments).forEach(function (entry) {
      if (!entry) return;
      if (Array.isArray(entry)) {
        entry.forEach(function (item) {
          values.push(String(item || ""));
        });
        return;
      }
      values.push(String(entry));
    });

    var seen = {};
    return values.map(function (item) {
      return item.trim();
    }).filter(function (item) {
      var key = normalizeText(item);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function classifyLegacyCategory(item, sourceType) {
    var source = normalizeText([
      item.nome || item.name,
      item.categoria,
      item.subtitulo || item.subtitle,
      item.descricao || item.desc,
      item.badge,
      item.route,
      item.rota,
      item.location,
      item.localizacao,
      item.endereco
    ].join(" "));
    var routeKey = normalizeText(item.route || item.rota || "");

    if (/hotel|pousada|hosped/.test(source)) return "Hospedagem";
    if (/restaurante|churrascaria|cafe|cafeteria|queij|doces|gastronom|almoco|jantar|cervej|vinho|vinicola|parada pinoli|parada do chimarrao|delicias/.test(source)) return "Gastronomia";
    if (/institucional|prefeitura|paco municipal|contato|atendimento|posto pelanda|servico/.test(source)) return "Serviços";
    if (/historia|historico|patrimonio|museu|memoria|cabana campo de telha/.test(source)) return "História";
    if (/evento|show|arena cultural|ginasio/.test(source)) return "Cultura";
    if (/natureza|rio|iguacu|trilha|pesqueiro|marina|sitio|viveiro|equoterapia|cavalo|all garden|lazer|propriedade|parque/.test(source)) return "Natureza";
    if (/igreja|polonesa|erva mate|chimarrao|coral|danca|artesan|cultura|ervateira/.test(source)) return "Cultura";

    if (routeKey === "sabores") return "Gastronomia";
    if (routeKey === "mate" || routeKey === "polonesa") return "Cultura";
    if (routeKey === "aguas" || routeKey === "terra") return "Natureza";

    return sourceType === "local" ? "Cultura" : "Serviços";
  }

  function getCollectionName(category) {
    if (category === "Hospedagem") return "hospedagens";
    if (category === "Gastronomia") return "restaurantes";
    if (category === "Serviços" || category === "Institucional") return "informacoesEssenciais";
    return "pontos";
  }

  function buildLegacyLocalItem(item) {
    var category = classifyLegacyCategory(item, "local");
    return {
      id: item.id,
      nome: item.nome,
      categoria: category,
      descricao: item.descricao || item.historia || "",
      imagem: item.imagem || "",
      url: item.id ? "/local?id=" + item.id : "",
      telefone: item.telefone || "",
      localizacao: item.endereco || "",
      coordenadas: getCoordinates(item),
      tags: uniqueTags(item.badge, item.categoria, item.rota, item.subtitulo, item.acessibilidade),
      mapsUrl: item.mapsUrl || "",
      legacySource: "locais-data"
    };
  }

  function buildLegacyRouteItem(item, routeInfo) {
    var category = classifyLegacyCategory(item, "route");
    var routeMeta = routeInfo[item.route] || {};
    return {
      id: item.id,
      nome: item.name,
      categoria: category,
      descricao: item.desc || "",
      imagem: "",
      url: "",
      telefone: item.phone || "",
      localizacao: item.location || "",
      coordenadas: getCoordinates(item),
      tags: uniqueTags(item.route, routeMeta.name, item.subtitle, item.coordStatus, item.coordNote),
      mapsUrl: item.mapsUrl || "",
      legacySource: "rotas-data",
      legacyRoute: item.route || "",
      legacyRouteName: routeMeta.name || item.route || "",
      preferLegacyCoordinates: item.coordStatus === "ok"
    };
  }

  function coordinatesAreClose(a, b) {
    var aCoordinates = a && a.coordenadas;
    var bCoordinates = b && b.coordenadas;
    if (!isFiniteNumber(aCoordinates && aCoordinates.lat) || !isFiniteNumber(aCoordinates && aCoordinates.lng)) return false;
    if (!isFiniteNumber(bCoordinates && bCoordinates.lat) || !isFiniteNumber(bCoordinates && bCoordinates.lng)) return false;

    return Math.abs(aCoordinates.lat - bCoordinates.lat) <= 0.0008
      && Math.abs(aCoordinates.lng - bCoordinates.lng) <= 0.0008;
  }

  function getComparableUrl(item) {
    return normalizeText((item && (item.url || item.mapsUrl)) || "");
  }

  function getComparableName(item) {
    return normalizeText(item && item.nome);
  }

  function findDuplicate(snapshot, incoming) {
    var buckets = [
      ensureArray(snapshot.pontos),
      ensureArray(snapshot.hospedagens),
      ensureArray(snapshot.restaurantes),
      ensureArray(snapshot.eventos),
      ensureArray(snapshot.informacoesEssenciais)
    ];
    var incomingName = getComparableName(incoming);
    var incomingUrl = getComparableUrl(incoming);
    var incomingCategory = normalizeText(incoming && incoming.categoria);
    var incomingFirstToken = incomingName.split(" ")[0] || "";

    var duplicate = null;
    buckets.some(function (bucket) {
      return bucket.some(function (existing) {
        if (existing.id && incoming.id && existing.id === incoming.id) {
          duplicate = existing;
          return true;
        }

        if (getComparableName(existing) === incomingName) {
          duplicate = existing;
          return true;
        }

        if (incomingUrl && getComparableUrl(existing) === incomingUrl) {
          duplicate = existing;
          return true;
        }

        if (coordinatesAreClose(existing, incoming)
          && normalizeText(existing.categoria) === incomingCategory
          && (getComparableName(existing).split(" ")[0] || "") === incomingFirstToken) {
          duplicate = existing;
          return true;
        }

        return false;
      });
    });

    return duplicate;
  }

  function mergeItems(existing, incoming) {
    ["descricao", "imagem", "url", "telefone", "localizacao", "mapsUrl"].forEach(function (field) {
      if (!existing[field] && incoming[field]) {
        existing[field] = incoming[field];
      }
    });

    existing.tags = uniqueTags(existing.tags, incoming.tags);

    if (!existing.legacySource && incoming.legacySource) {
      existing.legacySource = incoming.legacySource;
    }

    if (!existing.legacyRoute && incoming.legacyRoute) {
      existing.legacyRoute = incoming.legacyRoute;
    }

    if (!existing.legacyRouteName && incoming.legacyRouteName) {
      existing.legacyRouteName = incoming.legacyRouteName;
    }

    if (hasCoordinates(incoming) && (!hasCoordinates(existing) || incoming.preferLegacyCoordinates)) {
      existing.coordenadas = incoming.coordenadas;
      if (incoming.mapsUrl) existing.mapsUrl = incoming.mapsUrl;
    }

    return existing;
  }

  function createEmptyLegacySnapshot() {
    return {
      pontos: [],
      hospedagens: [],
      restaurantes: [],
      informacoesEssenciais: [],
      meta: {
        sources: ["js/locais-data.js", "js/rotas-data.js"],
        locaisData: { total: 0, withCoordinates: 0 },
        rotasData: { total: 0, withCoordinates: 0 },
        integration: {
          addedItems: 0,
          mergedItems: 0
        }
      }
    };
  }

  function buildLegacySnapshot() {
    var snapshot = createEmptyLegacySnapshot();
    var routeInfo = window.ROTAS_LEGADO_ROUTE_INFO || {};
    var routeEstablishments = ensureArray(window.ROTAS_LEGADO_ESTABLISHMENTS);
    var locais = window.locaisData && typeof window.locaisData === "object" ? Object.keys(window.locaisData).map(function (key) {
      return window.locaisData[key];
    }) : [];

    snapshot.meta.locaisData.total = locais.length;
    snapshot.meta.locaisData.withCoordinates = locais.filter(hasCoordinates).length;
    snapshot.meta.rotasData.total = routeEstablishments.length;
    snapshot.meta.rotasData.withCoordinates = routeEstablishments.filter(hasCoordinates).length;

    locais.map(buildLegacyLocalItem).forEach(function (item) {
      snapshot[getCollectionName(item.categoria)].push(item);
    });

    routeEstablishments.map(function (item) {
      return buildLegacyRouteItem(item, routeInfo);
    }).forEach(function (item) {
      snapshot[getCollectionName(item.categoria)].push(item);
    });

    return snapshot;
  }

  function mergeSnapshot(baseSnapshot) {
    var merged = {
      pontos: ensureArray(baseSnapshot.pontos).map(cloneItem),
      rotas: ensureArray(baseSnapshot.rotas).map(cloneItem),
      hospedagens: ensureArray(baseSnapshot.hospedagens).map(cloneItem),
      restaurantes: ensureArray(baseSnapshot.restaurantes).map(cloneItem),
      eventos: ensureArray(baseSnapshot.eventos).map(cloneItem),
      informacoesEssenciais: ensureArray(baseSnapshot.informacoesEssenciais).map(cloneItem)
    };
    var legacySnapshot = buildLegacySnapshot();

    ["pontos", "hospedagens", "restaurantes", "informacoesEssenciais"].forEach(function (collectionName) {
      ensureArray(legacySnapshot[collectionName]).forEach(function (item) {
        var duplicate = findDuplicate(merged, item);
        if (duplicate) {
          mergeItems(duplicate, item);
          legacySnapshot.meta.integration.mergedItems += 1;
          return;
        }
        merged[collectionName].push(item);
        legacySnapshot.meta.integration.addedItems += 1;
      });
    });

    merged.legacyMeta = legacySnapshot.meta;
    return merged;
  }

  function summarizeSnapshot(snapshot) {
    var items = []
      .concat(ensureArray(snapshot.pontos))
      .concat(ensureArray(snapshot.rotas))
      .concat(ensureArray(snapshot.hospedagens))
      .concat(ensureArray(snapshot.restaurantes))
      .concat(ensureArray(snapshot.eventos))
      .concat(ensureArray(snapshot.informacoesEssenciais));
    var categories = collectBroadCategories(snapshot);

    return {
      totalItems: items.length,
      withCoordinates: items.filter(hasCoordinates).length,
      withoutCoordinates: items.filter(function (item) { return !hasCoordinates(item); }).length,
      categoryCount: categories.length,
      categories: categories,
      points: ensureArray(snapshot.pontos).length,
      routes: ensureArray(snapshot.rotas).length,
      lodging: ensureArray(snapshot.hospedagens).length,
      restaurants: ensureArray(snapshot.restaurantes).length,
      events: ensureArray(snapshot.eventos).length,
      services: ensureArray(snapshot.informacoesEssenciais).length
    };
  }

  window.TURISMO_DATA_ADAPTER = {
    buildLegacySnapshot: buildLegacySnapshot,
    mergeSnapshot: mergeSnapshot,
    summarizeSnapshot: summarizeSnapshot
  };
})();
