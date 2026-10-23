/* Correções administrativas preservam a submissão recebida e são auditadas atomicamente. */
(function (root, factory) {
    'use strict';
    var api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.EstablishmentModeration = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';
    var aliases = Object.freeze({ name: 'nome', category: 'categoria', address: 'endereco', description: 'descricao', phone: 'telefone', website: 'site', openingHours: 'horario', contactName: 'responsavel' });
    var limits = Object.freeze({ name: 160, category: 80, address: 500, description: 4000, phone: 32, whatsapp: 32, email: 254, website: 240, instagram: 160, openingHours: 1000, contactName: 160 });
    var required = ['name', 'category', 'address', 'description', 'phone'];
    var statuses = ['pendente', 'em_analise', 'correcao_solicitada'];
    function fail(code, message, details) {
        var error = new Error(message); error.code = 'moderation/' + code; error.details = details; throw error;
    }
    function validate(changes) {
        var errors = {}, suggestions = {};
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return { valid: false, errors: { changes: 'Informe os campos da correção.' }, suggestions: suggestions };
        Object.keys(changes).forEach(function (key) {
            var value = changes[key];
            if (!Object.prototype.hasOwnProperty.call(limits, key)) { errors[key] = 'Campo não editável.'; return; }
            if (value === null && required.indexOf(key) === -1) return;
            if (typeof value !== 'string' || value.length > limits[key]) { errors[key] = 'Texto inválido ou maior que ' + limits[key] + ' caracteres.'; return; }
            if (required.indexOf(key) !== -1 && !value.trim()) errors[key] = 'Campo obrigatório.';
            if (key === 'category' && !/^(hospedagem|restaurante|gastronomia|atracao|ponto_turistico|comercio|servico|produtor|turismo_rural)$/.test(value)) errors[key] = 'Selecione uma categoria válida.';
            if (key === 'website' && value) {
                try {
                    var url = new URL(value);
                    if (value !== value.trim() || /[\u0000-\u001F\u007F\\<>"']/.test(value) || !/^https:\/\/[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?::(?:[0-5]?[0-9]{1,4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?(?:[/?#][A-Za-z0-9._~:/?#@!$&()*+,;=%-]*)?$/.test(value) || url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.')) throw new Error();
                } catch (_) {
                    errors[key] = 'Informe uma URL HTTPS completa ou deixe o campo vazio.';
                    if (/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?$/i.test(value.trim())) suggestions[key] = 'https://' + value.trim();
                }
            }
            if ((key === 'phone' || key === 'whatsapp') && value && !/^\+?(?:[ ()-]*[0-9]){8,15}[ ()-]*$/.test(value)) errors[key] = 'Informe telefone com DDD (somente números, espaços, +, parênteses e hífen).';
            if (key === 'email' && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) errors[key] = 'Informe um e-mail válido.';
            if (key === 'instagram' && value && !/^@?[A-Za-z0-9._]{1,30}$/.test(value) && !/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/.test(value)) errors[key] = 'Informe @perfil ou URL HTTPS do Instagram.';
        });
        return { valid: Object.keys(errors).length === 0, errors: errors, suggestions: suggestions };
    }
    function effective(raw) {
        var result = Object.assign({}, raw || {});
        Object.keys(aliases).forEach(function (key) {
            if (result[key] == null && Object.prototype.hasOwnProperty.call(result, aliases[key])) result[key] = result[aliases[key]];
        });
        if (raw && raw.website == null && typeof raw.site === 'string' && raw.site.trim().charAt(0) === '@') {
            result.website = '';
            if (!result.instagram) result.instagram = raw.site.trim();
        }
        var corrections = raw && raw.moderation && raw.moderation.corrections || {};
        Object.keys(limits).forEach(function (key) {
            if (!Object.prototype.hasOwnProperty.call(corrections, key)) return;
            // null é remoção explícita: não permita fallback para o alias original.
            result[key] = corrections[key] == null ? '' : corrections[key];
            if (aliases[key]) result[aliases[key]] = result[key];
        });
        return result;
    }
    async function transact(options, action) {
        var o = options || {}, notes = typeof o.notes === 'string' ? o.notes.trim() : '';
        if (!o.db || !o.id || !o.uid || !Number.isInteger(o.expectedRevision) || o.expectedRevision < 0) fail('invalid', 'Identificação ou revisão inválida.');
        if (!notes || notes.length > 2000) fail('invalid', 'Registre o motivo da alteração (até 2000 caracteres).');
        if (action === 'correction') {
            var checked = validate(o.changes);
            if (!checked.valid || !Object.keys(o.changes).length) fail('invalid', 'Revise os campos informados.', checked);
        } else if (statuses.concat(['rejeitado']).indexOf(o.status) === -1) fail('invalid', 'Situação inválida.');
        var ref = o.db.collection('estabelecimentos_pendentes').doc(o.id);
        var historyRef = ref.collection('history').doc();
        return o.db.runTransaction(async function (tx) {
            var snap = await tx.get(ref);
            if (!snap.exists) fail('not-found', 'Solicitação não encontrada.');
            var raw = snap.data(), previous = raw.moderation || {}, revision = previous.revision || 0;
            if (revision !== o.expectedRevision) fail('conflict', 'Outra pessoa alterou esta solicitação. Recarregue antes de salvar.');
            if (statuses.indexOf(raw.status) === -1 || raw.cmsImportState || raw.cmsEstablishmentId || raw.cmsImportedAt) fail('locked', 'Solicitação finalizada ou com aprovação editorial iniciada.');
            var before = previous.corrections || {}, after = Object.assign({}, before, action === 'correction' ? o.changes : {});
            var checkedAll = validate(after);
            if (!checkedAll.valid) fail('invalid', 'Revise os campos informados.', checkedAll);
            var timestamp = root.firebase.firestore.FieldValue.serverTimestamp();
            var nextStatus = action === 'decision' ? o.status : raw.status;
            var moderation = { revision: revision + 1, corrections: after, updatedAt: timestamp, updatedBy: o.uid, lastHistoryId: historyRef.id };
            var update = { moderation: moderation };
            if (action === 'decision') Object.assign(update, { status: nextStatus, reviewedAt: timestamp, reviewedBy: o.uid, reviewNotes: notes });
            tx.update(ref, update);
            tx.set(historyRef, { revision: revision + 1, before: before, after: after, beforeStatus: raw.status, afterStatus: nextStatus, action: action, reason: notes, actorUid: o.uid, createdAt: timestamp });
            return { success: true, revision: revision + 1, status: nextStatus };
        });
    }
    function finalizeApproval(options) {
        var o = options || {}, raw = o.raw || {}, previous = raw.moderation || {};
        if (!o.tx || !o.pendingRef || !o.uid || !o.timestamp || ['pendente', 'em_analise'].indexOf(raw.status) === -1 || ['media_preparing', 'media_prepared', 'draft_creating'].indexOf(raw.cmsImportState) === -1 || !raw.cmsEstablishmentId) fail('locked', 'A aprovação editorial não está pronta para finalizar.');
        var historyRef = o.pendingRef.collection('history').doc();
        var revision = (previous.revision || 0) + 1;
        var corrections = previous.corrections || {};
        o.tx.set(historyRef, { revision: revision, before: corrections, after: corrections, beforeStatus: raw.status, afterStatus: 'aprovado', action: 'approval', reason: 'Rascunho privado criado', actorUid: o.uid, createdAt: o.timestamp });
        return { moderation: { revision: revision, corrections: corrections, updatedAt: o.timestamp, updatedBy: o.uid, lastHistoryId: historyRef.id } };
    }
    return Object.freeze({ fields: Object.freeze(Object.keys(limits)), limits: limits, aliases: aliases, effective: effective, validate: validate, finalizeApproval: finalizeApproval, save: function (options) { return transact(options, 'correction'); }, decide: function (options) { return transact(options, 'decision'); } });
});
