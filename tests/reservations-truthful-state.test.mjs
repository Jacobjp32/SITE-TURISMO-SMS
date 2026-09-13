import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourceUrl = new URL('../js/reservas.js', import.meta.url);
const pageUrl = new URL('../reservas.html', import.meta.url);
const browserFixtureUrl = new URL('./fixtures/reservations-browser-qa.html', import.meta.url);

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

async function createHarness(initialStorage = {}) {
    const storage = new Map(Object.entries(initialStorage));
    const storageWrites = [];
    const consoleCalls = [];
    const openedUrls = [];
    let confirmationCalls = 0;
    let closeCalls = 0;
    let resetCalls = 0;

    const button = { disabled: false, textContent: 'Confirmar Reserva' };
    const dismissControls = [{ disabled: false }, { disabled: false }];
    const status = { className: '', textContent: '', focus() {} };
    const handoff = { hidden: true };
    const modal = { remove() { closeCalls += 1; } };
    const values = {
        'reserva-data': { value: '2099-12-20' },
        'reserva-horario': { value: '09:00' },
        'reserva-pessoas': { value: '2' },
        'reserva-nome': { value: 'Pessoa Teste' },
        'reserva-email': { value: 'teste@example.invalid' },
        'reserva-telefone': { value: '(00) 00000-0000' },
        'reserva-obs': { value: 'Fixture sintética' },
        'reserva-status': status,
        'reserva-whatsapp-handoff': handoff,
        'reserva-modal': modal
    };
    const form = {
        querySelector: () => button,
        reset() { resetCalls += 1; }
    };
    values['form-reserva'] = form;
    const document = {
        addEventListener() {},
        getElementById(id) { return values[id] || null; },
        querySelector(selector) {
            return selector === '#form-reserva button[type="submit"]' ? button : null;
        },
        querySelectorAll(selector) {
            return selector === '[data-reserva-dismiss]' ? dismissControls : [];
        },
        createElement() { return { innerHTML: '', id: '', textContent: '' }; },
        body: { appendChild() {}, style: {} },
        head: { appendChild() {} }
    };
    const fakeConsole = {
        log(...args) { consoleCalls.push(['log', args]); },
        warn(...args) { consoleCalls.push(['warn', args]); },
        error(...args) { consoleCalls.push(['error', args]); }
    };
    const localStorage = {
        getItem(key) { return storage.has(key) ? storage.get(key) : null; },
        setItem(key, value) {
            storageWrites.push([key, String(value)]);
            storage.set(key, String(value));
        },
        removeItem(key) { storage.delete(key); }
    };
    const window = {
        open(url) { openedUrls.push(url); },
        localStorage
    };
    const context = vm.createContext({
        window,
        document,
        localStorage,
        console: fakeConsole,
        CONFIG: { firebase: { projectId: 'synthetic-reservations-test' } },
        Date,
        encodeURIComponent,
        setTimeout,
        clearTimeout
    });
    const source = await readFile(sourceUrl, 'utf8');
    vm.runInContext(source, context, { filename: 'js/reservas.js' });
    const Reservas = window.Reservas;
    Reservas.config.confirmationTimeoutMs = 5;
    Reservas.mostrarConfirmacao = () => { confirmationCalls += 1; };

    return {
        Reservas, button, consoleCalls, dismissControls, form, handoff, openedUrls, status,
        storage, storageWrites,
        get closeCalls() { return closeCalls; },
        get confirmationCalls() { return confirmationCalls; },
        get resetCalls() { return resetCalls; }
    };
}

function submit(harness, experienceId = 1) {
    return harness.Reservas.submeterReserva({ preventDefault() {}, target: harness.form }, experienceId);
}

test('BACKEND_SUCCESS_IS_ONLY_SUCCESS', async () => {
    const harness = await createHarness();
    harness.Reservas.backendWriter = async () => ({ id: 'firestore-synthetic-id' });
    await submit(harness);
    assert.equal(harness.Reservas.state, 'CONFIRMED_BACKEND');
    assert.equal(harness.confirmationCalls, 1);
    assert.equal(harness.closeCalls, 1);
});

test('FIRESTORE_REJECTION_IS_NOT_SUCCESS', async () => {
    const harness = await createHarness();
    harness.Reservas.backendWriter = async () => { throw new Error('synthetic-rejection'); };
    await submit(harness);
    assert.equal(harness.Reservas.state, 'FAILED');
    assert.equal(harness.confirmationCalls, 0);
    assert.match(harness.status.textContent, /não foi possível enviar nem confirmar/i);
});

test('FALLBACK_DOES_NOT_CLAIM_RECEIPT', async () => {
    const harness = await createHarness();
    harness.Reservas.backendWriter = () => new Promise(() => {});
    await submit(harness);
    assert.equal(harness.Reservas.state, 'PENDING_HANDOFF');
    assert.match(harness.status.textContent, /não conseguimos confirmar/i);
    assert.doesNotMatch(harness.status.textContent, /(?:reserva|solicitação) (?:recebida|registrada)|sucesso/i);
    assert.equal(harness.handoff.hidden, false);
});

