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
                return Object.assign({}, doc.data(), { id: doc.id });
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
                    return Object.assign({}, doc.data(), { id: doc.id });
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
                            '<button class="btn-sm btn-edit" type="button" data-admin-action="content-preview-event" data-admin-target-id="' + SEC.attr(eventItem.id) + '">Prévia</button>' +
                            '<button class="btn-sm btn-edit" type="button" data-admin-action="content-open-event" data-admin-target-id="' + SEC.attr(eventItem.id) + '">Editar</button>' +
                            '<button class="btn-sm btn-edit" type="button" data-admin-action="content-duplicate-event" data-admin-target-id="' + SEC.attr(eventItem.id) + '">Duplicar</button>' +
                            '<button class="btn-sm btn-edit" type="button" data-admin-action="content-toggle-event-publish" data-admin-target-id="' + SEC.attr(eventItem.id) + '">' + (published ? 'Despublicar' : 'Publicar') + '</button>' +
                            '<button class="btn-sm btn-edit" type="button" data-admin-action="content-toggle-event-featured" data-admin-target-id="' + SEC.attr(eventItem.id) + '">' + (eventItem.destaque ? 'Remover destaque' : 'Destacar') + '</button>' +
                            '<button class="btn-sm btn-delete" type="button" data-admin-action="content-delete-event" data-admin-target-id="' + SEC.attr(eventItem.id) + '">Excluir</button>' +
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
            this.bindEditorForm("eventCmsForm");
        },

        saveEvent: async function (event) {
            event.preventDefault();
            if (!this.db) return notify("Firestore não inicializado.", "error");

            var form = event.target;
            var id = form.eventId.value || ("evt_" + Date.now());
            var publish = form.publicado.value === "true";
            var existingItem = this.events.find(function (item) { return item.id === id; }) || null;
            if (publish && form.dataset.publishReviewed !== "true" && window.AdminContentPreview) {
                if (!clean(form.title.value) || !clean(form.date.value)) return notify("Título e data são obrigatórios.", "error");
                this.showEditorPreview("event", true);
                return;
            }
            setBusy(form, true);
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
                    if (!this.storage) return notify("Firebase Storage não inicializado.", "error");
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
                notify(error && error.message ? error.message : "Erro ao processar a imagem de capa.", "error");
                setBusy(form, false);
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
                notify("Título e data são obrigatórios.", "error");
                setBusy(form, false);
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

            try {
                await this.db.collection("eventos_aprovados").doc(id).set(payload, { merge: true });
            } catch (error) {
                console.error("[admin-content-cms] Erro ao salvar evento.", error);
                notify("Não foi possível salvar o evento. Suas alterações continuam no formulário.", "error");
                setBusy(form, false);
                return;
            }
            this.closeModal();
            await this.loadApprovedEvents();
            notify(publish ? "Evento salvo e publicado na agenda do portal." : "Evento salvo como rascunho (fora do portal).", "success");
        },

        previewEvent: function (eventId) {
            var eventItem = this.events.find(function (item) { return item.id === eventId; });
            if (!eventItem) return notify("Evento não encontrado.", "error");
            if (!window.AdminContentPreview) return this.openModal("Pré-visualizar evento", buildApprovedEventPreview(eventItem));
            var cover = getPrimaryEventImage(eventItem);
            var data = AdminContentPreview.eventFromItem(eventItem, cover && cover.url);
            this.openModal("Prévia do evento",
                '<div class="admin-modal-body">' + AdminContentPreview.renderChecks(AdminContentPreview.checks("event", data)) + AdminContentPreview.render("event", data) + '</div>' +
                '<div class="admin-modal-footer"><button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Fechar</button>' +
                '<button class="btn-primary" type="button" data-admin-action="close-modal-open-event" data-admin-target-id="' + escapeHtml(eventItem.id) + '">Editar este evento</button></div>');
        },

        duplicateEvent: function (eventId) {
            var eventItem = this.events.find(function (item) { return item.id === eventId; });
            if (!eventItem) return notify("Evento não encontrado.", "error");

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

        toggleEventPublish: async function (eventId, confirmedFromReview) {
            var eventItem = this.events.find(function (item) { return item.id === eventId; });
            if (!eventItem) return;
            var publish = !isPublished(eventItem);
            if (publish && !confirmedFromReview) {
                var cover = getPrimaryEventImage(eventItem);
                this.openPublishReview("event", eventItem.id, window.AdminContentPreview
                    ? AdminContentPreview.eventFromItem(eventItem, cover && cover.url)
                    : null);
                return;
            }
            if (!publish && !(await ask({
                title: "Despublicar evento?",
                message: "\"" + (getTitle(eventItem) || "Este evento") + "\" sai da agenda do portal e fica salvo como rascunho.",
                details: ["Você pode publicar de novo quando quiser."],
                confirmLabel: "Despublicar",
                tone: "warning"
            }))) return;
            try {
                await this.db.collection("eventos_aprovados").doc(eventId).set({
                    publicado: publish,
                    status: publish ? "aprovado" : "rascunho",
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: currentAdminId()
                }, { merge: true });
                notify(publish ? "Evento publicado na agenda do portal." : "Evento despublicado.", "success");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao alterar publicação do evento.", error);
                notify("Não foi possível alterar a publicação do evento.", "error");
            }
            this.loadApprovedEvents();
        },

        toggleEventFeatured: async function (eventId) {
            var eventItem = this.events.find(function (item) { return item.id === eventId; });
            if (!eventItem) return;
            try {
                await this.db.collection("eventos_aprovados").doc(eventId).set({
                    destaque: !eventItem.destaque,
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: currentAdminId()
                }, { merge: true });
                notify(eventItem.destaque ? "Destaque removido." : "Evento marcado como destaque.", "success");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao alterar destaque.", error);
                notify("Não foi possível alterar o destaque.", "error");
            }
            this.loadApprovedEvents();
        },

        deleteEvent: async function (eventId) {
            var eventItem = this.events.find(function (item) { return item.id === eventId; }) || {};
            var title = getTitle(eventItem) || "este evento";
            var confirmed = await ask({
                title: "Excluir evento?",
                message: "\"" + title + "\" será apagado da lista de eventos aprovados e sai da agenda do portal.",
                details: ["Esta ação não pode ser desfeita.", "Para tirar do ar temporariamente, use Despublicar."],
                requireText: "EXCLUIR",
                requireTextLabel: "Digite EXCLUIR para confirmar",
                confirmLabel: "Excluir definitivamente",
                tone: "danger"
            });
            if (!confirmed) return;
            try {
                await this.db.collection("eventos_aprovados").doc(eventId).delete();
                notify("Evento excluído.", "success");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao excluir evento.", error);
                notify("Não foi possível excluir o evento. Nada foi alterado.", "error");
            }
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
                notify(error.message, "error");
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

        removeEventCover: async function () {
            var removeField = document.getElementById("eventRemoveCover");
            var removeFallbackField = document.getElementById("eventRemoveGalleryCoverFallback");
            var urlField = document.getElementById("mainImage");
            var fileInput = document.getElementById("eventCoverUpload");
            var mediaSelect = document.getElementById("eventMediaId");
            var hasImages = document.getElementById("eventHasGalleryImages");

            if (removeField) removeField.value = "true";
            if (removeFallbackField) {
                removeFallbackField.value = hasImages && hasImages.value === "true" && await ask({
                    title: "Remover também a imagem de reserva?",
                    message: "Este evento tem galeria salva. A primeira imagem da galeria é usada como capa quando não há capa definida.",
                    details: ["O restante da galeria é preservado.", "Nada é gravado até você salvar o evento."],
                    confirmLabel: "Remover também",
                    cancelLabel: "Manter a galeria inteira"
                })
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
                    return Object.assign({}, doc.data(), { id: doc.id });
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
                            '<button class="btn-sm btn-edit" type="button" data-admin-action="content-preview-news" data-admin-target-id="' + SEC.attr(item.id) + '">Prévia</button>' +
                            '<button class="btn-sm btn-edit" type="button" data-admin-action="content-open-news" data-admin-target-id="' + SEC.attr(item.id) + '">Editar</button>' +
                            '<button class="btn-sm btn-edit" type="button" data-admin-action="content-toggle-news-publish" data-admin-target-id="' + SEC.attr(item.id) + '">' + (published ? 'Despublicar' : 'Publicar') + '</button>' +
                            originAction +
                            '<button class="btn-sm btn-delete" type="button" data-admin-action="content-delete-news" data-admin-target-id="' + SEC.attr(item.id) + '">Excluir</button>' +
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
            this.bindEditorForm("newsCmsForm");
        },

        bindEditorForm: function (formId) {
            var form = document.getElementById(formId);
            if (!form) return;
            // Qualquer edição depois da revisão exige revisar de novo.
            form.addEventListener("input", function () { delete form.dataset.publishReviewed; });
            form.addEventListener("change", function () { delete form.dataset.publishReviewed; });
        },

        currentEventCoverUrl: function () {
            var removeField = document.getElementById("eventRemoveCover");
            if (removeField && removeField.value === "true") return "";
            if (this._eventPreviewObjectUrl) return this._eventPreviewObjectUrl;
            var mediaSelect = document.getElementById("eventMediaId");
            var selected = getMediaById(this.media, mediaSelect && mediaSelect.value);
            if (selected && selected.url) return selected.url;
            var urlField = document.getElementById("mainImage");
            return urlField ? clean(urlField.value) : "";
        },

        // Alterna o editor entre "Editar" e "Prévia". review=true mostra o passo de
        // confirmação antes de gravar algo que vai ao ar.
        showEditorPreview: function (kind, review) {
            var form = document.getElementById(kind === "news" ? "newsCmsForm" : "eventCmsForm");
            if (!form || !window.AdminContentPreview) return;
            var existing = kind === "news"
                ? this.news.find(function (post) { return post.id === form.newsId.value; })
                : this.events.find(function (item) { return item.id === form.eventId.value; });
            var data = kind === "news"
                ? AdminContentPreview.newsFromForm(form, existing)
                : AdminContentPreview.eventFromForm(form, existing, this.currentEventCoverUrl());
            var checks = AdminContentPreview.checks(kind, data);
            var blocked = checks.some(function (item) { return item.tone === "bad"; });
            var wasLive = existing && (kind === "news" ? (existing.publicado === true || existing.status === "publicado") : isPublished(existing));
            form.querySelector("[data-editor-checks]").innerHTML = AdminContentPreview.renderChecks(checks);
            form.querySelector("[data-editor-preview]").innerHTML = AdminContentPreview.render(kind, data);
            var lead = form.querySelector("[data-editor-review-lead]");
            lead.hidden = !review;
            lead.textContent = wasLive
                ? "Este conteúdo já está no ar: ao confirmar, o portal passa a mostrar exatamente esta versão."
                : "Ao confirmar, o conteúdo é publicado no portal assim como aparece abaixo.";
            var confirmBtn = form.querySelector("[data-editor-confirm]");
            confirmBtn.textContent = wasLive ? "Confirmar e atualizar no portal" : "Confirmar e publicar";
            confirmBtn.disabled = blocked;
            confirmBtn.title = blocked ? "Corrija os itens em vermelho antes de publicar" : "";
            setEditorMode(form, "preview", review);
        },

        showEditorEdit: function (kind) {
            var form = document.getElementById(kind === "news" ? "newsCmsForm" : "eventCmsForm");
            if (form) setEditorMode(form, "edit", false);
        },

        confirmEditorPublish: function (kind) {
            var form = document.getElementById(kind === "news" ? "newsCmsForm" : "eventCmsForm");
            if (!form) return;
            form.dataset.publishReviewed = "true";
            if (typeof form.requestSubmit === "function") form.requestSubmit();
            else form.dispatchEvent(new Event("submit", { cancelable: true }));
        },

        saveNews: async function (event) {
            event.preventDefault();
            if (!this.db) return notify("Firestore não inicializado.", "error");

            var form = event.target;
            var title = clean(form.titulo.value);
            if (!title) return notify("Título é obrigatório.", "error");
            if (form.publicado.value === "true" && form.dataset.publishReviewed !== "true" && window.AdminContentPreview) {
                this.showEditorPreview("news", true);
                return;
            }
            setBusy(form, true);

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

            try {
                await this.db.collection("noticias").doc(id).set(payload, { merge: true });
            } catch (error) {
                console.error("[admin-content-cms] Erro ao salvar notícia.", error);
                notify("Não foi possível salvar a notícia. Suas alterações continuam no formulário.", "error");
                setBusy(form, false);
                return;
            }
            this.closeModal();
            await this.loadNews();
            notify(publish ? "Notícia salva e publicada no portal." : "Notícia salva como rascunho (fora do portal).", "success");
        },

        toggleNewsPublish: async function (newsId, confirmedFromReview) {
            var item = this.news.find(function (post) { return post.id === newsId; });
            if (!item) return;
            var publish = !(item.publicado === true || item.status === "publicado");
            if (publish && !confirmedFromReview) {
                this.openPublishReview("news", item.id, window.AdminContentPreview ? AdminContentPreview.newsFromItem(item) : null);
                return;
            }
            if (!publish && !(await ask({
                title: "Despublicar notícia?",
                message: "\"" + (item.titulo || "Esta notícia") + "\" sai do portal e volta a ser rascunho.",
                details: ["Você pode publicar de novo quando quiser."],
                confirmLabel: "Despublicar",
                tone: "warning"
            }))) return;
            try {
                await this.db.collection("noticias").doc(newsId).set({
                    publicado: publish,
                    status: publish ? "publicado" : "rascunho",
                    publishedAt: publish ? (item.publishedAt || new Date().toISOString()) : item.publishedAt || null,
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: currentAdminId()
                }, { merge: true });
                notify(publish ? "Notícia publicada no portal." : "Notícia despublicada.", "success");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao alterar publicação da notícia.", error);
                notify("Não foi possível alterar a publicação da notícia.", "error");
            }
            this.loadNews();
        },

        // Prévia a partir da lista (sem editar): mostra como ficará e pede confirmação.
        openPublishReview: function (kind, id, data) {
            if (!window.AdminContentPreview || !data) {
                return kind === "news" ? this.toggleNewsPublish(id, true) : this.toggleEventPublish(id, true);
            }
            var checks = AdminContentPreview.checks(kind, data);
            var blocked = checks.some(function (item) { return item.tone === "bad"; });
            this.openModal(kind === "news" ? "Revisar antes de publicar a notícia" : "Revisar antes de publicar o evento",
                '<div class="admin-modal-body">' +
                    '<p class="pv-review-lead">É assim que o conteúdo vai aparecer no portal. Confira foto, título, data e texto.</p>' +
                    AdminContentPreview.renderChecks(checks) +
                    AdminContentPreview.render(kind, data) +
                '</div>' +
                '<div class="admin-modal-footer">' +
                    '<button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Cancelar</button>' +
                    '<button class="btn-secondary" type="button" data-admin-action="' + (kind === "news" ? "content-open-news" : "content-open-event") + '" data-admin-target-id="' + escapeHtml(id) + '">Editar antes</button>' +
                    '<button class="btn-primary" type="button" data-admin-action="' + (kind === "news" ? "content-confirm-news-publish" : "content-confirm-event-publish") + '" data-admin-target-id="' + escapeHtml(id) + '"' + (blocked ? " disabled title=\"Corrija os itens em vermelho antes de publicar\"" : "") + '>Publicar agora</button>' +
                '</div>');
        },

        previewNews: function (newsId) {
            var item = this.news.find(function (post) { return post.id === newsId; });
            if (!item) return notify("Notícia não encontrada.", "error");
            if (!window.AdminContentPreview) return this.openNewsModal(newsId);
            var data = AdminContentPreview.newsFromItem(item);
            this.openModal("Prévia da notícia",
                '<div class="admin-modal-body">' + AdminContentPreview.renderChecks(AdminContentPreview.checks("news", data)) + AdminContentPreview.render("news", data) + '</div>' +
                '<div class="admin-modal-footer"><button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Fechar</button>' +
                '<button class="btn-primary" type="button" data-admin-action="content-open-news" data-admin-target-id="' + escapeHtml(item.id) + '">Editar esta notícia</button></div>');
        },

        deleteNews: async function (newsId) {
            var item = this.news.find(function (post) { return post.id === newsId; }) || {};
            var confirmed = await ask({
                title: "Excluir notícia?",
                message: "\"" + (item.titulo || "Esta notícia") + "\" será apagada do CMS" + ((item.publicado === true || item.status === "publicado") ? " e sai do portal." : "."),
                details: ["Esta ação não pode ser desfeita.", "Para tirar do ar temporariamente, use Despublicar."],
                requireText: "EXCLUIR",
                requireTextLabel: "Digite EXCLUIR para confirmar",
                confirmLabel: "Excluir definitivamente",
                tone: "danger"
            });
            if (!confirmed) return;
            try {
                await this.db.collection("noticias").doc(newsId).delete();
                notify("Notícia excluída.", "success");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao excluir notícia.", error);
                notify("Não foi possível excluir a notícia. Nada foi alterado.", "error");
            }
            this.loadNews();
        },

        importStaticNews: async function () {
            if (!this.db) return notify("Firestore não inicializado.", "error");
            if (!(await ask({
                title: "Importar notícias estáticas?",
                message: "As notícias publicadas hoje em noticias.html serão copiadas para o CMS como publicadas.",
                details: ["Notícias já importadas (mesmo slug, link de origem ou título + data) são ignoradas.", "Nenhuma notícia existente é alterada."],
                confirmLabel: "Importar"
            }))) {
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
                    notify("Nenhuma notícia estática foi encontrada para importação.", "info");
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
                    notify("Nenhuma notícia nova foi importada. As notícias estáticas já parecem estar vinculadas ao CMS.", "info");
                    return;
                }

                await batch.commit();
                await this.loadNews();
                notify(importedCount + " notícia(s) importada(s) do conteúdo estático. " + skippedCount + " duplicada(s) foram ignorada(s).", "success");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao importar notícias estáticas.", error);
                notify("Erro ao importar notícias estáticas.", "error");
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
                    this.db.collection("noticias").get(),
                    this.db.collection("rotas").get(),
                    this.db.collection("cms_establishments").get().catch(function (error) {
                        console.warn("[admin-content-cms] Uso em empreendimentos indisponível.", error);
                        return { docs: [] };
                    })
                ]);
                this.events = results[1].docs.map(function (doc) {
                    return Object.assign({}, doc.data(), { id: doc.id });
                }).sort(compareAdminDateDesc);
                this.news = results[2].docs.map(function (doc) {
                    return Object.assign({}, doc.data(), { id: doc.id });
                }).sort(compareAdminDateDesc);
                this.mediaUsageMap = buildMediaUsageMap(this.events, this.news, results[3].docs.map(function (doc) {
                    return Object.assign({}, doc.data(), { id: doc.id });
                }), results[4].docs.map(function (doc) {
                    return Object.assign({}, doc.data(), { id: doc.id });
                }));

                if (!this.media.length) {
                    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Nenhuma mídia cadastrada.</p>';
                    return;
                }

                var SEC = this.SEC;
                container.innerHTML = buildMediaToolbar(this.media.length) + '<div class="media-admin-grid" id="mediaAdminGrid">' + this.media.map(function (item) {
                    var usage = getMediaUsageInfo(item, this.mediaUsageMap);
                    var searchText = [item.title, item.category, item.alt, item.url].join(" ").toLowerCase();
                    return '<article class="media-admin-card" data-media-search="' + SEC.attr(searchText) + '" data-media-usage="' + (usage.total ? 'used' : 'unused') + '" data-media-alt="' + (clean(item.alt) ? 'yes' : 'no') + '">' +
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
                                '<button class="btn-sm btn-edit" type="button" data-admin-action="content-copy-media-url" data-admin-target-id="' + SEC.attr(item.id) + '">Copiar URL</button>' +
                                '<button class="btn-sm btn-edit" type="button" data-admin-action="content-open-media" data-admin-target-id="' + SEC.attr(item.id) + '">Editar</button>' +
                                '<button class="btn-sm btn-edit" type="button" data-admin-action="content-use-media-event" data-admin-target-id="' + SEC.attr(item.id) + '">Usar em evento</button>' +
                                '<button class="btn-sm btn-edit" type="button" data-admin-action="content-use-media-news" data-admin-target-id="' + SEC.attr(item.id) + '">Usar em notícia</button>' +
                                '<button class="btn-sm btn-delete" type="button" data-admin-action="content-delete-media" data-admin-target-id="' + SEC.attr(item.id) + '">Excluir</button>' +
                            '</div>' +
                        '</div>' +
                    '</article>';
                }, this).join("") + '</div>' +
                    '<p class="media-filter-empty" id="mediaFilterEmpty" hidden>Nenhuma imagem corresponde aos filtros.</p>';
                bindMediaToolbar(container);
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
            if (!this.db) return notify("Firestore não inicializado.", "error");

            var form = event.target;
            var title = clean(form.title.value);
            var url = clean(form.url.value);
            var file = form.file.files && form.file.files[0];
            var mediaId = clean(form.mediaId.value);
            var existingItem = mediaId ? getMediaById(this.media, mediaId) : null;

            if (!title) return notify("Título é obrigatório.", "error");
            if (!url && !file && !(existingItem && existingItem.url)) return notify("Informe uma URL ou selecione um arquivo.", "error");

            try {
                if (file) {
                    if (!this.storage) return notify("Firebase Storage não inicializado.", "error");
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
                notify(mediaId ? "Mídia atualizada." : "Mídia cadastrada na biblioteca.", "success");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao salvar mídia.", error);
                notify(error && error.message ? error.message : "Erro ao salvar mídia.", "error");
            }
        },

        copyMediaUrl: async function (mediaId) {
            var item = getMediaById(this.media, mediaId);
            if (!item || !item.url) return notify("URL da mídia não encontrada.", "error");

            try {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                    await navigator.clipboard.writeText(item.url);
                    notify("URL copiada para a área de transferência.", "success");
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
            notify("URL copiada para a área de transferência.", "success");
        },

        useMediaInNewEvent: function (mediaId) {
            var item = getMediaById(this.media, mediaId);
            if (!item) return notify("Mídia não encontrada.", "error");

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
            if (!item) return notify("Mídia não encontrada.", "error");

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
            var usage = getMediaUsageInfo(item, this.mediaUsageMap);
            if (usage.routeCount) {
                notify("Esta mídia está em uso como capa de rota e não pode ser removida da biblioteca.", "warning");
                return;
            }
            var confirmed = await ask(usage.total ? {
                title: "Remover da biblioteca uma mídia em uso?",
                message: "\"" + (item.title || "Esta imagem") + "\" " + formatMediaUsageSummary(usage).replace(/^Em uso em /, "aparece em ").replace(/\.$/, "") + ".",
                details: [
                    "Somente o item do catálogo é removido.",
                    "O arquivo físico e as páginas que já usam a imagem continuam funcionando.",
                    "A imagem deixa de aparecer para seleção nos editores."
                ],
                confirmLabel: "Remover do catálogo",
                tone: "warning"
            } : {
                title: "Remover da biblioteca?",
                message: "\"" + (item.title || "Esta imagem") + "\" deixa de aparecer na biblioteca de mídia.",
                details: ["O arquivo físico é preservado."],
                confirmLabel: "Remover do catálogo",
                tone: "warning"
            });
            if (!confirmed) return;

            try {
                await this.db.collection("media_library").doc(mediaId).delete();
                await this.loadMedia();
                notify("Mídia removida da biblioteca. O arquivo físico foi preservado.", "success");
            } catch (error) {
                console.error("[admin-content-cms] Erro ao remover mídia da biblioteca.", error);
                notify("Erro ao remover mídia da biblioteca.", "error");
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
        '</div></div><div class="admin-modal-footer"><button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Fechar</button><button class="btn-primary" type="button" data-admin-action="close-modal-open-event" data-admin-target-id="' + escapeHtml(item.id || "") + '">Editar este evento</button></div>';
    }

    function buildEventForm(item, mediaItems) {
        item = item || {};
        var currentCover = getPrimaryEventImage(item);
        var images = normalizeEventImages(item.images);
        var selectedMediaId = getMatchingMediaId(mediaItems, currentCover && currentCover.url);
        var eventIsPublished = Boolean(item.id) && isPublished(item);

        return '<form id="eventCmsForm" class="editor-form" data-editor-mode="edit" onsubmit="AdminContentCMS.saveEvent(event)">' +
            editorTabs("event") +
            '<div class="admin-modal-body" data-editor-pane="edit">' +
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
                    '<div class="admin-field"><label for="eventPublished">Status</label><select id="eventPublished" name="publicado"><option value="true"' + (eventIsPublished ? " selected" : "") + '>Publicado</option><option value="false"' + (!eventIsPublished ? " selected" : "") + '>Despublicado</option></select></div>' +
                    '<div class="admin-field full"><label><input type="checkbox" name="destaque" ' + (item.destaque ? "checked" : "") + '> Evento em destaque</label></div>' +
                    textarea("description", "Descrição", item.description || item.descricao || "") +
                '</div>' +
            '</div>' +
            editorPreviewPane() +
            editorFooters("event", "Salvar evento") +
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

    function editorTabs(kind) {
        return '<div class="editor-tabs" role="tablist" aria-label="Modo do editor">' +
            '<button type="button" role="tab" data-editor-tab="edit" aria-selected="true" onclick="AdminContentCMS.showEditorEdit(\'' + kind + '\')">Editar</button>' +
            '<button type="button" role="tab" data-editor-tab="preview" aria-selected="false" onclick="AdminContentCMS.showEditorPreview(\'' + kind + '\', false)">Prévia no portal</button>' +
        '</div>';
    }

    function editorPreviewPane() {
        return '<div class="admin-modal-body editor-preview-pane" data-editor-pane="preview" hidden>' +
            '<p class="pv-review-lead" data-editor-review-lead hidden></p>' +
            '<div data-editor-checks></div>' +
            '<div data-editor-preview></div>' +
        '</div>';
    }

    function editorFooters(kind, saveLabel) {
        return '<div class="admin-modal-footer" data-editor-footer="edit">' +
                '<button class="btn-secondary" type="button" onclick="AdminContentCMS.closeModal()">Cancelar</button>' +
                '<button class="btn-secondary" type="button" onclick="AdminContentCMS.showEditorPreview(\'' + kind + '\', false)">Pré-visualizar</button>' +
                '<button class="btn-primary" type="submit">' + saveLabel + '</button>' +
            '</div>' +
            '<div class="admin-modal-footer" data-editor-footer="review" hidden>' +
                '<button class="btn-secondary" type="button" onclick="AdminContentCMS.showEditorEdit(\'' + kind + '\')">Voltar e editar</button>' +
                '<button class="btn-primary" type="button" data-editor-confirm onclick="AdminContentCMS.confirmEditorPublish(\'' + kind + '\')">Confirmar e publicar</button>' +
            '</div>';
    }

    function setEditorMode(form, mode, review) {
        form.setAttribute("data-editor-mode", mode);
        Array.prototype.forEach.call(form.querySelectorAll("[data-editor-pane]"), function (pane) {
            pane.hidden = pane.getAttribute("data-editor-pane") !== mode;
        });
        Array.prototype.forEach.call(form.querySelectorAll("[data-editor-tab]"), function (tab) {
            tab.setAttribute("aria-selected", String(tab.getAttribute("data-editor-tab") === mode));
        });
        var footerMode = mode === "preview" && review ? "review" : "edit";
        Array.prototype.forEach.call(form.querySelectorAll("[data-editor-footer]"), function (footer) {
            footer.hidden = footer.getAttribute("data-editor-footer") !== footerMode;
        });
        var dialog = form.closest(".admin-modal-dialog");
        if (dialog) dialog.scrollTop = 0;
    }

    function setBusy(form, busy) {
        Array.prototype.forEach.call(form.querySelectorAll('[type="submit"], [data-editor-confirm]'), function (button) {
            if (busy) {
                button.setAttribute("data-label", button.textContent);
                button.textContent = "Salvando…";
                button.disabled = true;
            } else {
                button.textContent = button.getAttribute("data-label") || button.textContent;
                button.disabled = false;
            }
        });
        if (!busy) delete form.dataset.publishReviewed;
    }

    function notify(message, type) {
        if (!message) return;
        if (window.AdminFeedback) return window.AdminFeedback.toast(message, type);
        alert(message);
    }

    function ask(options) {
        if (window.AdminFeedback) return window.AdminFeedback.confirm(options);
        return Promise.resolve(confirm([options.title, options.message].concat(options.details || []).filter(Boolean).join("\n\n")));
    }

    function buildNewsForm(item) {
        item = item || {};
        return '<form id="newsCmsForm" class="editor-form" data-editor-mode="edit" onsubmit="AdminContentCMS.saveNews(event)">' +
            editorTabs("news") +
            '<div class="admin-modal-body" data-editor-pane="edit"><input type="hidden" name="newsId" value="' + escapeHtml(item.id || "") + '">' +
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
            '</div></div>' + editorPreviewPane() + editorFooters("news", "Salvar notícia") + '</form>';
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

    function buildMediaUsageMap(events, news, routes, establishments) {
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

        (routes || []).forEach(function (route) {
            var cover = route && route.cover || {};
            var title = clean(route && route.name) || "Rota sem nome";
            registerMediaUsage(usageMap, { mediaId: cover.mediaId, path: cover.path, url: cover.url }, "route", title);
        });

        (establishments || []).forEach(function (item) {
            if (!item || item.status === "archived") return;
            var media = item.media || {};
            var title = clean(item.name) || "Empreendimento sem nome";
            var images = [media.mainImage].concat(Array.isArray(media.gallery) ? media.gallery : []);
            images.forEach(function (image) {
                if (!image || image.status === "removed") return;
                registerMediaUsage(usageMap, { mediaId: image.mediaId, path: image.path, url: image.url }, "establishment", title);
            });
        });

        return usageMap;
    }

    function registerMediaUsage(usageMap, source, type, title) {
        var identity = source && typeof source === "object" ? source : { url: source };
        var keys = [
            clean(identity.mediaId) ? "id:" + clean(identity.mediaId) : "",
            clean(identity.path || identity.storagePath) ? "path:" + clean(identity.path || identity.storagePath) : "",
            normalizeComparableUrl(identity.url) ? "url:" + normalizeComparableUrl(identity.url) : ""
        ].filter(Boolean);
        if (!keys.length) return;
        keys.forEach(function (key) {
        if (!usageMap[key]) {
            usageMap[key] = {
                total: 0,
                eventCount: 0,
                newsCount: 0,
                routeCount: 0,
                establishmentCount: 0,
                eventTitles: [],
                newsTitles: [],
                routeTitles: [],
                establishmentTitles: []
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
        if (type === "route") {
            if (target.routeTitles.indexOf(title) !== -1) return;
            target.routeTitles.push(title); target.routeCount += 1; target.total += 1; return;
        }
        if (type === "establishment") {
            if (target.establishmentTitles.indexOf(title) !== -1) return;
            target.establishmentTitles.push(title); target.establishmentCount += 1; target.total += 1; return;
        }
        if (target.newsTitles.indexOf(title) !== -1) return;
        target.newsTitles.push(title); target.newsCount += 1; target.total += 1;
        });
    }

    function getMediaUsageInfo(media, usageMap) {
        media = media && typeof media === "object" ? media : { url: media };
        var keys = [clean(media.id || media.mediaId) ? "id:" + clean(media.id || media.mediaId) : "", clean(media.storagePath || media.path) ? "path:" + clean(media.storagePath || media.path) : "", normalizeComparableUrl(media.url) ? "url:" + normalizeComparableUrl(media.url) : ""].filter(Boolean);
        var matches = keys.map(function (key) { return usageMap && usageMap[key]; }).filter(Boolean);
        if (matches.length) {
            var titles = { events: {}, news: {}, routes: {}, establishments: {} };
            matches.forEach(function (match) {
                (match.eventTitles || []).forEach(function (title) { titles.events[title] = true; });
                (match.newsTitles || []).forEach(function (title) { titles.news[title] = true; });
                (match.routeTitles || []).forEach(function (title) { titles.routes[title] = true; });
                (match.establishmentTitles || []).forEach(function (title) { titles.establishments[title] = true; });
            });
            var eventTitles = Object.keys(titles.events), newsTitles = Object.keys(titles.news), routeTitles = Object.keys(titles.routes), establishmentTitles = Object.keys(titles.establishments);
            return { total: eventTitles.length + newsTitles.length + routeTitles.length + establishmentTitles.length, eventCount: eventTitles.length, newsCount: newsTitles.length, routeCount: routeTitles.length, establishmentCount: establishmentTitles.length, eventTitles: eventTitles, newsTitles: newsTitles, routeTitles: routeTitles, establishmentTitles: establishmentTitles };
        }
        return {
            total: 0,
            eventCount: 0,
            newsCount: 0,
            routeCount: 0,
            establishmentCount: 0,
            eventTitles: [],
            newsTitles: [],
            routeTitles: [],
            establishmentTitles: []
        };
    }

    // Busca e filtros da biblioteca (somente na tela; não altera dados).
    function buildMediaToolbar(total) {
        return '<div class="media-toolbar" role="search">' +
            '<label class="media-toolbar-search"><span class="sr-only">Buscar imagens</span>' +
            '<input type="search" id="mediaFilterQuery" placeholder="Buscar por título, categoria, texto alternativo ou arquivo"></label>' +
            '<select id="mediaFilterUsage" aria-label="Filtrar por uso">' +
                '<option value="all">Todas</option><option value="used">Em uso</option><option value="unused">Sem uso detectado</option>' +
            '</select>' +
            '<select id="mediaFilterAlt" aria-label="Filtrar por texto alternativo">' +
                '<option value="all">Com ou sem texto alternativo</option><option value="no">Sem texto alternativo</option>' +
            '</select>' +
            '<span class="media-toolbar-count" id="mediaFilterCount" aria-live="polite">' + total + ' imagens</span>' +
        '</div>';
    }

    function bindMediaToolbar(container) {
        var query = container.querySelector("#mediaFilterQuery");
        var usage = container.querySelector("#mediaFilterUsage");
        var alt = container.querySelector("#mediaFilterAlt");
        var count = container.querySelector("#mediaFilterCount");
        var empty = container.querySelector("#mediaFilterEmpty");
        if (!query || !usage || !alt) return;
        function apply() {
            var q = String(query.value || "").trim().toLowerCase();
            var shown = 0;
            Array.prototype.forEach.call(container.querySelectorAll(".media-admin-card"), function (card) {
                var visible = (!q || (card.getAttribute("data-media-search") || "").indexOf(q) !== -1) &&
                    (usage.value === "all" || card.getAttribute("data-media-usage") === usage.value) &&
                    (alt.value === "all" || card.getAttribute("data-media-alt") === alt.value);
                card.hidden = !visible;
                if (visible) shown += 1;
            });
            if (count) count.textContent = shown + (shown === 1 ? " imagem" : " imagens");
            if (empty) empty.hidden = shown > 0;
        }
        query.addEventListener("input", apply);
        usage.addEventListener("change", apply);
        alt.addEventListener("change", apply);
    }

    function formatMediaUsageSummary(usage) {
        if (!usage || !usage.total) {
            return "Sem uso detectado em eventos, notícias, rotas ou empreendimentos do CMS.";
        }

        var parts = [];
        if (usage.eventCount) parts.push(usage.eventCount + " evento(s)");
        if (usage.newsCount) parts.push(usage.newsCount + " notícia(s)");
        if (usage.routeCount) parts.push(usage.routeCount + " rota(s)");
        if (usage.establishmentCount) parts.push(usage.establishmentCount + " empreendimento(s)");
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
