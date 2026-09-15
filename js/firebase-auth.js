/**
 * firebase-auth.js — Turismo São Mateus do Sul
 * v3 — Firebase Compat SDK, inicialização síncrona, sem eventos customizados
 * REQUER: firebase-app-compat.js + firebase-auth-compat.js + firebase-firestore-compat.js + firebase-app-check-compat.js
 *         carregados ANTES deste script via <script> no HTML
 */

// Configuração do Firebase — DEVE vir de config.js (CONFIG.firebase)
// Nunca hardcode credenciais aqui; garanta que config.js carregue antes deste script
const firebaseConfig = (typeof CONFIG !== 'undefined' && CONFIG.firebase) ? CONFIG.firebase : null;

if (!firebaseConfig) {
    console.error('[firebase-auth] CONFIG.firebase não encontrado. Verifique se config.js foi carregado antes deste script.');
}

let currentUser = null;
const SDK_LOAD_TIMEOUT_MS = 15000;
const AUTH_OPERATION_TIMEOUT_MS = 20000;
const PROFILE_LOAD_TIMEOUT_MS = 8000;

function withTimeout(promise, timeoutMs, code) {
    return new Promise(function(resolve, reject) {
        var timer = setTimeout(function() {
            var error = new Error('Operação excedeu o tempo limite.');
            error.code = code || 'operation/timeout';
            reject(error);
        }, timeoutMs);

        promise.then(function(value) {
            clearTimeout(timer);
            resolve(value);
        }).catch(function(error) {
            clearTimeout(timer);
            reject(error);
        });
    });
}

function getFirebaseAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        var error = new Error('Firebase Auth indisponível.');
        error.code = 'auth/sdk-not-ready';
        throw error;
    }
    return firebase.auth();
}

function getFirebaseDB() {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        var error = new Error('Firebase Firestore indisponível.');
        error.code = 'firestore/sdk-not-ready';
        throw error;
    }
    return firebase.firestore();
}

function basicUserFromAuth(user) {
    return {
        uid: user.uid,
        email: user.email,
        nome: user.displayName || user.email || 'Usuário',
        _profilePending: true,
        _profileError: false
    };
}

function persistUserSession(user) {
    try {
        localStorage.setItem('smsUserSession', JSON.stringify({
            nome: user.nome || '',
            email: user.email || ''
        }));
    } catch(ex) {}
}

function authErrorMessage(error, fallback) {
    var message = fallback || 'Não foi possível concluir a autenticação.';
    if (error.code === 'auth/user-not-found') message = 'Usuário não encontrado.';
    else if (error.code === 'auth/wrong-password') message = 'Senha incorreta.';
    else if (error.code === 'auth/invalid-credential') message = 'E-mail ou senha incorretos.';
    else if (error.code === 'auth/invalid-email') message = 'E-mail inválido.';
    else if (error.code === 'auth/too-many-requests') message = 'Muitas tentativas. Tente novamente mais tarde.';
    else if (error.code === 'auth/network-request-failed') message = 'Falha de conexão com o serviço de login. Tente novamente.';
    else if (error.code === 'auth/login-timeout') message = 'O serviço de login demorou para responder. Tente novamente em alguns instantes.';
    else if (error.code === 'auth/sdk-not-ready') message = 'O serviço de login ainda não carregou. Recarregue a página e tente novamente.';
    return message;
}

function establishmentClaimErrorMessage(error) {
    if (!error) return 'Erro ao enviar solicitação de vínculo.';

    if (error.code === 'auth/session-not-ready') {
        return 'Sua sessão expirou ou ainda não foi carregada. Entre novamente para continuar.';
    }
    if (error.code === 'firestore/sdk-not-ready') {
        return 'O serviço de dados ainda não carregou. Recarregue a página e tente novamente.';
    }
    if (error.code === 'permission-denied') {
        return 'Sua sessão não tem permissão para concluir a solicitação. Saia e entre novamente.';
    }
    if (error.code === 'unauthenticated') {
        return 'Sua sessão expirou. Faça login novamente.';
    }
    if (error.code === 'failed-precondition') {
        return 'Não foi possível validar a solicitação agora. Tente novamente em instantes.';
    }
    if (error.code === 'deadline-exceeded' || error.code === 'unavailable') {
        return 'O serviço está temporariamente indisponível. Tente novamente em instantes.';
    }
    return 'Erro ao enviar solicitação de vínculo.';
}

function normalizeComparableId(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function requirePublicationContracts() {
    if (
        typeof SMSPublicationContracts === 'undefined' ||
        typeof SMSPublicationContracts.projectPublicEvent !== 'function' ||
        typeof SMSPublicationContracts.projectPublicEstablishment !== 'function' ||
        typeof SMSPublicationContracts.publicDocumentId !== 'function'
    ) {
        throw new Error('[firebase-auth] Contrato canônico de publicação indisponível.');
    }
    return SMSPublicationContracts;
}

function requireEstablishmentSubmissionBridge() {
    var bridge = window.EstablishmentSubmissionBridge;
    if (!bridge || typeof bridge.makeCanonicalSlug !== 'function' ||
        typeof bridge.classifyDuplicate !== 'function' ||
        typeof bridge.approvalFingerprint !== 'function' ||
        typeof bridge.semanticIdentityLockId !== 'function' ||
        typeof bridge.isPreferredPendingSubmission !== 'function') {
        throw new Error('[firebase-auth] Bridge canônica de submissões indisponível.');
    }
    return bridge;
}

function snapshotItems(snapshot) {
    return snapshot && snapshot.docs ? snapshot.docs.map(function(doc) {
        return { id: doc.id, data: doc.data() || {} };
    }) : [];
}

function existingCmsApprovalResult(candidate) {
    var status = String(candidate && candidate.status || candidate && candidate.data && candidate.data.status || '').trim();
    var id = String(candidate && candidate.id || '').trim();
    if (status === 'published') {
        return {
            success: false,
            code: 'EXISTING_PUBLISHED_ESTABLISHMENT',
            existingCmsId: id,
            existingStatus: status,
            message: 'Este empreendimento já está publicado no catálogo editorial. Use o fluxo de vínculo ou solicitação de atualização; nenhum rascunho foi criado.'
        };
    }
    if (status === 'archived') {
        return {
            success: false,
            code: 'EXISTING_ARCHIVED_ESTABLISHMENT',
            existingCmsId: id,
            existingStatus: status,
            message: 'Este empreendimento já existe arquivado no catálogo editorial. Uma decisão administrativa é necessária antes de restaurá-lo; nenhum rascunho foi criado.'
        };
    }
    return {
        success: false,
        code: 'ALREADY_IN_CMS',
        existingCmsId: id,
        existingStatus: status || 'draft',
        message: 'Este empreendimento já existe no catálogo editorial como rascunho. Abra o registro existente em Empreendimentos.'
    };
}

function getComparableTimestamp(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (value instanceof Date) return value.getTime();
    var parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

function sortByTimestampDesc(items, fieldName) {
    return (items || []).slice().sort(function(a, b) {
        return getComparableTimestamp(b && b[fieldName]) - getComparableTimestamp(a && a[fieldName]);
    });
}

function buildEstablishmentManagerDocId(userId, establishmentId) {
    return 'mgr_' + String(userId || '').replace(/[^\w-]+/g, '_') + '__' +
        String(establishmentId || '').replace(/[^\w-]+/g, '_');
}

function normalizeManagerRole(value) {
    var role = String(value || '').trim();
    return ({
        owner: 'proprietario',
        manager: 'gerente_responsavel',
        representative: 'representante_autorizado',
        proprietario: 'proprietario',
        gerente_responsavel: 'gerente_responsavel',
        representante_autorizado: 'representante_autorizado'
    })[role] || '';
}

var ESTABLISHMENT_UPDATE_ALLOWED_FIELDS = [
    'description',
    'phone',
    'whatsapp',
    'instagram',
    'website',
    'address',
    'openingHours',
    'additionalNotes'
];

var ESTABLISHMENT_UPDATE_FIELD_LIMITS = {
    description: 4000,
    phone: 120,
    whatsapp: 120,
    instagram: 160,
    website: 240,
    address: 240,
    openingHours: 240,
    additionalNotes: 1500
};

var ESTABLISHMENT_UPDATE_APPLY_TARGETS = {
    description: 'content.description',
    phone: 'contact.phone',
    whatsapp: 'contact.whatsapp',
    instagram: 'contact.instagram',
    website: 'contact.website',
    address: 'location.address',
    openingHours: 'content.openingHours'
};

function sanitizeSimpleText(value, maxLength) {
    var normalized = String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[\u0000-\u001F\u007F]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalized) return '';
    if (typeof maxLength === 'number' && maxLength > 0) {
        return normalized.slice(0, maxLength);
    }
    return normalized;
}

function sanitizeLongText(value, maxLength) {
    var normalized = String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    if (!normalized) return '';
    if (typeof maxLength === 'number' && maxLength > 0) {
        return normalized.slice(0, maxLength);
    }
    return normalized;
}

function sanitizeUpdateFieldValue(field, value) {
    var limit = ESTABLISHMENT_UPDATE_FIELD_LIMITS[field];
    if (field === 'description' || field === 'additionalNotes') {
        return sanitizeLongText(value, limit);
    }
    return sanitizeSimpleText(value, limit);
}

function buildSafeImageMetadata(items) {
    return ensureArray(items).map(function(item, index) {
        return {
            url: sanitizeSimpleText(item && item.url, 2048),
            path: sanitizeSimpleText(item && item.path, 512),
            name: sanitizeSimpleText(item && (item.name || item.fileName), 120),
            contentType: sanitizeSimpleText(item && item.contentType, 80),
            size: Number(item && item.size || 0) || 0,
            uploadedAt: sanitizeSimpleText(item && item.uploadedAt, 60),
            position: index + 1
        };
    }).filter(function(item) {
        return item.path && item.contentType && item.size > 0;
    });
}

function buildSafeCurrentSnapshot(snapshot) {
    var raw = snapshot || {};
    var images = ensureArray(raw.images).map(function(item) {
        return sanitizeSimpleText(item, 512);
    }).filter(Boolean);

    return {
        name: sanitizeSimpleText(raw.name, 160),
        category: sanitizeSimpleText(raw.category, 120),
        source: sanitizeSimpleText(raw.source, 60),
        originalId: sanitizeSimpleText(raw.originalId, 120),
        description: sanitizeLongText(raw.description, 4000),
        phone: sanitizeSimpleText(raw.phone, 120),
        whatsapp: sanitizeSimpleText(raw.whatsapp, 120),
        instagram: sanitizeSimpleText(raw.instagram, 160),
        website: sanitizeSimpleText(raw.website, 240),
        address: sanitizeSimpleText(raw.address, 240),
        openingHours: sanitizeSimpleText(raw.openingHours, 240),
        images: images,
        mainImage: sanitizeSimpleText(raw.mainImage, 512) || (images[0] || ''),
        imageCount: images.length
    };
}

function buildSafeRequestedChanges(changes) {
    var raw = changes || {};
    return ESTABLISHMENT_UPDATE_ALLOWED_FIELDS.reduce(function(result, field) {
        var sanitized = sanitizeUpdateFieldValue(field, raw[field]);
        if (sanitized || sanitized === '') {
            if (Object.prototype.hasOwnProperty.call(raw, field)) {
                result[field] = sanitized;
            }
        }
        return result;
    }, {});
}

function normalizeUpdateRequestStatus(status) {
    var normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'approved' || normalized === 'rejected' || normalized === 'changes_requested') {
        return normalized;
    }
    return 'pending';
}

function normalizeMediaReviewStatus(status) {
    var normalized = String(status || '').trim().toLowerCase();
    return ['pending', 'accepted', 'rejected'].indexOf(normalized) !== -1 ? normalized : 'pending';
}

function buildMediaReviewKey(item) {
    var path = sanitizeSimpleText(item && item.path, 512);
    var url = sanitizeSimpleText(item && item.url, 2048);
    return path || url;
}

function buildSafeMediaReviewMap(items) {
    return ensureArray(items).reduce(function(result, item) {
        var key = buildMediaReviewKey(item);
        if (!key) return result;

        result[key] = {
            status: normalizeMediaReviewStatus(item && item.status),
            note: sanitizeLongText(item && item.note, 240)
        };
        return result;
    }, {});
}

function buildSafeAppliedMedia(items) {
    return ensureArray(items).map(function(item) {
        return {
            sourceRequestId: sanitizeSimpleText(item && item.sourceRequestId, 160),
            sourceImagePath: sanitizeSimpleText(item && item.sourceImagePath, 512),
            sourceImageUrl: sanitizeSimpleText(item && item.sourceImageUrl, 2048),
            destination: sanitizeSimpleText(item && item.destination, 40),
            url: sanitizeSimpleText(item && item.url, 2048),
            path: sanitizeSimpleText(item && item.path, 512),
            appliedAt: sanitizeSimpleText(item && item.appliedAt, 60),
            appliedBy: sanitizeSimpleText(item && item.appliedBy, 160),
            establishmentId: sanitizeSimpleText(item && item.establishmentId, 160)
        };
    }).filter(function(item) {
        return (item.sourceImagePath || item.sourceImageUrl) && item.path && item.url;
    });
}

function establishmentUpdateMediaFingerprint(request) {
    var raw = request || {};
    var reviewMap = buildSafeMediaReviewMap(raw.mediaReview && raw.mediaReview.images);
    return JSON.stringify(buildSafeImageMetadata(raw.images).map(function(image, index) {
        var review = reviewMap[buildMediaReviewKey(image)] || {};
        return {
            index: index,
            path: image.path,
            url: image.url,
            contentType: image.contentType,
            size: image.size,
            alt: image.alt,
            status: normalizeMediaReviewStatus(review.status),
            note: sanitizeLongText(review.note, 240)
        };
    }));
}

function readOpaqueFingerprint(value) {
    return typeof value === 'string' ? value : '';
}

function readNestedValue(source, path) {
    return String(path || '').split('.').reduce(function(value, part) {
        return value && typeof value === 'object' ? value[part] : undefined;
    }, source);
}

function buildEstablishmentTextApplyPlan(requestedChanges) {
    var changes = requestedChanges || {};
    var fields = Object.keys(changes).filter(function(field) {
        return !!ESTABLISHMENT_UPDATE_APPLY_TARGETS[field];
    }).sort();
    return {
        fields: fields,
        fingerprint: JSON.stringify(fields.map(function(field) {
            return [field, changes[field]];
        }))
    };
}

function buildEstablishmentTextBaseValues(cms, fields) {
    return ensureArray(fields).reduce(function(values, field) {
        var targetPath = ESTABLISHMENT_UPDATE_APPLY_TARGETS[field];
        values[field] = String(readNestedValue(cms, targetPath) || '');
        return values;
    }, {});
}

function establishmentTextApplyGroup(field) {
    var targetPath = ESTABLISHMENT_UPDATE_APPLY_TARGETS[field] || '';
    return String(targetPath).split('.')[0];
}

function workflowProgressHas(progress, key) {
    return !!(progress && typeof progress === 'object' && progress[key] === true);
}

function cmsTextValuesRemainResumable(cms, requestedChanges, fields, baseValues, progress) {
    return ensureArray(fields).every(function(field) {
        if (!Object.prototype.hasOwnProperty.call(baseValues || {}, field)) return false;
        var targetPath = ESTABLISHMENT_UPDATE_APPLY_TARGETS[field];
        var currentValue = String(readNestedValue(cms, targetPath) || '');
        var desiredValue = String(requestedChanges[field] || '');
        if (workflowProgressHas(progress, establishmentTextApplyGroup(field))) {
            return currentValue === desiredValue;
        }
        return currentValue === String(baseValues[field] || '') || currentValue === desiredValue;
    });
}

