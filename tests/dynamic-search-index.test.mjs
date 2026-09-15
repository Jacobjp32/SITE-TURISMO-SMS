import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const [searchSource, searchIndexSource] = await Promise.all([
  readFile(new URL("../js/search.js", import.meta.url), "utf8"),
  readFile(new URL("../js/search-index.js", import.meta.url), "utf8"),
]);

function entry(title, url, overrides = {}) {
  return {
    title,
    category: "Sabores",
    description: "Item público do portal",
    url,
    keywords: ["Gastronomia"],
    ...overrides,
  };
}

function classList() {
  const values = new Set();
  return {
    add(...names) {
      names.forEach((name) => values.add(name));
    },
    remove(...names) {
      names.forEach((name) => values.delete(name));
    },
    contains(name) {
      return values.has(name);
    },
  };
}

function eventTarget(initial = {}) {
  const listeners = new Map();
  return {
    ...initial,
    addEventListener(type, listener) {
      const current = listeners.get(type) || [];
      current.push(listener);
      listeners.set(type, current);
    },
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    },
    dispatch(type, event = {}) {
      const payload = {
        preventDefault() {},
        target: event.target || this,
        ...event,
      };
      (listeners.get(type) || []).forEach((listener) => listener(payload));
    },
  };
}

function createHarness(initialIndex, language = "pt", options = {}) {
  const timers = [];
  const modal = eventTarget({ classList: classList(), style: {}, setAttribute() {} });
  const dialog = eventTarget({});
  const input = eventTarget({ value: "", focus() {} });
  const results = eventTarget({ innerHTML: "" });
  const trigger = eventTarget({ focus() {} });
  const close = eventTarget({});
  const navLinks = eventTarget({ classList: classList() });
  const navToggle = eventTarget({ classList: classList() });
  const mobileOverlay = eventTarget({ classList: classList() });
  const menuOverlay = eventTarget({ classList: classList() });
  const elements = {
    searchModal: modal,
    searchDialog: dialog,
    search: input,
    searchResults: results,
    navLinks,
    navToggle,
    mobileOverlay,
    menuOverlay,
  };
  const document = eventTarget({
    readyState: "complete",
    activeElement: trigger,
    body: { classList: classList(), style: {} },
    getElementById(id) {
      return elements[id] || null;
    },
    querySelectorAll(selector) {
      if (selector === "[data-search-open]") return [trigger];
      if (selector === "[data-search-close]") return [close];
      return [];
    },
  });
  const window = eventTarget({
    TURISMO_SEARCH_INDEX: initialIndex,
    TURISMO_DATA: options.turismoData,
    translations: {
      pt: {},
      en: {
        "search-no-results": "No results found",
        "search-no-results-help": "Try another query.",
      },
    },
    location: { origin: "https://turismo.example.test" },
    setTimeout(callback) {
      assert.equal(typeof callback, "function", "setTimeout must receive a function callback");
      timers.push(callback);
      return timers.length;
    },
  });
  window.window = window;
  const localStorage = {
    getItem(key) {
      return key === "sms-lang" ? language : null;
    },
  };

  const context = { window, document, localStorage, URL, console };
  if (options.loadSearchIndex === true && options.searchIndexAfterSearch !== true) {
    vm.runInNewContext(searchIndexSource, context);
    if (options.dispatchDataReadyBeforeSearch === true) {
      window.dispatch("turismo:data-ready");
    }
  }
  vm.runInNewContext(searchSource, context);
  if (options.loadSearchIndex === true && options.searchIndexAfterSearch === true) {
    vm.runInNewContext(searchIndexSource, context);
  }

  function flushTimers() {
    while (timers.length) timers.shift()();
  }

  function openAndSearch(query) {
    window.TurismoSearch.open(trigger);
    flushTimers();
    input.value = query;
    input.dispatch("input", { target: input });
  }

  function resultCount() {
    return (results.innerHTML.match(/class="search-result-card"/g) || []).length;
  }

  return {
    window,
    document,
    modal,
    input,
    results,
    flushTimers,
    timerCount() {
      return timers.length;
    },
    openAndSearch,
    resultCount,
  };
}

const fixedEntry = entry("AgroSamas", "/agrosamas", {
  category: "Eventos",
  keywords: ["agro", "evento"],
});
const chessEntry = entry("Chess Choperia", "/local?id=chess-choperia");
const chessDataItem = {
  nome: "Chess Choperia",
  categoria: "Gastronomia",
  descricao: "Estabelecimento publicado no catálogo CMS",
  url: "/local?id=chess-choperia",
  tags: ["Gastronomia"],
};

