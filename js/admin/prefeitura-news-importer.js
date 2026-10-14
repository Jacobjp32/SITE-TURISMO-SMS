// Tela "Notícias da Prefeitura" do painel: busca a fonte oficial, mostra a
// classificação Cultura e Turismo, deduplica contra a coleção `noticias` e
// importa como rascunho apenas o que o administrador marcar.
(function () {
    "use strict";

    var SNAPSHOT_URL = "data/noticias-prefeitura.json";
    var STATE_LABEL = {
        nova: "Nova",
        existente: "Já no CMS",
        atualizada: "Atualizada na Prefeitura",
        conflito: "Atualizada + editada no CMS",
        vinculada: "Já ligada a outra notícia"
    };
    var DECISION_TONE = { elegivel: "badge-success", revisao: "badge-warning", descartada: "badge-info" };

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function safeImageUrl(url) {
        return /^https:\/\/www\.saomateusdosul\.pr\.gov\.br\/fotos\/[\w.-]+$/i.test(String(url || "")) ? url : "";
    }

    function safeSourceUrl(url) {
        return /^https:\/\/www\.saomateusdosul\.pr\.gov\.br\/portal\/noticias\//i.test(String(url || "")) ? url : "";
    }

    function formatDate(iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return "Sem data";
        return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    }

    function notify(message, type) {
        if (window.AdminFeedback) return window.AdminFeedback.toast(message, type);
        alert(message);
    }

    function cms() { return window.AdminContentCMS; }
    function api() { return window.PrefeituraNews; }

    var Importer = {
        state: null,
        filter: "elegivel",
        busy: false,

        open: function () {
            if (!api() || !cms()) return notify("O importador não carregou. Recarregue o painel.", "error");
            cms().openModal("Notícias da Prefeitura", this.renderShell());
            this.bind();
            this.refresh();
        },

        // Um único par de ouvintes no corpo do modal; só reage quando a tela do importador está aberta.
        bind: function () {
            var body = document.getElementById("contentModalBody");
            if (!body || body.dataset.pnBound === "true") return;
            body.dataset.pnBound = "true";
            var self = this;
            body.addEventListener("click", function (event) {
                if (!body.querySelector("[data-pn-root]")) return;
                var el = event.target.closest && event.target.closest("[data-pn-action]");
                if (!el || !body.contains(el)) return;
                var action = el.getAttribute("data-pn-action");
                if (action === "refresh") self.refresh();
                if (action === "filter") { self.filter = el.getAttribute("data-pn-filter"); self.renderList(); }
                if (action === "import") self.importSelected();
                if (action === "select-eligible") self.selectEligible();
            });
            body.addEventListener("change", function (event) {
                if (!body.querySelector("[data-pn-root]")) return;
                if (event.target.matches && event.target.matches("[data-pn-pick], [data-pn-overwrite]")) self.updateFooter();
            });
        },

        renderShell: function () {
            return '<div class="admin-modal-body pn-root" data-pn-root>' +
                '<p class="admin-helper-text">Busca as publicações do portal oficial da Prefeitura e separa automaticamente o que é <strong>Cultura e Turismo</strong>. ' +
                'Nada é publicado: as notícias marcadas entram no CMS como <strong>rascunho</strong> para revisão.</p>' +
                '<div class="pn-status" data-pn-status aria-live="polite"><div class="loading">Consultando a Prefeitura…</div></div>' +
                '<div class="pn-tabs" role="tablist" data-pn-tabs></div>' +
                '<div class="pn-list" data-pn-list></div>' +
                '</div>' +
                '<div class="admin-modal-footer">' +
                '<span class="pn-footer-count" data-pn-count></span>' +
                '<button class="btn-secondary" type="button" data-pn-action="refresh">Buscar de novo</button>' +
                '<button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Fechar</button>' +
                '<button class="btn-primary" type="button" data-pn-action="import" disabled>Importar selecionadas</button>' +
                '</div>';
        },

        // 1) Consulta ao vivo pela função do Firebase; 2) cópia publicada com o site.
        fetchSource: async function () {
            var live = await this.fetchLive().catch(function (error) { return { error: error }; });
            if (live && live.collected) return live;
            var snapshot = await this.fetchSnapshot().catch(function () { return null; });
            if (snapshot) {
                snapshot.liveError = live && live.error ? describeError(live.error) : "";
                return snapshot;
            }
            throw new Error(live && live.error ? describeError(live.error) : "Nenhuma fonte disponível.");
        },

        fetchLive: async function () {
            if (!window.firebase || typeof window.firebase.app !== "function" || typeof window.firebase.app().functions !== "function") {
                return { error: new Error("Funções do Firebase indisponíveis nesta página.") };
            }
            var functions = window.firebase.app().functions("southamerica-east1");
            if (window.__SMSFirebaseEmulatorsConnected && !window.__SMSFunctionsEmulatorConnected) {
                functions.useEmulator("127.0.0.1", 5001);
                window.__SMSFunctionsEmulatorConnected = true;
            }
            var callable = functions.httpsCallable("prefeituraFeed", { timeout: 70000 });
            var fetchMany = async function (paths) {
                var out = {};
                for (var i = 0; i < paths.length; i += 60) {
                    var chunk = paths.slice(i, i + 60);
                    var response = await callable({ paths: chunk });
                    Object.assign(out, (response && response.data && response.data.results) || {});
                }
                return out;
            };
            var collected = await api().collect(fetchMany);
            if (!collected.items.length && collected.errors.length) {
                return { error: new Error("A Prefeitura não respondeu (" + collected.errors.length + " falha(s) de consulta).") };
            }
            return { collected: collected, mode: "live" };
        },

        fetchSnapshot: async function () {
            var response = await fetch(SNAPSHOT_URL + "?t=" + Date.now(), { cache: "no-store" });
            if (!response.ok) throw new Error("Cópia local indisponível.");
            var data = await response.json();
            if (!data || !Array.isArray(data.items)) throw new Error("Cópia local inválida.");
            // Reclassifica com as regras atuais do painel.
            data.items.forEach(function (item) { item.classificacao = api().classify(item); });
            return { collected: data, mode: "snapshot" };
        },

        refresh: async function () {
            if (this.busy) return;
            this.busy = true;
            this.setStatus('<div class="loading">Consultando a Prefeitura…</div>');
            try {
                var source = await this.fetchSource();
                var existing = await this.loadExisting();
                var plan = api().planImport(source.collected.items, existing);
                this.state = { source: source, plan: plan, summary: api().summarize(source.collected, plan) };
                if (!this.countFor(this.filter)) this.filter = "todas";
                this.renderStatus();
                this.renderList();
            } catch (error) {
                console.error("[prefeitura-news] Falha ao buscar notícias.", error);
                this.state = null;
                this.setStatus('<p class="pn-error">Não foi possível buscar as notícias da Prefeitura: ' + escapeHtml(error.message || "erro desconhecido") +
                    '. Verifique a conexão e tente “Buscar de novo”. Nada foi importado.</p>');
                this.renderList();
            } finally {
                this.busy = false;
                this.updateFooter();
            }
        },

        loadExisting: async function () {
            var db = cms().db;
            if (!db) throw new Error("Sem conexão com o banco do CMS");
            var snapshot = await db.collection("noticias").get();
            return snapshot.docs.map(function (doc) { return Object.assign({}, doc.data(), { id: doc.id }); });
        },

        countFor: function (filter) {
            if (!this.state) return 0;
            return this.state.plan.filter(function (row) {
                return filter === "todas" || row.item.classificacao.decision === filter;
            }).length;
        },

        setStatus: function (html) {
            var el = document.querySelector("[data-pn-status]");
            if (el) el.innerHTML = html;
        },

        renderStatus: function () {
            var s = this.state.summary;
            var src = this.state.source;
            var origin = src.mode === "live"
                ? "Consulta ao vivo ao portal da Prefeitura agora"
                : "Cópia publicada com o site, coletada em " + formatDate(src.collected.fetchedAt) +
                  (src.liveError ? " (consulta ao vivo indisponível: " + escapeHtml(src.liveError) + ")" : "");
            var errors = (src.collected.errors || []).length;
            var states = s.estados || {};
            this.setStatus(
                '<p class="pn-origin"><strong>Fonte:</strong> ' + origin + '.' + (errors ? ' <span class="pn-warn">' + errors + ' página(s) da Prefeitura não responderam.</span>' : '') + '</p>' +
                '<ul class="pn-metrics">' +
                    '<li><strong>' + s.encontradas + '</strong> encontradas</li>' +
                    '<li><strong>' + s.elegiveis + '</strong> Cultura e Turismo</li>' +
                    '<li><strong>' + s.revisao + '</strong> para revisão</li>' +
                    '<li><strong>' + s.descartadas + '</strong> fora do escopo</li>' +
                    '<li><strong>' + ((states.existente || 0) + (states.vinculada || 0)) + '</strong> já no CMS</li>' +
                    '<li><strong>' + (states.nova || 0) + '</strong> novas</li>' +
                '</ul>');
            var tabs = [["elegivel", "Cultura e Turismo"], ["revisao", "Revisão"], ["descartada", "Fora do escopo"], ["todas", "Todas"]];
            var self = this;
            document.querySelector("[data-pn-tabs]").innerHTML = tabs.map(function (t) {
                return '<button type="button" role="tab" class="pn-tab' + (self.filter === t[0] ? ' is-active' : '') + '" aria-selected="' + (self.filter === t[0]) + '" data-pn-action="filter" data-pn-filter="' + t[0] + '">' +
                    t[1] + ' <span>' + self.countFor(t[0]) + '</span></button>';
            }).join("") + '<button type="button" class="pn-tab pn-tab-tool" data-pn-action="select-eligible">Marcar novas de Cultura e Turismo</button>';
        },

        renderList: function () {
            var list = document.querySelector("[data-pn-list]");
            if (!list) return;
            if (!this.state) { list.innerHTML = ""; this.updateFooter(); return; }
            this.renderStatus();
            var filter = this.filter;
            var rows = this.state.plan.filter(function (row) {
                return filter === "todas" || row.item.classificacao.decision === filter;
            });
            if (!rows.length) {
                list.innerHTML = '<p class="admin-helper-text">Nenhuma notícia nesta lista.</p>';
                this.updateFooter();
                return;
            }
            var now = Date.now();
            list.innerHTML = rows.map(function (row) {
                var item = row.item;
                var c = item.classificacao;
                var index = this.state.plan.indexOf(row);
                var importable = row.state === "nova" || row.state === "atualizada" || row.state === "conflito";
                var checked = row._picked != null ? row._picked : (c.decision === "elegivel" && (row.state === "nova" || row.state === "atualizada"));
                var future = new Date(item.publishedAt).getTime() > now;
                var img = safeImageUrl(item.imagem);
                var link = safeSourceUrl(item.link);
                return '<article class="pn-item pn-' + c.decision + '">' +
                    '<label class="pn-pick">' +
                        '<input type="checkbox" data-pn-pick="' + index + '"' + (importable ? "" : " disabled") + (importable && checked ? " checked" : "") +
                        ' aria-label="Selecionar ' + escapeHtml(item.titulo) + '">' +
                    '</label>' +
                    (img ? '<img class="pn-thumb" src="' + escapeHtml(img) + '" alt="" loading="lazy">' : '<div class="pn-thumb pn-thumb-empty">Sem foto</div>') +
                    '<div class="pn-main">' +
                        '<h3>' + escapeHtml(item.titulo) + '</h3>' +
                        '<p class="pn-meta">' + escapeHtml(formatDate(item.publishedAt)) + (future ? ' · <span class="pn-warn">data futura na origem</span>' : '') +
                            ' · ' + escapeHtml((item.categorias || []).join(", ") || "Sem categoria") + '</p>' +
                        '<p class="pn-summary">' + escapeHtml(item.resumo || String(item.conteudo || "").slice(0, 220)) + '</p>' +
                        '<details><summary>Por que ' + escapeHtml(c.label.toLowerCase()) + '</summary><ul>' +
                            c.reasons.map(function (r) { return '<li>' + escapeHtml(r) + '</li>'; }).join("") + '</ul></details>' +
                        '<p class="pn-badges"><span class="badge ' + DECISION_TONE[c.decision] + '">' + escapeHtml(c.label) + '</span> ' +
                            '<span class="badge badge-info">' + escapeHtml(STATE_LABEL[row.state]) + '</span>' +
                            (link ? ' <a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">Ver na Prefeitura</a>' : '') + '</p>' +
                        (row.state === "conflito" ? '<label class="pn-overwrite"><input type="checkbox" data-pn-overwrite="' + index + '"> Sobrescrever a edição feita no CMS</label>' : '') +
                        '<p class="pn-detail">' + escapeHtml(row.detail) + '</p>' +
                    '</div>' +
                '</article>';
            }, this).join("");
            this.updateFooter();
        },

        selectedRows: function () {
            if (!this.state) return [];
            var plan = this.state.plan;
            Array.prototype.forEach.call(document.querySelectorAll("[data-pn-pick]"), function (box) {
                plan[Number(box.getAttribute("data-pn-pick"))]._picked = box.checked;
            });
            Array.prototype.forEach.call(document.querySelectorAll("[data-pn-overwrite]"), function (box) {
                plan[Number(box.getAttribute("data-pn-overwrite"))]._overwrite = box.checked;
            });
            return plan.filter(function (row) {
                var picked = row._picked != null ? row._picked
                    : (row.item.classificacao.decision === "elegivel" && (row.state === "nova" || row.state === "atualizada"));
                if (!picked) return false;
                if (row.state === "conflito") return row._overwrite === true;
                return row.state === "nova" || row.state === "atualizada";
            });
        },

        selectEligible: function () {
            if (!this.state) return;
            this.state.plan.forEach(function (row) {
                row._picked = row.item.classificacao.decision === "elegivel" && (row.state === "nova" || row.state === "atualizada");
            });
            this.renderList();
        },

        updateFooter: function () {
            var count = this.selectedRows().length;
            var button = document.querySelector('[data-pn-action="import"]');
            var label = document.querySelector("[data-pn-count]");
            if (button) {
                button.disabled = !count || this.busy;
                button.textContent = count ? "Importar " + count + " selecionada(s) como rascunho" : "Importar selecionadas";
            }
            if (label) label.textContent = count ? count + " selecionada(s)" : "Nenhuma selecionada";
        },

        importSelected: async function () {
            var rows = this.selectedRows();
            if (!rows.length || this.busy) return;
            var outOfScope = rows.filter(function (row) { return row.item.classificacao.decision !== "elegivel"; }).length;
            var confirmOptions = {
                title: "Importar " + rows.length + " notícia(s)?",
                message: "Entram no CMS como rascunho — nada vai ao ar até você publicar.",
                details: [
                    rows.filter(function (r) { return r.state === "nova"; }).length + " nova(s), " +
                    rows.filter(function (r) { return r.state !== "nova"; }).length + " atualização(ões) de conteúdo já importado."
                ].concat(outOfScope ? [outOfScope + " selecionada(s) fora da lista Cultura e Turismo, por escolha sua."] : []),
                confirmLabel: "Importar como rascunho"
            };
            var confirmed = window.AdminFeedback ? await window.AdminFeedback.confirm(confirmOptions) : confirm(confirmOptions.title);
            if (!confirmed) return;

            var db = cms().db;
            this.busy = true;
            this.updateFooter();
            var created = 0;
            var updated = 0;
            var skipped = 0;
            try {
                // Revalida contra o estado atual do CMS antes de gravar (outra aba pode ter importado).
                var freshPlan = api().planImport(rows.map(function (r) { return r.item; }), await this.loadExisting());
                var now = window.firebase.firestore.FieldValue.serverTimestamp();
                var adminId = window.firebase.auth && window.firebase.auth().currentUser ? window.firebase.auth().currentUser.uid : "";
                var batch = db.batch();
                freshPlan.forEach(function (row, i) {
                    var overwrite = rows[i]._overwrite === true;
                    var ref = db.collection("noticias").doc(row.docId);
                    if (row.state === "nova") {
                        batch.set(ref, api().buildNewDoc(row.item, { createdAt: now, updatedAt: now, updatedBy: adminId, origemImportadoEm: now }));
                        created += 1;
                    } else if (row.state === "atualizada" || (row.state === "conflito" && overwrite)) {
                        batch.set(ref, api().buildUpdatePatch(row.item, { updatedAt: now, updatedBy: adminId, origemImportadoEm: now }), { merge: true });
                        updated += 1;
                    } else {
                        skipped += 1;
                    }
                });
                if (created + updated) await batch.commit();
            } catch (error) {
                console.error("[prefeitura-news] Falha ao importar.", error);
                notify("A importação falhou e nada foi gravado. Tente novamente.", "error");
                this.busy = false;
                this.updateFooter();
                return;
            }
            this.busy = false;
            if (!created && !updated) {
                notify("Nenhuma notícia foi importada: todas já estavam no CMS (" + skipped + ").", "info");
            } else {
                notify(created + " notícia(s) criada(s) e " + updated + " atualizada(s) como rascunho." + (skipped ? " " + skipped + " já existia(m) e foi(ram) ignorada(s)." : ""), "success");
            }
            if (typeof cms().loadNews === "function") cms().loadNews();
            await this.refresh();
        }
    };

    function describeError(error) {
        var code = error && error.code ? String(error.code).replace(/^functions\//, "") : "";
        if (code === "permission-denied") return "seu usuário não é administrador ativo";
        if (code === "unauthenticated") return "sessão expirada";
        if (code === "not-found" || code === "internal" || code === "unavailable") return "serviço de consulta não publicado ou indisponível";
        if (code === "deadline-exceeded") return "a Prefeitura demorou demais para responder";
        return (error && error.message) || "falha desconhecida";
    }

    window.PrefeituraNewsImporter = Importer;
})();
