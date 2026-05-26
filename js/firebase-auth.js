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
        _profilePending: true
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

function sortByTimestampDesc(items, fieldName) {
    return (items || []).slice().sort(function(a, b) {
        return getComparableTimestamp(b && b[fieldName]) - getComparableTimestamp(a && a[fieldName]);
    });
}

function buildEstablishmentManagerDocId(userId, establishmentId) {
    return 'mgr_' + String(userId || '').replace(/[^\w-]+/g, '_') + '__' +
        String(establishmentId || '').replace(/[^\w-]+/g, '_');
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
                                currentUser = Object.assign({ uid: user.uid, email: user.email, _profilePending: false }, userDoc.data());
                            } else {
                                currentUser._profilePending = false;
                            }
                        } catch(e) {
                            console.warn('[firebase-auth] Não foi possível carregar o perfil completo do usuário.', e);
                            currentUser._profilePending = false;
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
            const eventId = 'evt_' + Date.now();
            await db.collection('eventos_pendentes').doc(eventId).set(
                Object.assign({}, eventData, {
                    id: eventId,
                    submittedBy:      currentUser.uid,
                    submittedByName:  currentUser.nome,
                    submittedByEmail: currentUser.email,
                    status:           'pendente',
                    submittedAt:      firebase.firestore.FieldValue.serverTimestamp(),
                    reviewedAt:       null,
                    reviewedBy:       null,
                    reviewNotes:      ''
                })
            );
            return { success: true, message: 'Evento enviado para análise! Você receberá uma notificação quando for aprovado.' };
        } catch(e) { console.error(e); return { success: false, message: 'Erro ao enviar evento.' }; }
    },

    getPendingEvents: async function() {
        if (!this.isModerator()) return [];
        try {
            const snap = await firebase.firestore().collection('eventos_pendentes')
                .where('status', '==', 'pendente').orderBy('submittedAt', 'desc').get();
            return snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
        } catch(e) { console.error(e); return []; }
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
                    reviewedAt:  firebase.firestore.FieldValue.serverTimestamp(),
                    reviewedBy:  currentUser.uid,
                    reviewNotes: notes
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
            var db = firebase.firestore();
            var userId = currentUser.uid;
            var normalizedTarget = normalizeComparableId(establishmentId);

            var managersSnap = await db.collection('establishment_managers')
                .where('userId', '==', userId)
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

            await db.collection('establishment_claims').doc(claimId).set({
                id: claimId,
                userId: userId,
                userEmail: currentUser.email || '',
                userName: currentUser.nome || currentUser.displayName || currentUser.email || 'Usuário',
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
            console.error(error);
            return { success: false, message: 'Erro ao enviar solicitação de vínculo.' };
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
            var snap = await firebase.firestore().collection('establishment_managers')
                .where('userId', '==', currentUser.uid)
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
                role: claim.requestedRole,
                active: true,
                approvedAt: approvedAt,
                approvedBy: currentUser.uid,
                claimId: claim.id
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
            const [usersSnap, pendEvtSnap, appEvtSnap, pendEstSnap] = await Promise.all([
                db.collection('usuarios').get(),
                db.collection('eventos_pendentes').where('status','==','pendente').get(),
                db.collection('eventos_aprovados').get(),
                db.collection('estabelecimentos_pendentes').where('status','==','pendente').get()
            ]);
            return {
                totalUsers:            usersSnap.size,
                pendingEvents:         pendEvtSnap.size,
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
