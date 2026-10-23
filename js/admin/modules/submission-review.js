/* Ficha de moderação. O original é preservado pelo serviço de domínio. */
(function () {
    "use strict";
    var active = null;
    var fields = [
        ["name", "Nome", "text"], ["category", "Categoria", "text"],
        ["address", "Endereço", "text"], ["description", "Descrição", "textarea"],
        ["phone", "Telefone", "tel"], ["whatsapp", "WhatsApp", "tel"],
        ["email", "E-mail", "email"], ["website", "Website", "text"],
        ["instagram", "Instagram", "text"], ["openingHours", "Horários de funcionamento", "textarea"],
        ["contactName", "Nome do responsável", "text"]
    ];
    var aliases = { name: "nome", category: "categoria", address: "endereco", description: "descricao", phone: "telefone", website: "site", openingHours: "horario", contactName: "responsavel" };
    var categories = { hospedagem: "Hospedagem", restaurante: "Restaurante", atracao: "Atração turística", comercio: "Comércio", produtor: "Produtor local", gastronomia: "Gastronomia", ponto_turistico: "Ponto turístico", servico: "Serviço", turismo_rural: "Turismo rural" };
    var statusNames = { pendente: "Pendente", em_analise: "Em análise", correcao_solicitada: "Correção solicitada", rejeitado: "Rejeitado", aprovado: "Aprovado" };
    function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
    function ctx() { return window.AdminContext || {}; }
    function admin() { var user = ctx().currentUser; return !!(user && user.uid && user.role === "admin" && user.ativo === true); }
    function value(raw, key) { var result = raw[key] != null ? raw[key] : raw[aliases[key]]; return result == null ? "" : typeof result === "object" ? JSON.stringify(result) : String(result); }
    function timeMillis(value) {
        if (value == null) return NaN;
        if (typeof value.toDate === "function") return value.toDate().getTime();
        if (typeof value.seconds === "number") return value.seconds * 1000;
        return new Date(value).getTime();
    }
    function dateLabel(value) { var millis = timeMillis(value); return Number.isFinite(millis) ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(millis)) + " (Brasília)" : "Não informado"; }
    function fieldLabel(key, text) { return key === "category" ? categories[text] || text || "Não informado" : text || "Não informado"; }
    function historyEntry(s, item) {
        var actions = { correction: "Correção de dados", decision: "Alteração de situação", approval: "Aprovação e criação de rascunho" };
        var before = window.EstablishmentModeration.effective(Object.assign({}, s.raw, { moderation: { corrections: item.before || {} } }));
        var after = window.EstablishmentModeration.effective(Object.assign({}, s.raw, { moderation: { corrections: item.after || {} } }));
        var changes = fields.filter(function (field) { return value(before, field[0]) !== value(after, field[0]); }).map(function (field) {
            return '<tr><th scope="row">' + esc(field[1]) + '</th><td>' + esc(fieldLabel(field[0], value(before, field[0]))) + '</td><td>' + esc(fieldLabel(field[0], value(after, field[0]))) + '</td></tr>';
        }).join("");
        var status = item.beforeStatus !== item.afterStatus ? '<p><strong>Situação:</strong> ' + esc(statusNames[item.beforeStatus] || item.beforeStatus || "Não informada") + ' → ' + esc(statusNames[item.afterStatus] || item.afterStatus || "Não informada") + '</p>' : "";
        return '<details><summary>Revisão ' + esc(item.revision) + ' · ' + esc(actions[item.action] || "Registro de moderação") + ' · ' + esc(dateLabel(item.createdAt)) + '</summary><p><strong>Autor:</strong> ' + esc(item.actorUid || "Não informado") + '</p><p><strong>Justificativa:</strong> ' + esc(item.reason || "Sem observação") + '</p>' + status + (changes ? '<div class="sr-history-table"><table><thead><tr><th>Campo</th><th>Valor anterior</th><th>Novo valor</th></tr></thead><tbody>' + changes + '</tbody></table></div>' : '<p>Nenhum campo cadastral foi alterado nesta revisão.</p>') + '<details><summary>Detalhes técnicos do registro</summary><pre>' + esc(JSON.stringify(item, null, 2)) + '</pre></details></details>';
    }
    function categoryOptions(selected) {
        return '<option value="">Selecione uma categoria</option>' + Object.keys(categories).map(function (key) { return '<option value="' + key + '">' + esc(categories[key]) + '</option>'; }).join("") + (selected && !Object.prototype.hasOwnProperty.call(categories, selected) ? '<option value="' + esc(selected) + '">Categoria antiga não reconhecida: ' + esc(selected) + ' — selecione uma opção válida</option>' : "");
    }
    function renderField(field) {
        var key = field[0], attributes = ' id="sr-' + key + '" name="' + key + '" aria-describedby="sr-error-' + key + '"';
        var control = key === "category" ? '<select' + attributes + ' disabled>' + categoryOptions("") + '</select>' : field[2] === "textarea" ? '<textarea rows="4"' + attributes + ' readonly></textarea>' : '<input type="' + field[2] + '"' + attributes + ' readonly>';
        return '<div class="sr-field"><label for="sr-' + key + '">' + esc(field[1]) + '</label>' + control + '<span id="sr-error-' + key + '" class="sr-field-error"></span><span data-suggestion="' + key + '"></span></div>';
    }
    function editable(s) { return admin() && !s.raw.cmsEstablishmentId && !s.raw.cmsImportState && !s.raw.cmsImportedAt && ["pendente", "em_analise", "correcao_solicitada"].indexOf(s.raw.status || "pendente") !== -1; }
    function canReject(s) {
        if (!s.loaded) return false;
        if (editable(s)) return true;
        var user = ctx().currentUser;
        return !!(user && user.uid && user.role === "moderator" && user.ativo === true && typeof ctx().isModerator === "function" && ctx().isModerator() && s.raw.status === "pendente" && !s.raw.cmsImportState && !s.raw.cmsEstablishmentId && !s.raw.cmsImportedAt);
    }
    function canApprove(s) {
        if (!admin() || !s.loaded || s.raw.cmsImportedAt || ["pendente", "em_analise"].indexOf(s.raw.status) === -1) return false;
        if (s.raw.cmsEstablishmentId && s.linkedCmsStatus !== "draft") return false;
        return !s.raw.cmsImportState || ["media_preparing", "media_prepared", "draft_creating"].indexOf(s.raw.cmsImportState) !== -1;
    }
    function message(s, text, error) { if (active !== s) return; var box = s.dialog.querySelector(".sr-status"); box.textContent = text; box.classList.toggle("sr-error", !!error); }
    function current(s) { var result = {}; fields.forEach(function (field) { result[field[0]] = s.dialog.querySelector('[name="' + field[0] + '"]').value; }); return result; }
    function dirty(s) { return s.loaded && (JSON.stringify(current(s)) !== JSON.stringify(s.base) || s.dialog.querySelector('[name="reviewNotes"]').value.trim() !== ""); }
    function busy(s, pending) {
        s.busy = pending;
        s.dialog.setAttribute("aria-busy", String(pending));
        s.dialog.querySelectorAll("button").forEach(function (button) { button.disabled = pending || (button.dataset.action === "approve" ? !canApprove(s) : button.dataset.action === "rejeitado" ? !canReject(s) : button.dataset.write === "true" && (!s.loaded || !editable(s))); });
        s.dialog.querySelectorAll("input, textarea, select").forEach(function (input) {
            var locked = pending || !s.loaded || (input.name === "reviewNotes" ? !editable(s) && !canReject(s) : !editable(s));
            if (input.tagName === "SELECT") input.disabled = locked;
            else input.readOnly = locked;
        });
    }
    function close() {
        var s = active;
        if (!s) return true;
        if (s.busy) return false;
        if (dirty(s) && !window.confirm("Descartar as alterações ainda não salvas desta ficha?")) return false;
        active = null;
        s.dialog.close(); s.dialog.remove();
        window.removeEventListener("beforeunload", s.unload);
        if (s.returnFocus && s.returnFocus.isConnected) s.returnFocus.focus();
        return true;
    }
    function safeURL(value) { try { var url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : ""; } catch (_) { return ""; } }
    function showPreview(s) {
        var target = s.dialog.querySelector(".sr-preview"), data = current(s);
        target.innerHTML = '<h3>Prévia dos dados atuais</h3><p>Esta prévia inclui alterações ainda não salvas.</p><dl>' + fields.map(function (field) { return '<dt>' + esc(field[1]) + '</dt><dd>' + esc((field[0] === "category" ? categories[data.category] || data.category : data[field[0]]) || "—") + '</dd>'; }).join("") + '</dl>';
        var photos = s.dialog.querySelector(".sr-media").cloneNode(true);
        photos.removeAttribute("class"); photos.className = "sr-media";
        target.appendChild(photos);
        target.hidden = false;
        target.focus();
    }
    function fieldMap(source) {
        var result = {};
        if (Array.isArray(source)) source.forEach(function (item) { if (item && item.field) result[item.field] = item.message || item.value || item.suggestion || "Valor inválido."; });
        else if (source && typeof source === "object") Object.keys(source).forEach(function (key) { var item = source[key]; result[key] = item && typeof item === "object" ? item.message || item.value || item.suggestion : item; });
        return result;
    }
    function validate(s, focusError) {
        var report = window.EstablishmentModeration.validate(current(s));
        var errors = fieldMap(report.errors), suggestions = fieldMap(report.suggestions);
        fields.forEach(function (field) {
            var key = field[0], input = s.dialog.querySelector('[name="' + key + '"]'), box = s.dialog.querySelector('#sr-error-' + key), suggestion = s.dialog.querySelector('[data-suggestion="' + key + '"]');
            input.setAttribute("aria-invalid", String(!!errors[key]));
            box.textContent = errors[key] || "";
            suggestion.replaceChildren();
            var candidate = suggestions[key];
            if (!candidate && key === "website" && input.value.trim() && !/^https:\/\//i.test(input.value.trim())) candidate = "https://" + input.value.trim().replace(/^http:\/\//i, "");
            if (candidate && safeURL(candidate) && editable(s)) {
                var button = document.createElement("button"); button.type = "button"; button.className = "btn-secondary"; button.textContent = "Usar " + candidate;
                button.addEventListener("click", function () { input.value = candidate; validate(s, false); message(s, "Sugestão aplicada à ficha. Salve para registrar a correção."); });
                suggestion.appendChild(button);
            }
        });
        if (!report.valid && focusError) { var first = s.dialog.querySelector('[aria-invalid="true"]'); if (first) first.focus(); message(s, "Revise os campos indicados antes de continuar.", true); }
        return report.valid;
    }
    async function history(s) {
        var target = s.dialog.querySelector(".sr-history");
        if (!admin()) { target.textContent = "Histórico restrito a administradores ativos."; return; }
        target.textContent = "Carregando histórico…";
        try {
            var snapshot = await s.ref.collection("history").orderBy("revision", "desc").limit(50).get();
            if (active !== s) return;
            target.innerHTML = snapshot.empty ? '<p>Nenhuma alteração de moderação registrada.</p>' : snapshot.docs.map(function (doc) {
                return historyEntry(s, doc.data());
            }).join("");
            target.insertAdjacentHTML("beforeend", "<p>Exibidas até 50 revisões mais recentes.</p>");
        } catch (_) { if (active === s) target.textContent = "Não foi possível carregar o histórico. As demais informações da ficha continuam disponíveis."; }
    }
    async function media(s) {
        var target = s.dialog.querySelector(".sr-media");
        var images = Array.isArray(s.raw.images) ? s.raw.images.slice() : [];
        if (!images.length && (s.raw.mainImage || s.raw.image)) images.push(s.raw.mainImage || s.raw.image);
        target.replaceChildren();
        if (!images.length) { target.textContent = "Nenhuma imagem anexada."; return; }
        await Promise.all(images.map(async function (raw, index) {
            var item = typeof raw === "string" ? (safeURL(raw) ? { url: raw } : { path: raw }) : raw || {};
            var figure = document.createElement("figure"), caption = document.createElement("figcaption");
            caption.textContent = "Imagem " + (index + 1) + (index === 0 ? " · Capa (primeira imagem enviada)" : "") + " · Ordem " + (item.position != null ? item.position : index + 1) + (item.name ? " · " + item.name : "") + (item.caption ? " · Legenda: " + item.caption : "") + (item.credit ? " · Crédito: " + item.credit : "");
            figure.appendChild(caption); target.appendChild(figure);
            try {
                var path = item.path || item.storagePath;
                var url = path && ctx().storage ? await ctx().storage.ref(path).getDownloadURL() : safeURL(item.url || item.downloadURL || "");
                if (active !== s) return;
                if (!safeURL(url)) throw new Error("URL indisponível");
                var link = document.createElement("a"), image = document.createElement("img");
                link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer";
                image.src = url; image.alt = item.alt || "Imagem enviada " + (index + 1); image.loading = "lazy";
                image.addEventListener("error", function () { image.remove(); caption.textContent += " · Prévia indisponível"; });
                link.appendChild(image); figure.prepend(link);
            } catch (_) { caption.textContent += " · Prévia indisponível; arquivo original preservado."; }
        }));
    }
    async function load(s) {
        var snapshot = await s.ref.get();
        if (active !== s) return;
        if (!snapshot.exists) { var missing = new Error("Solicitação não encontrada."); missing.code = "moderation/not-found"; throw missing; }
        s.raw = snapshot.data();
        s.linkedCmsStatus = "";
        if (s.raw.cmsEstablishmentId && admin()) {
            try {
                var linked = await ctx().db.collection("cms_establishments").doc(s.raw.cmsEstablishmentId).get();
                if (active !== s) return;
                s.linkedCmsStatus = linked.exists ? linked.data().status : "missing";
            } catch (_) { s.linkedCmsStatus = "unavailable"; }
        }
        s.revision = s.raw.moderation && s.raw.moderation.revision || 0;
        var effective = window.EstablishmentModeration.effective(s.raw);
        s.base = {};
        fields.forEach(function (field) {
            var input = s.dialog.querySelector('[name="' + field[0] + '"]'), selected = value(effective, field[0]);
            if (field[0] === "category") { input.innerHTML = categoryOptions(selected); input.disabled = !editable(s); }
            else input.readOnly = !editable(s);
            input.value = selected;
            s.base[field[0]] = input.value;
        });
        s.dialog.querySelector('[name="reviewNotes"]').value = "";
        s.dialog.querySelector('[name="reviewNotes"]').readOnly = !editable(s) && !canReject(Object.assign({}, s, { loaded: true }));
        s.dialog.querySelector(".sr-record-status").textContent = "Situação: " + (statusNames[s.raw.status] || s.raw.status || "Pendente") + " · Revisão " + s.revision;
        s.dialog.querySelector(".sr-metadata").textContent = JSON.stringify(s.raw, null, 2);
        var moderation = s.raw.moderation || {};
        var updates = [moderation.updatedAt, s.raw.updatedAt, s.raw.reviewedAt].filter(function (entry) { return Number.isFinite(timeMillis(entry)); }).sort(function (a, b) { return timeMillis(b) - timeMillis(a); });
        s.dialog.querySelector(".sr-identification").innerHTML = '<dl><dt>Identificação da solicitação</dt><dd>' + esc(s.id) + '</dd><dt>Enviada em</dt><dd>' + esc(dateLabel(s.raw.submittedAt || s.raw.createdAt)) + '</dd><dt>Solicitante</dt><dd>' + esc(s.raw.submittedByName || s.raw.userName || s.raw.contactName || s.raw.responsavel || "Nome não informado") + '<br>' + esc(s.raw.submittedByEmail || s.raw.userEmail || s.raw.email || "E-mail não informado") + '</dd><dt>Última alteração</dt><dd>' + esc(dateLabel(updates[0])) + '</dd></dl>';
        s.dialog.querySelector('[data-action="draft"]').hidden = !s.raw.cmsEstablishmentId || !admin();
        s.dialog.querySelector('[data-action="approve"]').textContent = s.raw.cmsImportState && canApprove(Object.assign({}, s, { loaded: true })) ? "Retomar criação do rascunho" : "Aprovar e criar rascunho";
        s.dialog.querySelector(".sr-preview").hidden = true;
        s.loaded = true;
        validate(s, false);
        busy(s, false);
        message(s, editable(s) ? "Ficha carregada. Salvar correções não aprova nem publica." : canApprove(s) ? "A criação do rascunho foi iniciada. Os dados estão bloqueados para edição; use Retomar criação do rascunho para continuar." : canReject(s) ? "Ficha disponível para consulta. Você pode rejeitar esta solicitação pendente informando uma justificativa; edição e aprovação exigem administrador ativo." : "Consulta somente leitura. A edição requer administrador ativo e uma solicitação sem importação iniciada.");
        void media(s); void history(s);
    }
    function errorMessage(error) {
        var messages = { "moderation/conflict": "Esta ficha mudou em outra sessão. Seu texto foi preservado. Copie suas alterações antes de fechar e reabrir a ficha para comparar com a revisão atual.", "moderation/locked": "A importação desta solicitação já foi iniciada. As alterações locais foram preservadas; revise o rascunho no Catálogo editorial.", "moderation/invalid": "Há dados inválidos. Revise os campos indicados.", "moderation/not-found": "A solicitação não foi encontrada.", "permission-denied": "Seu usuário não tem permissão para esta operação." };
        return messages[error && error.code] || "Não foi possível concluir. Os dados locais foram preservados. Verifique sua conexão e consulte a ficha novamente antes de repetir a ação.";
    }
    async function act(s, action) {
        if (s.busy || !s.loaded) return;
        if (action === "preview") { showPreview(s); return; }
        if (action === "draft") {
            var existingId = s.raw.cmsEstablishmentId;
            if (!existingId || !close()) return;
            await openDraft(existingId);
            return;
        }
        if (action === "approve" ? !canApprove(s) : action === "rejeitado" ? !canReject(s) : !editable(s)) { message(s, "Seu perfil ou a situação desta solicitação não permite esta operação.", true); return; }
        var resuming = action === "approve" && !!s.raw.cmsImportState;
        var notes = s.dialog.querySelector('[name="reviewNotes"]').value.trim();
        if (action !== "approve" && !notes) { message(s, "Informe a justificativa para registrar esta alteração no histórico.", true); s.dialog.querySelector('[name="reviewNotes"]').focus(); return; }
        if (action === "approve" && s.raw.status === "correcao_solicitada") { message(s, "Retome a revisão antes de aprovar uma solicitação com correção solicitada.", true); return; }
        if (!resuming && action !== "save" && JSON.stringify(current(s)) !== JSON.stringify(s.base)) { message(s, "Salve as correções dos campos antes de alterar a situação ou aprovar.", true); return; }
        if ((action === "save" || action === "approve" && !resuming) && !validate(s, true)) return;
        if (action === "approve" && !window.confirm(resuming ? "Retomar a criação do rascunho no Catálogo editorial? A publicação no portal é uma etapa separada." : "Aprovar esta solicitação e criar um rascunho no Catálogo editorial? A publicação no portal é uma etapa separada.")) return;
        busy(s, true); message(s, "Processando… Aguarde a confirmação.");
        try {
            var options = { db: ctx().db, id: s.id, uid: ctx().currentUser.uid, expectedRevision: s.revision, notes: notes };
            if (action === "approve") {
                var result = await window.FirebaseSystem.approveEstablishment(s.id, notes);
                if (!result || !result.success) {
                    var failure = result && result.message || "Não foi possível aprovar a solicitação.";
                    s.loaded = false;
                    try { await load(s); message(s, failure, true); }
                    catch (_) { s.loaded = false; message(s, failure + " Não foi possível atualizar a ficha. Feche e reabra antes de outra ação.", true); }
                    return;
                }
                var cmsId = result.cmsEstablishmentId || result.id || (result.item && result.item.id);
                s.loaded = false; busy(s, false); close();
                refreshList();
                if (cmsId) await openDraft(cmsId);
                if (ctx().toast) ctx().toast(result.message || "Rascunho criado. Revise antes de publicar.", "success");
                return;
            }
            if (action === "save") { options.changes = current(s); await window.EstablishmentModeration.save(options); }
            else { options.status = action; await window.EstablishmentModeration.decide(options); }
            // A escrita foi confirmada: não reapresente os dados antigos como se ainda estivessem pendentes.
            s.loaded = false;
            try { await load(s); message(s, action === "save" ? "Correções salvas. Nenhuma aprovação ou publicação foi realizada." : "Situação atualizada. A justificativa está registrada no histórico."); }
            catch (_) { message(s, "Alteração confirmada, mas a releitura falhou. Feche e reabra a ficha antes de outra ação.", true); }
            refreshList();
        } catch (error) {
            if (action === "approve") {
                s.loaded = false;
                try { await load(s); message(s, errorMessage(error), true); }
                catch (_) { s.loaded = false; message(s, errorMessage(error) + " Feche e reabra a ficha antes de outra ação.", true); }
            } else message(s, errorMessage(error), true);
        }
        finally { if (active === s) busy(s, false); }
    }
    function refreshList() {
        if (typeof window.loadPendingData === "function") Promise.resolve().then(function () { return window.loadPendingData(); }).then(function () { if (typeof window.loadDashboardData === "function") return window.loadDashboardData(); }).catch(function () { if (ctx().toast) ctx().toast("A alteração foi concluída. Atualize a lista para consultar a situação atual.", "warning"); });
    }
    async function openDraft(id) {
        if (typeof window.showSection === "function") window.showSection("empreendimentos");
        var module = window.AdminEstablishmentsModule;
        if (module && admin()) {
            try { await module.refresh(); module.openForm(id); }
            catch (_) { if (ctx().toast) ctx().toast("Rascunho disponível no Catálogo editorial. Atualize a lista de Empreendimentos para abrir a edição.", "warning"); }
        }
    }
    async function open(id) {
        if (!close()) return;
        if (!id || typeof id !== "string" || id.indexOf("/") !== -1) return;
        var dialog = document.createElement("dialog"); dialog.className = "submission-review";
        dialog.setAttribute("aria-labelledby", "sr-title");
        dialog.innerHTML = '<header><h2 id="sr-title">Revisar solicitação de empreendimento</h2><button type="button" data-close aria-label="Fechar ficha">Fechar</button></header>' +
            '<p class="sr-record-status"></p><p class="sr-status" role="status" aria-live="polite" aria-atomic="true">Carregando ficha…</p><section class="sr-identification" aria-label="Identificação e envio da solicitação"></section>' +
            '<form novalidate><div class="sr-fields">' + fields.map(renderField).join("") + '</div>' +
            '<label for="sr-notes">Observação / justificativa (obrigatória ao salvar ou alterar a situação)</label><textarea id="sr-notes" name="reviewNotes" rows="3" maxlength="2000" readonly></textarea>' +
            '<div class="sr-actions"><button type="submit" data-write="true">Salvar correções sem aprovar</button><button type="button" data-action="preview">Prévia</button><button type="button" data-action="em_analise" data-write="true">Em análise</button><button type="button" data-action="pendente" data-write="true">Retomar revisão</button><button type="button" data-action="correcao_solicitada" data-write="true">Solicitar correção</button><button type="button" data-action="rejeitado" data-write="true">Rejeitar</button><button type="button" data-action="approve" data-write="true">Aprovar e criar rascunho</button><button type="button" data-action="draft" hidden>Abrir rascunho no Catálogo editorial</button></div></form>' +
            '<section class="sr-preview" tabindex="-1" hidden></section><section><h3>Imagens enviadas</h3><div class="sr-media">Carregando…</div></section><details><summary>Dados originais e metadados da solicitação</summary><pre class="sr-metadata"></pre></details><details><summary>Histórico de moderação</summary><div class="sr-history"></div></details>';
        var s = { id: id, dialog: dialog, loaded: false, raw: {}, busy: true, returnFocus: document.activeElement };
        active = s;
        s.unload = function (event) { if (s.busy || dirty(s)) { event.preventDefault(); event.returnValue = ""; } };
        document.body.appendChild(dialog);
        dialog.querySelector('[data-close]').addEventListener("click", close);
        dialog.addEventListener("cancel", function (event) { event.preventDefault(); close(); });
        dialog.querySelector("form").addEventListener("submit", function (event) { event.preventDefault(); void act(s, "save"); });
        dialog.querySelectorAll("[data-action]").forEach(function (button) { button.addEventListener("click", function () { void act(s, button.dataset.action); }); });
        dialog.querySelector("form").addEventListener("input", function () { if (s.loaded) message(s, "Há alterações locais. Salve as correções antes de aprovar."); });
        window.addEventListener("beforeunload", s.unload);
        dialog.showModal(); busy(s, true);
        try {
            if (!ctx().db || !window.EstablishmentModeration) throw new Error("Serviço indisponível");
            s.ref = ctx().db.collection("estabelecimentos_pendentes").doc(id);
            await load(s);
        } catch (error) { busy(s, false); message(s, errorMessage(error), true); }
    }
    window.AdminSubmissionReview = { open: open, close: close };
})();
