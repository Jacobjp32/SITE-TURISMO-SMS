(function () {
    "use strict";

    var AdminContentCMS = {
        events: [],
        news: [],
        media: [],

        get db() {
            return window.firebaseDB && window.firebaseDB.db ? window.firebaseDB.db : null;
        },

        get storage() {
            return window.firebase && window.firebase.storage ? window.firebase.storage() : null;
        },

        get SEC() {
            return window.SMSecurity || {
                html: function (value, fallback) { return escapeHtml(value || fallback || ""); },
                attr: function (value, fallback) { return escapeHtml(value || fallback || ""); },
                js: function (value) { return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'"); },
                url: function (value, fallback) { return value || fallback || ""; }
            };
        },

        closeModal: function () {
            var modal = document.getElementById("contentModal");
            if (modal) modal.hidden = true;
            var body = document.getElementById("contentModalBody");
            if (body) body.innerHTML = "";
        },

        openModal: function (title, html) {
            document.getElementById("contentModalTitle").textContent = title;
            document.getElementById("contentModalBody").innerHTML = html;
            document.getElementById("contentModal").hidden = false;
        },

        loadAll: function () {
            this.loadApprovedEvents();
            this.loadNews();
            this.loadMedia();
        },

        loadApprovedEvents: async function () {
            var container = document.getElementById("eventos-aprovados-container");
            if (!container) return;
            if (!this.db) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Firestore não inicializado.</p>';
                return;
            }

            try {
                var snapshot = await this.db.collection("eventos_aprovados").get();
                this.events = snapshot.docs.map(function (doc) {
                    return Object.assign({ id: doc.id }, doc.data());
                }).sort(compareAdminDateDesc);

                if (!this.events.length) {
                    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Nenhum evento aprovado ainda.</p>';
                    return;
                }

                var SEC = this.SEC;
                container.innerHTML = '<table class="data-table"><thead><tr>' +
                    '<th>Evento</th><th>Data</th><th>Local</th><th>Status</th><th>Histórico</th><th>Ações</th>' +
                    '</tr></thead><tbody>' +
                    this.events.map(function (eventItem) {
                        var published = isPublished(eventItem);
                        return '<tr><td><strong>' + SEC.html(getTitle(eventItem), "Sem título") + '</strong><br><small>' +
                            SEC.html(getOrganizer(eventItem), "Sem organizador") + '</small></td><td>' +
                            SEC.html(getEventDate(eventItem), "—") + '<br><small>' + SEC.html(getEventTime(eventItem), "—") + '</small></td><td>' +
                            SEC.html(getLocation(eventItem), "—") + '</td><td><span class="badge ' +
                            (published ? 'badge-success">Publicado' : 'badge-warning">Despublicado') + '</span>' +
                            (eventItem.destaque ? '<br><span class="badge badge-info">Destaque</span>' : '') + '</td><td><small>Atualizado: ' +
                            SEC.html(formatAdminDate(eventItem.updatedAt || eventItem.reviewedAt), "—") + '<br>Por: ' +
                            SEC.html(eventItem.updatedBy || eventItem.reviewedBy || "—") + '</small></td><td>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.openEventModal(\'' + SEC.js(eventItem.id) + '\')">Editar</button>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.toggleEventPublish(\'' + SEC.js(eventItem.id) + '\')">' + (published ? 'Despublicar' : 'Publicar') + '</button>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.toggleEventFeatured(\'' + SEC.js(eventItem.id) + '\')">' + (eventItem.destaque ? 'Remover destaque' : 'Destacar') + '</button>' +
                            '<button class="btn-sm btn-delete" onclick="AdminContentCMS.deleteEvent(\'' + SEC.js(eventItem.id) + '\')">Excluir</button>' +
                            '</td></tr>';
                    }).join("") + '</tbody></table>';
            } catch (error) {
                console.error("[admin-content-cms] Erro ao carregar eventos aprovados.", error);
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Erro ao carregar eventos aprovados.</p>';
            }
        },

        openEventModal: function (eventId) {
            var eventItem = eventId ? this.events.find(function (item) { return item.id === eventId; }) : null;
            var title = eventItem ? "Editar evento" : "Novo evento";
            this.openModal(title, buildEventForm(eventItem));
        },

        saveEvent: async function (event) {
            event.preventDefault();
            if (!this.db) return alert("Firestore não inicializado.");

            var form = event.target;
            var id = form.eventId.value || ("evt_" + Date.now());
            var publish = form.publicado.value === "true";
            var now = window.firebase.firestore.FieldValue.serverTimestamp();
            var payload = {
                id: id,
                title: clean(form.title.value),
                nome: clean(form.title.value),
                description: cleanLong(form.description.value),
                descricao: cleanLong(form.description.value),
                date: clean(form.date.value),
                data: clean(form.date.value),
                time: clean(form.time.value),
                hora: clean(form.time.value),
                location: clean(form.location.value),
                local: clean(form.location.value),
                organizer: clean(form.organizer.value),
                mainImage: clean(form.mainImage.value),
                image: clean(form.mainImage.value),
                category: clean(form.category.value) || "cultural",
                categoria: clean(form.category.value) || "cultural",
                destaque: form.destaque.checked,
                publicado: publish,
                status: publish ? "aprovado" : "rascunho",
                updatedAt: now,
                updatedBy: currentAdminId()
            };

            if (!payload.title || !payload.date) {
                alert("Título e data são obrigatórios.");
                return;
            }

            if (!form.eventId.value) {
                payload.createdAt = now;
                payload.reviewedAt = now;
                payload.reviewedBy = currentAdminId();
            }

            await this.db.collection("eventos_aprovados").doc(id).set(payload, { merge: true });
            this.closeModal();
            await this.loadApprovedEvents();
            alert("Evento salvo.");
        },

        toggleEventPublish: async function (eventId) {
            var eventItem = this.events.find(function (item) { return item.id === eventId; });
            if (!eventItem) return;
            var publish = !isPublished(eventItem);
            await this.db.collection("eventos_aprovados").doc(eventId).set({
                publicado: publish,
                status: publish ? "aprovado" : "rascunho",
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentAdminId()
            }, { merge: true });
            this.loadApprovedEvents();
        },

        toggleEventFeatured: async function (eventId) {
            var eventItem = this.events.find(function (item) { return item.id === eventId; });
            if (!eventItem) return;
            await this.db.collection("eventos_aprovados").doc(eventId).set({
                destaque: !eventItem.destaque,
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentAdminId()
            }, { merge: true });
            this.loadApprovedEvents();
        },

        deleteEvent: async function (eventId) {
            if (!confirm("Excluir este evento aprovado?")) return;
            await this.db.collection("eventos_aprovados").doc(eventId).delete();
            this.loadApprovedEvents();
        },

        loadNews: async function () {
            var container = document.getElementById("noticias-admin-container");
            if (!container) return;
            if (!this.db) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Firestore não inicializado.</p>';
                return;
            }

            try {
                var snapshot = await this.db.collection("noticias").get();
                this.news = snapshot.docs.map(function (doc) {
                    return Object.assign({ id: doc.id }, doc.data());
                }).sort(compareAdminDateDesc);

                if (!this.news.length) {
                    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Nenhuma notícia cadastrada.</p>';
                    return;
                }

                var SEC = this.SEC;
                container.innerHTML = '<table class="data-table"><thead><tr><th>Notícia</th><th>Categoria</th><th>Status</th><th>Atualização</th><th>Ações</th></tr></thead><tbody>' +
                    this.news.map(function (item) {
                        var published = item.publicado === true || item.status === "publicado";
                        return '<tr><td><strong>' + SEC.html(item.titulo, "Sem título") + '</strong><br><small>' + SEC.html(item.resumo, "—") + '</small></td><td>' +
                            SEC.html(item.categoria, "—") + '</td><td><span class="badge ' + (published ? 'badge-success">Publicado' : 'badge-warning">Rascunho') + '</span>' +
                            (item.destaque ? '<br><span class="badge badge-info">Destaque</span>' : '') + '</td><td><small>' +
                            SEC.html(formatAdminDate(item.updatedAt || item.publishedAt || item.data), "—") + '<br>' + SEC.html(item.updatedBy || "—") + '</small></td><td>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.openNewsModal(\'' + SEC.js(item.id) + '\')">Editar</button>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.toggleNewsPublish(\'' + SEC.js(item.id) + '\')">' + (published ? 'Despublicar' : 'Publicar') + '</button>' +
                            '<button class="btn-sm btn-delete" onclick="AdminContentCMS.deleteNews(\'' + SEC.js(item.id) + '\')">Excluir</button>' +
                            '</td></tr>';
                    }).join("") + '</tbody></table>';
            } catch (error) {
                console.error("[admin-content-cms] Erro ao carregar notícias.", error);
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Erro ao carregar notícias.</p>';
            }
        },

        openNewsModal: function (newsId) {
            var item = newsId ? this.news.find(function (post) { return post.id === newsId; }) : null;
            this.openModal(item ? "Editar notícia" : "Nova notícia", buildNewsForm(item));
        },

        saveNews: async function (event) {
            event.preventDefault();
            if (!this.db) return alert("Firestore não inicializado.");

            var form = event.target;
            var title = clean(form.titulo.value);
            if (!title) return alert("Título é obrigatório.");

            var id = form.newsId.value || ("noticia_" + Date.now());
            var slug = clean(form.slug.value) || makeSlug(title);
            var publish = form.publicado.value === "true";
            var now = window.firebase.firestore.FieldValue.serverTimestamp();
            var payload = {
                id: id,
                titulo: title,
                slug: slug,
                resumo: cleanLong(form.resumo.value),
                conteudo: cleanLong(form.conteudo.value),
                categoria: clean(form.categoria.value) || "Turismo",
                imagem: clean(form.imagem.value),
                galeria: splitList(form.galeria.value),
                videoUrl: clean(form.videoUrl.value),
                linkOrigem: clean(form.linkOrigem.value),
                destaque: form.destaque.checked,
                publicado: publish,
                status: publish ? "publicado" : "rascunho",
                data: form.publishedAt.value || new Date().toISOString(),
                publishedAt: form.publishedAt.value || new Date().toISOString(),
                updatedAt: now,
                updatedBy: currentAdminId(),
                autor: "Departamento de Turismo"
            };

            if (!form.newsId.value) payload.createdAt = now;

            await this.db.collection("noticias").doc(id).set(payload, { merge: true });
            this.closeModal();
            await this.loadNews();
            alert("Notícia salva.");
        },

        toggleNewsPublish: async function (newsId) {
            var item = this.news.find(function (post) { return post.id === newsId; });
            if (!item) return;
            var publish = !(item.publicado === true || item.status === "publicado");
            await this.db.collection("noticias").doc(newsId).set({
                publicado: publish,
                status: publish ? "publicado" : "rascunho",
                publishedAt: publish ? (item.publishedAt || new Date().toISOString()) : item.publishedAt || null,
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentAdminId()
            }, { merge: true });
            this.loadNews();
        },

        deleteNews: async function (newsId) {
            if (!confirm("Excluir esta notícia?")) return;
            await this.db.collection("noticias").doc(newsId).delete();
            this.loadNews();
        },

        loadMedia: async function () {
            var container = document.getElementById("midia-admin-container");
            if (!container) return;
            if (!this.db) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Firestore não inicializado.</p>';
                return;
            }

            try {
                var snapshot = await this.db.collection("media_library").get();
                this.media = snapshot.docs.map(function (doc) {
                    return Object.assign({ id: doc.id }, doc.data());
                }).sort(compareAdminDateDesc);

                if (!this.media.length) {
                    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Nenhuma mídia cadastrada.</p>';
                    return;
                }

                var SEC = this.SEC;
                container.innerHTML = '<div class="update-request-images">' + this.media.map(function (item) {
                    return '<a href="' + SEC.url(item.url, "#") + '" target="_blank" rel="noopener noreferrer">' +
                        '<img src="' + SEC.url(item.url, "images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg") + '" alt="' + SEC.attr(item.title, "Mídia") + '">' +
                        '<span class="update-request-image-caption"><strong>' + SEC.html(item.title, "Sem título") + '</strong><br>' +
                        SEC.html(item.category, "Imagem") + '<br>' + SEC.html(item.url, "") + '</span></a>';
                }).join("") + '</div>';
            } catch (error) {
                console.error("[admin-content-cms] Erro ao carregar mídia.", error);
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Erro ao carregar mídia.</p>';
            }
        },

        openMediaModal: function () {
            this.openModal("Adicionar mídia", buildMediaForm());
        },

        saveMedia: async function (event) {
            event.preventDefault();
            if (!this.db) return alert("Firestore não inicializado.");

            var form = event.target;
            var title = clean(form.title.value);
            var url = clean(form.url.value);
            var file = form.file.files && form.file.files[0];

            if (!title) return alert("Título é obrigatório.");
            if (!url && !file) return alert("Informe uma URL ou selecione um arquivo.");

            try {
                if (file) {
                    if (!this.storage) return alert("Firebase Storage não inicializado.");
                    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) return alert("Use imagem JPG, PNG ou WEBP.");
                    if (file.size > 5 * 1024 * 1024) return alert("Imagem acima de 5 MB.");
                    var path = "cms-media/" + currentAdminId() + "/" + Date.now() + "-" + safeFileName(file.name);
                    var ref = this.storage.ref(path);
                    await ref.put(file, { contentType: file.type });
                    url = await ref.getDownloadURL();
                }

                var now = window.firebase.firestore.FieldValue.serverTimestamp();
                var id = "media_" + Date.now();
                await this.db.collection("media_library").doc(id).set({
                    id: id,
                    title: title,
                    url: url,
                    category: clean(form.category.value) || "Imagem",
                    alt: clean(form.alt.value),
                    createdAt: now,
                    updatedAt: now,
                    updatedBy: currentAdminId()
                });
                this.closeModal();
                await this.loadMedia();
                alert("Mídia cadastrada.");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao salvar mídia.", error);
                alert("Erro ao salvar mídia.");
            }
        }
    };

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function clean(value) {
        return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }

    function cleanLong(value) {
        return String(value || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    function splitList(value) {
        return String(value || "").split(/\n|,/).map(clean).filter(Boolean);
    }

    function makeSlug(value) {
        return clean(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
    }

    function safeFileName(value) {
        return String(value || "imagem").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 90);
    }

    function currentAdminId() {
        return window.currentUser && window.currentUser.uid ? window.currentUser.uid : "admin";
    }

    function timestampToMillis(value) {
        if (!value) return 0;
        if (typeof value.toMillis === "function") return value.toMillis();
        if (typeof value.seconds === "number") return value.seconds * 1000;
        var parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatAdminDate(value) {
        var millis = timestampToMillis(value);
        return millis ? new Date(millis).toLocaleString("pt-BR") : "";
    }

    function compareAdminDateDesc(a, b) {
        return timestampToMillis(b.updatedAt || b.createdAt || b.data || b.date) -
            timestampToMillis(a.updatedAt || a.createdAt || a.data || a.date);
    }

    function isPublished(item) {
        var status = String(item && item.status || "").toLowerCase();
        if (item && item.publicado === false) return false;
        return !status || status === "aprovado" || status === "approved" || item.publicado === true;
    }

    function getTitle(item) { return item.title || item.nome || item.titulo || ""; }
    function getEventDate(item) { return item.date || item.data || item.dataInicio || ""; }
    function getEventTime(item) { return item.time || item.hora || item.horario || ""; }
    function getLocation(item) { return item.location || item.local || item.establishmentName || ""; }
    function getOrganizer(item) { return item.organizer || item.organizador || item.ownerName || ""; }

    function buildEventForm(item) {
        item = item || {};
        return '<form id="eventCmsForm" onsubmit="AdminContentCMS.saveEvent(event)">' +
            '<div class="admin-modal-body"><input type="hidden" name="eventId" value="' + escapeHtml(item.id || "") + '">' +
            '<div class="admin-modal-grid">' +
            field("title", "Título", getTitle(item), true) +
            field("date", "Data", getEventDate(item), true, "date") +
            field("time", "Horário", getEventTime(item), false, "time") +
            field("location", "Local", getLocation(item)) +
            field("organizer", "Organizador", getOrganizer(item)) +
            field("category", "Categoria", item.category || item.categoria || "cultural") +
            field("mainImage", "Imagem de capa (URL)", item.mainImage || item.image || item.imagem || "", false, "url") +
            '<div class="admin-field"><label for="eventPublished">Status</label><select id="eventPublished" name="publicado"><option value="true"' + (isPublished(item) ? " selected" : "") + '>Publicado</option><option value="false"' + (!isPublished(item) ? " selected" : "") + '>Despublicado</option></select></div>' +
            '<div class="admin-field full"><label><input type="checkbox" name="destaque" ' + (item.destaque ? "checked" : "") + '> Evento em destaque</label></div>' +
            textarea("description", "Descrição", item.description || item.descricao || "") +
            '</div></div><div class="admin-modal-footer"><button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Cancelar</button><button class="btn-primary" type="submit">Salvar evento</button></div></form>';
    }

    function buildNewsForm(item) {
        item = item || {};
        return '<form id="newsCmsForm" onsubmit="AdminContentCMS.saveNews(event)">' +
            '<div class="admin-modal-body"><input type="hidden" name="newsId" value="' + escapeHtml(item.id || "") + '">' +
            '<div class="admin-modal-grid">' +
            field("titulo", "Título", item.titulo || "", true) +
            field("slug", "Slug", item.slug || "") +
            field("categoria", "Categoria", item.categoria || "Turismo") +
            field("publishedAt", "Data de publicação", item.publishedAt || item.data || new Date().toISOString()) +
            field("imagem", "Imagem de capa (URL)", item.imagem || "", false, "url") +
            field("videoUrl", "Vídeo/link opcional", item.videoUrl || item.video || "", false, "url") +
            field("linkOrigem", "Link de origem", item.linkOrigem || item.sourceUrl || "", false, "url") +
            '<div class="admin-field"><label for="newsPublished">Status</label><select id="newsPublished" name="publicado"><option value="false"' + (item.publicado !== true ? " selected" : "") + '>Rascunho</option><option value="true"' + (item.publicado === true ? " selected" : "") + '>Publicado</option></select></div>' +
            '<div class="admin-field full"><label><input type="checkbox" name="destaque" ' + (item.destaque ? "checked" : "") + '> Notícia em destaque</label></div>' +
            textarea("resumo", "Resumo", item.resumo || "") +
            textarea("conteudo", "Conteúdo", item.conteudo || "") +
            textarea("galeria", "Galeria opcional (uma URL por linha)", Array.isArray(item.galeria) ? item.galeria.join("\n") : "") +
            '</div></div><div class="admin-modal-footer"><button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Cancelar</button><button class="btn-primary" type="submit">Salvar notícia</button></div></form>';
    }

    function buildMediaForm() {
        return '<form id="mediaCmsForm" onsubmit="AdminContentCMS.saveMedia(event)">' +
            '<div class="admin-modal-body"><div class="admin-modal-grid">' +
            field("title", "Título", "", true) +
            field("category", "Categoria", "Imagem") +
            field("url", "URL existente", "", false, "url") +
            field("file", "Enviar imagem", "", false, "file") +
            field("alt", "Texto alternativo", "") +
            '</div></div><div class="admin-modal-footer"><button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Cancelar</button><button class="btn-primary" type="submit">Salvar mídia</button></div></form>';
    }

    function field(name, label, value, required, type) {
        return '<div class="admin-field"><label for="' + name + '">' + label + '</label><input class="admin-input" id="' + name + '" name="' + name + '" type="' + (type || "text") + '" value="' + escapeHtml(value || "") + '"' + (required ? " required" : "") + '></div>';
    }

    function textarea(name, label, value) {
        return '<div class="admin-field full"><label for="' + name + '">' + label + '</label><textarea class="admin-textarea" id="' + name + '" name="' + name + '">' + escapeHtml(value || "") + '</textarea></div>';
    }

    window.AdminContentCMS = AdminContentCMS;
    window.loadApprovedEvents = function () {
        return AdminContentCMS.loadApprovedEvents();
    };
})();
