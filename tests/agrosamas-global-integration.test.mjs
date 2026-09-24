import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function read(relativePath) {
    return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

const CONTRACT_SOURCE = read('js/data/agrosamas.js');
const HUB_SOURCE = read('agrosamas.html');
const HUB_SCRIPT = read('js/agrosamas-hub.js');
const HUB_STYLES = read('css/agrosamas.css');
const EDITION_SOURCE = read('agrosamas-2026.html');
const EDITION_SCRIPT = read('js/agrosamas-2026.js');
const HOME_SOURCE = read('index.html');
const EVENTS_SOURCE = read('eventos.html');
const NAV_SOURCE = read('js/nav-shared.js');
const SEARCH_SOURCE = read('js/search-index.js');
const SEARCH_UI_SOURCE = read('js/search.js');
const EVENT_SUMMARY_SOURCE = read('js/data/eventos.js');
const SITEMAP_SOURCE = read('sitemap.xml');
const INDEX_STYLES = read('css/index.css');
const HUB_TEMPORAL_HARNESS = read('tests/fixtures/agrosamas-hub-temporal-harness.html');

class FakeElement {
    constructor() {
        this.attributes = new Map();
        this.textContent = '';
    }

    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) || null; }
}

function hubHarness() {
    const selectors = new Map();
    const body = new FakeElement();
    const document = {
        body,
        readyState: 'loading',
        addEventListener() {},
        querySelector(selector) {
            const values = selectors.get(selector) || [];
            return values[0] || null;
        },
        querySelectorAll(selector) { return selectors.get(selector) || []; }
    };
    const register = (selector, count = 1) => {
        const values = Array.from({ length: count }, () => new FakeElement());
        selectors.set(selector, values);
        return values;
    };
    const elements = {
        links: register('[data-hub-edition-link]', 4),
        kicker: register('[data-hub-temporal-kicker]')[0],
        copy: register('[data-hub-temporal-copy]')[0],
        primary: register('[data-hub-primary-action]')[0],
        editionCta: register('[data-hub-edition-cta]')[0],
        archive: register('[data-hub-archive-label]')[0]
    };
    const context = vm.createContext({ console, Date, Intl, document });
    vm.runInContext(CONTRACT_SOURCE, context, { filename: 'js/data/agrosamas.js' });
    vm.runInContext(HUB_SCRIPT, context, { filename: 'js/agrosamas-hub.js' });
    return { context, document, elements };
}

function loadSearchIndex() {
    const window = { addEventListener() {} };
    const context = vm.createContext({ console, window });
    vm.runInContext(EVENT_SUMMARY_SOURCE, context, { filename: 'js/data/eventos.js' });
    vm.runInContext(SEARCH_SOURCE, context, { filename: 'js/search-index.js' });
    return window.TURISMO_SEARCH_INDEX;
}

function searchUiHarness() {
    function classList() {
        const values = new Set();
        return {
            add(...names) { names.forEach(name => values.add(name)); },
            remove(...names) { names.forEach(name => values.delete(name)); },
            contains(name) { return values.has(name); }
        };
    }

    function element() {
        return {
            classList: classList(),
            style: {},
            value: '',
            innerHTML: '',
            addEventListener() {},
            setAttribute() {},
            focus() {}
        };
    }

    const modal = element();
    const dialog = element();
    const input = element();
    const results = element();
    const trigger = element();
    const navLinks = element();
    const navToggle = element();
    const mobileOverlay = element();
    const menuOverlay = element();
    const byId = new Map([
        ['searchModal', modal],
        ['searchDialog', dialog],
        ['search', input],
        ['searchResults', results],
        ['navLinks', navLinks],
        ['navToggle', navToggle],
        ['mobileOverlay', mobileOverlay],
        ['menuOverlay', menuOverlay]
    ]);
    const document = {
        readyState: 'complete',
        body: element(),
        activeElement: null,
        getElementById(id) { return byId.get(id) || null; },
        querySelectorAll(selector) {
            if (selector === '[data-search-open]') return [trigger];
            if (selector === '[data-search-close]') return [];
            return [];
        },
        addEventListener() {}
    };
    const localStorage = { getItem() { return 'pt'; } };
    const window = {
        addEventListener() {},
        location: { origin: 'https://turismo.saomateusdosul.pr.gov.br' },
        setTimeout(callback) { callback(); }
    };
    const context = vm.createContext({ console, document, localStorage, URL, window });
    vm.runInContext(SEARCH_SOURCE, context, { filename: 'js/search-index.js' });
    vm.runInContext(SEARCH_UI_SOURCE, context, { filename: 'js/search.js' });
    return { results, search: window.TurismoSearch };
}

