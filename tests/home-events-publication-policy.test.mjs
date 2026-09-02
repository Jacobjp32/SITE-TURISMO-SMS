import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const HOME_SOURCE = readFileSync(new URL('../js/home-eventos.js', import.meta.url), 'utf8');
const ADAPTER_SOURCE = readFileSync(new URL('../js/event-occurrence-adapter.js', import.meta.url), 'utf8');
let harnessSequence = 0;

function annualEvent(overrides = {}) {
    return {
        id: 'annual-test',
        titulo: 'Evento anual',
        data: '2099-09-10',
        horario: '19h',
        local: 'Centro',
        ...overrides
    };
}

function firestoreEvent(overrides = {}) {
    return {
        title: 'Evento Firestore',
        date: '2099-09-10',
        time: '19h',
        location: 'Centro',
        ...overrides
    };
}

function firestoreDoc(id, data) {
    return { id, data: () => data };
}

function extractCards(html) {
    return [...html.matchAll(/<article class="home-event-card" data-event-id="([^"]*)">[\s\S]*?<h3>([^<]*)<\/h3>/g)]
        .map(match => ({ id: match[1], title: match[2] }));
}

async function runHome({ annual = [], docs = [], source = HOME_SOURCE, adapterSource = ADAPTER_SOURCE } = {}) {
    const renders = [];
    const listeners = new Map();
    const container = {
        get innerHTML() { return renders.at(-1) || ''; },
        set innerHTML(value) { renders.push(String(value)); }
    };
    const document = {
        addEventListener(type, listener) { listeners.set(type, listener); },
        getElementById(id) { return id === 'proximosEventosHome' ? container : null; }
    };
    const window = {
        CONFIG: { firebase: { projectId: 'offline-publication-policy-test' } },
        __firebaseAppModule: {
            getApps: () => [],
            initializeApp: () => ({ name: 'home-eventos' })
        },
        __firestoreModule: {
            getFirestore: () => ({}),
            collection: () => ({}),
            getDocs: async () => ({ empty: docs.length === 0, docs })
        },
        __appCheckModule: {
            initModularAppCheck: async () => {}
        }
    };
    const executableSource = source
        .replace("import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js')", 'Promise.resolve(window.__firebaseAppModule)')
        .replace("import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')", 'Promise.resolve(window.__firestoreModule)')
        .replace("import('./firebase-app-check.js')", 'Promise.resolve(window.__appCheckModule)');
    harnessSequence += 1;

    const context = vm.createContext({
        console: { log() {}, warn() {}, error() {} },
        document,
        fetch: async () => ({ json: async () => annual }),
        localStorage: { getItem() { return null; } },
        window
    });
    vm.runInContext(adapterSource, context, { filename: 'js/event-occurrence-adapter.js' });
    window.EventOccurrenceAdapter = context.EventOccurrenceAdapter;
    vm.runInContext(executableSource, context, { filename: `js/home-eventos.js#policy-${harnessSequence}` });
    await listeners.get('DOMContentLoaded')();

    return { cards: extractCards(renders.at(-1) || ''), renders };
}

async function assertFirestoreEligibility(fields, expected, adapterSource = ADAPTER_SOURCE, message = '') {
    const result = await runHome({
        docs: [firestoreDoc('policy-candidate', firestoreEvent(fields))],
        adapterSource
    });
    assert.equal(result.cards.length === 1, expected, message);
}

function replaceOnce(source, original, replacement) {
    assert.equal(source.split(original).length - 1, 1, `mutation target must occur once: ${original}`);
    return source.replace(original, replacement);
}

test('annual source remains public without status or publicado', async () => {
    const event = annualEvent();
    assert.equal(Object.hasOwn(event, 'status'), false);
    assert.equal(Object.hasOwn(event, 'publicado'), false);

    const result = await runHome({ annual: [event] });
    assert.deepEqual(result.cards, [{ id: 'annual:annual-test', title: 'Evento anual' }]);
});