function allTextApplyGroupsCompleted(fields, progress) {
    return ensureArray(fields).every(function(field) {
        return workflowProgressHas(progress, establishmentTextApplyGroup(field));
    });
}

function stableWorkflowValue(value) {
    if (Array.isArray(value)) {
        return value.map(stableWorkflowValue);
    }
    if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce(function(result, key) {
            result[key] = stableWorkflowValue(value[key]);
            return result;
        }, {});
    }
    return value === undefined ? null : value;
}

function cmsMediaStateFingerprint(cms) {
    var media = cms && cms.media || {};
    return JSON.stringify(stableWorkflowValue({
        mainImage: media.mainImage || {},
        gallery: ensureArray(media.gallery),
        publicPaths: ensureArray(media.publicPaths)
    }));
}

function isResumablePublishedLifecycle(cms, baseStatus) {
    return baseStatus === 'published' &&
        sanitizeSimpleText(cms && cms.status, 40) === 'draft' &&
        !!(cms && cms.editSession) &&
        sanitizeSimpleText(cms.editSession.resumeStatus, 40) === 'published';
}

function cmsMatchesEstablishmentTextChanges(cms, requestedChanges, fields) {
    return ensureArray(fields).every(function(field) {
        var targetPath = ESTABLISHMENT_UPDATE_APPLY_TARGETS[field];
        return targetPath && String(readNestedValue(cms, targetPath) || '') === String(requestedChanges[field] || '');
    });
}

function establishmentUpdateConflict(message) {
    var error = new Error(message || 'A solicitação ou o empreendimento mudou durante a aplicação. Recarregue antes de tentar novamente.');
    error.code = 'establishment-update/conflict';
    return error;
}

function isImageAlreadyApplied(image, appliedItems, catalogImages, destinationPath) {
    var sourcePath = sanitizeSimpleText(image && image.path, 512);
    var sourceUrl = sanitizeSimpleText(image && image.url, 2048);

    var tracked = ensureArray(appliedItems).concat(ensureArray(catalogImages)).some(function(item) {
        return (sourcePath && item && item.sourceImagePath === sourcePath) ||
            (sourceUrl && item && item.sourceImageUrl === sourceUrl);
    });
    return tracked || ensureArray(catalogImages).some(function(item) {
        return destinationPath && item && sanitizeSimpleText(item.path, 512) === destinationPath;
    });
}

function getSafeFileNameFromPath(value) {
    var raw = String(value || '').split('?')[0].split('#')[0].split('/').pop() || 'imagem';
    var safe = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 90);

    return safe || 'imagem.jpg';
}

function buildReviewedCatalogImage(uploadedImage, sourceImage) {
    return {
        url: sanitizeSimpleText(uploadedImage && uploadedImage.url, 2048),
        path: sanitizeSimpleText(uploadedImage && uploadedImage.path, 512),
        alt: sanitizeSimpleText(sourceImage && sourceImage.alt, 160) || 'Imagem do empreendimento',
        caption: '',
        credit: '',
        source: 'portal_request',
        status: 'active'
    };
}

function createMediaApplicationError(type, message, cause) {
    var error = new Error(message);
    error.cmsMediaType = type;
    error.cause = cause || null;
    error.cmsMediaDiagnosis = cause && cause.cmsMediaDiagnosis ? cause.cmsMediaDiagnosis : '';
    return error;
}

function getMediaApplicationErrorMessage(error) {
    if (error && String(error.code || '').indexOf('establishment-update/') === 0) {
        return sanitizeSimpleText(error.message, 500) || 'A solicitação mudou durante a aplicação de mídia.';
    }
    if (error && error.cmsMediaType === 'download') {
        if (error.cmsMediaDiagnosis === 'sdk-unsupported') {
            return 'Não foi possível baixar a imagem pelo path do Storage: o SDK carregado não expõe getBlob/getBytes compatível. Use cópia server-side ou configure um SDK modular autenticado.';
        }
        if (error.cmsMediaDiagnosis === 'ref-invalida') {
            return 'Não foi possível localizar a imagem original pelo path do Storage. Verifique o campo image.path da solicitação.';
        }
        if (error.cmsMediaDiagnosis === 'permission') {
            return 'Sem permissão para ler a imagem original no Firebase Storage. Verifique sessão admin/moderador e Storage Rules publicadas.';
        }
        if (error.cmsMediaDiagnosis === 'cors') {
            return 'O SDK tentou baixar a imagem pelo path, mas o bucket bloqueou a resposta por CORS. A alternativa recomendada é Cloud Function/Admin SDK ou ajuste operacional de CORS do bucket.';
        }
        return 'Falha ao baixar a imagem original pelo path do Firebase Storage. Verifique SDK, permissões ou CORS do bucket.';
    }

    if (error && error.cmsMediaType === 'upload') {
        return 'Não foi possível enviar a imagem para cms-media.';
    }

    if (error && error.cmsMediaType === 'document') {
        return 'Upload confirmado, mas o documento não foi atualizado. O retry reutiliza o mesmo objeto e reconcilia a referência; nenhuma publicação foi alterada.';
    }

    if (error && error.cmsMediaType === 'request-tracking') {
        return 'A mídia foi vinculada ao empreendimento, mas o registro da solicitação não foi concluído. Tente novamente para reconciliar sem novo upload.';
    }

    return 'Erro ao aplicar mídia aceita ao catálogo editorial.';
}

var firebaseStorageModulePromise = null;

function loadFirebaseStorageModule() {
    if (!firebaseStorageModulePromise) {
        firebaseStorageModulePromise = import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js')
            .catch(function(error) {
                firebaseStorageModulePromise = null;
                throw error;
            });
    }

    return firebaseStorageModulePromise;
}

function classifyStorageDownloadError(error) {
    var code = String(error && error.code || '').toLowerCase();
    var message = String(error && error.message || '').toLowerCase();

    if (code.indexOf('permission') !== -1 || code.indexOf('unauthorized') !== -1 ||
        message.indexOf('permission') !== -1 || message.indexOf('unauthorized') !== -1) {
        return 'permission';
    }
    if (message.indexOf('cors') !== -1 ||
        message.indexOf('access-control-allow-origin') !== -1 ||
        message.indexOf('cross-origin') !== -1) {
        return 'cors';
    }
    if (message.indexOf('_location') !== -1 ||
        message.indexOf('invalid storage reference') !== -1 ||
        message.indexOf('expects first argument') !== -1 ||
        message.indexOf('storage reference') !== -1) {
        return 'ref-invalida';
    }
    if (code === 'storage/object-not-found' || message.indexOf('object') !== -1 && message.indexOf('not found') !== -1) {
        return 'not-found';
    }
    return 'download';
}

function createStorageDownloadError(message, diagnosis, cause) {
    var error = new Error(message);
    error.cmsMediaDiagnosis = diagnosis || 'download';
    error.cause = cause || null;
    if (cause && cause.code) error.code = cause.code;
    return error;
}

function getErrorLogDetails(error) {
    if (!error) return {};
    return {
        code: error.code || '',
        name: error.name || '',
        message: sanitizeLogMessage(error.message),
        diagnosis: error.cmsMediaDiagnosis || classifyStorageDownloadError(error)
    };
}

function sanitizeLogMessage(value) {
    return sanitizeSimpleText(value, 240)
        .replace(/https?:\/\/\S+/gi, '[url-redigida]')
        .replace(/([?&](?:token|alt)=)[^&\s]+/gi, '$1[redigido]');
}

function logStorageCopyDiagnostic(level, stage, details) {
    var logger = console[level] || console.info;
    logger.call(console, '[cms-media-copy] ' + stage, details || {});
}

function safeDecodeStoragePath(value) {
    var text = String(value || '');
    try {
        return decodeURIComponent(text);
    } catch(error) {
        return text;
    }
}

function normalizeStorageSourcePath(value) {
    var raw = sanitizeSimpleText(value, 2048);
    var bucket = firebaseConfig && firebaseConfig.storageBucket ? String(firebaseConfig.storageBucket) : '';

    if (!raw) return '';

    if (/^https?:\/\//i.test(raw)) {
        return extractStoragePathFromUrl(raw);
    }

    if (raw.indexOf('gs://') === 0) {
        raw = raw.slice(5);
        if (bucket && raw.indexOf(bucket + '/') === 0) {
            raw = raw.slice(bucket.length + 1);
        } else {
            raw = raw.replace(/^[^/]+\//, '');
        }
    }

    raw = raw.replace(/^\/+/, '');
    if (bucket && raw.indexOf(bucket + '/') === 0) {
        raw = raw.slice(bucket.length + 1);
    }
    raw = safeDecodeStoragePath(raw).replace(/^\/+/, '');

    var allowedRoots = [
        'submissions/establishment-updates/',
        'submissions/establishments/',
        'submissions/events/'
    ];
    for (var rootIndex = 0; rootIndex < allowedRoots.length; rootIndex += 1) {
        var pathIndex = raw.indexOf(allowedRoots[rootIndex]);
        if (pathIndex !== -1) {
            return raw.slice(pathIndex);
        }
    }
    return '';
}

function extractStoragePathFromUrl(url) {
    var raw = sanitizeSimpleText(url, 2048);
    if (!raw) return '';

    try {
        var parsed = new URL(raw);
        var marker = '/' + 'o' + '/';
        var markerIndex = parsed.pathname.indexOf(marker);
        if (markerIndex === -1) return '';
        return normalizeStorageSourcePath(parsed.pathname.slice(markerIndex + marker.length));
    } catch(error) {
        return '';
    }
}

function getCompatStorageReference(storage, sourcePath) {
    if (!storage || typeof storage.ref !== 'function') {
        throw createStorageDownloadError('Firebase Storage compat indisponivel.', 'ref-invalida');
    }
    if (!sourcePath) {
        throw createStorageDownloadError('Imagem aceita sem path valido em submissions/establishment-updates.', 'ref-invalida');
    }

    try {
        return storage.ref(sourcePath);
    } catch(error) {
        throw createStorageDownloadError('Falha ao criar referencia compat do Storage pelo path.', 'ref-invalida', error);
    }
}

function assertModularStorageReference(sourceRef, method) {
    if (!sourceRef || !sourceRef._location) {
        throw createStorageDownloadError('Referencia modular do Storage invalida para ' + method + '.', 'ref-invalida');
    }
    return sourceRef;
}

async function downloadWithModularStorageFunction(storageModule, sourceRef, method, contentType) {
    assertModularStorageReference(sourceRef, method);

    if (method === 'getBlob' && typeof storageModule.getBlob === 'function') {
        return storageModule.getBlob(sourceRef);
    }

    if (method === 'getBytes' && typeof storageModule.getBytes === 'function') {
        return new Blob([await storageModule.getBytes(sourceRef)], { type: contentType || 'application/octet-stream' });
    }

    throw createStorageDownloadError('SDK de Storage sem ' + method + ' disponivel.', 'sdk-unsupported');
}

async function downloadStorageBlobFromPath(storage, sourcePath, contentType) {
    var sourceRef = getCompatStorageReference(storage, sourcePath);

    logStorageCopyDiagnostic('info', 'download:start', {
        sourcePath: sourcePath,
        sdk: 'compat',
        method: 'storage.ref(path)'
    });

    if (typeof sourceRef.getBlob === 'function') {
        try {
            logStorageCopyDiagnostic('info', 'download:method', {
                sourcePath: sourcePath,
                sdk: 'compat',
                method: 'sourceRef.getBlob'
            });
            return await sourceRef.getBlob();
        } catch(error) {
            logStorageCopyDiagnostic('warn', 'download:error', Object.assign({
                sourcePath: sourcePath,
                sdk: 'compat',
                method: 'sourceRef.getBlob'
            }, getErrorLogDetails(error)));
        }
    }

    if (typeof sourceRef.getBytes === 'function') {
        try {
            logStorageCopyDiagnostic('info', 'download:method', {
                sourcePath: sourcePath,
                sdk: 'compat',
                method: 'sourceRef.getBytes'
            });
            return new Blob([await sourceRef.getBytes()], { type: contentType || 'application/octet-stream' });
        } catch(error) {
            logStorageCopyDiagnostic('warn', 'download:error', Object.assign({
                sourcePath: sourcePath,
                sdk: 'compat',
                method: 'sourceRef.getBytes'
            }, getErrorLogDetails(error)));
        }
    }

    var storageModule = await loadFirebaseStorageModule();
    var modularRef = sourceRef && sourceRef._delegate ? sourceRef._delegate : null;

    if (!modularRef) {
        throw createStorageDownloadError('Storage compat nao expos referencia modular autenticada (_delegate).', 'sdk-unsupported');
    }

    if (typeof storageModule.getBlob === 'function') {
        try {
            logStorageCopyDiagnostic('info', 'download:method', {
                sourcePath: sourcePath,
                sdk: 'modular-from-compat-delegate',
                method: 'getBlob'
            });
            return await downloadWithModularStorageFunction(storageModule, modularRef, 'getBlob', contentType);
        } catch(error) {
            logStorageCopyDiagnostic('warn', 'download:error', Object.assign({
                sourcePath: sourcePath,
                sdk: 'modular-from-compat-delegate',
                method: 'getBlob'
            }, getErrorLogDetails(error)));
            if (classifyStorageDownloadError(error) !== 'download') {
                throw createStorageDownloadError('Falha no download autenticado pelo path do Storage.', classifyStorageDownloadError(error), error);
            }
        }
    }

    if (typeof storageModule.getBytes === 'function') {
        try {
            logStorageCopyDiagnostic('info', 'download:method', {
                sourcePath: sourcePath,
                sdk: 'modular-from-compat-delegate',
                method: 'getBytes'
            });
            return await downloadWithModularStorageFunction(storageModule, modularRef, 'getBytes', contentType);
        } catch(error) {
            logStorageCopyDiagnostic('warn', 'download:error', Object.assign({
                sourcePath: sourcePath,
                sdk: 'modular-from-compat-delegate',
                method: 'getBytes'
            }, getErrorLogDetails(error)));
            throw createStorageDownloadError('Falha no download autenticado pelo path do Storage.', classifyStorageDownloadError(error), error);
        }
    }

    throw createStorageDownloadError('SDK de Storage sem getBlob/getBytes disponivel.', 'sdk-unsupported');
}

async function downloadReviewedImageBlob(storage, sourcePath, sourceUrl, contentType) {
    var normalizedPath = normalizeStorageSourcePath(sourcePath);
    var pathSource = 'image.path';

    if (!normalizedPath) {
        normalizedPath = extractStoragePathFromUrl(sourceUrl);
        pathSource = 'image.url-derived-path';
    }

    if (!normalizedPath) {
        throw createStorageDownloadError('Imagem aceita sem path valido em submissions/establishment-updates.', 'ref-invalida');
    }

    logStorageCopyDiagnostic('info', 'source:path', {
        sourcePath: normalizedPath,
        source: pathSource
    });

    return downloadStorageBlobFromPath(storage, normalizedPath, contentType);
}

async function copyReviewedImageToCmsMedia(storage, image, ownerUid, establishmentId, requestId, index) {
    return copySubmissionImageToApprovedMedia(
        image,
        'establishment-update',
        establishmentId,
        ownerUid,
        index,
        requestId,
        storage
    );
}

function getApprovedMediaEntityConfig(entityKind) {
    if (entityKind === 'event') {
        return { sourceRoot: 'events', destinationRoot: 'events' };
    }
    if (entityKind === 'establishment') {
        return { sourceRoot: 'establishments', destinationRoot: 'cms-establishments' };
    }
    if (entityKind === 'establishment-update') {
        return { sourceRoot: 'establishment-updates', destinationRoot: 'cms-establishments' };
    }
    throw createMediaApplicationError('download', 'Tipo de mídia de publicação inválido.');
}

function getSubmissionMediaSourcePath(image) {
    return normalizeStorageSourcePath(image && image.path) ||
        extractStoragePathFromUrl(image && image.url);
}

function assertOwnedSubmissionMediaPath(sourcePath, entityKind, ownerUid, documentId) {
    var config = getApprovedMediaEntityConfig(entityKind);
    var normalizedOwnerUid = sanitizeSimpleText(ownerUid, 160);
    var normalizedDocumentId = requirePublicationContracts().publicDocumentId(documentId);
    var expectedPrefix = 'submissions/' + config.sourceRoot + '/' + normalizedOwnerUid + '/' + normalizedDocumentId + '/';
    if (!normalizedOwnerUid || !normalizedDocumentId || sourcePath.indexOf(expectedPrefix) !== 0) {
        var error = createMediaApplicationError('download', 'A mídia não pertence à submissão aprovada.');
        error.code = 'publication/invalid-field';
        error.field = 'images';
        throw error;
    }
    return config;
}

async function getExistingApprovedMediaUrl(destinationRef) {
    try {
        return await destinationRef.getDownloadURL();
    } catch(error) {
        var code = String(error && error.code || '');
        if (code === 'storage/object-not-found' || code === 'object-not-found') return '';
        throw createMediaApplicationError('upload', 'Não foi possível verificar a mídia pública existente.', error);
    }
}

async function sha256OpaqueToken(material, errorMessage) {
    var cryptoApi = window.crypto;
    if (!cryptoApi || !cryptoApi.subtle || typeof cryptoApi.subtle.digest !== 'function' || typeof TextEncoder !== 'function') {
        throw createMediaApplicationError('upload', errorMessage || 'Não foi possível calcular um identificador opaco com segurança.');
    }
    try {
        var digest = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(String(material || '')));
        return Array.prototype.map.call(new Uint8Array(digest), function (value) {
            return value.toString(16).padStart(2, '0');
        }).join('');
    } catch(error) {
        throw createMediaApplicationError('upload', errorMessage || 'Falha ao calcular um identificador opaco.', error);
    }
}

