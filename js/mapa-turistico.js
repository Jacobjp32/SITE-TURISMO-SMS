(function () {
  "use strict";

  var MAP_TEXT = {
    pt: {
      pageTitle: "Mapa Turístico Interativo",
      pageSubtitle: "Encontre atrativos, gastronomia, hospedagem, rotas e serviços de São Mateus do Sul.",
      pageKicker: "Explore o destino",
      actionGuide: "Voltar ao guia do visitante",
      searchPlaceholder: "Busque por igreja, hotel, erva-mate...",
      searchHint: "Busque por igreja, hotel, erva-mate, praça, evento ou serviço.",
      clearSearch: "Limpar",
      resultsCount: "itens visíveis",
      locatedCount: "com localização",
      stageTitle: "Exploração no mapa",
      stageSubtitle: "Clique em um marcador ou card para ver detalhes.",
      stageBadge: "OpenStreetMap",
      stageSummary: "Use os filtros para destacar categorias turísticas.",
      totalItemsLabel: "itens catalogados",
      summaryTitle: "Resumo da exploração",
      summaryVisible: "visíveis",
      summaryMarkers: "com marcador",
      summaryGroups: "grupos ativos",
      summaryNote: "Use os grupos abaixo do mapa para alternar entre roteiros, serviços e demais experiências.",
      selectedTitle: "Local em destaque",
      selectedEmpty: "Selecione um ponto no mapa ou nos cards para ver imagem, categoria, descrição e ações rápidas.",
      listTitle: "Locais e experiências",
      listIntro: "Os cards abaixo acompanham a busca e os filtros. Clique em um local para destacar no mapa e abrir ações rápidas.",
      listEmpty: "Nenhum item encontrado com os filtros atuais.",
      listEmptyFiltered: "Nenhum resultado neste filtro. Tente buscar em Todos.",
      listEmptySearch: "Nenhum local corresponde a essa busca no momento.",
      details: "Ver detalhes",
      localDetail: "Abrir ficha",
      viewMap: "Mapa",
      viewList: "Lista",
      viewToggle: "Alternar entre mapa e lista",
      showOnMap: "Mostrar no mapa",
      directions: "Como chegar",
      noCoordinates: "Sem localização cadastrada",
      noImage: "Sem imagem",
      noDescription: "Descrição em atualização.",
      routeBadge: "Roteiro temático",
      routeSupport: "Pontos relacionados disponíveis no mapa.",
      closeDetails: "Fechar detalhes",
      contact: "Contato",
      whatsapp: "WhatsApp",
      address: "Endereço",
      hours: "Horário",
      services: "Serviços e tags",
      relatedRoute: "Rota relacionada",
      externalLink: "Link externo",
      gallery: "Galeria",
      detailsTitleSuffix: "Detalhes do local",
      cardSelected: "Selecionado no mapa",
      groupItemsSingle: "1 item",
      groupItemsMany: "{count} itens",
      missingTitle: "Itens reais ainda sem coordenada",
      missingDescription: "Esta lista mostra apenas locais físicos que ainda precisam de latitude e longitude confirmadas. Não é erro do site: é uma pendência de dados. Páginas informativas não entram nesta lista.",
      missingSummarySingle: "1 item real ainda sem coordenada",
      missingSummaryMany: "{count} itens reais ainda sem coordenada",
      thematicRoutesTitle: "Rotas temáticas sem ponto único",
      thematicRoutesDescription: "Estas rotas representam percursos ou coleções temáticas. Elas ficam disponíveis para consulta, mas não entram na contagem de itens sem localização exata.",
      thematicRoutesSummarySingle: "1 rota temática sem ponto único",
      thematicRoutesSummaryMany: "{count} rotas temáticas sem ponto único",
      popupDetails: "Ver detalhes",
      popupDirections: "Como chegar",
      upcomingEventsTitle: "Próximos eventos neste local",
      upcomingEventsSingle: "1 evento futuro",
      upcomingEventsMany: "{count} eventos futuros",
      upcomingEventsMore: "+{count} outros eventos",
      eventAction: "Saiba mais",
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
      },
      panelGroups: {
        all: "Todos",
        points: "Pontos Turísticos",
        routes: "Roteiros",
        gastronomy: "Gastronomia",
        lodging: "Hospedagem",
        events: "Eventos",
        services: "Serviços"
      }
    },
    en: {
      pageTitle: "Interactive Tourism Map",
      pageSubtitle: "Find attractions, food, lodging, routes and services in Sao Mateus do Sul.",
      pageKicker: "Explore the Destination",
      actionGuide: "Back to visitor guide",
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
      localDetail: "Open page",
      viewMap: "Map",
      viewList: "List",
      viewToggle: "Switch between map and list",
      showOnMap: "Show on the map",
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
      missingTitle: "Real items still without coordinates",
      missingDescription: "This list only shows physical places that still need confirmed latitude and longitude. It is not a site error: it is pending data. Informational pages are not included here.",
      missingSummarySingle: "1 real item still without coordinates",
      missingSummaryMany: "{count} real items still without coordinates",
      thematicRoutesTitle: "Themed routes without a single point",
      thematicRoutesDescription: "These routes represent itineraries or thematic collections. They remain available for consultation but are not counted as items without exact location.",
      thematicRoutesSummarySingle: "1 themed route without a single point",
      thematicRoutesSummaryMany: "{count} themed routes without a single point",
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
      pageTitle: "Mapa Turístico Interactivo",
      pageSubtitle: "Encuentra atractivos, gastronomia, hospedaje, rutas y servicios de Sao Mateus do Sul.",
      pageKicker: "Explorar el Destino",
      actionGuide: "Volver a la guia del visitante",
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
      localDetail: "Abrir ficha",
      viewMap: "Mapa",
      viewList: "Lista",
      viewToggle: "Alternar entre mapa y lista",
      showOnMap: "Mostrar en el mapa",
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
      missingTitle: "Elementos reales aun sin coordenada",
      missingDescription: "Esta lista muestra solo lugares fisicos que todavia necesitan latitud y longitud confirmadas. No es un error del sitio: es una pendiente de datos. Las paginas informativas no entran en esta lista.",
      missingSummarySingle: "1 elemento real aun sin coordenada",
      missingSummaryMany: "{count} elementos reales aun sin coordenada",
      thematicRoutesTitle: "Rutas tematicas sin punto unico",
      thematicRoutesDescription: "Estas rutas representan recorridos o colecciones tematicas. Siguen disponibles para consulta, pero no entran en el conteo de elementos sin ubicacion exacta.",
      thematicRoutesSummarySingle: "1 ruta tematica sin punto unico",
      thematicRoutesSummaryMany: "{count} rutas tematicas sin punto unico",
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
      pageSubtitle: "Znajdz atrakcje, gastronomie, noclegi, trasy i uslugi w Sao Mateus do Sul.",
      pageKicker: "Odkryj Kierunek",
      actionGuide: "Powrot do przewodnika",
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
      localDetail: "Otworz karte",
      viewMap: "Mapa",
      viewList: "Lista",
      viewToggle: "Przełącz między mapą a listą",
      showOnMap: "Pokaż na mapie",
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
      missingTitle: "Realne elementy nadal bez wspolrzednych",
      missingDescription: "Ta lista pokazuje tylko fizyczne miejsca, ktore nadal wymagaja potwierdzonej szerokosci i dlugosci geograficznej. To nie jest blad strony, lecz brakujace dane. Strony informacyjne nie sa tu uwzgledniane.",
      missingSummarySingle: "1 realny element nadal bez wspolrzednych",
      missingSummaryMany: "{count} realnych elementow nadal bez wspolrzednych",
      thematicRoutesTitle: "Trasy tematyczne bez jednego punktu",
      thematicRoutesDescription: "Te trasy reprezentuja przebiegi lub zbiory tematyczne. Pozostaja dostepne do przegladania, ale nie sa liczone jako elementy bez dokladnej lokalizacji.",
      thematicRoutesSummarySingle: "1 trasa tematyczna bez jednego punktu",
      thematicRoutesSummaryMany: "{count} tras tematycznych bez jednego punktu",
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

  // Textos da camada ilustrada (pins, agrupamentos, ficha e roteiros).
  var MI_TEXT = {
    pt: {
      routesLabel: "Roteiros", routeStops: "{count} paradas no mapa", routeStopsSingle: "1 parada no mapa",
      routeNote: "As paradas do roteiro ficam em destaque no mapa. Não desenhamos trajeto: use “Como chegar” em cada parada.",
      routeKicker: "Roteiro", routeClear: "Mostrar todos os lugares", partOfRoute: "Faz parte de",
      noLocation: "sem localização", close: "Fechar", expand: "Ver mais", collapse: "Ver menos",
      legend: "Legenda", legendLandmarks: "Desenhos especiais marcam lugares emblemáticos.",
      clusterLabel: "{count} lugares aqui. Ampliar o mapa", sheetRegion: "Lugar selecionado",
      approx: "Localização aproximada no mapa: confira o endereço antes de sair.",
      routesToggle: "Roteiros", routesClose: "Fechar roteiros",
      families: { history: "Patrimônio", culture: "Cultura", nature: "Natureza", mate: "Erva-mate", gastronomy: "Gastronomia", lodging: "Hospedagem", events: "Eventos", services: "Serviços" }
    },
    en: {
      routesLabel: "Routes", routeStops: "{count} stops on the map", routeStopsSingle: "1 stop on the map",
      routeNote: "Route stops are highlighted on the map. No path is drawn: use “Directions” at each stop.",
      routeKicker: "Route", routeClear: "Show all places", partOfRoute: "Part of",
      noLocation: "no location", close: "Close", expand: "Show more", collapse: "Show less",
      legend: "Legend", legendLandmarks: "Special drawings mark landmark places.",
      clusterLabel: "{count} places here. Zoom in", sheetRegion: "Selected place",
      approx: "Approximate location on the map: check the address before you go.",
      routesToggle: "Routes", routesClose: "Close routes",
      families: { history: "Heritage", culture: "Culture", nature: "Nature", mate: "Yerba mate", gastronomy: "Food", lodging: "Lodging", events: "Events", services: "Services" }
    },
    es: {
      routesLabel: "Rutas", routeStops: "{count} paradas en el mapa", routeStopsSingle: "1 parada en el mapa",
      routeNote: "Las paradas de la ruta se destacan en el mapa. No se dibuja el trayecto: usa “Cómo llegar” en cada parada.",
      routeKicker: "Ruta", routeClear: "Mostrar todos los lugares", partOfRoute: "Forma parte de",
      noLocation: "sin ubicación", close: "Cerrar", expand: "Ver más", collapse: "Ver menos",
      legend: "Leyenda", legendLandmarks: "Dibujos especiales señalan lugares emblemáticos.",
      clusterLabel: "{count} lugares aquí. Ampliar el mapa", sheetRegion: "Lugar seleccionado",
      approx: "Ubicación aproximada en el mapa: verifica la dirección antes de salir.",
      routesToggle: "Rutas", routesClose: "Cerrar rutas",
      families: { history: "Patrimonio", culture: "Cultura", nature: "Naturaleza", mate: "Yerba mate", gastronomy: "Gastronomía", lodging: "Hospedaje", events: "Eventos", services: "Servicios" }
    },
    pl: {
      routesLabel: "Trasy", routeStops: "Przystanki na mapie: {count}", routeStopsSingle: "1 przystanek na mapie",
      routeNote: "Przystanki trasy są wyróżnione na mapie. Trasa nie jest rysowana: przy każdym przystanku użyj „Dojazd”.",
      routeKicker: "Trasa", routeClear: "Pokaż wszystkie miejsca", partOfRoute: "Należy do",
      noLocation: "brak lokalizacji", close: "Zamknij", expand: "Pokaż więcej", collapse: "Pokaż mniej",
      legend: "Legenda", legendLandmarks: "Specjalne rysunki oznaczają charakterystyczne miejsca.",
      clusterLabel: "Miejsca tutaj: {count}. Przybliż mapę", sheetRegion: "Wybrane miejsce",
      approx: "Przybliżona lokalizacja na mapie: sprawdź adres przed wyjazdem.",
      routesToggle: "Trasy", routesClose: "Zamknij trasy",
      families: { history: "Dziedzictwo", culture: "Kultura", nature: "Przyroda", mate: "Yerba mate", gastronomy: "Gastronomia", lodging: "Noclegi", events: "Wydarzenia", services: "Usługi" }
    }
  };
  Object.keys(MI_TEXT).forEach(function (lang) { if (MAP_TEXT[lang]) MAP_TEXT[lang].mi = MI_TEXT[lang]; });

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

  // Mesmo limite público usado em eventos.html: Firestore/App Check lentos não
  // podem deixar o merge de eventos aprovados pendente indefinidamente.
  var FIREBASE_PUBLIC_TIMEOUT_MS = 2500;

  var state = {
    map: null,
    markersLayer: null,
    pinLayer: null,
    routeLayer: null,
    markerIndex: {},
    highlightRoute: "",
    sheetOpen: false,
    sheetExpanded: false,
    items: [],
    approvedEvents: [],
    filteredItems: [],
    missingItems: [],
    selectedItemId: null,
    activeFilter: "all",
    panelGroup: "all",
    requestedRoute: "",
    selectedRouteCanonical: null,
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

  function requirePublicationContracts() {
    var contracts = window.SMSPublicationContracts;
    if (!contracts || !contracts.url) {
      throw new Error("[mapa-turistico] SMSPublicationContracts ausente ou inválido");
    }
    return contracts;
  }

  function isExternalUrl(value) {
    return !!requirePublicationContracts().url.externalHttps(value, "");
  }

  function normalizeSocialLink(value) {
    var social = String(value || "").trim();
    if (!social) return "";
    if (isExternalUrl(social)) return requirePublicationContracts().url.externalHttps(social, "");
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
    if (/^www\./i.test(raw)) raw = "https://" + raw;
    return requirePublicationContracts().url.publicNavigation(raw, fallback || "");
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
    var images = extractImageUrls(raw.images).map(function (image) {
      return requirePublicationContracts().url.publicAsset(image, "");
    }).filter(Boolean);
    var mainImage = requirePublicationContracts().url.publicAsset(
      cleanTextValue(raw.mainImage) || extractImageUrl(raw.image) || (images[0] || ""),
      ""
    );

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
      organizer: cleanTextValue(raw.organizer || raw.establishmentName || raw.linkedEstablishmentName),
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

    return '<img src="' + escapeHtml(event.mainImage) + '" alt="' + escapeHtml(event.title) + '" loading="lazy" decoding="async" width="640" height="360">';
  }

  function renderApprovedEventsSection(item, context) {
    var events = getUpcomingApprovedEventsForItem(item);
    if (!events.length) return "";

    var countLabel = events.length === 1
      ? t("upcomingEventsSingle")
      : replaceCount(t("upcomingEventsMany"), events.length);

    return '<section class="establishment-events-box map-related-events is-' + escapeHtml(context || "panel") + '">'
      + '<div class="map-related-events-head">'
      + '<h3>' + escapeHtml(t("upcomingEventsTitle")) + '</h3>'
      + '<span>' + escapeHtml(countLabel) + "</span>"
      + "</div>"
      + '<div class="establishment-events-scroll map-related-events-list">'
      + events.map(function (event, index) {
        var description = truncateText(event.description, context === "modal" ? 180 : 110);
        var schedule = formatApprovedEventSchedule(event);
        var chips = [];

        if (schedule) {
          chips.push('<span class="map-related-event-chip">📅 ' + escapeHtml(schedule) + "</span>");
        }
        if (event.value) {
          chips.push('<span class="map-related-event-chip">💲 ' + escapeHtml(event.value) + "</span>");
        }

        return '<article class="establishment-event-card map-related-event-card' + (events.length === 1 && index === 0 ? " is-featured" : "") + '">'
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
      + "</section>";
  }

  function withTimeout(promise, timeoutMs, label) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timeoutId = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        reject(new Error(label + " excedeu " + timeoutMs + "ms."));
      }, timeoutMs);

      promise.then(function (value) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        resolve(value);
      }).catch(function (error) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        reject(error);
      });
    });
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
    try {
      var snapshot = await withTimeout(
        (async function () {
          var db = await ensurePublicFirestore();
          if (!db) return null;
          return db.collection("eventos_aprovados").get();
        })(),
        FIREBASE_PUBLIC_TIMEOUT_MS,
        "Carregamento público do Firestore no mapa"
      );

      if (!snapshot) {
        state.approvedEventsReady = true;
        return;
      }

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

  /* Correções geográficas comprovadas por fonte externa. Aplicadas somente enquanto a
     fonte (CMS ou dados locais) ainda trouxer exatamente o valor antigo: quando o cadastro
     for corrigido no CMS, a regra deixa de agir sozinha. Os dados originais não são alterados. */
  var GEO_CORRECTIONS = [
    { ids: ["ponte-rio-iguacu"], from: [-25.87, -50.378], to: [-25.8776, -50.3844],
      source: "OpenStreetMap way 93278826 (ponte da BR-476 sobre o Rio Iguaçu)" },
    { ids: ["igreja-matriz"], from: [-25.8769, -50.3838], to: [-25.874335, -50.3837],
      source: "OpenStreetMap way 243982311 (Paróquia de São Mateus, building=church)" },
    { ids: ["casa-da-memoria"], from: [-25.877, -50.3835], to: [-25.873802, -50.383818],
      source: "OpenStreetMap node 5676214480 (Casa da Memória)" },
    { ids: ["rua-do-mathe", "agrosamas", "polskie-smaki", "feira-gastronomica", "feira-do-produtor"],
      from: [-25.878, -50.385], to: [-25.874104, -50.384168],
      source: "OpenStreetMap way 973886282 (Rua do Mathe, via de pedestres)" },
    { ids: ["igreja-agua-branca"], from: [-25.91, -50.42], to: [-25.763148, -50.34269],
      source: "Google Maps \"Capela São José\" e Plus Code 6MP4+RX São Mateus do Sul (informados pela equipe)" },
    // Ficha do Google Maps de cada lugar, conferida por nome e endereço em 2026-10-14.
    { ids: ["pitayas-dragao"], from: [-25.9660091, -50.5398216], to: [-26.0209768, -50.6017149],
      source: "Google Maps \"Pitayas Dragão do Iguaçu\" (R. Principal, Fluviópolis)" },
    { ids: ["posto-pelanda"], from: [-25.9660091, -50.5398216], to: [-25.9740068, -50.5447583],
      source: "Google Maps \"Petrobras Posto Pelanda\" (BR-476 km 298) e OpenStreetMap way 684884859" },
    { ids: ["viveiro-fluviopolis"], from: [-25.9660091, -50.5398216], to: [-26.0179574, -50.6115719],
      source: "Google Maps \"Viveiro Fluviópolis\" (Fluviópolis)" },
    { ids: ["ervateira-taquaral"], from: [-25.82, -50.35], to: [-25.7827358, -50.3951301],
      source: "Google Maps \"Ervateira Taquaral\" (Taquaral do Bugre)" },
    { ids: ["arena-cultural"], from: [-25.8785, -50.386], to: [-25.8373319, -50.3825099],
      source: "Google Maps \"Arena Cultural e Esportiva - Cancha Coberta\" (PR-151, Col. Taquaral); associação a confirmar, exibida como aproximada" },
    { ids: ["parque-exposicoes"], from: [-25.88, -50.39], to: [-25.8372433, -50.3822846],
      source: "Google Maps \"Parque de Exposições de São Mateus do Sul\" (Col. Taquaral)" },
    { ids: ["ginasio-polacao"], from: [-25.879, -50.387], to: [-25.869593, -50.3898514],
      source: "Google Maps \"Ginásio do Polacão\" (R. Agenor Nascimento, 1057)" },
    { ids: ["chimarrodromo", "roda-de-mathe"], from: [-25.8762, -50.3856], to: [-25.8744988, -50.3844369],
      source: "Google Maps \"Chimarródromo de São Mateus do Sul\"" },
    { ids: ["praca-rio-iguacu"], from: [-25.876, -50.3855], to: [-25.8767299, -50.3860571],
      source: "Google Maps \"Praça do Iguaçu\" (R. João Gabriel Martins, 1)" },
    { ids: ["prefeitura-municipal"], from: [-25.8775, -50.384], to: [-25.8731807, -50.3855377],
      source: "Google Maps \"Prefeitura Municipal de São Mateus do Sul\" (R. Barão do Rio Branco, 431)" },
    { ids: ["paco-municipal"], from: [-25.8776, -50.3841], to: [-25.8674637, -50.3835272],
      source: "Google Maps \"Paço Municipal Francisco Luiz Ulbrich\" (Av. Ulisses Faria, 550)" },
    // Cadastrados sem coordenada (from: null): só preenche quando o dado vier vazio.
    { ids: ["hotel-dom-leopoldo"], from: null, to: [-25.8705024, -50.3843536],
      source: "Google Maps \"Hotel Dom Leopoldo\" (Av. Ozy Mendonça de Lima, 587)" },
    { ids: ["hotel-sao-mateus"], from: null, to: [-25.8716253, -50.3834274],
      source: "Google Maps \"Hotel São Mateus\" (R. Theodoro Toppel, 535)" },
    { ids: ["hotel-nora"], from: null, to: [-25.8725235, -50.3931416],
      source: "Google Maps \"Nora Hotel\" (R. Rodolfo Wolf)" },
    { ids: ["chess-choperia"], from: null, to: [-25.8660792, -50.3854312],
      source: "Google Maps \"Chess Choperia\" (R. Barão do Rio Branco, 1085)" }
  ];
  // Link de rota cadastrado incompleto (HTTP 404): link completo do PDF "Turismo Rural".
  var MAPS_URL_FIXES = { "https://maps.app.goo.gl/uBoWdk": "https://maps.app.goo.gl/uBoWdkPR5Q4BRLMo9" };

  function dataMapsUrl(item) {
    return item.mapsUrl ? (MAPS_URL_FIXES[item.mapsUrl] || item.mapsUrl) : "";
  }

  function applyGeoCorrection(item, coordinates) {
    if (!item) return coordinates;
    var id = String(item.id || "");
    for (var i = 0; i < GEO_CORRECTIONS.length; i += 1) {
      var fix = GEO_CORRECTIONS[i];
      if (fix.ids.indexOf(id) === -1) continue;
      if (!fix.from) {
        if (!coordinates) return { lat: fix.to[0], lng: fix.to[1], corrected: true };
        continue;
      }
      if (!coordinates) continue;
      if (Math.abs(coordinates.lat - fix.from[0]) < 1e-6 && Math.abs(coordinates.lng - fix.from[1]) < 1e-6) {
        return { lat: fix.to[0], lng: fix.to[1], corrected: true };
      }
    }
    return coordinates;
  }

  // Tratados como localização aproximada: Arena (associação à "Arena Cultural e Esportiva"
  // ainda a confirmar com a equipe) e Pedrão (coordenada sem fonte; "potencial" no PDF rural).
  var UNVERIFIED_LOCATION_IDS = { "arena-cultural": true, "pesqueiro-do-pedrao": true };

  function coordinateDecimals(value) {
    var text = String(value);
    var dot = text.indexOf(".");
    return dot === -1 ? 0 : text.length - dot - 1;
  }

  /* Localização aproximada: precisão declarada de ~1 km (até 2 casas decimais) ou a mesma
     coordenada repetida para lugares diferentes (marcador de preenchimento). Nesses casos a
     ficha avisa e "Como chegar" busca pelo nome em vez de levar a um ponto falso. */
  function markApproximateLocations(items) {
    var groups = {};
    items.forEach(function (item) {
      if (!item.possuiCoordenadas) return;
      var key = item.coordenadas.lat.toFixed(6) + "," + item.coordenadas.lng.toFixed(6);
      (groups[key] = groups[key] || []).push(item);
    });
    items.forEach(function (item) {
      if (!item.possuiCoordenadas) return;
      if (item.coordenadas.corrected && !UNVERIFIED_LOCATION_IDS[item.id]) return;
      var key = item.coordenadas.lat.toFixed(6) + "," + item.coordenadas.lng.toFixed(6);
      var places = {};
      groups[key].forEach(function (other) {
        if (other.tipo !== "evento") places[normalizeText(other.nome)] = true;
      });
      var lowPrecision = coordinateDecimals(item.coordenadas.lat) <= 2 || coordinateDecimals(item.coordenadas.lng) <= 2;
      if (!lowPrecision && Object.keys(places).length < 2 && !UNVERIFIED_LOCATION_IDS[item.id]) return;
      item.localizacaoAproximada = true;
      if (!item.mapsUrlFromData) {
        item.mapsUrl = "https://www.google.com/maps/search/?api=1&query="
          + encodeURIComponent(item.nome + ", São Mateus do Sul - PR");
      }
    });
    return items;
  }

  // Notas internas do cadastro não aparecem ao visitante (mesma regra de
  // js/public-establishments-renderer.js): "(confirmar …)" e o telefone de preenchimento.
  function publicText(value) {
    return String(value || "").replace(/\s*\((?:a\s+)?confirmar[^)]*\)/gi, "").replace(/\s{2,}/g, " ").trim();
  }

  function publicPhone(value) {
    var phone = publicText(value);
    return /^\(?42\)?\s*3532-?0000$/.test(phone) ? "" : phone;
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
    if (source.indexOf("natureza") !== -1 || /\brio\b/.test(source) || source.indexOf("iguacu") !== -1 || source.indexOf("lazer") !== -1 || source.indexOf("parque") !== -1 || source.indexOf("mirante") !== -1) {
      return "nature";
    }
    if (source.indexOf("gastronomia") !== -1 || source.indexOf("erva-mate") !== -1 || /\bmate\b/.test(source) || source.indexOf("chimarrao") !== -1 || source.indexOf("culinaria") !== -1 || source.indexOf("sabores") !== -1) {
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

  function isLocatableRealItem(item) {
    if (!item) return false;
    return item.tipo === "ponto"
      || item.tipo === "hospedagem"
      || item.tipo === "restaurante"
      || item.tipo === "evento";
  }

  function isStructuralInfoItem(item) {
    if (!item) return false;
    if (item.tipo === "servico") return true;

    var structuralIds = {
      "mapa-turistico": true,
      "roteiros": true,
      "onde-ficar": true,
      "previsao-do-tempo": true,
      "contato-turismo": true
    };
    var structuralNames = {
      "mapa turistico": true,
      "roteiros": true,
      "onde ficar": true,
      "previsao do tempo": true,
      "contato": true
    };
    var structuralUrls = {
      "/mapa-turistico": true,
      "/mapa-turistico?grupo=roteiros": true,
      "/mapa-turistico?categoria=hospedagem": true,
      "/#weather-title": true,
      "/#contato": true
    };

    var normalizedId = normalizeText(item.id);
    var normalizedName = normalizeText(item.nome);
    var normalizedUrl = String(item.url || "").trim().toLowerCase();

    return !!(structuralIds[normalizedId] || structuralNames[normalizedName] || structuralUrls[normalizedUrl]);
  }

  function shouldListAsMissingLocation(item) {
    if (!item || item.possuiCoordenadas) return false;
    if (isRouteItem(item)) return false;
    if (isStructuralInfoItem(item)) return false;
    if (!isLocatableRealItem(item)) return false;
    return true;
  }

  function shouldListAsThematicRoute(item) {
    return !!item && !item.possuiCoordenadas && isRouteItem(item);
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
      return dataMapsUrl(item);
    }
    if (coordinates) {
      return "https://www.google.com/maps/search/?api=1&query=" + coordinates.lat + "," + coordinates.lng;
    }
    return "";
  }

  function normalizeItem(item, itemType) {
    if (!item || !item.nome) return null;

    var coordinates = applyGeoCorrection(item, getCoordinates(item));
    var broadCategory = classifyCategory(itemType, item.categoria, item.tags, item.descricao);
    var panelGroup = getPanelGroup(itemType);
    var gallery = normalizeImages(item);
    var externalLink = item.site || item.website || item.instagram || item.social || item.facebook || (isExternalUrl(item.url) ? item.url : "");
    var contactLink = normalizeSocialLink(item.instagram || item.social || item.facebook) || (isExternalUrl(item.site || item.website) ? item.site || item.website : "") || (isExternalUrl(item.url) ? item.url : "");

    return {
      id: item.id || item.nome,
      slug: item.slug || item.id || "",
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
      localId: item.localId || item.placeId || "",
      localUrl: item.localUrl || item.localDetailUrl || "",
      telefone: item.telefone || "",
      whatsappUrl: createWhatsAppLink(item.telefone),
      localizacao: item.localizacao || item.local || item.endereco || "",
      endereco: item.endereco || item.localizacao || item.local || "",
      periodo: item.periodo || item.horario || "",
      horario: item.horario || item.hours || item.periodo || "",
      destaque: item.destaque || "",
      rota: item.rota || item.route || item.legacyRouteName || "",
      routeIds: Array.isArray(item.routeIds)
        ? item.routeIds.slice()
        : (item.relationships && Array.isArray(item.relationships.routeIds) ? item.relationships.routeIds.slice() : []),
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
      mapsUrlFromData: !!(coordinates && item.mapsUrl),
      localizacaoAproximada: false,
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
    function publicMapItems(items) {
      return (items || []).filter(function (item) {
        return !item || !item.display || item.display.mapVisible !== false;
      });
    }
    var points = publicMapItems(data.pontos).map(function (item) { return normalizeItem(item, "ponto"); });
    var routes = (data.rotas || []).map(function (item) { return normalizeItem(item, "rota"); });
    // Hotel/creche de animais vai para Serviços; registro genérico sem contato
    // ("Pousadas Rurais") não vira marcador de empreendimento específico.
    var lodging = publicMapItems(data.hospedagens).filter(function (item) {
      var hasContact = item && (item.telefone || item.whatsapp || item.email || item.site || item.instagram ||
        (item.contact && (item.contact.phone || item.contact.whatsapp || item.contact.email || item.contact.website || item.contact.instagram)));
      return !(item && !hasContact && /^(pousadas|hoteis|opcoes)(\s|$)/.test(normalizeText(item.nome)));
    }).map(function (item) {
      var source = normalizeText([item.nome, item.descricao, Array.isArray(item.tags) ? item.tags.join(" ") : item.tags].join(" "));
      if (/(^|[^a-z])pet([^a-z]|$)|canil|caes de pastoreio/.test(source)) {
        return normalizeItem(Object.assign({}, item, { categoria: "Serviços" }), "servico");
      }
      return normalizeItem(item, "hospedagem");
    });
    var restaurants = publicMapItems(data.restaurantes).map(function (item) { return normalizeItem(item, "restaurante"); });
    var events = (data.eventos || []).map(function (item) { return normalizeItem(item, "evento"); });
    var services = (data.informacoesEssenciais || []).map(function (item) { return normalizeItem(item, "servico"); });

    return markApproximateLocations(points.concat(routes, lodging, restaurants, events, services).filter(Boolean));
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
    state.requestedRoute = String(params.get("rota") || "").trim();
    if (state.requestedRoute) {
      state.panelGroup = "routes";
      state.selectedRouteCanonical = window.TURISMO_PUBLIC_DATA_UTILS
        ? window.TURISMO_PUBLIC_DATA_UTILS.resolveRouteCanonical((window.TURISMO_DATA || {}).rotas, state.requestedRoute)
        : state.requestedRoute;
    }

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
    if (state.requestedRoute) {
      state.panelGroup = "routes";
    }
  }

  function syncUrlState() {
    if (!window.history || !window.history.replaceState) return;

    var params = new URLSearchParams(window.location.search || "");
    if (state.activeFilter !== "all") {
      params.set("categoria", t("categories." + state.activeFilter, state.activeFilter));
    } else {
      params.delete("categoria");
    }
    if (state.panelGroup !== "all") {
      params.set("grupo", getPanelGroupSlug(state.panelGroup));
    } else {
      params.delete("grupo");
    }
    if (isIllustrated() && state.highlightRoute) {
      params.set("rota", state.highlightRoute);
    } else if (!isIllustrated() && state.requestedRoute) {
      params.set("rota", state.requestedRoute);
    } else {
      params.delete("rota");
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
      var byRoute = true;
      if (state.requestedRoute) {
        if (!state.selectedRouteCanonical) return false;
        if (isRouteItem(item)) {
          byRoute = String(item.id) === String(state.selectedRouteCanonical)
            || String(item.slug) === String(state.requestedRoute);
        } else {
          byRoute = window.TURISMO_PUBLIC_DATA_UTILS
            ? window.TURISMO_PUBLIC_DATA_UTILS.itemMatchesRoute(item, state.selectedRouteCanonical)
            : item.routeIds.indexOf(state.selectedRouteCanonical) !== -1;
        }
      }
      return byCategory && bySearch && byRoute;
    });

    state.missingItems = state.filteredItems.filter(function (item) {
      return shouldListAsMissingLocation(item);
    });
  }

  function getFilterCount(filterId) {
    if (filterId === "all") return state.items.length;
    return state.items.filter(function (item) { return item.categoriaMapa === filterId; }).length;
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
    return getCurrentListItems().filter(shouldListAsMissingLocation);
  }

  function getCurrentThematicRouteItems() {
    return getCurrentListItems().filter(shouldListAsThematicRoute);
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

  function getThematicRoutesSummary(count) {
    if (count === 1) return t("thematicRoutesSummarySingle");
    return replaceCount(t("thematicRoutesSummaryMany"), count);
  }

  function getImageHtml(item, className) {
    if (!item.imagem) {
      if (isRouteItem(item)) {
        return '<div class="' + className + ' map-image-fallback is-route" aria-hidden="true"><span>RO</span><small>' + t("routeBadge") + '</small><em>' + t("routeSupport") + "</em></div>";
      }
      var fallbackConfig = getCategoryConfig(item.categoriaMapa);
      // Sem foto real: tile tipográfico na cor da categoria (não simula fotografia nem anuncia ausência).
      var initial = String(item.nome || "").trim().charAt(0) || fallbackConfig.icon;
      return '<div class="' + className + ' map-image-fallback is-typographic" aria-hidden="true" style="--fallback-color:' + fallbackConfig.color + ';--fallback-accent:' + fallbackConfig.accent + ';"><span>' + escapeHtml(initial) + "</span></div>";
    }
    return '<img src="' + escapeHtml(item.imagem) + '" alt="' + escapeHtml(item.nome) + '" class="' + className + '" loading="lazy" decoding="async" width="640" height="360">';
  }

  function getLocalDetailUrl(item) {
    var localUrl = String(item && (item.localUrl || item.localDetailUrl) || "").trim();
    var localUrlMatch = localUrl.match(/^\/local(?:\.html)?\?id=([^#&?]+)(?:$|[&#])/);
    if (localUrlMatch && window.locaisData) {
      var localUrlId = decodeURIComponent(localUrlMatch[1]);
      var resolvedLocalUrlId = window.locaisAliases && window.locaisAliases[localUrlId] ? window.locaisAliases[localUrlId] : localUrlId;
      if (window.locaisData[resolvedLocalUrlId]) return "/local?id=" + encodeURIComponent(resolvedLocalUrlId);
    }

    var localId = cleanTextValue(item && (item.localId || item.placeId));
    if (localId && window.locaisData) {
      var resolvedId = window.locaisAliases && window.locaisAliases[localId] ? window.locaisAliases[localId] : localId;
      if (window.locaisData[resolvedId]) return "/local?id=" + encodeURIComponent(resolvedId);
    }

    var raw = String(item && item.url || "").trim();
    if (!/^\/local(?:\.html)?\?id=[^#&?]+(?:$|[&#])/.test(raw)) return "";
    return raw;
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
      // Categoria sem itens no conjunto atual não vira chip clicável com "0".
      if (!count && filterId !== "all" && state.activeFilter !== filterId) return "";
      return '<button type="button" class="map-filter-btn' + activeClass + '" data-filter="' + filterId + '" aria-pressed="' + (state.activeFilter === filterId ? "true" : "false") + '" aria-label="' + t("categories." + filterId, filterId) + '">'
        + (isIllustrated()
          ? (filterId === "all" ? "" : '<span class="map-filter-icon mi-filter-pin" aria-hidden="true">' + window.MAPA_ILUSTRADO.pinSvg(filterId) + "</span>")
          : '<span class="map-filter-icon" style="--filter-color:' + config.color + ';--filter-accent:' + config.accent + ';">' + config.icon + '</span>')
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
    if (sidebarVisible) sidebarVisible.textContent = state.filteredItems.length;
    if (sidebarMarkers) sidebarMarkers.textContent = visibleMarkersCount;
    if (sidebarGroups) sidebarGroups.textContent = activeGroupCount;
  }

  function updateMarkerSelection() {
    if (isIllustrated()) {
      updateIllustratedMarkers();
      return;
    }
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
    if (isIllustrated()) {
      renderIllustratedMarkers();
      return;
    }

    state.markersLayer.clearLayers();
    state.markerIndex = {};

    var bounds = [];
    state.filteredItems.forEach(function (item) {
      if (!item.possuiCoordenadas) return;
      var localDetailUrl = getLocalDetailUrl(item);

      var marker = L.marker([item.coordenadas.lat, item.coordenadas.lng], {
        icon: createMarkerIcon(item.categoriaMapa, item.id === state.selectedItemId),
        title: item.nome
      });

      marker.bindPopup(
        '<div class="map-popup">'
          + '<strong>' + escapeHtml(item.nome) + '</strong>'
          + '<span>' + escapeHtml(item.categoriaLabel) + '</span>'
          + '<p>' + escapeHtml(item.descricao || t("noDescription")) + '</p>'
          + '<div class="map-popup-actions">'
          + '<button type="button" class="map-popup-detail-button" data-map-details-id="' + escapeHtml(item.id) + '">' + t("popupDetails") + '</button>'
          + (localDetailUrl ? '<a href="' + escapeHtml(localDetailUrl) + '">' + escapeHtml(t("localDetail")) + '</a>' : "")
          + (item.possuiCoordenadas ? '<a href="' + escapeHtml(item.mapsUrl) + '" target="_blank" rel="noopener noreferrer">' + t("popupDirections") + "</a>" : "")
          + "</div>"
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
        return '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(item.nome) + '" loading="lazy" decoding="async" width="640" height="360">';
      }).join("")
      + "</div></section>";
  }

  function renderDetailsModalContent(item) {
    var config = getCategoryConfig(item.categoriaMapa);
    var tags = uniqueList(item.tags).slice(0, 12);
    var description = item.descricao || t("noDescription");
    var longDescription = item.descricaoLonga && item.descricaoLonga !== item.descricao ? item.descricaoLonga : "";
    var routeLabel = isRouteItem(item) ? t("routeBadge") : item.rota;
    var localDetailUrl = getLocalDetailUrl(item);

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
      + renderMetaRow(t("address"), publicText(item.endereco || item.localizacao))
      + renderMetaRow(t("contact"), publicPhone(item.telefone))
      + renderMetaRow(t("hours"), publicText(item.horario))
      + renderMetaRow(t("relatedRoute"), routeLabel)
      + '</dl>'
      + (tags.length ? '<section class="map-details-tags"><h3>' + escapeHtml(t("services")) + '</h3><div>' + tags.map(function (tag) { return '<span>' + escapeHtml(tag) + '</span>'; }).join("") + '</div></section>' : "")
      + renderApprovedEventsSection(item, "modal")
      + renderDetailsGallery(item)
      + '<div class="map-details-actions">'
      + (item.possuiCoordenadas ? '<a class="map-button primary" href="' + escapeHtml(item.mapsUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t("directions")) + '</a>' : "")
      + (localDetailUrl ? '<a class="map-button" href="' + escapeHtml(localDetailUrl) + '">' + escapeHtml(t("localDetail")) + '</a>' : "")
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
    if (isIllustrated()) {
      renderSheet();
      return;
    }
    if (!container) return;

    var item = getSelectedItem();
    if (!item) {
      container.innerHTML = '<div class="map-selected-empty">' + t("selectedEmpty") + "</div>";
      return;
    }

    state.selectedItemId = item.id;

    var meta = [];
    var localDetailUrl = getLocalDetailUrl(item);
    if (publicText(item.localizacao)) meta.push('<span class="map-meta-chip">📍 ' + escapeHtml(publicText(item.localizacao)) + "</span>");
    if (publicPhone(item.telefone)) meta.push('<span class="map-meta-chip">📞 ' + escapeHtml(publicPhone(item.telefone)) + "</span>");
    if (publicText(item.periodo)) meta.push('<span class="map-meta-chip">📅 ' + escapeHtml(publicText(item.periodo)) + "</span>");
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
      + renderPrimaryInfoAction(item, localDetailUrl)
      + (item.possuiCoordenadas ? '<a class="map-button" href="' + escapeHtml(item.mapsUrl) + '" target="_blank" rel="noopener noreferrer">' + t("directions") + "</a>" : "")
      + "</div>"
      + "</div>";
  }

  // Uma ação de informação por card: a ficha completa (/local) quando existe; caso
  // contrário, o resumo em janela. Antes "Ver detalhes" e "Abrir ficha" levavam ao mesmo conteúdo.
  function renderPrimaryInfoAction(item, localDetailUrl) {
    if (localDetailUrl) {
      return '<a class="map-button primary" href="' + escapeHtml(localDetailUrl) + '">' + escapeHtml(t("localDetail")) + "</a>";
    }
    return '<button type="button" class="map-button primary" data-map-details-id="' + escapeHtml(item.id) + '">' + t("details") + "</button>";
  }

  function renderListCard(item) {
    var selectedClass = item.id === state.selectedItemId ? " is-selected" : "";
    var config = getCategoryConfig(item.categoriaMapa);
    var tags = [];
    var localDetailUrl = getLocalDetailUrl(item);

    var badgeIcon = isIllustrated() && !isRouteItem(item)
      ? '<span class="mi-badge-pin" aria-hidden="true">' + window.MAPA_ILUSTRADO.pinSvg(window.MAPA_ILUSTRADO.familyFor(item)) + "</span>"
      : config.icon + " ";
    tags.push('<span class="map-list-badge" style="--badge-color:' + config.color + ';--badge-accent:' + config.accent + ';">' + badgeIcon + escapeHtml(item.categoriaLabel) + "</span>");
    if (item.panelGroup === "routes" && item.categoriaOriginal) {
      tags.push('<span class="map-list-badge is-route">' + t("routeBadge") + "</span>");
      tags.push('<span class="map-list-badge is-neutral">RO ' + escapeHtml(item.categoriaOriginal) + "</span>");
    }
    if (!item.possuiCoordenadas && !isRouteItem(item)) {
      tags.push('<span class="map-list-badge is-missing">' + t("noCoordinates") + "</span>");
    }

    return ""
      + '<article class="map-list-card' + selectedClass + '">'
      + '<button type="button" class="map-list-card-select" data-item-id="' + escapeHtml(item.id) + '" aria-label="' + escapeHtml(t("showOnMap") + ": " + item.nome) + '">'
      + getImageHtml(item, "map-list-thumb")
      + '<div class="map-list-content">'
      + "<h4>" + escapeHtml(item.nome) + "</h4>"
      + "<p>" + escapeHtml(item.descricao || t("noDescription")) + "</p>"
      + (isRouteItem(item) ? '<p class="map-list-support">' + t("routeSupport") + "</p>" : "")
      + '<div class="map-list-card-tags">' + tags.join("") + "</div>"
      + "</div>"
      + "</button>"
      + '<div class="map-list-card-actions">'
      + renderPrimaryInfoAction(item, localDetailUrl)
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
    var thematicRoutes = getCurrentThematicRouteItems();

    if (!missingItems.length && !thematicRoutes.length) {
      missingContainer.innerHTML = "";
      return;
    }

    var sections = [];

    if (missingItems.length) {
      sections.push('<details class="map-missing-list"><summary>'
        + '<span class="map-missing-summary-label">' + getMissingSummary(missingItems.length) + "</span>"
        + '<span class="map-missing-summary-hint">▼</span>'
        + "</summary>"
        + "<h3>" + t("missingTitle") + "</h3><p>" + t("missingDescription") + "</p><ul>"
        + missingItems.map(function (item) { return "<li>" + escapeHtml(item.nome) + "</li>"; }).join("")
        + "</ul></details>");
    }

    if (thematicRoutes.length) {
      sections.push('<details class="map-missing-list"><summary>'
        + '<span class="map-missing-summary-label">' + getThematicRoutesSummary(thematicRoutes.length) + "</span>"
        + '<span class="map-missing-summary-hint">▼</span>'
        + "</summary>"
        + "<h3>" + t("thematicRoutesTitle") + "</h3><p>" + t("thematicRoutesDescription") + "</p><ul>"
        + thematicRoutes.map(function (item) { return "<li>" + escapeHtml(item.nome) + "</li>"; }).join("")
        + "</ul></details>");
    }

    missingContainer.innerHTML = sections.join("");
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

  function selectItem(id, centerOnMap, options) {
    var item = getItemById(id);
    if (!item) return;

    syncSelectedItemVisibility(item);
    state.selectedItemId = id;
    if (isIllustrated()) {
      selectIllustratedItem(item, centerOnMap, options);
      return;
    }
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
        // No celular, escolher um local na lista leva de volta ao mapa, já centralizado nele.
        if (isCompactViewport() && state.mobileView === "list") setMobileView("map", true);
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
      renderMobileViewToggle();
      renderMarkers();
      if (isIllustrated()) {
        renderRouteBar();
        renderLegend();
        renderSheet();
      }
      updateSearchUi();
    });
  }

  // Alternância Mapa / Lista (somente no celular). No desktop mapa e lista seguem lado a
  // lado; no celular a página deixa de empilhar o mapa sobre um catálogo longo.
  var COMPACT_QUERY = window.matchMedia ? window.matchMedia("(max-width: 768px)") : null;

  function isCompactViewport() {
    return !!(COMPACT_QUERY && COMPACT_QUERY.matches);
  }

  function ensureMobileViewToggle() {
    var existing = document.querySelector("[data-map-view-toggle]");
    if (existing) return existing;
    var layout = document.querySelector(".map-layout");
    if (!layout || !layout.parentNode) return null;
    var wrapper = document.createElement("div");
    wrapper.className = "map-view-toggle";
    wrapper.setAttribute("data-map-view-toggle", "");
    wrapper.setAttribute("role", "group");
    wrapper.innerHTML = ''
      + '<button type="button" data-map-view="map" aria-controls="tourismMap"></button>'
      + '<button type="button" data-map-view="list" aria-controls="mapItemList"></button>';
    layout.parentNode.insertBefore(wrapper, layout);
    wrapper.addEventListener("click", function (event) {
      var button = event.target.closest("[data-map-view]");
      if (button) setMobileView(button.getAttribute("data-map-view"), true);
    });
    return wrapper;
  }

  function renderMobileViewToggle() {
    var wrapper = ensureMobileViewToggle();
    if (!wrapper) return;
    var count = (state.filteredItems || []).length;
    wrapper.setAttribute("aria-label", t("viewToggle"));
    Array.prototype.forEach.call(wrapper.querySelectorAll("[data-map-view]"), function (button) {
      var view = button.getAttribute("data-map-view");
      button.textContent = view === "list" ? t("viewList") + " (" + count + ")" : t("viewMap");
      button.setAttribute("aria-pressed", String(state.mobileView === view));
    });
  }

  function setMobileView(view, fromUser) {
    state.mobileView = view === "list" ? "list" : "map";
    document.body.classList.toggle("map-view-list", state.mobileView === "list");
    document.body.classList.toggle("map-view-map", state.mobileView === "map");
    renderMobileViewToggle();
    if (state.mobileView === "map" && state.map) {
      window.setTimeout(function () { state.map.invalidateSize(); }, 60);
    }
    if (fromUser) {
      var anchor = document.querySelector("[data-map-view-toggle]");
      if (anchor) {
        var offset = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
        window.scrollTo(0, Math.max(0, anchor.getBoundingClientRect().top + window.pageYOffset - offset - 8));
      }
    }
  }

  /* ==========================================================================
     CAMADA ILUSTRADA (protótipo "Mapa ilustrado")
     Ativa somente com <body class="mi-on"> e js/mapa-ilustrado.js carregado.
     Coordenadas, filtros, busca e dados continuam vindo das mesmas fontes;
     esta camada troca apenas a apresentação: pins, agrupamentos, ficha e
     destaque de roteiros. Sem a classe, o mapa anterior segue intacto.
     ========================================================================== */
  var REDUCED_MOTION = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var WIDE_QUERY = window.matchMedia ? window.matchMedia("(min-width: 969px)") : null;

  function isIllustrated() {
    return !!(window.MAPA_ILUSTRADO && document.body && document.body.classList.contains("mi-on"));
  }

  function isWideViewport() {
    return !WIDE_QUERY || WIDE_QUERY.matches;
  }

  function mi(key, fallback) {
    return t("mi." + key, fallback);
  }

  function getRouteRecords() {
    return state.items.filter(isRouteItem);
  }

  function getRouteRecord(routeId) {
    return getRouteRecords().find(function (route) { return route.id === routeId; }) || null;
  }

  function getRouteColor(routeId) {
    var raw = ((window.TURISMO_DATA || {}).rotas || []).find(function (route) { return route && route.id === routeId; });
    var color = raw && /^#[0-9a-f]{3,8}$/i.test(String(raw.cor || "")) ? raw.cor : "#b3322a";
    return color;
  }

  function itemInRoute(item, routeId) {
    if (!item || !routeId || isRouteItem(item)) return false;
    if (window.TURISMO_PUBLIC_DATA_UTILS && window.TURISMO_PUBLIC_DATA_UTILS.itemMatchesRoute) {
      return !!window.TURISMO_PUBLIC_DATA_UTILS.itemMatchesRoute(item, routeId);
    }
    return item.routeIds.indexOf(routeId) !== -1;
  }

  function getRouteStops(routeId) {
    var seen = {};
    return state.items.filter(function (item) {
      if (!itemInRoute(item, routeId) || seen[item.id]) return false;
      seen[item.id] = true;
      return true;
    });
  }

  function illustratedIconFor(item) {
    var inRoute = state.highlightRoute ? itemInRoute(item, state.highlightRoute) : false;
    return window.MAPA_ILUSTRADO.createIcon(item, {
      selected: item.id === state.selectedItemId,
      dim: !!state.highlightRoute && !inRoute,
      approx: !!item.localizacaoAproximada,
      route: inRoute,
      routeColor: inRoute ? getRouteColor(state.highlightRoute) : ""
    });
  }

  // O marcador selecionado sai do agrupamento (nunca fica escondido numa roseta);
  // as paradas do roteiro em destaque têm agrupamento próprio, na cor do roteiro.
  function targetLayerFor(item) {
    if (item.id === state.selectedItemId) return state.pinLayer;
    if (state.highlightRoute && itemInRoute(item, state.highlightRoute)) return state.routeLayer;
    return state.markersLayer;
  }

  function paneFor(target) {
    if (target === state.pinLayer) return "miSelectedPane";
    if (target === state.routeLayer) return "miRoutePane";
    return "markerPane";
  }

  function placeIllustratedMarker(item, marker) {
    var target = targetLayerFor(item);
    if (marker._miLayer === target) return;
    if (marker._miLayer) marker._miLayer.removeLayer(marker);
    marker.options.pane = paneFor(target);
    target.addLayer(marker);
    marker._miLayer = target;
  }

  function markerZIndex(item) {
    if (item.id === state.selectedItemId) return 1200;
    if (state.highlightRoute && itemInRoute(item, state.highlightRoute)) return 800;
    return window.MAPA_ILUSTRADO.isLandmark(item) ? 400 : 0;
  }

  function ensureMarkerPanes() {
    [["miRoutePane", 640], ["miSelectedPane", 660]].forEach(function (pane) {
      if (!state.map.getPane(pane[0])) {
        state.map.createPane(pane[0]);
        state.map.getPane(pane[0]).style.zIndex = pane[1];
      }
    });
  }

  function initIllustratedLayers() {
    ensureMarkerPanes();
    var clusterOptions = {
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      animate: !REDUCED_MOTION,
      // Raio menor de perto; no zoom máximo, o que ainda se sobrepõe abre em leque (spiderfy).
      // Raio acompanha o tamanho dos desenhos (rosetas-emblema têm ~50 px) para não haver sobreposição.
      maxClusterRadius: function (zoom) { return zoom <= 11 ? 64 : zoom <= 14 ? 80 : zoom <= 16 ? 52 : zoom <= 17 ? 40 : 30; },
      spiderfyDistanceMultiplier: 1.7,
      spiderLegPolylineOptions: { weight: 1.2, color: "#1b231d", opacity: 0.5 },
      iconCreateFunction: function (cluster) { return window.MAPA_ILUSTRADO.clusterIcon(cluster); }
    };
    var hasClusters = typeof L.markerClusterGroup === "function";
    state.markersLayer = hasClusters ? L.markerClusterGroup(clusterOptions) : L.layerGroup();
    state.markersLayer.addTo(state.map);
    state.routeLayer = hasClusters
      ? L.markerClusterGroup(Object.assign({}, clusterOptions, {
        clusterPane: "miRoutePane",
        iconCreateFunction: function (cluster) {
          return window.MAPA_ILUSTRADO.clusterIcon(cluster, { routeColor: getRouteColor(state.highlightRoute) });
        }
      }))
      : L.layerGroup();
    state.routeLayer.addTo(state.map);
    state.pinLayer = L.layerGroup().addTo(state.map);
    L.control.zoom({ position: "topright" }).addTo(state.map);

    state.map.on("zoomend", syncZoomClasses);
    state.map.on("zoomend moveend", labelClusters);
    // Enter/Espaço numa roseta: aproxima (ou abre em leque no zoom máximo).
    [state.markersLayer, state.routeLayer].forEach(function (group) {
      if (!group.on) return;
      group.on("animationend spiderfied", labelClusters);
      group.on("clusterkeypress", function (event) {
        var code = event.originalEvent && event.originalEvent.keyCode;
        if (code !== 13 && code !== 32) return;
        if (event.originalEvent.preventDefault) event.originalEvent.preventDefault();
        if (state.map.getZoom() >= state.map.getMaxZoom()) event.layer.spiderfy();
        else event.layer.zoomToBounds({ padding: [40, 40] });
      });
    });
    syncZoomClasses();
  }

  function syncZoomClasses() {
    var container = state.map && state.map.getContainer();
    if (!container) return;
    // Marcos ilustrados ficam menores até o zoom 16, quando vizinhos (Matriz, Casa da
    // Memória, Vapor Pery) ainda estão a poucos pixels uns dos outros.
    container.classList.toggle("mi-z-mid", state.map.getZoom() >= 16 && state.map.getZoom() < 18);
    container.classList.toggle("mi-z-near", state.map.getZoom() >= 18);
  }

  // Rosetas de agrupamento são marcadores focáveis do Leaflet; damos nome acessível a elas.
  function labelClusters() {
    window.requestAnimationFrame(function () {
      Array.prototype.forEach.call(document.querySelectorAll("#tourismMap .mi-cluster-icon"), function (el) {
        var count = el.querySelector(".mi-cluster-count");
        if (!count) return;
        el.setAttribute("aria-label", replaceCount(mi("clusterLabel"), count.textContent));
        el.setAttribute("role", "button");
      });
    });
  }

  function renderIllustratedMarkers() {
    state.markersLayer.clearLayers();
    state.routeLayer.clearLayers();
    state.pinLayer.clearLayers();
    state.markerIndex = {};

    var bounds = [];
    var routeBounds = [];
    var markers = [];
    state.filteredItems.forEach(function (item) {
      if (!item.possuiCoordenadas || state.markerIndex[item.id]) return;
      var latLng = [item.coordenadas.lat, item.coordenadas.lng];
      var marker = L.marker(latLng, {
        icon: illustratedIconFor(item),
        title: item.nome,
        alt: item.nome,
        keyboard: true,
        riseOnHover: true,
        zIndexOffset: markerZIndex(item),
        miFamily: window.MAPA_ILUSTRADO.familyFor(item),
        miLandmark: window.MAPA_ILUSTRADO.isLandmark(item) ? item.id : ""
      });
      marker.on("click", function () {
        var icon = marker.getElement && marker.getElement();
        var viaKeyboard = !!(icon && document.activeElement === icon);
        selectItem(item.id, false, { focusSheet: viaKeyboard });
      });
      // Sem popup, o Leaflet não liga Enter ao marcador: Enter e Espaço abrem a ficha.
      marker.on("keypress", function (event) {
        var code = event.originalEvent && event.originalEvent.keyCode;
        if (code !== 13 && code !== 32) return;
        if (event.originalEvent.preventDefault) event.originalEvent.preventDefault();
        selectItem(item.id, false, { focusSheet: true });
      });
      state.markerIndex[item.id] = marker;
      markers.push({ item: item, marker: marker });
      bounds.push(latLng);
      if (state.highlightRoute && itemInRoute(item, state.highlightRoute)) routeBounds.push(latLng);
    });

    // Cadastro em lote no agrupamento (mais rápido que um por um).
    var batches = [[state.markersLayer, []], [state.routeLayer, []], [state.pinLayer, []]];
    markers.forEach(function (entry) {
      var target = targetLayerFor(entry.item);
      entry.marker._miLayer = target;
      entry.marker.options.pane = paneFor(target);
      batches.forEach(function (batch) { if (batch[0] === target) batch[1].push(entry.marker); });
    });
    batches.forEach(function (batch) {
      if (batch[0].addLayers) batch[0].addLayers(batch[1]);
      else batch[1].forEach(function (m) { batch[0].addLayer(m); });
    });

    var fitTo = routeBounds.length ? routeBounds : bounds;
    if (fitTo.length) {
      // Margem superior: barra de roteiros + altura dos desenhos acima da âncora.
      state.map.fitBounds(fitTo, { paddingTopLeft: [40, 120], paddingBottomRight: mapFitPaddingBR(), maxZoom: 14, animate: false });
    } else {
      state.map.setView([-25.8775, -50.3822], 12);
    }
    labelClusters();
  }

  function mapFitPaddingBR() {
    if (!state.sheetOpen) return [40, 40];
    return isWideViewport() ? [400, 40] : [40, 200];
  }

  function updateIllustratedMarkers() {
    Object.keys(state.markerIndex).forEach(function (itemId) {
      var marker = state.markerIndex[itemId];
      var item = getItemById(itemId);
      if (!marker || !item) return;
      marker.setIcon(illustratedIconFor(item));
      marker.setZIndexOffset(markerZIndex(item));
      placeIllustratedMarker(item, marker);
    });
    [state.markersLayer, state.routeLayer].forEach(function (group) {
      if (group.refreshClusters) group.refreshClusters();
    });
    labelClusters();
  }

  // Centraliza o ponto na área do mapa que continua visível ao lado/acima da ficha.
  function revealOnMap(item, zoomIn) {
    if (!item.possuiCoordenadas || !state.map) return;
    var latLng = L.latLng(item.coordenadas.lat, item.coordenadas.lng);
    var zoom = zoomIn ? Math.max(state.map.getZoom(), 16) : state.map.getZoom();
    var size = state.map.getSize();
    var offset = L.point(0, 0);
    if (state.sheetOpen) {
      if (isWideViewport()) {
        offset = L.point(Math.min(200, size.x * 0.2), 0);
      } else {
        var sheet = document.getElementById("miSheet");
        var sheetHeight = sheet ? sheet.getBoundingClientRect().height : 0;
        offset = L.point(0, Math.min(sheetHeight / 2, size.y * 0.3));
      }
    }
    var point = state.map.project(latLng, zoom).add(offset);
    var target = state.map.unproject(point, zoom);
    if (!zoomIn) {
      var visible = state.map.getBounds().pad(-0.12);
      var pixel = state.map.latLngToContainerPoint(latLng);
      var hiddenBySheet = state.sheetOpen && (isWideViewport()
        ? pixel.x > size.x - 400
        : pixel.y > size.y - (document.getElementById("miSheet") || { offsetHeight: 0 }).offsetHeight - 30);
      if (visible.contains(latLng) && !hiddenBySheet) return;
    }
    state.map.setView(target, zoom, { animate: !REDUCED_MOTION });
  }

  function selectIllustratedItem(item, centerOnMap, options) {
    options = options || {};
    state.sheetOpen = true;
    state.sheetExpanded = false;
    renderPanelGroups();
    renderList();
    renderSheet();
    updateIllustratedMarkers();
    syncUrlState();
    if (item.possuiCoordenadas && state.map) {
      revealOnMap(item, centerOnMap !== false);
    }
    keepSheetInViewport();
    if (options.focusSheet) focusSheetTitle();
  }

  // No celular a ficha mora no rodapé do mapa: se esse rodapé estiver abaixo da tela,
  // a página sobe o necessário para a ficha aparecer inteira.
  function keepSheetInViewport() {
    if (isWideViewport()) return;
    var stage = document.getElementById("miStage");
    if (!stage) return;
    var overflow = stage.getBoundingClientRect().bottom - window.innerHeight;
    if (overflow > 0) window.scrollBy({ top: overflow + 8, behavior: REDUCED_MOTION ? "auto" : "smooth" });
  }

  function focusSheetTitle() {
    window.setTimeout(function () {
      var title = document.getElementById("miSheetTitle");
      if (title) title.focus({ preventScroll: true });
    }, 30);
  }

  function closeSheet(returnFocus) {
    var previousId = state.selectedItemId;
    state.sheetOpen = false;
    state.sheetExpanded = false;
    state.selectedItemId = null;
    if (state.highlightRoute && !previousId) {
      setHighlightRoute("");
      return;
    }
    renderSheet();
    renderList();
    updateIllustratedMarkers();
    if (returnFocus && previousId && state.markerIndex[previousId]) {
      var el = state.markerIndex[previousId].getElement && state.markerIndex[previousId].getElement();
      if (el) el.focus({ preventScroll: true });
    }
  }

  function setHighlightRoute(routeId) {
    state.highlightRoute = routeId || "";
    state.selectedItemId = null;
    state.sheetOpen = !!state.highlightRoute;
    state.sheetExpanded = false;
    renderRouteBar();
    renderMarkers();
    renderSheet();
    renderList();
    syncUrlState();
    var stage = document.getElementById("miStage");
    if (stage) stage.classList.toggle("mi-route-active", !!state.highlightRoute);
  }

  function initIllustratedUi() {
    var stage = document.getElementById("miStage");
    if (!stage) return;

    // ?rota= continua funcionando: no modo ilustrado o roteiro é destacado (demais lugares ficam visíveis).
    if (state.requestedRoute) {
      state.highlightRoute = state.selectedRouteCanonical || state.requestedRoute;
      state.requestedRoute = "";
      state.sheetOpen = true;
      if (state.panelGroup === "routes") state.panelGroup = "all";
      stage.classList.add("mi-route-active");
    }

    var routes = document.createElement("div");
    routes.className = "mi-routes";
    routes.id = "miRoutes";
    routes.setAttribute("role", "group");
    stage.appendChild(routes);
    routes.addEventListener("click", function (event) {
      if (event.target.closest("[data-mi-routes-toggle]")) {
        setRoutesMenu(!routes.classList.contains("is-open"));
        return;
      }
      var button = event.target.closest("[data-mi-route]");
      if (!button) return;
      var routeId = button.getAttribute("data-mi-route");
      setRoutesMenu(false);
      setHighlightRoute(routeId === state.highlightRoute ? "" : routeId);
    });
    routes.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && routes.classList.contains("is-open")) {
        event.preventDefault();
        setRoutesMenu(false, true);
      }
    });

    var legend = document.createElement("div");
    legend.className = "mi-legend";
    legend.id = "miLegend";
    stage.appendChild(legend);
    legend.addEventListener("click", function (event) {
      if (!event.target.closest(".mi-legend-toggle")) return;
      var open = legend.classList.toggle("is-open");
      event.target.closest(".mi-legend-toggle").setAttribute("aria-expanded", String(open));
    });
    // A legenda começa recolhida: os filtros já mostram os mesmos pins com nome.

    var sheet = document.createElement("aside");
    sheet.className = "mi-sheet";
    sheet.id = "miSheet";
    sheet.setAttribute("hidden", "");
    stage.appendChild(sheet);
    sheet.addEventListener("click", handleSheetClick);
    sheet.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSheet(true);
      }
    });
    bindSheetSwipe(sheet);

    // Evita que cliques/rolagem na ficha e nos controles sobrepostos arrastem o mapa.
    [routes, legend, sheet].forEach(function (el) {
      if (L.DomEvent) {
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);
      }
    });

    renderLegend();
    renderRouteBar();
  }

  function handleSheetClick(event) {
    var target = event.target;
    if (target.closest("[data-mi-close]")) {
      closeSheet(true);
      return;
    }
    if (target.closest("[data-mi-expand]")) {
      state.sheetExpanded = !state.sheetExpanded;
      renderSheet();
      return;
    }
    var stop = target.closest("[data-mi-stop]");
    if (stop) {
      selectItem(stop.getAttribute("data-mi-stop"), true, { focusSheet: true });
      return;
    }
    var routeLink = target.closest("[data-mi-route-link]");
    if (routeLink) {
      setHighlightRoute(routeLink.getAttribute("data-mi-route-link"));
      focusSheetTitle();
    }
  }

  // Ficha inferior no celular: arrastar a alça para cima expande, para baixo recolhe/fecha.
  function bindSheetSwipe(sheet) {
    var startY = null;
    sheet.addEventListener("touchstart", function (event) {
      if (!event.target.closest(".mi-sheet-handle")) return;
      startY = event.touches[0].clientY;
    }, { passive: true });
    sheet.addEventListener("touchend", function (event) {
      if (startY === null) return;
      var delta = event.changedTouches[0].clientY - startY;
      startY = null;
      if (Math.abs(delta) < 28) return;
      if (delta < 0 && !state.sheetExpanded) { state.sheetExpanded = true; renderSheet(); }
      else if (delta > 0 && state.sheetExpanded) { state.sheetExpanded = false; renderSheet(); }
      else if (delta > 0) closeSheet(false);
    }, { passive: true });
  }

  // No celular a barra vira um único botão "Roteiros" que abre as seis opções em grade.
  function setRoutesMenu(open, returnFocus) {
    var bar = document.getElementById("miRoutes");
    if (!bar) return;
    bar.classList.toggle("is-open", !!open);
    var toggle = bar.querySelector("[data-mi-routes-toggle]");
    if (toggle) toggle.setAttribute("aria-expanded", String(!!open));
    if (open) {
      var first = bar.querySelector(".mi-route-chip.is-active") || bar.querySelector(".mi-route-chip");
      if (first && !isWideViewport()) first.focus({ preventScroll: true });
    } else if (returnFocus && toggle) {
      toggle.focus({ preventScroll: true });
    }
  }

  function renderRouteBar() {
    var bar = document.getElementById("miRoutes");
    if (!bar) return;
    var routes = getRouteRecords();
    var active = state.highlightRoute ? getRouteRecord(state.highlightRoute) : null;
    var open = bar.classList.contains("is-open");
    bar.setAttribute("aria-label", mi("routesLabel"));
    bar.innerHTML = '<button type="button" class="mi-routes-toggle' + (active ? " has-active" : "") + '" data-mi-routes-toggle aria-expanded="' + open + '" aria-controls="miRoutesList"'
      + (active ? ' style="--mi-route:' + getRouteColor(active.id) + '"' : "") + ">"
      + (active ? '<span class="mi-route-dot" aria-hidden="true"></span>' + escapeHtml(active.nome) : escapeHtml(mi("routesToggle")) + ' <span class="mi-routes-count">' + routes.length + "</span>")
      + "</button>"
      + '<span class="mi-routes-label" aria-hidden="true">' + escapeHtml(mi("routesLabel")) + "</span>"
      + '<div class="mi-routes-list" id="miRoutesList">'
      + routes.map(function (route) {
        var active = route.id === state.highlightRoute;
        return '<button type="button" class="mi-route-chip' + (active ? " is-active" : "") + '" data-mi-route="' + escapeHtml(route.id) + '" aria-pressed="' + active + '" style="--mi-route:' + getRouteColor(route.id) + '">'
          + '<span class="mi-route-dot" aria-hidden="true"></span>' + escapeHtml(route.nome) + "</button>";
      }).join("")
      + "</div>";
  }

  function renderLegend() {
    var legend = document.getElementById("miLegend");
    if (!legend) return;
    var open = legend.classList.contains("is-open");
    legend.innerHTML = '<button type="button" class="mi-legend-toggle" aria-expanded="' + open + '" aria-controls="miLegendList">'
      + escapeHtml(mi("legend")) + "</button>"
      + '<div class="mi-legend-body" id="miLegendList"><ul>' + window.MAPA_ILUSTRADO.legendHtml(MI_TEXT[state.lang] ? MI_TEXT[state.lang].families : MI_TEXT.pt.families) + "</ul>"
      + '<p class="mi-legend-note"><span class="mi-legend-landmark" aria-hidden="true">' + window.MAPA_ILUSTRADO.landmarkSvg("igreja-agua-branca") + "</span>" + escapeHtml(mi("legendLandmarks")) + "</p></div>";
  }

  function renderSheetMedia(item, family) {
    if (item.imagem) {
      return '<img src="' + escapeHtml(item.imagem) + '" alt="' + escapeHtml(item.nome) + '" loading="lazy" decoding="async" width="640" height="400">';
    }
    // Sem foto real cadastrada: o próprio pin ilustrado, em papel — nunca uma foto inventada.
    var art = window.MAPA_ILUSTRADO.isLandmark(item)
      ? window.MAPA_ILUSTRADO.landmarkSvg(item.id)
      : window.MAPA_ILUSTRADO.pinSvg(family);
    return '<div class="mi-sheet-art" style="--mi-fam:' + window.MAPA_ILUSTRADO.familyColor(family) + '" aria-hidden="true">' + art + "</div>";
  }

  function renderItemSheet(item) {
    var family = window.MAPA_ILUSTRADO.familyFor(item);
    var familyLabel = (MI_TEXT[state.lang] || MI_TEXT.pt).families[family] || item.categoriaLabel;
    var localDetailUrl = getLocalDetailUrl(item);
    // Mesmas regras públicas da V2.2 (js/public-establishments-renderer.js): lembretes
    // internos "(confirmar …)" e o telefone de preenchimento (42) 3532-0000 não aparecem.
    var address = publicText(item.localizacao);
    var phone = publicPhone(item.telefone);
    var hours = publicText(item.horario || item.periodo);
    var meta = [];
    if (address) meta.push('<li><span aria-hidden="true">📍</span> ' + escapeHtml(address) + "</li>");
    if (hours) meta.push('<li><span aria-hidden="true">🕒</span> ' + escapeHtml(hours) + "</li>");
    if (phone) meta.push('<li><span aria-hidden="true">📞</span> ' + escapeHtml(phone) + "</li>");

    var memberOf = getRouteRecords().filter(function (route) { return itemInRoute(item, route.id); });
    var routeChips = memberOf.length
      ? '<div class="mi-sheet-routes"><span>' + escapeHtml(mi("partOfRoute")) + "</span>"
        + memberOf.map(function (route) {
          return '<button type="button" class="mi-route-chip is-small" data-mi-route-link="' + escapeHtml(route.id) + '" style="--mi-route:' + getRouteColor(route.id) + '"><span class="mi-route-dot" aria-hidden="true"></span>' + escapeHtml(route.nome) + "</button>";
        }).join("") + "</div>"
      : "";

    return '<div class="mi-sheet-media">' + renderSheetMedia(item, family) + "</div>"
      + '<div class="mi-sheet-main">'
      + '<p class="mi-sheet-kicker" style="--mi-fam:' + window.MAPA_ILUSTRADO.familyColor(family) + '"><span class="mi-sheet-kicker-dot" aria-hidden="true"></span>' + escapeHtml(familyLabel) + "</p>"
      + '<h2 class="mi-sheet-title" id="miSheetTitle" tabindex="-1">' + escapeHtml(item.nome) + "</h2>"
      + '<div class="mi-sheet-actions">'
      + renderPrimaryInfoAction(item, localDetailUrl)
      + (item.possuiCoordenadas ? '<a class="map-button" href="' + escapeHtml(item.mapsUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(t("directions")) + "</a>" : "")
      + "</div>"
      + '<div class="mi-sheet-more">'
      + (item.localizacaoAproximada ? '<p class="mi-sheet-approx">' + escapeHtml(mi("approx")) + "</p>" : "")
      + '<p class="mi-sheet-desc">' + escapeHtml(publicText(item.descricao) || t("noDescription")) + "</p>"
      + (meta.length ? '<ul class="mi-sheet-meta">' + meta.join("") + "</ul>" : "")
      + routeChips
      + renderApprovedEventsSection(item, "panel")
      + "</div>"
      + "</div>";
  }

  function renderRouteSheet(route) {
    var stops = getRouteStops(route.id);
    var located = stops.filter(function (stop) { return stop.possuiCoordenadas; });
    var countLabel = located.length === 1 ? mi("routeStopsSingle") : replaceCount(mi("routeStops"), located.length);
    return '<div class="mi-sheet-media">' + (route.imagem ? '<img src="' + escapeHtml(route.imagem) + '" alt="' + escapeHtml(route.nome) + '" loading="lazy" decoding="async" width="640" height="400">' : "") + "</div>"
      + '<div class="mi-sheet-main">'
      + '<p class="mi-sheet-kicker" style="--mi-fam:' + getRouteColor(route.id) + '"><span class="mi-sheet-kicker-dot" aria-hidden="true"></span>' + escapeHtml(mi("routeKicker")) + " · " + escapeHtml(countLabel) + "</p>"
      + '<h2 class="mi-sheet-title" id="miSheetTitle" tabindex="-1">' + escapeHtml(route.nome) + "</h2>"
      + '<div class="mi-sheet-actions"><button type="button" class="map-button" data-mi-close>' + escapeHtml(mi("routeClear")) + "</button></div>"
      + '<div class="mi-sheet-more">'
      + '<p class="mi-sheet-desc">' + escapeHtml(route.descricao || "") + "</p>"
      + '<p class="mi-sheet-note">' + escapeHtml(mi("routeNote")) + "</p>"
      + '<ol class="mi-stops">' + stops.map(function (stop) {
        var family = window.MAPA_ILUSTRADO.familyFor(stop);
        return '<li><button type="button" data-mi-stop="' + escapeHtml(stop.id) + '"' + (stop.possuiCoordenadas ? "" : " disabled") + ">"
          + '<span class="mi-stop-pin" aria-hidden="true">' + window.MAPA_ILUSTRADO.pinSvg(family) + "</span>"
          + '<span class="mi-stop-name">' + escapeHtml(stop.nome) + (stop.possuiCoordenadas ? "" : ' <em>(' + escapeHtml(mi("noLocation")) + ")</em>") + "</span></button></li>";
      }).join("") + "</ol>"
      + "</div>"
      + "</div>";
  }

  function renderSheet() {
    var sheet = document.getElementById("miSheet");
    if (!sheet) return;
    var item = state.sheetOpen && state.selectedItemId ? getItemById(state.selectedItemId) : null;
    var route = !item && state.sheetOpen && state.highlightRoute ? getRouteRecord(state.highlightRoute) : null;
    var stage = document.getElementById("miStage");

    if (!item && !route) {
      sheet.setAttribute("hidden", "");
      sheet.innerHTML = "";
      if (stage) stage.classList.remove("mi-sheet-open");
      document.body.classList.remove("mi-sheet-visible");
      return;
    }

    sheet.removeAttribute("hidden");
    sheet.classList.toggle("is-expanded", !!state.sheetExpanded);
    sheet.classList.toggle("is-route", !!route);
    sheet.setAttribute("aria-label", route ? mi("routeKicker") + ": " + route.nome : mi("sheetRegion") + ": " + item.nome);
    sheet.innerHTML = ''
      + '<button type="button" class="mi-sheet-handle" data-mi-expand aria-expanded="' + (!!state.sheetExpanded) + '">'
      + '<span class="mi-sheet-grip" aria-hidden="true"></span><span class="mi-sheet-handle-text">' + escapeHtml(state.sheetExpanded ? mi("collapse") : mi("expand")) + "</span></button>"
      + '<button type="button" class="mi-sheet-close" data-mi-close aria-label="' + escapeHtml(mi("close")) + '">×</button>'
      + '<div class="mi-sheet-body">' + (route ? renderRouteSheet(route) : renderItemSheet(item)) + "</div>";
    if (stage) stage.classList.add("mi-sheet-open");
    document.body.classList.add("mi-sheet-visible");
  }

  function refreshView() {
    filterItems();
    renderFilters();
    renderPanelGroups();
    renderStats();
    renderMarkers();
    renderSelectedItem();
    renderList();
    renderMobileViewToggle();
    if (isIllustrated()) renderRouteBar();
    updateSearchUi();
    syncUrlState();
  }

  function initMap() {
    state.lang = getLang();
    state.items = buildItems();
    attachApprovedEventsToItems(state.items, []);
    applyInitialStateFromUrl();

    state.map = L.map("tourismMap", {
      zoomControl: !isIllustrated(),
      maxZoom: 19,
      scrollWheelZoom: true
    });
    if (isIllustrated()) {
      initIllustratedLayers();
    } else {
      state.markersLayer = L.layerGroup().addTo(state.map);
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(state.map);

    state.map.setView([-25.8775, -50.3822], 12);
    applyPageText();
    bindEvents();
    if (isIllustrated()) initIllustratedUi();
    setMobileView("map", false);
    refreshView();

    window.setTimeout(function () {
      state.map.invalidateSize();
    }, 180);

    loadApprovedEventsForMap();
  }

  function refreshDynamicData() {
    if (!state.map) return;
    state.items = buildItems();
    attachApprovedEventsToItems(state.items, state.approvedEvents);
    state.selectedRouteCanonical = state.requestedRoute && window.TURISMO_PUBLIC_DATA_UTILS
      ? window.TURISMO_PUBLIC_DATA_UTILS.resolveRouteCanonical((window.TURISMO_DATA || {}).rotas, state.requestedRoute)
      : state.selectedRouteCanonical;
    state.selectedItemId = null;
    refreshView();
  }

  function bootstrap() {
    // Sem js/mapa-ilustrado.js a página volta inteira ao layout anterior (painel lateral incluso).
    if (document.body && document.body.classList.contains("mi-on") && !window.MAPA_ILUSTRADO) {
      document.body.classList.remove("mi-on");
    }
    if (!window.L || !window.TURISMO_DATA || !document.getElementById("tourismMap")) return;
    // Sem o agrupamento (CDN indisponível) os pins continuam, sem rosetas; marca-se a página.
    if (typeof L.markerClusterGroup !== "function") document.body.classList.add("mi-no-cluster");
    initMap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
  window.addEventListener("turismo:data-ready", refreshDynamicData);
})();
