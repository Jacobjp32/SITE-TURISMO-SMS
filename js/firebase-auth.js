/**
 * Sistema de Autenticação Firebase - Turismo São Mateus do Sul
 * Gerencia login, cadastro, sessões e banco de dados na nuvem
 */

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAy5161iVe7JoLgLMp1EN52OsBHXjo3JYQ",
    authDomain: "turismo-sms.firebaseapp.com",
    projectId: "turismo-sms",
    storageBucket: "turismo-sms.firebasestorage.app",
    messagingSenderId: "1042825829044",
    appId: "1:1042825829044:web:13173093e28be3199955e1"
};

// Variáveis globais do Firebase
let app, auth, db;
let currentUser = null;

// Inicializar Firebase
async function initFirebase() {
    try {
        // Import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Guardar referências globais
        window.firebaseAuth = { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile };
        window.firebaseDB = { db, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp };

        // Observar mudanças no estado de autenticação
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Usuário logado - buscar dados completos do Firestore
                const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
                if (userDoc.exists()) {
                    currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
                } else {
                    currentUser = { uid: user.uid, email: user.email, nome: user.displayName || 'Usuário' };
                }
                window.currentUser = currentUser;
                FirebaseSystem.updateUI();
            } else {
                currentUser = null;
                window.currentUser = null;
                FirebaseSystem.updateUI();
            }
        });

        console.log('✅ Firebase inicializado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return false;
    }
}

