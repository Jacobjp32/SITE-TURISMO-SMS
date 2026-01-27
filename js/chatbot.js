/**
 * ============================================================
 * CHATBOT DE ATENDIMENTO - VERSÃO 2.0
 * ============================================================
 * 
 * Chatbot com respostas pré-definidas para dúvidas frequentes.
 * Pode ser integrado a APIs de IA (ChatGPT, Claude) no futuro.
 */

const Chatbot = {
    
    // Configurações
    config: {
        nome: 'Mathe',
        avatar: '🧉',
        corPrimaria: '#0a3d2e',
        mensagemInicial: 'Olá! Sou o Mathe, assistente virtual do Turismo de São Mateus do Sul. Como posso ajudar?'
    },
    
    // Base de conhecimento
    respostas: {
        // Saudações
        'ola': 'Olá! Seja bem-vindo ao Portal de Turismo de São Mateus do Sul! 🌿 Como posso ajudar?',
        'oi': 'Oi! Que bom ter você aqui! O que gostaria de saber sobre nossa cidade?',
        'bom dia': 'Bom dia! ☀️ Pronto para conhecer a Capital Polonesa do Paraná?',
        'boa tarde': 'Boa tarde! 🌤️ Em que posso ajudar?',
        'boa noite': 'Boa noite! 🌙 Mesmo à noite, estou aqui para ajudar!',
        
        // Informações turísticas
        'atracoes': 'São Mateus do Sul tem muitas atrações! 🏛️\n\n• Igreja Matriz (arquitetura neogótica)\n• Rio Iguaçu (passeios de barco)\n• Rua do Mathe (erva-mate)\n• Igrejas históricas polonesas\n• Praça do Rio Iguaçu\n\nQuer saber mais sobre alguma?',
        'o que fazer': 'Temos 4 rotas turísticas principais:\n\n🧉 Rota da Erva-Mate\n🇵🇱 Cultura Polonesa\n⛪ Turismo de Fé\n🌊 Náutica e Natureza\n\nVisite nossa página "O Que Fazer" para detalhes!',
        'erva-mate': 'São Mateus é terra do "Ouro Verde"! 🧉\n\nNossa erva-mate tem Indicação Geográfica (IG São Matheus). Visite:\n• Rua do Mathe (lojas e degustação)\n• Ervateiras tradicionais\n• Chimarródromo\n\nExperimente o autêntico chimarrão paranaense!',
        'polonesa': 'Somos a Capital Polonesa do Paraná! 🇵🇱\n\nDescubra:\n• Igrejas centenárias (Água Branca, Taquaral)\n• Gastronomia (Pierogi, Golabki)\n• Festas tradicionais\n• Arquitetura em madeira\n• Grupo folclórico Karolinka',
        
        // Gastronomia
        'restaurante': 'Recomendo experimentar:\n\n🥟 Pierogi (pastel polonês)\n🥬 Golabki (charuto de repolho)\n🧀 Queijos artesanais\n🍞 Pães coloniais\n🧉 Chimarrão\n\nVisite a página "Sabores" para ver restaurantes!',
        'comida': 'Nossa gastronomia é rica em tradições polonesas! 🍽️\n\nPratos típicos: Pierogi, Golabki, Borscht, Makowiec...\n\nA Feira Gastronômica acontece toda semana na Rua do Mathe!',
        'pierogi': 'Pierogi é o prato símbolo da cultura polonesa! 🥟\n\nSão pastéis recheados com:\n• Batata e queijo\n• Repolho\n• Carne\n• Frutas (doce)\n\nEncontre nos restaurantes poloneses da cidade!',
        
        // Hospedagem
        'hotel': 'Temos várias opções de hospedagem! 🏨\n\n• Hotéis no centro\n• Pousadas rurais\n• Chalés\n\nVisite a página "Onde Ficar" para ver todas as opções com contatos.',
        'onde ficar': 'A página "Onde Ficar" tem todas as hospedagens!\n\nDica: reserve com antecedência em época de eventos como o AgroSamas e festas polonesas.',
        
        // Eventos
        'eventos': 'Confira nosso Calendário de Eventos 2026! 📅\n\nDestaques:\n• 5º AgroSamas (Setembro)\n• Polskie Smaki (Agosto)\n• Festas religiosas\n• Feiras semanais\n\nAcesse eventos.html para ver tudo!',
        'agrosamas': '🎪 O AgroSamas é nosso maior evento!\n\n📅 17 a 21 de Setembro de 2026\n📍 Rua do Mathe\n🆓 Entrada Gratuita\n\nShows nacionais, feira gastronômica, exposição agro e muito mais!\n\nSite: agrosamas.com.br',
        
        // Contato
        'contato': 'Entre em contato conosco:\n\n📞 (42) 3532-0000\n📧 turismo@saomateusdosul.pr.gov.br\n📍 Chalé da Cultura - Praça do Rio Iguaçu\n\nAtendimento: Seg-Sex 8h-17h, Sáb 9h-13h',
        'telefone': '📞 Telefone: (42) 3532-0000',
        'email': '📧 Email: turismo@saomateusdosul.pr.gov.br',
        'horario': '🕐 Atendimento ao turista:\nSegunda a Sexta: 8h às 17h\nSábado: 9h às 13h',
        
        // Localização
        'como chegar': '📍 São Mateus do Sul fica a:\n\n• 150 km de Curitiba (2h de carro)\n• 60 km de União da Vitória\n\nAcesso pela BR-476 ou PR-364.',
        'onde fica': 'São Mateus do Sul está no sul do Paraná, às margens do Rio Iguaçu.\n\nCoordenadas: -25.87, -50.38\n\nÀ 150km de Curitiba!',
        
        // Fallback
        'default': 'Não entendi bem sua pergunta. 🤔\n\nPosso ajudar com:\n• Atrações turísticas\n• Gastronomia polonesa\n• Eventos\n• Hospedagem\n• Como chegar\n• Contato\n\nO que gostaria de saber?'
    },
    
    // Estado do chat
    isOpen: false,
    mensagens: [],
    
    // Inicializar chatbot
    init: function() {
        this.renderWidget();
        this.bindEvents();
        console.log('🤖 Chatbot iniciado');
    },
    
    // Renderizar widget do chat
    renderWidget: function() {
        const widget = document.createElement('div');
        widget.id = 'chatbot-widget';
        widget.innerHTML = `
            <button class="chatbot-trigger" id="chatbot-trigger" aria-label="Abrir chat">
                <span class="chatbot-avatar">${this.config.avatar}</span>
                <span class="chatbot-badge">1</span>
            </button>
            
            <div class="chatbot-window" id="chatbot-window">
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <span class="chatbot-header-avatar">${this.config.avatar}</span>
                        <div>
                            <strong>${this.config.nome}</strong>
                            <span class="chatbot-status">Online</span>
                        </div>
                    </div>
                    <button class="chatbot-close" id="chatbot-close">×</button>
                </div>
                
                <div class="chatbot-messages" id="chatbot-messages">
                    <!-- Mensagens aparecerão aqui -->
                </div>
                
                <div class="chatbot-suggestions" id="chatbot-suggestions">
                    <button data-msg="O que fazer">🏛️ O que fazer</button>
                    <button data-msg="Restaurantes">🍽️ Onde comer</button>
                    <button data-msg="Eventos">📅 Eventos</button>
                    <button data-msg="Contato">📞 Contato</button>
                </div>
                
                <form class="chatbot-input" id="chatbot-form">
                    <input type="text" id="chatbot-input" placeholder="Digite sua pergunta..." autocomplete="off">
                    <button type="submit">➤</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(widget);
        this.injetarEstilos();
        
        // Mensagem inicial após delay
        setTimeout(() => {
            this.adicionarMensagem(this.config.mensagemInicial, 'bot');
        }, 1000);
    },
    
    // Injetar estilos
    injetarEstilos: function() {
        const styles = document.createElement('style');
        styles.textContent = `
            #chatbot-widget {
                position: fixed;
                bottom: 90px;
                right: 20px;
                z-index: 99999;
                font-family: var(--font-body, 'Raleway', sans-serif);
            }
            
            .chatbot-trigger {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: ${this.config.corPrimaria};
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                transition: all 0.3s;
                position: relative;
                z-index: 99999;
            }
            
            .chatbot-trigger:hover {
                transform: scale(1.1);
            }
            
            .chatbot-avatar {
                font-size: 2rem;
            }
            
            .chatbot-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #e74c3c;
                color: white;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                font-size: 12px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .chatbot-window {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                display: none;
                flex-direction: column;
                z-index: 99999;
                overflow: hidden;
            }
            
            .chatbot-window.active {
                display: flex;
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .chatbot-header {
                background: ${this.config.corPrimaria};
                color: white;
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chatbot-header-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .chatbot-header-avatar {
                font-size: 1.5rem;
            }
            
            .chatbot-status {
                display: block;
                font-size: 0.75rem;
                opacity: 0.8;
            }
            
            .chatbot-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                transition: background 0.3s;
            }
            
            .chatbot-close:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .chatbot-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .chatbot-msg {
                max-width: 85%;
                padding: 0.75rem 1rem;
                border-radius: 15px;
                line-height: 1.4;
                font-size: 0.9rem;
                white-space: pre-line;
            }
            
            .chatbot-msg.bot {
                background: #f0f2f5;
                align-self: flex-start;
                border-bottom-left-radius: 5px;
            }
            
            .chatbot-msg.user {
                background: ${this.config.corPrimaria};
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 5px;
            }
            
            .chatbot-suggestions {
                padding: 0.5rem 1rem;
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                border-top: 1px solid #eee;
            }
            
            .chatbot-suggestions button {
                background: #f0f2f5;
                border: none;
                padding: 0.4rem 0.8rem;
                border-radius: 15px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .chatbot-suggestions button:hover {
                background: ${this.config.corPrimaria};
                color: white;
            }
            
            .chatbot-input {
                display: flex;
                padding: 0.75rem;
                gap: 0.5rem;
                border-top: 1px solid #eee;
            }
            
            .chatbot-input input {
                flex: 1;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 0.6rem 1rem;
                font-size: 0.9rem;
            }
            
            .chatbot-input input:focus {
                outline: none;
                border-color: ${this.config.corPrimaria};
            }
            
            .chatbot-input button {
                background: ${this.config.corPrimaria};
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .chatbot-input button:hover {
                transform: scale(1.1);
            }
            
            @media (max-width: 500px) {
                .chatbot-window {
                    width: calc(100vw - 40px);
                    height: 60vh;
                    bottom: 70px;
                    right: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    },
    
    // Bind eventos
    bindEvents: function() {
        const trigger = document.getElementById('chatbot-trigger');
        const close = document.getElementById('chatbot-close');
        const form = document.getElementById('chatbot-form');
        const suggestions = document.getElementById('chatbot-suggestions');
        
        trigger.addEventListener('click', () => this.toggle());
        close.addEventListener('click', () => this.fechar());
        form.addEventListener('submit', (e) => this.enviarMensagem(e));
        
        suggestions.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const msg = e.target.dataset.msg;
                this.processarMensagem(msg);
            }
        });
    },
    
    // Toggle chat
    toggle: function() {
        this.isOpen ? this.fechar() : this.abrir();
    },
    
    // Abrir chat
    abrir: function() {
        const window = document.getElementById('chatbot-window');
        const badge = document.querySelector('.chatbot-badge');
        window.classList.add('active');
        badge.style.display = 'none';
        this.isOpen = true;
    },
    
    // Fechar chat
    fechar: function() {
        const window = document.getElementById('chatbot-window');
        window.classList.remove('active');
        this.isOpen = false;
    },
    
    // Enviar mensagem
    enviarMensagem: function(e) {
        e.preventDefault();
        const input = document.getElementById('chatbot-input');
        const msg = input.value.trim();
        
        if (!msg) return;
        
        this.processarMensagem(msg);
        input.value = '';
    },
    
    // Processar mensagem
    processarMensagem: function(msg) {
        this.adicionarMensagem(msg, 'user');
        
        // Simular delay de digitação
        setTimeout(() => {
            const resposta = this.encontrarResposta(msg);
            this.adicionarMensagem(resposta, 'bot');
        }, 500 + Math.random() * 500);
    },
    
    // Encontrar resposta
    encontrarResposta: function(msg) {
        const msgLower = msg.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
        
        // Procurar por palavras-chave
        for (const [chave, resposta] of Object.entries(this.respostas)) {
            if (chave === 'default') continue;
            if (msgLower.includes(chave)) {
                return resposta;
            }
        }
        
        return this.respostas.default;
    },
    
    // Adicionar mensagem na tela
    adicionarMensagem: function(texto, tipo) {
        const container = document.getElementById('chatbot-messages');
        const msg = document.createElement('div');
        msg.className = `chatbot-msg ${tipo}`;
        msg.textContent = texto;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
        
        this.mensagens.push({ texto, tipo, timestamp: new Date() });
    }
};

// Auto-inicializar se funcionalidade estiver ativa
document.addEventListener('DOMContentLoaded', function() {
    if (window.CONFIG && window.CONFIG.funcionalidades && window.CONFIG.funcionalidades.chatbot) {
        Chatbot.init();
    }
});

// Exportar
window.Chatbot = Chatbot;