async function approvedMediaSourceToken(sourcePath) {
    return (await sha256OpaqueToken(sourcePath, 'Falha ao calcular a proveniência da mídia aprovada.')).slice(0, 24);
}

async function establishmentSubmissionProvenanceId(submissionId) {
    return 'submission-sha256-' + await sha256OpaqueToken(
        'establishment-submission:' + String(submissionId || ''),
        'Não foi possível proteger o identificador privado da submissão.'
    );
}

function approvedMediaExtension(contentType) {
    var normalized = sanitizeSimpleText(contentType, 80).toLowerCase();
    if (normalized === 'image/png') return 'png';
    if (normalized === 'image/webp') return 'webp';
    return 'jpg';
}

async function buildApprovedMediaCopyPlan(image, entityKind, documentId, ownerUid, index, sourceDocumentId) {
    var normalizedImage = typeof image === 'string' ? { url: image } : Object.assign({}, image || {});
    var sourcePath = getSubmissionMediaSourcePath(normalizedImage);
    if (!sourcePath) {
        var sourceError = createMediaApplicationError('download', 'A mídia da submissão não possui origem privada verificável.');
        sourceError.code = 'publication/invalid-field';
        sourceError.field = 'images';
        throw sourceError;
    }

    var config = assertOwnedSubmissionMediaPath(sourcePath, entityKind, ownerUid, sourceDocumentId || documentId);
    var contentType = sanitizeSimpleText(normalizedImage.contentType, 80) || 'image/jpeg';
    var sourceName = sanitizeSimpleText(normalizedImage.name, 120) || getSafeFileNameFromPath(sourcePath);
    var safeFileName = getSafeFileNameFromPath(sourceName);
    var sourceToken = await approvedMediaSourceToken(sourcePath);
    // Para empreendimentos, o nome publico nao carrega UID, request/submission
    // ID nem filename controlado pelo usuario. O hash vincula o objeto a uma
    // origem privada create-only sem expor essa origem.
    var destinationFileName = entityKind === 'event'
        ? String(index + 1).padStart(2, '0') + '-' + sourceToken + '-' + safeFileName
        : String(index + 1).padStart(2, '0') + '-' + sourceToken + '.' + approvedMediaExtension(contentType);
    var destinationPath = [
        'approved-media',
        config.destinationRoot,
        documentId,
        destinationFileName
    ].join('/');

    return {
        normalizedImage: normalizedImage,
        sourcePath: sourcePath,
        contentType: contentType,
        destinationPath: destinationPath
    };
}

async function copySubmissionImageToApprovedMedia(image, entityKind, documentId, ownerUid, index, sourceDocumentId, storageOverride) {
    var plan = await buildApprovedMediaCopyPlan(image, entityKind, documentId, ownerUid, index, sourceDocumentId);
    var normalizedImage = plan.normalizedImage;
    var storage = storageOverride || firebase.storage();
    var sourcePath = plan.sourcePath;
    var contentType = plan.contentType;
    var destinationPath = plan.destinationPath;
    var destinationRef = storage.ref(destinationPath);
    var destinationUrl = await getExistingApprovedMediaUrl(destinationRef);

    if (!destinationUrl) {
        var blob = await downloadStorageBlobFromPath(storage, sourcePath, contentType);
        try {
            await destinationRef.put(blob, {
                contentType: contentType,
                cacheControl: 'public,max-age=31536000,immutable'
            });
            destinationUrl = await destinationRef.getDownloadURL();
        } catch(error) {
            throw createMediaApplicationError('upload', 'Falha ao republicar mídia aprovada em namespace público.', error);
        }
    }

    normalizedImage.url = destinationUrl;
    normalizedImage.path = destinationPath;
    delete normalizedImage.uploadedAt;
    if (entityKind !== 'event') {
        delete normalizedImage.name;
        delete normalizedImage.fileName;
    }
    return normalizedImage;
}

async function preparePublicSubmissionMedia(rawDocument, entityKind, documentId, sourceDocumentId) {
    var raw = rawDocument || {};
    var ownerUid = sanitizeSimpleText(raw.submittedBy, 160);
    var sourceImages = Array.isArray(raw.images) ? raw.images : [];
    var projectedImages = [];
    var urlMap = Object.create(null);

    for (var index = 0; index < sourceImages.length; index += 1) {
        var sourceImage = typeof sourceImages[index] === 'string'
            ? { url: sourceImages[index] }
            : Object.assign({}, sourceImages[index] || {});
        var publicImage = await copySubmissionImageToApprovedMedia(sourceImage, entityKind, documentId, ownerUid, index, sourceDocumentId);
        projectedImages.push(publicImage);
        if (sourceImage.url && publicImage.url) urlMap[String(sourceImage.url)] = publicImage.url;
    }

    var prepared = Object.assign({}, raw, { images: projectedImages });
    var rawMainImage = sanitizeSimpleText(raw.mainImage || raw.image, 2048);
    if (rawMainImage) {
        var publicMainImage = urlMap[rawMainImage] || '';
        if (entityKind === 'establishment' && !publicMainImage) {
            var coverError = createMediaApplicationError('download', 'A imagem principal deve pertencer à galeria verificada da submissão.');
            coverError.code = 'publication/invalid-field';
            coverError.field = 'mainImage';
            throw coverError;
        }
        if (!publicMainImage) {
            var copiedCover = await copySubmissionImageToApprovedMedia(
                { url: rawMainImage, contentType: raw.mainImageContentType || '' },
                entityKind,
                documentId,
                ownerUid,
                projectedImages.length,
                sourceDocumentId
            );
            publicMainImage = copiedCover.url || rawMainImage;
        }
        prepared.mainImage = publicMainImage;
        prepared.image = publicMainImage;
    }
    return prepared;
}

function normalizeEventReviewStatus(status) {
    var normalized = String(status == null ? '' : status).trim().toLowerCase();

    if (normalized === 'aprovado' || normalized === 'approved') {
        return 'approved';
    }

    if (normalized === 'rejeitado' || normalized === 'rejected') {
        return 'rejected';
    }

    if (!normalized || normalized === 'pendente' || normalized === 'pending') {
        return 'pending';
    }

    return normalized;
}

function isPendingStatus(status) {
    return normalizeEventReviewStatus(status) === 'pending';
}

function getSortableTimestampValue(value) {
    if (!value) return 0;

    try {
        if (typeof value.toDate === 'function') {
            return value.toDate().getTime();
        }

        if (typeof value.seconds === 'number') {
            return value.seconds * 1000;
        }

        var parsedDate = new Date(value);
        var timestamp = parsedDate.getTime();
        return Number.isFinite(timestamp) ? timestamp : 0;
    } catch (error) {
        return 0;
    }
}

function isActiveManagerRecord(manager, userId, establishmentId) {
    if (!manager || manager.active === false) return false;
    if (userId && manager.userId !== userId) return false;
    if (establishmentId && normalizeComparableId(manager.establishmentId) !== normalizeComparableId(establishmentId)) {
        return false;
    }
    return true;
}

// Aguarda os SDKs do Firebase carregarem nas páginas que usam autenticação.
function initFirebase() {
    return new Promise(function(resolve) {
        if (!firebaseConfig) {
            console.error('[firebase-auth] Configuração Firebase ausente. Abortando inicialização.');
            resolve(false);
            return;
        }
        var startedAt = Date.now();

        async function tryInit() {
            if (typeof firebase === 'undefined' ||
                !firebase.auth || !firebase.firestore) {
                if (Date.now() - startedAt >= SDK_LOAD_TIMEOUT_MS) {
                    console.error('[firebase-auth] SDKs do Firebase não carregaram dentro do tempo limite.');
                    resolve(false);
                    return;
                }
                setTimeout(tryInit, 100);
                return;
            }

            try {
                const localEmulatorRequested = /^(?:localhost|127\.0\.0\.1)$/.test(window.location.hostname) &&
                    new URLSearchParams(window.location.search).get('emulator') === '1';
                const runtimeFirebaseConfig = localEmulatorRequested
                    ? Object.assign({}, firebaseConfig, {
                        projectId: 'demo-turismo-sms-admin-finalization',
                        authDomain: 'demo-turismo-sms-admin-finalization.firebaseapp.com',
                        storageBucket: 'demo-turismo-sms-admin-finalization.appspot.com'
                    })
                    : firebaseConfig;
                // Inicializar app (evita dupla inicialização)
                if (!firebase.apps.length) {
                    firebase.initializeApp(runtimeFirebaseConfig);
                }
                const auth = firebase.auth();
                const db   = firebase.firestore();
                if (localEmulatorRequested && !window.__SMSFirebaseEmulatorsConnected) {
                    db.settings({ host: '127.0.0.1:8080', ssl: false, experimentalForceLongPolling: true });
                    auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true });
                    if (firebase.storage) firebase.storage().useEmulator('127.0.0.1', 9199);
                    window.__SMSFirebaseEmulatorsConnected = true;
                }
                if (!localEmulatorRequested) {
                    const { initCompatAppCheck } = await import('./firebase-app-check.js');
                    await initCompatAppCheck(firebase);
                }

                // Guardar referências globais para compatibilidade
                window.firebaseAuth = { auth };
                window.firebaseDB   = { db };

                // Observer de estado de autenticação
                auth.onAuthStateChanged(async function(user) {
                    if (user) {
                        currentUser = basicUserFromAuth(user);
                        window.currentUser = currentUser;
                        persistUserSession(currentUser);
                        FirebaseSystem.updateUI();

                        try {
                            const userDoc = await withTimeout(
                                db.collection('usuarios').doc(user.uid).get(),
                                PROFILE_LOAD_TIMEOUT_MS,
                                'firestore/profile-timeout'
                            );
                            if (userDoc.exists) {
                                currentUser = Object.assign({}, userDoc.data(), { uid: user.uid, email: user.email, _profilePending: false, _profileError: false });
                            } else {
                                currentUser._profilePending = false;
                                currentUser._profileError = false;
                            }
                        } catch(e) {
                            console.warn('[firebase-auth] Não foi possível carregar o perfil completo do usuário.', e);
                            currentUser._profilePending = false;
                            currentUser._profileError = true;
                        }
                        window.currentUser = currentUser;
                        persistUserSession(currentUser);
                        FirebaseSystem.updateUI();
                    } else {
                        currentUser = null;
                        window.currentUser = null;
                        try { localStorage.removeItem('smsUserSession'); } catch(ex) {}
                    }
                    FirebaseSystem.updateUI();
                });

                // Firebase (compat) inicializado
                resolve(true);
            } catch(error) {
                console.error('[firebase-auth] Falha ao inicializar Firebase/Auth.', error);
                resolve(false);
            }
        }
        tryInit();
    });
}

