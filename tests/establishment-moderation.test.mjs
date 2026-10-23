import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
const context = vm.createContext({ URL, firebase: { firestore: { FieldValue: { serverTimestamp: () => 'server-time' } } } });
vm.runInContext(await readFile(new URL('../js/establishment-moderation.js', import.meta.url), 'utf8'), context);
const api = context.EstablishmentModeration;
test('HTTPS sugere correção explícita e não altera o original', () => {
    const raw = { name: 'Hotel', site: 'www.exemplo.com.br', moderation: { corrections: { website: 'https://www.exemplo.com.br' } } };
    assert.equal(api.validate({ website: raw.site }).valid, false);
    assert.equal(api.validate({ website: raw.site }).suggestions.website, 'https://www.exemplo.com.br');
    assert.equal(api.effective(raw).site, 'https://www.exemplo.com.br');
    assert.equal(raw.site, 'www.exemplo.com.br');
    assert.equal(api.validate({ website: 'https://site.com@evil.com' }).valid, false);
    assert.equal(api.validate({ website: 'https://site.com' }).valid, true);
    assert.equal(api.validate({ website: 'https://site.com/<script>' }).valid, false);
    assert.equal(api.validate({ website: 'https://site.com/quote\"' }).valid, false);
});
test('aliases legados ficam disponíveis para a ficha e @site é reconhecido como Instagram', () => {
    const item = api.effective({ nome: 'Hotel', categoria: 'hospedagem', endereco: 'Rua A', descricao: 'Hotel local', telefone: '42999999999', site: '@hotel' });
    assert.equal(item.name, 'Hotel');
    assert.equal(item.phone, '42999999999');
    assert.equal(item.instagram, '@hotel');
    assert.equal(item.website, '');
    assert.equal(api.effective({ website: '', site: 'old.example' }).website, '');
    assert.equal(api.effective({ website: null, site: 'https://hotel.example' }).website, 'https://hotel.example');
    assert.equal(api.effective({ website: null, site: '@hotel' }).instagram, '@hotel');
    assert.equal(api.effective({ website: null, site: '@hotel' }).website, '');
});
test('remoção opcional impede fallback para o alias original', () => {
    const raw = { site: 'http://old.example', website: 'http://old.example', moderation: { corrections: { website: null } } };
    assert.equal(api.effective(raw).website, '');
    assert.equal(api.effective(raw).site, '');
    assert.equal(api.effective(raw).moderation, raw.moderation);
    assert.equal(api.validate({ website: null }).valid, true);
    assert.equal(api.validate({ name: null }).valid, false);
});
test('validação localizada de campos e limites', () => {
    for (const patch of [{ status: 'aprovado' }, { phone: 'abc' }, { instagram: 'javascript:alert(1)' }, { name: ' ' }, { category: 'inventada' }, { description: 'a'.repeat(4001) }]) assert.equal(api.validate(patch).valid, false);
    assert.equal(api.validate({ phone: '(42) 99999-9999', instagram: '@hotel', website: '', name: 'Hotel' }).valid, true);
});

