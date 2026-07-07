/**
 * modules/empreendimentos.js — Admin CMS · CMS-2B
 * ------------------------------------------------
 * CRUD interno de empreendimentos usando o contrato CMS-2A.
 *
 * Collection Firestore: cms_establishments
 * Storage: cms-media + uid + establishments + establishmentId + arquivo
 *
 * Escopo deste bloco:
 *  - listar, pesquisar e filtrar;
 *  - criar e editar registros internos;
 *  - arquivar e restaurar;
 *  - visualizar detalhes;
 *  - upload de imagem principal e galeria;
 *  - timestamps e auditoria basica.
 *
 * Fora do escopo:
 *  - ligar o site publico ao Firestore;
 *  - migrar dados estaticos;
 *  - aplicar solicitacoes aprovadas;
 *  - publicar no site publico.
 */
(function () {
    "use strict";

    if (window.AdminEstablishmentsModule) return;

    var COLLECTION = "cms_establishments";
    var SECTION_ID = "empreendimentos";
    var MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    var IMAGE_TYPE_REGEX = /^image\/(jpeg|jpg|png|webp)$/i;
    var STATUSES = ["draft", "published", "archived"];
    var EDITABLE_STATUSES = ["draft", "archived"];
    var CATEGORIES = [
        { id: "gastronomia", label: "Gastronomia" },
        { id: "hospedagem", label: "Hospedagem" },
        { id: "ponto_turistico", label: "Ponto turistico" },
        { id: "experiencia_turistica", label: "Experiencia turistica" },
        { id: "experiencia_cultural", label: "Experiencia cultural" },
        { id: "natureza_lazer", label: "Natureza e lazer" },
        { id: "turismo_rural", label: "Turismo rural" },
        { id: "institucional", label: "Institucional" },
        { id: "servico", label: "Servico" }
    ];

    var state = {
        items: [],
        loading: false,
        error: "",
        filterStatus: "all",
        filterCategory: "all",
        query: "",
        editingId: "",
        mainPreviewUrl: "",
        galleryPreviewUrls: []
    };

    function escapeHtml(value) {
        if (window.AdminUI && typeof window.AdminUI.escapeHtml === "function") {
            return window.AdminUI.escapeHtml(value);
        }
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }

    function escapeJs(value) {
        return String(value == null ? "" : value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    }

    function clean(value) {
        return String(value == null ? "" : value).trim();
    }

    function limit(value, max) {
        var text = clean(value);
        return text.length > max ? text.slice(0, max) : text;
    }

    function ensureArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function getDb() {
        if (window.AdminContext && window.AdminContext.db) return window.AdminContext.db;
        if (window.firebaseDB && window.firebaseDB.db) return window.firebaseDB.db;
        if (window.firebase && typeof window.firebase.firestore === "function") return window.firebase.firestore();
        return null;
    }

    function getStorage() {
        if (window.AdminContext && window.AdminContext.storage) return window.AdminContext.storage;
        if (window.firebase && typeof window.firebase.storage === "function") return window.firebase.storage();
        return null;
    }

    function currentUid() {
        if (window.currentUser && window.currentUser.uid) return window.currentUser.uid;
        if (window.AdminContext && window.AdminContext.currentUser && window.AdminContext.currentUser.uid) {
            return window.AdminContext.currentUser.uid;
        }
        return "";
    }

    function serverTimestamp() {
        try {
            return window.firebase.firestore.FieldValue.serverTimestamp();
        } catch (error) {
            return null;
        }
    }

    function toMillis(value) {
        if (window.AdminUI && typeof window.AdminUI.timestampToMillis === "function") {
            return window.AdminUI.timestampToMillis(value);
        }
        if (!value) return 0;
        if (typeof value.toMillis === "function") return value.toMillis();
        if (typeof value.seconds === "number") return value.seconds * 1000;
        var parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatDateTime(value) {
        var millis = toMillis(value);
        return millis ? new Date(millis).toLocaleString("pt-BR") : "";
    }

    function toast(message, type) {
        if (window.AdminUI && typeof window.AdminUI.showToast === "function") {
            return window.AdminUI.showToast(message, type);
        }
        if (window.FirebaseSystem && typeof window.FirebaseSystem.showNotification === "function") {
            return window.FirebaseSystem.showNotification(message, type);
        }
        return null;
    }

    function makeSlug(value) {
        return clean(value)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 120) || "empreendimento";
    }

    function normalizeText(value) {
        return clean(value)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function parseList(value) {
        return clean(value).split(/[\n,]+/)
            .map(function (item) { return clean(item); })
            .filter(Boolean)
            .filter(function (item, index, list) { return list.indexOf(item) === index; });
    }

    function joinList(value) {
        return ensureArray(value).filter(Boolean).join("\n");
    }

    function categoryLabel(categoryId, fallback) {
        var match = CATEGORIES.find(function (item) { return item.id === categoryId; });
        return match ? match.label : (fallback || categoryId || "");
    }

    function getSection() {
        return document.getElementById ? document.getElementById("section-" + SECTION_ID) : null;
    }

    function releasePreviewUrls() {
        if (state.mainPreviewUrl && window.URL && typeof window.URL.revokeObjectURL === "function") {
            window.URL.revokeObjectURL(state.mainPreviewUrl);
        }
        state.galleryPreviewUrls.forEach(function (url) {
            if (url && window.URL && typeof window.URL.revokeObjectURL === "function") {
                window.URL.revokeObjectURL(url);
            }
        });
        state.mainPreviewUrl = "";
        state.galleryPreviewUrls = [];
    }

    function validateImageFile(file) {
        if (!file) throw new Error("Selecione uma imagem.");
        if (!IMAGE_TYPE_REGEX.test(file.type || "")) {
            throw new Error("Tipo de arquivo invalido. Use JPG, PNG ou WEBP.");
        }
        if (Number(file.size || 0) > MAX_IMAGE_BYTES) {
            throw new Error("Imagem muito grande. Limite: 5 MB.");
        }
    }

    function safeFileName(value) {
        return String(value || "imagem")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 90);
    }

    function uploadImage(storage, file, uid, establishmentId, subfolder) {
        validateImageFile(file);
        var filename = Date.now() + "-" + safeFileName(file.name);
        var path = ["cms-media", uid, "establishments", establishmentId, subfolder, filename].join("/");
        var ref = storage.ref(path);
        return ref.put(file, {
            contentType: file.type,
            cacheControl: "public,max-age=31536000,immutable"
        }).then(function () {
            return ref.getDownloadURL().then(function (url) {
                return {
                    url: url,
                    path: path,
                    alt: "",
                    caption: "",
                    credit: "",
                    source: "cms-media"
                };
            });
        });
    }

    function deleteUploadedFiles(files) {
        var storage = getStorage();
        if (!storage) return Promise.resolve();
        return Promise.all(ensureArray(files).map(function (item) {
            return item && item.path ? storage.ref(item.path).delete().catch(function () { return null; }) : null;
        }));
    }

    function emptyImage() {
        return { url: "", path: "", alt: "", caption: "", credit: "", source: "" };
    }

    function normalizeImage(value) {
        var raw = value && typeof value === "object" ? value : {};
        return {
            url: limit(raw.url, 2048),
            path: limit(raw.path, 512),
            alt: limit(raw.alt, 160),
            caption: limit(raw.caption, 240),
            credit: limit(raw.credit, 160),
            source: limit(raw.source, 40)
        };
    }

    function normalizeGallery(value) {
        return ensureArray(value).map(function (item, index) {
            var image = normalizeImage(item);
            image.position = Number(item && item.position || index + 1) || index + 1;
            return image;
        }).filter(function (item) {
            return !!item.url;
        });
    }

    function defaultDoc(id, uid) {
        return {
            id: id,
            slug: id,
            name: "",
            categoryId: "gastronomia",
            categoryLabel: "Gastronomia",
            status: "draft",
            content: {
                summary: "",
                description: "",
                longDescription: "",
                accessibility: "",
                openingHours: "",
                tags: [],
                notesInternal: ""
            },
            contact: {
                phone: "",
                whatsapp: "",
                email: "",
                website: "",
                instagram: "",
                facebook: ""
            },
            location: {
                address: "",
                neighborhood: "",
                city: "Sao Mateus do Sul",
                state: "PR",
                postalCode: "",
                coordinates: { lat: null, lng: null },
                mapsUrl: "",
                coordStatus: "",
                coordNote: ""
            },
            media: {
                mainImage: emptyImage(),
                gallery: [],
                videoUrl: "",
                sourceCredits: ""
            },
            relationships: {
                routeIds: [],
                relatedPlaceIds: [],
                relatedEventIds: [],
                legacyRoute: "",
                legacyRouteName: ""
            },
            display: {
                featured: false,
                priority: 0,
                mapVisible: true,
                claimable: true
            },
            seo: {
                title: "",
                description: "",
                canonicalPath: ""
            },
            publishing: {
                publishedAt: null,
                publishedBy: "",
                archivedAt: null,
                archivedBy: "",
                archiveReason: ""
            },
            review: {
                lastAppliedRequestId: "",
                lastAppliedAt: null,
                lastAppliedBy: "",
                lastReviewNotes: ""
            },
            source: {
                origin: "admin",
                sourceFile: "",
                originalId: id,
                originalCategory: "",
                legacyIds: [],
                seededAt: null,
                sourceUpdatedAt: null
            },
            createdAt: serverTimestamp(),
            createdBy: uid,
            updatedAt: serverTimestamp(),
            updatedBy: uid
        };
    }

    function normalizeDoc(data, docId) {
        var raw = data || {};
        var id = clean(raw.id || docId);
        var content = raw.content || {};
        var contact = raw.contact || {};
        var location = raw.location || {};
        var media = raw.media || {};
        var relationships = raw.relationships || {};
        var display = raw.display || {};
        var seo = raw.seo || {};
        var publishing = raw.publishing || {};
        var review = raw.review || {};
        var source = raw.source || {};
        return {
            id: id,
            __id: docId || id,
            slug: clean(raw.slug || id),
            name: clean(raw.name),
            categoryId: clean(raw.categoryId || "gastronomia"),
            categoryLabel: clean(raw.categoryLabel || categoryLabel(raw.categoryId, "Gastronomia")),
            status: STATUSES.indexOf(clean(raw.status)) !== -1 ? clean(raw.status) : "draft",
            content: {
                summary: clean(content.summary),
                description: clean(content.description),
                longDescription: clean(content.longDescription),
                accessibility: clean(content.accessibility),
                openingHours: clean(content.openingHours),
                tags: ensureArray(content.tags).map(clean).filter(Boolean),
                notesInternal: clean(content.notesInternal)
            },
            contact: {
                phone: clean(contact.phone),
                whatsapp: clean(contact.whatsapp),
                email: clean(contact.email),
                website: clean(contact.website),
                instagram: clean(contact.instagram),
                facebook: clean(contact.facebook)
            },
            location: {
                address: clean(location.address),
                neighborhood: clean(location.neighborhood),
                city: clean(location.city || "Sao Mateus do Sul"),
                state: clean(location.state || "PR"),
                postalCode: clean(location.postalCode),
                coordinates: {
                    lat: typeof (location.coordinates && location.coordinates.lat) === "number" ? location.coordinates.lat : null,
                    lng: typeof (location.coordinates && location.coordinates.lng) === "number" ? location.coordinates.lng : null
                },
                mapsUrl: clean(location.mapsUrl),
                coordStatus: clean(location.coordStatus),
                coordNote: clean(location.coordNote)
            },
            media: {
                mainImage: normalizeImage(media.mainImage),
                gallery: normalizeGallery(media.gallery),
                videoUrl: clean(media.videoUrl),
                sourceCredits: clean(media.sourceCredits)
            },
            relationships: {
                routeIds: ensureArray(relationships.routeIds).map(clean).filter(Boolean),
                relatedPlaceIds: ensureArray(relationships.relatedPlaceIds).map(clean).filter(Boolean),
                relatedEventIds: ensureArray(relationships.relatedEventIds).map(clean).filter(Boolean),
                legacyRoute: clean(relationships.legacyRoute),
                legacyRouteName: clean(relationships.legacyRouteName)
            },
            display: {
                featured: display.featured === true,
                priority: Number.isFinite(Number(display.priority)) ? Math.round(Number(display.priority)) : 0,
                mapVisible: display.mapVisible !== false,
                claimable: display.claimable !== false
            },
            seo: {
                title: clean(seo.title),
                description: clean(seo.description),
                canonicalPath: clean(seo.canonicalPath)
            },
            publishing: {
                publishedAt: publishing.publishedAt || null,
                publishedBy: clean(publishing.publishedBy),
                archivedAt: publishing.archivedAt || null,
                archivedBy: clean(publishing.archivedBy),
                archiveReason: clean(publishing.archiveReason)
            },
            review: {
                lastAppliedRequestId: clean(review.lastAppliedRequestId),
                lastAppliedAt: review.lastAppliedAt || null,
                lastAppliedBy: clean(review.lastAppliedBy),
                lastReviewNotes: clean(review.lastReviewNotes)
            },
            source: {
                origin: clean(source.origin || "admin"),
                sourceFile: clean(source.sourceFile),
                originalId: clean(source.originalId || id),
                originalCategory: clean(source.originalCategory),
                legacyIds: ensureArray(source.legacyIds).map(clean).filter(Boolean),
                seededAt: source.seededAt || null,
                sourceUpdatedAt: source.sourceUpdatedAt || null
            },
            createdAt: raw.createdAt || null,
            createdBy: clean(raw.createdBy),
            updatedAt: raw.updatedAt || null,
            updatedBy: clean(raw.updatedBy)
        };
    }

    function render(container) {
        var target = (container && container.nodeType === 1) ? container : getSection();
        if (!target) return null;
        target.innerHTML = buildShell();
        renderList();
        return target;
    }

    function buildShell() {
        return '' +
            '<div class="page-header">' +
                '<h1>🏨 Empreendimentos</h1>' +
                '<div class="page-actions">' +
                    '<button class="btn-secondary" type="button" onclick="AdminEstablishmentsModule.refresh()">Atualizar</button>' +
                    '<button class="btn-primary" type="button" onclick="AdminEstablishmentsModule.openForm()">Novo empreendimento</button>' +
                '</div>' +
            '</div>' +
            '<div class="card">' +
                '<div class="card-header"><h2>Catalogo interno do CMS</h2></div>' +
                '<p class="admin-helper-text">CRUD interno para preparar a infraestrutura de empreendimentos. Este modulo nao liga o site publico ao Firestore, nao migra dados estaticos e nao aplica solicitacoes automaticamente.</p>' +
                '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:flex-end;margin-top:0.75rem;">' +
                    '<div class="admin-field" style="margin:0;min-width:220px;">' +
                        '<label for="establishmentSearch">Pesquisa</label>' +
                        '<input class="admin-input" id="establishmentSearch" type="search" placeholder="Nome, categoria, endereco..." value="' + escapeAttr(state.query) + '" oninput="AdminEstablishmentsModule.onFilterChange()">' +
                    '</div>' +
                    '<div class="admin-field" style="margin:0;min-width:160px;">' +
                        '<label for="establishmentStatusFilter">Status</label>' +
                        buildSelect("establishmentStatusFilter", [
                            { value: "all", label: "Todos" },
                            { value: "draft", label: "Rascunho" },
                            { value: "archived", label: "Arquivado" },
                            { value: "published", label: "Publicado (sem acao neste bloco)" }
                        ], state.filterStatus, "AdminEstablishmentsModule.onFilterChange()") +
                    '</div>' +
                    '<div class="admin-field" style="margin:0;min-width:180px;">' +
                        '<label for="establishmentCategoryFilter">Categoria</label>' +
                        buildSelect("establishmentCategoryFilter", [{ value: "all", label: "Todas" }].concat(CATEGORIES.map(function (cat) {
                            return { value: cat.id, label: cat.label };
                        })), state.filterCategory, "AdminEstablishmentsModule.onFilterChange()") +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="card">' +
                '<div id="establishments-admin-list"></div>' +
            '</div>' +
            '<div id="establishments-admin-editor"></div>';
    }

    function buildSelect(id, options, selected, onchange) {
        return '<select class="admin-input" id="' + escapeAttr(id) + '"' +
            (onchange ? ' onchange="' + onchange + '"' : '') + '>' +
            options.map(function (opt) {
                return '<option value="' + escapeAttr(opt.value) + '"' +
                    (opt.value === selected ? " selected" : "") + '>' +
                    escapeHtml(opt.label) + '</option>';
            }).join("") +
            '</select>';
    }

    function load() {
        var db = getDb();
        if (!db) {
            state.error = "Firebase indisponivel. Faça login no admin e tente novamente.";
            state.loading = false;
            renderList();
            return false;
        }
        state.loading = true;
        state.error = "";
        renderList();
        return db.collection(COLLECTION).get().then(function (snapshot) {
            var items = [];
            snapshot.forEach(function (doc) {
                items.push(normalizeDoc(doc.data() || {}, doc.id));
            });
            items.sort(function (a, b) {
                return toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt);
            });
            state.items = items;
            state.loading = false;
            renderList();
            return true;
        }).catch(function (error) {
            state.items = [];
            state.loading = false;
            state.error = error && error.code === "permission-denied"
                ? "Permissao negada. Verifique se as Firestore Rules do CMS-2B foram publicadas e se sua conta e admin."
                : "Erro ao carregar empreendimentos. Veja o console.";
            console.warn("[admin-establishments] Falha ao carregar.", error);
            renderList();
            return false;
        });
    }

    function filteredItems() {
        var q = normalizeText(state.query);
        return state.items.filter(function (item) {
            if (state.filterStatus !== "all" && item.status !== state.filterStatus) return false;
            if (state.filterCategory !== "all" && item.categoryId !== state.filterCategory) return false;
            if (!q) return true;
            var haystack = normalizeText([
                item.name,
                item.slug,
                item.categoryLabel,
                item.content.summary,
                item.content.description,
                item.location.address,
                item.contact.phone,
                item.contact.instagram,
                item.relationships.legacyRouteName,
                ensureArray(item.content.tags).join(" ")
            ].join(" "));
            return haystack.indexOf(q) !== -1;
        });
    }

    function renderList() {
        var list = document.getElementById ? document.getElementById("establishments-admin-list") : null;
        if (!list) return;
        if (state.loading) {
            list.innerHTML = '<div class="loading">Carregando empreendimentos...</div>';
            return;
        }
        if (state.error) {
            list.innerHTML = '<p style="text-align:center;padding:2rem;color:#b42318;">' + escapeHtml(state.error) + '</p>';
            return;
        }
        var items = filteredItems();
        if (!items.length) {
            list.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Nenhum empreendimento encontrado.</p>';
            return;
        }
        list.innerHTML = '<div style="overflow-x:auto;"><table class="data-table">' +
            '<thead><tr>' +
                '<th>Empreendimento</th>' +
                '<th>Categoria</th>' +
                '<th>Status</th>' +
                '<th>Contato/local</th>' +
                '<th>Atualizado</th>' +
                '<th>Acoes</th>' +
            '</tr></thead><tbody>' +
            items.map(renderRow).join("") +
            '</tbody></table></div>';
    }

    function renderRow(item) {
        var jsId = escapeJs(item.__id);
        var image = item.media && item.media.mainImage && item.media.mainImage.url
            ? '<img src="' + escapeAttr(item.media.mainImage.url) + '" alt="" style="width:48px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #ddd;">'
            : '<span style="display:inline-flex;width:48px;height:36px;align-items:center;justify-content:center;border:1px solid #ddd;border-radius:4px;color:#aaa;font-size:0.75rem;">sem</span>';
        var contact = [item.contact.phone || item.contact.whatsapp, item.location.address].filter(Boolean).join("<br>");
        return '<tr>' +
            '<td><div style="display:flex;gap:0.65rem;align-items:center;">' + image +
                '<div><strong>' + escapeHtml(item.name || "(sem nome)") + '</strong><br>' +
                '<small style="color:#666;">' + escapeHtml(item.__id) + '</small></div></div></td>' +
            '<td>' + escapeHtml(item.categoryLabel || item.categoryId) + '</td>' +
            '<td>' + statusBadge(item.status) + '</td>' +
            '<td><small>' + (contact ? contact : "—") + '</small></td>' +
            '<td><small>' + escapeHtml(formatDateTime(item.updatedAt || item.createdAt) || "—") + '</small></td>' +
            '<td><div style="display:flex;gap:0.35rem;flex-wrap:wrap;">' +
                '<button class="btn-secondary" type="button" onclick="AdminEstablishmentsModule.viewDetails(\'' + jsId + '\')">Ver</button>' +
                '<button class="btn-secondary" type="button" onclick="AdminEstablishmentsModule.openForm(\'' + jsId + '\')">Editar</button>' +
                (item.status === "archived"
                    ? '<button class="btn-primary" type="button" onclick="AdminEstablishmentsModule.restore(\'' + jsId + '\')">Restaurar</button>'
                    : '<button class="btn-secondary" type="button" onclick="AdminEstablishmentsModule.archive(\'' + jsId + '\')">Arquivar</button>') +
            '</div></td>' +
            '</tr>';
    }

    function statusBadge(status) {
        var normalized = clean(status) || "draft";
        if (normalized === "archived") return '<span class="badge badge-danger">Arquivado</span>';
        if (normalized === "published") return '<span class="badge badge-info">Publicado (interno)</span>';
        return '<span class="badge badge-warning">Rascunho</span>';
    }

    function findItem(id) {
        return state.items.find(function (item) { return item.__id === id || item.id === id; }) || null;
    }

    function openForm(id) {
        releasePreviewUrls();
        state.editingId = clean(id);
        var existing = state.editingId ? findItem(state.editingId) : null;
        var uid = currentUid();
        var item = existing || defaultDoc("", uid);
        var target = document.getElementById ? document.getElementById("establishments-admin-editor") : null;
        if (!target) return;
        target.innerHTML = buildForm(item, !!existing);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        updateMainImagePreview(item.media.mainImage.url, item.media.mainImage.path || item.media.mainImage.source);
        renderGalleryPreview();
    }

    function buildForm(item, editing) {
        var title = editing ? "Editar empreendimento" : "Novo empreendimento";
        var mainImage = item.media && item.media.mainImage ? item.media.mainImage : emptyImage();
        return '<div class="card" id="establishmentsEditorCard">' +
            '<div class="card-header"><h2>' + escapeHtml(title) + '</h2><span class="badge badge-info">Uso interno</span></div>' +
            '<form id="establishmentForm" onsubmit="AdminEstablishmentsModule.submitForm(event)">' +
                '<input type="hidden" id="est_form_editingId" value="' + escapeAttr(item.__id || "") + '">' +
                '<div class="admin-modal-grid">' +
                    field("Nome", "est_name", item.name, "text", true) +
                    field("ID / slug canonico", "est_slug", item.slug || item.id, "text", true, editing ? "readonly" : "") +
                    selectField("Categoria", "est_categoryId", CATEGORIES, item.categoryId) +
                    readonlyStatusField(item.status) +
                    textareaField("Resumo", "est_summary", item.content.summary, true) +
                    textareaField("Descricao", "est_description", item.content.description, false) +
                    textareaField("Descricao longa", "est_longDescription", item.content.longDescription, false) +
                    field("Telefone", "est_phone", item.contact.phone, "text") +
                    field("WhatsApp", "est_whatsapp", item.contact.whatsapp, "text") +
                    field("E-mail", "est_email", item.contact.email, "email") +
                    field("Site", "est_website", item.contact.website, "url") +
                    field("Instagram", "est_instagram", item.contact.instagram, "text") +
                    field("Facebook", "est_facebook", item.contact.facebook, "text") +
                    field("Endereco/localizacao", "est_address", item.location.address, "text") +
                    field("Bairro", "est_neighborhood", item.location.neighborhood, "text") +
                    field("Cidade", "est_city", item.location.city, "text") +
                    field("Estado", "est_state", item.location.state, "text") +
                    field("CEP", "est_postalCode", item.location.postalCode, "text") +
                    field("Latitude", "est_lat", item.location.coordinates.lat == null ? "" : item.location.coordinates.lat, "number", false, 'step="any"') +
                    field("Longitude", "est_lng", item.location.coordinates.lng == null ? "" : item.location.coordinates.lng, "number", false, 'step="any"') +
                    field("Google Maps URL", "est_mapsUrl", item.location.mapsUrl, "url") +
                    field("Status da coordenada", "est_coordStatus", item.location.coordStatus, "text") +
                    textareaField("Observacao da coordenada", "est_coordNote", item.location.coordNote, false) +
                    textareaField("Horario", "est_openingHours", item.content.openingHours, false) +
                    textareaField("Acessibilidade", "est_accessibility", item.content.accessibility, false) +
                    textareaField("Tags (uma por linha ou separadas por virgula)", "est_tags", joinList(item.content.tags), false) +
                    textareaField("Rotas relacionadas (IDs)", "est_routeIds", joinList(item.relationships.routeIds), false) +
                    field("Rota legada", "est_legacyRoute", item.relationships.legacyRoute, "text") +
                    field("Nome da rota legada", "est_legacyRouteName", item.relationships.legacyRouteName, "text") +
                    checkboxField("Destaque interno", "est_featured", item.display.featured) +
                    field("Prioridade", "est_priority", item.display.priority, "number") +
                    checkboxField("Visivel no mapa futuro", "est_mapVisible", item.display.mapVisible) +
                    checkboxField("Reivindicavel no Portal", "est_claimable", item.display.claimable) +
                    field("Titulo SEO futuro", "est_seoTitle", item.seo.title, "text") +
                    textareaField("Descricao SEO futura", "est_seoDescription", item.seo.description, false) +
                    field("Canonical path futuro", "est_canonicalPath", item.seo.canonicalPath, "text") +
                    field("Origem", "est_sourceOrigin", item.source.origin || "admin", "text") +
                    field("Arquivo de origem", "est_sourceFile", item.source.sourceFile, "text") +
                    field("ID original", "est_originalId", item.source.originalId, "text") +
                    field("Categoria original", "est_originalCategory", item.source.originalCategory, "text") +
                    textareaField("Aliases/IDs legados", "est_legacyIds", joinList(item.source.legacyIds), false) +
                    textareaField("Notas internas", "est_notesInternal", item.content.notesInternal, false) +
                    textareaField("Notas de revisao", "est_reviewNotes", item.review.lastReviewNotes, false) +
                '</div>' +
                '<div class="card" style="margin-top:1rem;">' +
                    '<div class="card-header"><h2>Imagem principal</h2></div>' +
                    '<div class="admin-modal-grid">' +
                        field("URL da imagem principal", "est_mainImageUrl", mainImage.url, "url") +
                        field("Alt da imagem principal", "est_mainImageAlt", mainImage.alt, "text") +
                        field("Legenda da imagem principal", "est_mainImageCaption", mainImage.caption, "text") +
                        field("Credito da imagem principal", "est_mainImageCredit", mainImage.credit, "text") +
                        '<div class="admin-field full"><label for="est_mainImageFile">Upload da imagem principal</label>' +
                            '<input class="admin-input" id="est_mainImageFile" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onchange="AdminEstablishmentsModule.onMainImageChange(event)">' +
                            '<p class="admin-helper-text">JPG, PNG ou WebP ate 5 MB. Salva no path de CMS Media do empreendimento.</p>' +
                            '<div id="est_mainImagePreview"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="card" style="margin-top:1rem;">' +
                    '<div class="card-header"><h2>Galeria</h2></div>' +
                    '<div class="admin-field">' +
                        '<label for="est_galleryUrls">URLs atuais da galeria (uma por linha)</label>' +
                        '<textarea class="admin-input" id="est_galleryUrls" rows="4">' + escapeHtml(ensureArray(item.media.gallery).map(function (img) { return img.url; }).join("\n")) + '</textarea>' +
                    '</div>' +
                    '<div class="admin-field">' +
                        '<label for="est_galleryFiles">Adicionar imagens por upload</label>' +
                        '<input class="admin-input" id="est_galleryFiles" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onchange="AdminEstablishmentsModule.onGalleryChange(event)">' +
                        '<p class="admin-helper-text">As imagens selecionadas serao adicionadas ao final da galeria ao salvar.</p>' +
                        '<div id="est_galleryPreview"></div>' +
                    '</div>' +
                    field("Video URL futuro", "est_videoUrl", item.media.videoUrl, "url") +
                    textareaField("Creditos/fontes de midia", "est_sourceCredits", item.media.sourceCredits, false) +
                '</div>' +
                '<div class="admin-modal-footer" style="margin-top:1rem;">' +
                    '<button class="btn-secondary" type="button" onclick="AdminEstablishmentsModule.cancelForm()">Cancelar</button>' +
                    '<button class="btn-primary" type="submit" id="establishmentSaveBtn">Salvar rascunho interno</button>' +
                '</div>' +
            '</form>' +
        '</div>';
    }

    function field(label, id, value, type, required, extraAttrs) {
        return '<div class="admin-field">' +
            '<label for="' + escapeAttr(id) + '">' + escapeHtml(label) + '</label>' +
            '<input class="admin-input" id="' + escapeAttr(id) + '" type="' + escapeAttr(type || "text") + '" value="' + escapeAttr(value) + '"' +
            (required ? " required" : "") + (extraAttrs ? " " + extraAttrs : "") + '>' +
        '</div>';
    }

    function textareaField(label, id, value, required) {
        return '<div class="admin-field full">' +
            '<label for="' + escapeAttr(id) + '">' + escapeHtml(label) + '</label>' +
            '<textarea class="admin-input" id="' + escapeAttr(id) + '" rows="3"' + (required ? " required" : "") + '>' + escapeHtml(value) + '</textarea>' +
        '</div>';
    }

    function selectField(label, id, options, selected) {
        return '<div class="admin-field">' +
            '<label for="' + escapeAttr(id) + '">' + escapeHtml(label) + '</label>' +
            buildSelect(id, options.map(function (item) {
                return { value: item.id, label: item.label };
            }), selected, "") +
        '</div>';
    }

    function checkboxField(label, id, checked) {
        return '<div class="admin-field">' +
            '<label for="' + escapeAttr(id) + '">' + escapeHtml(label) + '</label>' +
            '<label style="display:flex;gap:0.5rem;align-items:center;font-weight:600;">' +
                '<input id="' + escapeAttr(id) + '" type="checkbox"' + (checked ? " checked" : "") + '> Sim' +
            '</label>' +
        '</div>';
    }

    function readonlyStatusField(status) {
        var normalized = STATUSES.indexOf(status) !== -1 ? status : "draft";
        return '<div class="admin-field">' +
            '<label>Status</label>' +
            '<input class="admin-input" value="' + escapeAttr(normalized) + '" readonly>' +
            '<p class="admin-helper-text">Este bloco nao publica no site. O CRUD salva rascunhos internos e permite arquivar/restaurar.</p>' +
        '</div>';
    }

    function updateMainImagePreview(url, note) {
        var target = document.getElementById ? document.getElementById("est_mainImagePreview") : null;
        if (!target) return;
        if (!url) {
            target.innerHTML = '<div style="border:2px dashed #ddd;border-radius:4px;padding:1rem;color:#999;text-align:center;">Sem imagem principal</div>';
            return;
        }
        target.innerHTML = '<img src="' + escapeAttr(url) + '" alt="" style="max-width:220px;max-height:140px;object-fit:contain;border:1px solid #ddd;border-radius:4px;display:block;">' +
            (note ? '<small style="display:block;margin-top:0.35rem;color:#666;word-break:break-all;">' + escapeHtml(note) + '</small>' : '');
    }

    function renderGalleryPreview() {
        var target = document.getElementById ? document.getElementById("est_galleryPreview") : null;
        var input = document.getElementById ? document.getElementById("est_galleryFiles") : null;
        if (!target) return;
        var files = input && input.files ? Array.prototype.slice.call(input.files) : [];
        if (!files.length) {
            target.innerHTML = '<small style="color:#777;">Nenhuma imagem nova selecionada.</small>';
            return;
        }
        target.innerHTML = '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">' + files.map(function (file) {
            return '<span class="badge badge-info">' + escapeHtml(file.name) + '</span>';
        }).join("") + '</div>';
    }

    function onMainImageChange(event) {
        if (state.mainPreviewUrl && window.URL && typeof window.URL.revokeObjectURL === "function") {
            window.URL.revokeObjectURL(state.mainPreviewUrl);
        }
        state.mainPreviewUrl = "";
        var file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) {
            updateMainImagePreview(clean(document.getElementById("est_mainImageUrl").value), "");
            return;
        }
        try {
            validateImageFile(file);
            if (window.URL && typeof window.URL.createObjectURL === "function") {
                state.mainPreviewUrl = window.URL.createObjectURL(file);
                updateMainImagePreview(state.mainPreviewUrl, file.name + " - aguardando salvar");
            }
        } catch (error) {
            toast(error.message, "error");
            event.target.value = "";
        }
    }

    function onGalleryChange(event) {
        state.galleryPreviewUrls.forEach(function (url) {
            if (url && window.URL && typeof window.URL.revokeObjectURL === "function") {
                window.URL.revokeObjectURL(url);
            }
        });
        state.galleryPreviewUrls = [];
        var files = event && event.target && event.target.files ? Array.prototype.slice.call(event.target.files) : [];
        try {
            files.forEach(validateImageFile);
            renderGalleryPreview();
        } catch (error) {
            toast(error.message, "error");
            event.target.value = "";
            renderGalleryPreview();
        }
    }

    function value(id) {
        var el = document.getElementById ? document.getElementById(id) : null;
        return el ? clean(el.value) : "";
    }

    function checked(id) {
        var el = document.getElementById ? document.getElementById(id) : null;
        return !!(el && el.checked);
    }

    function numberOrNull(id) {
        var raw = value(id);
        if (!raw) return null;
        var num = Number(raw);
        return Number.isFinite(num) ? num : null;
    }

    function readForm(existing, uid) {
        var editingId = value("est_form_editingId");
        var slug = makeSlug(value("est_slug") || value("est_name"));
        var id = editingId || slug;
        var base = existing ? normalizeDoc(existing, existing.__id) : defaultDoc(id, uid);
        var categoryId = value("est_categoryId") || "gastronomia";
        var lat = numberOrNull("est_lat");
        var lng = numberOrNull("est_lng");
        var priority = Number(value("est_priority"));
        var manualGallery = parseList(value("est_galleryUrls")).map(function (url, index) {
            var existingImage = ensureArray(base.media.gallery).find(function (img) { return img.url === url; }) || {};
            return normalizeImage(Object.assign({}, existingImage, {
                url: url,
                source: existingImage.source || (url.indexOf("firebasestorage.googleapis.com") !== -1 ? "cms-media" : "external")
            }, { position: index + 1 }));
        });
        base.id = id;
        base.slug = slug;
        base.name = limit(value("est_name"), 160);
        base.categoryId = categoryId;
        base.categoryLabel = categoryLabel(categoryId, value("est_categoryId"));
        base.status = EDITABLE_STATUSES.indexOf(base.status) !== -1 ? base.status : "draft";
        base.content = {
            summary: limit(value("est_summary"), 500),
            description: limit(value("est_description"), 4000),
            longDescription: limit(value("est_longDescription"), 8000),
            accessibility: limit(value("est_accessibility"), 1000),
            openingHours: limit(value("est_openingHours"), 500),
            tags: parseList(value("est_tags")).slice(0, 30),
            notesInternal: limit(value("est_notesInternal"), 2000)
        };
        base.contact = {
            phone: limit(value("est_phone"), 120),
            whatsapp: limit(value("est_whatsapp"), 120),
            email: limit(value("est_email"), 160),
            website: limit(value("est_website"), 240),
            instagram: limit(value("est_instagram"), 160),
            facebook: limit(value("est_facebook"), 160)
        };
        base.location = {
            address: limit(value("est_address"), 240),
            neighborhood: limit(value("est_neighborhood"), 120),
            city: limit(value("est_city") || "Sao Mateus do Sul", 120),
            state: limit(value("est_state") || "PR", 2),
            postalCode: limit(value("est_postalCode"), 20),
            coordinates: { lat: lat, lng: lng },
            mapsUrl: limit(value("est_mapsUrl"), 600),
            coordStatus: limit(value("est_coordStatus"), 80),
            coordNote: limit(value("est_coordNote"), 500)
        };
        base.media.mainImage = normalizeImage({
            url: limit(value("est_mainImageUrl"), 2048),
            path: base.media.mainImage.path,
            alt: limit(value("est_mainImageAlt"), 160),
            caption: limit(value("est_mainImageCaption"), 240),
            credit: limit(value("est_mainImageCredit"), 160),
            source: base.media.mainImage.source || (value("est_mainImageUrl") ? "external" : "")
        });
        base.media.gallery = manualGallery.map(function (img, index) {
            img.position = index + 1;
            return img;
        });
        base.media.videoUrl = limit(value("est_videoUrl"), 600);
        base.media.sourceCredits = limit(value("est_sourceCredits"), 1000);
        base.relationships = {
            routeIds: parseList(value("est_routeIds")).slice(0, 20),
            relatedPlaceIds: ensureArray(base.relationships.relatedPlaceIds),
            relatedEventIds: ensureArray(base.relationships.relatedEventIds),
            legacyRoute: limit(value("est_legacyRoute"), 120),
            legacyRouteName: limit(value("est_legacyRouteName"), 160)
        };
        base.display = {
            featured: checked("est_featured"),
            priority: Number.isFinite(priority) ? Math.max(0, Math.min(1000, Math.round(priority))) : 0,
            mapVisible: checked("est_mapVisible"),
            claimable: checked("est_claimable")
        };
        base.seo = {
            title: limit(value("est_seoTitle"), 160),
            description: limit(value("est_seoDescription"), 240),
            canonicalPath: limit(value("est_canonicalPath"), 240)
        };
        base.review.lastReviewNotes = limit(value("est_reviewNotes"), 2000);
        base.source = {
            origin: limit(value("est_sourceOrigin") || "admin", 60),
            sourceFile: limit(value("est_sourceFile"), 160),
            originalId: limit(value("est_originalId") || id, 160),
            originalCategory: limit(value("est_originalCategory"), 120),
            legacyIds: parseList(value("est_legacyIds")).slice(0, 20),
            seededAt: base.source.seededAt || null,
            sourceUpdatedAt: base.source.sourceUpdatedAt || null
        };
        base.updatedAt = serverTimestamp();
        base.updatedBy = uid;
        if (!existing) {
            base.createdAt = serverTimestamp();
            base.createdBy = uid;
        }
        return base;
    }

    function validateDocForSave(doc) {
        if (!doc.id || !doc.slug) return "Informe um ID/slug.";
        if (!doc.name) return "Informe o nome do empreendimento.";
        if (!doc.categoryId || !doc.categoryLabel) return "Informe a categoria.";
        if (!doc.content.summary) return "Informe o resumo.";
        if (doc.location.coordinates.lat == null && doc.location.coordinates.lng != null) return "Latitude e longitude devem ser preenchidas juntas.";
        if (doc.location.coordinates.lat != null && doc.location.coordinates.lng == null) return "Latitude e longitude devem ser preenchidas juntas.";
        if (doc.location.coordinates.lat != null && (doc.location.coordinates.lat < -90 || doc.location.coordinates.lat > 90)) return "Latitude invalida.";
        if (doc.location.coordinates.lng != null && (doc.location.coordinates.lng < -180 || doc.location.coordinates.lng > 180)) return "Longitude invalida.";
        return "";
    }

    function submitForm(event) {
        if (event && event.preventDefault) event.preventDefault();
        var db = getDb();
        var storage = getStorage();
        var uid = currentUid();
        if (!db || !storage || !uid) {
            toast("Firebase ou sessao admin indisponivel.", "error");
            return false;
        }
        var editingId = value("est_form_editingId");
        var existing = editingId ? findItem(editingId) : null;
        var payload = readForm(existing, uid);
        var validation = validateDocForSave(payload);
        if (validation) {
            toast(validation, "error");
            return false;
        }
        if (!editingId && findItem(payload.id)) {
            toast("Ja existe um empreendimento com este ID/slug. Abra o registro existente para editar.", "error");
            return false;
        }
        var mainInput = document.getElementById("est_mainImageFile");
        var galleryInput = document.getElementById("est_galleryFiles");
        var mainFile = mainInput && mainInput.files ? mainInput.files[0] : null;
        var galleryFiles = galleryInput && galleryInput.files ? Array.prototype.slice.call(galleryInput.files) : [];
        var uploaded = [];
        var button = document.getElementById("establishmentSaveBtn");
        if (button) {
            button.disabled = true;
            button.textContent = "Salvando...";
        }
        Promise.resolve()
            .then(function () {
                if (editingId) return null;
                return db.collection(COLLECTION).doc(payload.id).get().then(function (snap) {
                    if (snap.exists) {
                        var existsError = new Error("Ja existe um empreendimento com este ID/slug.");
                        existsError.code = "already-exists";
                        throw existsError;
                    }
                    return null;
                });
            })
            .then(function () {
                if (!mainFile) return null;
                return uploadImage(storage, mainFile, uid, payload.id, "main").then(function (image) {
                    uploaded.push(image);
                    payload.media.mainImage = Object.assign({}, payload.media.mainImage, image, {
                        alt: payload.media.mainImage.alt,
                        caption: payload.media.mainImage.caption,
                        credit: payload.media.mainImage.credit,
                        source: "cms-media"
                    });
                    return image;
                });
            })
            .then(function () {
                return Promise.all(galleryFiles.map(function (file) {
                    return uploadImage(storage, file, uid, payload.id, "gallery").then(function (image) {
                        uploaded.push(image);
                        image.position = payload.media.gallery.length + 1;
                        payload.media.gallery.push(image);
                        return image;
                    });
                }));
            })
            .then(function () {
                payload.media.gallery = payload.media.gallery.map(function (image, index) {
                    image.position = index + 1;
                    return image;
                });
                return db.collection(COLLECTION).doc(payload.id).set(payload);
            })
            .then(function () {
                toast("Empreendimento salvo como registro interno.", "success");
                cancelForm();
                return load();
            })
            .catch(function (error) {
                deleteUploadedFiles(uploaded);
                handleWriteError(error, "salvar empreendimento");
            })
            .then(function () {
                if (button) {
                    button.disabled = false;
                    button.textContent = "Salvar rascunho interno";
                }
            });
        return false;
    }

    function archive(id) {
        var item = findItem(id);
        if (!item) return;
        if (item.status === "archived") {
            toast("Este empreendimento ja esta arquivado.", "info");
            return;
        }
        var reason = window.prompt('Motivo do arquivamento de "' + (item.name || item.__id) + '"?', item.publishing.archiveReason || "");
        if (reason === null) return;
        var uid = currentUid();
        var db = getDb();
        if (!db || !uid) {
            toast("Firebase ou sessao admin indisponivel.", "error");
            return;
        }
        var payload = normalizeDoc(item, item.__id);
        payload.status = "archived";
        payload.publishing.archivedAt = serverTimestamp();
        payload.publishing.archivedBy = uid;
        payload.publishing.archiveReason = limit(reason, 500);
        payload.updatedAt = serverTimestamp();
        payload.updatedBy = uid;
        db.collection(COLLECTION).doc(item.__id).set(payload).then(function () {
            toast("Empreendimento arquivado.", "success");
            return load();
        }).catch(function (error) {
            handleWriteError(error, "arquivar empreendimento");
        });
    }

    function restore(id) {
        var item = findItem(id);
        if (!item) return;
        if (item.status !== "archived") {
            toast("Apenas registros arquivados podem ser restaurados.", "info");
            return;
        }
        if (!window.confirm('Restaurar "' + (item.name || item.__id) + '" como rascunho interno?')) return;
        var uid = currentUid();
        var db = getDb();
        if (!db || !uid) {
            toast("Firebase ou sessao admin indisponivel.", "error");
            return;
        }
        var payload = normalizeDoc(item, item.__id);
        payload.status = "draft";
        payload.publishing.archivedAt = null;
        payload.publishing.archivedBy = "";
        payload.publishing.archiveReason = "";
        payload.updatedAt = serverTimestamp();
        payload.updatedBy = uid;
        db.collection(COLLECTION).doc(item.__id).set(payload).then(function () {
            toast("Empreendimento restaurado como rascunho.", "success");
            return load();
        }).catch(function (error) {
            handleWriteError(error, "restaurar empreendimento");
        });
    }

    function viewDetails(id) {
        var item = findItem(id);
        var target = document.getElementById ? document.getElementById("establishments-admin-editor") : null;
        if (!item || !target) return;
        var mainImage = item.media && item.media.mainImage && item.media.mainImage.url
            ? '<img src="' + escapeAttr(item.media.mainImage.url) + '" alt="' + escapeAttr(item.media.mainImage.alt || item.name) + '" style="max-width:280px;max-height:180px;object-fit:contain;border:1px solid #ddd;border-radius:4px;">'
            : '<em>Sem imagem principal</em>';
        function row(label, value) {
            return '<tr><th style="text-align:left;white-space:nowrap;padding-right:1rem;">' + escapeHtml(label) + '</th><td>' + (value || "—") + '</td></tr>';
        }
        target.innerHTML = '<div class="card" id="establishmentDetailsCard">' +
            '<div class="card-header"><h2>Detalhes do empreendimento</h2>' + statusBadge(item.status) + '</div>' +
            '<div style="overflow-x:auto;"><table class="data-table"><tbody>' +
                row("ID", escapeHtml(item.__id)) +
                row("Nome", escapeHtml(item.name)) +
                row("Slug", escapeHtml(item.slug)) +
                row("Categoria", escapeHtml(item.categoryLabel)) +
                row("Resumo", escapeHtml(item.content.summary)) +
                row("Descricao", escapeHtml(item.content.description)) +
                row("Endereco", escapeHtml(item.location.address)) +
                row("Coordenadas", item.location.coordinates.lat != null && item.location.coordinates.lng != null ? escapeHtml(item.location.coordinates.lat + ", " + item.location.coordinates.lng) : "") +
                row("Contato", escapeHtml([item.contact.phone, item.contact.whatsapp, item.contact.website, item.contact.instagram].filter(Boolean).join(" | "))) +
                row("Rotas", escapeHtml(item.relationships.routeIds.join(", ") || item.relationships.legacyRouteName)) +
                row("Imagem", mainImage) +
                row("Galeria", escapeHtml(String(item.media.gallery.length) + " imagem(ns)")) +
                row("Criado", escapeHtml(formatDateTime(item.createdAt)) + (item.createdBy ? " por " + escapeHtml(item.createdBy) : "")) +
                row("Atualizado", escapeHtml(formatDateTime(item.updatedAt)) + (item.updatedBy ? " por " + escapeHtml(item.updatedBy) : "")) +
                row("Arquivamento", item.publishing.archivedAt ? escapeHtml(formatDateTime(item.publishing.archivedAt) + " - " + item.publishing.archiveReason) : "") +
                row("Origem", escapeHtml([item.source.origin, item.source.sourceFile, item.source.originalId].filter(Boolean).join(" | "))) +
            '</tbody></table></div>' +
            '<div class="admin-modal-footer" style="margin-top:1rem;">' +
                '<button class="btn-secondary" type="button" onclick="AdminEstablishmentsModule.cancelForm()">Fechar</button>' +
                '<button class="btn-primary" type="button" onclick="AdminEstablishmentsModule.openForm(\'' + escapeJs(item.__id) + '\')">Editar</button>' +
            '</div>' +
        '</div>';
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function cancelForm() {
        releasePreviewUrls();
        state.editingId = "";
        var target = document.getElementById ? document.getElementById("establishments-admin-editor") : null;
        if (target) target.innerHTML = "";
    }

    function onFilterChange() {
        var search = document.getElementById ? document.getElementById("establishmentSearch") : null;
        var status = document.getElementById ? document.getElementById("establishmentStatusFilter") : null;
        var category = document.getElementById ? document.getElementById("establishmentCategoryFilter") : null;
        state.query = search ? search.value : "";
        state.filterStatus = status ? status.value : "all";
        state.filterCategory = category ? category.value : "all";
        renderList();
    }

    function refresh() {
        return load();
    }

    function handleWriteError(error, action) {
        var code = error && error.code ? error.code : "";
        if (code === "permission-denied") {
            toast("Permissao negada ao " + action + ". Verifique as Firestore/Storage Rules do CMS-2B e sua permissao admin.", "error");
        } else if (code === "already-exists") {
            toast(error.message || "Ja existe um registro com este ID/slug.", "error");
        } else {
            toast("Erro ao " + action + ". Veja o console.", "error");
        }
        console.warn("[admin-establishments] Falha ao " + action + ".", error);
    }

    var AdminEstablishmentsModule = {
        id: SECTION_ID,
        label: "Empreendimentos",
        icon: "🏨",
        requiredRole: "admin",
        master: false,
        navGroup: "Conteudo",
        order: 41,
        render: render,
        load: load,
        dispose: releasePreviewUrls,
        activate: function (context) {
            render(getSection(), context || window.AdminContext || null);
            load(context || window.AdminContext || null);
        },
        openForm: openForm,
        submitForm: submitForm,
        cancelForm: cancelForm,
        archive: archive,
        restore: restore,
        viewDetails: viewDetails,
        refresh: refresh,
        onFilterChange: onFilterChange,
        onMainImageChange: onMainImageChange,
        onGalleryChange: onGalleryChange,
        _state: state,
        _normalizeDoc: normalizeDoc,
        _readForm: readForm,
        _validateDocForSave: validateDocForSave,
        _makeSlug: makeSlug,
        _MAX_IMAGE_BYTES: MAX_IMAGE_BYTES,
        _IMAGE_TYPE_REGEX: IMAGE_TYPE_REGEX
    };

    if (window.AdminRegistry && typeof window.AdminRegistry.register === "function") {
        window.AdminRegistry.register(AdminEstablishmentsModule);
    }

    window.AdminEstablishmentsModule = AdminEstablishmentsModule;
})();