const FirebaseSystem = {

    // ========================================
    // AUTENTICAÇÃO
    // ========================================

    register: async function(userData) {
        try {
            const auth = firebase.auth();
            const db   = firebase.firestore();

            const cred = await auth.createUserWithEmailAndPassword(userData.email, userData.senha);
            const user = cred.user;

            await user.updateProfile({ displayName: userData.nome });

            await db.collection('usuarios').doc(user.uid).set({
                nome:         userData.nome,
                email:        userData.email,
                telefone:     userData.telefone    || '',
                tipo:         userData.tipo        || 'turista',
                organizacao:  userData.organizacao || '',
                ativo:        true,
                role:         'user',
                criadoEm:     firebase.firestore.FieldValue.serverTimestamp(),
                verificado:   false
            });

            return { success: true, message: 'Cadastro realizado com sucesso!', user: user };
        } catch(error) {
            console.error('Erro no cadastro:', error);
            let message = 'Erro ao criar conta.';
            if (error.code === 'auth/email-already-in-use') message = 'Este e-mail já está cadastrado.';
            else if (error.code === 'auth/weak-password')   message = 'A senha deve ter pelo menos 6 caracteres.';
            else if (error.code === 'auth/invalid-email')   message = 'E-mail inválido.';
            return { success: false, message: message };
        }
    },

    login: async function(email, senha) {
        try {
            const auth = getFirebaseAuth();
            const cred = await withTimeout(
                auth.signInWithEmailAndPassword(email, senha),
                AUTH_OPERATION_TIMEOUT_MS,
                'auth/login-timeout'
            );
            return { success: true, message: 'Login realizado com sucesso!', user: cred.user };
        } catch(error) {
            console.error('Erro no login:', error);
            return { success: false, message: authErrorMessage(error, 'E-mail ou senha incorretos.') };
        }
    },

    sendPasswordReset: async function(email) {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            return {
                success: true,
                message: 'Link de recuperação enviado! Verifique sua caixa de entrada (e a pasta de spam).'
            };
        } catch(error) {
            console.error('Erro ao enviar recuperação:', error);
            let message = 'Não foi possível enviar o link.';
            if (error.code === 'auth/user-not-found')         message = 'Nenhuma conta encontrada com este e-mail.';
            else if (error.code === 'auth/invalid-email')     message = 'E-mail inválido.';
            else if (error.code === 'auth/too-many-requests') message = 'Muitas tentativas. Aguarde alguns minutos.';
            return { success: false, message: message };
        }
    },

    logout: async function() {
        try {
            await firebase.auth().signOut();
            return { success: true };
        } catch(error) {
            return { success: false, message: 'Erro ao sair.' };
        }
    },

    getCurrentUser: function() { return currentUser; },
    isLoggedIn:     function() { return currentUser !== null; },
    isAdmin:        function() { return currentUser && currentUser.ativo === true && currentUser.role === 'admin'; },
    isModerator:    function() { return currentUser && currentUser.ativo === true && (currentUser.role === 'admin' || currentUser.role === 'moderator'); },

    // ========================================
    // GERENCIAMENTO DE USUÁRIOS (ADMIN)
    // ========================================

    getUsers: async function() {
        if (!this.isAdmin()) return [];
        try {
            const snap = await firebase.firestore().collection('usuarios').get();
            const users = snap.docs.map(function(d) { return Object.assign({}, d.data(), { id: d.id }); });
            return sortByTimestampDesc(users, 'criadoEm');
        } catch(e) { console.error(e); return []; }
    },

    setUserRole: async function(userId, newRole) {
        if (!this.isAdmin()) return { success: false, message: 'Permissão negada.' };
        try {
            await firebase.firestore().collection('usuarios').doc(userId).update({ role: newRole });
            return { success: true, message: 'Permissão atualizada!' };
        } catch(e) { return { success: false, message: 'Erro ao atualizar permissão.' }; }
    },

    toggleUserStatus: async function(userId, ativo) {
        if (!this.isAdmin()) return { success: false, message: 'Permissão negada.' };
        try {
            await firebase.firestore().collection('usuarios').doc(userId).update({ ativo: ativo });
            return { success: true, message: ativo ? 'Usuário ativado!' : 'Usuário desativado!' };
        } catch(e) { return { success: false, message: 'Erro ao atualizar status.' }; }
    },

    // ========================================
    // EVENTOS
    // ========================================

    submitEvent: async function(eventData) {
        if (!this.isLoggedIn()) return { success: false, message: 'Você precisa estar logado.' };
        try {
            const db = firebase.firestore();
            const payload = Object.assign({}, eventData || {});
            const eventId = String(payload.id || ('evt_' + Date.now())).trim();
            const eventSource = payload.source === 'establishment_manager'
                ? 'establishment_manager'
                : 'portal_usuario';
            const userName = currentUser.nome || currentUser.displayName || currentUser.email || 'Usuário';
            var linkedManager = null;

            if (eventSource === 'establishment_manager') {
                linkedManager = await this.getManagedEstablishmentForCurrentUser(
                    payload.linkedManagerId,
                    payload.linkedEstablishmentId
                );

                if (!linkedManager) {
                    return { success: false, message: 'Seu vínculo com este empreendimento não foi encontrado ou não está ativo.' };
                }
            }

            await db.collection('eventos_pendentes').doc(eventId).set(
                Object.assign({}, payload, {
                    id: eventId,
                    submittedBy: currentUser.uid,
                    submittedByName: userName,
                    submittedByEmail: currentUser.email || '',
                    ownerUid: currentUser.uid,
                    ownerEmail: currentUser.email || '',
                    ownerName: userName,
                    organizer: linkedManager ? (linkedManager.establishmentName || '') : payload.organizer,
                    source: eventSource,
                    linkedManagerId: linkedManager ? linkedManager.id : null,
                    linkedEstablishmentId: linkedManager ? linkedManager.establishmentId : null,
                    linkedEstablishmentName: linkedManager ? linkedManager.establishmentName : null,
                    linkedEstablishmentRole: linkedManager ? (linkedManager.role || '') : null,
                    status: 'pendente',
                    createdAt: payload.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: payload.updatedAt || firebase.firestore.FieldValue.serverTimestamp(),
                    submittedAt: payload.submittedAt || firebase.firestore.FieldValue.serverTimestamp(),
                    reviewedAt: null,
                    reviewedBy: null,
                    reviewNotes: ''
                })
            );
            return {
                success: true,
                message: linkedManager
                    ? 'Evento vinculado enviado para análise! A publicação depende de aprovação da equipe.'
                    : 'Evento enviado para análise! Você receberá uma notificação quando for aprovado.'
            };
        } catch(e) { console.error(e); return { success: false, message: 'Erro ao enviar evento.' }; }
    },

    getPendingEvents: async function() {
        if (!this.isModerator()) return [];
        var result = await this.getPendingEventsReport();
        return result.success ? result.items : [];
    },

    getPendingEventsReport: async function() {
        var diagnostics = {
            collection: 'eventos_pendentes',
            filter: 'isPendingStatus(status) em memória'
        };

        if (!this.isModerator()) {
            return {
                success: false,
                items: [],
                diagnostics: diagnostics,
                error: new Error('Permissão negada.')
            };
        }

        try {
            const snap = await firebase.firestore().collection('eventos_pendentes').get();
            const items = snap.docs
                .map(function(d) { return Object.assign({}, d.data(), { id: d.id }); })
                .filter(function(item) { return isPendingStatus(item && item.status); })
                .sort(function(a, b) {
                    return getSortableTimestampValue(b && (b.submittedAt || b.createdAt || b.updatedAt)) -
                        getSortableTimestampValue(a && (a.submittedAt || a.createdAt || a.updatedAt));
                });

            return {
                success: true,
                items: items,
                diagnostics: Object.assign({ totalDocs: snap.size, matchedDocs: items.length }, diagnostics)
            };
        } catch(error) {
            console.error('[firebase-auth] Erro ao carregar eventos pendentes para o admin.', {
                collection: diagnostics.collection,
                filter: diagnostics.filter,
                error: error,
                stack: error && error.stack ? error.stack : null
            });

            return {
                success: false,
                items: [],
                diagnostics: diagnostics,
                error: error
            };
        }
    },

    approveEvent: async function(eventId, notes) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };
        notes = notes || '';
        try {
            const publicationContracts = requirePublicationContracts();
            const publicEventId = publicationContracts.publicDocumentId(eventId);
            if (!publicEventId) return { success: false, message: 'ID de evento inválido.' };
            const db  = firebase.firestore();
            const ref = db.collection('eventos_pendentes').doc(publicEventId);
            const publicRef = db.collection('eventos_aprovados').doc(publicEventId);
            const doc = await ref.get();
            if (!doc.exists) return { success: false, message: 'Evento não encontrado.' };
            const existingPublicDoc = await publicRef.get();
            if (existingPublicDoc.exists) {
                return { success: false, message: 'Já existe um evento público com este ID; aprovação interrompida.' };
            }
            const publicSource = await preparePublicSubmissionMedia(doc.data(), 'event', publicEventId);
            const approvedAt = firebase.firestore.FieldValue.serverTimestamp();
            const batch = db.batch();
            batch.set(
                publicRef,
                publicationContracts.projectPublicEvent(publicSource, publicEventId)
            );
            batch.update(ref, {
                status: 'aprovado',
                reviewedAt: approvedAt,
                reviewedBy: currentUser.uid,
                reviewNotes: notes,
                updatedAt: approvedAt,
                updatedBy: currentUser.uid
            });
            await batch.commit();
            return { success: true, message: 'Evento aprovado com sucesso!' };
        } catch(e) {
            return {
                success: false,
                message: e && e.code === 'publication/invalid-field'
                    ? e.message
                    : (e && e.cmsMediaType ? getMediaApplicationErrorMessage(e) : 'Erro ao aprovar evento.')
            };
        }
    },

    rejectEvent: async function(eventId, reason) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };
        reason = reason || '';
        try {
            const rejectedEventId = requirePublicationContracts().publicDocumentId(eventId);
            if (!rejectedEventId) return { success: false, message: 'ID de evento inválido.' };
            await firebase.firestore().collection('eventos_pendentes').doc(rejectedEventId).update({
                status:      'rejeitado',
                reviewedAt:  firebase.firestore.FieldValue.serverTimestamp(),
                reviewedBy:  currentUser.uid,
                reviewNotes: reason
            });
            return { success: true, message: 'Evento rejeitado.' };
        } catch(e) { return { success: false, message: 'Erro ao rejeitar evento.' }; }
    },

    getUserEvents: async function() {
        if (!this.isLoggedIn()) return [];
        try {
            const db = firebase.firestore();
            const submissionSnap = await withTimeout(
                db.collection('eventos_pendentes').where('submittedBy', '==', currentUser.uid).get(),
                PROFILE_LOAD_TIMEOUT_MS,
                'firestore/events-timeout'
            );
            return submissionSnap.docs.map(function(d) { return Object.assign({}, d.data(), { id: d.id }); });
        } catch(e) { console.error(e); return []; }
    },

    // ========================================
    // ESTABELECIMENTOS
    // ========================================

    submitEstablishment: async function(estData) {
        if (!this.isLoggedIn()) return { success: false, message: 'Você precisa estar logado.' };
        try {
            const db = firebase.firestore();
            const payload = Object.assign({}, estData || {});
            const requestedId = requirePublicationContracts().publicDocumentId(String(payload.id || '').trim());
            const estId = requestedId || ('est_' + Date.now());
            await db.collection('estabelecimentos_pendentes').doc(estId).set(
                Object.assign({}, payload, {
                    id: estId,
                    submittedBy:      currentUser.uid,
                    submittedByName:  currentUser.nome,
                    submittedByEmail: currentUser.email,
                    status:           'pendente',
                    submittedAt:      firebase.firestore.FieldValue.serverTimestamp()
                })
            );
            return { success: true, message: 'Estabelecimento enviado para análise!' };
        } catch(e) { console.error(e); return { success: false, message: 'Erro ao enviar estabelecimento.' }; }
    },

    getUserEstablishments: async function() {
        if (!this.isLoggedIn()) return [];
        try {
            const snap = await withTimeout(
                firebase.firestore().collection('estabelecimentos_pendentes')
                    .where('submittedBy', '==', currentUser.uid)
                    .get(),
                PROFILE_LOAD_TIMEOUT_MS,
                'firestore/establishments-timeout'
            );
            return sortByTimestampDesc(snap.docs.map(function(doc) {
                return Object.assign({}, doc.data(), { id: doc.id });
            }));
        } catch(error) {
            console.error('[firebase-auth] Erro ao carregar estabelecimentos do usuário.', error);
            return [];
        }
    },

    getPendingEstablishments: async function() {
        if (!this.isModerator()) return [];
        var result = await this.getPendingEstablishmentsReport();
        return result.success ? result.items : [];
    },

    getPendingEstablishmentsReport: async function() {
        var diagnostics = { collection: 'estabelecimentos_pendentes', filter: 'status == pendente' };
        if (!this.isModerator()) {
            return { success: false, items: [], diagnostics: diagnostics, error: new Error('Permissão negada.') };
        }
        try {
            const snap = await firebase.firestore().collection('estabelecimentos_pendentes')
                .where('status', '==', 'pendente').get();
            const items = snap.docs.map(function(d) { return Object.assign({}, d.data(), { id: d.id }); });
            return { success: true, items: items, diagnostics: Object.assign({ matchedDocs: items.length }, diagnostics) };
        } catch(e) {
            console.error('[firebase-auth] Erro ao carregar estabelecimentos pendentes.', {
                collection: diagnostics.collection,
                filter: diagnostics.filter,
                error: e,
                stack: e && e.stack ? e.stack : null
            });
            return { success: false, items: [], diagnostics: diagnostics, error: e };
        }
    },

    approveEstablishment: async function(estId, notes) {
        if (!this.isAdmin()) {
            return {
                success: false,
                code: 'ADMIN_REQUIRED_FOR_CMS_DRAFT',
                message: 'Somente administradores podem aprovar e criar o rascunho no catálogo editorial.'
            };
        }
        notes = notes || '';
        try {
            const publicationContracts = requirePublicationContracts();
            const bridge = requireEstablishmentSubmissionBridge();
            const submissionId = publicationContracts.publicDocumentId(estId);
            if (!submissionId) return { success: false, message: 'ID de estabelecimento inválido.' };
            const db  = firebase.firestore();
            const ref = db.collection('estabelecimentos_pendentes').doc(submissionId);
            const doc = await ref.get();
            if (!doc.exists) return { success: false, message: 'Estabelecimento não encontrado.' };
            const submission = Object.assign({}, doc.data() || {}, { id: submissionId });
            bridge.validateSubmissionForImport(submission, {
                safeExternalUrl: publicationContracts.url.externalHttps
            });
            const expectedSubmissionFingerprint = bridge.approvalFingerprint(submission);
            const publicSourceId = await establishmentSubmissionProvenanceId(submissionId);
            const cmsId = bridge.makeCanonicalSlug(submission.name || submission.nome);
            const cmsRef = db.collection('cms_establishments').doc(cmsId);
            const linkedCmsId = String(submission.cmsEstablishmentId || '').trim();
            const linkedCms = linkedCmsId === cmsId ? await cmsRef.get() : null;

            if (linkedCms && linkedCms.exists && linkedCms.data().status !== 'draft') {
                return existingCmsApprovalResult({ id: cmsId, status: linkedCms.data().status, data: linkedCms.data() });
            }

            if (!(linkedCms && linkedCms.exists)) {
                const snapshots = await Promise.all([
                    db.collection('cms_establishments').get(),
                    db.collection('estabelecimentos_pendentes').get(),
                    db.collection('estabelecimentos_aprovados').get()
                ]);
                const duplicate = bridge.classifyDuplicate(submission, {
                    cms: snapshotItems(snapshots[0]),
                    pending: snapshotItems(snapshots[1]).filter(function(candidate) {
                        return String(candidate.data && candidate.data.status || '').trim().toLowerCase() === 'pendente';
                    }),
                    legacyApproved: snapshotItems(snapshots[2]),
                    excludeSubmissionId: submissionId
                });
                if (duplicate.kind === 'EXACT_CMS_MATCH' || duplicate.kind === 'SEMANTIC_CMS_MATCH') {
                    return existingCmsApprovalResult(duplicate.candidates[0]);
                }
                if (duplicate.kind === 'PENDING_DUPLICATE') {
                    if (!bridge.isPreferredPendingSubmission(submission, duplicate.candidates)) {
                        return {
                            success: false,
                            code: 'PENDING_DUPLICATE',
                            message: 'Há uma submissão equivalente mais antiga em análise. Aprove primeiro o cadastro canônico; nenhum rascunho foi criado.',
                            candidates: duplicate.candidates
                        };
                    }
                }
                if (duplicate.kind === 'LEGACY_APPROVED_DUPLICATE') {
                    return {
                        success: false,
                        code: 'LEGACY_APPROVED_DUPLICATE',
                        message: 'Há um registro equivalente no histórico de aprovações. Revise o legado antes de importar; nenhum rascunho foi criado.',
                        candidates: duplicate.candidates
                    };
                }
                if (duplicate.kind === 'AMBIGUOUS_MATCH') {
                    return {
                        success: false,
                        code: 'POSSIBLE_DUPLICATE_REQUIRES_REVIEW',
                        message: 'Possível duplicidade encontrada. Compare os candidatos antes de aprovar; nenhum rascunho foi criado.',
                        candidates: duplicate.candidates
                    };
                }
            }

            const adminEstablishments = window.AdminEstablishmentsModule;
            if (!adminEstablishments || typeof adminEstablishments.importSubmissionDraft !== 'function') {
                return { success: false, message: 'Módulo canônico de Empreendimentos indisponível.' };
            }
            if (typeof adminEstablishments.reserveSubmissionImport !== 'function') {
                return { success: false, message: 'Reserva transacional de identidade indisponível.' };
            }

            const reservation = await adminEstablishments.reserveSubmissionImport({
                db: db,
                uid: currentUser.uid,
                pendingRef: ref,
                submissionId: submissionId,
                publicSourceId: publicSourceId,
                cmsId: cmsId,
                submission: submission,
                expectedSubmissionFingerprint: expectedSubmissionFingerprint
            });
            if (reservation.idempotentFinal === true) {
                return {
                    success: true,
                    code: 'CMS_DRAFT_ALREADY_EXISTS',
                    cmsEstablishmentId: cmsId,
                    status: 'draft',
                    message: 'Cadastro já aprovado: o rascunho CMS existente foi confirmado. Revise em Empreendimentos antes de publicar no portal.'
                };
            }
            const preparedSubmission = await preparePublicSubmissionMedia(submission, 'establishment', cmsId, submissionId);
            await ref.update({
                cmsImportState: 'media_prepared',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.uid
            });
            const importResult = await adminEstablishments.importSubmissionDraft({
                db: db,
                uid: currentUser.uid,
                pendingRef: ref,
                submissionId: submissionId,
                publicSourceId: publicSourceId,
                cmsId: cmsId,
                submission: preparedSubmission,
                expectedSubmissionFingerprint: expectedSubmissionFingerprint,
                shellCreated: reservation.shellCreated === true,
                reviewNotes: notes
            });
            return Object.assign({}, importResult, {
                message: importResult.code === 'CMS_DRAFT_ALREADY_EXISTS'
                    ? 'Cadastro já aprovado: o rascunho CMS existente foi confirmado. Revise em Empreendimentos antes de publicar no portal.'
                    : 'Cadastro aprovado e enviado ao catálogo editorial como rascunho. Revise em Empreendimentos antes de publicar no portal.'
            });
        } catch(e) {
            console.error('[firebase-auth] Falha no pipeline de aprovação de estabelecimento.', {
                code: e && e.code || '',
                message: sanitizeLogMessage(e && e.message || ''),
                diagnosis: e && e.cmsMediaDiagnosis || ''
            });
            if (e && e.code === 'establishment-import-duplicate-lock') {
                return {
                    success: false,
                    code: 'PENDING_DUPLICATE',
                    message: 'Outra aprovação já reservou este empreendimento. Nenhum segundo rascunho ou conjunto de mídias foi criado.'
                };
            }
            return {
                success: false,
                code: e && e.code || 'ESTABLISHMENT_APPROVAL_FAILED',
                message: e && (e.code === 'publication/invalid-field' || e.code === 'establishment-bridge/private-media' || e.code === 'establishment-bridge/unknown-category' || e.code === 'establishment-bridge/invalid-content')
                    ? e.message
                    : (e && e.cmsMediaType ? getMediaApplicationErrorMessage(e) : 'Não foi possível concluir a aprovação. Nenhuma publicação automática foi feita; tente novamente para retomar o rascunho.')
            };
        }
    },

    rejectEstablishment: async function(estId, reason) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };
        reason = reason || '';
        try {
            const rejectedEstablishmentId = requirePublicationContracts().publicDocumentId(estId);
            if (!rejectedEstablishmentId) return { success: false, message: 'ID de estabelecimento inválido.' };
            const db = firebase.firestore();
            const ref = db.collection('estabelecimentos_pendentes').doc(rejectedEstablishmentId);
            await db.runTransaction(function(transaction) {
                return transaction.get(ref).then(function(snapshot) {
                    if (!snapshot.exists) throw new Error('Estabelecimento não encontrado.');
                    var pending = snapshot.data() || {};
                    if (pending.status !== 'pendente') {
                        throw new Error('A submissão não está mais pendente.');
                    }
                    if (pending.cmsImportState) {
                        throw new Error('A aprovação editorial já foi iniciada; revise o draft antes de rejeitar.');
                    }
                    transaction.update(ref, {
                        status: 'rejeitado',
                        reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        reviewedBy: currentUser.uid,
                        reviewNotes: reason
                    });
                });
            });
            return { success: true, message: 'Estabelecimento rejeitado.' };
        } catch(e) { return { success: false, message: e && e.message ? e.message : 'Erro ao rejeitar estabelecimento.' }; }
    },

    // ========================================
    // VINCULOS COM EMPREENDIMENTOS EXISTENTES
    // ========================================

    createEstablishmentClaim: async function(claimData) {
        if (!this.isLoggedIn()) return { success: false, message: 'Você precisa estar logado.' };

        var establishmentId = String(claimData && claimData.establishmentId || '').trim();
        var establishmentName = String(claimData && claimData.establishmentName || '').trim();
        var requestedRole = String(claimData && claimData.requestedRole || '').trim();
        var message = String(claimData && claimData.message || '').trim();

        if (!establishmentId || !establishmentName || !requestedRole) {
            return { success: false, message: 'Preencha empreendimento e tipo de vínculo.' };
        }

        try {
            var authUser = getFirebaseAuth().currentUser;
            if (!authUser || !authUser.uid) {
                var sessionError = new Error('Usuário autenticado indisponível para criar a solicitação.');
                sessionError.code = 'auth/session-not-ready';
                throw sessionError;
            }

            var db = firebase.firestore();
            var userId = authUser.uid;
            var userEmail = String(authUser.email || '').trim();
            var normalizedTarget = normalizeComparableId(establishmentId);
            var flowStage = 'validate_auth';

            if (!userEmail) {
                var emailError = new Error('E-mail autenticado indisponível para criar a solicitação.');
                emailError.code = 'auth/session-not-ready';
                throw emailError;
            }

            flowStage = 'query_managers';
            // As rules exigem resource.data.active == true para leitura do proprio
            // vinculo; sem este filtro a query inteira retorna permission-denied.
            var managersSnap = await db.collection('establishment_managers')
                .where('userId', '==', userId)
                .where('active', '==', true)
                .get();

            var alreadyManager = managersSnap.docs
                .map(function(doc) { return doc.data(); })
                .some(function(item) {
                    return item.active !== false &&
                        normalizeComparableId(item.establishmentId) === normalizedTarget;
                });

            if (alreadyManager) {
                return { success: false, message: 'Você já possui vínculo ativo com este empreendimento.' };
            }

            flowStage = 'query_claims';
            var claimsSnap = await db.collection('establishment_claims')
                .where('userId', '==', userId)
                .get();

            var relatedClaims = claimsSnap.docs.map(function(doc) {
                return Object.assign({}, doc.data(), { id: doc.id });
            }).filter(function(item) {
                return normalizeComparableId(item.establishmentId) === normalizedTarget;
            });

            if (relatedClaims.some(function(item) { return item.status === 'pending'; })) {
                return { success: false, message: 'Já existe uma solicitação pendente para este empreendimento.' };
            }

            if (relatedClaims.some(function(item) { return item.status === 'approved'; })) {
                return { success: false, message: 'Este vínculo já foi aprovado anteriormente.' };
            }

            var claimId = 'claim_' + Date.now();
            var now = firebase.firestore.FieldValue.serverTimestamp();

            flowStage = 'write_claim';
            await db.collection('establishment_claims').doc(claimId).set({
                id: claimId,
                userId: userId,
                userEmail: userEmail,
                userName: sanitizeSimpleText(currentUser.nome || authUser.displayName || userEmail || 'Usuário', 160),
                contactPhone: String(claimData && claimData.contactPhone || '').trim(),
                establishmentId: establishmentId,
                establishmentName: establishmentName,
                establishmentCategory: String(claimData && claimData.establishmentCategory || '').trim(),
                establishmentSource: String(claimData && claimData.establishmentSource || '').trim(),
                establishmentOriginalId: String(claimData && claimData.establishmentOriginalId || '').trim(),
                requestedRole: requestedRole,
                status: 'pending',
                message: message,
                createdAt: now,
                updatedAt: now,
                reviewedAt: null,
                reviewedBy: null,
                reviewNotes: '',
                rejectionReason: '',
                source: 'portal_usuario'
            });

            return { success: true, message: 'Solicitação de vínculo enviada para análise.' };
        } catch(error) {
            console.error('[establishment-claim] Falha ao enviar solicitação.', {
                stage: typeof flowStage === 'string' ? flowStage : 'unknown',
                establishmentId: establishmentId,
                establishmentName: establishmentName,
                userId: currentUser && currentUser.uid ? currentUser.uid : null,
                errorCode: error && error.code ? error.code : '',
                errorMessage: error && error.message ? error.message : '',
                stack: error && error.stack ? error.stack : ''
            });
            return { success: false, message: establishmentClaimErrorMessage(error) };
        }
    },

    getUserEstablishmentClaims: async function() {
        if (!this.isLoggedIn()) return [];
        try {
            var snap = await firebase.firestore().collection('establishment_claims')
                .where('userId', '==', currentUser.uid)
                .get();

            return sortByTimestampDesc(snap.docs.map(function(doc) {
                return Object.assign({}, doc.data(), { id: doc.id });
            }), 'createdAt');
        } catch(error) {
            console.error(error);
            return [];
        }
    },

    getUserManagedEstablishments: async function() {
        if (!this.isLoggedIn()) return [];
        try {
            // As rules so permitem ao usuario ler o proprio vinculo quando
            // active == true; a query precisa refletir isso ou o Firestore
            // rejeita tudo com permission-denied (rules nao sao filtros).
            var snap = await firebase.firestore().collection('establishment_managers')
                .where('userId', '==', currentUser.uid)
                .where('active', '==', true)
                .get();

            return snap.docs.map(function(doc) {
                return Object.assign({}, doc.data(), { id: doc.id });
            }).filter(function(item) {
                return item.active !== false;
            }).sort(function(a, b) {
                return String(a.establishmentName || '').localeCompare(String(b.establishmentName || ''), 'pt-BR');
            });
        } catch(error) {
            console.error(error);
            return [];
        }
    },

    getManagedEstablishmentForCurrentUser: async function(managerId, establishmentId) {
        if (!this.isLoggedIn()) return null;

        var normalizedManagerId = String(managerId || '').trim();
        var normalizedEstablishmentId = String(establishmentId || '').trim();

        try {
            if (normalizedManagerId) {
                var managerDoc = await firebase.firestore().collection('establishment_managers')
                    .doc(normalizedManagerId)
                    .get();

                if (!managerDoc.exists) return null;

                var manager = Object.assign({}, managerDoc.data(), { id: managerDoc.id });
                return isActiveManagerRecord(manager, currentUser.uid, normalizedEstablishmentId) ? manager : null;
            }

            if (!normalizedEstablishmentId) return null;

            var managers = await this.getUserManagedEstablishments();
            return managers.find(function(item) {
                return isActiveManagerRecord(item, currentUser.uid, normalizedEstablishmentId);
            }) || null;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    createEstablishmentUpdateRequest: async function(requestData) {
        if (!this.isLoggedIn()) return { success: false, message: 'Você precisa estar logado.' };

        var managerId = sanitizeSimpleText(requestData && requestData.managerId, 160);
        var establishmentId = sanitizeSimpleText(requestData && requestData.establishmentId, 160);
        var currentSnapshot = buildSafeCurrentSnapshot(requestData && requestData.currentSnapshot);
        var requestedChanges = buildSafeRequestedChanges(requestData && requestData.requestedChanges);
        var images = buildSafeImageMetadata(requestData && requestData.images);
        var requestedChangeKeys = Object.keys(requestedChanges);
        var mainImage = sanitizeSimpleText(requestData && requestData.mainImage, 2048);
        var linkedManager = null;

        if (!establishmentId) {
            return { success: false, message: 'Empreendimento inválido para a solicitação.' };
        }

        if (!requestedChangeKeys.length && !images.length) {
            return { success: false, message: 'Preencha ao menos um campo alterado ou anexe imagens.' };
        }

        if (images.length > 0) {
            mainImage = images.some(function(item) { return item.url === mainImage; })
                ? mainImage
                : images[0].url;
        } else {
            mainImage = '';
        }

        try {
            var db = firebase.firestore();
            linkedManager = await this.getManagedEstablishmentForCurrentUser(managerId, establishmentId);

            if (!linkedManager) {
                return { success: false, message: 'Seu vínculo ativo com este empreendimento não foi encontrado.' };
            }

            var existingRequests = await db.collection('establishment_update_requests')
                .where('ownerUid', '==', currentUser.uid)
                .get();

            var hasPendingRequest = existingRequests.docs.some(function(doc) {
                var item = doc.data() || {};
                return normalizeComparableId(item.establishmentId) === normalizeComparableId(linkedManager.establishmentId) &&
                    normalizeUpdateRequestStatus(item.status) === 'pending';
            });

            if (hasPendingRequest) {
                return { success: false, message: 'Já existe uma solicitação pendente para este empreendimento.' };
            }

            var requestId = sanitizeSimpleText(requestData && requestData.id, 160) || ('upd_' + Date.now());
            var now = firebase.firestore.FieldValue.serverTimestamp();
            var establishmentName = sanitizeSimpleText(
                requestData && requestData.establishmentName || linkedManager.establishmentName,
                160
            ) || linkedManager.establishmentName;

            await db.collection('establishment_update_requests').doc(requestId).set({
                id: requestId,
                managerId: linkedManager.id,
                ownerUid: currentUser.uid,
                ownerEmail: sanitizeSimpleText(currentUser.email, 160),
                ownerName: sanitizeSimpleText(currentUser.nome || currentUser.displayName || currentUser.email || 'Usuário', 160),
                establishmentId: sanitizeSimpleText(linkedManager.establishmentId, 160),
                establishmentName: establishmentName,
                establishmentCategory: sanitizeSimpleText(requestData && requestData.establishmentCategory || currentSnapshot.category, 120),
                establishmentSource: sanitizeSimpleText(requestData && requestData.establishmentSource || currentSnapshot.source, 60),
                currentSnapshot: currentSnapshot,
                requestedChanges: requestedChanges,
                images: images,
                mainImage: mainImage,
                imageCount: images.length,
                status: 'pending',
                source: 'establishment_manager',
                createdAt: now,
                updatedAt: now,
                submittedAt: now,
                reviewedAt: null,
                reviewedBy: null,
                reviewNotes: '',
                rejectionReason: '',
                changesRequestedNotes: ''
            });

            return {
                success: true,
                message: 'Solicitação enviada para análise. Nada será publicado automaticamente no site público.'
            };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao enviar solicitação de alteração.' };
        }
    },

    listMyEstablishmentUpdateRequests: async function() {
        if (!this.isLoggedIn()) return [];
        try {
            var snap = await firebase.firestore().collection('establishment_update_requests')
                .where('ownerUid', '==', currentUser.uid)
                .get();

            return sortByTimestampDesc(snap.docs.map(function(doc) {
                return Object.assign({}, doc.data(), { id: doc.id });
            }), 'createdAt');
        } catch(error) {
            console.error(error);
            return [];
        }
    },

    listAllEstablishmentUpdateRequests: async function(statusFilter) {
        if (!this.isModerator()) return [];
        try {
            var snap = await firebase.firestore().collection('establishment_update_requests').get();
            var statusList = ensureArray(statusFilter).map(normalizeUpdateRequestStatus);

            return sortByTimestampDesc(snap.docs.map(function(doc) {
                return Object.assign({}, doc.data(), { id: doc.id });
            }).filter(function(item) {
                if (!statusList.length) return true;
                return statusList.indexOf(normalizeUpdateRequestStatus(item.status)) !== -1;
            }), 'createdAt');
        } catch(error) {
            console.error(error);
            return [];
        }
    },

    reviewEstablishmentUpdateRequest: async function(requestId, reviewData) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };

        var normalizedRequestId = sanitizeSimpleText(requestId, 160);
        var targetStatus = normalizeUpdateRequestStatus(reviewData && reviewData.status);
        var reviewNotes = sanitizeLongText(reviewData && reviewData.reviewNotes, 1500);
        var rejectionReason = sanitizeLongText(reviewData && reviewData.rejectionReason, 500);
        var changesRequestedNotes = sanitizeLongText(reviewData && reviewData.changesRequestedNotes, 1500);

        if (!normalizedRequestId) {
            return { success: false, message: 'Solicitação inválida.' };
        }

        if (['approved', 'rejected', 'changes_requested'].indexOf(targetStatus) === -1) {
            return { success: false, message: 'Status de revisão inválido.' };
        }

        if (targetStatus === 'rejected' && !rejectionReason) {
            return { success: false, message: 'Informe o motivo da rejeição.' };
        }

        if (targetStatus === 'changes_requested' && !changesRequestedNotes) {
            return { success: false, message: 'Informe quais ajustes precisam ser feitos.' };
        }

        try {
            var db = firebase.firestore();
            var requestRef = db.collection('establishment_update_requests').doc(normalizedRequestId);
            var requestSnap = await requestRef.get();

            if (!requestSnap.exists) {
                return { success: false, message: 'Solicitação não encontrada.' };
            }

            var request = requestSnap.data() || {};
            var currentStatus = normalizeUpdateRequestStatus(request.status);

            if (currentStatus === 'approved' || currentStatus === 'rejected') {
                return { success: false, message: 'Esta solicitação já foi concluída.' };
            }

            await requestRef.update({
                status: targetStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reviewedBy: currentUser.uid,
                reviewNotes: targetStatus === 'approved' ? reviewNotes : reviewNotes,
                rejectionReason: targetStatus === 'rejected' ? rejectionReason : '',
                changesRequestedNotes: targetStatus === 'changes_requested' ? changesRequestedNotes : ''
            });

            if (targetStatus === 'approved') {
                return {
                    success: true,
                    message: 'Solicitação aprovada pela equipe e aguardando publicação/atualização controlada no site público.'
                };
            }

            if (targetStatus === 'changes_requested') {
                return { success: true, message: 'Solicitação marcada como ajustes necessários.' };
            }

            return { success: true, message: 'Solicitação rejeitada.' };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao revisar solicitação de alteração.' };
        }
    },

    reviewEstablishmentUpdateMedia: async function(requestId, reviewData) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };

        var normalizedRequestId = sanitizeSimpleText(requestId, 160);

        if (!normalizedRequestId) {
            return { success: false, message: 'Solicitação inválida.' };
        }

        try {
            var db = firebase.firestore();
            var requestRef = db.collection('establishment_update_requests').doc(normalizedRequestId);
            var reviewMap = buildSafeMediaReviewMap(reviewData && reviewData.images);
            var now = firebase.firestore.FieldValue.serverTimestamp();
            var decidedAt = new Date().toISOString();
            await db.runTransaction(function(transaction) {
                return transaction.get(requestRef).then(function(requestSnap) {
                    if (!requestSnap.exists) {
                        var missing = new Error('Solicitação não encontrada.');
                        missing.code = 'establishment-update/not-found';
                        throw missing;
                    }
                    var request = requestSnap.data() || {};
                    if (sanitizeSimpleText(request.mediaApplyState, 40) === 'applying') {
                        var applying = new Error('A aplicação de mídia está em andamento. Aguarde a conclusão ou faça retry antes de alterar a revisão.');
                        applying.code = 'establishment-update/media-applying';
                        throw applying;
                    }
                    var images = buildSafeImageMetadata(request.images);
                    if (!images.length) {
                        var empty = new Error('Esta solicitação não possui imagens anexadas.');
                        empty.code = 'establishment-update/no-images';
                        throw empty;
                    }
                    var reviewedImages = images.map(function(image) {
                        var key = buildMediaReviewKey(image);
                        var review = reviewMap[key] || {};
                        return {
                            path: image.path,
                            url: image.url,
                            status: normalizeMediaReviewStatus(review.status),
                            note: sanitizeLongText(review.note, 240),
                            decidedAt: decidedAt,
                            decidedBy: currentUser.uid
                        };
                    });
                    transaction.update(requestRef, {
                        mediaReview: {
                            reviewedAt: now,
                            reviewedBy: currentUser.uid,
                            images: reviewedImages
                        },
                        mediaApplyState: 'reviewed',
                        mediaApplyFingerprint: '',
                        updatedAt: now
                    });
                });
            });

            return {
                success: true,
                message: 'Revisão editorial das imagens salva. Nenhuma mídia foi aplicada ao catálogo.'
            };
        } catch(error) {
            console.error(error);
            if (error && error.code === 'establishment-update/media-applying') {
                return { success: false, message: error.message };
            }
            if (error && error.code === 'establishment-update/no-images') {
                return { success: false, message: error.message };
            }
            if (error && error.code === 'establishment-update/not-found') {
                return { success: false, message: error.message };
            }
            return { success: false, message: 'Erro ao salvar revisão editorial das imagens.' };
        }
    },

    applyAcceptedEstablishmentUpdateMedia: async function(requestId) {
        if (!this.isAdmin()) return { success: false, message: 'Permissão negada.' };

        var normalizedRequestId = sanitizeSimpleText(requestId, 160);

        if (!normalizedRequestId) {
            return { success: false, message: 'Solicitação inválida.' };
        }

        try {
            var db = firebase.firestore();
            var storage = firebase.storage();
            var requestRef = db.collection('establishment_update_requests').doc(normalizedRequestId);
            var reservation = await db.runTransaction(function(transaction) {
                return transaction.get(requestRef).then(function(requestSnap) {
                    if (!requestSnap.exists) {
                        var missing = new Error('Solicitação não encontrada.');
                        missing.code = 'establishment-update/not-found';
                        throw missing;
                    }
                    var currentRequest = requestSnap.data() || {};
                    if (normalizeUpdateRequestStatus(currentRequest.status) !== 'approved') {
                        var statusError = new Error('Apenas solicitações aprovadas podem aplicar mídia ao catálogo.');
                        statusError.code = 'establishment-update/not-approved';
                        throw statusError;
                    }
                    var fingerprint = establishmentUpdateMediaFingerprint(currentRequest);
                    var applyState = sanitizeSimpleText(currentRequest.mediaApplyState, 40);
                    var reservedFingerprint = readOpaqueFingerprint(currentRequest.mediaApplyFingerprint);
                    if (applyState === 'applying' && reservedFingerprint && reservedFingerprint !== fingerprint) {
                        var stale = new Error('A revisão de mídia mudou durante uma tentativa anterior. Revise a solicitação antes de tentar novamente.');
                        stale.code = 'establishment-update/media-review-changed';
                        throw stale;
                    }
                    transaction.update(requestRef, {
                        mediaApplyState: 'applying',
                        mediaApplyFingerprint: fingerprint,
                        mediaApplyBaseRevision: applyState === 'applying' && Number.isInteger(currentRequest.mediaApplyBaseRevision)
                            ? currentRequest.mediaApplyBaseRevision
                            : null,
                        mediaApplyBaseStatus: applyState === 'applying'
                            ? sanitizeSimpleText(currentRequest.mediaApplyBaseStatus, 40)
                            : '',
                        mediaApplyBaseFingerprint: applyState === 'applying'
                            ? readOpaqueFingerprint(currentRequest.mediaApplyBaseFingerprint)
                            : '',
                        mediaApplyProgress: applyState === 'applying' && currentRequest.mediaApplyProgress &&
                            typeof currentRequest.mediaApplyProgress === 'object'
                            ? currentRequest.mediaApplyProgress
                            : {},
                        mediaApplyStartedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        mediaApplyStartedBy: currentUser.uid,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    return {
                        request: currentRequest,
                        fingerprint: fingerprint,
                        baseRevision: applyState === 'applying' && Number.isInteger(currentRequest.mediaApplyBaseRevision)
                            ? currentRequest.mediaApplyBaseRevision
                            : null,
                        baseStatus: applyState === 'applying'
                            ? sanitizeSimpleText(currentRequest.mediaApplyBaseStatus, 40)
                            : '',
                        baseFingerprint: applyState === 'applying'
                            ? readOpaqueFingerprint(currentRequest.mediaApplyBaseFingerprint)
                            : '',
                        progress: applyState === 'applying' && currentRequest.mediaApplyProgress &&
                            typeof currentRequest.mediaApplyProgress === 'object'
                            ? currentRequest.mediaApplyProgress
                            : {}
                    };
                });
            });
            var request = reservation.request;
            var mediaApplyFingerprint = reservation.fingerprint;

            var establishmentId = sanitizeSimpleText(request.establishmentId, 160);
            if (!establishmentId) {
                return { success: false, message: 'Solicitação sem establishmentId. Aplicação de mídia abortada.' };
            }
            var ownerUid = sanitizeSimpleText(request.ownerUid, 160);
            if (!ownerUid) {
                return { success: false, message: 'Solicitação sem ownerUid verificável. Aplicação de mídia abortada.' };
            }

            var establishmentRef = db.collection('cms_establishments').doc(establishmentId);
            var establishmentSnap = await establishmentRef.get();

            if (!establishmentSnap.exists) {
                return { success: false, message: 'Empreendimento não encontrado em cms_establishments: ' + establishmentId };
            }

            var establishment = establishmentSnap.data() || {};
            var mediaApplyBaseRevision = reservation.baseRevision;
            var mediaApplyBaseStatus = reservation.baseStatus;
            var mediaApplyBaseFingerprint = reservation.baseFingerprint;
            var mediaApplyProgress = reservation.progress || {};
            if (!Number.isInteger(mediaApplyBaseRevision) || !mediaApplyBaseStatus || !mediaApplyBaseFingerprint) {
                var mediaBase = await db.runTransaction(function(transaction) {
                    return Promise.all([transaction.get(requestRef), transaction.get(establishmentRef)]).then(function(snapshots) {
                        var lockedRequest = snapshots[0].exists ? (snapshots[0].data() || {}) : {};
                        var currentCms = snapshots[1].exists ? (snapshots[1].data() || {}) : {};
                        if (!snapshots[0].exists || !snapshots[1].exists ||
                            sanitizeSimpleText(lockedRequest.mediaApplyState, 40) !== 'applying' ||
                            readOpaqueFingerprint(lockedRequest.mediaApplyFingerprint) !== mediaApplyFingerprint) {
                            throw establishmentUpdateConflict('A reserva privada de mídia mudou antes da aplicação.');
                        }
                        var baseRevision = Number.isInteger(currentCms.revision) ? currentCms.revision : 0;
                        var baseStatus = sanitizeSimpleText(currentCms.status, 40);
                        var baseFingerprint = cmsMediaStateFingerprint(currentCms);
                        transaction.update(requestRef, {
                            mediaApplyBaseRevision: baseRevision,
                            mediaApplyBaseStatus: baseStatus,
                            mediaApplyBaseFingerprint: baseFingerprint
                        });
                        return { revision: baseRevision, status: baseStatus, fingerprint: baseFingerprint };
                    });
                });
                mediaApplyBaseRevision = mediaBase.revision;
                mediaApplyBaseStatus = mediaBase.status;
                mediaApplyBaseFingerprint = mediaBase.fingerprint;
                establishmentSnap = await establishmentRef.get();
                if (!establishmentSnap.exists) {
                    throw establishmentUpdateConflict('O empreendimento foi removido durante a reserva de mídia.');
                }
                establishment = establishmentSnap.data() || {};
            }
            var media = establishment.media || {};
            var mainImage = media.mainImage || {};
            var gallery = ensureArray(media.gallery);
            var appliedMedia = buildSafeAppliedMedia(request.appliedMedia);
            var catalogImages = [mainImage].concat(gallery);
            var reviewMap = buildSafeMediaReviewMap(request.mediaReview && request.mediaReview.images);
            var reviewedAcceptedSelections = buildSafeImageMetadata(request.images).map(function(image, index) {
                return { image: image, index: index };
            }).filter(function(selection) {
                var image = selection.image;
                var review = reviewMap[buildMediaReviewKey(image)] || {};
                return normalizeMediaReviewStatus(review.status) === 'accepted';
            });

            if (!reviewedAcceptedSelections.length) {
                await requestRef.update({
                    mediaApplyState: 'reviewed',
                    mediaApplyFingerprint: '',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return { success: false, message: 'Não há imagens aceitas para aplicar.' };
            }

            var reviewedAcceptedEntries = await Promise.all(reviewedAcceptedSelections.map(async function(selection) {
                var image = selection.image;
                var plan = await buildApprovedMediaCopyPlan(
                    image,
                    'establishment-update',
                    establishmentId,
                    ownerUid,
                    selection.index,
                    normalizedRequestId
                );
                return { image: image, index: selection.index, destinationPath: plan.destinationPath };
            }));
            var acceptedEntries = reviewedAcceptedEntries.filter(function(entry) {
                return !isImageAlreadyApplied(entry.image, appliedMedia, catalogImages, entry.destinationPath);
            });
            var acceptedImages = acceptedEntries.map(function(entry) { return entry.image; });
            var currentMediaFingerprint = cmsMediaStateFingerprint(establishment);
            var currentRevision = Number.isInteger(establishment.revision) ? establishment.revision : 0;
            var currentStatus = sanitizeSimpleText(establishment.status, 40);
            var stableBaseStatus = currentStatus === mediaApplyBaseStatus && !establishment.editSession;
            var resumablePublishedLifecycle = isResumablePublishedLifecycle(establishment, mediaApplyBaseStatus);
            var mediaExpectedRevision = currentRevision;

            if (acceptedImages.length && currentRevision !== mediaApplyBaseRevision) {
                if (currentRevision < mediaApplyBaseRevision ||
                    workflowProgressHas(mediaApplyProgress, 'media') ||
                    currentMediaFingerprint !== mediaApplyBaseFingerprint ||
                    (!stableBaseStatus && !(resumablePublishedLifecycle && workflowProgressHas(mediaApplyProgress, 'lifecycleDraft')))) {
                    throw establishmentUpdateConflict('O empreendimento mudou durante a aplicação de mídia. Nenhuma edição manual foi sobrescrita.');
                }
            }

            if (!acceptedImages.length) {
                if (!workflowProgressHas(mediaApplyProgress, 'media') ||
                    (!stableBaseStatus && !(resumablePublishedLifecycle && workflowProgressHas(mediaApplyProgress, 'lifecycleDraft')))) {
                    throw establishmentUpdateConflict('A aplicação de mídia não concluiu o ciclo editorial; revise o empreendimento manualmente.');
                }
                var reconciledMedia = reviewedAcceptedEntries.map(function(entry) {
                    var sourceImage = entry.image;
                    var sourcePath = sanitizeSimpleText(sourceImage && sourceImage.path, 512);
                    var sourceUrl = sanitizeSimpleText(sourceImage && sourceImage.url, 2048);
                    var catalogImage = catalogImages.find(function(image) {
                        return image && (sanitizeSimpleText(image.path, 512) === entry.destinationPath ||
                            (sourcePath && image.sourceImagePath === sourcePath) ||
                            (sourceUrl && image.sourceImageUrl === sourceUrl));
                    });
                    if (!catalogImage) return null;
                    return {
                        sourceRequestId: normalizedRequestId,
                        sourceImagePath: sourcePath,
                        sourceImageUrl: sourceUrl,
                        destination: mainImage && catalogImage.path === mainImage.path ? 'mainImage' : 'gallery',
                        url: sanitizeSimpleText(catalogImage.url, 2048),
                        path: sanitizeSimpleText(catalogImage.path, 512),
                        appliedAt: sanitizeSimpleText(catalogImage.uploadedAt, 80) || new Date().toISOString(),
                        appliedBy: currentUser.uid,
                        establishmentId: establishmentId
                    };
                }).filter(Boolean);
                if (reconciledMedia.length === reviewedAcceptedEntries.length) {
                    if (resumablePublishedLifecycle) {
                        var resumeAdminEstablishments = window.AdminEstablishmentsModule;
                        if (!resumeAdminEstablishments || typeof resumeAdminEstablishments._applyCanonicalFields !== 'function') {
                            throw createMediaApplicationError('document', 'Workflow canonico de empreendimentos indisponivel.');
                        }
                        await resumeAdminEstablishments._applyCanonicalFields(establishmentId, {}, {
                            groups: [],
                            flow: 'approved-media-request-resume',
                            expectedRevision: mediaExpectedRevision,
                            workflowProgress: {
                                ref: requestRef,
                                field: 'mediaApplyProgress',
                                statusValue: 'approved',
                                stateField: 'mediaApplyState',
                                stateValue: 'applying',
                                fingerprintField: 'mediaApplyFingerprint',
                                fingerprintValue: mediaApplyFingerprint
                            }
                        });
                    }
                    var reconciledAt = firebase.firestore.FieldValue.serverTimestamp();
                    await requestRef.update({
                        updatedAt: reconciledAt,
                        mediaAppliedAt: reconciledAt,
                        mediaAppliedBy: currentUser.uid,
                        mediaAppliedTo: establishmentId,
                        appliedMedia: reconciledMedia,
                        mediaApplyState: 'completed',
                        mediaApplyFingerprint: mediaApplyFingerprint
                    });
                    return { success: true, message: 'Aplicação de mídia já presente no empreendimento e registro da solicitação reconciliado sem novo upload.' };
                }
                return { success: false, message: 'Não há imagens aceitas ainda não aplicadas.' };
            }

            var hasMainImage = !!sanitizeSimpleText(mainImage && mainImage.url, 2048);
            var willUseMainImage = !hasMainImage;
            var galleryAdditions = acceptedImages.length - (willUseMainImage ? 1 : 0);

            if (gallery.length + galleryAdditions > 60) {
                return { success: false, message: 'A galeria chegaria acima do limite de 60 imagens. Remova ou reorganize imagens antes de aplicar.' };
            }

            var appliedAtIso = new Date().toISOString();
            var uploadedCatalogImages = [];

            for (var i = 0; i < acceptedImages.length; i += 1) {
                var uploaded = await copyReviewedImageToCmsMedia(
                    storage,
                    acceptedImages[i],
                    ownerUid,
                    establishmentId,
                    normalizedRequestId,
                    acceptedEntries[i].index
                );
                uploadedCatalogImages.push(buildReviewedCatalogImage(uploaded, acceptedImages[i]));
            }

            var nextGallery = gallery.slice();
            var newAppliedMedia = appliedMedia.slice();
            var establishmentUpdate = {};
            var mainApplied = null;

            uploadedCatalogImages.forEach(function(image, index) {
                var destination = 'gallery';
                if (willUseMainImage && index === 0) {
                    mainApplied = image;
                    destination = 'mainImage';
                } else {
                    image.position = nextGallery.length + 1;
                    nextGallery.push(image);
                }

                newAppliedMedia.push({
                    sourceRequestId: normalizedRequestId,
                    sourceImagePath: sanitizeSimpleText(acceptedImages[index] && acceptedImages[index].path, 512),
                    sourceImageUrl: sanitizeSimpleText(acceptedImages[index] && acceptedImages[index].url, 2048),
                    destination: destination,
                    url: image.url,
                    path: image.path,
                    appliedAt: appliedAtIso,
                    appliedBy: currentUser.uid,
                    establishmentId: establishmentId
                });
            });

            nextGallery = nextGallery.map(function(image, index) {
                return Object.assign({}, image, { position: index + 1 });
            });

            var appliedAt = firebase.firestore.FieldValue.serverTimestamp();
            if (mainApplied) {
                establishmentUpdate['media.mainImage'] = mainApplied;
            }
            establishmentUpdate['media.gallery'] = nextGallery;
            establishmentUpdate.updatedAt = appliedAt;
            establishmentUpdate.updatedBy = currentUser.uid;

            var requestUpdate = {
                updatedAt: appliedAt,
                mediaAppliedAt: appliedAt,
                mediaAppliedBy: currentUser.uid,
                mediaAppliedTo: establishmentId,
                appliedMedia: newAppliedMedia,
                mediaApplyState: 'completed',
                mediaApplyFingerprint: mediaApplyFingerprint
            };

            var adminEstablishments = window.AdminEstablishmentsModule;
            if (!adminEstablishments || typeof adminEstablishments._applyCanonicalFields !== 'function') {
                throw createMediaApplicationError('document', 'Workflow canonico de empreendimentos indisponivel.');
            }
            var currentRequestSnap = await requestRef.get();
            var currentRequest = currentRequestSnap.exists ? (currentRequestSnap.data() || {}) : {};
            if (!currentRequestSnap.exists ||
                normalizeUpdateRequestStatus(currentRequest.status) !== 'approved' ||
                sanitizeSimpleText(currentRequest.mediaApplyState, 40) !== 'applying' ||
                readOpaqueFingerprint(currentRequest.mediaApplyFingerprint) !== mediaApplyFingerprint ||
                establishmentUpdateMediaFingerprint(currentRequest) !== mediaApplyFingerprint) {
                var changed = createMediaApplicationError('document', 'A decisão editorial de mídia mudou durante a aplicação. Nenhuma alteração foi gravada no CMS.');
                changed.code = 'establishment-update/media-review-changed';
                throw changed;
            }
            try {
                await adminEstablishments._applyCanonicalFields(establishmentId, establishmentUpdate, {
                    groups: ['media'],
                    flow: 'approved-media-request',
                    expectedRevision: mediaExpectedRevision,
                    workflowProgress: {
                        ref: requestRef,
                        field: 'mediaApplyProgress',
                        statusValue: 'approved',
                        stateField: 'mediaApplyState',
                        stateValue: 'applying',
                        fingerprintField: 'mediaApplyFingerprint',
                        fingerprintValue: mediaApplyFingerprint
                    }
                });
            } catch(error) {
                logStorageCopyDiagnostic('warn', 'document:error', Object.assign({
                    requestId: normalizedRequestId,
                    establishmentId: establishmentId,
                    uploadedCount: String(uploadedCatalogImages.length)
                }, getErrorLogDetails(error)));
                throw createMediaApplicationError('document', 'Falha ao atualizar documento após upload da imagem.', error);
            }
            try {
                await requestRef.update(requestUpdate);
            } catch(error) {
                throw createMediaApplicationError('request-tracking', 'Falha ao registrar a aplicação na solicitação.', error);
            }

            return {
                success: true,
                message: establishment.status === 'published'
                    ? 'Mídia aceita aplicada e republicada no portal. Os arquivos originais em submissions foram preservados.'
                    : 'Mídia aceita aplicada ao rascunho. O conteúdo continuará privado até uma publicação explícita.'
            };
        } catch(error) {
            console.error(error);
            return { success: false, message: getMediaApplicationErrorMessage(error) };
        }
    },

    applyApprovedEstablishmentUpdateRequest: async function(requestId) {
        if (!this.isAdmin()) return { success: false, message: 'Permissão negada.' };

        var normalizedRequestId = sanitizeSimpleText(requestId, 160);

        if (!normalizedRequestId) {
            return { success: false, message: 'Solicitação inválida.' };
        }

        try {
            var db = firebase.firestore();
            var requestRef = db.collection('establishment_update_requests').doc(normalizedRequestId);
            var requestSnap = await requestRef.get();

            if (!requestSnap.exists) {
                return { success: false, message: 'Solicitação não encontrada.' };
            }

            var request = requestSnap.data() || {};
            var currentStatus = normalizeUpdateRequestStatus(request.status);

            if (currentStatus !== 'approved') {
                return { success: false, message: 'Apenas solicitações aprovadas podem ser aplicadas ao catálogo.' };
            }

            if (request.appliedAt || request.appliedBy || request.appliedTo) {
                return { success: false, message: 'Esta solicitação já foi aplicada ao catálogo editorial.' };
            }

            var establishmentId = sanitizeSimpleText(request.establishmentId, 160);

            if (!establishmentId) {
                return { success: false, message: 'Solicitação sem establishmentId. Aplicação abortada.' };
            }

            var establishmentRef = db.collection('cms_establishments').doc(establishmentId);
            var establishmentSnap = await establishmentRef.get();

            if (!establishmentSnap.exists) {
                return { success: false, message: 'Empreendimento não encontrado em cms_establishments: ' + establishmentId };
            }

            var establishment = establishmentSnap.data() || {};
            var requestedChanges = buildSafeRequestedChanges(request.requestedChanges);
            var textApplyPlan = buildEstablishmentTextApplyPlan(requestedChanges);
            var appliedFields = textApplyPlan.fields;
            var establishmentUpdate = {};

            appliedFields.forEach(function(field) {
                var targetPath = ESTABLISHMENT_UPDATE_APPLY_TARGETS[field];
                establishmentUpdate[targetPath] = requestedChanges[field];
            });

            if (!appliedFields.length) {
                return {
                    success: false,
                    message: 'Não há campos textuais aplicáveis nesta solicitação. Imagens anexadas exigem revisão manual.'
                };
            }

            var appliedAt = firebase.firestore.FieldValue.serverTimestamp();
            establishmentUpdate.updatedAt = appliedAt;
            establishmentUpdate.updatedBy = currentUser.uid;

            var requestUpdate = {
                updatedAt: appliedAt,
                appliedAt: appliedAt,
                appliedBy: currentUser.uid,
                appliedTo: establishmentId,
                appliedFields: appliedFields,
                textApplyState: 'completed',
                textApplyFingerprint: textApplyPlan.fingerprint
            };

            var textReservation = await db.runTransaction(function(transaction) {
                return Promise.all([transaction.get(requestRef), transaction.get(establishmentRef)]).then(function(snapshots) {
                    if (!snapshots[0].exists || !snapshots[1].exists) {
                        throw establishmentUpdateConflict('A solicitação ou o empreendimento não existe mais.');
                    }
                    var lockedRequest = snapshots[0].data() || {};
                    var currentCms = snapshots[1].data() || {};
                    if (normalizeUpdateRequestStatus(lockedRequest.status) !== 'approved') {
                        throw establishmentUpdateConflict('A decisão da solicitação mudou antes da aplicação.');
                    }
                    if (lockedRequest.appliedAt || lockedRequest.appliedBy || lockedRequest.appliedTo ||
                        sanitizeSimpleText(lockedRequest.textApplyState, 40) === 'completed') {
                        return { alreadyApplied: true };
                    }
                    var applyState = sanitizeSimpleText(lockedRequest.textApplyState, 40);
                    var storedFingerprint = readOpaqueFingerprint(lockedRequest.textApplyFingerprint);
                    if (applyState === 'applying' && storedFingerprint !== textApplyPlan.fingerprint) {
                        throw establishmentUpdateConflict('Os campos aprovados mudaram durante uma tentativa anterior.');
                    }
                    var currentRevision = Number.isInteger(currentCms.revision) ? currentCms.revision : 0;
                    var baseRevision = applyState === 'applying' && Number.isInteger(lockedRequest.textApplyBaseRevision)
                        ? lockedRequest.textApplyBaseRevision
                        : currentRevision;
                    var baseStatus = applyState === 'applying'
                        ? sanitizeSimpleText(lockedRequest.textApplyBaseStatus, 40)
                        : sanitizeSimpleText(currentCms.status, 40);
                    var baseValues = applyState === 'applying'
                        ? lockedRequest.textApplyBaseValues
                        : buildEstablishmentTextBaseValues(currentCms, appliedFields);
                    var textApplyProgress = applyState === 'applying' && lockedRequest.textApplyProgress &&
                        typeof lockedRequest.textApplyProgress === 'object'
                        ? lockedRequest.textApplyProgress
                        : {};
                    if (applyState === 'applying') {
                        var currentCmsStatus = sanitizeSimpleText(currentCms.status, 40);
                        var stableCompletedState = currentCmsStatus === baseStatus && !currentCms.editSession;
                        var resumableLifecycle = isResumablePublishedLifecycle(currentCms, baseStatus);
                        if (currentRevision < baseRevision ||
                            !cmsTextValuesRemainResumable(currentCms, requestedChanges, appliedFields, baseValues, textApplyProgress) ||
                            (!stableCompletedState && !(resumableLifecycle && workflowProgressHas(textApplyProgress, 'lifecycleDraft')))) {
                            throw establishmentUpdateConflict('O empreendimento foi editado depois da tentativa anterior. Nenhuma edição manual foi sobrescrita.');
                        }
                        if (stableCompletedState && allTextApplyGroupsCompleted(appliedFields, textApplyProgress) &&
                            cmsMatchesEstablishmentTextChanges(currentCms, requestedChanges, appliedFields)) {
                            transaction.update(requestRef, requestUpdate);
                            return { reconciled: true, expectedRevision: currentRevision };
                        }
                    }
                    transaction.update(requestRef, {
                        textApplyState: 'applying',
                        textApplyFingerprint: textApplyPlan.fingerprint,
                        textApplyBaseRevision: baseRevision,
                        textApplyBaseStatus: baseStatus,
                        textApplyBaseValues: baseValues,
                        textApplyProgress: textApplyProgress,
                        textApplyStartedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        textApplyStartedBy: currentUser.uid,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    return { expectedRevision: currentRevision };
                });
            });

            if (textReservation.alreadyApplied) {
                return { success: false, message: 'Esta solicitação já foi aplicada ao catálogo editorial.' };
            }
            if (textReservation.reconciled) {
                return {
                    success: true,
                    message: 'Alteração já presente no empreendimento e registro privado da solicitação reconciliado.'
                };
            }

            var adminEstablishments = window.AdminEstablishmentsModule;
            if (!adminEstablishments || typeof adminEstablishments._applyCanonicalFields !== 'function') {
                return { success: false, message: 'Workflow canônico de empreendimentos indisponível.' };
            }
            await adminEstablishments._applyCanonicalFields(establishmentId, establishmentUpdate, {
                flow: 'approved-text-request',
                expectedRevision: textReservation.expectedRevision,
                workflowProgress: {
                    ref: requestRef,
                    field: 'textApplyProgress',
                    statusValue: 'approved',
                    stateField: 'textApplyState',
                    stateValue: 'applying',
                    fingerprintField: 'textApplyFingerprint',
                    fingerprintValue: textApplyPlan.fingerprint
                },
                enforceSemanticIdentity: appliedFields.some(function (field) {
                    return field === 'address' || field === 'phone' || field === 'website';
                })
            });
            await requestRef.update(requestUpdate);

            return {
                success: true,
                message: establishment.status === 'published'
                    ? 'Solicitação aplicada e alterações republicadas no portal.'
                    : 'Solicitação aplicada ao rascunho. O conteúdo continuará privado até uma publicação explícita.'
            };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao aplicar solicitação ao catálogo editorial.' };
        }
    },

    getPendingEstablishmentClaims: async function() {
        if (!this.isModerator()) return [];
        try {
            var snap = await firebase.firestore().collection('establishment_claims')
                .where('status', '==', 'pending')
                .get();

            return sortByTimestampDesc(snap.docs.map(function(doc) {
                return Object.assign({}, doc.data(), { id: doc.id });
            }), 'createdAt');
        } catch(error) {
            console.error(error);
            return [];
        }
    },

    listAllEstablishmentManagers: async function() {
        if (!this.isModerator()) return [];
        try {
            var snap = await firebase.firestore().collection('establishment_managers').get();
            return snap.docs.map(function(doc) {
                return Object.assign({}, doc.data(), { id: doc.id });
            }).sort(function(a, b) {
                if ((a.active === false) !== (b.active === false)) {
                    return a.active === false ? 1 : -1;
                }

                var userCompare = String(a.userName || '').localeCompare(String(b.userName || ''), 'pt-BR');
                if (userCompare !== 0) return userCompare;

                return String(a.establishmentName || '').localeCompare(String(b.establishmentName || ''), 'pt-BR');
            });
        } catch(error) {
            console.error(error);
            return [];
        }
    },

    checkExistingManager: async function(userId, establishmentId, excludeManagerId) {
        if (!this.isModerator()) return null;

        var normalizedUserId = String(userId || '').trim();
        var normalizedEstablishmentId = String(establishmentId || '').trim();
        var normalizedExcludeId = String(excludeManagerId || '').trim();

        if (!normalizedUserId || !normalizedEstablishmentId) return null;

        try {
            var snap = await firebase.firestore().collection('establishment_managers')
                .where('userId', '==', normalizedUserId)
                .get();

            var targetId = normalizeComparableId(normalizedEstablishmentId);
            return snap.docs.map(function(doc) {
                return Object.assign({}, doc.data(), { id: doc.id });
            }).find(function(item) {
                return item.id !== normalizedExcludeId &&
                    normalizeComparableId(item.establishmentId) === targetId;
            }) || null;
        } catch(error) {
            console.error(error);
            return null;
        }
    },

    createEstablishmentManager: async function(managerData) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };

        var userId = String(managerData && managerData.userId || '').trim();
        var userEmail = String(managerData && managerData.userEmail || '').trim();
        var userName = String(managerData && managerData.userName || '').trim();
        var establishmentId = String(managerData && managerData.establishmentId || '').trim();
        var establishmentName = String(managerData && managerData.establishmentName || '').trim();
        var role = normalizeManagerRole(managerData && managerData.role);
        var active = managerData && managerData.active === false ? false : true;
        var notes = String(managerData && managerData.notes || '').trim();
        var claimId = String(managerData && managerData.claimId || 'manual').trim() || 'manual';
        var revokeReason = String(managerData && managerData.revokeReason || '').trim();

        if (!userId || !userEmail || !userName || !establishmentId || !establishmentName || !role) {
            return { success: false, message: 'Preencha usuário, empreendimento e função do vínculo.' };
        }

        try {
            var existingManager = await this.checkExistingManager(userId, establishmentId);
            if (existingManager) {
                return {
                    success: false,
                    code: existingManager.active === false ? 'manager-inactive-exists' : 'manager-active-exists',
                    existingManager: existingManager,
                    message: existingManager.active === false
                        ? 'Já existe um vínculo inativo para este usuário e empreendimento.'
                        : 'Já existe vínculo ativo para este usuário e empreendimento.'
                };
            }

            var db = firebase.firestore();
            var now = firebase.firestore.FieldValue.serverTimestamp();
            var managerId = buildEstablishmentManagerDocId(userId, establishmentId);

            await db.collection('establishment_managers').doc(managerId).set({
                userId: userId,
                userEmail: userEmail,
                userName: userName,
                establishmentId: establishmentId,
                establishmentName: establishmentName,
                role: role,
                active: active,
                approvedAt: now,
                approvedBy: currentUser.uid,
                claimId: claimId,
                notes: notes,
                updatedAt: now,
                updatedBy: currentUser.uid,
                revokedAt: active ? null : now,
                revokedBy: active ? null : currentUser.uid,
                revokeReason: active ? '' : (revokeReason || 'Criado manualmente como inativo'),
                replacedBy: ''
            });

            return { success: true, message: 'Vínculo criado com sucesso.', managerId: managerId };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao criar vínculo.' };
        }
    },

    updateEstablishmentManager: async function(managerId, managerData) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };

        var normalizedManagerId = String(managerId || '').trim();
        if (!normalizedManagerId) {
            return { success: false, message: 'Vínculo não informado.' };
        }

        try {
            var db = firebase.firestore();
            var managerRef = db.collection('establishment_managers').doc(normalizedManagerId);
            var managerSnap = await managerRef.get();

            if (!managerSnap.exists) {
                return { success: false, message: 'Vínculo não encontrado.' };
            }

            var currentManager = Object.assign({}, managerSnap.data(), { id: managerSnap.id });
            var currentUserId = String(currentManager.userId || '').trim();
            var establishmentId = String(managerData && managerData.establishmentId || currentManager.establishmentId || '').trim();
            var establishmentName = String(managerData && managerData.establishmentName || currentManager.establishmentName || '').trim();
            var role = normalizeManagerRole(managerData && managerData.role || currentManager.role);
            var active = managerData && managerData.active === false ? false : true;
            var notes = String(managerData && managerData.notes || '').trim();
            var revokeReason = String(managerData && managerData.revokeReason || '').trim();

            if (!currentUserId) {
                return {
                    success: false,
                    code: 'manager-missing-user',
                    message: 'Este vínculo não possui usuário associado. Desative este registro e crie um novo vínculo.'
                };
            }

            if (!establishmentId || !establishmentName || !role) {
                return { success: false, message: 'Empreendimento e função do vínculo são obrigatórios.' };
            }

            var duplicateManager = await this.checkExistingManager(currentUserId, establishmentId, normalizedManagerId);
            if (duplicateManager) {
                return {
                    success: false,
                    code: duplicateManager.active === false ? 'manager-inactive-exists' : 'manager-active-exists',
                    existingManager: duplicateManager,
                    message: duplicateManager.active === false
                        ? 'Já existe um vínculo inativo para este usuário e empreendimento.'
                        : 'Já existe vínculo ativo para este usuário e empreendimento.'
                };
            }

            var now = firebase.firestore.FieldValue.serverTimestamp();
            var targetManagerId = buildEstablishmentManagerDocId(currentUserId, establishmentId);

            if (targetManagerId !== normalizedManagerId) {
                var batch = db.batch();
                var targetRef = db.collection('establishment_managers').doc(targetManagerId);

                batch.set(targetRef, {
                    userId: currentUserId,
                    userEmail: currentManager.userEmail || '',
                    userName: currentManager.userName || '',
                    establishmentId: establishmentId,
                    establishmentName: establishmentName,
                    role: role,
                    active: active,
                    approvedAt: currentManager.approvedAt || now,
                    approvedBy: currentManager.approvedBy || currentUser.uid,
                    claimId: currentManager.claimId || 'manual',
                    notes: notes,
                    updatedAt: now,
                    updatedBy: currentUser.uid,
                    revokedAt: active ? null : now,
                    revokedBy: active ? null : currentUser.uid,
                    revokeReason: active ? '' : (revokeReason || currentManager.revokeReason || 'Desativado via edição administrativa'),
                    replacedBy: ''
                });

                batch.update(managerRef, {
                    active: false,
                    updatedAt: now,
                    updatedBy: currentUser.uid,
                    revokedAt: now,
                    revokedBy: currentUser.uid,
                    revokeReason: 'Substituído por correção administrativa',
                    replacedBy: targetManagerId
                });

                await batch.commit();
                return {
                    success: true,
                    message: 'Vínculo corrigido com sucesso.',
                    managerId: targetManagerId
                };
            }

            await managerRef.update({
                establishmentId: establishmentId,
                establishmentName: establishmentName,
                role: role,
                active: active,
                notes: notes,
                updatedAt: now,
                updatedBy: currentUser.uid,
                revokedAt: active ? null : now,
                revokedBy: active ? null : currentUser.uid,
                revokeReason: active ? '' : (revokeReason || currentManager.revokeReason || 'Desativado via edição administrativa'),
                replacedBy: currentManager.replacedBy || ''
            });

            return { success: true, message: 'Vínculo atualizado com sucesso.', managerId: normalizedManagerId };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao atualizar vínculo.' };
        }
    },

    deactivateEstablishmentManager: async function(managerId, revokeReason) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };

        var normalizedManagerId = String(managerId || '').trim();
        if (!normalizedManagerId) {
            return { success: false, message: 'Vínculo não informado.' };
        }

        try {
            await firebase.firestore().collection('establishment_managers').doc(normalizedManagerId).update({
                active: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.uid,
                revokedAt: firebase.firestore.FieldValue.serverTimestamp(),
                revokedBy: currentUser.uid,
                revokeReason: String(revokeReason || '').trim() || 'Desativado manualmente'
            });

            return { success: true, message: 'Vínculo desativado com sucesso.' };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao desativar vínculo.' };
        }
    },

    reactivateEstablishmentManager: async function(managerId, notes) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };

        var normalizedManagerId = String(managerId || '').trim();
        if (!normalizedManagerId) {
            return { success: false, message: 'Vínculo não informado.' };
        }

        try {
            var db = firebase.firestore();
            var managerRef = db.collection('establishment_managers').doc(normalizedManagerId);
            var managerSnap = await managerRef.get();

            if (!managerSnap.exists) {
                return { success: false, message: 'Vínculo não encontrado.' };
            }

            var currentManager = Object.assign({}, managerSnap.data(), { id: managerSnap.id });
            var duplicateManager = await this.checkExistingManager(
                currentManager.userId,
                currentManager.establishmentId,
                normalizedManagerId
            );

            if (duplicateManager && duplicateManager.active !== false) {
                return { success: false, message: 'Já existe vínculo ativo para este usuário e empreendimento.' };
            }

            await managerRef.update({
                active: true,
                notes: String(notes || currentManager.notes || '').trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: currentUser.uid,
                revokedAt: null,
                revokedBy: null,
                revokeReason: '',
                replacedBy: ''
            });

            return { success: true, message: 'Vínculo reativado com sucesso.' };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao reativar vínculo.' };
        }
    },

    approveEstablishmentClaim: async function(claimId, reviewNotes) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };

        try {
            var db = firebase.firestore();
            var claimRef = db.collection('establishment_claims').doc(claimId);
            var claimSnap = await claimRef.get();

            if (!claimSnap.exists) {
                return { success: false, message: 'Solicitação não encontrada.' };
            }

            var claim = Object.assign({}, claimSnap.data(), { id: claimSnap.id });

            if (claim.status === 'approved') {
                return { success: false, message: 'Esta solicitação já foi aprovada.' };
            }

            if (claim.status !== 'pending') {
                return { success: false, message: 'Apenas solicitações pendentes podem ser aprovadas.' };
            }

            var managersSnap = await db.collection('establishment_managers')
                .where('userId', '==', claim.userId)
                .get();

            var normalizedTarget = normalizeComparableId(claim.establishmentId);
            var duplicateActiveManager = managersSnap.docs
                .map(function(doc) { return doc.data(); })
                .some(function(item) {
                    return item.active !== false &&
                        normalizeComparableId(item.establishmentId) === normalizedTarget;
                });

            if (duplicateActiveManager) {
                return { success: false, message: 'Já existe vínculo ativo para este usuário e empreendimento.' };
            }

            var batch = db.batch();
            var managerRef = db.collection('establishment_managers')
                .doc(buildEstablishmentManagerDocId(claim.userId, claim.establishmentId));
            var approvedAt = firebase.firestore.FieldValue.serverTimestamp();

            batch.update(claimRef, {
                status: 'approved',
                updatedAt: approvedAt,
                reviewedAt: approvedAt,
                reviewedBy: currentUser.uid,
                reviewNotes: reviewNotes || '',
                rejectionReason: ''
            });

            batch.set(managerRef, {
                userId: claim.userId,
                userEmail: claim.userEmail || '',
                userName: claim.userName || '',
                establishmentId: claim.establishmentId,
                establishmentName: claim.establishmentName,
                role: normalizeManagerRole(claim.requestedRole) || claim.requestedRole,
                active: true,
                approvedAt: approvedAt,
                approvedBy: currentUser.uid,
                claimId: claim.id,
                notes: '',
                updatedAt: approvedAt,
                updatedBy: currentUser.uid,
                revokedAt: null,
                revokedBy: null,
                revokeReason: '',
                replacedBy: ''
            });

            await batch.commit();
            return { success: true, message: 'Vínculo aprovado com sucesso.' };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao aprovar solicitação de vínculo.' };
        }
    },

    rejectEstablishmentClaim: async function(claimId, rejectionReason, reviewNotes) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };

        try {
            var claimRef = firebase.firestore().collection('establishment_claims').doc(claimId);
            var claimSnap = await claimRef.get();

            if (!claimSnap.exists) {
                return { success: false, message: 'Solicitação não encontrada.' };
            }

            var claim = claimSnap.data() || {};
            if (claim.status === 'approved') {
                return { success: false, message: 'Solicitações já aprovadas não podem ser rejeitadas.' };
            }

            if (claim.status !== 'pending') {
                return { success: false, message: 'Apenas solicitações pendentes podem ser rejeitadas.' };
            }

            await claimRef.update({
                status: 'rejected',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reviewedBy: currentUser.uid,
                rejectionReason: rejectionReason || '',
                reviewNotes: reviewNotes || ''
            });

            return { success: true, message: 'Solicitação rejeitada.' };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao rejeitar solicitação de vínculo.' };
        }
    },

    // ========================================
    // ESTATÍSTICAS (ADMIN)
    // ========================================

    getAdminStats: async function() {
        if (!this.isAdmin()) return null;
        try {
            const db = firebase.firestore();
            const [usersSnap, pendingEventsResult, appEvtSnap, pendEstSnap] = await Promise.all([
                db.collection('usuarios').get(),
                this.getPendingEventsReport(),
                db.collection('eventos_aprovados').get(),
                db.collection('estabelecimentos_pendentes').where('status','==','pendente').get()
            ]);
            return {
                totalUsers:            usersSnap.size,
                pendingEvents:         pendingEventsResult.success ? pendingEventsResult.items.length : null,
                pendingEventsLoadError: pendingEventsResult.success !== true,
                pendingEventsDiagnostics: pendingEventsResult.diagnostics || null,
                approvedEvents:        appEvtSnap.size,
                pendingEstablishments: pendEstSnap.size
            };
        } catch(e) { console.error(e); return null; }
    },

    // ========================================
    // UI HELPERS
    // ========================================

    updateUI: function() {
        const user = this.getCurrentUser();
        document.querySelectorAll('.auth-login-btn').forEach(function(btn) {
            btn.style.display = user ? 'none' : 'flex';
        });
        document.querySelectorAll('.auth-user-menu').forEach(function(menu) {
            menu.style.display = user ? 'flex' : 'none';
        });
        document.querySelectorAll('.auth-user-name').forEach(function(el) {
            if (user) el.textContent = user.nome ? user.nome.split(' ')[0] : 'Usuário';
        });
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: user } }));
    },

    showNotification: function(message, type) {
        type = type || 'info';
        var existing = document.querySelector('.firebase-notification');
        if (existing) existing.remove();
        var n = document.createElement('div');
        n.className = 'firebase-notification firebase-notif-' + type;
        var span = document.createElement('span');
        span.textContent = message;
        var btn = document.createElement('button');
        btn.textContent = '\u00d7';
        btn.setAttribute('aria-label', 'Fechar notificação');
        btn.addEventListener('click', function() { n.remove(); });
        n.appendChild(span);
        n.appendChild(btn);
        var bg = type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db';
        n.style.cssText = 'position:fixed;top:7.5rem;right:1rem;padding:1rem 1.5rem;border-radius:10px;' +
            'display:flex;align-items:center;gap:1rem;z-index:10003;animation:slideIn 0.3s ease;' +
            'box-shadow:0 5px 20px rgba(0,0,0,0.2);background:' + bg + ';color:white;max-width:90vw;';
        btn.style.cssText = 'background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;padding:0 0.25rem;';
        document.body.appendChild(n);
        setTimeout(function() { n.remove(); }, 5000);
    }
};

// Inicializar quando DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    const ok = await initFirebase();
    window.dispatchEvent(new CustomEvent('firebaseReady', { detail: { ok: ok } }));
});

window.FirebaseSystem   = FirebaseSystem;
window.initFirebase     = initFirebase;
