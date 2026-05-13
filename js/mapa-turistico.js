(function () {
  "use strict";

  var MAP_TEXT = {
    pt: {
      pageTitle: "Mapa Turístico Interativo",
      pageSubtitle: "Explore pontos turísticos, rotas, gastronomia, hospedagem e serviços em uma visão inicial do destino.",
      pageKicker: "Explorar o Destino",
      actionHome: "Voltar à HOME",
      actionRoutes: "Explorar roteiros",
      searchPlaceholder: "Buscar no mapa por nome, categoria ou palavra-chave",
      resultsCount: "itens visíveis",
      locatedCount: "com localização",
      stageTitle: "Exploração no mapa",
      stageSubtitle: "Clique em um marcador ou item da lista para ver detalhes.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Use os filtros para destacar categorias turísticas.",
      stageMissing: "Itens sem coordenadas continuam listados no painel.",
      totalItemsLabel: "itens catalogados",
      selectedTitle: "Detalhes do local",
      selectedEmpty: "Selecione um ponto no mapa ou na lista para ver imagem, categoria, descrição e ações rápidas.",
      listTitle: "Locais e experiências",
      listEmpty: "Nenhum item encontrado com os filtros atuais.",
      details: "Ver detalhes",
      directions: "Como chegar",
      noCoordinates: "Sem localização cadastrada",
      noImage: "Sem imagem",
      noDescription: "Descrição em atualização.",
      missingTitle: "Ainda sem coordenadas",
      popupDetails: "Ver detalhes",
      popupDirections: "Como chegar",
      categories: {
        all: "Todos",
        history: "História",
        culture: "Cultura",
        nature: "Natureza",
        gastronomy: "Gastronomia",
        lodging: "Hospedagem",
        events: "Eventos",
        services: "Serviços"
      },
      categoryLabels: {
        history: "História",
        culture: "Cultura",
        nature: "Natureza",
        gastronomy: "Gastronomia",
        lodging: "Hospedagem",
        events: "Eventos",
        services: "Serviços"
      }
    },
    en: {
      pageTitle: "Interactive Tourism Map",
      pageSubtitle: "Explore attractions, routes, food, lodging and services in an initial destination map.",
      pageKicker: "Explore the Destination",
      actionHome: "Back to Home",
      actionRoutes: "Explore routes",
      searchPlaceholder: "Search the map by name, category or keyword",
      resultsCount: "visible items",
      locatedCount: "with location",
      stageTitle: "Map exploration",
      stageSubtitle: "Click a marker or list item to see details.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Use filters to highlight tourism categories.",
      stageMissing: "Items without coordinates remain listed in the panel.",
      totalItemsLabel: "cataloged items",
      selectedTitle: "Place details",
      selectedEmpty: "Select a map marker or list item to view image, category, description and quick actions.",
      listTitle: "Places and experiences",
      listEmpty: "No items found with the current filters.",
      details: "View details",
      directions: "Directions",
      noCoordinates: "Location not registered",
      noImage: "No image",
      noDescription: "Description pending update.",
      missingTitle: "Still without coordinates",
      popupDetails: "View details",
      popupDirections: "Directions",
      categories: {
        all: "All",
        history: "History",
        culture: "Culture",
        nature: "Nature",
        gastronomy: "Food",
        lodging: "Lodging",
        events: "Events",
        services: "Services"
      },
      categoryLabels: {
        history: "History",
        culture: "Culture",
        nature: "Nature",
        gastronomy: "Food",
        lodging: "Lodging",
        events: "Events",
        services: "Services"
      }
    },
    es: {
      pageTitle: "Mapa Turístico Interactivo",
      pageSubtitle: "Explora atractivos, rutas, gastronomía, hospedaje y servicios en una primera visión del destino.",
      pageKicker: "Explorar el Destino",
      actionHome: "Volver al inicio",
      actionRoutes: "Explorar rutas",
      searchPlaceholder: "Buscar en el mapa por nombre, categoría o palabra clave",
      resultsCount: "elementos visibles",
      locatedCount: "con ubicación",
      stageTitle: "Exploración en el mapa",
      stageSubtitle: "Haz clic en un marcador o elemento de la lista para ver detalles.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Usa los filtros para destacar categorías turísticas.",
      stageMissing: "Los elementos sin coordenadas siguen listados en el panel.",
      totalItemsLabel: "elementos catalogados",
      selectedTitle: "Detalles del lugar",
      selectedEmpty: "Selecciona un marcador o elemento de la lista para ver imagen, categoría, descripción y acciones rápidas.",
      listTitle: "Lugares y experiencias",
      listEmpty: "No se encontraron elementos con los filtros actuales.",
      details: "Ver detalles",
      directions: "Cómo llegar",
      noCoordinates: "Sin ubicación registrada",
      noImage: "Sin imagen",
      noDescription: "Descripción en actualización.",
      missingTitle: "Todavía sin coordenadas",
      popupDetails: "Ver detalles",
      popupDirections: "Cómo llegar",
      categories: {
        all: "Todos",
        history: "Historia",
        culture: "Cultura",
        nature: "Naturaleza",
        gastronomy: "Gastronomía",
        lodging: "Hospedaje",
        events: "Eventos",
        services: "Servicios"
      },
      categoryLabels: {
        history: "Historia",
        culture: "Cultura",
        nature: "Naturaleza",
        gastronomy: "Gastronomía",
        lodging: "Hospedaje",
        events: "Eventos",
        services: "Servicios"
      }
    },
    pl: {
      pageTitle: "Interaktywna Mapa Turystyczna",
      pageSubtitle: "Odkrywaj atrakcje, trasy, gastronomię, noclegi i usługi w pierwszej wersji mapy destynacji.",
      pageKicker: "Odkryj Kierunek",
      actionHome: "Powrót do strony głównej",
      actionRoutes: "Odkryj trasy",
      searchPlaceholder: "Szukaj na mapie po nazwie, kategorii lub słowie kluczowym",
      resultsCount: "widocznych elementów",
      locatedCount: "z lokalizacją",
      stageTitle: "Eksploracja mapy",
      stageSubtitle: "Kliknij znacznik lub element listy, aby zobaczyć szczegóły.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Użyj filtrów, aby wyróżnić kategorie turystyczne.",
      stageMissing: "Elementy bez współrzędnych pozostają na liście panelu.",
      totalItemsLabel: "skatalogowanych elementów",
      selectedTitle: "Szczegóły miejsca",
      selectedEmpty: "Wybierz znacznik mapy lub element listy, aby zobaczyć zdjęcie, kategorię, opis i szybkie akcje.",
      listTitle: "Miejsca i doświadczenia",
      listEmpty: "Brak elementów dla bieżących filtrów.",
      details: "Zobacz szczegóły",
      directions: "Jak dojechać",
      noCoordinates: "Brak zapisanej lokalizacji",
      noImage: "Brak zdjęcia",
      noDescription: "Opis jest aktualizowany.",
      missingTitle: "Nadal bez współrzędnych",
      popupDetails: "Zobacz szczegóły",
      popupDirections: "Jak dojechać",
      categories: {
        all: "Wszystko",
        history: "Historia",
        culture: "Kultura",
        nature: "Natura",
        gastronomy: "Gastronomia",
        lodging: "Noclegi",
        events: "Wydarzenia",
        services: "Usługi"
      },
      categoryLabels: {
        history: "Historia",
        culture: "Kultura",
        nature: "Natura",
        gastronomy: "Gastronomia",
        lodging: "Noclegi",
        events: "Wydarzenia",
        services: "Usługi"
      }
    }
  };

  var CATEGORY_CONFIG = {
    all: { color: "#0a3d2e" },
    history: { color: "#8a6b49" },
    culture: { color: "#7254b3" },
    nature: { color: "#2c8d66" },
    gastronomy: { color: "#c06b2b" },
    lodging: { color: "#1e749e" },
    events: { color: "#b33c5a" },
    services: { color: "#5d6673" }
  };

  var FILTER_ORDER = ["all", "history", "culture", "nature", "gastronomy", "lodging", "events", "services"];

  var state = {
    map: null,
    markersLayer: null,
    items: [],
    filteredItems: [],
    missingItems: [],
    selectedItemId: null,
    activeFilter: "all",
    searchTerm: "",
    lang: "pt"
  };

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function getLang() {
    var lang = (localStorage.getItem("sms-lang") || localStorage.getItem("smsLang") || "pt").toLowerCase();
    return MAP_TEXT[lang] ? lang : "pt";
  }

  function t(path, fallback) {
    var parts = path.split(".");
    var cursor = MAP_TEXT[state.lang] || MAP_TEXT.pt;
    for (var i = 0; i < parts.length; i += 1) {
      cursor = cursor && cursor[parts[i]];
    }
    return cursor || fallback || path;
  }

  function getCoordinates(item) {
    var lat = item && item.coordenadas ? item.coordenadas.lat : item && item.lat;
    var lng = item && item.coordenadas ? item.coordenadas.lng : item && item.lng;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return { lat: lat, lng: lng };
  }

  function classifyCategory(itemType, rawCategory, tags, description) {
    var source = normalizeText([rawCategory, description, Array.isArray(tags) ? tags.join(" ") : tags].join(" "));

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
    if (source.indexOf("servico") !== -1 || source.indexOf("atendimento") !== -1 || source.indexOf("contato") !== -1 || source.indexOf("informacoes") !== -1) {
      return "services";
    }
    return "culture";
  }

  function createGoogleMapsLink(item, coordinates) {
    if (coordinates) {
      return "https://www.google.com/maps/search/?api=1&query=" + coordinates.lat + "," + coordinates.lng;
    }
    return item.url || "#";
  }

  function normalizeItem(item, itemType) {
    if (!item || !item.nome) return null;
    var coordinates = getCoordinates(item);
    var broadCategory = classifyCategory(itemType, item.categoria, item.tags, item.descricao);

    return {
      id: item.id || item.nome,
      nome: item.nome,
      tipo: itemType,
      categoriaOriginal: item.categoria || "",
      categoriaMapa: broadCategory,
      categoriaLabel: t("categoryLabels." + broadCategory, item.categoria || ""),
      descricao: item.descricao || "",
      imagem: item.imagem || "",
      url: item.url || "",
      telefone: item.telefone || "",
      localizacao: item.localizacao || item.local || "",
      periodo: item.periodo || "",
      destaque: item.destaque || "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      coordenadas: coordinates,
      possuiCoordenadas: !!coordinates,
      mapsUrl: createGoogleMapsLink(item, coordinates),
      searchText: normalizeText([
        item.nome,
        item.categoria,
        item.descricao,
        item.localizacao,
        item.local,
        item.periodo,
        item.telefone,
        Array.isArray(item.tags) ? item.tags.join(" ") : item.tags
      ].join(" "))
    };
  }

  function buildItems() {
    var data = window.TURISMO_DATA || {};
    var points = (data.pontos || []).map(function (item) { return normalizeItem(item, "ponto"); });
    var lodging = (data.hospedagens || []).map(function (item) { return normalizeItem(item, "hospedagem"); });
    var restaurants = (data.restaurantes || []).map(function (item) { return normalizeItem(item, "restaurante"); });
    var events = (data.eventos || []).map(function (item) { return normalizeItem(item, "evento"); });
    var services = (data.informacoesEssenciais || []).map(function (item) { return normalizeItem(item, "servico"); });

    return points.concat(lodging, restaurants, events, services).filter(Boolean);
  }

  function filterItems() {
    state.filteredItems = state.items.filter(function (item) {
      var byCategory = state.activeFilter === "all" || item.categoriaMapa === state.activeFilter;
      var bySearch = !state.searchTerm || item.searchText.indexOf(state.searchTerm) !== -1;
      return byCategory && bySearch;
    });

    state.missingItems = state.filteredItems.filter(function (item) {
      return !item.possuiCoordenadas;
    });
  }

  function getFilterCount(filterId) {
    if (filterId === "all") return state.items.length;
    return state.items.filter(function (item) { return item.categoriaMapa === filterId; }).length;
  }

  function createMarkerIcon(filterId) {
    var color = (CATEGORY_CONFIG[filterId] || CATEGORY_CONFIG.all).color;
    return L.divIcon({
      className: "",
      html: '<span class="map-marker" style="background:' + color + ';"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 18],
      popupAnchor: [0, -16]
    });
  }

  function getItemById(id) {
    return state.items.find(function (item) { return item.id === id; }) || null;
  }

  function selectItem(id, centerOnMap) {
    state.selectedItemId = id;
    renderSelectedItem();
    renderList();

    var item = getItemById(id);
    if (item && item.possuiCoordenadas && centerOnMap !== false && state.map) {
      state.map.flyTo([item.coordenadas.lat, item.coordenadas.lng], Math.max(state.map.getZoom(), 14), {
        duration: 0.45
      });
    }
  }

  function renderFilters() {
    var container = document.getElementById("mapFilters");
    if (!container) return;

    container.innerHTML = FILTER_ORDER.map(function (filterId) {
      var count = getFilterCount(filterId);
      var activeClass = state.activeFilter === filterId ? " is-active" : "";
      return '<button type="button" class="map-filter-btn' + activeClass + '" data-filter="' + filterId + '" aria-label="' + t("categories." + filterId, filterId) + '">'
        + t("categories." + filterId, filterId) + ' <span>(' + count + ')</span></button>';
    }).join("");
  }

  function renderStats() {
    var total = document.getElementById("mapTotalItems");
    var located = document.getElementById("mapLocatedItems");
    var visible = document.getElementById("mapVisibleItems");

    if (total) total.textContent = state.items.length;
    if (located) located.textContent = state.items.filter(function (item) { return item.possuiCoordenadas; }).length;
    if (visible) visible.textContent = state.filteredItems.length;
  }

  function renderMarkers() {
    if (!state.map || !state.markersLayer) return;
    state.markersLayer.clearLayers();

    var bounds = [];
    state.filteredItems.forEach(function (item) {
      if (!item.possuiCoordenadas) return;

      var marker = L.marker([item.coordenadas.lat, item.coordenadas.lng], {
        icon: createMarkerIcon(item.categoriaMapa),
        title: item.nome
      });

      marker.bindPopup(
        '<div class="map-popup">'
          + '<strong>' + item.nome + '</strong>'
          + '<span>' + item.categoriaLabel + '</span>'
          + '<p>' + (item.descricao || t("noDescription")) + '</p>'
          + (item.url ? '<a href="' + item.url + '">' + t("popupDetails") + '</a><br>' : '')
          + '<a href="' + item.mapsUrl + '" target="_blank" rel="noopener">' + t("popupDirections") + '</a>'
          + '</div>'
      );

      marker.on("click", function () {
        selectItem(item.id, false);
      });

      marker.addTo(state.markersLayer);
      bounds.push([item.coordenadas.lat, item.coordenadas.lng]);
    });

    if (bounds.length) {
      state.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      state.map.setView([-25.8775, -50.3822], 12);
    }
  }

  function getImageHtml(item, className, fallbackText) {
    if (!item.imagem) {
      return '<div class="' + className + '" aria-hidden="true"></div>';
    }
    return '<img src="' + item.imagem + '" alt="' + item.nome + '" class="' + className + '">';
  }

  function renderSelectedItem() {
    var container = document.getElementById("mapSelectedItem");
    if (!container) return;

    var item = getItemById(state.selectedItemId) || state.filteredItems[0] || state.items.find(function (entry) { return entry.possuiCoordenadas; }) || null;
    if (!item) {
      container.innerHTML = '<div class="map-selected-empty">' + t("selectedEmpty") + "</div>";
      return;
    }

    state.selectedItemId = item.id;

    var meta = [];
    if (item.localizacao) meta.push('<span class="map-meta-chip">📍 ' + item.localizacao + '</span>');
    if (item.telefone) meta.push('<span class="map-meta-chip">📞 ' + item.telefone + '</span>');
    if (item.periodo) meta.push('<span class="map-meta-chip">📅 ' + item.periodo + '</span>');
    if (!item.possuiCoordenadas) meta.push('<span class="map-meta-chip">' + t("noCoordinates") + '</span>');

    container.innerHTML = ''
      + '<div class="map-detail">'
      + getImageHtml(item, "map-detail-image", t("noImage"))
      + '<div class="map-detail-top">'
      + '<div><h3>' + item.nome + '</h3></div>'
      + '<span class="map-detail-category">' + item.categoriaLabel + '</span>'
      + '</div>'
      + '<p>' + (item.descricao || t("noDescription")) + '</p>'
      + '<div class="map-detail-meta">' + meta.join("") + '</div>'
      + '<div class="map-detail-actions">'
      + (item.url ? '<a class="map-button primary" href="' + item.url + '">' + t("details") + '</a>' : "")
      + (item.possuiCoordenadas ? '<a class="map-button" href="' + item.mapsUrl + '" target="_blank" rel="noopener">' + t("directions") + '</a>' : "")
      + '</div>'
      + '</div>';
  }

  function renderList() {
    var container = document.getElementById("mapItemList");
    var missingContainer = document.getElementById("mapMissingItems");
    if (!container || !missingContainer) return;

    var listItems = state.filteredItems;
    if (!listItems.length) {
      container.innerHTML = '<div class="map-list-empty">' + t("listEmpty") + "</div>";
      missingContainer.innerHTML = "";
      return;
    }

    container.innerHTML = listItems.map(function (item) {
      var selectedClass = item.id === state.selectedItemId ? " is-selected" : "";
      var tags = [];
      tags.push('<span class="map-list-badge">' + item.categoriaLabel + '</span>');
      if (!item.possuiCoordenadas) tags.push('<span class="map-list-badge is-missing">' + t("noCoordinates") + '</span>');

      return ''
        + '<button type="button" class="map-list-card' + selectedClass + '" data-item-id="' + item.id + '" aria-label="' + item.nome + '">'
        + getImageHtml(item, "map-list-thumb", t("noImage"))
        + '<div>'
        + '<h4>' + item.nome + '</h4>'
        + '<p>' + (item.descricao || t("noDescription")) + '</p>'
        + '<div class="map-list-card-tags">' + tags.join("") + '</div>'
        + '</div>'
        + '</button>';
    }).join("");

    if (state.missingItems.length) {
      missingContainer.innerHTML = '<div class="map-missing-list"><h3>' + t("missingTitle") + '</h3><ul>'
        + state.missingItems.map(function (item) { return '<li>' + item.nome + "</li>"; }).join("")
        + "</ul></div>";
    } else {
      missingContainer.innerHTML = "";
    }
  }

  function applyPageText() {
    document.body.classList.add("map-page-body");
    document.querySelectorAll("[data-map-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-map-i18n");
      el.innerHTML = t(key, el.innerHTML);
    });
    document.querySelectorAll("[data-map-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-map-i18n-placeholder");
      el.setAttribute("placeholder", t(key, el.getAttribute("placeholder")));
    });
    document.querySelectorAll("[data-map-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-map-i18n-aria");
      el.setAttribute("aria-label", t(key, el.getAttribute("aria-label")));
    });

    var resultLabel = document.getElementById("mapVisibleLabel");
    var locatedLabel = document.getElementById("mapLocatedLabel");
    var totalLabel = document.getElementById("mapTotalLabel");
    if (resultLabel) resultLabel.textContent = t("resultsCount");
    if (locatedLabel) locatedLabel.textContent = t("locatedCount");
    if (totalLabel) totalLabel.textContent = t("totalItemsLabel");
  }

  function bindEvents() {
    var searchInput = document.getElementById("mapSearchInput");
    var filters = document.getElementById("mapFilters");
    var list = document.getElementById("mapItemList");

    if (searchInput) {
      searchInput.addEventListener("input", function (event) {
        state.searchTerm = normalizeText(event.target.value);
        refreshView();
      });
    }

    if (filters) {
      filters.addEventListener("click", function (event) {
        var button = event.target.closest("[data-filter]");
        if (!button) return;
        state.activeFilter = button.getAttribute("data-filter");
        refreshView();
      });
    }

    if (list) {
      list.addEventListener("click", function (event) {
        var card = event.target.closest("[data-item-id]");
        if (!card) return;
        selectItem(card.getAttribute("data-item-id"), true);
      });
    }

    document.addEventListener("translationsApplied", function () {
      state.lang = getLang();
      applyPageText();
      renderFilters();
      renderStats();
      renderSelectedItem();
      renderList();
      renderMarkers();
    });
  }

  function refreshView() {
    filterItems();
    renderFilters();
    renderStats();
    renderMarkers();
    renderSelectedItem();
    renderList();
  }

  function initMap() {
    state.lang = getLang();
    state.items = buildItems();
    state.map = L.map("tourismMap", { zoomControl: true, scrollWheelZoom: true });
    state.markersLayer = L.layerGroup().addTo(state.map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(state.map);

    state.map.setView([-25.8775, -50.3822], 12);
    applyPageText();
    bindEvents();
    refreshView();

    window.setTimeout(function () {
      state.map.invalidateSize();
    }, 180);
  }

  function bootstrap() {
    if (!window.L || !document.getElementById("tourismMap")) return;
    initMap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