test('canonical publication truth table controls real Home rendering', async (t) => {
    const cases = [
        ['approved + true', { status: 'approved', publicado: true }, true],
        ['aprovado + true', { status: 'aprovado', publicado: true }, true],
        ['approved + false', { status: 'approved', publicado: false }, false],
        ['aprovado + false', { status: 'aprovado', publicado: false }, false],
        ['approved + absent', { status: 'approved' }, true],
        ['aprovado + absent', { status: 'aprovado' }, true],
        ['pending + true', { status: 'pending', publicado: true }, false],
        ['pendente + true', { status: 'pendente', publicado: true }, false],
        ['rejected + true', { status: 'rejected', publicado: true }, false],
        ['rejeitado + true', { status: 'rejeitado', publicado: true }, false],
        ['draft + true', { status: 'draft', publicado: true }, false],
        ['rascunho + true', { status: 'rascunho', publicado: true }, false],
        ['unpublished + true', { status: 'unpublished', publicado: true }, false],
        ['despublicado + true', { status: 'despublicado', publicado: true }, false],
        ['status absent + true', { publicado: true }, true],
        ['status absent + false', { publicado: false }, false],
        ['status absent + publicado absent', {}, false],
        ['unknown + true', { status: 'unknown', publicado: true }, false],
        ['unknown + absent', { status: 'unknown' }, false]
    ];

    for (const [name, fields, expected] of cases) {
        await t.test(name, () => assertFirestoreEligibility(fields, expected, ADAPTER_SOURCE, name));
    }
});

test('audited production combinations remain eligible without real document IDs', async () => {
    const auditedCombinations = [
        ...Array.from({ length: 7 }, () => ({ status: 'aprovado', publicado: true })),
        ...Array.from({ length: 3 }, () => ({ status: 'aprovado' }))
    ];
    let eligibleCount = 0;

    for (const fields of auditedCombinations) {
        const result = await runHome({
            docs: [firestoreDoc('sanitized-audit-candidate', firestoreEvent(fields))]
        });
        eligibleCount += Number(result.cards.length === 1);
    }

    assert.equal(eligibleCount, 10);
});

async function assertMutationSentinel(adapterSource) {
    await assertFirestoreEligibility({ status: 'aprovado', publicado: false }, false, adapterSource, 'publicado=false veto');
    await assertFirestoreEligibility({ status: 'pending', publicado: true }, false, adapterSource, 'pending blocked');
    await assertFirestoreEligibility({ status: 'draft', publicado: true }, false, adapterSource, 'draft blocked');
    await assertFirestoreEligibility({ status: 'unpublished', publicado: true }, false, adapterSource, 'unpublished blocked');
    await assertFirestoreEligibility({ status: 'unknown', publicado: true }, false, adapterSource, 'unknown fails closed');
    await assertFirestoreEligibility({}, false, adapterSource, 'missing publication fields fail closed');
}

test('all six required publication-policy mutations are detected', async (t) => {
    const mutations = [
        ['removePublicadoFalseVeto', 'if (rawEvent.publicado === false) return false;', 'if (false) return false;'],
        [
            'allowPendingWhenPublicadoTrue',
            'if (BLOCKED_STATUSES.has(status)) return false;',
            "if (BLOCKED_STATUSES.has(status) && status !== 'pending') return false;\n        if (status === 'pending') return true;"
        ],
        [
            'allowDraftWhenPublicadoTrue',
            'if (BLOCKED_STATUSES.has(status)) return false;',
            "if (BLOCKED_STATUSES.has(status) && status !== 'draft') return false;\n        if (status === 'draft') return true;"
        ],
        [
            'allowUnpublishedWhenPublicadoTrue',
            'if (BLOCKED_STATUSES.has(status)) return false;',
            "if (BLOCKED_STATUSES.has(status) && status !== 'unpublished') return false;\n        if (status === 'unpublished') return true;"
        ],
        [
            'allowUnknownStatusWhenPublicadoTrue',
            'return !status && rawEvent.publicado === true;',
            'return rawEvent.publicado === true;'
        ],
        [
            'allowMissingStatusMissingPublicado',
            'return !status && rawEvent.publicado === true;',
            'return !status && rawEvent.publicado !== false;'
        ]
    ];

    for (const [name, original, replacement] of mutations) {
        await t.test(name, async () => {
            const mutant = replaceOnce(ADAPTER_SOURCE, original, replacement);
            await assert.rejects(() => assertMutationSentinel(mutant));
        });
    }
});
