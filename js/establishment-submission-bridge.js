/**
 * Bridge pura entre uma submissao do Portal e o draft canonico do CMS V2.
 * Persistencia, timestamps e o contrato de grupos continuam sob autoridade do
 * AdminEstablishmentsModule.
 */
(function (root, factory) {
    "use strict";

    var api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) {
        Object.defineProperty(root, "EstablishmentSubmissionBridge", {
            value: api,
            writable: false,
            configurable: false,
            enumerable: false
        });
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    var CATEGORY_MAP = Object.freeze({
        hospedagem: Object.freeze({ id: "hospedagem", label: "Hospedagem" }),
        restaurante: Object.freeze({ id: "gastronomia", label: "Gastronomia" }),
        gastronomia: Object.freeze({ id: "gastronomia", label: "Gastronomia" }),
        atracao: Object.freeze({ id: "ponto_turistico", label: "Ponto turistico" }),
        ponto_turistico: Object.freeze({ id: "ponto_turistico", label: "Ponto turistico" }),
        comercio: Object.freeze({ id: "servico", label: "Servico" }),
        servico: Object.freeze({ id: "servico", label: "Servico" }),
        produtor: Object.freeze({ id: "turismo_rural", label: "Turismo rural" }),
        turismo_rural: Object.freeze({ id: "turismo_rural", label: "Turismo rural" })
    });

    function clean(value) {
        return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    }

    function fold(value) {
        return clean(value)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function normalizeName(value) {
        return fold(value)
            .replace(/&/g, " e ")
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizeAddress(value) {
        return fold(value)
            .replace(/\b(?:r|r\.|rua)\b/g, " rua ")
            .replace(/\b(?:av|av\.|avenida)\b/g, " avenida ")
            .replace(/\b(?:rod|rod\.|rodovia)\b/g, " rodovia ")
            .replace(/[^a-z0-9]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizePhone(value) {
        var digits = clean(value).replace(/\D+/g, "");
        if ((digits.length === 12 || digits.length === 13) && digits.indexOf("55") === 0) {
            digits = digits.slice(2);
        }
        return digits;
    }

    function normalizeWebsite(value) {
        var raw = clean(value);
        if (!raw) return "";
        try {
            var parsed = new URL(raw);
            if (parsed.protocol !== "https:" || !parsed.hostname) return "";
            return (parsed.hostname.replace(/^www\./i, "") + parsed.pathname.replace(/\/$/, "")).toLowerCase();
        } catch (_error) {
            return "";
        }
    }

    function makeCanonicalSlug(value) {
        return fold(value)
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 120) || "empreendimento";
    }

    function first(source, names) {
        for (var index = 0; index < names.length; index += 1) {
            var value = source && source[names[index]];
            if (value !== undefined && value !== null && clean(value)) return value;
        }
        return "";
    }

    function canonicalAddressNumber(value) {
        var matches = normalizeAddress(value).match(/\b\d+[a-z]?\b/g);
        return matches && matches.length ? matches[matches.length - 1] : "";
    }

    function semanticIdentity(source) {
        var raw = source || {};
        var name = first(raw, ["name", "nome"]);
        var address = first(raw.location || raw, ["address", "endereco"]);
        var website = first(raw.contact || raw, ["website", "site"]);
        var phone = first(raw.contact || raw, ["phone", "telefone", "whatsapp"]);
        var slug = first(raw, ["slug"]);
        return Object.freeze({
            normalizedName: normalizeName(name),
            normalizedAddress: normalizeAddress(address),
            addressNumber: canonicalAddressNumber(address),
            canonicalSlug: makeCanonicalSlug(slug || name),
            normalizedPhone: normalizePhone(phone),
            normalizedWebsite: normalizeWebsite(website)
        });
    }

    function approvalFingerprint(source) {
        var raw = source || {};
        var images = (Array.isArray(raw.images) ? raw.images : []).map(function (image) {
            var item = typeof image === "string" ? { url: image } : (image || {});
            return {
                path: clean(item.path),
                url: clean(item.url),
                name: clean(item.name || item.fileName),
                contentType: clean(item.contentType),
                size: Number.isFinite(Number(item.size)) ? Number(item.size) : 0,
                alt: clean(item.alt),
                caption: clean(item.caption),
                credit: clean(item.credit)
            };
        });
        return JSON.stringify({
            id: clean(raw.id || raw.__id),
            name: clean(first(raw, ["name", "nome"])),
            category: clean(first(raw, ["category", "categoria"])),
            address: clean(first(raw, ["address", "endereco"])),
            description: clean(first(raw, ["description", "descricao"])),
            phone: clean(first(raw, ["phone", "telefone"])),
            whatsapp: clean(raw.whatsapp),
            instagram: clean(raw.instagram),
            website: clean(first(raw, ["website", "site"])),
            openingHours: clean(first(raw, ["openingHours", "horario"])),
            mainImage: clean(raw.mainImage),
            image: clean(raw.image),
            mainImageContentType: clean(raw.mainImageContentType),
            images: images
        });
    }

    function semanticIdentityLockId(source) {
        var identity = semanticIdentity(source);
        var material = identity.normalizedName + "|" + identity.normalizedAddress + "|" + identity.addressNumber;
        var hash = 2166136261;
        for (var index = 0; index < material.length; index += 1) {
            hash ^= material.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return "identity-" + makeCanonicalSlug(identity.normalizedName).slice(0, 60) + "-" + (hash >>> 0).toString(16).padStart(8, "0");
    }

    function candidateSourceId(candidate) {
        return clean(candidate && candidate.source && candidate.source.originalId);
    }

    function candidateData(candidate) {
        var raw = candidate && candidate.data ? candidate.data : (candidate || {});
        return Object.assign({}, raw, {
            id: clean(raw.id || candidate && candidate.id),
            name: first(raw, ["name", "nome"]),
            address: first(raw.location || raw, ["address", "endereco"]),
            phone: first(raw.contact || raw, ["phone", "telefone", "whatsapp"]),
            website: first(raw.contact || raw, ["website", "site"])
        });
    }

    function relationToCandidate(submission, candidate) {
        var sourceIdentity = semanticIdentity(submission);
        var targetData = candidateData(candidate);
        var targetIdentity = semanticIdentity(targetData);
        var sameSubmission = clean(submission && (submission.id || submission.__id)) &&
            clean(submission && (submission.id || submission.__id)) === candidateSourceId(candidate && candidate.data || candidate);
        var sameName = !!sourceIdentity.normalizedName &&
            sourceIdentity.normalizedName === targetIdentity.normalizedName;
        var sameAddress = !!sourceIdentity.normalizedAddress &&
            sourceIdentity.normalizedAddress === targetIdentity.normalizedAddress;
        var sameNumber = !sourceIdentity.addressNumber || !targetIdentity.addressNumber ||
            sourceIdentity.addressNumber === targetIdentity.addressNumber;
        var sameSlug = !!sourceIdentity.canonicalSlug &&
            sourceIdentity.canonicalSlug === targetIdentity.canonicalSlug;
        var samePhone = !!sourceIdentity.normalizedPhone &&
            sourceIdentity.normalizedPhone === targetIdentity.normalizedPhone;
        var sameWebsite = !!sourceIdentity.normalizedWebsite &&
            sourceIdentity.normalizedWebsite === targetIdentity.normalizedWebsite;

        if (sameSubmission) return "exact";
        if (sameName && sameAddress && sameNumber) return sameSlug ? "exact" : "semantic";
        if (sameName && (sameSlug || samePhone || sameWebsite || (!!sourceIdentity.normalizedAddress && !!targetIdentity.normalizedAddress))) {
            return "ambiguous";
        }
        if (sameAddress && sameNumber && (samePhone || sameWebsite || (!!sourceIdentity.normalizedName && !!targetIdentity.normalizedName))) {
            return "ambiguous";
        }
        if (sameSlug) return "ambiguous";
        return "none";
    }

    function normalizedCandidates(items, scope) {
        return (Array.isArray(items) ? items : []).map(function (item) {
            var raw = item && item.data ? item.data : item || {};
            return {
                id: clean(item && item.id || raw.id),
                status: clean(raw.status),
                scope: scope,
                data: raw
            };
        });
    }

    function classifyDuplicate(submission, collections) {
        var options = collections || {};
        var currentId = clean(options.excludeSubmissionId || submission && (submission.id || submission.__id));
        var cms = normalizedCandidates(options.cms, "cms");
        var pending = normalizedCandidates(options.pending, "pending").filter(function (candidate) {
            return candidate.id !== currentId;
        });
        var legacy = normalizedCandidates(options.legacyApproved, "legacy-approved").filter(function (candidate) {
            return candidate.id !== currentId;
        });
        var all = cms.concat(pending, legacy);
        var matches = all.map(function (candidate) {
            return Object.assign({}, candidate, { relation: relationToCandidate(submission, candidate) });
        }).filter(function (candidate) { return candidate.relation !== "none"; });
        var exactCms = matches.filter(function (candidate) { return candidate.scope === "cms" && candidate.relation === "exact"; });
        var semanticCms = matches.filter(function (candidate) { return candidate.scope === "cms" && candidate.relation === "semantic"; });
        var ambiguous = matches.filter(function (candidate) { return candidate.relation === "ambiguous"; });
        var pendingMatch = matches.filter(function (candidate) { return candidate.scope === "pending"; });
        var legacyMatch = matches.filter(function (candidate) { return candidate.scope === "legacy-approved"; });

        if (exactCms.length === 1 && matches.length === 1) return { kind: "EXACT_CMS_MATCH", candidates: exactCms };
        if (semanticCms.length === 1 && matches.length === 1) return { kind: "SEMANTIC_CMS_MATCH", candidates: semanticCms };
        if (exactCms.length || semanticCms.length || ambiguous.length || (pendingMatch.length && legacyMatch.length)) {
            return { kind: "AMBIGUOUS_MATCH", candidates: matches };
        }
        if (pendingMatch.length) return { kind: "PENDING_DUPLICATE", candidates: pendingMatch };
        if (legacyMatch.length) return { kind: "LEGACY_APPROVED_DUPLICATE", candidates: legacyMatch };
        return { kind: "NO_MATCH", candidates: [] };
    }

    function timestampMillis(value) {
        if (!value) return Number.MAX_SAFE_INTEGER;
        if (typeof value.toMillis === "function") return value.toMillis();
        if (typeof value.seconds === "number") return value.seconds * 1000;
        var parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
    }

    function isPreferredPendingSubmission(submission, candidates) {
        var current = { id: clean(submission && (submission.id || submission.__id)), data: submission || {} };
        var ordered = [current].concat(Array.isArray(candidates) ? candidates : []).sort(function (left, right) {
            var timeDiff = timestampMillis(left.data && (left.data.submittedAt || left.data.createdAt)) -
                timestampMillis(right.data && (right.data.submittedAt || right.data.createdAt));
            return timeDiff || clean(left.id).localeCompare(clean(right.id));
        });
        return ordered.length > 0 && ordered[0].id === current.id;
    }

    function categoryFor(value) {
        var key = makeCanonicalSlug(value).replace(/-/g, "_");
        return CATEGORY_MAP[key] || null;
    }

    function validateSubmissionForImport(submission, options) {
        var raw = submission || {};
        var config = options || {};
        if (typeof config.safeExternalUrl !== "function") throw new TypeError("safeExternalUrl é obrigatório.");
        var name = clean(first(raw, ["name", "nome"]));
        var description = clean(first(raw, ["description", "descricao"]));
        var category = categoryFor(first(raw, ["category", "categoria"]));
        var websiteRaw = clean(first(raw, ["website", "site"]));
        if (!name) {
            var nameError = new Error("A submissão não possui nome editorial válido.");
            nameError.code = "establishment-bridge/invalid-content";
            throw nameError;
        }
        if (!description) {
            var descriptionError = new Error("A submissão não possui resumo editorial válido.");
            descriptionError.code = "establishment-bridge/invalid-content";
            throw descriptionError;
        }
        if (!category) {
            var categoryError = new Error("A categoria da submissão não possui mapeamento editorial seguro.");
            categoryError.code = "establishment-bridge/unknown-category";
            throw categoryError;
        }
        var website = config.safeExternalUrl(websiteRaw, "");
        if (websiteRaw && !website) {
            var websiteError = new Error("O site informado na submissão não é uma URL HTTPS válida.");
            websiteError.code = "publication/invalid-field";
            websiteError.field = "website";
            throw websiteError;
        }
        return { name: name, description: description, category: category, website: website };
    }

    function approvedMediaItem(image, index, safeAsset, cmsId) {
        var raw = typeof image === "string" ? { url: image } : (image || {});
        var path = clean(raw.path);
        var url = safeAsset(clean(raw.url), "");
        var expectedPrefix = "approved-media/cms-establishments/" + clean(cmsId) + "/";
        if (!path || !clean(cmsId) || path.indexOf(expectedPrefix) !== 0 || !url) {
            var error = new Error("A mídia do draft deve usar somente approved-media/cms-establishments.");
            error.code = "establishment-bridge/private-media";
            throw error;
        }
        return {
            url: url,
            path: path,
            alt: clean(raw.alt),
            caption: clean(raw.caption),
            credit: clean(raw.credit),
            source: "portal_request",
            status: "active",
            position: index + 1
        };
    }

    function mapSubmissionToCmsDraft(submission, options) {
        var raw = submission || {};
        var config = options || {};
        if (typeof config.createBase !== "function") throw new TypeError("createBase é obrigatório.");
        if (typeof config.safeAsset !== "function") throw new TypeError("safeAsset é obrigatório.");
        if (typeof config.safeExternalUrl !== "function") throw new TypeError("safeExternalUrl é obrigatório.");
        var id = clean(config.id || makeCanonicalSlug(first(raw, ["name", "nome"])));
        var provenanceId = clean(config.provenanceId);
        if (!/^submission-sha256-[a-f0-9]{64}$/.test(provenanceId)) {
            var provenanceError = new Error("A proveniência pública da submissão deve usar token SHA-256 opaco.");
            provenanceError.code = "establishment-bridge/unsafe-provenance";
            throw provenanceError;
        }
        var uid = clean(config.uid);
        var desired = config.createBase(id, uid);
        var validated = validateSubmissionForImport(raw, { safeExternalUrl: config.safeExternalUrl });
        var images = [];
        var seenMedia = Object.create(null);

        (Array.isArray(raw.images) ? raw.images : []).forEach(function (image) {
            var normalized = approvedMediaItem(image, images.length, config.safeAsset, id);
            var identity = normalized.path || normalized.url;
            if (seenMedia[identity]) return;
            seenMedia[identity] = true;
            normalized.position = images.length + 1;
            images.push(normalized);
        });

        desired.id = id;
        desired.slug = id;
        desired.name = validated.name;
        desired.categoryId = validated.category.id;
        desired.categoryLabel = validated.category.label;
        desired.status = "draft";
        desired.content.summary = validated.description;
        desired.content.description = validated.description;
        desired.content.openingHours = clean(first(raw, ["openingHours", "horario"]));
        desired.contact.phone = clean(first(raw, ["phone", "telefone"]));
        desired.contact.whatsapp = clean(raw.whatsapp);
        desired.contact.website = validated.website;
        desired.contact.instagram = clean(raw.instagram);
        desired.location.address = clean(first(raw, ["address", "endereco"]));
        desired.media.gallery = images;
        desired.media.mainImage = images.length ? Object.assign({}, images[0]) : desired.media.mainImage;
        desired.media.publicPaths = images.map(function (image) { return image.path; });
        desired.seo.canonicalPath = "/local?id=" + encodeURIComponent(id);
        desired.source.origin = "portal_usuario";
        desired.source.sourceFile = "";
        desired.source.originalId = provenanceId;
        desired.source.originalCategory = clean(first(raw, ["category", "categoria"]));
        desired.source.legacyIds = Array.isArray(config.legacyIds) ? config.legacyIds.map(clean).filter(Boolean) : [];
        desired.source.seededAt = null;
        desired.source.sourceUpdatedAt = null;
        desired.publishing.publishedAt = null;
        desired.publishing.publishedBy = "";
        desired.publishing.archivedAt = null;
        desired.publishing.archivedBy = "";
        desired.publishing.archiveReason = "";
        return desired;
    }

    return Object.freeze({
        normalizeName: normalizeName,
        normalizeAddress: normalizeAddress,
        normalizePhone: normalizePhone,
        makeCanonicalSlug: makeCanonicalSlug,
        semanticIdentity: semanticIdentity,
        approvalFingerprint: approvalFingerprint,
        semanticIdentityLockId: semanticIdentityLockId,
        validateSubmissionForImport: validateSubmissionForImport,
        classifyDuplicate: classifyDuplicate,
        isPreferredPendingSubmission: isPreferredPendingSubmission,
        mapSubmissionToCmsDraft: mapSubmissionToCmsDraft,
        CATEGORY_MAP: CATEGORY_MAP
    });
});
