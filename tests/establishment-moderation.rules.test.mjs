import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { before, after } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc, writeBatch, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
let env;
const projectId = 'demo-turismo-sms-rules-test';
before(async () => {
    env = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
    await env.withSecurityRulesDisabled(async context => {
        const db = context.firestore();
        for (const role of ['admin', 'moderator', 'user']) await setDoc(doc(db, 'usuarios', 'moderation-' + role), { role, ativo: true });
    });
});
after(async () => { if (env) await env.cleanup(); });
const database = (role = 'admin') => env.authenticatedContext('moderation-' + role).firestore();
async function seed(id, extra = {}) {
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'estabelecimentos_pendentes', id), { submittedBy: 'moderation-user', status: 'pendente', nome: 'Hotel original', site: 'hotel.example', ...extra }));
}
function audited(db, id, { revision = 1, before = {}, after = { website: 'https://hotel.example' }, status = 'pendente', beforeStatus = 'pendente', action = 'correction', actorUid = 'moderation-admin', reason = 'URL confirmada', historyId = 'r' + revision, original = {} } = {}) {
    const batch = writeBatch(db), ref = doc(db, 'estabelecimentos_pendentes', id), timestamp = serverTimestamp();
    const patch = { moderation: { revision, corrections: after, updatedAt: timestamp, updatedBy: actorUid, lastHistoryId: historyId }, ...original };
    if (action === 'decision') Object.assign(patch, { status, reviewedAt: timestamp, reviewedBy: actorUid, reviewNotes: reason });
    batch.update(ref, patch);
    batch.set(doc(ref, 'history', historyId), { revision, before, after, beforeStatus, afterStatus: status, action, reason, actorUid, createdAt: timestamp });
    return batch.commit();
}
test('correção admin exige histórico atômico e preserva original', async () => {
    const id = 'moderation-atomic', db = database(); await seed(id);
    await assertFails(updateDoc(doc(db, 'estabelecimentos_pendentes', id), { moderation: { revision: 1, corrections: { website: '' }, updatedAt: serverTimestamp(), updatedBy: 'moderation-admin', lastHistoryId: 'missing' } }));
    await assertSucceeds(audited(db, id));
    const raw = (await getDoc(doc(db, 'estabelecimentos_pendentes', id))).data();
    assert.equal(raw.site, 'hotel.example');
    assert.equal(raw.moderation.corrections.website, 'https://hotel.example');
    await assertFails(deleteDoc(doc(db, 'estabelecimentos_pendentes', id)));
    await assertFails(updateDoc(doc(db, 'estabelecimentos_pendentes', id), { site: 'https://bypass.example' }));
    await assertFails(audited(db, id, { revision: 2, before: raw.moderation.corrections, original: { nome: 'alterado' } }));
    await assertFails(updateDoc(doc(db, 'estabelecimentos_pendentes', id, 'history', 'r1'), { reason: 'rewritten' }));
});
test('permissões: usuário e moderador não corrigem nem acessam histórico', async () => {
    const id = 'moderation-roles'; await seed(id);
    for (const role of ['user', 'moderator']) await assertFails(audited(database(role), id, { actorUid: 'moderation-' + role }));
    await assertSucceeds(audited(database(), id));
    for (const role of ['user', 'moderator']) await assertFails(getDocs(collection(database(role), 'estabelecimentos_pendentes', id, 'history')));
    await assertSucceeds(getDocs(collection(database(), 'estabelecimentos_pendentes', id, 'history')));
});
test('Rules rejeitam correção inválida, revisão stale, autor forjado e motivo ausente', async () => {
    const id = 'moderation-invalid', db = database(); await seed(id);
    for (const options of [{ after: { website: 'hotel.example' } }, { after: { website: 'javascript:alert(1)' } }, { after: { website: 'https://a.example@evil.example' } }, { after: { name: null } }, { after: { injected: true } }, { revision: 2 }, { actorUid: 'other' }, { reason: '' }, { reason: '   \n\t' }]) await assertFails(audited(db, id, options));
    await assertSucceeds(audited(db, id));
    await assertFails(audited(db, id, { historyId: 'stale' }));
    await assertFails(setDoc(doc(db, 'estabelecimentos_pendentes', id, 'history', 'standalone'), { revision: 2 }));
});
test('workflow em análise, pedir correção e rejeição têm trilha; importação/finalização bloqueiam edição', async () => {
    const db = database(), id = 'moderation-decisions'; await seed(id);
    await assertSucceeds(audited(db, id, { action: 'decision', status: 'em_analise', after: {} }));
    await assertFails(updateDoc(doc(db, 'estabelecimentos_pendentes', id), { status: 'rejeitado' }));
    await assertSucceeds(audited(db, id, { revision: 2, action: 'decision', beforeStatus: 'em_analise', status: 'correcao_solicitada', after: {} }));
    await assertFails(updateDoc(doc(db, 'estabelecimentos_pendentes', id), { cmsImportState: 'media_preparing' }));
    for (const [suffix, extra] of [['import', { cmsImportState: 'media_preparing' }], ['approved', { status: 'aprovado' }], ['rejected', { status: 'rejeitado' }]]) {
        await seed(id + suffix, extra);
        await assertFails(audited(db, id + suffix));
    }
});
test('submissão pública não forja envelope de moderação', async () => {
    const db = database('user');
    await assertFails(setDoc(doc(db, 'estabelecimentos_pendentes', 'moderation-forged-create'), { submittedBy: 'moderation-user', status: 'pendente', moderation: { revision: 1, corrections: { website: '' } } }));
});
test('correções aceitam descrição multilinha e removem opcionais por null', async () => {
    const id = 'moderation-multiline'; await seed(id);
    await assertSucceeds(audited(database(), id, { after: { description: 'Primeira linha.\nSegunda linha.', website: null } }));
    await seed(id + '-blank');
    await assertFails(audited(database(), id + '-blank', { after: { description: '\n \t' } }));
});
test('aprovação final grava histórico atomicamente e protege os originais', async () => {
    const id = 'moderation-approval-audit', db = database();
    await seed(id, { cmsImportState: 'draft_creating', cmsEstablishmentId: 'hotel-draft', moderation: { revision: 1, corrections: { website: '' } } });
    const patch = { status: 'aprovado', cmsImportState: 'draft_created', cmsEstablishmentId: 'hotel-draft', cmsImportedAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: 'moderation-admin' };
    await assertFails(updateDoc(doc(db, 'estabelecimentos_pendentes', id), patch));
    // A final transition with a moderation envelope cannot omit its corresponding audit.
    await assertFails(updateDoc(doc(db, 'estabelecimentos_pendentes', id), { ...patch, moderation: { revision: 2, corrections: { website: '' }, updatedAt: serverTimestamp(), updatedBy: 'moderation-admin', lastHistoryId: 'missing-approval' } }));
    await assertFails(audited(db, id, { revision: 2, before: { website: '' }, after: { website: '' }, status: 'aprovado', action: 'approval', reason: 'Rascunho privado criado', original: { ...patch, site: 'bypass.example', reviewedAt: serverTimestamp(), reviewedBy: 'moderation-admin', reviewNotes: '' } }));
    await assertSucceeds(audited(db, id, { revision: 2, before: { website: '' }, after: { website: '' }, status: 'aprovado', action: 'approval', reason: 'Rascunho privado criado', original: { ...patch, reviewedAt: serverTimestamp(), reviewedBy: 'moderation-admin', reviewNotes: '' } }));
    assert.equal((await getDoc(doc(db, 'estabelecimentos_pendentes', id))).data().moderation.revision, 2);
});
test('catálogo valida HTTPS no grupo contact e preserva leitura de registros legados', async () => {
    const db = database(), id = 'moderation-catalog-contact';
    const base = { id, slug: id, status: 'draft', createdAt: new Date('2026-01-01'), createdBy: 'moderation-admin', updatedAt: new Date('2026-01-01'), updatedBy: 'moderation-admin', schemaVersion: 2, revision: 0, validatedGroups: {} };
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'cms_establishments', id), base));
    const target = doc(db, 'cms_establishments', id);
    const patch = website => ({ contact: { phone: '', whatsapp: '', email: '', website, instagram: '', facebook: '' }, schemaVersion: 2, revision: 1, validatedGroups: { contact: 2 }, updatedAt: serverTimestamp(), updatedBy: 'moderation-admin' });
    for (const website of ['hotel.example', 'http://hotel.example', 'javascript:alert(1)', 'https://hotel.example/<script>', 'https://hotel.example@evil.example', 'https://hotel.example:99999/', 'https://hotel.example:65536/']) await assertFails(updateDoc(target, patch(website)));
    await assertSucceeds(updateDoc(target, patch('https://hotel.example/reservas')));
    await assertSucceeds(updateDoc(target, { ...patch(''), revision: 2 }));
    const legacyId = id + '-legacy';
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'cms_establishments', legacyId), { ...base, id: legacyId, status: 'published', contact: { ...patch('').contact, website: 'http://legacy.example' } }));
    await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'cms_establishments', legacyId)));
});