// Sistema Firebase
const FirebaseSystem = {
    // ========================================
    // AUTENTICAÇÃO
    // ========================================

    // Cadastrar novo usuário
    register: async function(userData) {
        try {
            const { auth, createUserWithEmailAndPassword, updateProfile } = window.firebaseAuth;
            const { db, doc, setDoc, serverTimestamp } = window.firebaseDB;

            // Criar usuário no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.senha);
            const user = userCredential.user;

            // Atualizar nome de exibição
            await updateProfile(user, { displayName: userData.nome });

            // Salvar dados adicionais no Firestore
            await setDoc(doc(db, 'usuarios', user.uid), {
                nome: userData.nome,
                email: userData.email,
                telefone: userData.telefone || '',
                tipo: userData.tipo || 'turista',
                organizacao: userData.organizacao || '',
                ativo: true,
                role: 'user', // user, moderator, admin
                criadoEm: serverTimestamp(),
                verificado: false
            });

            return { 
                success: true, 
                message: 'Cadastro realizado com sucesso!',
                user: user
            };
        } catch (error) {
            console.error('Erro no cadastro:', error);
            let message = 'Erro ao criar conta.';
            
            if (error.code === 'auth/email-already-in-use') {
                message = 'Este e-mail já está cadastrado.';
            } else if (error.code === 'auth/weak-password') {
                message = 'A senha deve ter pelo menos 6 caracteres.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'E-mail inválido.';
            }
            
            return { success: false, message };
        }
    },

    // Fazer login
    login: async function(email, senha) {
        try {
            const { auth, signInWithEmailAndPassword } = window.firebaseAuth;
            
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            
            return { 
                success: true, 
                message: 'Login realizado com sucesso!',
                user: userCredential.user
            };
        } catch (error) {
            console.error('Erro no login:', error);
            let message = 'E-mail ou senha incorretos.';
            
            if (error.code === 'auth/user-not-found') {
                message = 'Usuário não encontrado.';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Senha incorreta.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Muitas tentativas. Tente novamente mais tarde.';
            }
            
            return { success: false, message };
        }
    },

    // Fazer logout
    logout: async function() {
        try {
            const { auth, signOut } = window.firebaseAuth;
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Erro no logout:', error);
            return { success: false, message: 'Erro ao sair.' };
        }
    },

    // Obter usuário atual
    getCurrentUser: function() {
        return currentUser;
    },

    // Verificar se está logado
    isLoggedIn: function() {
        return currentUser !== null;
    },

    // Verificar se é admin
    isAdmin: function() {
        return currentUser && currentUser.role === 'admin';
    },

    // Verificar se é moderador ou admin
    isModerator: function() {
        return currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');
    },

    // ========================================
    // GERENCIAMENTO DE USUÁRIOS (ADMIN)
    // ========================================

    // Listar todos os usuários
    getUsers: async function() {
        if (!this.isAdmin()) return [];
        
        try {
            const { db, collection, getDocs, orderBy, query } = window.firebaseDB;
            const q = query(collection(db, 'usuarios'), orderBy('criadoEm', 'desc'));
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            return [];
        }
    },

    // Alterar role do usuário
    setUserRole: async function(userId, newRole) {
        if (!this.isAdmin()) return { success: false, message: 'Permissão negada.' };
        
        try {
            const { db, doc, updateDoc } = window.firebaseDB;
            await updateDoc(doc(db, 'usuarios', userId), { role: newRole });
            return { success: true, message: 'Permissão atualizada!' };
        } catch (error) {
            console.error('Erro ao alterar role:', error);
            return { success: false, message: 'Erro ao atualizar permissão.' };
        }
    },

    // Ativar/Desativar usuário
    toggleUserStatus: async function(userId, ativo) {
        if (!this.isAdmin()) return { success: false, message: 'Permissão negada.' };
        
        try {
            const { db, doc, updateDoc } = window.firebaseDB;
            await updateDoc(doc(db, 'usuarios', userId), { ativo });
            return { success: true, message: ativo ? 'Usuário ativado!' : 'Usuário desativado!' };
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            return { success: false, message: 'Erro ao atualizar status.' };
        }
    },

    // ========================================
    // EVENTOS
    // ========================================

    // Submeter evento para aprovação
    submitEvent: async function(eventData) {
        if (!this.isLoggedIn()) {
            return { success: false, message: 'Você precisa estar logado.' };
        }

        try {
            const { db, collection, doc, setDoc, serverTimestamp } = window.firebaseDB;
            
            const eventId = 'evt_' + Date.now();
            await setDoc(doc(db, 'eventos_pendentes', eventId), {
                ...eventData,
                id: eventId,
                submittedBy: currentUser.uid,
                submittedByName: currentUser.nome,
                submittedByEmail: currentUser.email,
                status: 'pendente',
                submittedAt: serverTimestamp(),
                reviewedAt: null,
                reviewedBy: null,
                reviewNotes: ''
            });

            return {
                success: true,
                message: 'Evento enviado para análise! Você receberá uma notificação quando for aprovado.'
            };
        } catch (error) {
            console.error('Erro ao submeter evento:', error);
            return { success: false, message: 'Erro ao enviar evento.' };
        }
    },

    // Obter eventos pendentes (admin/moderador)
    getPendingEvents: async function() {
        if (!this.isModerator()) return [];
        
        try {
            const { db, collection, getDocs, query, where, orderBy } = window.firebaseDB;
            const q = query(
                collection(db, 'eventos_pendentes'),
                where('status', '==', 'pendente'),
                orderBy('submittedAt', 'desc')
            );
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Erro ao listar eventos pendentes:', error);
            return [];
        }
    },

    // Aprovar evento
    approveEvent: async function(eventId, notes = '') {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };
        
        try {
            const { db, doc, getDoc, setDoc, deleteDoc, serverTimestamp } = window.firebaseDB;
            
            // Buscar evento pendente
            const eventDoc = await getDoc(doc(db, 'eventos_pendentes', eventId));
            if (!eventDoc.exists()) {
                return { success: false, message: 'Evento não encontrado.' };
            }

            const eventData = eventDoc.data();
            
            // Mover para eventos aprovados
            await setDoc(doc(db, 'eventos_aprovados', eventId), {
                ...eventData,
                status: 'aprovado',
                reviewedAt: serverTimestamp(),
                reviewedBy: currentUser.uid,
                reviewNotes: notes
            });

            // Remover dos pendentes
            await deleteDoc(doc(db, 'eventos_pendentes', eventId));

            return { success: true, message: 'Evento aprovado com sucesso!' };
        } catch (error) {
            console.error('Erro ao aprovar evento:', error);
            return { success: false, message: 'Erro ao aprovar evento.' };
        }
    },

    // Rejeitar evento
    rejectEvent: async function(eventId, reason = '') {
        if (!this.isModerator()) return { success: false, message: 'Permissão negada.' };
        
        try {
            const { db, doc, updateDoc, serverTimestamp } = window.firebaseDB;
            
            await updateDoc(doc(db, 'eventos_pendentes', eventId), {
                status: 'rejeitado',
                reviewedAt: serverTimestamp(),
                reviewedBy: currentUser.uid,
                reviewNotes: reason
            });

            return { success: true, message: 'Evento rejeitado.' };
        } catch (error) {
            console.error('Erro ao rejeitar evento:', error);
            return { success: false, message: 'Erro ao rejeitar evento.' };
        }
    },

    // Obter eventos do usuário atual
    getUserEvents: async function() {
        if (!this.isLoggedIn()) return [];
        
        try {
            const { db, collection, getDocs, query, where } = window.firebaseDB;
            
            // Buscar pendentes
            const pendingQuery = query(
                collection(db, 'eventos_pendentes'),
                where('submittedBy', '==', currentUser.uid)
            );
            const pendingSnapshot = await getDocs(pendingQuery);
            const pending = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Buscar aprovados
            const approvedQuery = query(
                collection(db, 'eventos_aprovados'),
                where('submittedBy', '==', currentUser.uid)
            );
            const approvedSnapshot = await getDocs(approvedQuery);
            const approved = approvedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            return [...pending, ...approved];
        } catch (error) {
            console.error('Erro ao buscar eventos do usuário:', error);
            return [];
        }
    },

    // ========================================
    // ESTABELECIMENTOS
    // ========================================

    // Submeter estabelecimento
    submitEstablishment: async function(estData) {
        if (!this.isLoggedIn()) {
            return { success: false, message: 'Você precisa estar logado.' };
        }

        try {
            const { db, doc, setDoc, serverTimestamp } = window.firebaseDB;
            
            const estId = 'est_' + Date.now();
            await setDoc(doc(db, 'estabelecimentos_pendentes', estId), {
                ...estData,
                id: estId,
                submittedBy: currentUser.uid,
                submittedByName: currentUser.nome,
                submittedByEmail: currentUser.email,
                status: 'pendente',
                submittedAt: serverTimestamp()
            });

            return {
                success: true,
                message: 'Estabelecimento enviado para análise!'
            };
        } catch (error) {
            console.error('Erro ao submeter estabelecimento:', error);
            return { success: false, message: 'Erro ao enviar estabelecimento.' };
        }
    },

    // Obter estabelecimentos pendentes
    getPendingEstablishments: async function() {
        if (!this.isModerator()) return [];
        
        try {
            const { db, collection, getDocs, query, where, orderBy } = window.firebaseDB;
            const q = query(
                collection(db, 'estabelecimentos_pendentes'),
                where('status', '==', 'pendente')
            );
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Erro ao listar estabelecimentos pendentes:', error);
            return [];
        }
    },

    // ========================================
    // ESTATÍSTICAS (ADMIN)
    // ========================================

    getAdminStats: async function() {
        if (!this.isAdmin()) return null;

        try {
            const { db, collection, getDocs, query, where } = window.firebaseDB;

            const usersSnapshot = await getDocs(collection(db, 'usuarios'));
            const pendingEventsSnapshot = await getDocs(
                query(collection(db, 'eventos_pendentes'), where('status', '==', 'pendente'))
            );
            const approvedEventsSnapshot = await getDocs(collection(db, 'eventos_aprovados'));
            const pendingEstSnapshot = await getDocs(
                query(collection(db, 'estabelecimentos_pendentes'), where('status', '==', 'pendente'))
            );

            return {
                totalUsers: usersSnapshot.size,
                pendingEvents: pendingEventsSnapshot.size,
                approvedEvents: approvedEventsSnapshot.size,
                pendingEstablishments: pendingEstSnapshot.size
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return null;
        }
    },

    // ========================================
    // UI HELPERS
    // ========================================

    updateUI: function() {
        const user = this.getCurrentUser();
        
        // Atualizar botões de login/logout
        document.querySelectorAll('.auth-login-btn').forEach(btn => {
            btn.style.display = user ? 'none' : 'flex';
        });

        document.querySelectorAll('.auth-user-menu').forEach(menu => {
            menu.style.display = user ? 'flex' : 'none';
        });

        document.querySelectorAll('.auth-user-name').forEach(el => {
            if (user) {
                el.textContent = user.nome ? user.nome.split(' ')[0] : 'Usuário';
            }
        });

        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
    },

    showNotification: function(message, type = 'info') {
        const existingNotif = document.querySelector('.firebase-notification');
        if (existingNotif) existingNotif.remove();

        const notification = document.createElement('div');
        notification.className = `firebase-notification firebase-notif-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 1rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
};

// Criar primeiro admin (executar uma vez)
async function createFirstAdmin(email, senha, nome) {
    const result = await FirebaseSystem.register({
        nome: nome,
        email: email,
        senha: senha,
        tipo: 'admin'
    });

    if (result.success) {
        // Atualizar role para admin diretamente no Firestore
        const { db, doc, updateDoc } = window.firebaseDB;
        const { auth } = window.firebaseAuth;
        await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { role: 'admin' });
        console.log('✅ Admin criado com sucesso!');
    }

    return result;
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initFirebase);

// Exportar para uso global
window.FirebaseSystem = FirebaseSystem;
window.initFirebase = initFirebase;
window.createFirstAdmin = createFirstAdmin;
