/**
 * modules/dashboard.js — Painel “O que precisa da sua atenção” (shell v2)
 * ----------------------------------------------------------------------
 * Responde à pergunta do administrador ao abrir o painel: o que exige ação hoje?
 *
 *  - SOMENTE LEITURA: usa as APIs de FirebaseSystem e leituras de coleção que o
 *    administrador ativo já faz nas outras seções (nenhuma coleção nova, nenhuma
 *    escrita, nenhuma alteração de Rules).
 *  - Cada fonte é independente: falha em uma não derruba as demais; o card
 *    afetado mostra o erro em vez de um número inventado.
 *  - Alimenta os contadores do menu lateral (AdminNav.setBadge).
 *  - Mantém os IDs legados (#stat-*) preenchidos para compatibilidade.
 *
 * IIFE, sem build step, sem import/export.
 */
(function () {
    "use strict";

    if (window.AdminDashboardModule) return;

    var SECTION_ID = "home";
    var DAY = 24 * 60 * 60 * 1000;
    // Centro aproximado do município: referência para alertar coordenadas fora da região.
    var MUNICIPIO = { lat: -25.874, lng: -50.383, raioKm: 45 };
    var activated = false;
    var inFlight = null;

    function $(id) { return document.getElementById(id); }

    function esc(value) {
        if (window.SMSecurity && typeof window.SMSecurity.html === "function") return window.SMSecurity.html(value, "");
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function setText(id, value) {
        var el = $(id);
        if (el) el.textContent = value;
    }

    function resolveApi(context) {
        if (context && context.api) return context.api;
        if (window.AdminContext && window.AdminContext.api) return window.AdminContext.api;
        return window.FirebaseSystem || null;
    }

    function getDb(context) {
        var ctx = context || window.AdminContext;
        try { return ctx && ctx.db ? ctx.db : (window.firebase ? window.firebase.firestore() : null); } catch (error) { return null; }
    }

    function toMillis(value) {
        if (!value) return 0;
        if (typeof value.toMillis === "function") return value.toMillis();
        if (typeof value.toDate === "function") { try { return value.toDate().getTime(); } catch (e) { return 0; } }
        if (typeof value.seconds === "number") return value.seconds * 1000;
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            var p = value.split("-");
            return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12).getTime();
        }
        var parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function startOfToday() {
        var d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    function plural(n, one, many) { return n === 1 ? one : many; }

    function distanceKm(a, b) {
        var R = 6371;
        var dLat = (b.lat - a.lat) * Math.PI / 180;
        var dLng = (b.lng - a.lng) * Math.PI / 180;
        var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * R * Math.asin(Math.sqrt(x));
    }

    // ---------- Fontes (cada uma devolve {ok, value} sem lançar) ----------
    function settle(promise) {
        return Promise.resolve(promise).then(
            function (value) { return { ok: true, value: value }; },
            function (error) { console.warn("[admin-dashboard] fonte indisponível.", error); return { ok: false, error: error }; }
        );
    }

    function readCollection(db, name) {
        if (!db) return Promise.reject(new Error("Firestore indisponível."));
        return db.collection(name).get().then(function (snap) {
            return snap.docs.map(function (doc) { return Object.assign({}, doc.data(), { id: doc.id }); });
        });
    }

    function fromReport(promise) {
        return Promise.resolve(promise).then(function (report) {
            if (!report || report.success !== true) throw (report && report.error) || new Error("Relatório indisponível.");
            return report.items || [];
        });
    }

    function isPendingRequest(status) {
        var s = String(status || "").toLowerCase();
        return s === "pending" || s === "pendente";
    }

    // ---------- Análises ----------
    function analyzeEstablishments(items) {
        var published = items.filter(function (i) { return i.status === "published"; });
        var stats = {
            total: items.length,
            published: published.length,
            drafts: items.filter(function (i) { return i.status === "draft"; }).length,
            archived: items.filter(function (i) { return i.status === "archived"; }).length,
            noCoords: 0, approxCoords: 0, unverifiedCoords: 0, verifiedCoords: 0, outOfRegion: 0,
            withImage: 0, withContact: 0, withSummary: 0
        };
        published.forEach(function (item) {
            var loc = item.location || {};
            var c = loc.coordinates || {};
            var hasCoords = typeof c.lat === "number" && typeof c.lng === "number";
            var status = String(loc.coordStatus || "").toLowerCase();
            if (!hasCoords) stats.noCoords += 1;
            else if (status === "ok" || status === "verified" || status === "verificada") stats.verifiedCoords += 1;
            else if (status === "aproximada" || status === "approximate") stats.approxCoords += 1;
            else stats.unverifiedCoords += 1;
            if (hasCoords && distanceKm(MUNICIPIO, c) > MUNICIPIO.raioKm) stats.outOfRegion += 1;

            var media = item.media || {};
            if (media.mainImage && media.mainImage.url) stats.withImage += 1;
            var k = item.contact || {};
            if (k.phone || k.whatsapp || k.website || k.instagram || k.facebook || k.email) stats.withContact += 1;
            var content = item.content || {};
            if (String(content.summary || content.description || "").trim().length >= 40) stats.withSummary += 1;
        });
        return stats;
    }

    function eventDate(e) {
        return toMillis(e && (e.dataInicio || e.data || e.date || e.startDate));
    }

    function eventEnd(e) {
        return toMillis(e && (e.dataFim || e.endDate)) || eventDate(e);
    }

    function isEventPublished(e) {
        if (!e) return false;
        if (e.publicado === false) return false;
        var status = String(e.status || "").toLowerCase();
        return !status || status === "aprovado" || status === "approved" || e.publicado === true;
    }

    function analyzeEvents(items) {
        var today = startOfToday();
        var published = items.filter(isEventPublished);
        var upcoming = published
            .filter(function (e) { return eventDate(e) >= today; })
            .sort(function (a, b) { return eventDate(a) - eventDate(b); });
        return {
            published: published.length,
            next30: upcoming.filter(function (e) { return eventDate(e) <= today + 30 * DAY; }).length,
            upcoming: upcoming,
            pastStillPublished: published.filter(function (e) {
                var end = eventEnd(e);
                return end && end < today - DAY && !e.recorrente && !e.recurring;
            }).length
        };
    }

    function analyzeNews(items) {
        var isPub = function (n) { return n.publicado === true || n.status === "publicado"; };
        var published = items.filter(isPub);
        var lastPublished = published.reduce(function (max, n) {
            return Math.max(max, toMillis(n.publishedAt || n.data || n.updatedAt));
        }, 0);
        return {
            published: published.length,
            drafts: items.filter(function (n) { return !isPub(n); }).length,
            daysSinceLast: lastPublished ? Math.floor((Date.now() - lastPublished) / DAY) : null
        };
    }

    function analyzeMedia(items) {
        return {
            total: items.length,
            noAlt: items.filter(function (m) { return !String(m.alt || "").trim(); }).length
        };
    }

    // ---------- Render ----------
    function taskHtml(task) {
        return '<li class="dash-task" data-tone="' + esc(task.tone) + '">' +
            '<span class="dash-task-icon" aria-hidden="true"><svg class="ico"><use href="#' + esc(task.icon) + '"/></svg></span>' +
            '<div><div class="dash-task-title"><span class="dash-task-count">' + esc(task.count) + '</span>' + esc(task.title) + '</div>' +
            '<div class="dash-task-desc">' + esc(task.desc) + '</div></div>' +
            '<a class="dash-task-cta" href="#' + esc(task.section) + '" data-goto="' + esc(task.section) + '"' +
            Object.keys(task.filters || {}).map(function (key) {
                return ' data-filter-' + esc(key) + '="' + esc(task.filters[key]) + '"';
            }).join("") + '>' +
            esc(task.cta || "Revisar") + '<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>' +
            '</li>';
    }

    function renderTasks(tasks, failures) {
        var list = $("dashTasks");
        if (!list) return;
        var weight = { urgent: 0, action: 1, review: 2 };
        var open = tasks.filter(function (t) { return t.count > 0; })
            .sort(function (a, b) { return (weight[a.tone] - weight[b.tone]) || (b.count - a.count); });
        var html = open.map(taskHtml).join("");
        if (!open.length && !failures.length) {
            html = '<li class="dash-empty"><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>Tudo em dia: nenhuma pendência de moderação ou conteúdo.</li>';
        }
        if (failures.length) {
            html += '<li class="dash-error" role="status">Não foi possível verificar: ' + esc(failures.join(", ")) +
                '. Os números dessas áreas não são exibidos para não induzir a erro.</li>';
        }
        list.innerHTML = html;
    }

    function meterHtml(label, value, total, note) {
        var pct = total ? Math.round((value / total) * 100) : 0;
        var level = pct >= 85 ? "high" : (pct >= 60 ? "mid" : "low");
        return '<li class="dash-meter" data-level="' + level + '">' +
            '<div class="dash-meter-row"><span class="dash-meter-label">' + esc(label) + '</span>' +
            '<span class="dash-meter-value">' + value + ' de ' + total + ' · ' + pct + '%</span></div>' +
            '<div class="dash-meter-track" role="progressbar" aria-label="' + esc(label) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '">' +
            '<span class="dash-meter-fill" style="width:' + pct + '%"></span></div>' +
            (note ? '<p class="dash-meter-note">' + esc(note) + '</p>' : '') +
            '</li>';
    }

    function renderHealth(est) {
        var list = $("dashMeters");
        if (!list) return;
        if (!est) {
            list.innerHTML = '<li class="dash-error">Catálogo de empreendimentos indisponível.</li>';
            return;
        }
        var n = est.published;
        if (!n) {
            list.innerHTML = '<li class="dash-agenda-empty">Nenhum empreendimento publicado ainda.</li>';
            return;
        }
        var coordNote = [];
        if (est.approxCoords) coordNote.push(est.approxCoords + " aproximada" + (est.approxCoords > 1 ? "s" : ""));
        if (est.unverifiedCoords) coordNote.push(est.unverifiedCoords + " sem verificação");
        if (est.noCoords) coordNote.push(est.noCoords + " sem coordenadas");
        if (est.outOfRegion) coordNote.push(est.outOfRegion + " fora da região do município");
        list.innerHTML =
            meterHtml("Localização verificada no mapa", est.verifiedCoords, n, coordNote.join(" · ")) +
            meterHtml("Com foto de capa", est.withImage, n) +
            meterHtml("Com algum contato", est.withContact, n) +
            meterHtml("Com descrição de pelo menos 40 caracteres", est.withSummary, n);
    }

    function renderAgenda(events) {
        var list = $("dashAgenda");
        if (!list) return;
        if (!events) {
            list.innerHTML = '<li class="dash-error">Agenda indisponível.</li>';
            return;
        }
        var next = events.upcoming.slice(0, 5);
        if (!next.length) {
            list.innerHTML = '<li class="dash-agenda-empty">Nenhum evento publicado com data futura.</li>';
            return;
        }
        list.innerHTML = next.map(function (e) {
            var d = new Date(eventDate(e));
            var month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
            var title = e.title || e.nome || "Evento sem título";
            var meta = [e.time || e.hora, e.local || e.location].filter(Boolean).join(" · ");
            return '<li><span class="dash-date"><b>' + d.getDate() + '</b><span>' + esc(month) + '</span></span>' +
                '<div><div class="dash-agenda-title" title="' + esc(title) + '">' + esc(title) + '</div>' +
                '<div class="dash-agenda-meta">' + esc(meta || "Horário e local a confirmar") + '</div></div></li>';
        }).join("");
    }

    function renderKpis(r) {
        setText("stat-estab-publicados", r.est ? String(r.est.published) : "—");
        setText("stat-eventos-proximos", r.events ? String(r.events.next30) : "—");
        setText("stat-noticias-publicadas", r.news ? String(r.news.published) : "—");
        setText("stat-midias", r.media ? String(r.media.total) : "—");
    }

    function badges(r) {
        if (!window.AdminNav || typeof window.AdminNav.setBadge !== "function") return;
        var approvals = (r.pendingEvents || 0) + (r.pendingEst || 0) + (r.updateRequests || 0);
        window.AdminNav.setBadge("aprovacoes", approvals, approvals + " item(ns) aguardando aprovação");
        window.AdminNav.setBadge("vinculos", r.claims || 0, (r.claims || 0) + " pedido(s) de vínculo");
        window.AdminNav.setBadge("noticias", r.news ? r.news.drafts : 0, r.news ? r.news.drafts + " rascunho(s)" : "");
        window.AdminNav.setBadge("eventos", r.events ? r.events.pastStillPublished : 0,
            r.events ? r.events.pastStillPublished + " evento(s) encerrado(s) ainda publicado(s)" : "");
        var est = r.est;
        var geo = est ? est.noCoords + est.outOfRegion : 0;
        window.AdminNav.setBadge("empreendimentos", geo, geo + " empreendimento(s) com localização a corrigir");
    }

    function buildTasks(r) {
        var tasks = [];
        if (r.pendingEvents != null) tasks.push({
            tone: "urgent", icon: "i-calendar", section: "aprovacoes", count: r.pendingEvents,
            title: plural(r.pendingEvents, "evento enviado aguarda aprovação", "eventos enviados aguardam aprovação"),
            desc: "Enviados pelo Portal do Usuário. Só aparecem no site depois de aprovados.", cta: "Moderar"
        });
        if (r.pendingEst != null) tasks.push({
            tone: "urgent", icon: "i-store", section: "aprovacoes", count: r.pendingEst,
            title: plural(r.pendingEst, "cadastro de empreendimento novo", "cadastros de empreendimentos novos"),
            desc: "Aprovar cria um rascunho privado no catálogo para revisão.", cta: "Moderar"
        });
        if (r.updateRequests != null) tasks.push({
            tone: "urgent", icon: "i-inbox", section: "aprovacoes", count: r.updateRequests,
            title: plural(r.updateRequests, "pedido de atualização de empreendimento", "pedidos de atualização de empreendimentos"),
            desc: "Alterações sugeridas por responsáveis vinculados.", cta: "Moderar"
        });
        if (r.claims != null) tasks.push({
            tone: "urgent", icon: "i-link", section: "vinculos", count: r.claims,
            title: plural(r.claims, "pedido de vínculo com empreendimento", "pedidos de vínculo com empreendimentos"),
            desc: "Usuários que se declaram responsáveis por um empreendimento.", cta: "Analisar"
        });
        if (r.events) tasks.push({
            tone: "action", icon: "i-calendar", section: "eventos", count: r.events.pastStillPublished,
            title: plural(r.events.pastStillPublished, "evento encerrado ainda publicado", "eventos encerrados ainda publicados"),
            desc: "Considere despublicar para manter a agenda do portal atual.", cta: "Ver eventos"
        });
        if (r.est) {
            var geo = r.est.noCoords + r.est.outOfRegion;
            tasks.push({
                tone: "action", icon: "i-pin", section: "empreendimentos", count: geo, filters: { status: "published", geo: "fix" },
                title: plural(geo, "empreendimento publicado com localização a corrigir", "empreendimentos publicados com localização a corrigir"),
                desc: "Sem coordenadas ou com ponto fora da região do município — não aparecem corretamente no mapa.", cta: "Corrigir"
            });
            tasks.push({
                tone: "review", icon: "i-pin", section: "empreendimentos", count: r.est.approxCoords + r.est.unverifiedCoords, filters: { status: "published", geo: "review" },
                title: "localizações aproximadas ou não verificadas",
                desc: "Use o verificador de mapa no editor para confirmar o ponto exato.", cta: "Verificar"
            });
            tasks.push({
                tone: "review", icon: "i-store", section: "empreendimentos", count: r.est.drafts, filters: { status: "draft" },
                title: plural(r.est.drafts, "empreendimento em rascunho", "empreendimentos em rascunho"),
                desc: "Rascunhos não aparecem no portal até serem publicados.", cta: "Ver rascunhos"
            });
        }
        if (r.news) {
            tasks.push({
                tone: "review", icon: "i-news", section: "noticias", count: r.news.drafts,
                title: plural(r.news.drafts, "notícia em rascunho", "notícias em rascunho"),
                desc: "Revise e publique, ou exclua o que não será usado.", cta: "Ver notícias"
            });
            if (r.news.daysSinceLast != null && r.news.daysSinceLast > 30) tasks.push({
                tone: "review", icon: "i-news", section: "noticias", count: r.news.daysSinceLast,
                title: "dias sem notícia nova publicada",
                desc: "A página de notícias pode parecer desatualizada para o visitante.", cta: "Escrever"
            });
        }
        if (r.media) tasks.push({
            tone: "review", icon: "i-image", section: "midia", count: r.media.noAlt,
            title: plural(r.media.noAlt, "imagem sem texto alternativo", "imagens sem texto alternativo"),
            desc: "O texto alternativo é lido por leitores de tela e melhora a acessibilidade.", cta: "Completar"
        });
        return tasks;
    }

    async function collect(context) {
        var api = resolveApi(context);
        var db = getDb(context);
        var sources = await Promise.all([
            settle(api && api.getPendingEventsReport ? fromReport(api.getPendingEventsReport()) : Promise.reject(new Error("API ausente"))),
            settle(api && api.getPendingEstablishmentsReport ? fromReport(api.getPendingEstablishmentsReport()) : Promise.reject(new Error("API ausente"))),
            settle(readCollection(db, "establishment_claims")),
            settle(readCollection(db, "establishment_update_requests")),
            settle(readCollection(db, "cms_establishments")),
            settle(readCollection(db, "eventos_aprovados")),
            settle(readCollection(db, "noticias")),
            settle(readCollection(db, "media_library")),
            settle(readCollection(db, "usuarios"))
        ]);
        var names = ["eventos pendentes", "cadastros pendentes", "pedidos de vínculo", "pedidos de atualização",
            "empreendimentos", "eventos publicados", "notícias", "biblioteca de mídia", "usuários"];
        var failures = [];
        sources.forEach(function (s, i) { if (!s.ok && i < 8) failures.push(names[i]); });
        var v = function (i) { return sources[i].ok ? sources[i].value : null; };
        return {
            failures: failures,
            pendingEvents: v(0) ? v(0).length : null,
            pendingEst: v(1) ? v(1).length : null,
            claims: v(2) ? v(2).filter(function (c) { return c.status === "pending"; }).length : null,
            updateRequests: v(3) ? v(3).filter(function (u) { return isPendingRequest(u.status); }).length : null,
            est: v(4) ? analyzeEstablishments(v(4)) : null,
            events: v(5) ? analyzeEvents(v(5)) : null,
            news: v(6) ? analyzeNews(v(6)) : null,
            media: v(7) ? analyzeMedia(v(7)) : null,
            users: v(8),
            approvedEventsTotal: v(5) ? v(5).length : null
        };
    }

    function fillLegacy(r) {
        setText("stat-usuarios", r.users ? String(r.users.length) : "-");
        setText("stat-pendentes", r.pendingEvents == null ? "Erro" : String(r.pendingEvents));
        setText("stat-aprovados", r.approvedEventsTotal == null ? "-" : String(r.approvedEventsTotal));
        setText("stat-estabelecimentos", r.pendingEst == null ? "-" : String(r.pendingEst));
    }

    function renderDate() {
        var el = $("currentDate");
        if (!el) return;
        var user = window.currentUser || {};
        var hour = new Date().getHours();
        var greet = hour < 12 ? "Bom dia" : (hour < 18 ? "Boa tarde" : "Boa noite");
        var name = String(user.nome || "").trim().split(/\s+/)[0];
        var date = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
        el.textContent = greet + (name ? ", " + name : "") + " · " + date;
    }

    var AdminDashboardModule = {
        // ---- Contrato de módulo ----
        id: SECTION_ID,
        label: "Painel",
        icon: "i-home",
        requiredRole: "admin",
        navGroup: "Visão geral",
        order: 10,

        render: function (container) {
            renderDate();
            return container || $("section-" + SECTION_ID);
        },

        load: function (context) {
            if (inFlight) return inFlight;
            var api = resolveApi(context);
            if (!api || (typeof api.isAdmin === "function" && !api.isAdmin())) return Promise.resolve(false);
            renderDate();
            var button = $("dashRefresh");
            if (button) button.disabled = true;
            inFlight = collect(context).then(function (r) {
                renderTasks(buildTasks(r), r.failures);
                renderKpis(r);
                renderHealth(r.est);
                renderAgenda(r.events);
                badges(r);
                fillLegacy(r);
                setText("dashUpdated", "Atualizado às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
                return true;
            }).catch(function (error) {
                console.warn("[admin-dashboard] falha ao montar o painel.", error);
                var list = $("dashTasks");
                if (list) list.innerHTML = '<li class="dash-error">Não foi possível carregar o painel agora. Tente “Atualizar”.</li>';
                return false;
            }).then(function (result) {
                inFlight = null;
                if (button) button.disabled = false;
                return result;
            });
            return inFlight;
        },

        dispose: function () {}
    };

    if (window.AdminRegistry && typeof window.AdminRegistry.register === "function") {
        window.AdminRegistry.register(AdminDashboardModule);
    }

    function activate() {
        if (activated) return;
        activated = true;
        var refresh = $("dashRefresh");
        if (refresh) refresh.addEventListener("click", function () { AdminDashboardModule.load(window.AdminContext || null); });
        if (window.AdminRouter) {
            if (typeof window.AdminRouter.init === "function") window.AdminRouter.init(window.AdminContext || null);
            if (typeof window.AdminRouter.registerLegacyBridge === "function" && typeof window.showSection === "function") {
                // Usa o showSection ORIGINAL como ponte → navigate() nunca recursa.
                window.AdminRouter.registerLegacyBridge(window.showSection.__original || window.showSection);
            }
        }
    }

    window.AdminDashboardModule = AdminDashboardModule;

    window.addEventListener("firebaseReady", activate);
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", activate, { once: true });
    } else {
        window.setTimeout(activate, 0);
    }
})();