test('matriz de websites, opcionais, contatos e conteúdo não executável', () => {
    for (const website of ['https://hotel.example', 'https://hotel.example/path?q=sim#contato', 'https://hotel.example:65535/', '', null]) assert.equal(api.validate({ website }).valid, true, String(website));
    for (const website of ['hotel.example', 'http://hotel.example', 'javascript:alert(1)', 'data:text/html,1', '//hotel.example', 'https://hotel.example/evil\\path', 'https://hotel.example:99999/', 'https://hotel.example:65536/', 'https://hotel.example:999999/']) assert.equal(api.validate({ website }).valid, false, website);
    for (const key of ['name', 'category', 'address', 'description', 'phone']) assert.equal(api.validate({ [key]: '' }).valid, false, key);
    assert.equal(api.validate({ whatsapp: null, email: null, openingHours: null, instagram: 'https://www.instagram.com/hotel/' }).valid, true);
    assert.equal(api.validate({ name: 'Pousada São João', description: 'Acentos e quebra\nde linha' }).valid, true);
    assert.equal(api.validate({ latitude: 999, longitude: Infinity }).valid, false);
    assert.equal(api.validate({ instagram: 'https://evil.example/contato' }).valid, false);
});
function fixture(raw) {
    const writes = [];
    const ref = { collection: () => ({ doc: () => ({ id: 'audit-1' }) }) };
    const db = { collection: () => ({ doc: () => ref }), runTransaction: async run => run({ get: async () => ({ exists: true, data: () => raw }), update: (ref, data) => writes.push(data), set: (ref, data) => writes.push(data) }) };
    return { db, writes };
}
test('transação bloqueia revisão obsoleta e importação iniciada sem escrita', async () => {
    for (const [raw, code] of [[{ status: 'pendente', moderation: { revision: 1 } }, 'conflict'], [{ status: 'pendente', cmsImportState: 'media_preparing' }, 'locked'], [{ status: 'aprovado' }, 'locked']]) {
        const { db, writes } = fixture(raw);
        await assert.rejects(api.save({ db, id: 'hotel', uid: 'admin', expectedRevision: 0, changes: { website: '' }, notes: 'Remover URL inválida' }), { code: 'moderation/' + code });
        assert.equal(writes.length, 0);
    }
});
test('salvar cria envelope de correção e histórico antes/depois sem alterar original', async () => {
    const raw = { status: 'pendente', site: 'old.example' }, { db, writes } = fixture(raw);
    assert.equal((await api.save({ db, id: 'hotel', uid: 'admin', expectedRevision: 0, changes: { website: 'https://hotel.example' }, notes: 'URL confirmada' })).revision, 1);
    assert.equal(writes.length, 2);
    assert.equal(writes[0].site, undefined);
    assert.equal(writes[1].after.website, 'https://hotel.example');
    assert.equal(writes[1].actorUid, 'admin');
    assert.equal(raw.site, 'old.example');
});
test('decisões exigem justificativa e geram histórico', async () => {
    const { db, writes } = fixture({ status: 'pendente' });
    await assert.rejects(api.decide({ db, id: 'hotel', uid: 'admin', expectedRevision: 0, status: 'rejeitado', notes: '' }), { code: 'moderation/invalid' });
    await api.decide({ db, id: 'hotel', uid: 'admin', expectedRevision: 0, status: 'correcao_solicitada', notes: 'Confirmar telefone' });
    assert.equal(writes[0].status, 'correcao_solicitada');
    assert.equal(writes[1].beforeStatus, 'pendente');
});
test('finalização prepara patch e histórico de aprovação na mesma transação', () => {
    const writes = [], tx = { set: (ref, payload) => writes.push(payload) };
    const pendingRef = { collection: () => ({ doc: () => ({ id: 'approval-history' }) }) };
    const raw = { status: 'em_analise', cmsImportState: 'draft_creating', cmsEstablishmentId: 'hotel', moderation: { revision: 3, corrections: { website: '' } } };
    const patch = api.finalizeApproval({ tx, pendingRef, raw, uid: 'admin', timestamp: 'server-time' });
    assert.equal(patch.moderation.revision, 4);
    assert.equal(writes[0].action, 'approval');
    assert.equal(writes[0].beforeStatus, 'em_analise');
    assert.equal(writes[0].afterStatus, 'aprovado');
    assert.equal(writes[0].before, writes[0].after);
    assert.throws(() => api.finalizeApproval({ tx, pendingRef, raw: { ...raw, status: 'correcao_solicitada' }, uid: 'admin', timestamp: 'server-time' }), { code: 'moderation/locked' });
});

test('telefone e WhatsApp exigem de oito a quinze dígitos; e-mail não aceita whitespace', () => {
    for (const key of ['phone', 'whatsapp']) {
        for (const value of ['        ', '((((((((', '1       ', '1234567', '1234567890123456']) assert.equal(api.validate({ [key]: value }).valid, false, key + ': ' + value);
        for (const value of ['(42) 99999-9999', '+55 (42) 99999-9999']) assert.equal(api.validate({ [key]: value }).valid, true, key + ': ' + value);
    }
    for (const value of ['a\nb@example.test', 'a\tb@example.test', 'a@example.\ntest']) assert.equal(api.validate({ email: value }).valid, false);
    assert.equal(api.validate({ whatsapp: '', email: 'hotel@example.test' }).valid, true);
});