function renderedSearchUrls(search, results, query) {
    search.search(query);
    return Array.from(results.innerHTML.matchAll(/class="search-result-card" href="([^"]+)"/g), match => match[1]);
}

function count(source, pattern) {
    return (source.match(pattern) || []).length;
}

test('permanent hub exists with perennial SEO, one h1 and canonical contract loading order', () => {
    assert.equal(existsSync(new URL('../agrosamas.html', import.meta.url)), true);
    assert.match(HUB_SOURCE, /<link rel="canonical" href="https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/agrosamas">/);
    assert.match(HUB_SOURCE, /<meta property="og:url" content="https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/agrosamas">/);
    assert.match(HUB_SOURCE, /<meta name="twitter:title" content="AgroSamas \| 5º adiado em São Mateus do Sul">/);
    assert.equal(count(HUB_SOURCE, /<h1\b/g), 1);
    assert.doesNotMatch(HUB_SOURCE, /http-equiv="refresh"|location\.(?:href|replace)/i);
    const contractIndex = HUB_SOURCE.indexOf('js/data/agrosamas.js?v=agro-postponed-20260924');
    const bindingsIndex = HUB_SOURCE.indexOf('js/agrosamas-contract-bindings.js?v=agro-postponed-20260924');
    const controllerIndex = HUB_SOURCE.indexOf('js/agrosamas-hub.js?v=agro-postponed-20260924');
    assert.ok(contractIndex > -1);
    assert.ok(bindingsIndex > contractIndex);
    assert.ok(controllerIndex > bindingsIndex);
});

test('hub and edition have distinct roles and a bidirectional route relationship', () => {
    assert.match(HUB_SOURCE, /href="\/agrosamas-2026"/);
    assert.match(EDITION_SOURCE, /href="\/agrosamas"/);
    assert.match(HUB_SOURCE, /Memória em construção/);
    assert.match(EDITION_SOURCE, /id="programacao"/);
    assert.doesNotMatch(HUB_SOURCE, /data-countdown|id="programacao"/);
    assert.match(EDITION_SOURCE, /<link rel="canonical" href="https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/agrosamas-2026">/);
    assert.doesNotMatch(EDITION_SOURCE, /rel="canonical" href="[^"]*\/agrosamas">/);
});

test('hub provides event identity, destination discovery and only real internal routes', () => {
    for (const id of ['visao-geral', 'edicao-ativa', 'o-evento', 'destino', 'edicoes']) {
        assert.match(HUB_SOURCE, new RegExp(`id="${id}"`));
    }
    for (const target of ['agrosamas-2026', 'onde-ficar', 'sabores', 'mapa-turistico', 'mes-polones', 'local']) {
        assert.equal(existsSync(new URL(`../${target}.html`, import.meta.url)), true, `missing route target ${target}`);
    }
    assert.match(HUB_SOURCE, /data-agrosamas-bind="series-name"/);
    assert.match(HUB_SOURCE, /data-agrosamas-bind="name"/);
    assert.match(HUB_SOURCE, /data-agrosamas-bind="date-range"/);
    assert.match(HUB_SOURCE, /data-agrosamas-bind="duration-days"/);
    assert.match(HUB_SOURCE, /data-agro-superseded-date hidden/);
    assert.match(HUB_SOURCE, /data-agrosamas-bind="location"/);
    assert.match(HUB_SOURCE, /data-agrosamas-confirmed-fact="anniversaryIntegration"/);
    assert.match(HUB_SOURCE, /data-agrosamas-confirmed-fact="missDate"/);
});

