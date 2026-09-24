import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function read(relativePath) {
    return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

const CONTRACT_SOURCE = read('js/data/agrosamas.js');
const PAGE_SOURCE = read('agrosamas-2026.html');
const PAGE_SCRIPT = read('js/agrosamas-2026.js');
const PAGE_STYLES = read('css/agrosamas-2026.css');
const TEMPORAL_HARNESS = read('tests/fixtures/agrosamas-2026-temporal-harness.html');

class FakeClassList {
    constructor() { this.values = new Set(); }
    add(value) { this.values.add(value); }
    contains(value) { return this.values.has(value); }
}

class FakeElement {
    constructor(tagName = 'div') {
        this.tagName = String(tagName).toUpperCase();
        this.attributes = new Map();
        this.children = [];
        this.classList = new FakeClassList();
        this.className = '';
        this.disabled = false;
        this.hidden = false;
        this.removed = false;
        this.listeners = new Map();
        this.tabIndex = 0;
        this._textContent = '';
    }

    get textContent() {
        return this._textContent + this.children.map(child => child.textContent || '').join('');
    }

    set textContent(value) {
        this._textContent = String(value);
        this.children = [];
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    replaceChildren(...children) {
        this._textContent = '';
        this.children = children;
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
    }

    getAttribute(name) {
        return this.attributes.has(name) ? this.attributes.get(name) : null;
    }

    removeAttribute(name) {
        this.attributes.delete(name);
    }

    remove() {
        this.removed = true;
    }

    addEventListener(type, listener) {
        const listeners = this.listeners.get(type) || [];
        listeners.push(listener);
        this.listeners.set(type, listeners);
    }

    focus() {}

    click() {
        (this.listeners.get('click') || []).forEach(listener => listener({ currentTarget: this }));
    }
}

function browserHarness() {
    const selectors = new Map();
    const body = new FakeElement('body');
    const document = {
        body,
        readyState: 'loading',
        title: '',
        createElement(tagName) { return new FakeElement(tagName); },
        addEventListener() {},
        querySelector(selector) {
            const matches = selectors.get(selector) || [];
            return matches[0] || null;
        },
        querySelectorAll(selector) {
            return selectors.get(selector) || [];
        }
    };

    function register(selector, count = 1, tagName = 'div') {
        const elements = Array.from({ length: count }, () => new FakeElement(tagName));
        selectors.set(selector, elements);
        return count === 1 ? elements[0] : elements;
    }

    const elements = {
        heroKicker: register('[data-temporal-hero-kicker]'),
        heroLead: register('[data-temporal-hero-lead]'),
        status: register('[data-temporal-status]'),
        primaryAction: register('[data-temporal-primary-action]', 1, 'a'),
        countdown: register('[data-countdown]'),
        countdownValues: register('[data-countdown-values]'),
        countdownDays: register('[data-countdown-days]'),
        countdownHours: register('[data-countdown-hours]'),
        countdownMinutes: register('[data-countdown-minutes]'),
        countdownAccessible: register('[data-countdown-accessible]'),
        programDays: register('[data-program-days]'),
        programContent: register('[data-program-content]'),
        programAvailability: register('[data-program-availability]'),
        eventSchema: register('#agrosamas-event-schema', 1, 'script')
    };

    const context = vm.createContext({
        console,
        Date,
        Intl,
        document,
        setInterval() { return 1; },
        clearInterval() {}
    });
    vm.runInContext(CONTRACT_SOURCE, context, { filename: 'js/data/agrosamas.js' });
    vm.runInContext(PAGE_SCRIPT, context, { filename: 'js/agrosamas-2026.js' });
    return { context, document, elements };
}

test('physical edition route loads the canonical contract before its page controller', () => {
    assert.match(PAGE_SOURCE, /<link rel="canonical" href="https:\/\/turismo\.saomateusdosul\.pr\.gov\.br\/agrosamas-2026">/);
    const contractIndex = PAGE_SOURCE.indexOf('js/data/agrosamas.js?v=agro-postponed-20260924');
    const bindingsIndex = PAGE_SOURCE.indexOf('js/agrosamas-contract-bindings.js?v=agro-postponed-20260924');
    const pageIndex = PAGE_SOURCE.indexOf('js/agrosamas-2026.js?v=agro-postponed-20260924');
    assert.ok(contractIndex > -1);
    assert.ok(bindingsIndex > contractIndex);
    assert.ok(pageIndex > bindingsIndex);
    assert.match(PAGE_SCRIPT, /contractApi\.resolveTemporalState\(reference\)/);
    assert.match(PAGE_SCRIPT, /contractApi\.getPublicProgramming\(/);
});

test('hero and practical facts use contract bindings instead of copied date boundaries', () => {
    assert.doesNotMatch(PAGE_SOURCE + PAGE_SCRIPT, /2026-09-18|2026-09-21/);
    assert.match(PAGE_SOURCE, /data-agro-start-day/);
    assert.match(PAGE_SOURCE, /data-agro-end-day/);
    assert.match(PAGE_SOURCE, /data-agrosamas-bind="month"/);
    assert.match(PAGE_SOURCE, /data-agrosamas-bind="year"/);
    assert.match(PAGE_SOURCE, /data-agro-location-scope/);
    assert.match(PAGE_SOURCE, /data-agro-location-link/);
    assert.match(PAGE_SCRIPT, /edition\.location\.route/);
});

test('the page contains the complete destination journey and a route back to the permanent hub', () => {
    for (const id of ['visao-geral', 'programacao', 'universo', 'planeje', 'como-chegar', 'informacoes']) {
        assert.match(PAGE_SOURCE, new RegExp(`id="${id}"`));
    }
    for (const route of [
        '/onde-ficar',
        '/sabores',
        '/mapa-turistico',
        '/mapa-turistico?grupo=pontos-turisticos',
        '/mapa-turistico?grupo=roteiros',
        '/mes-polones',
        '/sabores#erva-mate',
        '/local?id=praca-rio-iguacu'
    ]) {
        assert.ok(PAGE_SOURCE.includes(`href="${route}"`), `missing destination route ${route}`);
    }
    assert.equal((PAGE_SOURCE.match(/<h1\b/g) || []).length, 1);
    assert.match(PAGE_SOURCE, /<main id="main-content"/);
    assert.match(PAGE_SOURCE, /<footer class="footer agro-footer" id="footer">/);
    assert.match(PAGE_SOURCE, /href="\/agrosamas"/);
    assert.doesNotMatch(PAGE_SOURCE, /firebase|admin-firebase/i);
});

test('visual foundation uses destination assets and the byte-identical approved event identity', () => {
    assert.match(PAGE_STYLES, /\.\.\/images\/RUA_DO_MATHE\.jpg/);
    assert.match(PAGE_SOURCE, /images\/WEBP\/RUA-DO-MATHE-_2_\.webp/);
    assert.doesNotMatch(PAGE_SOURCE + PAGE_STYLES, /images\/empreendimentos\/agrosamas|agrosamas-publico-show-noturno/i);
    assert.equal((PAGE_SOURCE.match(/<img[^>]+data-agrosamas-logo/g) || []).length, 1);
    assert.match(PAGE_SOURCE, /data-agrosamas-logo src="images\/agrosamas\/2026\/logo-5-agrosamas\.png" width="1287" height="1222"/);
    assert.doesNotMatch(PAGE_STYLES, /\.agro-title__official-logo\s*\{[^}]*\bfilter\s*:/s);
    for (const path of [
        'images/agrosamas/2026/logo-5-agrosamas.png',
        'images/RUA_DO_MATHE.jpg',
        'images/WEBP/RUA-DO-MATHE-_1_.webp',
        'images/WEBP/RUA-DO-MATHE-_2_.webp',
        'images/rotas/rota-sabores-memorias.webp',
        'images/praca_rio_iguacu.jpg',
        'images/PONTE_SOB_O_RIO_IGUACU.jpg'
    ]) {
        assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, `missing asset ${path}`);
    }
    const logoBytes = readFileSync(new URL('../images/agrosamas/2026/logo-5-agrosamas.png', import.meta.url));
    assert.equal(createHash('sha256').update(logoBytes).digest('hex'), '5ceb3d4ffba413d88f2e157d8202916f206c049c04bdb505ee5629043990b839');
});

test('postponement remains visible before, during and after the former dates without countdown or scheduled Event schema', () => {
    const { context, document, elements } = browserHarness();
    const page = context.AgroSamas2026Page;
    assert.equal(page.renderContractBasics(), true);
    assert.equal(elements.eventSchema.removed, true);
    assert.match(document.title, /5º AgroSamas adiado/);

    for (const instant of ['2026-09-17T23:00:00-03:00', '2026-09-18T12:00:00-03:00', '2026-09-22T00:00:00-03:00']) {
        assert.equal(page.renderTemporalState(instant), context.AgroSamasContract.TEMPORAL_STATE.POSTPONED);
        assert.equal(document.body.getAttribute('data-agro-temporal-state'), 'POSTPONED');
        assert.equal(elements.countdown.hidden, true);
        assert.match(elements.heroKicker.textContent, /EVENTO ADIADO/);
        assert.match(elements.status.textContent, /adiado.*nova data ainda não definida/);
        assert.doesNotMatch(elements.countdownAccessible.textContent, /Faltam/);
    }
    assert.equal(elements.primaryAction.getAttribute('href'), '#programacao');
});

test('postponed edition presents an undated programming update and no old day tabs', () => {
    const { context, elements } = browserHarness();
    const programming = context.AgroSamas2026Page.renderProgramming();

    assert.equal(programming.availability, 'UNAVAILABLE');
    assert.equal(programming.items.length, 0);
    assert.equal(elements.programDays.children.length, 0);
    assert.match(elements.programContent.textContent, /Programação será atualizada após a definição da nova data/);
    assert.match(elements.programContent.textContent, /nova data ainda não foi definida/);
    assert.doesNotMatch(elements.programContent.textContent, /20 SET|Roupa Nova|2026-09-20/);
    assert.equal(elements.programAvailability.textContent, 'Evento adiado');
});

test('a supplied old-date attraction cannot be republished while the edition is postponed', () => {
    const { context, elements } = browserHarness();
    const edition = context.AgroSamasContract.contract.edition;
    const date = edition.originalSchedule.startDate;
    context.AgroSamas2026Page.renderTemporalState(date + 'T12:00:00-03:00');
    const programming = context.AgroSamas2026Page.renderProgramming({
        availability: 'PARTIAL',
        fallbackKey: edition.programming.fallbackKey,
        items: [{
            id: 'confirmed-test-item',
            seriesId: edition.seriesId,
            editionId: edition.id,
            date,
            contentStatus: 'CONFIRMED',
            title: 'Atração confirmada',
            time: '19:00',
            venue: 'Palco confirmado',
            category: 'Música',
            featured: true,
            source: edition.officialUrl
        }]
    });

    assert.equal(programming.availability, 'UNAVAILABLE');
    assert.equal(programming.items.length, 0);
    assert.equal(elements.programDays.children.length, 0);
    assert.doesNotMatch(elements.programContent.textContent, /19:00|Atração confirmada|Palco confirmado|Música/);
    assert.match(elements.programContent.textContent, /Programação será atualizada/);
});

test('accessibility, responsive and reduced-motion contracts are explicit', () => {
    assert.match(PAGE_SOURCE, /role="timer" aria-live="off"/);
    assert.match(PAGE_SOURCE, /role="tablist" aria-label="Dias do AgroSamas"/);
    assert.match(PAGE_SCRIPT, /ArrowRight/);
    assert.match(PAGE_SCRIPT, /ArrowLeft/);
    assert.match(PAGE_STYLES, /@media \(max-width: 1050px\)/);
    assert.match(PAGE_STYLES, /@media \(max-width: 820px\)/);
    assert.match(PAGE_STYLES, /@media \(max-width: 560px\)/);
    assert.match(PAGE_STYLES, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(PAGE_STYLES, /body\.high-contrast/);
    assert.match(PAGE_STYLES, /\.agro-local-nav \{[\s\S]*?z-index: 9000/);
});

test('visual temporal harness derives PRE, LIVE and POST instants from the loaded contract', () => {
    assert.match(TEMPORAL_HARNESS, /edition\.temporal\.liveStartAt/);
    assert.match(TEMPORAL_HARNESS, /edition\.temporal\.liveEndExclusiveAt/);
    assert.match(TEMPORAL_HARNESS, /pageApi\.renderTemporalState\(contractInstant/);
    assert.match(TEMPORAL_HARNESS, /data-state="PRE_EVENT"/);
    assert.match(TEMPORAL_HARNESS, /data-state="EVENT_LIVE"/);
    assert.match(TEMPORAL_HARNESS, /data-state="POST_EVENT"/);
    assert.doesNotMatch(TEMPORAL_HARNESS, /return new Date|2026-09-18|2026-09-21|localStorage|sessionStorage/);
});