test('PII_IS_NOT_WRITTEN_TO_LOCALSTORAGE', async () => {
    const harness = await createHarness();
    harness.Reservas.backendWriter = async () => ({ id: 'confirmed' });
    await submit(harness);
    assert.deepEqual(harness.storageWrites, []);
    assert.equal([...harness.storage.values()].some(value => /Pessoa Teste|teste@example\.invalid|00000-0000/.test(value)), false);
});

test('LEGACY_RESERVATION_PII_STORAGE_IS_PURGED', async () => {
    const harness = await createHarness({ sms_reservas: '[{"nome":"Pessoa Teste"}]' });
    harness.Reservas.init();
    assert.equal(harness.storage.has('sms_reservas'), false);
});

test('NON_RESERVATION_LOCALSTORAGE_IS_PRESERVED', async () => {
    const harness = await createHarness({
        sms_reservas: '[{"nome":"Pessoa Teste"}]',
        sms_cookie_consent: '{"analytics":false}',
        smsLang: 'pt-BR',
        sms_contrast: 'high'
    });
    harness.Reservas.init();
    assert.equal(harness.storage.get('sms_cookie_consent'), '{"analytics":false}');
    assert.equal(harness.storage.get('smsLang'), 'pt-BR');
    assert.equal(harness.storage.get('sms_contrast'), 'high');
});

test('FORM_IS_NOT_CLEARED_ON_FAILURE', async () => {
    const harness = await createHarness();
    harness.Reservas.backendWriter = async () => { throw new Error('synthetic-rejection'); };
    await submit(harness);
    assert.equal(harness.resetCalls, 0);
    assert.equal(harness.closeCalls, 0);
    assert.equal(harness.button.disabled, false);
});

test('FORM_CAN_CLEAR_AFTER_CONFIRMED_BACKEND', async () => {
    const harness = await createHarness();
    harness.Reservas.backendWriter = async () => ({ id: 'confirmed' });
    await submit(harness);
    assert.equal(harness.resetCalls, 1);
    assert.equal(harness.closeCalls, 1);
});

test('WHATSAPP_HANDOFF_IS_NOT_BACKEND_SUCCESS', async () => {
    const harness = await createHarness();
    const reservation = harness.Reservas.construirReserva({
        experienciaId: 1, data: '2099-12-20', horario: '09:00', pessoas: 2,
        nome: 'Pessoa Teste', email: 'teste@example.invalid',
        telefone: '(00) 00000-0000', observacoes: ''
    });
    harness.Reservas.activeReservation = reservation;
    harness.Reservas.setState('FAILED');
    assert.equal(harness.Reservas.abrirWhatsApp(), true);
    assert.equal(harness.Reservas.state, 'PENDING_HANDOFF');
    assert.equal(harness.openedUrls.length, 1);
});

test('DOUBLE_SUBMIT_IS_BLOCKED_WHILE_SUBMITTING', async () => {
    const harness = await createHarness();
    const write = deferred();
    let backendWrites = 0;
    harness.Reservas.backendWriter = () => { backendWrites += 1; return write.promise; };
    const first = submit(harness);
    await Promise.resolve();
    await submit(harness);
    write.resolve({ id: 'confirmed-once' });
    await first;
    assert.equal(backendWrites, 1);
    assert.equal(harness.Reservas.state, 'CONFIRMED_BACKEND');
});

test('PENDING_OPERATION_DOES_NOT_AUTO_RETRY', async () => {
    const harness = await createHarness();
    let backendWrites = 0;
    harness.Reservas.backendWriter = () => { backendWrites += 1; return new Promise(() => {}); };
    await submit(harness);
    await new Promise(resolve => setTimeout(resolve, 15));
    assert.equal(backendWrites, 1);
    assert.equal(harness.Reservas.state, 'PENDING_HANDOFF');
    assert.equal(harness.button.disabled, true);
    assert.equal(harness.Reservas.fecharModal(), false);
    assert.equal(harness.Reservas.abrirModal(2), false);
    assert.equal(harness.closeCalls, 0);
    assert.equal(harness.dismissControls.every(control => control.disabled), true);
});

test('NO_PII_IN_CONSOLE', async () => {
    const harness = await createHarness();
    harness.Reservas.backendWriter = async () => { throw new Error('synthetic-rejection'); };
    await submit(harness);
    const consoleText = JSON.stringify(harness.consoleCalls);
    assert.doesNotMatch(consoleText, /Pessoa Teste|teste@example\.invalid|00000-0000|Fixture sintética/);
});

test('RESERVATION_FORM_LINKS_TO_PRIVACY_POLICY', async () => {
    const [source, page, browserFixture] = await Promise.all([
        readFile(sourceUrl, 'utf8'),
        readFile(pageUrl, 'utf8'),
        readFile(browserFixtureUrl, 'utf8')
    ]);
    assert.match(source, /href="\/privacidade"/);
    assert.match(page, /reservations-truthful-state-20260913-r2/);
    assert.match(browserFixture, /backendWriter/);
    assert.match(browserFixture, /Pessoa Sintética Legada/);
});
