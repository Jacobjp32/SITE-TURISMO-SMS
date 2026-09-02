import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const ADAPTER_SOURCE = readFileSync(new URL('../js/event-occurrence-adapter.js', import.meta.url), 'utf8');

await import('../js/event-occurrence-adapter.js');

const {
    RUNTIME_SOURCES,
    normalizeEventOccurrence,
    normalizePublication,
    buildRuntimeIdentity,
    buildEventSignature,
    normalizeLocationBinding
} = globalThis.EventOccurrenceAdapter;

function normalize(rawEvent, runtimeSource, sourceId, extraOptions = {}) {
    return normalizeEventOccurrence(rawEvent, { runtimeSource, sourceId, ...extraOptions });
}

test('runtime identities preserve source namespace and sourceId', () => {
    const annual = normalize({ titulo: 'Anual', data: '2026-01-10' }, RUNTIME_SOURCES.ANNUAL_STATIC, 123);
    const firestore = normalize({ title: 'Remoto', date: '2026-01-10', status: 'approved' }, RUNTIME_SOURCES.FIRESTORE_APPROVED, '123');

    assert.equal(buildRuntimeIdentity(RUNTIME_SOURCES.ANNUAL_STATIC, 123), 'annual:123');
    assert.equal(buildRuntimeIdentity(RUNTIME_SOURCES.FIRESTORE_APPROVED, '123'), 'firestore:123');
    assert.equal(annual.runtimeId, 'annual:123');
    assert.equal(annual.sourceId, '123');
    assert.equal(annual.occurrenceId, '123');
    assert.equal(firestore.runtimeId, 'firestore:123');
    assert.equal(firestore.sourceId, '123');
    assert.equal(Object.hasOwn(firestore, 'occurrenceId'), false);
});

test('preexisting global namespace is never overwritten', () => {
    const sentinel = Object.freeze({ sentinel: true });
    const context = vm.createContext({ EventOccurrenceAdapter: sentinel });

    assert.throws(
        () => vm.runInContext(ADAPTER_SOURCE, context, { filename: 'js/event-occurrence-adapter.js' }),
        /\[EventOccurrenceAdapter\] global namespace already registered/
    );
    assert.strictEqual(context.EventOccurrenceAdapter, sentinel);

    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'EventOccurrenceAdapter');
    assert.equal(Object.isFrozen(globalThis.EventOccurrenceAdapter), true);
    assert.equal(descriptor.writable, false);
    assert.equal(descriptor.configurable, false);
});

test('unknown runtime source fails closed', () => {
    assert.equal(normalize({ title: 'Evento' }, 'UNKNOWN', '1'), null);
    assert.equal(normalizePublication({ status: 'approved' }, 'UNKNOWN'), false);
});

test('canonical aliases have deterministic precedence', () => {
    const event = normalize({
        title: 'Title', nome: 'Nome', titulo: 'Título',
        date: '2026-01-01', data: '2026-01-02', dataInicio: '2026-01-03', startDate: '2026-01-04', inicio: '2026-01-05',
        time: '10h', hora: '11h', horario: '12h', horaInicio: '13h',
        location: 'Location', local: 'Local', localNome: 'Local Nome', venue: 'Venue',
        establishmentName: 'Estabelecimento', linkedEstablishmentName: 'Vinculado',
        organizer: 'Organizer', organizador: 'Organizador', ownerName: 'Owner'
    }, RUNTIME_SOURCES.ANNUAL_STATIC, 'aliases');

    assert.equal(event.title, 'Title');
    assert.equal(event.date, '2026-01-01');
    assert.equal(event.time, '10h');
    assert.equal(event.rawLocationText, 'Location');
    assert.deepEqual(event.metadata.matchedAliases, {
        title: 'title', date: 'date', time: 'time', location: 'location'
    });
});

test('legacy aliases remain accepted without inventing missing values', () => {
    const event = normalize({
        titulo: 'Título legado', inicio: '2026-02-03', horaInicio: '18h', ownerName: 'Responsável'
    }, RUNTIME_SOURCES.ANNUAL_STATIC, 'legacy');

    assert.equal(event.title, 'Título legado');
    assert.equal(event.date, '2026-02-03');
    assert.equal(event.time, '18h');
    assert.equal(event.rawLocationText, 'Responsável');
    assert.equal(event.locationBinding.type, 'TEXT_ONLY');
});

