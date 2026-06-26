/**
 * modules/placeholder.js — Admin CMS (Bloco 1 / Etapa 3A)
 * -------------------------------------------------------
 * Módulo GENÉRICO de placeholder para os próximos módulos do Admin CMS.
 *
 * Objetivo desta etapa (3A):
 *  - Preparar placeholders VISÍVEIS e estruturais (sem CRUD real) para os
 *    módulos futuros: Banners/Pop-ups, Empreendimentos, Rotas, Galeria,
 *    Configurações, Sazonal/Clima, Mascote e Logs/Auditoria.
 *  - Cada placeholder indica "em preparação", "sem persistência ainda" e,
 *    quando aplicável, que o CRUD real depende de etapa de rules.
 *
 * Restrições (mantidas à risca):
 *  - NÃO usa Firestore. NÃO usa Storage. NÃO cria forms funcionais.
 *  - NÃO cria collection nova. NÃO grava nada. NÃO altera auth/roles/claims.
 *  - O "master-only" aqui é COSMÉTICO (client-side). Esconder/avisar no
 *    client NÃO é segurança real — a separação só passa a valer quando as
 *    Firestore Rules a exigirem, em rodada futura.
 *
 * Integração:
 *  - Uma factory cria definições de módulo compatíveis com o contrato do
 *    AdminRegistry (render/load/dispose). `register()` cria + registra.
 *  - `renderAll()` injeta o conteúdo estático nos containers `#section-<id>`
 *    (idempotente) — assim tanto o `showSection` legado (clique na sidebar)
 *    quanto o `AdminRouter.navigate(id)` exibem o placeholder.
 *
 * IIFE, sem build step, sem import/export.
 */
