import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const EVENTOS_SOURCE = readFileSync(new URL('../js/data/eventos.js', import.meta.url), 'utf8');
const PONTOS_SOURCE = readFileSync(new URL('../js/data/pontos-turisticos.js', import.meta.url), 'utf8');
const LOCAIS_SOURCE = readFileSync(new URL('../js/locais-data.js', import.meta.url), 'utf8');
const SEARCH_SOURCE = readFileSync(new URL('../js/search-index.js', import.meta.url), 'utf8');
const MAP_SOURCE = readFileSync(new URL('../js/mapa-turistico.js', import.meta.url), 'utf8');
const CALENDAR = JSON.parse(readFileSync(new URL('../eventos-2026.json', import.meta.url), 'utf8'));

const CANONICAL_LOCATION = Object.freeze({
    id: 'rua-do-mathe',
    url: '/local?id=rua-do-mathe',
    name: 'Rua do Mathe',
    lat: -25.878,
    lng: -50.385
});

const OLD_PARK_LOCATION = Object.freeze({
    id: 'parque-exposicoes',
    url: '/local?id=parque-exposicoes',
    name: 'Parque de Exposições',
    lat: -25.88,
    lng: -50.39
});

const EXPECTED_CALENDAR_OCCURRENCES = new Map([
    [199, { date: '2026-09-18', location: 'Rua do Mathe' }],
    [200, { date: '2026-09-19', location: 'Rua do Mathe' }],
    [201, { date: '2026-09-19', location: 'Rua do Mathe' }],
    [202, { date: '2026-09-20', location: 'Rua do Mathe' }],
    [203, { date: '2026-09-21', location: 'Rua do Mathe' }]
]);

const EXPECTED_PARK_EVENTS = new Map([
    [114, { title: 'Miss Paraná Internacional', date: '2026-06-17' }],
    [142, { title: '4º Desafio Samas Run Internacional 7K', date: '2026-07-12' }],
    [230, { title: 'Samas Run Kids', date: '2026-10-11' }]
]);

function createDatasetHarness() {
    const listeners = new Map();
    const window = {
        addEventListener(type, listener) {
            listeners.set(type, listener);
        }
    };
    const context = vm.createContext({ console, window });

    vm.runInContext(EVENTOS_SOURCE, context, { filename: 'js/data/eventos.js' });
    vm.runInContext(PONTOS_SOURCE, context, { filename: 'js/data/pontos-turisticos.js' });
    vm.runInContext(LOCAIS_SOURCE, context, { filename: 'js/locais-data.js' });
    vm.runInContext(SEARCH_SOURCE, context, { filename: 'js/search-index.js' });

    return { window, listeners };
}

const harness = createDatasetHarness();
const eventSummaries = harness.window.TURISMO_EVENTOS;
const agrosamasSummaries = eventSummaries.filter(item => item.id === 'agrosamas');
const agrosamas = agrosamasSummaries[0];
const canonicalPoint = harness.window.TURISMO_PONTOS.find(item => item.id === CANONICAL_LOCATION.id);
const canonicalPlace = harness.window.locaisData[CANONICAL_LOCATION.id];

test('exactlyOneAgrosamasSummary=true', () => {
    assert.equal(agrosamasSummaries.length, 1);
});

test('AgroSamasCanonicalLocationCorrect=true', () => {
    assert.equal(agrosamas.localId, CANONICAL_LOCATION.id);
    assert.equal(agrosamas.localUrl, CANONICAL_LOCATION.url);
    assert.equal(agrosamas.local, CANONICAL_LOCATION.name);
    assert.equal(agrosamas.coordenadas.lat, CANONICAL_LOCATION.lat);
    assert.equal(agrosamas.coordenadas.lng, CANONICAL_LOCATION.lng);
});

test('wrongParkAssociationRemoved=true', () => {
    assert.notEqual(agrosamas.localId, OLD_PARK_LOCATION.id);
    assert.notEqual(agrosamas.localUrl, OLD_PARK_LOCATION.url);
    assert.notEqual(agrosamas.local, OLD_PARK_LOCATION.name);
    assert.notDeepEqual(
        { lat: agrosamas.coordenadas.lat, lng: agrosamas.coordenadas.lng },
        { lat: OLD_PARK_LOCATION.lat, lng: OLD_PARK_LOCATION.lng }
    );
});