test('publication truth table is fail closed for Firestore and implicit for annual', async (t) => {
    const cases = [
        ['approved + true', { status: 'approved', publicado: true }, true],
        ['approved + false', { status: 'approved', publicado: false }, false],
        ['approved + missing', { status: 'approved' }, true],
        ['pending + true', { status: 'pending', publicado: true }, false],
        ['pending + false', { status: 'pending', publicado: false }, false],
        ['pending + missing', { status: 'pending' }, false],
        ['rejected', { status: 'rejected', publicado: true }, false],
        ['draft', { status: 'draft', publicado: true }, false],
        ['unpublished', { status: 'unpublished', publicado: true }, false],
        ['missing status + true', { publicado: true }, true],
        ['missing status + false', { publicado: false }, false],
        ['missing status + missing', {}, false],
        ['unknown + true', { status: 'unknown', publicado: true }, false],
        ['unknown + false', { status: 'unknown', publicado: false }, false],
        ['unknown + missing', { status: 'unknown' }, false]
    ];

    for (const [name, fields, expected] of cases) {
        await t.test(name, () => {
            assert.equal(normalizePublication(fields, RUNTIME_SOURCES.FIRESTORE_APPROVED), expected);
        });
    }
    assert.equal(normalizePublication({}, RUNTIME_SOURCES.ANNUAL_STATIC), true);
});

test('validated local page becomes canonical reference', () => {
    const event = normalize({ localId: 'rua-do-mathe', local: 'Rua do Mathe' }, RUNTIME_SOURCES.ANNUAL_STATIC, 'local', {
        resolvers: { LOCAL_PAGE: id => id === 'rua-do-mathe' }
    });

    assert.deepEqual(event.locationBinding, {
        type: 'CANONICAL_REFERENCE', refType: 'LOCAL_PAGE', id: 'rua-do-mathe', text: 'Rua do Mathe'
    });
});

test('unverified legacy reference degrades to text only with diagnostics', () => {
    const event = normalize({ establishmentId: 'legacy-1', location: 'Local editorial' }, RUNTIME_SOURCES.FIRESTORE_APPROVED, 'legacy-ref');

    assert.deepEqual(event.locationBinding, { type: 'TEXT_ONLY', text: 'Local editorial' });
    assert.deepEqual(event.metadata.legacyReferenceCandidate, {
        alias: 'establishmentId', refType: 'ESTABLISHMENT', id: 'legacy-1'
    });
});

test('explicit city-wide, multiple, text-only, TBC and none states are preserved', () => {
    const baseOptions = { runtimeSource: RUNTIME_SOURCES.ANNUAL_STATIC, sourceId: 'shape' };
    assert.deepEqual(normalizeLocationBinding({ locationBinding: { type: 'CITY_WIDE', text: 'São Mateus do Sul' } }, baseOptions).binding,
        { type: 'CITY_WIDE', text: 'São Mateus do Sul' });
    assert.deepEqual(normalizeLocationBinding({ locationBinding: { type: 'MULTIPLE_LOCATIONS', ids: ['a', 'b'], text: 'Dois locais' } }, baseOptions).binding,
        { type: 'MULTIPLE_LOCATIONS', ids: ['a', 'b'], text: 'Dois locais' });
    assert.deepEqual(normalizeLocationBinding({ locationBinding: { type: 'TEXT_ONLY', text: 'Auditório' } }, baseOptions).binding,
        { type: 'TEXT_ONLY', text: 'Auditório' });
    assert.deepEqual(normalizeLocationBinding({ local: 'A confirmar' }, baseOptions).binding,
        { type: 'TO_BE_CONFIRMED', text: 'A confirmar' });
    assert.deepEqual(normalizeLocationBinding({}, baseOptions).binding, { type: 'NONE' });
});

test('seriesId is pass-through only', () => {
    const linked = normalize({ title: 'AgroSamas', seriesId: 'agrosamas' }, RUNTIME_SOURCES.ANNUAL_STATIC, 'series-1');
    const independent = normalize({ title: 'AgroSamas' }, RUNTIME_SOURCES.ANNUAL_STATIC, 'series-2');

    assert.equal(linked.seriesId, 'agrosamas');
    assert.equal(independent.seriesId, null);
});

test('exact signature changes only with exact normalized fields, without fuzzy matching', () => {
    const base = buildEventSignature({ title: ' Feira  Gastronômica ', date: '2026-03-01', time: '18h', location: 'Centro' });
    const normalizedEqual = buildEventSignature({ title: 'feira gastronômica', date: '2026-03-01', time: '18H', location: ' centro ' });

    assert.equal(base, normalizedEqual);
    assert.notEqual(base, buildEventSignature({ title: 'Feira Gastronômica Especial', date: '2026-03-01', time: '18h', location: 'Centro' }));
    assert.notEqual(base, buildEventSignature({ title: 'Feira Gastronômica', date: '2026-03-02', time: '18h', location: 'Centro' }));
    assert.notEqual(base, buildEventSignature({ title: 'Feira Gastronômica', date: '2026-03-01', time: '19h', location: 'Centro' }));
    assert.notEqual(base, buildEventSignature({ title: 'Feira Gastronômica', date: '2026-03-01', time: '18h', location: 'Parque' }));
});