function turismoData(restaurantes = []) {
  return {
    pontos: [],
    rotas: [],
    hospedagens: [],
    restaurantes,
    eventos: [],
    informacoesEssenciais: [],
  };
}

test("STATIC_INDEX_SEARCH_WORKS", () => {
  const harness = createHarness([fixedEntry]);
  harness.openAndSearch("AgroSamas");

  assert.equal(harness.resultCount(), 1);
  assert.match(harness.results.innerHTML, />AgroSamas</);
});

test("REPLACED_INDEX_AFTER_INIT_IS_USED", () => {
  const harness = createHarness([fixedEntry]);
  harness.window.TURISMO_SEARCH_INDEX = [fixedEntry, chessEntry];
  harness.openAndSearch("Chess");

  assert.equal(harness.resultCount(), 1);
  assert.match(harness.results.innerHTML, />Chess Choperia</);
});

test("MISSED_DATA_READY_EVENT_IS_SAFE", () => {
  const harness = createHarness(undefined, "pt", {
    loadSearchIndex: true,
    turismoData: turismoData([chessDataItem]),
    dispatchDataReadyBeforeSearch: true,
  });
  harness.openAndSearch("Chess");

  assert.equal(harness.resultCount(), 1);
  assert.match(harness.results.innerHTML, /href="\/local\?id=chess-choperia"/);
});

test("CMS_ITEM_AFTER_DATA_READY_IS_SEARCHABLE", () => {
  const harness = createHarness(undefined, "pt", {
    loadSearchIndex: true,
    turismoData: turismoData([]),
  });
  harness.openAndSearch("Chess");
  assert.equal(harness.resultCount(), 0);

  harness.window.TURISMO_DATA = turismoData([chessDataItem]);
  harness.window.dispatch("turismo:data-ready");
  harness.flushTimers();

  assert.equal(harness.resultCount(), 1);
  assert.match(harness.results.innerHTML, />Chess Choperia</);
  assert.equal(harness.window.TURISMO_SEARCH_INDEX.filter((item) => item.title === "Chess Choperia").length, 1);
});

test("DATA_READY_SEARCH_LISTENER_BEFORE_REBUILD_IS_SAFE", () => {
  const harness = createHarness(undefined, "pt", {
    loadSearchIndex: true,
    searchIndexAfterSearch: true,
    turismoData: turismoData([]),
  });
  harness.openAndSearch("Chess");
  assert.equal(harness.resultCount(), 0);

  harness.window.TURISMO_DATA = turismoData([chessDataItem]);
  harness.window.dispatch("turismo:data-ready");
  harness.flushTimers();

  assert.equal(harness.resultCount(), 1);
  assert.match(harness.results.innerHTML, />Chess Choperia</);
});

test("CHESS_SEARCH_RETURNS_CHESS", () => {
  const harness = createHarness([fixedEntry]);
  harness.window.TURISMO_SEARCH_INDEX = [fixedEntry, chessEntry];
  harness.openAndSearch("Chess");

  assert.equal(harness.resultCount(), 1);
  assert.match(harness.results.innerHTML, /href="\/local\?id=chess-choperia"/);
});

test("INIT_EMPTY_INDEX_DOES_NOT_DISABLE_SEARCH", () => {
  const harness = createHarness([]);
  assert.ok(harness.window.TurismoSearch);

  harness.openAndSearch("Chess");
  harness.window.TURISMO_SEARCH_INDEX = [chessEntry];
  harness.window.dispatch("turismo:data-ready");
  harness.flushTimers();

  assert.equal(harness.resultCount(), 1);
});

test("SEARCH_INDEX_REPLACEMENT_NO_DUPLICATES", () => {
  const harness = createHarness(undefined, "pt", {
    loadSearchIndex: true,
    turismoData: turismoData([]),
  });
  assert.equal(harness.window.listenerCount("turismo:data-ready"), 2);
  harness.openAndSearch("Chess");

  harness.window.TURISMO_DATA = turismoData([chessDataItem]);
  harness.window.dispatch("turismo:data-ready");
  harness.flushTimers();
  harness.window.dispatch("turismo:data-ready");
  harness.flushTimers();

  assert.equal(harness.resultCount(), 1);
  assert.equal(harness.window.TURISMO_SEARCH_INDEX.filter((item) => item.title === "Chess Choperia").length, 1);
  assert.equal(harness.window.listenerCount("turismo:data-ready"), 2);
});

