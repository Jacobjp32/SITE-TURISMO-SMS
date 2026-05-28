(function () {
  "use strict";

  var MAP_TEXT = {
    pt: {
      pageTitle: "Mapa Turístico Interativo",
      pageSubtitle: "Explore pontos turísticos, rotas, gastronomia, hospedagem e serviços em uma visão inicial do destino.",
      pageSupport: "Navegue pelos principais atrativos de São Mateus do Sul, descubra experiencias por categoria e use o mapa como ponto de partida para montar sua visita.",
      pageKicker: "Explorar o Destino",
      heroPanelKicker: "Visao rapida",
      heroPanelText: "Uma leitura organizada para explorar o destino com mapa, filtros e atalhos de consulta.",
      heroPointsLabel: "pontos no mapa",
      heroPlacesLabel: "locais cadastrados",
      heroCategoriesLabel: "categorias",
      heroNote: "Itens sem coordenadas continuam disponiveis no painel para consulta e futura geolocalizacao.",
      actionHome: "Voltar a HOME",
      actionGuide: "Voltar ao guia do visitante",
      actionPlan: "Planejar visita",
      actionRoutes: "Explorar roteiros",
      searchPlaceholder: "Busque por igreja, hotel, erva-mate...",
      searchHint: "Busque por igreja, hotel, erva-mate, praca, evento ou servico.",
      clearSearch: "Limpar",
      resultsCount: "itens visiveis",
      locatedCount: "com localizacao",
      stageTitle: "Exploracao no mapa",
      stageSubtitle: "Clique em um marcador ou card para ver detalhes.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Use os filtros para destacar categorias turisticas.",
      totalItemsLabel: "itens catalogados",
      summaryTitle: "Resumo da exploracao",
      summaryVisible: "visiveis",
      summaryMarkers: "com marker",
      summaryGroups: "grupos ativos",
      summaryNote: "Use os grupos abaixo do mapa para alternar entre roteiros, servicos e demais experiencias.",
      selectedTitle: "Local em destaque",
      selectedEmpty: "Selecione um ponto no mapa ou nos cards para ver imagem, categoria, descricao e acoes rapidas.",
      listTitle: "Locais e experiencias",
      listIntro: "Os cards abaixo acompanham a busca e os filtros. Clique em um local para destacar no mapa e abrir acoes rapidas.",
      listEmpty: "Nenhum item encontrado com os filtros atuais.",
      listEmptyFiltered: "Nenhum resultado neste filtro. Tente buscar em Todos.",
      listEmptySearch: "Nenhum local corresponde a essa busca no momento.",
      details: "Ver detalhes",
      directions: "Como chegar",
      noCoordinates: "Sem localizacao cadastrada",
      noImage: "Sem imagem",
      noDescription: "Descricao em atualizacao.",
      routeBadge: "Roteiro tematico",
      routeSupport: "Pontos relacionados disponiveis no mapa.",
      closeDetails: "Fechar detalhes",
      contact: "Contato",
      whatsapp: "WhatsApp",
      address: "Endereco",
      hours: "Horario",
      services: "Servicos e tags",
      relatedRoute: "Rota relacionada",
      externalLink: "Link externo",
      gallery: "Galeria",
      detailsTitleSuffix: "Detalhes do local",
      cardSelected: "Selecionado no mapa",
      groupItemsSingle: "1 item",
      groupItemsMany: "{count} itens",
      missingTitle: "Itens sem localizacao exata",
      missingDescription: "Alguns itens ainda nao possuem localizacao cadastrada, mas continuam disponiveis para consulta e podem ser completados futuramente.",
      missingSummarySingle: "1 item sem localizacao exata",
      missingSummaryMany: "{count} itens sem localizacao exata",
      popupDetails: "Ver detalhes",
      popupDirections: "Como chegar",
      upcomingEventsTitle: "Proximos eventos neste local",
      upcomingEventsSingle: "1 evento futuro",
      upcomingEventsMany: "{count} eventos futuros",
      upcomingEventsMore: "+{count} outros eventos",
      eventAction: "Saiba mais",
      searchResultsSingle: "1 local encontrado.",
      searchResultsMany: "{count} locais encontrados.",
      searchResultsFiltered: "{count} locais neste filtro.",
      categories: {
        all: "Todos",
        history: "Historia",
        culture: "Cultura",
        nature: "Natureza",
        gastronomy: "Gastronomia",
        lodging: "Hospedagem",
        events: "Eventos",
        services: "Servicos"
      },
      categoryLabels: {
        history: "Historia",
        culture: "Cultura",
        nature: "Natureza",
        gastronomy: "Gastronomia",
        lodging: "Hospedagem",
        events: "Eventos",
        services: "Servicos"
      },
      panelGroups: {
        all: "Todos",
        points: "Pontos Turisticos",
        routes: "Roteiros",
        gastronomy: "Gastronomia",
        lodging: "Hospedagem",
        events: "Eventos",
        services: "Servicos"
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
      stageSubtitle: "Click a marker or card to see details.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Use filters to highlight tourism categories.",
      totalItemsLabel: "cataloged items",
      summaryTitle: "Exploration summary",
      summaryVisible: "visible",
      summaryMarkers: "with marker",
      summaryGroups: "active groups",
      summaryNote: "Use the groups below the map to switch between routes, services and other experiences.",
      selectedTitle: "Featured place",
      selectedEmpty: "Select a map marker or card to view image, category, description and quick actions.",
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
      routeBadge: "Themed route",
      routeSupport: "Related places remain available on the map.",
      closeDetails: "Close details",
      contact: "Contact",
      whatsapp: "WhatsApp",
      address: "Address",
      hours: "Hours",
      services: "Services and tags",
      relatedRoute: "Related route",
      externalLink: "External link",
      gallery: "Gallery",
      detailsTitleSuffix: "Place details",
      cardSelected: "Selected on map",
      groupItemsSingle: "1 item",
      groupItemsMany: "{count} items",
      missingTitle: "Items without exact location",
      missingDescription: "Some items do not yet have a registered location, but remain available for consultation and can be completed later.",
      missingSummarySingle: "1 item without exact location",
      missingSummaryMany: "{count} items without exact location",
      popupDetails: "View details",
      popupDirections: "Directions",
      upcomingEventsTitle: "Upcoming events at this place",
      upcomingEventsSingle: "1 upcoming event",
      upcomingEventsMany: "{count} upcoming events",
      upcomingEventsMore: "+{count} more events",
      eventAction: "Learn more",
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
      },
      panelGroups: {
        all: "All",
        points: "Attractions",
        routes: "Routes",
        gastronomy: "Food",
        lodging: "Lodging",
        events: "Events",
        services: "Services"
      }
    },
    es: {
      pageTitle: "Mapa Turistico Interactivo",
      pageSubtitle: "Explora atractivos, rutas, gastronomia, hospedaje y servicios en una primera vision del destino.",
      pageSupport: "Recorre los principales atractivos de Sao Mateus do Sul, descubre experiencias por categoria y usa el mapa como punto de partida para planificar tu visita.",
      pageKicker: "Explorar el Destino",
      heroPanelKicker: "Vista rapida",
      heroPanelText: "Una lectura organizada para explorar el destino con mapa, filtros y accesos rapidos.",
      heroPointsLabel: "puntos en el mapa",
      heroPlacesLabel: "lugares registrados",
      heroCategoriesLabel: "categorias",
      heroNote: "Los elementos sin coordenadas siguen disponibles en el panel para consulta y futura geolocalizacion.",
      actionHome: "Volver al inicio",
      actionGuide: "Volver a la guia del visitante",
      actionPlan: "Planificar visita",
      actionRoutes: "Explorar rutas",
      searchPlaceholder: "Busca iglesia, hotel, yerba mate...",
      searchHint: "Busca iglesia, hotel, yerba mate, plaza, evento o servicio.",
      clearSearch: "Limpiar",
      resultsCount: "elementos visibles",
      locatedCount: "con ubicacion",
      stageTitle: "Exploracion en el mapa",
      stageSubtitle: "Haz clic en un marcador o tarjeta para ver detalles.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Usa los filtros para destacar categorias turisticas.",
      totalItemsLabel: "elementos catalogados",
      summaryTitle: "Resumen de exploracion",
      summaryVisible: "visibles",
      summaryMarkers: "con marcador",
      summaryGroups: "grupos activos",
      summaryNote: "Usa los grupos debajo del mapa para alternar entre rutas, servicios y otras experiencias.",
      selectedTitle: "Lugar destacado",
      selectedEmpty: "Selecciona un marcador o tarjeta para ver imagen, categoria, descripcion y acciones rapidas.",
      listTitle: "Lugares y experiencias",
      listIntro: "Las tarjetas de abajo acompanhan la busqueda y los filtros. Haz clic en un lugar para destacarlo en el mapa y abrir acciones rapidas.",
      listEmpty: "No se encontraron elementos con los filtros actuales.",
      listEmptyFiltered: "No hay resultados en este filtro. Intenta buscar en Todos.",
      listEmptySearch: "Ningun lugar coincide con esta busqueda.",
      details: "Ver detalles",
      directions: "Como llegar",
      noCoordinates: "Sin ubicacion registrada",
      noImage: "Sin imagen",
      noDescription: "Descripcion en actualizacion.",
      routeBadge: "Ruta tematica",
      routeSupport: "Los puntos relacionados siguen disponibles en el mapa.",
      closeDetails: "Cerrar detalles",
      contact: "Contacto",
      whatsapp: "WhatsApp",
      address: "Direccion",
      hours: "Horario",
      services: "Servicios y etiquetas",
      relatedRoute: "Ruta relacionada",
      externalLink: "Enlace externo",
      gallery: "Galeria",
      detailsTitleSuffix: "Detalles del lugar",
      cardSelected: "Seleccionado en el mapa",
      groupItemsSingle: "1 elemento",
      groupItemsMany: "{count} elementos",
      missingTitle: "Elementos sin ubicacion exacta",
      missingDescription: "Algunos elementos aun no tienen ubicacion registrada, pero siguen disponibles para consulta y pueden completarse mas adelante.",
      missingSummarySingle: "1 elemento sin ubicacion exacta",
      missingSummaryMany: "{count} elementos sin ubicacion exacta",
      popupDetails: "Ver detalles",
      popupDirections: "Como llegar",
      upcomingEventsTitle: "Proximos eventos en este lugar",
      upcomingEventsSingle: "1 proximo evento",
      upcomingEventsMany: "{count} proximos eventos",
      upcomingEventsMore: "+{count} eventos mas",
      eventAction: "Saber mas",
      searchResultsSingle: "1 lugar encontrado.",
      searchResultsMany: "{count} lugares encontrados.",
      searchResultsFiltered: "{count} lugares en este filtro.",
      categories: {
        all: "Todos",
        history: "Historia",
        culture: "Cultura",
        nature: "Naturaleza",
        gastronomy: "Gastronomia",
        lodging: "Hospedaje",
        events: "Eventos",
        services: "Servicios"
      },
      categoryLabels: {
        history: "Historia",
        culture: "Cultura",
        nature: "Naturaleza",
        gastronomy: "Gastronomia",
        lodging: "Hospedaje",
        events: "Eventos",
        services: "Servicios"
      },
      panelGroups: {
        all: "Todos",
        points: "Puntos turisticos",
        routes: "Rutas",
        gastronomy: "Gastronomia",
        lodging: "Hospedaje",
        events: "Eventos",
        services: "Servicios"
      }
    },
    pl: {
      pageTitle: "Interaktywna Mapa Turystyczna",
      pageSubtitle: "Odkrywaj atrakcje, trasy, gastronomie, noclegi i uslugi w pierwszej wersji mapy destynacji.",
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
      stageSubtitle: "Kliknij znacznik lub karte, aby zobaczyc szczegoly.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Uzyj filtrow, aby wyroznic kategorie turystyczne.",
      totalItemsLabel: "skatalogowanych elementow",
      summaryTitle: "Podsumowanie eksploracji",
      summaryVisible: "widoczne",
      summaryMarkers: "z markerem",
      summaryGroups: "aktywne grupy",
      summaryNote: "Uzyj grup pod mapa, aby przelaczac trasy, uslugi i pozostale doswiadczenia.",
      selectedTitle: "Wyroznione miejsce",
      selectedEmpty: "Wybierz znacznik mapy lub karte, aby zobaczyc zdjecie, kategorie, opis i szybkie akcje.",
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
      routeBadge: "Trasa tematyczna",
      routeSupport: "Powiazane miejsca pozostaja dostepne na mapie.",
      closeDetails: "Zamknij szczegoly",
      contact: "Kontakt",
      whatsapp: "WhatsApp",
      address: "Adres",
      hours: "Godziny",
      services: "Uslugi i tagi",
      relatedRoute: "Powiazana trasa",
      externalLink: "Link zewnetrzny",
      gallery: "Galeria",
      detailsTitleSuffix: "Szczegoly miejsca",
      cardSelected: "Wybrane na mapie",
      groupItemsSingle: "1 element",
      groupItemsMany: "{count} elementow",
      missingTitle: "Elementy bez dokladnej lokalizacji",
      missingDescription: "Niektore elementy nie maja jeszcze zapisanej lokalizacji, ale nadal sa dostepne do przegladania i moga zostac uzupelnione pozniej.",
      missingSummarySingle: "1 element bez dokladnej lokalizacji",
      missingSummaryMany: "{count} elementow bez dokladnej lokalizacji",
      popupDetails: "Zobacz szczegoly",
      popupDirections: "Jak dojechac",
      upcomingEventsTitle: "Nadchodzace wydarzenia w tym miejscu",
      upcomingEventsSingle: "1 nadchodzace wydarzenie",
      upcomingEventsMany: "{count} nadchodzace wydarzenia",
      upcomingEventsMore: "+{count} kolejnych wydarzen",
      eventAction: "Dowiedz sie wiecej",
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
      },
      panelGroups: {
        all: "Wszystko",
        points: "Atrakcje",
        routes: "Trasy",
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

  var PANEL_GROUP_CONFIG = {
    all: { icon: "TO", slug: "todos" },
    points: { icon: "PT", slug: "pontos-turisticos" },
    routes: { icon: "RO", slug: "roteiros" },
    gastronomy: { icon: "GA", slug: "gastronomia" },
    lodging: { icon: "HO", slug: "hospedagem" },
    events: { icon: "EV", slug: "eventos" },
    services: { icon: "SE", slug: "servicos" }
  };

  var FILTER_ORDER = ["all", "history", "culture", "nature", "gastronomy", "lodging", "events", "services"];
  var PANEL_GROUP_ORDER = ["all", "points", "routes", "gastronomy", "lodging", "events", "services"];

  var state = {
    map: null,
    markersLayer: null,
    markerIndex: {},
    items: [],
    approvedEvents: [],
    filteredItems: [],
    missingItems: [],
    selectedItemId: null,
    activeFilter: "all",
    panelGroup: "all",
    searchTerm: "",
    searchValue: "",
    lang: "pt",
    detailsModal: null,
    detailsLastFocus: null,
    detailsLastItemId: null,
    approvedEventsReady: false,
    debugApprovedEvents: /(?:\?|&)debug=map-events(?:&|$)/.test(window.location.search)
  };

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function normalizeComparableText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function toComparableSlug(value) {
    return normalizeComparableText(value).replace(/\s+/g, "-");
  }

  function cleanTextValue(value) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u001F\u007F]+/g, " ")
      .replace(/\s+/g, " ")
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function truncateText(value, limit) {
    var text = cleanTextValue(value);
    if (!text || text.length <= limit) return text;
    return text.slice(0, Math.max(limit - 1, 1)).trim() + "...";
  }

  function uniqueList(values) {
    var seen = {};
    return ensureArray(values).reduce(function (list, value) {
      var item = String(value || "").trim();
      var key = normalizeText(item);
      if (!item || seen[key]) return list;
      seen[key] = true;
      list.push(item);
      return list;
    }, []);
  }

  function normalizeImages(item) {
    var images = []
      .concat(ensureArray(item.galeria))
      .concat(ensureArray(item.imagens))
      .concat(ensureArray(item.fotos))
      .concat(ensureArray(item.images));

    if (item.imagem) {
      images.unshift(item.imagem);
    }

    return uniqueList(images).filter(function (image) {
      return !/\.(heic|dng)$/i.test(image);
    });
  }

  function isExternalUrl(value) {
    return /^https?:\/\//i.test(String(value || ""));
  }

  function normalizeSocialLink(value) {
    var social = String(value || "").trim();
    if (!social) return "";
    if (isExternalUrl(social)) return social;
    if (social.charAt(0) === "@") {
      return "https://www.instagram.com/" + social.replace(/^@+/, "");
    }
    return "";
  }

  function getFirstPhoneDigits(value) {
    var matches = String(value || "").match(/\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);
    if (!matches) return "";
    var digits = matches[0].replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) return "55" + digits;
    return digits.length >= 12 ? digits : "";
  }

  function createWhatsAppLink(value) {
    var digits = getFirstPhoneDigits(value);
    return digits ? "https://wa.me/" + digits : "";
  }

  function isPublicApprovedStatus(status) {
    var normalized = normalizeComparableText(status);
    return !normalized || normalized === "aprovado" || normalized === "approved";
  }

  function sanitizeActionUrl(value, fallback) {
    var raw = cleanTextValue(value);
    if (!raw) return fallback || "";
    if (isExternalUrl(raw)) return raw;
    if (/^www\./i.test(raw)) return "https://" + raw;
    if (/^\//.test(raw)) return raw;
    return fallback || "";
  }

  function extractImageUrl(value) {
    if (!value) return "";
    if (typeof value === "string") return cleanTextValue(value);
    if (typeof value === "object") {
      return cleanTextValue(value.url || value.src || value.path || value.image);
    }
    return "";
  }

  function extractImageUrls(values) {
    var urls = [];
    ensureArray(values).forEach(function (item) {
      var url = extractImageUrl(item);
      if (url) urls.push(url);
    });
    return uniqueList(urls);
  }

  function toDateObject(value) {
    if (!value) return null;

    try {
      if (typeof value.toDate === "function") {
        var firestoreDate = value.toDate();
        return isFinite(firestoreDate.getTime()) ? firestoreDate : null;
      }

      if (typeof value.seconds === "number") {
        var timestampDate = new Date(value.seconds * 1000);
        return isFinite(timestampDate.getTime()) ? timestampDate : null;
      }

      if (value instanceof Date) {
        return isFinite(value.getTime()) ? value : null;
      }

      var raw = cleanTextValue(value);
      if (!raw) return null;

      var isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
      if (isoMatch) {
        return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 0, 0, 0, 0);
      }

      var brMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+.*)?$/);
      if (brMatch) {
        return new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]), 0, 0, 0, 0);
      }

      var parsed = new Date(raw);
      return isFinite(parsed.getTime()) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function parseTimeParts(value) {
    var raw = cleanTextValue(value);
    var match = raw.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;

    var hours = Number(match[1]);
    var minutes = Number(match[2]);
    if (!isFinite(hours) || !isFinite(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return { hours: hours, minutes: minutes };
  }

  function buildEventStartAt(dateValue, timeValue) {
    var baseDate = toDateObject(dateValue);
    if (!baseDate) return null;

    var timeParts = parseTimeParts(timeValue);
    if (timeParts) {
      baseDate.setHours(timeParts.hours, timeParts.minutes, 0, 0);
      return baseDate;
    }

    baseDate.setHours(23, 59, 59, 999);
    return baseDate;
  }

  function formatEventDate(dateValue) {
    var date = toDateObject(dateValue);
    if (!date) return "";
    return date.toLocaleDateString("pt-BR");
  }

  function formatApprovedEventSchedule(event) {
    var dateLabel = formatEventDate(event && event.dateValue);
    var timeLabel = cleanTextValue(event && event.timeValue);

    if (dateLabel && timeLabel) return dateLabel + " às " + timeLabel;
    if (dateLabel) return dateLabel;
    if (timeLabel) return timeLabel;
    return "";
  }

  function compareApprovedEvents(a, b) {
    var timeA = a && a.startAt ? a.startAt.getTime() : Number.POSITIVE_INFINITY;
    var timeB = b && b.startAt ? b.startAt.getTime() : Number.POSITIVE_INFINITY;

    if (timeA !== timeB) return timeA - timeB;
    return String(a && a.title || "").localeCompare(String(b && b.title || ""), "pt-BR");
  }

  function isUpcomingApprovedEvent(event) {
    return !!(event && event.startAt && event.startAt.getTime() >= Date.now());
  }

  function normalizeApprovedEvent(rawEvent, docId) {
    var raw = rawEvent || {};
    var images = extractImageUrls(raw.images);
    var mainImage = cleanTextValue(raw.mainImage) || extractImageUrl(raw.image) || (images[0] || "");

    if (mainImage && images.indexOf(mainImage) === -1) {
      images.unshift(mainImage);
    }

    var normalized = {
      id: cleanTextValue(docId || raw.id) || ("evento-" + String(Date.now())),
      title: cleanTextValue(raw.title || raw.nome) || "Evento sem título",
      description: cleanTextValue(raw.description || raw.descricao),
      dateValue: raw.date || raw.data || raw.dataInicio || "",
      timeValue: cleanTextValue(raw.time || raw.hora || raw.horaInicio),
      location: cleanTextValue(raw.location || raw.local || raw.establishmentName || raw.linkedEstablishmentName || raw.organizer),
      organizer: cleanTextValue(raw.organizer || raw.establishmentName || raw.linkedEstablishmentName || raw.ownerName),
      establishmentId: cleanTextValue(raw.establishmentId || raw.linkedEstablishmentId || raw.establishmentSlug),
      establishmentName: cleanTextValue(raw.establishmentName || raw.linkedEstablishmentName || raw.organizer || raw.location || raw.local),
      mainImage: mainImage,
      value: cleanTextValue(raw.value || raw.valor || raw.entrada),
      site: cleanTextValue(raw.website || raw.site || raw.url),
      whatsapp: cleanTextValue(raw.whatsapp || raw.phone || raw.telefone || raw.contato),
      status: normalizeComparableText(raw.status),
      images: images
    };

    normalized.startAt = buildEventStartAt(normalized.dateValue, normalized.timeValue);
    normalized.actionUrl = sanitizeActionUrl(normalized.site, "") || "/eventos";
    normalized.actionExternal = isExternalUrl(normalized.actionUrl);

    return normalized;
  }

  function getItemMatchScore(event, item) {
    if (!event || !item) return 0;

    var itemId = normalizeComparableText(item.id);
    var itemIdSlug = toComparableSlug(item.id);
    var itemName = normalizeComparableText(item.nome);
    var itemNameSlug = toComparableSlug(item.nome);
    var eventEstablishmentId = normalizeComparableText(event.establishmentId);
    var eventEstablishmentSlug = toComparableSlug(event.establishmentId);
    var eventEstablishmentName = normalizeComparableText(event.establishmentName);
    var eventOrganizer = normalizeComparableText(event.organizer);
    var eventLocation = normalizeComparableText(event.location);

    if (eventEstablishmentId && (
      eventEstablishmentId === itemId ||
      eventEstablishmentId === itemName ||
      eventEstablishmentSlug === itemIdSlug ||
      eventEstablishmentSlug === itemNameSlug
    )) {
      return 4;
    }

    if (eventEstablishmentName && eventEstablishmentName === itemName) {
      return 3;
    }

    if (eventOrganizer && eventOrganizer === itemName) {
      return 2;
    }

    if (eventLocation && eventLocation === itemName) {
      return 1;
    }

    return 0;
  }

  function debugApprovedEventIssue(message, payload) {
    if (!state.debugApprovedEvents) return;
    console.warn("[mapa-turistico] " + message, payload || {});
  }

  function attachApprovedEventsToItems(items, approvedEvents) {
    ensureArray(items).forEach(function (item) {
      item.relatedApprovedEvents = [];
    });

    ensureArray(approvedEvents).forEach(function (event) {
      var bestItem = null;
      var bestScore = 0;
      var ambiguous = false;

      ensureArray(items).forEach(function (item) {
        var score = getItemMatchScore(event, item);
        if (!score) return;

        if (score > bestScore) {
          bestItem = item;
          bestScore = score;
          ambiguous = false;
          return;
        }

        if (score === bestScore) {
          ambiguous = true;
        }
      });

      if (!bestItem || ambiguous) {
        debugApprovedEventIssue(ambiguous ? "Evento aprovado com vinculo ambiguo." : "Evento aprovado sem vinculo seguro no mapa.", {
          eventId: event.id,
          title: event.title,
          establishmentId: event.establishmentId,
          establishmentName: event.establishmentName,
          organizer: event.organizer,
          location: event.location
        });
        return;
      }

      bestItem.relatedApprovedEvents.push(event);
    });

    ensureArray(items).forEach(function (item) {
      item.relatedApprovedEvents.sort(compareApprovedEvents);
    });
  }

  function getUpcomingApprovedEventsForItem(item) {
    return ensureArray(item && item.relatedApprovedEvents).filter(isUpcomingApprovedEvent).sort(compareApprovedEvents);
  }

  function renderApprovedEventImage(event) {
    if (!event || !event.mainImage) {
      return '<div class="map-related-event-fallback" aria-hidden="true"><span>EV</span><small>' + escapeHtml(t("categories.events")) + "</small></div>";
    }

    return '<img src="' + escapeHtml(event.mainImage) + '" alt="' + escapeHtml(event.title) + '" loading="lazy">';
  }

  function renderApprovedEventsSection(item, context) {
    var events = getUpcomingApprovedEventsForItem(item);
    if (!events.length) return "";

    var visibleEvents = events.slice(0, 3);
    var countLabel = events.length === 1
      ? t("upcomingEventsSingle")
      : replaceCount(t("upcomingEventsMany"), events.length);

    return '<section class="map-related-events is-' + escapeHtml(context || "panel") + '">'
      + '<div class="map-related-events-head">'
      + '<h3>' + escapeHtml(t("upcomingEventsTitle")) + '</h3>'
      + '<span>' + escapeHtml(countLabel) + "</span>"
      + "</div>"
      + '<div class="map-related-events-list">'
      + visibleEvents.map(function (event, index) {
        var description = truncateText(event.description, context === "modal" ? 180 : 110);
        var schedule = formatApprovedEventSchedule(event);
        var chips = [];

        if (schedule) {
          chips.push('<span class="map-related-event-chip">📅 ' + escapeHtml(schedule) + "</span>");
        }
        if (event.value) {
          chips.push('<span class="map-related-event-chip">💲 ' + escapeHtml(event.value) + "</span>");
        }

        return '<article class="map-related-event-card' + (events.length === 1 && index === 0 ? " is-featured" : "") + '">'
          + '<div class="map-related-event-media">' + renderApprovedEventImage(event) + "</div>"
          + '<div class="map-related-event-body">'
          + '<h4>' + escapeHtml(event.title) + "</h4>"
          + (description ? '<p>' + escapeHtml(description) + "</p>" : "")
          + (chips.length ? '<div class="map-related-event-meta">' + chips.join("") + "</div>" : "")
          + '<div class="map-related-event-actions">'
          + '<a class="map-button' + (events.length === 1 && index === 0 ? " primary" : "") + '" href="' + escapeHtml(event.actionUrl) + '"' + (event.actionExternal ? ' target="_blank" rel="noopener noreferrer"' : "") + '>' + escapeHtml(t("eventAction")) + "</a>"
          + "</div>"
          + "</div>"
          + "</article>";
      }).join("")
      + "</div>"
      + (events.length > visibleEvents.length
        ? '<p class="map-related-events-more">' + escapeHtml(replaceCount(t("upcomingEventsMore"), events.length - visibleEvents.length)) + "</p>"
        : "")
      + "</section>";
  }

  async function ensurePublicFirestore() {
    if (!window.CONFIG || !window.CONFIG.firebase) {
      console.warn("[mapa-turistico] CONFIG.firebase ausente. Eventos aprovados não serão carregados.");
      return null;
    }

    if (!window.firebase || !window.firebase.initializeApp || !window.firebase.firestore) {
      console.warn("[mapa-turistico] Firebase compat indisponível no mapa. Mantendo apenas dados estáticos.");
      return null;
    }

    try {
      if (!window.firebase.apps || !window.firebase.apps.length) {
        window.firebase.initializeApp(window.CONFIG.firebase);
      }

      if (window.firebase.appCheck && !window.__smsCompatAppCheckInitialized) {
        try {
          var appCheckModule = await import("./firebase-app-check.js");
          if (appCheckModule && typeof appCheckModule.initCompatAppCheck === "function") {
            await appCheckModule.initCompatAppCheck(window.firebase);
          }
        } catch (appCheckError) {
          console.warn("[mapa-turistico] App Check indisponível para o mapa público.", appCheckError && appCheckError.message ? appCheckError.message : appCheckError);
        }
      }

      return window.firebase.firestore();
    } catch (error) {
      console.warn("[mapa-turistico] Falha ao inicializar Firestore público no mapa.", error);
      return null;
    }
  }

  async function loadApprovedEventsForMap() {
    var db = await ensurePublicFirestore();
    if (!db) {
      state.approvedEventsReady = true;
      return;
    }

    try {
      var snapshot = await db.collection("eventos_aprovados").get();
      var approvedEvents = snapshot.docs
        .map(function (doc) { return normalizeApprovedEvent(doc.data(), doc.id); })
        .filter(function (event) { return isPublicApprovedStatus(event.status); });

      state.approvedEvents = approvedEvents;
      attachApprovedEventsToItems(state.items, approvedEvents);
      state.approvedEventsReady = true;
      refreshView();
    } catch (error) {
      console.warn("[mapa-turistico] Falha ao carregar eventos aprovados do Firestore.", {
        collection: "eventos_aprovados",
        filter: "status ausente || aprovado || approved",
        error: error,
        stack: error && error.stack ? error.stack : null
      });
      state.approvedEventsReady = true;
    }
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
    if (normalizedCategory.indexOf("cultura") !== -1 || normalizedCategory.indexOf("cultural") !== -1) return "culture";
    if (normalizedCategory.indexOf("natureza") !== -1) return "nature";
    if (normalizedCategory.indexOf("gastronomia") !== -1 || normalizedCategory.indexOf("gastronom") !== -1) return "gastronomy";
    if (normalizedCategory.indexOf("hospedagem") !== -1) return "lodging";
    if (normalizedCategory.indexOf("evento") !== -1) return "events";
    if (normalizedCategory.indexOf("servico") !== -1) return "services";
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
    if (source.indexOf("evento") !== -1 || source.indexOf("agenda") !== -1 || source.indexOf("festa") !== -1) {
      return "events";
    }
    if (source.indexOf("servico") !== -1 || source.indexOf("atendimento") !== -1 || source.indexOf("contato") !== -1 || source.indexOf("informacoes") !== -1 || source.indexOf("roteiro") !== -1 || source.indexOf("institucional") !== -1) {
      return "services";
    }

    if (itemType === "rota") return "culture";
    return "culture";
  }

  function isRouteItem(item) {
    return !!item && item.panelGroup === "routes";
  }

  function getPanelGroup(itemType) {
    if (itemType === "rota") return "routes";
    if (itemType === "ponto") return "points";
    if (itemType === "restaurante") return "gastronomy";
    if (itemType === "hospedagem") return "lodging";
    if (itemType === "evento") return "events";
    return "services";
  }

  function createGoogleMapsLink(item, coordinates) {
    if (coordinates && item.mapsUrl) {
      return item.mapsUrl;
    }
    if (coordinates) {
      return "https://www.google.com/maps/search/?api=1&query=" + coordinates.lat + "," + coordinates.lng;
    }
    return "";
  }

  function normalizeItem(item, itemType) {
    if (!item || !item.nome) return null;

    var coordinates = getCoordinates(item);
    var broadCategory = classifyCategory(itemType, item.categoria, item.tags, item.descricao);
    var panelGroup = getPanelGroup(itemType);
    var gallery = normalizeImages(item);
    var externalLink = item.site || item.website || item.instagram || item.social || item.facebook || (isExternalUrl(item.url) ? item.url : "");
    var contactLink = normalizeSocialLink(item.instagram || item.social || item.facebook) || (isExternalUrl(item.site || item.website) ? item.site || item.website : "") || (isExternalUrl(item.url) ? item.url : "");

    return {
      id: item.id || item.nome,
      nome: item.nome,
      tipo: itemType,
      panelGroup: panelGroup,
      categoriaOriginal: item.categoria || "",
      categoriaMapa: broadCategory,
      categoriaLabel: t("categoryLabels." + broadCategory, item.categoria || ""),
      descricao: item.descricao || "",
      descricaoLonga: item.descricaoLonga || item.historia || "",
      imagem: item.imagem || gallery[0] || "",
      galeria: gallery,
      url: item.url || "",
      telefone: item.telefone || "",
      whatsappUrl: createWhatsAppLink(item.telefone),
      localizacao: item.localizacao || item.local || item.endereco || "",
      endereco: item.endereco || item.localizacao || item.local || "",
      periodo: item.periodo || item.horario || "",
      horario: item.horario || item.hours || item.periodo || "",
      destaque: item.destaque || "",
      rota: item.rota || item.route || item.legacyRouteName || "",
      site: item.site || item.website || "",
      instagram: item.instagram || item.social || "",
      facebook: item.facebook || "",
      videoUrl: item.videoUrl || "",
      externalLink: isExternalUrl(externalLink) ? externalLink : normalizeSocialLink(externalLink),
      contactLink: contactLink,
      acessibilidade: item.acessibilidade || "",
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
        item.endereco,
        item.periodo,
        item.horario,
        item.telefone,
        item.site,
        item.instagram,
        item.social,
        item.rota,
        Array.isArray(item.tags) ? item.tags.join(" ") : item.tags
      ].join(" "))
    };
  }

  function buildItems() {
    var data = window.TURISMO_DATA || {};
    var points = (data.pontos || []).map(function (item) { return normalizeItem(item, "ponto"); });
    var routes = (data.rotas || []).map(function (item) { return normalizeItem(item, "rota"); });
    var lodging = (data.hospedagens || []).map(function (item) { return normalizeItem(item, "hospedagem"); });
    var restaurants = (data.restaurantes || []).map(function (item) { return normalizeItem(item, "restaurante"); });
    var events = (data.eventos || []).map(function (item) { return normalizeItem(item, "evento"); });
    var services = (data.informacoesEssenciais || []).map(function (item) { return normalizeItem(item, "servico"); });

    return points.concat(routes, lodging, restaurants, events, services).filter(Boolean);
  }

  function resolveFilterAlias(value) {
    var normalized = normalizeText(value);
    var aliases = {
      all: "all",
      todos: "all",
      historia: "history",
      history: "history",
      cultura: "culture",
      culture: "culture",
      natureza: "nature",
      nature: "nature",
      gastronomia: "gastronomy",
      gastronomy: "gastronomy",
      food: "gastronomy",
      hospedagem: "lodging",
      hospedaje: "lodging",
      lodging: "lodging",
      eventos: "events",
      event: "events",
      events: "events",
      servicos: "services",
      servicoss: "services",
      servicoses: "services",
      services: "services"
    };
    return aliases[normalized] || null;
  }

  function resolvePanelGroupAlias(value) {
    var normalized = normalizeText(value).replace(/^#/, "");
    var aliases = {
      all: "all",
      todos: "all",
      points: "points",
      ponto: "points",
      pontos: "points",
      pontosturisticos: "points",
      "pontos-turisticos": "points",
      attractions: "points",
      routes: "routes",
      route: "routes",
      roteiro: "routes",
      roteiros: "routes",
      rotas: "routes",
      gastronomy: "gastronomy",
      gastronomia: "gastronomy",
      food: "gastronomy",
      hospedagem: "lodging",
      lodging: "lodging",
      events: "events",
      eventos: "events",
      services: "services",
      servicos: "services",
      servicoss: "services",
      servicoses: "services"
    };
    return aliases[normalized] || null;
  }

  function getPanelGroupSlug(groupId) {
    return (PANEL_GROUP_CONFIG[groupId] || PANEL_GROUP_CONFIG.all).slug;
  }

  function getDefaultPanelGroupForFilter(filterId) {
    if (filterId === "gastronomy") return "gastronomy";
    if (filterId === "lodging") return "lodging";
    if (filterId === "events") return "events";
    if (filterId === "services") return "services";
    if (filterId === "history" || filterId === "culture" || filterId === "nature") return "points";
    return "all";
  }

  function applyInitialStateFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var requestedFilter = resolveFilterAlias(params.get("categoria") || params.get("filter"));
    var requestedGroup = resolvePanelGroupAlias(params.get("grupo") || window.location.hash.replace(/^#/, ""));

    if (requestedFilter) {
      state.activeFilter = requestedFilter;
      state.panelGroup = getDefaultPanelGroupForFilter(requestedFilter);
    }

    if (requestedGroup) {
      state.panelGroup = requestedGroup;
    }

    var rawCategory = normalizeText(params.get("categoria"));
    if (rawCategory === "roteiros" || rawCategory === "rotas") {
      state.activeFilter = "all";
      state.panelGroup = "routes";
    }
  }

  function syncUrlState() {
    if (!window.history || !window.history.replaceState) return;

    var params = new URLSearchParams();
    if (state.activeFilter !== "all") {
      params.set("categoria", t("categories." + state.activeFilter, state.activeFilter));
    }
    if (state.panelGroup !== "all") {
      params.set("grupo", getPanelGroupSlug(state.panelGroup));
    }

    var query = params.toString();
    var nextUrl = window.location.pathname + (query ? "?" + query : "");
    if (nextUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", nextUrl);
    }
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

  function getPanelGroupLabel(groupId) {
    return t("panelGroups." + groupId, groupId);
  }

  function getPanelGroupCount(groupId) {
    if (groupId === "all") return state.filteredItems.length;
    return state.filteredItems.filter(function (item) { return item.panelGroup === groupId; }).length;
  }

  function getPanelItems(groupId) {
    if (groupId === "all") return state.filteredItems.slice();
    return state.filteredItems.filter(function (item) { return item.panelGroup === groupId; });
  }

  function getCurrentListItems() {
    return getPanelItems(state.panelGroup);
  }

  function getCurrentMissingItems() {
    return getCurrentListItems().filter(function (item) { return !item.possuiCoordenadas; });
  }

  function getSelectedItem() {
    var selected = getItemById(state.selectedItemId);
    var scopedItems = getCurrentListItems();

    if (selected && state.filteredItems.some(function (entry) { return entry.id === selected.id; })) {
      if (state.panelGroup === "all" || selected.panelGroup === state.panelGroup) {
        return selected;
      }
    }

    return scopedItems[0] || state.filteredItems[0] || state.items.find(function (entry) { return entry.possuiCoordenadas; }) || null;
  }

  function getItemById(id) {
    return state.items.find(function (item) { return item.id === id; }) || null;
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

  function getGroupCountLabel(count) {
    if (count === 1) return t("groupItemsSingle");
    return replaceCount(t("groupItemsMany"), count);
  }

  function getMissingSummary(count) {
    if (count === 1) return t("missingSummarySingle");
    return replaceCount(t("missingSummaryMany"), count);
  }

  function getImageHtml(item, className) {
    if (!item.imagem) {
      if (isRouteItem(item)) {
        return '<div class="' + className + ' map-image-fallback is-route" aria-hidden="true"><span>RO</span><small>' + t("routeBadge") + '</small><em>' + t("routeSupport") + "</em></div>";
      }
      return '<div class="' + className + ' map-image-fallback" aria-hidden="true"><span>' + getCategoryConfig(item.categoriaMapa).icon + '</span><small>' + t("noImage") + "</small></div>";
    }
    return '<img src="' + escapeHtml(item.imagem) + '" alt="' + escapeHtml(item.nome) + '" class="' + className + '">';
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

  function renderPanelGroups() {
    var container = document.getElementById("mapPanelGroups");
    if (!container) return;

    container.innerHTML = PANEL_GROUP_ORDER.map(function (groupId) {
      var count = getPanelGroupCount(groupId);
      var config = PANEL_GROUP_CONFIG[groupId] || PANEL_GROUP_CONFIG.all;
      var activeClass = state.panelGroup === groupId ? " is-active" : "";
      return '<button type="button" class="map-panel-group-btn' + activeClass + '" data-group="' + groupId + '" aria-pressed="' + (state.panelGroup === groupId ? "true" : "false") + '">'
        + '<span class="map-panel-group-icon">' + config.icon + '</span>'
        + '<span class="map-panel-group-text">' + getPanelGroupLabel(groupId) + "</span>"
        + '<span class="map-panel-group-count">' + count + "</span></button>";
    }).join("");
  }

  function renderStats() {
    var total = document.getElementById("mapTotalItems");
    var located = document.getElementById("mapLocatedItems");
    var visible = document.getElementById("mapVisibleItems");
    var heroPoints = document.getElementById("mapHeroPoints");
    var heroPlaces = document.getElementById("mapHeroPlaces");
    var heroCategories = document.getElementById("mapHeroCategories");
    var sidebarVisible = document.getElementById("mapSidebarVisible");
    var sidebarMarkers = document.getElementById("mapSidebarMarkers");
    var sidebarGroups = document.getElementById("mapSidebarGroups");

    var locatedCount = state.items.filter(function (item) { return item.possuiCoordenadas; }).length;
    var visibleMarkersCount = state.filteredItems.filter(function (item) { return item.possuiCoordenadas; }).length;
    var activeGroupCount = PANEL_GROUP_ORDER.filter(function (groupId) {
      return groupId !== "all" && getPanelGroupCount(groupId) > 0;
    }).length;

    if (total) total.textContent = state.items.length;
    if (located) located.textContent = locatedCount;
    if (visible) visible.textContent = state.filteredItems.length;
    if (heroPoints) heroPoints.textContent = locatedCount;
    if (heroPlaces) heroPlaces.textContent = state.items.length;
    if (heroCategories) heroCategories.textContent = getAvailableCategoryCount();
    if (sidebarVisible) sidebarVisible.textContent = state.filteredItems.length;
    if (sidebarMarkers) sidebarMarkers.textContent = visibleMarkersCount;
    if (sidebarGroups) sidebarGroups.textContent = activeGroupCount;
  }

  function updateMarkerSelection() {
    Object.keys(state.markerIndex).forEach(function (itemId) {
      var marker = state.markerIndex[itemId];
      var item = getItemById(itemId);
      if (!marker || !item) return;
      marker.setIcon(createMarkerIcon(item.categoriaMapa, itemId === state.selectedItemId));
      marker.setZIndexOffset(itemId === state.selectedItemId ? 200 : 0);
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
          + '<strong>' + escapeHtml(item.nome) + '</strong>'
          + '<span>' + escapeHtml(item.categoriaLabel) + '</span>'
          + '<p>' + escapeHtml(item.descricao || t("noDescription")) + '</p>'
          + '<button type="button" class="map-popup-detail-button" data-map-details-id="' + escapeHtml(item.id) + '">' + t("popupDetails") + '</button>'
          + (item.possuiCoordenadas ? '<a href="' + escapeHtml(item.mapsUrl) + '" target="_blank" rel="noopener noreferrer">' + t("popupDirections") + "</a>" : "")
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

  function ensureDetailsModal() {
    if (state.detailsModal) return state.detailsModal;

    var wrapper = document.createElement("div");
    wrapper.className = "map-details-modal";
    wrapper.setAttribute("data-map-details-modal", "");
    wrapper.setAttribute("hidden", "");
    wrapper.innerHTML = ''
      + '<div class="map-details-backdrop" data-map-details-close></div>'
      + '<section class="map-details-dialog" role="dialog" aria-modal="true" aria-labelledby="mapDetailsTitle" tabindex="-1">'
      + '<button type="button" class="map-details-close" data-map-details-close aria-label="' + escapeHtml(t("closeDetails")) + '">×</button>'
      + '<div class="map-details-content"></div>'
      + '</section>';

    document.body.appendChild(wrapper);
    state.detailsModal = wrapper;

    wrapper.addEventListener("click", function (event) {
      if (event.target.closest("[data-map-details-close]")) {
        closeDetailsModal();
      }
    });

    return wrapper;
  }

  function getFocusableElements(container) {
    return Array.prototype.slice.call(container.querySelectorAll([
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(","))).filter(function (element) {
      return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    });
  }

  function renderMetaRow(label, value) {
    if (!value) return "";
    return '<div class="map-details-info-row"><dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + "</dd></div>";
  }

  function renderDetailsGallery(item) {
    var images = uniqueList(item.galeria || []);
    if (images.length <= 1) return "";

    return '<section class="map-details-gallery" aria-label="' + escapeHtml(t("gallery")) + '">'
      + '<h3>' + escapeHtml(t("gallery")) + '</h3>'
      + '<div class="map-details-gallery-grid">'
      + images.slice(1, 7).map(function (image) {
        return '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(item.nome) + '">';
      }).join("")
      + "</div></section>";
  }

  function renderDetailsModalContent(item) {
    var config = getCategoryConfig(item.categoriaMapa);
    var tags = uniqueList(item.tags).slice(0, 12);
    var description = item.descricao || t("noDescription");
    var longDescription = item.descricaoLonga && item.descricaoLonga !== item.descricao ? item.descricaoLonga : "";
    var routeLabel = isRouteItem(item) ? t("routeBadge") : item.rota;

    return ''
      + '<div class="map-details-media">'
      + getImageHtml(item, "map-details-image")
      + '</div>'
      + '<div class="map-details-body">'
      + '<div class="map-details-heading">'
      + '<span class="map-detail-category is-soft" style="--detail-accent:' + config.accent + ';--detail-color:' + config.color + ';">' + escapeHtml(isRouteItem(item) ? t("routeBadge") : item.categoriaLabel) + '</span>'
      + '<h2 id="mapDetailsTitle">' + escapeHtml(item.nome) + '</h2>'
      + '<p>' + escapeHtml(description) + '</p>'
      + (longDescription ? '<p class="map-details-long">' + escapeHtml(longDescription) + '</p>' : "")
      + (isRouteItem(item) ? '<p class="map-detail-support">' + escapeHtml(t("routeSupport")) + '</p>' : "")
      + '</div>'
      + '<dl class="map-details-info">'
      + renderMetaRow(t("address"), item.endereco || item.localizacao)
      + renderMetaRow(t("contact"), item.telefone)
      + renderMetaRow(t("hours"), item.horario)
      + renderMetaRow(t("relatedRoute"), routeLabel)
      + '</dl>'
      + (tags.length ? '<section class="map-details-tags"><h3>' + escapeHtml(t("services")) + '</h3><div>' + tags.map(function (tag) { return '<span>' + escapeHtml(tag) + '</span>'; }).join("") + '</div></section>' : "")
      + renderApprovedEventsSection(item, "modal")
      + renderDetailsGallery(item)
      + '<div class="map-details-actions">'
      + (item.possuiCoordenadas ? '<a class="map-button primary" href="' + escapeHtml(item.mapsUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t("directions")) + '</a>' : "")
      + (item.whatsappUrl ? '<a class="map-button" href="' + escapeHtml(item.whatsappUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t("whatsapp")) + '</a>' : "")
      + (item.contactLink ? '<a class="map-button" href="' + escapeHtml(item.contactLink) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t("externalLink")) + '</a>' : "")
      + '</div>'
      + '</div>';
  }

  function openDetailsModal(itemId, opener) {
    var item = getItemById(itemId);
    var modal = ensureDetailsModal();
    var content = modal.querySelector(".map-details-content");
    var dialog = modal.querySelector(".map-details-dialog");
    if (!item || !content || !dialog) return;

    state.detailsLastFocus = opener || document.activeElement;
    state.detailsLastItemId = item.id;
    selectItem(item.id, false);
    content.innerHTML = renderDetailsModalContent(item);
    modal.removeAttribute("hidden");
    modal.classList.add("is-open");
    document.body.classList.add("map-details-open");
    dialog.setAttribute("aria-label", item.nome + " - " + t("detailsTitleSuffix"));

    var focusTarget = modal.querySelector(".map-details-close") || dialog;
    focusTarget.focus();
  }

  function closeDetailsModal() {
    var modal = state.detailsModal;
    if (!modal || modal.hasAttribute("hidden")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("hidden", "");
    document.body.classList.remove("map-details-open");

    if (state.detailsLastFocus && document.contains(state.detailsLastFocus) && typeof state.detailsLastFocus.focus === "function") {
      state.detailsLastFocus.focus();
    } else if (state.detailsLastItemId) {
      var nextFocus = Array.prototype.find.call(document.querySelectorAll("[data-map-details-id]"), function (element) {
        return element.getAttribute("data-map-details-id") === state.detailsLastItemId;
      });
      if (nextFocus && typeof nextFocus.focus === "function") {
        nextFocus.focus();
      }
    }
    state.detailsLastFocus = null;
    state.detailsLastItemId = null;
  }

  function handleDetailsKeydown(event) {
    var modal = state.detailsModal;
    if (!modal || modal.hasAttribute("hidden")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeDetailsModal();
      return;
    }

    if (event.key !== "Tab") return;

    var focusable = getFocusableElements(modal);
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
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
    if (item.localizacao) meta.push('<span class="map-meta-chip">📍 ' + escapeHtml(item.localizacao) + "</span>");
    if (item.telefone) meta.push('<span class="map-meta-chip">📞 ' + escapeHtml(item.telefone) + "</span>");
    if (item.periodo) meta.push('<span class="map-meta-chip">📅 ' + escapeHtml(item.periodo) + "</span>");
    if (item.categoriaOriginal && item.panelGroup === "routes") meta.push('<span class="map-meta-chip">🗺️ ' + escapeHtml(item.categoriaOriginal) + "</span>");
    if (isRouteItem(item)) meta.push('<span class="map-meta-chip">' + t("routeBadge") + "</span>");
    if (!item.possuiCoordenadas && !isRouteItem(item)) meta.push('<span class="map-meta-chip">' + t("noCoordinates") + "</span>");

    container.innerHTML = ""
      + '<div class="map-detail">'
      + getImageHtml(item, "map-detail-image")
      + '<div class="map-detail-top">'
      + "<div>"
      + '<span class="map-detail-category is-soft" style="--detail-accent:' + getCategoryConfig(item.categoriaMapa).accent + ';--detail-color:' + getCategoryConfig(item.categoriaMapa).color + ';">' + escapeHtml(item.categoriaLabel) + "</span>"
      + "<h3>" + escapeHtml(item.nome) + "</h3>"
      + "</div>"
      + '<span class="map-detail-badge">' + t("cardSelected") + "</span>"
      + "</div>"
      + "<p>" + escapeHtml(item.descricao || t("noDescription")) + "</p>"
      + (isRouteItem(item) ? '<p class="map-detail-support">' + t("routeSupport") + "</p>" : "")
      + '<div class="map-detail-meta">' + meta.join("") + "</div>"
      + renderApprovedEventsSection(item, "panel")
      + '<div class="map-detail-actions">'
      + '<button type="button" class="map-button primary" data-map-details-id="' + escapeHtml(item.id) + '">' + t("details") + "</button>"
      + (item.possuiCoordenadas ? '<a class="map-button" href="' + escapeHtml(item.mapsUrl) + '" target="_blank" rel="noopener noreferrer">' + t("directions") + "</a>" : "")
      + "</div>"
      + "</div>";
  }

  function renderListCard(item) {
    var selectedClass = item.id === state.selectedItemId ? " is-selected" : "";
    var config = getCategoryConfig(item.categoriaMapa);
    var tags = [];

    tags.push('<span class="map-list-badge" style="--badge-color:' + config.color + ';--badge-accent:' + config.accent + ';">' + config.icon + " " + escapeHtml(item.categoriaLabel) + "</span>");
    if (item.panelGroup === "routes" && item.categoriaOriginal) {
      tags.push('<span class="map-list-badge is-route">' + t("routeBadge") + "</span>");
      tags.push('<span class="map-list-badge is-neutral">RO ' + escapeHtml(item.categoriaOriginal) + "</span>");
    }
    if (!item.possuiCoordenadas && !isRouteItem(item)) {
      tags.push('<span class="map-list-badge is-missing">' + t("noCoordinates") + "</span>");
    }

    return ""
      + '<article class="map-list-card' + selectedClass + '">'
      + '<button type="button" class="map-list-card-select" data-item-id="' + escapeHtml(item.id) + '" aria-label="' + escapeHtml(item.nome) + '">'
      + getImageHtml(item, "map-list-thumb")
      + '<div class="map-list-content">'
      + "<h4>" + escapeHtml(item.nome) + "</h4>"
      + "<p>" + escapeHtml(item.descricao || t("noDescription")) + "</p>"
      + (isRouteItem(item) ? '<p class="map-list-support">' + t("routeSupport") + "</p>" : "")
      + '<div class="map-list-card-tags">' + tags.join("") + "</div>"
      + "</div>"
      + "</button>"
      + '<div class="map-list-card-actions">'
      + '<button type="button" class="map-button primary" data-map-details-id="' + escapeHtml(item.id) + '">' + t("details") + "</button>"
      + (item.possuiCoordenadas ? '<a class="map-button" href="' + escapeHtml(item.mapsUrl) + '" target="_blank" rel="noopener noreferrer">' + t("directions") + "</a>" : "")
      + "</div>"
      + "</article>";
  }

  function renderGroupedList(items) {
    return PANEL_GROUP_ORDER.filter(function (groupId) { return groupId !== "all"; }).map(function (groupId) {
      var groupItems = items.filter(function (item) { return item.panelGroup === groupId; });
      if (!groupItems.length) return "";

      return '<section class="map-list-group-section">'
        + '<div class="map-list-group-head">'
        + '<h3>' + getPanelGroupLabel(groupId) + "</h3>"
        + '<span>' + getGroupCountLabel(groupItems.length) + "</span>"
        + "</div>"
        + '<div class="map-list-group-grid">' + groupItems.map(renderListCard).join("") + "</div>"
        + "</section>";
    }).join("");
  }

  function renderMissingItems() {
    var missingContainer = document.getElementById("mapMissingItems");
    if (!missingContainer) return;

    var missingItems = getCurrentMissingItems();
    if (!missingItems.length) {
      missingContainer.innerHTML = "";
      return;
    }

    missingContainer.innerHTML = '<details class="map-missing-list"><summary>'
      + '<span class="map-missing-summary-label">' + getMissingSummary(missingItems.length) + "</span>"
      + '<span class="map-missing-summary-hint">▼</span>'
      + "</summary>"
      + "<p>" + t("missingDescription") + "</p><ul>"
      + missingItems.map(function (item) { return "<li>" + escapeHtml(item.nome) + "</li>"; }).join("")
      + "</ul></details>";
  }

  function renderList() {
    var container = document.getElementById("mapItemList");
    if (!container) return;

    var listItems = getCurrentListItems();
    if (!listItems.length) {
      container.innerHTML = '<div class="map-list-empty">' + getSearchStatusMessage() + "</div>";
      renderMissingItems();
      return;
    }

    if (state.panelGroup === "all") {
      container.innerHTML = renderGroupedList(state.filteredItems);
    } else {
      container.innerHTML = '<section class="map-list-group-section is-focused">'
        + '<div class="map-list-group-head">'
        + '<h3>' + getPanelGroupLabel(state.panelGroup) + "</h3>"
        + '<span>' + getGroupCountLabel(listItems.length) + "</span>"
        + "</div>"
        + '<div class="map-list-group-grid">' + listItems.map(renderListCard).join("") + "</div>"
        + "</section>";
    }

    renderMissingItems();
  }

  function syncSelectedItemVisibility(item) {
    if (state.panelGroup !== "all" && item.panelGroup !== state.panelGroup) {
      state.panelGroup = item.panelGroup;
    }
  }

  function selectItem(id, centerOnMap) {
    var item = getItemById(id);
    if (!item) return;

    syncSelectedItemVisibility(item);
    state.selectedItemId = id;
    renderPanelGroups();
    renderSelectedItem();
    renderList();
    updateMarkerSelection();
    syncUrlState();

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
    var groups = document.getElementById("mapPanelGroups");
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
        state.panelGroup = getDefaultPanelGroupForFilter(state.activeFilter);
        refreshView();
      });
    }

    if (groups) {
      groups.addEventListener("click", function (event) {
        var button = event.target.closest("[data-group]");
        if (!button) return;
        state.panelGroup = button.getAttribute("data-group");
        renderPanelGroups();
        renderSelectedItem();
        renderList();
        syncUrlState();
      });
    }

    if (list) {
      list.addEventListener("click", function (event) {
        var card = event.target.closest("[data-item-id]");
        if (!card) return;
        selectItem(card.getAttribute("data-item-id"), true);
      });
    }

    document.addEventListener("click", function (event) {
      var detailsButton = event.target.closest("[data-map-details-id]");
      if (!detailsButton) return;
      event.preventDefault();
      event.stopPropagation();
      openDetailsModal(detailsButton.getAttribute("data-map-details-id"), detailsButton);
    });

    document.addEventListener("keydown", handleDetailsKeydown);

    document.addEventListener("translationsApplied", function () {
      state.lang = getLang();
      applyPageText();
      renderFilters();
      renderPanelGroups();
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
    renderPanelGroups();
    renderStats();
    renderMarkers();
    renderSelectedItem();
    renderList();
    updateSearchUi();
    syncUrlState();
  }

  function initMap() {
    state.lang = getLang();
    state.items = buildItems();
    attachApprovedEventsToItems(state.items, []);
    applyInitialStateFromUrl();

    state.map = L.map("tourismMap", {
      zoomControl: true,
      scrollWheelZoom: true
    });
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

    loadApprovedEventsForMap();
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
