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
    openingHours: 'content.openingHours',
    additionalNotes: 'review.lastReviewNotes'
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

function isImageAlreadyApplied(image, appliedItems, catalogImages) {
    var sourcePath = sanitizeSimpleText(image && image.path, 512);
    var sourceUrl = sanitizeSimpleText(image && image.url, 2048);

    return ensureArray(appliedItems).concat(ensureArray(catalogImages)).some(function(item) {
        return (sourcePath && item && item.sourceImagePath === sourcePath) ||
            (sourceUrl && item && item.sourceImageUrl === sourceUrl);
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

function buildReviewedCatalogImage(uploadedImage, sourceImage, requestId, appliedAtIso) {
    return {
        url: sanitizeSimpleText(uploadedImage && uploadedImage.url, 2048),
        path: sanitizeSimpleText(uploadedImage && uploadedImage.path, 512),
        alt: sanitizeSimpleText(sourceImage && (sourceImage.alt || sourceImage.name), 160),
        caption: '',
        credit: '',
        source: 'portal_request',
        sourceRequestId: sanitizeSimpleText(requestId, 160),
        sourceImagePath: sanitizeSimpleText(sourceImage && sourceImage.path, 512),
        uploadedBy: currentUser && currentUser.uid ? currentUser.uid : '',
        uploadedAt: appliedAtIso,
        reviewedBy: currentUser && currentUser.uid ? currentUser.uid : '',
        reviewedAt: appliedAtIso
    };
}

async function copyReviewedImageToCmsMedia(storage, image, adminUid, establishmentId, requestId, index) {
    var sourcePath = sanitizeSimpleText(image && image.path, 512);
    var sourceUrl = sanitizeSimpleText(image && image.url, 2048);
    var sourceName = sanitizeSimpleText(image && image.name, 120) || getSafeFileNameFromPath(sourcePath || sourceUrl);
    var contentType = sanitizeSimpleText(image && image.contentType, 80) || 'image/jpeg';

    if (!sourceUrl && sourcePath) {
        sourceUrl = await storage.ref(sourcePath).getDownloadURL();
    }

    if (!sourceUrl) {
        throw new Error('Imagem aceita sem URL ou path de origem.');
    }

    var response = await fetch(sourceUrl);
    if (!response || !response.ok) {
        throw new Error('Não foi possível baixar a imagem aceita para reaplicar no CMS.');
    }

    var blob = await response.blob();
    var safeFileName = getSafeFileNameFromPath(sourceName);
    var destinationPath = [
        'cms-media',
        adminUid,
        'establishments',
        establishmentId,
        'reviewed',
        requestId,
        Date.now() + '-' + String(index + 1) + '-' + safeFileName
    ].join('/');
    var destinationRef = storage.ref(destinationPath);

    await destinationRef.put(blob, {
        contentType: contentType,
        cacheControl: 'public,max-age=31536000,immutable'
    });

    return {
        url: await destinationRef.getDownloadURL(),
        path: destinationPath
    };
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
                // Inicializar app (evita dupla inicialização)
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }

                const { initCompatAppCheck } = await import('./firebase-app-check.js');
                await initCompatAppCheck(firebase);

                const auth = firebase.auth();
                const db   = firebase.firestore();

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
                                currentUser = Object.assign({ uid: user.uid, email: user.email, _profilePending: false, _profileError: false }, userDoc.data());
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
    isAdmin:        function() { return currentUser && currentUser.role === 'admin'; },
    isModerator:    function() { return currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator'); },

    // ========================================
    // GERENCIAMENTO DE USUÁRIOS (ADMIN)
    // ========================================

    getUsers: async function() {
        if (!this.isAdmin()) return [];
        try {
            const snap = await firebase.firestore().collection('usuarios').orderBy('criadoEm', 'desc').get();
            return snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
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
                .map(function(d) { return Object.assign({ id: d.id }, d.data()); })
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
            const db  = firebase.firestore();
            const ref = db.collection('eventos_pendentes').doc(eventId);
            const doc = await ref.get();
            if (!doc.exists) return { success: false, message: 'Evento não encontrado.' };
            await db.collection('eventos_aprovados').doc(eventId).set(
                Object.assign({}, doc.data(), {
                    status:      'aprovado',
                    publicado:   true,
                    reviewedAt:  firebase.firestore.FieldValue.serverTimestamp(),
                    reviewedBy:  currentUser.uid,
                    reviewNotes: notes,
                    updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy:   currentUser.uid
                })
            );
            await ref.delete();
            return { success: true, message: 'Evento aprovado com sucesso!' };
        } catch(e) { return { success: false, message: 'Erro ao aprovar evento.' }; }
    },

    rejectEvent: async function(eventId, reason) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };
        reason = reason || '';
        try {
            await firebase.firestore().collection('eventos_pendentes').doc(eventId).update({
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
            const [pendSnap, appSnap] = await withTimeout(
                Promise.all([
                    db.collection('eventos_pendentes').where('submittedBy', '==', currentUser.uid).get(),
                    db.collection('eventos_aprovados').where('submittedBy', '==', currentUser.uid).get()
                ]),
                PROFILE_LOAD_TIMEOUT_MS,
                'firestore/events-timeout'
            );
            const pending  = pendSnap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
            const approved = appSnap.docs.map(function(d)  { return Object.assign({ id: d.id }, d.data()); });
            return pending.concat(approved);
        } catch(e) { console.error(e); return []; }
    },

    // ========================================
    // ESTABELECIMENTOS
    // ========================================

    submitEstablishment: async function(estData) {
        if (!this.isLoggedIn()) return { success: false, message: 'Você precisa estar logado.' };
        try {
            const db = firebase.firestore();
            const estId = 'est_' + Date.now();
            await db.collection('estabelecimentos_pendentes').doc(estId).set(
                Object.assign({}, estData, {
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

    getPendingEstablishments: async function() {
        if (!this.isModerator()) return [];
        try {
            const snap = await firebase.firestore().collection('estabelecimentos_pendentes')
                .where('status', '==', 'pendente').get();
            return snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
        } catch(e) { return []; }
    },

    approveEstablishment: async function(estId, notes) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };
        notes = notes || '';
        try {
            const db  = firebase.firestore();
            const ref = db.collection('estabelecimentos_pendentes').doc(estId);
            const doc = await ref.get();
            if (!doc.exists) return { success: false, message: 'Estabelecimento não encontrado.' };
            await db.collection('estabelecimentos_aprovados').doc(estId).set(
                Object.assign({}, doc.data(), {
                    status:      'aprovado',
                    reviewedAt:  firebase.firestore.FieldValue.serverTimestamp(),
                    reviewedBy:  currentUser.uid,
                    reviewNotes: notes
                })
            );
            await ref.delete();
            return { success: true, message: 'Estabelecimento aprovado com sucesso!' };
        } catch(e) { return { success: false, message: 'Erro ao aprovar estabelecimento.' }; }
    },

    rejectEstablishment: async function(estId, reason) {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };
        reason = reason || '';
        try {
            await firebase.firestore().collection('estabelecimentos_pendentes').doc(estId).update({
                status:      'rejeitado',
                reviewedAt:  firebase.firestore.FieldValue.serverTimestamp(),
                reviewedBy:  currentUser.uid,
                reviewNotes: reason
            });
            return { success: true, message: 'Estabelecimento rejeitado.' };
        } catch(e) { return { success: false, message: 'Erro ao rejeitar estabelecimento.' }; }
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
                return Object.assign({ id: doc.id }, doc.data());
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
                return Object.assign({ id: doc.id }, doc.data());
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
                return Object.assign({ id: doc.id }, doc.data());
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

                var manager = Object.assign({ id: managerDoc.id }, managerDoc.data());
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
                return Object.assign({ id: doc.id }, doc.data());
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
                return Object.assign({ id: doc.id }, doc.data());
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
            var requestSnap = await requestRef.get();

            if (!requestSnap.exists) {
                return { success: false, message: 'Solicitação não encontrada.' };
            }

            var request = requestSnap.data() || {};
            var images = buildSafeImageMetadata(request.images);

            if (!images.length) {
                return { success: false, message: 'Esta solicitação não possui imagens anexadas.' };
            }

            var reviewMap = buildSafeMediaReviewMap(reviewData && reviewData.images);
            var now = firebase.firestore.FieldValue.serverTimestamp();
            var decidedAt = new Date().toISOString();
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

            await requestRef.update({
                mediaReview: {
                    reviewedAt: now,
                    reviewedBy: currentUser.uid,
                    images: reviewedImages
                },
                updatedAt: now
            });

            return {
                success: true,
                message: 'Revisão editorial das imagens salva. Nenhuma mídia foi aplicada ao catálogo.'
            };
        } catch(error) {
            console.error(error);
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
            var requestSnap = await requestRef.get();

            if (!requestSnap.exists) {
                return { success: false, message: 'Solicitação não encontrada.' };
            }

            var request = requestSnap.data() || {};
            if (normalizeUpdateRequestStatus(request.status) !== 'approved') {
                return { success: false, message: 'Apenas solicitações aprovadas podem aplicar mídia ao catálogo.' };
            }

            var establishmentId = sanitizeSimpleText(request.establishmentId, 160);
            if (!establishmentId) {
                return { success: false, message: 'Solicitação sem establishmentId. Aplicação de mídia abortada.' };
            }

            var establishmentRef = db.collection('cms_establishments').doc(establishmentId);
            var establishmentSnap = await establishmentRef.get();

            if (!establishmentSnap.exists) {
                return { success: false, message: 'Empreendimento não encontrado em cms_establishments: ' + establishmentId };
            }

            var establishment = establishmentSnap.data() || {};
            var media = establishment.media || {};
            var mainImage = media.mainImage || {};
            var gallery = ensureArray(media.gallery);
            var appliedMedia = buildSafeAppliedMedia(request.appliedMedia);
            var catalogImages = [mainImage].concat(gallery);
            var reviewMap = buildSafeMediaReviewMap(request.mediaReview && request.mediaReview.images);
            var acceptedImages = buildSafeImageMetadata(request.images).filter(function(image) {
                var review = reviewMap[buildMediaReviewKey(image)] || {};
                return normalizeMediaReviewStatus(review.status) === 'accepted' &&
                    !isImageAlreadyApplied(image, appliedMedia, catalogImages);
            });

            if (!acceptedImages.length) {
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
                    currentUser.uid,
                    establishmentId,
                    normalizedRequestId,
                    i
                );
                uploadedCatalogImages.push(buildReviewedCatalogImage(uploaded, acceptedImages[i], normalizedRequestId, appliedAtIso));
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
                    sourceImagePath: image.sourceImagePath,
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
            establishmentUpdate['review.lastAppliedRequestId'] = normalizedRequestId;
            establishmentUpdate['review.lastAppliedAt'] = appliedAt;
            establishmentUpdate['review.lastAppliedBy'] = currentUser.uid;

            var requestUpdate = {
                updatedAt: appliedAt,
                mediaAppliedAt: appliedAt,
                mediaAppliedBy: currentUser.uid,
                mediaAppliedTo: establishmentId,
                appliedMedia: newAppliedMedia
            };

            var batch = db.batch();
            batch.update(establishmentRef, establishmentUpdate);
            batch.update(requestRef, requestUpdate);
            await batch.commit();

            return {
                success: true,
                message: 'Mídia aceita aplicada ao catálogo interno. Os arquivos originais em submissions foram preservados e o site público não mudou.'
            };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao aplicar mídia aceita ao catálogo interno.' };
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
                return { success: false, message: 'Esta solicitação já foi aplicada ao catálogo interno.' };
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

            var requestedChanges = buildSafeRequestedChanges(request.requestedChanges);
            var appliedFields = [];
            var establishmentUpdate = {};

            Object.keys(requestedChanges).forEach(function(field) {
                var targetPath = ESTABLISHMENT_UPDATE_APPLY_TARGETS[field];
                if (!targetPath) return;
                establishmentUpdate[targetPath] = requestedChanges[field];
                appliedFields.push(field);
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
            establishmentUpdate['review.lastAppliedRequestId'] = normalizedRequestId;
            establishmentUpdate['review.lastAppliedAt'] = appliedAt;
            establishmentUpdate['review.lastAppliedBy'] = currentUser.uid;

            var requestUpdate = {
                updatedAt: appliedAt,
                appliedAt: appliedAt,
                appliedBy: currentUser.uid,
                appliedTo: establishmentId,
                appliedFields: appliedFields
            };

            var batch = db.batch();
            batch.update(establishmentRef, establishmentUpdate);
            batch.update(requestRef, requestUpdate);
            await batch.commit();

            return {
                success: true,
                message: 'Solicitação aplicada ao catálogo interno. O site público continua usando dados estáticos.'
            };
        } catch(error) {
            console.error(error);
            return { success: false, message: 'Erro ao aplicar solicitação ao catálogo interno.' };
        }
    },

    getPendingEstablishmentClaims: async function() {
        if (!this.isModerator()) return [];
        try {
            var snap = await firebase.firestore().collection('establishment_claims')
                .where('status', '==', 'pending')
                .get();

            return sortByTimestampDesc(snap.docs.map(function(doc) {
                return Object.assign({ id: doc.id }, doc.data());
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
                return Object.assign({ id: doc.id }, doc.data());
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
                return Object.assign({ id: doc.id }, doc.data());
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

            var currentManager = Object.assign({ id: managerSnap.id }, managerSnap.data());
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

            var currentManager = Object.assign({ id: managerSnap.id }, managerSnap.data());
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

            var claim = Object.assign({ id: claimSnap.id }, claimSnap.data());

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