(function () {
    "use strict";

    if (window.AdminPlaceholderModule) return;

    // Aviso padrão exibido em todos os placeholders.
    var DEFAULT_NOTICE =
        "Este módulo ainda não grava dados. A implementação real depende de " +
        "etapa futura e, em alguns casos, atualização de Firestore Rules/Storage Rules.";

    // Ids dos placeholders criados nesta etapa (para introspecção/teste).
    var placeholderIds = [];

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

    function isElement(node) {
        return !!(node && node.nodeType === 1);
    }

    function asArray(value) {
        return Object.prototype.toString.call(value) === "[object Array]" ? value : [];
    }

    // Verificação COSMÉTICA de master (não é segurança). Mantém compatível
    // com AdminContext.isMaster() quando existir.
    function isMasterCosmetic() {
        try {
            if (window.AdminContext && typeof window.AdminContext.isMaster === "function") {
                return !!window.AdminContext.isMaster();
            }
        } catch (error) {}
        return !!(window.currentUser && window.currentUser.master === true);
    }

    /**
     * normalizeConfig(config)
     * Aplica defaults seguros para todos os campos do placeholder.
     */
    function normalizeConfig(config) {
        var cfg = config && typeof config === "object" ? config : {};
        return {
            id: cfg.id,
            label: cfg.label || cfg.id || "Módulo",
            icon: cfg.icon || "🧩",
            description: cfg.description || "Módulo em preparação.",
            requiredRole: cfg.requiredRole || "admin",
            master: cfg.master === true,
            navGroup: cfg.navGroup || "Em preparação",
            order: typeof cfg.order === "number" ? cfg.order : 100,
            statusLabel: cfg.statusLabel || "Em preparação",
            requiredNextStep: cfg.requiredNextStep || "",
            plannedFeatures: asArray(cfg.plannedFeatures),
            warnings: asArray(cfg.warnings),
            docHref: typeof cfg.docHref === "string" ? cfg.docHref : ""
        };
    }

    /**
     * buildHtml(cfg)
     * Monta o HTML estático do placeholder (sem nenhuma ação de CRUD).
     */
    function buildHtml(cfg) {
        var masterBadge = cfg.master
            ? '<span class="badge badge-info admin-placeholder-master" title="Visível apenas como aviso — controle master será aplicado por rules em etapa futura">🔒 Master</span>'
            : "";

        var features = "";
        if (cfg.plannedFeatures.length) {
            var items = cfg.plannedFeatures.map(function (feat) {
                return "<li>" + escapeHtml(feat) + "</li>";
            }).join("");
            features =
                '<div class="card">' +
                '<div class="card-header"><h2>🛠️ Recursos planejados</h2></div>' +
                '<ul class="admin-placeholder-list">' + items + "</ul>" +
                "</div>";
        }

        var extraWarnings = "";
        if (cfg.warnings.length) {
            var warns = cfg.warnings.map(function (w) {
                return "<li>" + escapeHtml(w) + "</li>";
            }).join("");
            extraWarnings = '<ul class="admin-placeholder-list">' + warns + "</ul>";
        }

        var nextStep = cfg.requiredNextStep
            ? '<p class="admin-placeholder-next"><strong>Pré-requisito da próxima etapa:</strong> ' +
              escapeHtml(cfg.requiredNextStep) + "</p>"
            : "";

        var masterNote = cfg.master
            ? '<p class="admin-placeholder-next"><strong>Master-only (cosmético):</strong> ' +
              "este item aparece com selo Master apenas como aviso visual. A proteção real " +
              "de admin master dependerá das Firestore Rules em rodada futura — esconder no " +
              "client não é segurança.</p>"
            : "";

        var docAction = cfg.docHref
            ? '<a class="btn-primary" href="' + escapeHtml(cfg.docHref) +
              '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">📄 Ver documentação</a>'
            : '<button class="btn-primary" type="button" disabled title="Sem ação nesta etapa">Sem ações disponíveis ainda</button>';

        return (
            '<div class="page-header">' +
            "<h1>" + escapeHtml(cfg.icon) + " " + escapeHtml(cfg.label) + "</h1>" +
            '<span class="badge badge-warning">Em preparação</span>' +
            "</div>" +

            '<div class="card">' +
            '<div class="card-header">' +
            "<h2>Sobre este módulo</h2>" +
            '<span class="badge badge-info">' + escapeHtml(cfg.statusLabel) + "</span>" +
            "</div>" +
            '<p class="admin-helper-text">' + escapeHtml(cfg.description) + "</p>" +
            (masterBadge ? '<p style="margin-bottom:0.5rem;">' + masterBadge + "</p>" : "") +
            extraWarnings +
            "</div>" +

            features +

            '<div class="card admin-placeholder-notice">' +
            '<div class="card-header"><h2>⚠️ Status de implementação</h2></div>' +
            "<p>" + escapeHtml(DEFAULT_NOTICE) + "</p>" +
            nextStep +
            masterNote +
            '<div style="margin-top:1rem;">' + docAction + "</div>" +
            "</div>"
        );
    }

    /**
     * create(config) → definição de módulo (contrato AdminRegistry).
     * NÃO registra; apenas constrói a definição.
     */
    function create(config) {
        var cfg = normalizeConfig(config);

        return {
            id: cfg.id,
            label: cfg.label,
            icon: cfg.icon,
            requiredRole: cfg.requiredRole,
            master: cfg.master,
            navGroup: cfg.navGroup,
            order: cfg.order,
            // Metadados úteis para introspecção/teste (não usados pelo registry).
            isPlaceholder: true,
            statusLabel: cfg.statusLabel,
            requiredNextStep: cfg.requiredNextStep,
            plannedFeatures: cfg.plannedFeatures.slice(),
            warnings: cfg.warnings.slice(),

            render: function (container) {
                var target = isElement(container)
                    ? container
                    : (document.getElementById ? document.getElementById("section-" + cfg.id) : null);
                if (!isElement(target)) return null;
                // Idempotente: regrava o mesmo HTML estático.
                target.innerHTML = buildHtml(cfg);
                return target;
            },

            // Sem dados para buscar — placeholder não toca Firebase.
            load: function () {
                return false;
            },

            dispose: function () {
                // Sem listeners/timers próprios: nada a limpar.
            }
        };
    }

    /**
     * register(config) → cria e registra no AdminRegistry.
     * Retorna a definição criada (ou null se o registry recusar).
     */
    function register(config) {
        var def = create(config);
        if (!def.id) {
            console.warn("[admin-placeholder] Placeholder sem id ignorado.");
            return null;
        }
        // Cede a um módulo REAL já registrado com o mesmo id (ex.: Banners no
        // Bloco 4C). O placeholder não entra em `placeholderIds`, então o
        // `renderAll()` não sobrescreve a seção do módulo real.
        if (window.AdminRegistry && typeof window.AdminRegistry.has === "function" &&
            window.AdminRegistry.has(def.id)) {
            return null;
        }
        if (window.AdminRegistry && typeof window.AdminRegistry.register === "function") {
            var ok = window.AdminRegistry.register(def);
            if (ok && placeholderIds.indexOf(def.id) === -1) {
                placeholderIds.push(def.id);
            }
        } else {
            console.warn("[admin-placeholder] AdminRegistry indisponível para '" + def.id + "'.");
        }
        return def;
    }

    /**
     * renderAll()
     * Renderiza o conteúdo estático de cada placeholder no seu container
     * `#section-<id>`, se existir. Idempotente e seguro.
     */
    function renderAll() {
        if (!document.getElementById) return;
        placeholderIds.forEach(function (id) {
            var mod = window.AdminRegistry && window.AdminRegistry.get ? window.AdminRegistry.get(id) : null;
            if (mod && typeof mod.render === "function") {
                try {
                    mod.render(document.getElementById("section-" + id));
                } catch (error) {
                    console.warn("[admin-placeholder] Falha ao renderizar '" + id + "'.", error);
                }
            }
        });
    }

    var AdminPlaceholderModule = {
        DEFAULT_NOTICE: DEFAULT_NOTICE,
        create: create,
        register: register,
        renderAll: renderAll,
        list: function () {
            return placeholderIds.slice();
        },
        isMasterCosmetic: isMasterCosmetic
    };

    // ---- Registro dos placeholders desta etapa (Etapa 3A) ----
    // master-only (cosmético): configuracoes, sazonal, mascote, audit-logs.
    var PLACEHOLDERS = [
        {
            id: "banners",
            label: "Banners / Pop-ups",
            icon: "📢",
            navGroup: "Conteúdo",
            order: 40,
            master: false,
            description: "Campanhas e pop-ups exibidos no site. Aqui será possível configurar imagem, texto, CTA, período de exibição e em quais páginas aparecem.",
            statusLabel: "Sem persistência ainda",
            requiredNextStep: "Definir/permitir a collection de campanhas em Firestore Rules antes do CRUD real.",
            plannedFeatures: [
                "Cadastrar campanhas e pop-ups",
                "Configurar imagem, texto e CTA",
                "Definir data de início e fim",
                "Escolher páginas onde o banner aparece"
            ]
        },
        {
            id: "empreendimentos",
            label: "Empreendimentos",
            icon: "🏨",
            navGroup: "Conteúdo",
            order: 41,
            master: false,
            description: "Edição dos dados de empreendimentos turísticos: imagem principal, galeria, contato, coordenadas e rotas relacionadas.",
            statusLabel: "Sem persistência ainda",
            requiredNextStep: "Definir/permitir a collection de empreendimentos em Firestore Rules (e paths de Storage da galeria) antes do CRUD real.",
            plannedFeatures: [
                "Editar dados de empreendimentos",
                "Imagem principal e galeria",
                "Contato e coordenadas",
                "Rotas relacionadas"
            ]
        },
        {
            id: "rotas",
            label: "Rotas",
            icon: "🗺️",
            navGroup: "Conteúdo",
            order: 42,
            master: false,
            description: "Gestão de rotas turísticas, organizando empreendimentos por roteiro e controlando status publicado/rascunho.",
            statusLabel: "Sem persistência ainda",
            requiredNextStep: "Definir/permitir a collection de rotas em Firestore Rules antes do CRUD real.",
            plannedFeatures: [
                "Gerenciar rotas turísticas",
                "Organizar empreendimentos por roteiro",
                "Status publicado / rascunho"
            ]
        },
        {
            id: "galeria",
            label: "Galeria",
            icon: "🖼️",
            navGroup: "Conteúdo",
            order: 43,
            master: false,
            description: "Galeria de imagens e vídeos do site, reutilizando mídia da biblioteca existente, com publicar/ocultar.",
            statusLabel: "Sem persistência ainda",
            requiredNextStep: "Definir/permitir a collection da galeria em Firestore Rules (e novos contentType/paths de vídeo no Storage) antes do CRUD real.",
            plannedFeatures: [
                "Gerenciar galeria de imagens e vídeos",
                "Selecionar mídia da biblioteca",
                "Publicar / ocultar itens"
            ]
        },
        {
            id: "configuracoes",
            label: "Configurações",
            icon: "⚙️",
            navGroup: "Sistema",
            order: 60,
            master: true,
            description: "Textos globais, links principais, preferências do site e configurações públicas.",
            statusLabel: "Master-only · sem persistência ainda",
            requiredNextStep: "Definir/permitir a collection de configurações e o enforcement de admin master em Firestore Rules antes do CRUD real.",
            plannedFeatures: [
                "Textos globais do site",
                "Links principais",
                "Preferências do site",
                "Configurações públicas"
            ]
        },
        {
            id: "sazonal",
            label: "Sazonal / Clima",
            icon: "🌦️",
            navGroup: "Sistema",
            order: 61,
            master: true,
            description: "Controle dos efeitos sazonais e do clima visual: intensidade, estação automática/manual e assets por estação.",
            statusLabel: "Master-only · sem persistência ainda",
            requiredNextStep: "Definir/permitir a collection sazonal e o enforcement de admin master em Firestore Rules antes do CRUD real.",
            plannedFeatures: [
                "Controlar intensidade dos efeitos",
                "Estação automática ou manual",
                "Assets por estação",
                "Clima visual"
            ]
        },
        {
            id: "mascote",
            label: "Mascote",
            icon: "🐾",
            navGroup: "Sistema",
            order: 62,
            master: true,
            description: "Ativar/desativar o mascote, definir mensagens por página, intensidade e comportamento.",
            statusLabel: "Master-only · sem persistência ainda",
            requiredNextStep: "Definir/permitir a collection do mascote e o enforcement de admin master em Firestore Rules antes do CRUD real.",
            plannedFeatures: [
                "Ativar / desativar mascote",
                "Mensagens por página",
                "Intensidade",
                "Comportamento"
            ]
        },
        {
            id: "audit-logs",
            label: "Logs / Auditoria",
            icon: "📜",
            navGroup: "Sistema",
            order: 63,
            master: true,
            description: "Registro das ações administrativas — usuário, data e tipo de alteração.",
            statusLabel: "Master-only · sem persistência ainda",
            requiredNextStep: "Definir/permitir a collection de auditoria (gravação no ato da ação) e o enforcement de admin master em Firestore Rules antes do CRUD real.",
            plannedFeatures: [
                "Exibir ações administrativas",
                "Usuário responsável",
                "Data da ação",
                "Tipo de alteração"
            ]
        }
    ];

    function registerAll() {
        PLACEHOLDERS.forEach(function (cfg) {
            register(cfg);
        });
    }

    // Registro imediato (AdminRegistry já carregou antes deste script).
    registerAll();

    // Render tardio do conteúdo estático nos containers de seção.
    function activate() {
        renderAll();
    }

    window.AdminPlaceholderModule = AdminPlaceholderModule;

    window.addEventListener("firebaseReady", activate);
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", activate, { once: true });
    } else {
        window.setTimeout(activate, 0);
    }
})();
