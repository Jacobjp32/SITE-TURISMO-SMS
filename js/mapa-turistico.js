(function () {
  "use strict";

  var MAP_TEXT = {
    pt: {
      pageTitle: "Mapa Turístico Interativo",
      pageSubtitle: "Explore pontos turísticos, rotas, gastronomia, hospedagem e serviços em uma visão inicial do destino.",
      pageSupport: "Navegue pelos principais atrativos de São Mateus do Sul, descubra experiências por categoria e use o mapa como ponto de partida para montar sua visita.",
      pageKicker: "Explorar o Destino",
      heroPanelKicker: "Visão rápida",
      heroPanelText: "Uma leitura organizada para explorar o destino com mapa, filtros e atalhos de consulta.",
      heroPointsLabel: "pontos no mapa",
      heroPlacesLabel: "locais cadastrados",
      heroCategoriesLabel: "categorias",
      heroNote: "Itens sem coordenadas continuam disponíveis no painel para consulta e futura geolocalização.",
      actionHome: "Voltar à HOME",
      actionGuide: "Voltar ao guia do visitante",
      actionPlan: "Planejar visita",
      actionRoutes: "Explorar roteiros",
      searchPlaceholder: "Busque por igreja, hotel, erva-mate...",
      searchHint: "Busque por igreja, hotel, erva-mate, praça, evento ou serviço.",
      clearSearch: "Limpar",
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
      listIntro: "Os cards abaixo acompanham a busca e os filtros. Clique em um local para destacar no mapa e abrir ações rápidas.",
      listEmpty: "Nenhum item encontrado com os filtros atuais.",
      listEmptyFiltered: "Nenhum resultado neste filtro. Tente buscar em Todos.",
      listEmptySearch: "Nenhum local corresponde a essa busca no momento.",
      details: "Ver detalhes",
      directions: "Como chegar",
      noCoordinates: "Sem localização cadastrada",
      noImage: "Sem imagem",
      noDescription: "Descrição em atualização.",
      cardSelected: "Selecionado no mapa",
      missingTitle: "Ainda sem coordenadas",
      missingDescription: "Alguns itens ainda não possuem localização cadastrada, mas continuam disponíveis para consulta e podem ser completados futuramente.",
      popupDetails: "Ver detalhes",
      popupDirections: "Como chegar",
      searchResultsSingle: "1 local encontrado.",
      searchResultsMany: "{count} locais encontrados.",
      searchResultsFiltered: "{count} locais neste filtro.",
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
      pageSupport: "Browse the main attractions of Sao Mateus do Sul, discover experiences by category and use the map as a starting point for planning your visit.",
      pageKicker: "Explore the Destination",
      heroPanelKicker: "Quick view",
      heroPanelText: "A clearer way to explore the destination with map, filters and shortcut actions.",
      heroPointsLabel: "map points",
      heroPlacesLabel: "listed places",
      heroCategoriesLabel: "categories",
      heroNote: "Items without coordinates remain available in the panel for consultation and future geolocation.",
      actionHome: "Back to Home",
      actionGuide: "Back to visitor guide",
      actionPlan: "Plan visit",
      actionRoutes: "Explore routes",
      searchPlaceholder: "Search for church, hotel, yerba mate...",
      searchHint: "Search for church, hotel, yerba mate, square, event or service.",
      clearSearch: "Clear",
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
      listIntro: "Cards below follow search and filters. Click a place to highlight it on the map and open quick actions.",
      listEmpty: "No items found with the current filters.",
      listEmptyFiltered: "No results in this filter. Try searching in All.",
      listEmptySearch: "No places match this search right now.",
      details: "View details",
      directions: "Directions",
      noCoordinates: "Location not registered",
      noImage: "No image",
      noDescription: "Description pending update.",
      cardSelected: "Selected on map",
      missingTitle: "Still without coordinates",
      missingDescription: "Some items do not yet have a registered location, but remain available for consultation and can be completed later.",
      popupDetails: "View details",
      popupDirections: "Directions",
      searchResultsSingle: "1 place found.",
      searchResultsMany: "{count} places found.",
      searchResultsFiltered: "{count} places in this filter.",
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
      pageSupport: "Recorre los principales atractivos de Sao Mateus do Sul, descubre experiencias por categoría y usa el mapa como punto de partida para planificar tu visita.",
      pageKicker: "Explorar el Destino",
      heroPanelKicker: "Vista rápida",
      heroPanelText: "Una lectura organizada para explorar el destino con mapa, filtros y accesos rápidos.",
      heroPointsLabel: "puntos en el mapa",
      heroPlacesLabel: "lugares registrados",
      heroCategoriesLabel: "categorías",
      heroNote: "Los elementos sin coordenadas siguen disponibles en el panel para consulta y futura geolocalización.",
      actionHome: "Volver al inicio",
      actionGuide: "Volver a la guía del visitante",
      actionPlan: "Planificar visita",
      actionRoutes: "Explorar rutas",
      searchPlaceholder: "Busca iglesia, hotel, yerba mate...",
      searchHint: "Busca iglesia, hotel, yerba mate, plaza, evento o servicio.",
      clearSearch: "Limpiar",
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
      listIntro: "Las tarjetas de abajo acompañan la búsqueda y los filtros. Haz clic en un lugar para destacarlo en el mapa y abrir acciones rápidas.",
      listEmpty: "No se encontraron elementos con los filtros actuales.",
      listEmptyFiltered: "No hay resultados en este filtro. Intenta buscar en Todos.",
      listEmptySearch: "Ningún lugar coincide con esta búsqueda.",
      details: "Ver detalles",
      directions: "Cómo llegar",
      noCoordinates: "Sin ubicación registrada",
      noImage: "Sin imagen",
      noDescription: "Descripción en actualización.",
      cardSelected: "Seleccionado en el mapa",
      missingTitle: "Todavía sin coordenadas",
      missingDescription: "Algunos elementos aún no tienen ubicación registrada, pero siguen disponibles para consulta y pueden completarse más adelante.",
      popupDetails: "Ver detalles",
      popupDirections: "Cómo llegar",
      searchResultsSingle: "1 lugar encontrado.",
      searchResultsMany: "{count} lugares encontrados.",
      searchResultsFiltered: "{count} lugares en este filtro.",
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
      pageSupport: "Przegladaj glowne atrakcje Sao Mateus do Sul, odkrywaj miejsca wedlug kategorii i wykorzystaj mape jako punkt startowy do planowania wizyty.",
      pageKicker: "Odkryj Kierunek",
      heroPanelKicker: "Szybki podglad",
      heroPanelText: "Uporzadkowany sposob na eksploracje miejsca z mapa, filtrami i szybkimi akcjami.",
      heroPointsLabel: "punkty na mapie",
      heroPlacesLabel: "zarejestrowane miejsca",
      heroCategoriesLabel: "kategorie",
      heroNote: "Elementy bez wspolrzednych pozostaja dostepne w panelu do przegladania i przyszlej geolokalizacji.",
      actionHome: "Powrot do strony glownej",
      actionGuide: "Powrot do przewodnika",
      actionPlan: "Zaplanuj wizyte",
      actionRoutes: "Odkryj trasy",
      searchPlaceholder: "Szukaj kosciola, hotelu, yerba mate...",
      searchHint: "Szukaj kosciola, hotelu, yerba mate, placu, wydarzenia lub uslugi.",
      clearSearch: "Wyczysc",
      resultsCount: "widocznych elementow",
      locatedCount: "z lokalizacja",
      stageTitle: "Eksploracja mapy",
      stageSubtitle: "Kliknij znacznik lub element listy, aby zobaczyc szczegoly.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Uzyj filtrow, aby wyroznic kategorie turystyczne.",
      stageMissing: "Elementy bez wspolrzednych pozostaja na liscie panelu.",
      totalItemsLabel: "skatalogowanych elementow",
      selectedTitle: "Szczegoly miejsca",
      selectedEmpty: "Wybierz znacznik mapy lub element listy, aby zobaczyc zdjecie, kategorie, opis i szybkie akcje.",
      listTitle: "Miejsca i doswiadczenia",
      listIntro: "Karty ponizej reaguja na wyszukiwanie i filtry. Kliknij miejsce, aby wyroznic je na mapie i otworzyc szybkie akcje.",
      listEmpty: "Brak elementow dla biezacych filtrow.",
      listEmptyFiltered: "Brak wynikow w tym filtrze. Sprobuj wyszukac we Wszystkich.",
      listEmptySearch: "Zadne miejsce nie pasuje do tego wyszukiwania.",
      details: "Zobacz szczegoly",
      directions: "Jak dojechac",
      noCoordinates: "Brak zapisanej lokalizacji",
      noImage: "Brak zdjecia",
      noDescription: "Opis jest aktualizowany.",
      cardSelected: "Wybrane na mapie",
      missingTitle: "Nadal bez wspolrzednych",
      missingDescription: "Niektore elementy nie maja jeszcze zapisanej lokalizacji, ale nadal sa dostepne do przegladania i moga zostac uzupelnione pozniej.",
      popupDetails: "Zobacz szczegoly",
      popupDirections: "Jak dojechac",
      searchResultsSingle: "Znaleziono 1 miejsce.",
      searchResultsMany: "Znaleziono {count} miejsc.",
      searchResultsFiltered: "{count} miejsc w tym filtrze.",
      categories: {
        all: "Wszystko",
        history: "Historia",
        culture: "Kultura",
        nature: "Natura",
        gastronomy: "Gastronomia",
        lodging: "Noclegi",
        events: "Wydarzenia",
        services: "Uslugi"
      },
      categoryLabels: {
        history: "Historia",
        culture: "Kultura",
        nature: "Natura",
        gastronomy: "Gastronomia",
        lodging: "Noclegi",
        events: "Wydarzenia",
        services: "Uslugi"
      }
    }
  };

  var CATEGORY_CONFIG = {
    all: { color: "#0a3d2e", accent: "#d4a574", icon: "SM" },
    history: { color: "#8a6b49", accent: "#f0d3ad", icon: "HI" },
    culture: { color: "#6f5a3b", accent: "#eadab7", icon: "CU" },
    nature: { color: "#2c8d66", accent: "#d5efe4", icon: "NA" },
    gastronomy: { color: "#c06b2b", accent: "#f6ddc7", icon: "GA" },
    lodging: { color: "#1e749e", accent: "#d5eaf3", icon: "HO" },
    events: { color: "#b33c5a", accent: "#f1d4dd", icon: "EV" },
    services: { color: "#5d6673", accent: "#dde1e8", icon: "SE" }
  };

  var FILTER_ORDER = ["all", "history", "culture", "nature", "gastronomy", "lodging", "events", "services"];

  var state = {
    map: null,
    markersLayer: null,
    markerIndex: {},
    items: [],
    filteredItems: [],
    missingItems: [],
    selectedItemId: null,
    activeFilter: "all",
    searchTerm: "",
    searchValue: "",
    lang: "pt"
  };

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function replaceCount(template, count) {
    return String(template || "").replace("{count}", count);
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
    var normalizedCategory = normalizeText(rawCategory);
    var source = normalizeText([rawCategory, description, Array.isArray(tags) ? tags.join(" ") : tags].join(" "));

    if (normalizedCategory.indexOf("historia") !== -1) return "history";
    if (normalizedCategory.indexOf("cultura") !== -1) return "culture";
    if (normalizedCategory.indexOf("natureza") !== -1) return "nature";
    if (normalizedCategory.indexOf("gastronomia") !== -1) return "gastronomy";
    if (normalizedCategory.indexOf("hospedagem") !== -1) return "lodging";
    if (normalizedCategory.indexOf("evento") !== -1) return "events";
    if (normalizedCategory.indexOf("servico") !== -1) return "services";
    if (normalizedCategory.indexOf("roteiro") !== -1) return "services";
    if (normalizedCategory.indexOf("institucional") !== -1) return "services";

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
    if (source.indexOf("servico") !== -1 || source.indexOf("atendimento") !== -1 || source.indexOf("contato") !== -1 || source.indexOf("informacoes") !== -1 || source.indexOf("roteiro") !== -1 || source.indexOf("institucional") !== -1) {
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

  function getAvailableCategoryCount() {
    return FILTER_ORDER.filter(function (filterId) {
      return filterId !== "all" && getFilterCount(filterId) > 0;
    }).length;
  }

  function getCategoryConfig(filterId) {
    return CATEGORY_CONFIG[filterId] || CATEGORY_CONFIG.all;
  }

  function createMarkerIcon(filterId, isSelected) {
    var config = getCategoryConfig(filterId);
    return L.divIcon({
      className: "",
      html: '<span class="map-marker' + (isSelected ? " is-active" : "") + '" style="--marker-color:' + config.color + ';--marker-accent:' + config.accent + ';"><span class="map-marker-core">' + config.icon + "</span></span>",
      iconSize: [34, 46],
      iconAnchor: [17, 40],
      popupAnchor: [0, -30]
    });
  }

  function getItemById(id) {
    return state.items.find(function (item) { return item.id === id; }) || null;
  }

  function getSelectedItem() {
    return getItemById(state.selectedItemId) || state.filteredItems[0] || state.items.find(function (entry) { return entry.possuiCoordenadas; }) || null;
  }

  function getSearchStatusMessage() {
    if (!state.filteredItems.length) {
      if (state.searchTerm && state.activeFilter !== "all") return t("listEmptyFiltered");
      if (state.searchTerm) return t("listEmptySearch");
      return t("listEmpty");
    }
    if (state.activeFilter !== "all") {
      return replaceCount(t("searchResultsFiltered"), state.filteredItems.length);
    }
    if (state.filteredItems.length === 1) return t("searchResultsSingle");
    return replaceCount(t("searchResultsMany"), state.filteredItems.length);
  }

  function getImageHtml(item, className) {
    if (!item.imagem) {
      return '<div class="' + className + ' map-image-fallback" aria-hidden="true"><span>' + getCategoryConfig(item.categoriaMapa).icon + '</span><small>' + t("noImage") + "</small></div>";
    }
    return '<img src="' + item.imagem + '" alt="' + item.nome + '" class="' + className + '">';
  }

  function updateSearchUi() {
    var clearButton = document.getElementById("mapSearchClear");
    var searchStatus = document.getElementById("mapSearchStatus");
    if (clearButton) {
      var hasValue = !!state.searchValue;
      clearButton.disabled = !hasValue;
      clearButton.classList.toggle("is-visible", hasValue);
      clearButton.setAttribute("aria-hidden", hasValue ? "false" : "true");
    }
    if (searchStatus) {
      searchStatus.textContent = getSearchStatusMessage();
    }
  }

  function renderFilters() {
    var container = document.getElementById("mapFilters");
    if (!container) return;

    container.innerHTML = FILTER_ORDER.map(function (filterId) {
      var count = getFilterCount(filterId);
      var activeClass = state.activeFilter === filterId ? " is-active" : "";
      var config = getCategoryConfig(filterId);
      return '<button type="button" class="map-filter-btn' + activeClass + '" data-filter="' + filterId + '" aria-pressed="' + (state.activeFilter === filterId ? "true" : "false") + '" aria-label="' + t("categories." + filterId, filterId) + '">'
        + '<span class="map-filter-icon" style="--filter-color:' + config.color + ';--filter-accent:' + config.accent + ';">' + config.icon + '</span>'
        + '<span class="map-filter-text">' + t("categories." + filterId, filterId) + "</span>"
        + '<span class="map-filter-count">' + count + "</span></button>";
    }).join("");
  }

  function renderStats() {
    var total = document.getElementById("mapTotalItems");
    var located = document.getElementById("mapLocatedItems");
    var visible = document.getElementById("mapVisibleItems");
    var heroPoints = document.getElementById("mapHeroPoints");
    var heroPlaces = document.getElementById("mapHeroPlaces");
    var heroCategories = document.getElementById("mapHeroCategories");

    var locatedCount = state.items.filter(function (item) { return item.possuiCoordenadas; }).length;

    if (total) total.textContent = state.items.length;
    if (located) located.textContent = locatedCount;
    if (visible) visible.textContent = state.filteredItems.length;
    if (heroPoints) heroPoints.textContent = locatedCount;
    if (heroPlaces) heroPlaces.textContent = state.items.length;
    if (heroCategories) heroCategories.textContent = getAvailableCategoryCount();
  }

  function updateMarkerSelection() {
    Object.keys(state.markerIndex).forEach(function (itemId) {
      var marker = state.markerIndex[itemId];
      var item = getItemById(itemId);
      if (!marker || !item) return;
      marker.setIcon(createMarkerIcon(item.categoriaMapa, itemId === state.selectedItemId));
      if (itemId === state.selectedItemId) {
        marker.setZIndexOffset(200);
      } else {
        marker.setZIndexOffset(0);
      }
    });
  }

  function renderMarkers() {
    if (!state.map || !state.markersLayer) return;
    state.markersLayer.clearLayers();
    state.markerIndex = {};

    var bounds = [];
    state.filteredItems.forEach(function (item) {
      if (!item.possuiCoordenadas) return;

      var marker = L.marker([item.coordenadas.lat, item.coordenadas.lng], {
        icon: createMarkerIcon(item.categoriaMapa, item.id === state.selectedItemId),
        title: item.nome
      });

      marker.bindPopup(
        '<div class="map-popup">'
          + '<strong>' + item.nome + '</strong>'
          + '<span>' + item.categoriaLabel + '</span>'
          + '<p>' + (item.descricao || t("noDescription")) + '</p>'
          + (item.url ? '<a href="' + item.url + '">' + t("popupDetails") + '</a><br>' : "")
          + '<a href="' + item.mapsUrl + '" target="_blank" rel="noopener">' + t("popupDirections") + "</a>"
          + "</div>"
      );

      marker.on("click", function () {
        selectItem(item.id, false);
      });

      marker.addTo(state.markersLayer);
      state.markerIndex[item.id] = marker;
      bounds.push([item.coordenadas.lat, item.coordenadas.lng]);
    });

    if (bounds.length) {
      state.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      state.map.setView([-25.8775, -50.3822], 12);
    }

    updateMarkerSelection();
  }

  function selectItem(id, centerOnMap) {
    var item = getItemById(id);
    if (!item) return;

    state.selectedItemId = id;
    renderSelectedItem();
    renderList();
    updateMarkerSelection();

    if (item.possuiCoordenadas && state.map) {
      if (centerOnMap !== false) {
        state.map.flyTo([item.coordenadas.lat, item.coordenadas.lng], Math.max(state.map.getZoom(), 14), {
          duration: 0.45
        });
      }
      if (state.markerIndex[item.id]) {
        state.markerIndex[item.id].openPopup();
      }
    }
  }

  function renderSelectedItem() {
    var container = document.getElementById("mapSelectedItem");
    if (!container) return;

    var item = getSelectedItem();
    if (!item) {
      container.innerHTML = '<div class="map-selected-empty">' + t("selectedEmpty") + "</div>";
      return;
    }

    state.selectedItemId = item.id;

    var meta = [];
    if (item.localizacao) meta.push('<span class="map-meta-chip">📍 ' + item.localizacao + "</span>");
    if (item.telefone) meta.push('<span class="map-meta-chip">📞 ' + item.telefone + "</span>");
    if (item.periodo) meta.push('<span class="map-meta-chip">📅 ' + item.periodo + "</span>");
    if (!item.possuiCoordenadas) meta.push('<span class="map-meta-chip">' + t("noCoordinates") + "</span>");

    container.innerHTML = ""
      + '<div class="map-detail">'
      + getImageHtml(item, "map-detail-image")
      + '<div class="map-detail-top">'
      + "<div>"
      + '<span class="map-detail-category is-soft" style="--detail-accent:' + getCategoryConfig(item.categoriaMapa).accent + ';--detail-color:' + getCategoryConfig(item.categoriaMapa).color + ';">' + item.categoriaLabel + "</span>"
      + "<h3>" + item.nome + "</h3>"
      + "</div>"
      + '<span class="map-detail-badge">' + t("cardSelected") + "</span>"
      + "</div>"
      + "<p>" + (item.descricao || t("noDescription")) + "</p>"
      + '<div class="map-detail-meta">' + meta.join("") + "</div>"
      + '<div class="map-detail-actions">'
      + (item.url ? '<a class="map-button primary" href="' + item.url + '">' + t("details") + "</a>" : "")
      + (item.possuiCoordenadas ? '<a class="map-button" href="' + item.mapsUrl + '" target="_blank" rel="noopener">' + t("directions") + "</a>" : "")
      + "</div>"
      + "</div>";
  }

  function renderList() {
    var container = document.getElementById("mapItemList");
    var missingContainer = document.getElementById("mapMissingItems");
    if (!container || !missingContainer) return;

    var listItems = state.filteredItems;
    if (!listItems.length) {
      container.innerHTML = '<div class="map-list-empty">' + getSearchStatusMessage() + "</div>";
      missingContainer.innerHTML = "";
      return;
    }

    container.innerHTML = listItems.map(function (item) {
      var selectedClass = item.id === state.selectedItemId ? " is-selected" : "";
      var config = getCategoryConfig(item.categoriaMapa);
      var tags = [];
      tags.push('<span class="map-list-badge" style="--badge-color:' + config.color + ';--badge-accent:' + config.accent + ';">' + config.icon + " " + item.categoriaLabel + "</span>");
      if (!item.possuiCoordenadas) tags.push('<span class="map-list-badge is-missing">' + t("noCoordinates") + "</span>");

      return ""
        + '<article class="map-list-card' + selectedClass + '">'
        + '<button type="button" class="map-list-card-select" data-item-id="' + item.id + '" aria-label="' + item.nome + '">'
        + getImageHtml(item, "map-list-thumb")
        + '<div class="map-list-content">'
        + "<h4>" + item.nome + "</h4>"
        + "<p>" + (item.descricao || t("noDescription")) + "</p>"
        + '<div class="map-list-card-tags">' + tags.join("") + "</div>"
        + "</div>"
        + "</button>"
        + '<div class="map-list-card-actions">'
        + (item.url ? '<a class="map-button primary" href="' + item.url + '">' + t("details") + "</a>" : "")
        + (item.possuiCoordenadas ? '<a class="map-button" href="' + item.mapsUrl + '" target="_blank" rel="noopener">' + t("directions") + "</a>" : "")
        + "</div>"
        + "</article>";
    }).join("");

    if (state.missingItems.length) {
      missingContainer.innerHTML = '<div class="map-missing-list"><h3>' + t("missingTitle") + "</h3><p>" + t("missingDescription") + "</p><ul>"
        + state.missingItems.map(function (item) { return "<li>" + item.nome + "</li>"; }).join("")
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
    var searchClear = document.getElementById("mapSearchClear");
    var filters = document.getElementById("mapFilters");
    var list = document.getElementById("mapItemList");

    if (searchInput) {
      searchInput.addEventListener("input", function (event) {
        state.searchValue = event.target.value || "";
        state.searchTerm = normalizeText(event.target.value);
        refreshView();
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", function () {
        state.searchValue = "";
        state.searchTerm = "";
        if (searchInput) searchInput.value = "";
        refreshView();
        if (searchInput) searchInput.focus();
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
      updateSearchUi();
    });
  }

  function refreshView() {
    filterItems();
    renderFilters();
    renderStats();
    renderMarkers();
    renderSelectedItem();
    renderList();
    updateSearchUi();
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
    if (!window.L || !window.TURISMO_DATA || !document.getElementById("tourismMap")) return;
    initMap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
