/**
 * Sistema de Autenticação - Turismo São Mateus do Sul
 * Gerencia login, cadastro e sessões de usuários
 */

const AuthSystem = {
    // Chaves do localStorage
    KEYS: {
        USERS: 'sms_usuarios',
        CURRENT_USER: 'sms_usuario_atual',
        PENDING_EVENTS: 'sms_eventos_pendentes',
        APPROVED_EVENTS: 'sms_eventos_aprovados',
        PENDING_ESTABLISHMENTS: 'sms_estabelecimentos_pendentes'
    },

    // Tipos de usuário
    USER_TYPES: {
        TURISTA: 'turista',
        ORGANIZADOR: 'organizador',
        ESTABELECIMENTO: 'estabelecimento',
        ADMIN: 'admin'
    },

    // Inicializar sistema
    init: function() {
        this.createDefaultAdmin();
        this.updateAuthUI();
        this.setupEventListeners();
    },

    // Criar administrador padrão se não existir
    createDefaultAdmin: function() {
        const users = this.getUsers();
        const adminExists = users.some(u => u.tipo === this.USER_TYPES.ADMIN);
        
        if (!adminExists) {
            users.push({
                id: 'admin_001',
                nome: 'Administrador',
                email: 'admin@saomateusdosul.tur.br',
                senha: this.hashPassword('admin2026'),
                tipo: this.USER_TYPES.ADMIN,
                ativo: true,
                criadoEm: new Date().toISOString(),
                verificado: true
            });
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        }
    },

    // Obter lista de usuários
    getUsers: function() {
        return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
    },

    // Hash simples para senha (em produção usar bcrypt no backend)
    hashPassword: function(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    },

    // Cadastrar novo usuário
    register: function(userData) {
        const users = this.getUsers();
        
        // Verificar se email já existe
        if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            return { success: false, message: 'Este e-mail já está cadastrado.' };
        }

        // Validações
        if (!userData.nome || userData.nome.length < 3) {
            return { success: false, message: 'Nome deve ter pelo menos 3 caracteres.' };
        }
        
        if (!this.validateEmail(userData.email)) {
            return { success: false, message: 'E-mail inválido.' };
        }
        
        if (!userData.senha || userData.senha.length < 6) {
            return { success: false, message: 'Senha deve ter pelo menos 6 caracteres.' };
        }

        // Criar novo usuário
        const newUser = {
            id: 'user_' + Date.now(),
            nome: userData.nome,
            email: userData.email.toLowerCase(),
            senha: this.hashPassword(userData.senha),
            telefone: userData.telefone || '',
            tipo: userData.tipo || this.USER_TYPES.TURISTA,
            organizacao: userData.organizacao || '',
            documento: userData.documento || '',
            ativo: true,
            criadoEm: new Date().toISOString(),
            verificado: false
        };

        users.push(newUser);
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));

        return { 
            success: true, 
            message: 'Cadastro realizado com sucesso!',
            user: this.sanitizeUser(newUser)
        };
    },

    // Fazer login
    login: function(email, senha) {
        const users = this.getUsers();
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.senha === this.hashPassword(senha)
        );

        if (!user) {
            return { success: false, message: 'E-mail ou senha incorretos.' };
        }

        if (!user.ativo) {
            return { success: false, message: 'Conta desativada. Entre em contato com o suporte.' };
        }

        // Salvar sessão
        const sessionUser = this.sanitizeUser(user);
        localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(sessionUser));

        this.updateAuthUI();

        return { 
            success: true, 
            message: 'Login realizado com sucesso!',
            user: sessionUser
        };
    },

    // Fazer logout
    logout: function() {
        localStorage.removeItem(this.KEYS.CURRENT_USER);
        this.updateAuthUI();
        
        // Redirecionar se estiver em área restrita
        const restrictedPages = ['portal-usuario.html', 'admin.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (restrictedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    },

    // Obter usuário atual
    getCurrentUser: function() {
        const userData = localStorage.getItem(this.KEYS.CURRENT_USER);
        return userData ? JSON.parse(userData) : null;
    },

    // Verificar se está logado
    isLoggedIn: function() {
        return this.getCurrentUser() !== null;
    },

    // Verificar se é admin
    isAdmin: function() {
        const user = this.getCurrentUser();
        return user && user.tipo === this.USER_TYPES.ADMIN;
    },

    // Remover dados sensíveis do usuário
    sanitizeUser: function(user) {
        const { senha, ...safeUser } = user;
        return safeUser;
    },

    // Validar e-mail
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Atualizar UI com base no estado de autenticação
    updateAuthUI: function() {
        const user = this.getCurrentUser();
        const authButtons = document.querySelectorAll('.auth-login-btn');
        const userMenus = document.querySelectorAll('.auth-user-menu');
        const userNames = document.querySelectorAll('.auth-user-name');

        authButtons.forEach(btn => {
            btn.style.display = user ? 'none' : 'flex';
        });

        userMenus.forEach(menu => {
            menu.style.display = user ? 'flex' : 'none';
        });

        userNames.forEach(el => {
            if (user) {
                el.textContent = user.nome.split(' ')[0];
            }
        });
    },

    // Configurar event listeners
    setupEventListeners: function() {
        // Formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const senha = document.getElementById('loginSenha').value;
                const result = this.login(email, senha);
                
                if (result.success) {
                    this.showNotification(result.message, 'success');
                    this.closeModal('loginModal');
                    setTimeout(() => location.reload(), 500);
                } else {
                    this.showNotification(result.message, 'error');
                }
            });
        }

        // Formulário de cadastro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const userData = {
                    nome: document.getElementById('regNome').value,
                    email: document.getElementById('regEmail').value,
                    senha: document.getElementById('regSenha').value,
                    telefone: document.getElementById('regTelefone')?.value || '',
                    tipo: document.getElementById('regTipo')?.value || this.USER_TYPES.TURISTA,
                    organizacao: document.getElementById('regOrganizacao')?.value || '',
                    documento: document.getElementById('regDocumento')?.value || ''
                };

                // Verificar confirmação de senha
                const senhaConfirm = document.getElementById('regSenhaConfirm')?.value;
                if (senhaConfirm && userData.senha !== senhaConfirm) {
                    this.showNotification('As senhas não coincidem.', 'error');
                    return;
                }

                const result = this.register(userData);
                
                if (result.success) {
                    this.showNotification(result.message, 'success');
                    this.closeModal('registerModal');
                    // Auto login após cadastro
                    this.login(userData.email, userData.senha);
                    setTimeout(() => location.reload(), 500);
                } else {
                    this.showNotification(result.message, 'error');
                }
            });
        }
    },

    // Mostrar notificação
    showNotification: function(message, type = 'info') {
        const existingNotif = document.querySelector('.auth-notification');
        if (existingNotif) existingNotif.remove();

        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notif-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    },

    // Abrir modal
    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    // Fechar modal
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // ========================================
    // SISTEMA DE EVENTOS
    // ========================================

    // Submeter evento para aprovação
    submitEvent: function(eventData) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, message: 'Você precisa estar logado para cadastrar eventos.' };
        }

        // Validações
        if (!eventData.nome || eventData.nome.length < 5) {
            return { success: false, message: 'Nome do evento deve ter pelo menos 5 caracteres.' };
        }
        
        if (!eventData.dataInicio) {
            return { success: false, message: 'Data de início é obrigatória.' };
        }

        if (!eventData.local) {
            return { success: false, message: 'Local do evento é obrigatório.' };
        }

        if (!eventData.descricao || eventData.descricao.length < 20) {
            return { success: false, message: 'Descrição deve ter pelo menos 20 caracteres.' };
        }

        const pendingEvents = JSON.parse(localStorage.getItem(this.KEYS.PENDING_EVENTS) || '[]');

        const newEvent = {
            id: 'evt_' + Date.now(),
            ...eventData,
            submittedBy: user.id,
            submittedByName: user.nome,
            submittedByEmail: user.email,
            status: 'pendente',
            submittedAt: new Date().toISOString(),
            reviewedAt: null,
            reviewedBy: null,
            reviewNotes: ''
        };

        pendingEvents.push(newEvent);
        localStorage.setItem(this.KEYS.PENDING_EVENTS, JSON.stringify(pendingEvents));

        return {
            success: true,
            message: 'Evento enviado para análise! Você receberá uma notificação quando for aprovado.',
            event: newEvent
        };
    },

    // Obter eventos pendentes (admin)
    getPendingEvents: function() {
        return JSON.parse(localStorage.getItem(this.KEYS.PENDING_EVENTS) || '[]');
    },

    // Aprovar evento (admin)
    approveEvent: function(eventId, notes = '') {
        if (!this.isAdmin()) {
            return { success: false, message: 'Permissão negada.' };
        }

        const pendingEvents = this.getPendingEvents();
        const eventIndex = pendingEvents.findIndex(e => e.id === eventId);

        if (eventIndex === -1) {
            return { success: false, message: 'Evento não encontrado.' };
        }

        const event = pendingEvents[eventIndex];
        event.status = 'aprovado';
        event.reviewedAt = new Date().toISOString();
        event.reviewedBy = this.getCurrentUser().id;
        event.reviewNotes = notes;

        // Mover para eventos aprovados
        const approvedEvents = JSON.parse(localStorage.getItem(this.KEYS.APPROVED_EVENTS) || '[]');
        approvedEvents.push(event);
        localStorage.setItem(this.KEYS.APPROVED_EVENTS, JSON.stringify(approvedEvents));

        // Remover dos pendentes
        pendingEvents.splice(eventIndex, 1);
        localStorage.setItem(this.KEYS.PENDING_EVENTS, JSON.stringify(pendingEvents));

        return {
            success: true,
            message: 'Evento aprovado com sucesso!',
            event: event
        };
    },

    // Rejeitar evento (admin)
    rejectEvent: function(eventId, reason = '') {
        if (!this.isAdmin()) {
            return { success: false, message: 'Permissão negada.' };
        }

        const pendingEvents = this.getPendingEvents();
        const eventIndex = pendingEvents.findIndex(e => e.id === eventId);

        if (eventIndex === -1) {
            return { success: false, message: 'Evento não encontrado.' };
        }

        const event = pendingEvents[eventIndex];
        event.status = 'rejeitado';
        event.reviewedAt = new Date().toISOString();
        event.reviewedBy = this.getCurrentUser().id;
        event.reviewNotes = reason;

        // Manter na lista mas com status rejeitado
        pendingEvents[eventIndex] = event;
        localStorage.setItem(this.KEYS.PENDING_EVENTS, JSON.stringify(pendingEvents));

        return {
            success: true,
            message: 'Evento rejeitado.',
            event: event
        };
    },

    // Obter eventos do usuário atual
    getUserEvents: function() {
        const user = this.getCurrentUser();
        if (!user) return [];

        const pending = this.getPendingEvents().filter(e => e.submittedBy === user.id);
        const approved = JSON.parse(localStorage.getItem(this.KEYS.APPROVED_EVENTS) || '[]')
            .filter(e => e.submittedBy === user.id);

        return [...pending, ...approved].sort((a, b) => 
            new Date(b.submittedAt) - new Date(a.submittedAt)
        );
    },

    // ========================================
    // SISTEMA DE ESTABELECIMENTOS
    // ========================================

    // Submeter estabelecimento para cadastro
    submitEstablishment: function(estData) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, message: 'Você precisa estar logado.' };
        }

        // Validações
        if (!estData.nome || estData.nome.length < 3) {
            return { success: false, message: 'Nome do estabelecimento é obrigatório.' };
        }

        if (!estData.categoria) {
            return { success: false, message: 'Categoria é obrigatória.' };
        }

        if (!estData.endereco) {
            return { success: false, message: 'Endereço é obrigatório.' };
        }

        const pendingEstablishments = JSON.parse(
            localStorage.getItem(this.KEYS.PENDING_ESTABLISHMENTS) || '[]'
        );

        const newEst = {
            id: 'est_' + Date.now(),
            ...estData,
            submittedBy: user.id,
            submittedByName: user.nome,
            submittedByEmail: user.email,
            status: 'pendente',
            submittedAt: new Date().toISOString()
        };

        pendingEstablishments.push(newEst);
        localStorage.setItem(this.KEYS.PENDING_ESTABLISHMENTS, JSON.stringify(pendingEstablishments));

        return {
            success: true,
            message: 'Estabelecimento enviado para análise!',
            establishment: newEst
        };
    },

    // Obter estatísticas para admin
    getAdminStats: function() {
        if (!this.isAdmin()) return null;

        return {
            totalUsers: this.getUsers().length,
            pendingEvents: this.getPendingEvents().filter(e => e.status === 'pendente').length,
            approvedEvents: JSON.parse(localStorage.getItem(this.KEYS.APPROVED_EVENTS) || '[]').length,
            pendingEstablishments: JSON.parse(
                localStorage.getItem(this.KEYS.PENDING_ESTABLISHMENTS) || '[]'
            ).filter(e => e.status === 'pendente').length
        };
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    AuthSystem.init();
});

// Exportar para uso global
window.AuthSystem = AuthSystem;
