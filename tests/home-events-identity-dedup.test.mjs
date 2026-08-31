import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const HOME_SOURCE = readFileSync(new URL('../js/home-eventos.js', import.meta.url), 'utf8');
let harnessSequence = 0;

function event(overrides = {}) {
    return {
        titulo: 'Evento de teste',
        data: '2099-09-10',
        horario: '19h',
        local: 'Centro',
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

async function runHome({ annual = [], docs = [], source = HOME_SOURCE } = {}) {
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
        CONFIG: { firebase: { projectId: 'offline-test' } },
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
    const logs = { log() {}, warn() {}, error() {} };
    const localStorage = { getItem() { return null; } };
    const executableSource = source
        .replace("import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js')", 'Promise.resolve(window.__firebaseAppModule)')
        .replace("import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')", 'Promise.resolve(window.__firestoreModule)')
        .replace("import('./firebase-app-check.js')", 'Promise.resolve(window.__appCheckModule)');
    harnessSequence += 1;

    const context = vm.createContext({
        console: logs,
        document,
        fetch: async () => ({ json: async () => annual }),
        localStorage,
        window
    });
    vm.runInContext(executableSource, context, { filename: `js/home-eventos.js#${harnessSequence}` });
    await listeners.get('DOMContentLoaded')();

    return { cards: extractCards(renders.at(-1) || ''), renders };
}

test('same Firestore document keeps identity regardless of query ordering', async () => {
    const target = firestoreDoc('abc123', event({ title: 'Documento alvo' }));
    const filler = firestoreDoc('other', event({ title: 'Outro documento', date: '2099-09-11' }));
    const first = await runHome({ docs: [target, filler] });
    const second = await runHome({ docs: [filler, target] });

    assert.equal(first.cards.find(card => card.title === 'Documento alvo').id, 'firestore:abc123');
    assert.equal(second.cards.find(card => card.title === 'Documento alvo').id, 'firestore:abc123');
});

test('annual and Firestore equal source IDs do not collide', async () => {
    const result = await runHome({
        annual: [event({ id: 123, titulo: 'Ocorrência anual' })],
        docs: [firestoreDoc('123', event({ title: 'Ocorrência Firestore', date: '2099-09-11' }))]
    });

    assert.deepEqual(result.cards.map(card => card.id), ['annual:123', 'firestore:123']);
});

test('same Firestore document is deduplicated by identity', async () => {
    const result = await runHome({ docs: [
        firestoreDoc('duplicate-doc', event({ title: 'Primeira versão', time: '18h' })),
        firestoreDoc('duplicate-doc', event({ title: 'Segunda versão', time: '20h' }))
    ] });

    assert.equal(result.cards.length, 1);
    assert.equal(result.cards[0].id, 'firestore:duplicate-doc');
    assert.equal(result.cards[0].title, 'Primeira versão');
});

test('annual event wins exact signature duplicate from Firestore', async () => {
    const result = await runHome({
        annual: [event({ id: 77, titulo: 'Assinatura exata' })],
        docs: [firestoreDoc('remote-copy', event({ title: 'Assinatura exata' }))]
    });

    assert.deepEqual(result.cards, [{ id: 'annual:77', title: 'Assinatura exata' }]);
});

test('similar titles with distinct signatures remain separate', async () => {
    const result = await runHome({ docs: [
        firestoreDoc('base', event({ title: 'Feira Gastronômica' })),
        firestoreDoc('special', event({ title: 'Feira Gastronômica Especial' }))
    ] });

    assert.equal(result.cards.length, 2);
});

test('canonical fields take precedence over aliases', async () => {
    const result = await runHome({ docs: [firestoreDoc('canonical', {
        title: 'Título Canônico',
        nome: 'Título Legado',
        date: '2099-09-10',
        data: '2099-09-11',
        time: '20h',
        hora: '21h',
        location: 'Local Canônico',
        local: 'Local Legado'
    })] });
    const html = result.renders.at(-1);

    assert.equal(result.cards[0].title, 'Título Canônico');
    assert.match(html, /<strong>10<\/strong>/);
    assert.match(html, /20h/);
    assert.match(html, /Local Canônico/);
    assert.doesNotMatch(html, /Título Legado|21h|Local Legado/);
});

test('legacy title, date, time and location aliases remain supported', async () => {
    const result = await runHome({ docs: [firestoreDoc('legacy', {
        titulo: 'Título Legado',
        dataInicio: '2099-09-12',
        horario: '18h30',
        localNome: 'Local Legado'
    })] });
    const html = result.renders.at(-1);

    assert.equal(result.cards[0].title, 'Título Legado');
    assert.match(html, /<strong>12<\/strong>/);
    assert.match(html, /18h30/);
    assert.match(html, /Local Legado/);
});

test('home keeps maximum of four event cards', async () => {
    const docs = Array.from({ length: 6 }, (_, index) => firestoreDoc(
        `doc-${index}`,
        event({ title: `Evento ${index}`, date: `2099-09-${String(10 + index).padStart(2, '0')}` })
    ));
    const result = await runHome({ docs });

    assert.equal(result.cards.length, 4);
});

test('unique events fill slots before recurring events', async () => {
    const annual = [
        event({ id: 1, titulo: 'Recorrente mantido', data: '2099-09-01', recorrente: true }),
        event({ id: 2, titulo: 'Recorrente excedente', data: '2099-09-02', recorrente: true }),
        event({ id: 3, titulo: 'Único A', data: '2099-09-10' }),
        event({ id: 4, titulo: 'Único B', data: '2099-09-11' }),
        event({ id: 5, titulo: 'Único C', data: '2099-09-12' })
    ];
    const result = await runHome({ annual });
    const titles = result.cards.map(card => card.title);

    assert.equal(result.cards.length, 4);
    assert.ok(titles.includes('Recorrente mantido'));
    assert.ok(!titles.includes('Recorrente excedente'));
    assert.ok(titles.includes('Único A'));
    assert.ok(titles.includes('Único B'));
    assert.ok(titles.includes('Único C'));
});

test('focused suite detects the four requested behavioral mutations', async () => {
    const syntheticIdentitySource = HOME_SOURCE
        .replace('snap.docs.map((d) =>', 'snap.docs.map((d, i) =>')
        .replace("id: 'firestore:' + documentId", 'id: 90000 + i');
    const syntheticResult = await runHome({
        docs: [firestoreDoc('abc123', event({ title: 'Mutação sintética' }))],
        source: syntheticIdentitySource
    });
    assert.notEqual(syntheticResult.cards[0].id, 'firestore:abc123');

    const namespaceRemovedSource = HOME_SOURCE.replace("id: 'firestore:' + documentId", 'id: documentId');
    const namespaceResult = await runHome({
        annual: [event({ id: 123, titulo: 'Anual' })],
        docs: [firestoreDoc('123', event({ title: 'Firestore', date: '2099-09-11' }))],
        source: namespaceRemovedSource
    });
    assert.notEqual(
        namespaceResult.cards.find(card => card.title === 'Firestore').id,
        'firestore:123'
    );

    const identityDedupDisabledSource = HOME_SOURCE.replace(
        'if (identidade && identidades.has(identidade)) return false;',
        'if (false) return false;'
    );
    const identityResult = await runHome({
        docs: [
            firestoreDoc('same-doc', event({ title: 'Versão A' })),
            firestoreDoc('same-doc', event({ title: 'Versão B' }))
        ],
        source: identityDedupDisabledSource
    });
    assert.equal(identityResult.cards.length, 2);

    const signatureDedupDisabledSource = HOME_SOURCE.replace(
        'if (assinatura && assinaturas.has(assinatura)) return false;',
        'if (false) return false;'
    );
    const signatureResult = await runHome({
        annual: [event({ id: 1, titulo: 'Mesmo evento' })],
        docs: [firestoreDoc('copy', event({ title: 'Mesmo evento' }))],
        source: signatureDedupDisabledSource
    });
    assert.equal(signatureResult.cards.length, 2);
});