test('correctPlaceRelationshipResolved=true', () => {
    assert.ok(canonicalPoint);
    assert.ok(canonicalPlace);
    assert.equal(canonicalPoint.nome, CANONICAL_LOCATION.name);
    assert.equal(canonicalPoint.url, CANONICAL_LOCATION.url);
    assert.equal(canonicalPlace.nome, CANONICAL_LOCATION.name);
    assert.equal(`/local?id=${canonicalPlace.id}`, CANONICAL_LOCATION.url);
});

test('crossSourceCoordinateMatch=true', () => {
    assert.equal(agrosamas.coordenadas.lat, canonicalPoint.coordenadas.lat);
    assert.equal(agrosamas.coordenadas.lng, canonicalPoint.coordenadas.lng);
    assert.equal(agrosamas.coordenadas.lat, canonicalPlace.lat);
    assert.equal(agrosamas.coordenadas.lng, canonicalPlace.lng);
});

test('searchUsesCorrectLocation=true', () => {
    const entries = harness.window.TURISMO_SEARCH_INDEX.filter(entry => (
        entry.category === 'Agenda' && entry.title === 'AgroSamas'
    ));
    assert.equal(entries.length, 1);
    assert.ok(entries[0].keywords.includes(CANONICAL_LOCATION.name));
    assert.ok(!entries[0].keywords.includes(OLD_PARK_LOCATION.name));
});

test('mapUsesCorrectLocation=true', () => {
    assert.equal(agrosamas.local, CANONICAL_LOCATION.name);
    assert.equal(agrosamas.localId, CANONICAL_LOCATION.id);
    assert.equal(agrosamas.localUrl, CANONICAL_LOCATION.url);
    assert.equal(agrosamas.coordenadas.lat, CANONICAL_LOCATION.lat);
    assert.equal(agrosamas.coordenadas.lng, CANONICAL_LOCATION.lng);

    assert.match(MAP_SOURCE, /item\.coordenadas \? item\.coordenadas\.lat/);
    assert.match(MAP_SOURCE, /item\.coordenadas \? item\.coordenadas\.lng/);
    assert.match(MAP_SOURCE, /localId: item\.localId \|\| item\.placeId/);
    assert.match(MAP_SOURCE, /localUrl: item\.localUrl \|\| item\.localDetailUrl/);
    assert.match(MAP_SOURCE, /item\.localizacao \|\| item\.local \|\| item\.endereco/);
});

test('otherEventsUsingParquePreserved=true', () => {
    for (const [id, expected] of EXPECTED_PARK_EVENTS) {
        const matches = CALENDAR.filter(item => item.id === id);
        assert.equal(matches.length, 1, `calendar event ${id}`);
        assert.equal(matches[0].titulo, expected.title, `title ${id}`);
        assert.equal(matches[0].data, expected.date, `date ${id}`);
        assert.equal(matches[0].local, OLD_PARK_LOCATION.name, `location ${id}`);
    }
});

test('calendarOccurrencesPreserved=true; datesPreserved=true; duplicateCalendarIds=0', () => {
    const calendarIds = CALENDAR.map(item => item.id);
    assert.equal(new Set(calendarIds).size, calendarIds.length);

    for (const [id, expected] of EXPECTED_CALENDAR_OCCURRENCES) {
        const matches = CALENDAR.filter(item => item.id === id);
        assert.equal(matches.length, 1, `AgroSamas occurrence ${id}`);
        assert.equal(matches[0].data, expected.date, `date ${id}`);
        assert.equal(matches[0].local, expected.location, `location ${id}`);
        assert.match(matches[0].titulo, /AgroSamas/);
    }
});

test('eventIdentityPreserved=true', () => {
    assert.equal(agrosamas.id, 'agrosamas');
    assert.equal(agrosamas.nome, 'AgroSamas');
    assert.equal(agrosamas.url, '/eventos');
    assert.equal(agrosamas.categoria, 'Eventos');
    assert.equal(agrosamas.periodo, 'Setembro');
    assert.equal(agrosamas.recorrencia, 'anual');
});

test('noDuplicateEventIntroduced=true', () => {
    assert.equal(eventSummaries.filter(item => item.id === 'agrosamas').length, 1);
});