test('Rules exigem dígitos no telefone e WhatsApp e rejeitam whitespace no e-mail', async () => {
    let index = 0;
    for (const key of ['phone', 'whatsapp']) {
        for (const value of ['        ', '((((((((', '1       ', '1234567', '1234567890123456']) {
            const id = 'moderation-contact-negative-' + index++; await seed(id);
            await assertFails(audited(database(), id, { after: { [key]: value } }));
        }
        for (const value of ['(42) 99999-9999', '+55 (42) 99999-9999']) {
            const id = 'moderation-contact-positive-' + index++; await seed(id);
            await assertSucceeds(audited(database(), id, { after: { [key]: value } }));
        }
    }
    for (const value of ['a\nb@example.test', 'a\tb@example.test', 'a@example.\ntest']) {
        const id = 'moderation-email-negative-' + index++; await seed(id);
        await assertFails(audited(database(), id, { after: { email: value } }));
    }
    const id = 'moderation-contact-optional'; await seed(id);
    await assertSucceeds(audited(database(), id, { after: { whatsapp: '', email: 'hotel@example.test' } }));
});

test('moderador preserva apenas rejeição pendente com histórico atômico', async () => {
    const db = database('moderator'), decision = { action: 'decision', status: 'rejeitado', after: {}, actorUid: 'moderation-moderator', reason: 'Cadastro não atende aos critérios' };
    const id = 'moderation-moderator-reject'; await seed(id);
    await assertSucceeds(audited(db, id, decision));
    await assertFails(getDocs(collection(db, 'estabelecimentos_pendentes', id, 'history')));
    const userId = id + '-user'; await seed(userId);
    await assertFails(audited(database('user'), userId, { ...decision, actorUid: 'moderation-user' }));
    for (const [suffix, options] of [
        ['correct', { action: 'correction', after: { website: '' }, actorUid: 'moderation-moderator' }],
        ['approve', { ...decision, action: 'approval', status: 'aprovado' }],
        ['request-correction', { ...decision, status: 'correcao_solicitada' }],
        ['review', { ...decision, status: 'em_analise' }],
        ['fake-author', { ...decision, actorUid: 'moderation-admin' }],
        ['original', { ...decision, original: { nome: 'Nome alterado' } }],
        ['corrections', { ...decision, after: { website: '' } }],
        ['empty-reason', { ...decision, reason: '' }],
    ]) {
        const targetId = id + '-' + suffix; await seed(targetId);
        await assertFails(audited(db, targetId, options));
    }
    const missingId = id + '-missing'; await seed(missingId);
    await assertFails(updateDoc(doc(db, 'estabelecimentos_pendentes', missingId), {
        status: 'rejeitado', reviewedAt: serverTimestamp(), reviewedBy: 'moderation-moderator', reviewNotes: decision.reason,
        moderation: { revision: 1, corrections: {}, updatedAt: serverTimestamp(), updatedBy: 'moderation-moderator', lastHistoryId: 'missing' },
    }));
    for (const [suffix, extra] of [['reviewing', { status: 'em_analise' }], ['importing', { cmsImportState: 'media_preparing' }]]) {
        const targetId = id + '-' + suffix; await seed(targetId, extra);
        await assertFails(audited(db, targetId, { ...decision, beforeStatus: extra.status || 'pendente' }));
    }
    const correctedId = id + '-corrected';
    await seed(correctedId, { moderation: { revision: 1, corrections: { website: '' } } });
    await assertSucceeds(audited(db, correctedId, { ...decision, revision: 2, before: { website: '' }, after: { website: '' } }));
});