test("DATA_READY_QUERY_GUARD_IS_SAFE", () => {
  const harness = createHarness([fixedEntry]);
  harness.input.value = "Chess";
  harness.window.dispatch("turismo:data-ready");
  harness.window.dispatch("turismo:data-ready");

  assert.equal(harness.modal.classList.contains("active"), false);
  assert.equal(harness.input.value, "Chess");
  assert.equal(harness.timerCount(), 0);

  harness.openAndSearch("C");
  const idleHtml = harness.results.innerHTML;
  harness.window.dispatch("turismo:data-ready");
  assert.equal(harness.timerCount(), 0);
  assert.equal(harness.results.innerHTML, idleHtml);

  harness.input.value = "Chess";
  harness.window.TURISMO_SEARCH_INDEX = [chessEntry];
  harness.window.dispatch("turismo:data-ready");
  assert.equal(harness.timerCount(), 1);
  harness.flushTimers();
  assert.equal(harness.resultCount(), 1);
});

test("MULTIPLE_INDEX_REPLACEMENTS_USE_LATEST_ARRAY", () => {
  const alpha = entry("Alpha", "/alpha");
  const bravo = entry("Bravo", "/bravo");
  const charlie = entry("Charlie", "/charlie");
  const harness = createHarness([alpha]);

  harness.window.TurismoSearch.search("Alpha");
  assert.match(harness.results.innerHTML, /href="\/alpha"/);

  harness.window.TURISMO_SEARCH_INDEX = [bravo];
  harness.window.TurismoSearch.search("Bravo");
  assert.match(harness.results.innerHTML, /href="\/bravo"/);
  assert.doesNotMatch(harness.results.innerHTML, /href="\/alpha"/);

  harness.window.TURISMO_SEARCH_INDEX = [charlie];
  harness.window.TurismoSearch.search("Charlie");
  assert.match(harness.results.innerHTML, /href="\/charlie"/);
  assert.doesNotMatch(harness.results.innerHTML, /href="\/(alpha|bravo)"/);
});

test("ACCENT_NORMALIZATION_PRESERVED", () => {
  const harness = createHarness([
    entry("Mês Polonês", "/mes-polones", { category: "Cultura", keywords: ["tradição"] }),
  ]);
  harness.openAndSearch("mes polones");

  assert.equal(harness.resultCount(), 1);
  assert.match(harness.results.innerHTML, />Mês Polonês</);
});

test("MULTI_TERM_ACCENT_NORMALIZATION_PRESERVED", () => {
  const harness = createHarness([
    entry("São Mateus Histórico", "/sao-mateus", { category: "Cultura" }),
  ]);

  harness.window.TurismoSearch.search("São Mateus");
  assert.equal(harness.resultCount(), 1);
  harness.window.TurismoSearch.search("Sao Mateus");
  assert.equal(harness.resultCount(), 1);
  assert.match(harness.results.innerHTML, />São Mateus Histórico</);
});

test("FIXED_ENTRIES_PRESERVED", () => {
  const harness = createHarness(undefined, "pt", {
    loadSearchIndex: true,
    turismoData: turismoData([chessDataItem]),
  });
  harness.window.dispatch("turismo:data-ready");
  const fixedQueries = [
    ["AgroSamas", "/agrosamas"],
    ["Mês Polonês", "/mes-polones"],
    ["Mapa Turístico", "/mapa-turistico"],
  ];
  fixedQueries.forEach(([query, url]) => {
    harness.window.TurismoSearch.search(query);
    assert.ok(harness.resultCount() >= 1);
    assert.match(harness.results.innerHTML, new RegExp(`href="${url}"`));
  });
  assert.equal(harness.window.TURISMO_SEARCH_INDEX.filter((item) => item.title === "Chess Choperia").length, 1);
});

test("I18N_REFRESH_USES_CURRENT_INDEX", () => {
  const harness = createHarness([fixedEntry], "en");
  harness.window.TURISMO_SEARCH_INDEX = [fixedEntry, chessEntry];
  harness.openAndSearch("Chess");
  harness.document.dispatch("translationsApplied");

  assert.equal(harness.resultCount(), 1);
  assert.match(harness.results.innerHTML, />Chess Choperia</);
});