test('hub keeps the edition postponed across the superseded schedule', () => {
    const { context, document, elements } = hubHarness();
    const edition = context.AgroSamasContract.contract.edition;
    const page = context.AgroSamasHubPage;
    page.renderContractBasics();

    assert.equal(edition.status, 'POSTPONED');
    assert.equal(edition.newDate, null);
    assert.ok(elements.links.every(link => link.getAttribute('href') === edition.route));
    for (const instant of ['2026-09-17T23:59:59-03:00', '2026-09-18T12:00:00-03:00', '2026-09-22T00:00:00-03:00']) {
        assert.equal(page.renderTemporalState(instant), 'POSTPONED');
        assert.equal(document.body.getAttribute('data-agro-temporal-state'), 'POSTPONED');
        assert.match(elements.kicker.textContent, /adiado/i);
        assert.match(elements.copy.textContent, /nova data/i);
        assert.doesNotMatch(elements.primary.textContent, /agora/i);
    }
    assert.ok(elements.links.every(link => link.getAttribute('href') === edition.route));
});

test('hub temporal browser harness derives all states from the canonical contract', () => {
    assert.match(HUB_TEMPORAL_HARNESS, /agrosamas\.html\?qa=hub-temporal-harness/);
    assert.match(HUB_TEMPORAL_HARNESS, /target\.AgroSamasContract/);
    assert.match(HUB_TEMPORAL_HARNESS, /target\.AgroSamasHubPage/);
    assert.match(HUB_TEMPORAL_HARNESS, /hubApi\.renderTemporalState\(contractInstant/);
    assert.match(HUB_TEMPORAL_HARNESS, /edition\.temporal\.liveStartAt/);
    assert.match(HUB_TEMPORAL_HARNESS, /edition\.temporal\.liveEndExclusiveAt/);
    assert.doesNotMatch(HUB_TEMPORAL_HARNESS, /return new Date|localStorage|sessionStorage|document\.cookie|Date\.now\s*=/);
});

test('Home and Eventos prioritize the edition and preserve access to the permanent hub', () => {
    assert.match(HOME_SOURCE, /href="\/agrosamas-2026"[^>]*class="festa-btn"/);
    assert.match(HOME_SOURCE, /href="\/agrosamas"[^>]*class="festa-secondary-link"/);
    assert.match(EVENTS_SOURCE, /href="\/agrosamas-2026"[^>]*class="agrosamas-card-btn"/);
    assert.match(EVENTS_SOURCE, /href="\/agrosamas"[^>]*class="agrosamas-card-secondary"/);
    for (const source of [HOME_SOURCE, EVENTS_SOURCE]) {
        assert.doesNotMatch(source, /17[–-]21|17 a 21 de setembro|cinco dias/i);
        assert.doesNotMatch(source, /AgroSamas[^\n]{0,220}(?:entrada gratuita|gratuito)/i);
        assert.match(source, /ADIADO/);
        assert.doesNotMatch(source, /Roupa Nova|20 SET|18[–-]21 set/i);
    }
    assert.match(HOME_SOURCE, /data-lang-key="agrosamas-desc"[^>]*>O 5º AgroSamas foi adiado/);
    assert.match(EVENTS_SOURCE, /data-lang-key="ev-agrosamas-new-date"[^>]*>Nova data ainda não definida/);
    assert.match(HUB_SOURCE, /data-lang-key="agrosamas-postponed-title"[^>]*>5º AgroSamas adiado/);
    assert.match(EDITION_SOURCE, /data-lang-key="agrosamas-postponed-title"[^>]*>5º AgroSamas adiado/);
});

test('menu, search and map summary expose the intended permanent and edition destinations once', () => {
    assert.equal(count(NAV_SOURCE, /href="\/agrosamas" role="menuitem"/g), 1);
    assert.match(NAV_SOURCE, /id="navAgendaMenu"[\s\S]*?href="\/agrosamas"/);
    const searchEntries = loadSearchIndex().filter(entry => /AgroSamas/.test(entry.title));
    assert.equal(searchEntries.length, 2);
    assert.deepEqual(Array.from(searchEntries, entry => entry.url), ['/agrosamas', '/agrosamas-2026']);
    assert.match(SEARCH_SOURCE, /item\.seriesId === "agrosamas"/);
    assert.match(EVENT_SUMMARY_SOURCE, /url: "\/agrosamas"/);
});

test('real search ranking sends the series name to the hub and edition queries to 2026', () => {
    const { results, search } = searchUiHarness();
    assert.equal(renderedSearchUrls(search, results, 'AgroSamas')[0], '/agrosamas');
    assert.equal(renderedSearchUrls(search, results, '5º AgroSamas')[0], '/agrosamas-2026');
    assert.equal(renderedSearchUrls(search, results, 'AgroSamas 2026')[0], '/agrosamas-2026');
});

test('sitemap contains both AgroSamas canonicals exactly once', () => {
    assert.equal(count(SITEMAP_SOURCE, /<loc>https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/agrosamas<\/loc>/g), 1);
    assert.equal(count(SITEMAP_SOURCE, /<loc>https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/agrosamas-2026<\/loc>/g), 1);
});

test('not-yet-announced and legacy content stays out of public copy without blocking the edition', () => {
    const publicPages = HUB_SOURCE + '\n' + EDITION_SOURCE;
    assert.doesNotMatch(publicPages, /entrada gratuita|estacionamento|bloqueio|parque dos dinossauros|show nacional/i);
    assert.doesNotMatch(publicPages, /images\/empreendimentos\/agrosamas|agrosamas-publico-show-noturno/i);
    assert.doesNotMatch(HUB_SOURCE, /expositores confirmados|4º AgroSamas|2025/i);
    assert.match(EDITION_SCRIPT, /Programação será atualizada após a definição da nova data/i);
    assert.doesNotMatch(publicPages, /PENDING|FAIL-CLOSED|NOT_YET_ANNOUNCED|CONFIRMED/);
});

test('hub and edition each render the official logo once and expose it for social sharing', () => {
    for (const source of [HUB_SOURCE, EDITION_SOURCE]) {
        assert.equal(count(source, /<img[^>]+data-agrosamas-logo/g), 1);
        assert.match(source, /data-agrosamas-logo src="images\/agrosamas\/2026\/logo-5-agrosamas\.png" width="1287" height="1222"/);
        assert.match(source, /property="og:image" content="https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/images\/agrosamas\/2026\/logo-5-agrosamas\.png"/);
    }
});

test('hub reuses the approved visual family and legacy banner CSS is removed', () => {
    assert.match(HUB_SOURCE, /css\/agrosamas-2026\.css\?v=agro-postponed-20260924/);
    assert.match(HUB_SOURCE, /css\/agrosamas\.css\?v=agro-postponed-20260924/);
    assert.match(HUB_STYLES, /@media \(max-width: 1050px\)/);
    assert.match(HUB_STYLES, /@media \(max-width: 820px\)/);
    assert.match(HUB_STYLES, /@media \(max-width: 560px\)/);
    assert.match(HUB_STYLES, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(HUB_STYLES, /body\.high-contrast/);
    assert.doesNotMatch(INDEX_STYLES, /\.agrosamas-banner|\.agrosamas-close|\.agrosamas-hidden/);
});
