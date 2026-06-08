(function () {
    "use strict";

    var DEFAULT_IMAGE = "images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg";
    var MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    var IMAGE_TYPE_REGEX = /^image\/(jpeg|jpg|png|webp)$/i;

    var AdminContentCMS = {
        events: [],
        news: [],
        media: [],
        mediaUsageMap: {},
        _eventPreviewObjectUrl: "",

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
            this.releaseEventPreviewUrl();
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

        ensureMediaLoaded: async function (forceReload) {
            if (!this.db) return [];
            if (!forceReload && this.media.length) return this.media;

            var snapshot = await this.db.collection("media_library").get();
            this.media = snapshot.docs.map(function (doc) {
                return Object.assign({ id: doc.id }, doc.data());
            }).sort(compareAdminDateDesc);
            return this.media;
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
                container.innerHTML = '<div class="table-responsive"><table class="data-table"><thead><tr>' +
                    '<th>Evento</th><th>Data</th><th>Local</th><th>Status</th><th>Histórico</th><th>Ações</th>' +
                    '</tr></thead><tbody>' +
                    this.events.map(function (eventItem) {
                        var published = isPublished(eventItem);
                        var cover = getPrimaryEventImage(eventItem);
                        return '<tr><td><strong>' + SEC.html(getTitle(eventItem), "Sem título") + '</strong><br><small>' +
                            SEC.html(getOrganizer(eventItem), "Sem organizador") + '</small>' +
                            (cover ? '<div class="table-inline-media"><img src="' + SEC.url(cover.url, DEFAULT_IMAGE) + '" alt="' + SEC.attr(getTitle(eventItem), "Evento") + '" onerror="this.closest(\\\'.table-inline-media\\\').classList.add(\\\'is-error\\\');this.remove();"><span>' +
                                SEC.html(cover.name || "Capa atual", "Capa atual") + '</span></div>' : "") +
                            '</td><td>' +
                            SEC.html(getEventDate(eventItem), "—") + '<br><small>' + SEC.html(getEventTime(eventItem), "—") + '</small></td><td>' +
                            SEC.html(getLocation(eventItem), "—") + '</td><td><span class="badge ' +
                            (published ? 'badge-success">Publicado' : 'badge-warning">Despublicado') + '</span>' +
                            (eventItem.destaque ? '<br><span class="badge badge-info">Destaque</span>' : '') + '</td><td><small>Atualizado: ' +
                            SEC.html(formatAdminDate(eventItem.updatedAt || eventItem.reviewedAt), "—") + '<br>Por: ' +
                            SEC.html(eventItem.updatedBy || eventItem.reviewedBy || "—") + '</small></td><td>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.previewEvent(\'' + SEC.js(eventItem.id) + '\')">Prévia</button>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.openEventModal(\'' + SEC.js(eventItem.id) + '\')">Editar</button>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.duplicateEvent(\'' + SEC.js(eventItem.id) + '\')">Duplicar</button>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.toggleEventPublish(\'' + SEC.js(eventItem.id) + '\')">' + (published ? 'Despublicar' : 'Publicar') + '</button>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.toggleEventFeatured(\'' + SEC.js(eventItem.id) + '\')">' + (eventItem.destaque ? 'Remover destaque' : 'Destacar') + '</button>' +
                            '<button class="btn-sm btn-delete" onclick="AdminContentCMS.deleteEvent(\'' + SEC.js(eventItem.id) + '\')">Excluir</button>' +
                            '</td></tr>';
                    }).join("") + '</tbody></table></div>';
            } catch (error) {
                console.error("[admin-content-cms] Erro ao carregar eventos aprovados.", error);
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Erro ao carregar eventos aprovados.</p>';
            }
        },

        openEventModal: async function (eventId, presetItem) {
            var eventItem = eventId ? this.events.find(function (item) { return item.id === eventId; }) : null;
            if (!eventItem && presetItem) {
                eventItem = Object.assign({}, presetItem);
            }

            try {
                await this.ensureMediaLoaded(false);
            } catch (error) {
                console.error("[admin-content-cms] Falha ao carregar biblioteca de mídia para o evento.", error);
            }

            this.openModal(eventItem && eventItem.id ? "Editar evento" : "Novo evento", buildEventForm(eventItem, this.media));
            this.syncEventCoverPreview();
        },

        saveEvent: async function (event) {
            event.preventDefault();
            if (!this.db) return alert("Firestore não inicializado.");

            var form = event.target;
            var id = form.eventId.value || ("evt_" + Date.now());
            var publish = form.publicado.value === "true";
            var existingItem = this.events.find(function (item) { return item.id === id; }) || null;
            var now = window.firebase.firestore.FieldValue.serverTimestamp();
            var manualCoverUrl = clean(form.mainImage.value);
            var selectedMediaItem = getMediaById(this.media, form.eventMediaId.value);
            var removeCover = form.removeCover && form.removeCover.value === "true";
            var removeGalleryFallback = form.removeGalleryCoverFallback && form.removeGalleryCoverFallback.value === "true";
            var uploadedFile = form.coverUpload && form.coverUpload.files ? form.coverUpload.files[0] : null;
            var finalCoverUrl = manualCoverUrl;
            var newCoverEntry = null;
            var existingImages = normalizeEventImages(existingItem && existingItem.images);
            var payload;

            if (selectedMediaItem && !uploadedFile) {
                finalCoverUrl = clean(selectedMediaItem.url);
                newCoverEntry = buildEventImageEntry(selectedMediaItem.url, {
                    name: selectedMediaItem.title,
                    contentType: selectedMediaItem.contentType,
                    size: selectedMediaItem.size,
                    path: selectedMediaItem.storagePath
                });
            }

            try {
                if (uploadedFile) {
                    if (!this.storage) return alert("Firebase Storage não inicializado.");
                    validateImageFile(uploadedFile);

                    var uploadResult = await uploadImageToCms(this.storage, uploadedFile);
                    finalCoverUrl = uploadResult.url;
                    newCoverEntry = buildEventImageEntry(uploadResult.url, {
                        name: uploadedFile.name,
                        contentType: uploadedFile.type,
                        size: uploadedFile.size,
                        path: uploadResult.path,
                        uploadedAt: new Date().toISOString()
                    });
                } else if (removeCover) {
                    finalCoverUrl = "";
                } else if (manualCoverUrl) {
                    validateImageUrl(manualCoverUrl);
                    newCoverEntry = buildEventImageEntry(manualCoverUrl, {
                        name: "Capa manual"
                    });
                }
            } catch (error) {
                console.error("[admin-content-cms] Falha ao processar capa do evento.", error);
                alert(error && error.message ? error.message : "Erro ao processar a imagem de capa.");
                return;
            }

            payload = {
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

            if (removeCover) {
                payload.mainImage = "";
                payload.image = "";
                payload.coverImage = "";
                payload.images = removeGalleryFallback ? removeFirstEventImage(existingImages, existingItem) : existingImages;
            } else if (finalCoverUrl) {
                payload.mainImage = finalCoverUrl;
                payload.image = finalCoverUrl;
                payload.coverImage = finalCoverUrl;
                payload.images = applyCoverToEventImages(existingImages, newCoverEntry || buildEventImageEntry(finalCoverUrl, {}));
            } else {
                payload.mainImage = "";
                payload.image = "";
                payload.coverImage = "";
                payload.images = existingImages;
            }

            payload.imageCount = Array.isArray(payload.images) ? payload.images.length : 0;

            await this.db.collection("eventos_aprovados").doc(id).set(payload, { merge: true });
            this.closeModal();
            await this.loadApprovedEvents();
            alert("Evento salvo.");
        },

        previewEvent: function (eventId) {
            var eventItem = this.events.find(function (item) { return item.id === eventId; });
            if (!eventItem) return alert("Evento não encontrado.");
            this.openModal("Pré-visualizar evento", buildApprovedEventPreview(eventItem));
        },

        duplicateEvent: function (eventId) {
            var eventItem = this.events.find(function (item) { return item.id === eventId; });
            if (!eventItem) return alert("Evento não encontrado.");

            this.openEventModal("", Object.assign({}, eventItem, {
                id: "",
                title: getTitle(eventItem) ? (getTitle(eventItem) + " (cópia)") : "",
                nome: getTitle(eventItem) ? (getTitle(eventItem) + " (cópia)") : "",
                publicado: false,
                status: "rascunho",
                destaque: false,
                updatedAt: "",
                updatedBy: "",
                reviewedAt: "",
                reviewedBy: "",
                reviewNotes: ""
            }));
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

        syncEventCoverPreview: function () {
            var preview = document.getElementById("eventCoverPreview");
            var urlField = document.getElementById("mainImage");
            var removeField = document.getElementById("eventRemoveCover");
            var mediaSelect = document.getElementById("eventMediaId");
            var selectedMedia = getMediaById(this.media, mediaSelect && mediaSelect.value);
            if (!preview || !urlField) return;

            if (removeField && removeField.value === "true") {
                preview.innerHTML = renderEventCoverPreview(null, "Capa marcada para remoção.");
                return;
            }

            if (selectedMedia && selectedMedia.url) {
                preview.innerHTML = renderEventCoverPreview(buildEventImageEntry(selectedMedia.url, {
                    name: selectedMedia.title,
                    contentType: selectedMedia.contentType,
                    size: selectedMedia.size
                }), "Selecionada da biblioteca de mídia.");
                return;
            }

            if (clean(urlField.value)) {
                preview.innerHTML = renderEventCoverPreview(buildEventImageEntry(clean(urlField.value), {
                    name: "Capa manual"
                }), "URL manual ativa.");
                return;
            }

            preview.innerHTML = renderEventCoverPreview(null, "Sem capa definida.");
        },

        previewEventCoverFile: function (inputEvent) {
            var file = inputEvent && inputEvent.target && inputEvent.target.files ? inputEvent.target.files[0] : null;
            var preview = document.getElementById("eventCoverPreview");
            var removeField = document.getElementById("eventRemoveCover");
            var mediaSelect = document.getElementById("eventMediaId");

            if (mediaSelect) mediaSelect.value = "";
            if (removeField) removeField.value = "false";
            this.releaseEventPreviewUrl();

            if (!file || !preview) {
                this.syncEventCoverPreview();
                return;
            }

            try {
                validateImageFile(file);
            } catch (error) {
                console.error("[admin-content-cms] Arquivo de capa inválido.", error);
                alert(error.message);
                inputEvent.target.value = "";
                this.syncEventCoverPreview();
                return;
            }

            this._eventPreviewObjectUrl = window.URL && typeof window.URL.createObjectURL === "function"
                ? window.URL.createObjectURL(file)
                : "";
            preview.innerHTML = renderEventCoverPreview(buildEventImageEntry(this._eventPreviewObjectUrl, {
                name: file.name,
                contentType: file.type,
                size: file.size
            }), "Pré-visualização do upload.");
        },

        releaseEventPreviewUrl: function () {
            if (this._eventPreviewObjectUrl && window.URL && typeof window.URL.revokeObjectURL === "function") {
                window.URL.revokeObjectURL(this._eventPreviewObjectUrl);
            }
            this._eventPreviewObjectUrl = "";
        },

        clearEventCoverSelection: function () {
            var fileInput = document.getElementById("eventCoverUpload");
            var mediaSelect = document.getElementById("eventMediaId");
            var removeField = document.getElementById("eventRemoveCover");

            this.releaseEventPreviewUrl();
            if (fileInput) fileInput.value = "";
            if (mediaSelect) mediaSelect.value = "";
            if (removeField) removeField.value = "false";
            this.syncEventCoverPreview();
        },

        removeEventCover: function () {
            var removeField = document.getElementById("eventRemoveCover");
            var removeFallbackField = document.getElementById("eventRemoveGalleryCoverFallback");
            var urlField = document.getElementById("mainImage");
            var fileInput = document.getElementById("eventCoverUpload");
            var mediaSelect = document.getElementById("eventMediaId");
            var hasImages = document.getElementById("eventHasGalleryImages");

            if (removeField) removeField.value = "true";
            if (removeFallbackField) {
                removeFallbackField.value = hasImages && hasImages.value === "true" && confirm("Este evento tem galeria salva. Deseja remover também a primeira imagem usada como fallback de capa? A galeria restante será preservada.")
                    ? "true"
                    : "false";
            }
            if (urlField) urlField.value = "";
            if (fileInput) fileInput.value = "";
            if (mediaSelect) mediaSelect.value = "";
            this.releaseEventPreviewUrl();
            this.syncEventCoverPreview();
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
                container.innerHTML = '<div class="table-responsive"><table class="data-table"><thead><tr><th>Notícia</th><th>Categoria</th><th>Status</th><th>Atualização</th><th>Ações</th></tr></thead><tbody>' +
                    this.news.map(function (item) {
                        var published = item.publicado === true || item.status === "publicado";
                        var legacy = item.origemTipo === "legado_estatico";
                        var originAction = item.linkOrigem
                            ? '<a class="btn-sm btn-edit" href="' + SEC.url(item.linkOrigem, "#") + '" target="_blank" rel="noopener noreferrer">Origem</a>'
                            : "";
                        return '<tr><td><strong>' + SEC.html(item.titulo, "Sem título") + '</strong><br><small>' + SEC.html(item.resumo, "—") + '</small>' +
                            (item.linkOrigem ? '<br><small><a href="' + SEC.url(item.linkOrigem, "#") + '" target="_blank" rel="noopener noreferrer">Link oficial</a></small>' : '') +
                            '</td><td>' + SEC.html(item.categoria, "—") +
                            (legacy ? '<br><span class="badge badge-info">Legado</span>' : '') +
                            '</td><td><span class="badge ' + (published ? 'badge-success">Publicado' : 'badge-warning">Rascunho') + '</span>' +
                            (item.destaque ? '<br><span class="badge badge-info">Destaque</span>' : '') + '</td><td><small>' +
                            SEC.html(formatAdminDate(item.updatedAt || item.publishedAt || item.data), "—") + '<br>' + SEC.html(item.updatedBy || "—") + '</small></td><td>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.openNewsModal(\'' + SEC.js(item.id) + '\')">Editar</button>' +
                            '<button class="btn-sm btn-edit" onclick="AdminContentCMS.toggleNewsPublish(\'' + SEC.js(item.id) + '\')">' + (published ? 'Despublicar' : 'Publicar') + '</button>' +
                            originAction +
                            '<button class="btn-sm btn-delete" onclick="AdminContentCMS.deleteNews(\'' + SEC.js(item.id) + '\')">Excluir</button>' +
                            '</td></tr>';
                    }).join("") + '</tbody></table></div>';
            } catch (error) {
                console.error("[admin-content-cms] Erro ao carregar notícias.", error);
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Erro ao carregar notícias.</p>';
            }
        },

        openNewsModal: function (newsId, presetItem) {
            var item = newsId ? this.news.find(function (post) { return post.id === newsId; }) : null;
            if (!item && presetItem) {
                item = Object.assign({}, presetItem);
            }
            this.openModal(item && item.id ? "Editar notícia" : "Nova notícia", buildNewsForm(item));
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

        importStaticNews: async function () {
            if (!this.db) return alert("Firestore não inicializado.");
            if (!confirm("Importar as notícias estáticas atuais para o CMS? Notícias já importadas por slug, link de origem ou título + data serão ignoradas.")) {
                return;
            }

            try {
                var response = await fetch("noticias.html", { cache: "no-store" });
                if (!response.ok) throw new Error("Falha ao ler noticias.html.");

                var html = await response.text();
                var parser = new window.DOMParser();
                var documentSource = parser.parseFromString(html, "text/html");
                var staticPosts = extractStaticPosts(documentSource);

                if (!staticPosts.length) {
                    alert("Nenhuma notícia estática foi encontrada para importação.");
                    return;
                }

                if (!this.news.length) {
                    await this.loadNews();
                }

                var existingBySlug = {};
                var existingByOrigin = {};
                var existingByTitleDate = {};
                this.news.forEach(function (item) {
                    var slug = makeSlug(item.slug || item.titulo || "");
                    var origin = normalizeComparableUrl(item.linkOrigem);
                    var titleDateKey = buildNewsIdentityKey(item.titulo, item.publishedAt || item.data);
                    if (slug) existingBySlug[slug] = true;
                    if (origin) existingByOrigin[origin] = true;
                    if (titleDateKey) existingByTitleDate[titleDateKey] = true;
                });

                var batch = this.db.batch();
                var now = window.firebase.firestore.FieldValue.serverTimestamp();
                var importedCount = 0;
                var skippedCount = 0;

                staticPosts.forEach(function (item) {
                    var slug = makeSlug(item.slug || item.titulo || "");
                    var origin = normalizeComparableUrl(item.linkOrigem);
                    var titleDateKey = buildNewsIdentityKey(item.titulo, item.publishedAt);

                    if (!slug || existingBySlug[slug] || (origin && existingByOrigin[origin]) || (titleDateKey && existingByTitleDate[titleDateKey])) {
                        skippedCount += 1;
                        return;
                    }

                    var id = "noticia_legacy_" + slug;
                    batch.set(
                        this.db.collection("noticias").doc(id),
                        {
                            id: id,
                            slug: slug,
                            titulo: item.titulo,
                            resumo: item.resumo,
                            conteudo: item.conteudo,
                            categoria: item.categoria,
                            imagem: item.imagem,
                            galeria: [],
                            linkOrigem: item.linkOrigem,
                            destaque: item.destaque === true,
                            publicado: true,
                            status: "publicado",
                            data: item.publishedAt,
                            publishedAt: item.publishedAt,
                            autor: "Portal Oficial da Prefeitura",
                            origemTipo: "legado_estatico",
                            origemArquivo: "noticias.html",
                            createdAt: now,
                            updatedAt: now,
                            updatedBy: currentAdminId()
                        },
                        { merge: true }
                    );

                    existingBySlug[slug] = true;
                    if (origin) existingByOrigin[origin] = true;
                    if (titleDateKey) existingByTitleDate[titleDateKey] = true;
                    importedCount += 1;
                }, this);

                if (!importedCount) {
                    alert("Nenhuma notícia nova foi importada. As notícias estáticas já parecem estar vinculadas ao CMS.");
                    return;
                }

                await batch.commit();
                await this.loadNews();
                alert(importedCount + " notícia(s) importada(s) do conteúdo estático. " + skippedCount + " duplicada(s) foram ignorada(s).");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao importar notícias estáticas.", error);
                alert("Erro ao importar notícias estáticas.");
            }
        },

        loadMedia: async function () {
            var container = document.getElementById("midia-admin-container");
            if (!container) return;
            if (!this.db) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Firestore não inicializado.</p>';
                return;
            }

            try {
                var results = await Promise.all([
                    this.ensureMediaLoaded(true),
                    this.db.collection("eventos_aprovados").get(),
                    this.db.collection("noticias").get()
                ]);
                this.events = results[1].docs.map(function (doc) {
                    return Object.assign({ id: doc.id }, doc.data());
                }).sort(compareAdminDateDesc);
                this.news = results[2].docs.map(function (doc) {
                    return Object.assign({ id: doc.id }, doc.data());
                }).sort(compareAdminDateDesc);
                this.mediaUsageMap = buildMediaUsageMap(this.events, this.news);

                if (!this.media.length) {
                    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Nenhuma mídia cadastrada.</p>';
                    return;
                }

                var SEC = this.SEC;
                container.innerHTML = '<div class="media-admin-grid">' + this.media.map(function (item) {
                    var usage = getMediaUsageInfo(item.url, this.mediaUsageMap);
                    return '<article class="media-admin-card">' +
                        '<div class="media-admin-thumb">' +
                            '<img src="' + SEC.url(item.url, DEFAULT_IMAGE) + '" alt="' + SEC.attr(item.title, "Mídia") + '" onerror="this.closest(\\\'.media-admin-thumb\\\').classList.add(\\\'is-error\\\');this.remove();">' +
                        '</div>' +
                        '<div class="media-admin-body">' +
                            '<strong>' + SEC.html(item.title, "Sem título") + '</strong>' +
                            '<span class="manager-meta">' + SEC.html(item.category, "Imagem") + '</span>' +
                            '<span class="manager-meta">' + SEC.html(formatAdminDate(item.updatedAt || item.createdAt), "—") + '</span>' +
                            '<span class="badge ' + (usage.total ? 'badge-info' : 'badge-warning') + '">' + SEC.html(usage.total ? 'Em uso no CMS' : 'Sem uso detectado') + '</span>' +
                            '<span class="manager-meta">' + SEC.html(formatMediaUsageSummary(usage)) + '</span>' +
                            '<div class="media-admin-url">' + SEC.html(item.url, "—") + '</div>' +
                            '<div class="media-admin-actions">' +
                                '<button class="btn-sm btn-edit" type="button" onclick="AdminContentCMS.copyMediaUrl(\'' + SEC.js(item.id) + '\')">Copiar URL</button>' +
                                '<button class="btn-sm btn-edit" type="button" onclick="AdminContentCMS.openMediaModal(\'' + SEC.js(item.id) + '\')">Editar</button>' +
                                '<button class="btn-sm btn-edit" type="button" onclick="AdminContentCMS.useMediaInNewEvent(\'' + SEC.js(item.id) + '\')">Usar em evento</button>' +
                                '<button class="btn-sm btn-edit" type="button" onclick="AdminContentCMS.useMediaInNewNews(\'' + SEC.js(item.id) + '\')">Usar em notícia</button>' +
                                '<button class="btn-sm btn-delete" type="button" onclick="AdminContentCMS.deleteMedia(\'' + SEC.js(item.id) + '\')">Excluir</button>' +
                            '</div>' +
                        '</div>' +
                    '</article>';
                }, this).join("") + '</div>';
            } catch (error) {
                console.error("[admin-content-cms] Erro ao carregar mídia.", error);
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">Erro ao carregar mídia.</p>';
            }
        },

        openMediaModal: function (mediaId) {
            var item = mediaId ? this.media.find(function (media) { return media.id === mediaId; }) : null;
            this.openModal(item ? "Editar mídia" : "Adicionar mídia", buildMediaForm(item));
        },

        saveMedia: async function (event) {
            event.preventDefault();
            if (!this.db) return alert("Firestore não inicializado.");

            var form = event.target;
            var title = clean(form.title.value);
            var url = clean(form.url.value);
            var file = form.file.files && form.file.files[0];
            var mediaId = clean(form.mediaId.value);
            var existingItem = mediaId ? getMediaById(this.media, mediaId) : null;

            if (!title) return alert("Título é obrigatório.");
            if (!url && !file && !(existingItem && existingItem.url)) return alert("Informe uma URL ou selecione um arquivo.");

            try {
                if (file) {
                    if (!this.storage) return alert("Firebase Storage não inicializado.");
                    validateImageFile(file);
                    var uploadResult = await uploadImageToCms(this.storage, file);
                    url = uploadResult.url;
                    form.storagePath.value = uploadResult.path;
                    form.contentType.value = file.type;
                    form.size.value = String(file.size);
                } else if (url) {
                    validateImageUrl(url);
                } else if (existingItem) {
                    url = clean(existingItem.url);
                }

                var now = window.firebase.firestore.FieldValue.serverTimestamp();
                var id = mediaId || ("media_" + Date.now());
                await this.db.collection("media_library").doc(id).set({
                    id: id,
                    title: title,
                    url: url,
                    category: clean(form.category.value) || "Imagem",
                    alt: clean(form.alt.value),
                    storagePath: clean(form.storagePath.value) || (existingItem && existingItem.storagePath) || "",
                    contentType: clean(form.contentType.value) || (existingItem && existingItem.contentType) || "",
                    size: Number(form.size.value || (existingItem && existingItem.size) || 0) || 0,
                    createdAt: existingItem && existingItem.createdAt ? existingItem.createdAt : now,
                    updatedAt: now,
                    updatedBy: currentAdminId()
                }, { merge: true });
                this.closeModal();
                await this.loadMedia();
                alert(mediaId ? "Mídia atualizada." : "Mídia cadastrada.");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao salvar mídia.", error);
                alert(error && error.message ? error.message : "Erro ao salvar mídia.");
            }
        },

        copyMediaUrl: async function (mediaId) {
            var item = getMediaById(this.media, mediaId);
            if (!item || !item.url) return alert("URL da mídia não encontrada.");

            try {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                    await navigator.clipboard.writeText(item.url);
                    alert("URL copiada.");
                    return;
                }
            } catch (error) {
                console.error("[admin-content-cms] Falha ao copiar URL.", error);
            }

            var input = document.createElement("input");
            input.value = item.url;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            alert("URL copiada.");
        },

        useMediaInNewEvent: function (mediaId) {
            var item = getMediaById(this.media, mediaId);
            if (!item) return alert("Mídia não encontrada.");

            this.openEventModal("", {
                title: "",
                organizer: "",
                category: "cultural",
                mainImage: item.url,
                image: item.url,
                images: [buildEventImageEntry(item.url, {
                    name: item.title,
                    contentType: item.contentType,
                    size: item.size,
                    path: item.storagePath
                })]
            });
        },

        useMediaInNewNews: function (mediaId) {
            var item = getMediaById(this.media, mediaId);
            if (!item) return alert("Mídia não encontrada.");

            this.openNewsModal("", {
                titulo: "",
                categoria: "Turismo",
                imagem: item.url,
                galeria: [],
                linkOrigem: ""
            });
        },

        deleteMedia: async function (mediaId) {
            var item = getMediaById(this.media, mediaId);
            if (!item) return;
            var usage = getMediaUsageInfo(item.url, this.mediaUsageMap);
            var confirmMessage = usage.total
                ? "Esta mídia parece estar em uso em " + formatMediaUsageSummary(usage).replace(/^Em uso em /, "") + ". Excluir mesmo assim? Eventos ou notícias referenciados podem ficar sem imagem."
                : "Excluir esta mídia da biblioteca?";
            if (!confirm(confirmMessage)) return;

            try {
                if (item.storagePath && this.storage) {
                    try {
                        await this.storage.ref(item.storagePath).delete();
                    } catch (storageError) {
                        console.error("[admin-content-cms] Não foi possível remover o arquivo do Storage.", storageError);
                    }
                }

                await this.db.collection("media_library").doc(mediaId).delete();
                await this.loadMedia();
                alert("Mídia excluída.");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao excluir mídia.", error);
                alert("Erro ao excluir mídia.");
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

    function escapeJsString(value) {
        return String(value == null ? "" : value)
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'");
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

    function getTitle(item) { return item && (item.title || item.nome || item.titulo) || ""; }
    function getEventDate(item) { return item && (item.date || item.data || item.dataInicio) || ""; }
    function getEventTime(item) { return item && (item.time || item.hora || item.horario) || ""; }
    function getLocation(item) { return item && (item.location || item.local || item.establishmentName) || ""; }
    function getOrganizer(item) { return item && (item.organizer || item.organizador || item.ownerName) || ""; }

    function getMediaById(mediaList, mediaId) {
        var normalizedId = clean(mediaId);
        if (!normalizedId) return null;
        return (mediaList || []).find(function (item) { return item.id === normalizedId; }) || null;
    }

    function validateImageFile(file) {
        if (!file) throw new Error("Selecione um arquivo de imagem.");
        if (!IMAGE_TYPE_REGEX.test(file.type || "")) throw new Error("Use imagem JPG, PNG ou WEBP.");
        if (Number(file.size || 0) > MAX_IMAGE_BYTES) throw new Error("Imagem acima de 5 MB.");
    }

    function validateImageUrl(url) {
        if (!isAllowedImageUrl(url)) {
            throw new Error("Informe uma URL de imagem válida em HTTP(S) ou um caminho local permitido.");
        }
    }

    function isAllowedImageUrl(url) {
        var value = clean(url);
        if (!value) return false;
        if (/['"()\\<>]/.test(value)) return false;

        if (value.charAt(0) === "/" || /^(images|docs|videos|css|js)\//i.test(value)) {
            return true;
        }

        return /^https?:\/\//i.test(value);
    }

    async function uploadImageToCms(storage, file) {
        var path = "cms-media/" + currentAdminId() + "/" + Date.now() + "-" + safeFileName(file.name);
        var ref = storage.ref(path);
        await ref.put(file, { contentType: file.type });
        return {
            path: path,
            url: await ref.getDownloadURL()
        };
    }

    function buildEventImageEntry(url, details) {
        var safeDetails = details || {};
        return {
            url: clean(url),
            path: clean(safeDetails.path),
            name: clean(safeDetails.name || safeDetails.fileName),
            contentType: clean(safeDetails.contentType),
            size: Number(safeDetails.size || 0) || 0,
            uploadedAt: clean(safeDetails.uploadedAt)
        };
    }

    function normalizeEventImages(images) {
        var items = Array.isArray(images) ? images : [];
        return dedupeImages(items.map(function (item) {
            if (typeof item === "string") return buildEventImageEntry(item, {});
            return buildEventImageEntry(item && item.url, item);
        }).filter(function (item) {
            return item.url;
        }));
    }

    function dedupeImages(images) {
        var seen = {};
        return (images || []).filter(function (item) {
            var key = clean(item.url || item.path || "");
            if (!key || seen[key]) return false;
            seen[key] = true;
            return true;
        });
    }

    function getPrimaryEventImage(eventItem) {
        var images = normalizeEventImages(eventItem && eventItem.images);
        var directUrl = clean(eventItem && (eventItem.mainImage || eventItem.image || eventItem.coverImage));

        if (directUrl) {
            return buildEventImageEntry(directUrl, images[0] || {});
        }

        return images[0] || null;
    }

    function applyCoverToEventImages(existingImages, coverEntry) {
        var remaining = dedupeImages((existingImages || []).filter(function (item) {
            return clean(item.url) !== clean(coverEntry && coverEntry.url);
        }));
        return coverEntry && coverEntry.url ? [coverEntry].concat(remaining) : remaining;
    }

    function removeFirstEventImage(existingImages, eventItem) {
        var directUrl = clean(eventItem && (eventItem.mainImage || eventItem.image || eventItem.coverImage));
        var filtered = (existingImages || []).slice();

        if (directUrl) {
            filtered = filtered.filter(function (item, index) {
                if (index === 0 && clean(item.url) === directUrl) return false;
                return clean(item.url) !== directUrl;
            });
        } else if (filtered.length) {
            filtered.shift();
        }

        return filtered;
    }

    function formatBytes(size) {
        var bytes = Number(size || 0);
        if (!bytes) return "Tamanho não informado";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1).replace(".", ",") + " KB";
        return (bytes / (1024 * 1024)).toFixed(2).replace(".", ",") + " MB";
    }

    function renderEventCoverPreview(image, note) {
        if (!image || !image.url) {
            return '<div class="event-cover-placeholder">Sem imagem de capa</div><div class="event-cover-meta">' + escapeHtml(note || "Sem capa definida.") + '</div>';
        }

        var previewUrl = safePreviewUrl(image.url);
        var metaParts = [];
        if (image.name) metaParts.push(escapeHtml(image.name));
        if (image.contentType) metaParts.push(escapeHtml(image.contentType));
        if (image.size) metaParts.push(escapeHtml(formatBytes(image.size)));
        if (note) metaParts.push(escapeHtml(note));

        return '<img src="' + previewUrl + '" alt="' + escapeHtml(image.name || "Capa do evento") + '" onerror="this.closest(\\\'.event-cover-preview\\\').classList.add(\\\'is-error\\\');this.remove();">' +
            '<div class="event-cover-meta">' + (metaParts.join(" · ") || "Pré-visualização da capa") + '</div>';
    }

    function renderEventGalleryList(item) {
        var images = normalizeEventImages(item && item.images);
        if (!images.length) {
            return '<div class="event-gallery-admin-empty">Sem galeria salva.</div>';
        }

        return '<div class="event-gallery-admin-list">' + images.map(function (image, index) {
            var imageUrl = safePreviewUrl(image.url);
            return '<a href="' + imageUrl + '" target="_blank" rel="noopener noreferrer" class="event-gallery-admin-item">' +
                '<img src="' + imageUrl + '" alt="' + escapeHtml(image.name || ("Imagem " + (index + 1))) + '" onerror="this.parentNode.classList.add(\\\'is-error\\\');this.remove();">' +
                '<span>' + escapeHtml(image.name || ("Imagem " + (index + 1))) + '</span>' +
                '<small>' + escapeHtml(image.contentType || "Tipo não informado") + ' · ' + escapeHtml(formatBytes(image.size)) + '</small>' +
            '</a>';
        }).join("") + '</div>';
    }

    function buildApprovedEventPreview(item) {
        var cover = getPrimaryEventImage(item);
        var statusLabel = isPublished(item) ? "Publicado" : "Despublicado";
        return '<div class="admin-modal-body"><div class="event-admin-preview">' +
            '<div class="event-admin-preview-grid">' +
                '<section class="event-preview-panel">' +
                    '<h4>Dados principais</h4>' +
                    '<div class="event-preview-fields">' +
                        '<div><strong>Título:</strong> ' + escapeHtml(getTitle(item) || "Sem título") + '</div>' +
                        '<div><strong>Categoria:</strong> ' + escapeHtml(item.category || item.categoria || "—") + '</div>' +
                        '<div><strong>Data:</strong> ' + escapeHtml(getEventDate(item) || "—") + '</div>' +
                        '<div><strong>Horário:</strong> ' + escapeHtml(getEventTime(item) || "—") + '</div>' +
                        '<div><strong>Local:</strong> ' + escapeHtml(getLocation(item) || "—") + '</div>' +
                        '<div><strong>Organizador:</strong> ' + escapeHtml(getOrganizer(item) || "—") + '</div>' +
                        '<div><strong>Status:</strong> ' + escapeHtml(statusLabel) + '</div>' +
                        '<div><strong>Destaque:</strong> ' + escapeHtml(item.destaque ? "Sim" : "Não") + '</div>' +
                    '</div>' +
                '</section>' +
                '<section class="event-preview-panel">' +
                    '<h4>Capa atual</h4>' +
                    '<div class="event-cover-preview">' + renderEventCoverPreview(cover, cover ? "Prévia da capa salva." : "Sem capa definida.") + '</div>' +
                '</section>' +
            '</div>' +
            '<section class="event-gallery-admin"><h4>Galeria atual</h4>' + renderEventGalleryList(item) + '</section>' +
            '<section class="event-preview-panel"><h4>Descrição</h4><div class="event-preview-fields"><div>' + escapeHtml(item.description || item.descricao || "Sem descrição cadastrada.") + '</div></div></section>' +
        '</div></div><div class="admin-modal-footer"><button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Fechar</button><button class="btn-primary" type="button" onclick="AdminContentCMS.closeModal();AdminContentCMS.openEventModal(\'' + escapeJsString(item.id || "") + '\')">Editar este evento</button></div>';
    }

    function buildEventForm(item, mediaItems) {
        item = item || {};
        var currentCover = getPrimaryEventImage(item);
        var images = normalizeEventImages(item.images);
        var selectedMediaId = getMatchingMediaId(mediaItems, currentCover && currentCover.url);

        return '<form id="eventCmsForm" onsubmit="AdminContentCMS.saveEvent(event)">' +
            '<div class="admin-modal-body">' +
                '<input type="hidden" name="eventId" value="' + escapeHtml(item.id || "") + '">' +
                '<input type="hidden" id="eventRemoveCover" name="removeCover" value="false">' +
                '<input type="hidden" id="eventRemoveGalleryCoverFallback" name="removeGalleryCoverFallback" value="false">' +
                '<input type="hidden" id="eventHasGalleryImages" value="' + (images.length ? "true" : "false") + '">' +
                '<div class="admin-modal-grid">' +
                    field("title", "Título", getTitle(item), true) +
                    field("date", "Data", getEventDate(item), true, "date") +
                    field("time", "Horário", getEventTime(item), false, "time") +
                    field("location", "Local", getLocation(item)) +
                    field("organizer", "Organizador", getOrganizer(item)) +
                    field("category", "Categoria", item.category || item.categoria || "cultural") +
                    '<div class="admin-field full">' +
                        '<label for="mainImage">Capa do evento</label>' +
                        '<div class="event-cover-admin-layout">' +
                            '<div class="event-cover-preview" id="eventCoverPreview">' + renderEventCoverPreview(currentCover, currentCover ? "Capa atual." : "Sem capa definida.") + '</div>' +
                            '<div class="event-cover-controls">' +
                                '<div class="admin-field">' +
                                    '<label for="mainImage">URL manual</label>' +
                                    '<input class="admin-input" id="mainImage" name="mainImage" type="url" value="' + escapeHtml(item.mainImage || item.image || item.coverImage || "") + '" oninput="document.getElementById(\\\'eventRemoveCover\\\').value=\\\'false\\\';document.getElementById(\\\'eventRemoveGalleryCoverFallback\\\').value=\\\'false\\\';document.getElementById(\\\'eventMediaId\\\').value=\\\'\\\';var fileInput=document.getElementById(\\\'eventCoverUpload\\\');if(fileInput){fileInput.value=\\\'\\\';}AdminContentCMS.releaseEventPreviewUrl();AdminContentCMS.syncEventCoverPreview();">' +
                                '</div>' +
                                '<div class="admin-field">' +
                                    '<label for="eventMediaId">Biblioteca de mídia</label>' +
                                    buildMediaSelect(mediaItems, selectedMediaId) +
                                '</div>' +
                                '<div class="admin-field">' +
                                    '<label for="eventCoverUpload">Trocar por upload</label>' +
                                    '<input class="admin-input" id="eventCoverUpload" name="coverUpload" type="file" accept="image/jpeg,image/png,image/webp" onchange="AdminContentCMS.previewEventCoverFile(event)">' +
                                    '<small>JPG, PNG ou WEBP até 5 MB.</small>' +
                                '</div>' +
                                '<div class="page-actions">' +
                                    '<button class="btn-sm btn-edit" type="button" onclick="AdminContentCMS.clearEventCoverSelection()">Limpar seleção</button>' +
                                    '<button class="btn-sm btn-delete" type="button" onclick="AdminContentCMS.removeEventCover()">Remover capa</button>' +
                                '</div>' +
                                '<p class="admin-helper-text" style="margin-bottom:0;">A galeria existente só é alterada se você substituir a capa ou confirmar a remoção do fallback.</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="event-gallery-admin">' +
                            '<h4>Galeria atual</h4>' +
                            renderEventGalleryList(item) +
                        '</div>' +
                    '</div>' +
                    '<div class="admin-field"><label for="eventPublished">Status</label><select id="eventPublished" name="publicado"><option value="true"' + (isPublished(item) ? " selected" : "") + '>Publicado</option><option value="false"' + (!isPublished(item) ? " selected" : "") + '>Despublicado</option></select></div>' +
                    '<div class="admin-field full"><label><input type="checkbox" name="destaque" ' + (item.destaque ? "checked" : "") + '> Evento em destaque</label></div>' +
                    textarea("description", "Descrição", item.description || item.descricao || "") +
                '</div>' +
            '</div>' +
            '<div class="admin-modal-footer"><button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Cancelar</button><button class="btn-primary" type="submit">Salvar evento</button></div>' +
        '</form>';
    }

    function getMatchingMediaId(mediaItems, imageUrl) {
        var normalized = normalizeComparableUrl(imageUrl);
        if (!normalized) return "";
        var match = (mediaItems || []).find(function (item) {
            return normalizeComparableUrl(item.url) === normalized;
        });
        return match ? match.id : "";
    }

    function buildMediaSelect(mediaItems, selectedMediaId) {
        return '<select class="admin-input" id="eventMediaId" name="eventMediaId" onchange="document.getElementById(\\\'eventRemoveCover\\\').value=\\\'false\\\';AdminContentCMS.handleEventMediaSelection(this.value)">' +
            '<option value="">Selecione uma mídia da biblioteca</option>' +
            (mediaItems || []).map(function (item) {
                return '<option value="' + escapeHtml(item.id) + '"' + (item.id === selectedMediaId ? " selected" : "") + '>' +
                    escapeHtml(item.title || "Mídia sem título") + ' | ' + escapeHtml(item.category || "Imagem") +
                '</option>';
            }).join("") +
        '</select>';
    }

    AdminContentCMS.handleEventMediaSelection = function (mediaId) {
        var item = getMediaById(this.media, mediaId);
        var urlField = document.getElementById("mainImage");
        var removeField = document.getElementById("eventRemoveCover");
        var fileInput = document.getElementById("eventCoverUpload");

        if (removeField) removeField.value = "false";
        this.releaseEventPreviewUrl();
        if (fileInput) fileInput.value = "";
        if (urlField) {
            urlField.value = item && item.url ? item.url : "";
        }
        this.syncEventCoverPreview();
    };

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

    function buildMediaForm(item) {
        item = item || {};
        return '<form id="mediaCmsForm" onsubmit="AdminContentCMS.saveMedia(event)">' +
            '<div class="admin-modal-body">' +
                '<input type="hidden" name="mediaId" value="' + escapeHtml(item.id || "") + '">' +
                '<input type="hidden" name="storagePath" value="' + escapeHtml(item.storagePath || "") + '">' +
                '<input type="hidden" name="contentType" value="' + escapeHtml(item.contentType || "") + '">' +
                '<input type="hidden" name="size" value="' + escapeHtml(String(item.size || 0)) + '">' +
                '<div class="admin-modal-grid">' +
                    field("title", "Título", item.title || "", true) +
                    field("category", "Categoria", item.category || "Imagem") +
                    field("url", "URL existente", item.url || "", false, "url") +
                    field("file", "Enviar imagem", "", false, "file") +
                    field("alt", "Texto alternativo", item.alt || "") +
                '</div>' +
                (item.url ? '<div class="event-gallery-admin"><h4>Preview atual</h4><div class="event-cover-preview">' + renderEventCoverPreview(buildEventImageEntry(item.url, {
                    name: item.title,
                    contentType: item.contentType,
                    size: item.size
                }), "Imagem da biblioteca.") + '</div></div>' : '') +
            '</div><div class="admin-modal-footer"><button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Cancelar</button><button class="btn-primary" type="submit">' + (item.id ? "Salvar alterações" : "Salvar mídia") + '</button></div></form>';
    }

    function field(name, label, value, required, type) {
        return '<div class="admin-field"><label for="' + name + '">' + label + '</label><input class="admin-input" id="' + name + '" name="' + name + '" type="' + (type || "text") + '" value="' + escapeHtml(value || "") + '"' + (required ? " required" : "") + '></div>';
    }

    function textarea(name, label, value) {
        return '<div class="admin-field full"><label for="' + name + '">' + label + '</label><textarea class="admin-textarea" id="' + name + '" name="' + name + '">' + escapeHtml(value || "") + '</textarea></div>';
    }

    function extractStaticPosts(documentSource) {
        var articles = Array.prototype.slice.call(documentSource.querySelectorAll("#postsGrid article.post-card"));
        return articles.map(function (article, index) {
            var titleNode = article.querySelector(".post-title");
            var excerptNode = article.querySelector(".post-excerpt");
            var categoryNode = article.querySelector(".post-category");
            var linkNode = article.querySelector(".post-link");
            var dateNode = article.querySelector(".post-meta span");
            var imageNode = article.querySelector(".post-image");
            var imageUrl = extractBackgroundImage(imageNode && imageNode.getAttribute("style"));
            var title = clean(titleNode && titleNode.textContent);
            var linkOrigem = clean(linkNode && linkNode.getAttribute("href"));
            var publishedAt = parsePtBrDate(clean(dateNode && dateNode.textContent));
            var slugFromLink = extractSlugFromUrl(linkOrigem);

            if (!title) return null;

            return {
                titulo: title,
                resumo: cleanLong(excerptNode && excerptNode.textContent),
                conteudo: cleanLong(excerptNode && excerptNode.textContent),
                categoria: clean(categoryNode && categoryNode.textContent).replace(/^Destaque\s*·\s*/i, ""),
                imagem: imageUrl || DEFAULT_IMAGE,
                linkOrigem: linkOrigem,
                destaque: index === 0 || /destaque/i.test(clean(categoryNode && categoryNode.textContent)),
                publishedAt: publishedAt || new Date().toISOString(),
                slug: slugFromLink || makeSlug(title)
            };
        }).filter(Boolean);
    }

    function extractBackgroundImage(styleValue) {
        var style = String(styleValue || "");
        var match = style.match(/background-image:\s*url\((['"]?)(.*?)\1\)/i);
        return match && match[2] ? clean(match[2]) : "";
    }

    function parsePtBrDate(value) {
        var text = clean(value).replace(/^📅\s*/, "");
        if (!text) return "";

        var normalized = text.toLowerCase()
            .replace(/\s+de\s+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        var parts = normalized.split(" ");
        var months = {
            janeiro: 0,
            fevereiro: 1,
            marco: 2,
            março: 2,
            abril: 3,
            maio: 4,
            junho: 5,
            julho: 6,
            agosto: 7,
            setembro: 8,
            outubro: 9,
            novembro: 10,
            dezembro: 11
        };

        if (parts.length < 3) return "";
        var day = Number(parts[0]);
        var month = months[parts[1]];
        var year = Number(parts[2]);

        if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) return "";
        return new Date(year, month, day, 12, 0, 0).toISOString();
    }

    function extractSlugFromUrl(url) {
        try {
            var parsed = new URL(url, window.location.origin);
            var parts = parsed.pathname.split("/").filter(Boolean);
            return makeSlug(parts[parts.length - 1] || "");
        } catch (error) {
            return makeSlug(url || "");
        }
    }

    function normalizeComparableUrl(url) {
        var value = clean(url);
        return value.toLowerCase();
    }

    function getEventImageUrls(item) {
        var urls = normalizeEventImages(item && item.images).map(function (image) {
            return image.url;
        });
        var directCover = clean(item && (item.mainImage || item.image || item.coverImage));
        if (directCover) {
            urls.unshift(directCover);
        }
        return dedupeTextValues(urls);
    }

    function getNewsImageUrls(item) {
        var urls = [];
        if (item && item.imagem) urls.push(clean(item.imagem));
        if (Array.isArray(item && item.galeria)) {
            item.galeria.forEach(function (url) {
                urls.push(clean(url));
            });
        }
        return dedupeTextValues(urls);
    }

    function dedupeTextValues(items) {
        var seen = {};
        return (items || []).map(clean).filter(function (value) {
            if (!value || seen[value]) return false;
            seen[value] = true;
            return true;
        });
    }

    function buildMediaUsageMap(events, news) {
        var usageMap = {};

        (events || []).forEach(function (eventItem) {
            var title = getTitle(eventItem) || "Evento sem título";
            getEventImageUrls(eventItem).forEach(function (url) {
                registerMediaUsage(usageMap, url, "event", title);
            });
        });

        (news || []).forEach(function (newsItem) {
            var title = clean(newsItem && newsItem.titulo) || "Notícia sem título";
            getNewsImageUrls(newsItem).forEach(function (url) {
                registerMediaUsage(usageMap, url, "news", title);
            });
        });

        return usageMap;
    }

    function registerMediaUsage(usageMap, url, type, title) {
        var key = normalizeComparableUrl(url);
        if (!key) return;

        if (!usageMap[key]) {
            usageMap[key] = {
                total: 0,
                eventCount: 0,
                newsCount: 0,
                eventTitles: [],
                newsTitles: []
            };
        }

        var target = usageMap[key];
        if (type === "event") {
            if (target.eventTitles.indexOf(title) !== -1) return;
            target.eventTitles.push(title);
            target.eventCount += 1;
            target.total += 1;
            return;
        }

        if (target.newsTitles.indexOf(title) !== -1) return;
        target.newsTitles.push(title);
        target.newsCount += 1;
        target.total += 1;
    }

    function getMediaUsageInfo(url, usageMap) {
        var key = normalizeComparableUrl(url);
        var usage = key && usageMap ? usageMap[key] : null;
        return usage || {
            total: 0,
            eventCount: 0,
            newsCount: 0,
            eventTitles: [],
            newsTitles: []
        };
    }

    function formatMediaUsageSummary(usage) {
        if (!usage || !usage.total) {
            return "Sem uso detectado em eventos ou notícias do CMS.";
        }

        var parts = [];
        if (usage.eventCount) parts.push(usage.eventCount + " evento(s)");
        if (usage.newsCount) parts.push(usage.newsCount + " notícia(s)");
        return "Em uso em " + parts.join(" e ") + ".";
    }

    function safePreviewUrl(url) {
        if (window.SMSecurity && typeof window.SMSecurity.url === "function") {
            return window.SMSecurity.url(url, "");
        }
        return escapeHtml(url || "");
    }

    function buildNewsIdentityKey(title, dateValue) {
        var safeTitle = makeSlug(title || "");
        var safeDate = timestampToMillis(dateValue) ? new Date(timestampToMillis(dateValue)).toISOString().slice(0, 10) : clean(dateValue);
        return safeTitle && safeDate ? safeTitle + "|" + safeDate : "";
    }

    window.AdminContentCMS = AdminContentCMS;
    window.loadApprovedEvents = function () {
        return AdminContentCMS.loadApprovedEvents();
    };
})();
