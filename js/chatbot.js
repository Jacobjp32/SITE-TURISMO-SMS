/**
 * ============================================================
 * CHATBOT DE ATENDIMENTO - VERSÃO 3.0 (CORRIGIDO)
 * ============================================================
 */

(function() {
    'use strict';
    
    var Chatbot = {
        
        config: {
            nome: 'Mathe',
            avatar: '🧉',
            corPrimaria: '#0a3d2e',
            mensagemInicial: 'Olá! Sou o Mathe, assistente virtual do Turismo de São Mateus do Sul. Como posso ajudar?'
        },
        
        respostas: {
            // Saudações
            'ola': 'Olá! Seja bem-vindo ao Portal de Turismo de São Mateus do Sul! 🌿 Como posso ajudar?',
            'oi': 'Oi! Que bom ter você aqui! O que gostaria de saber sobre nossa cidade?',
            'bom dia': 'Bom dia! ☀️ Pronto para conhecer a Capital Polonesa do Paraná?',
            'boa tarde': 'Boa tarde! 🌤️ Em que posso ajudar?',
            'boa noite': 'Boa noite! 🌙 Mesmo à noite, estou aqui para ajudar!',

            // Atrações
            'atracoes': 'São Mateus do Sul tem muitas atrações! 🏛️\n\n• Igreja Matriz neogótica (centro)\n• Rio Iguaçu (passeios de barco, canoagem)\n• Rua do Mathe (erva-mate, gastronomia)\n• Igrejas históricas polonesas no interior\n• Praça do Rio Iguaçu\n\nQuer saber mais sobre alguma?',
            'o que fazer': 'Temos 6 rotas turísticas! 🗺️\n\n🧉 Rota da Erva-Mate\n🇵🇱 Cultura Polonesa\n⛪ Turismo de Fé\n🌊 Náutica e Natureza\n🍓 Sabores & Memórias\n🌱 Rota da Terra\n\nVisite a página "O Que Fazer" para detalhes!',
            'rota': 'Nossas 6 rotas turísticas:\n\n🧉 Rota da Erva-Mate (IG São Matheus)\n🇵🇱 Cultura Polonesa (folclore, festas)\n⛪ Turismo de Fé (igrejas centenárias)\n🌊 Rota das Águas (Rio Iguaçu)\n🍓 Sabores & Memórias (café colonial)\n🌱 Rota da Terra (agroecologia)',

            // Erva-mate
            'erva-mate': 'São Mateus é terra do "Ouro Verde"! 🧉\n\nNossa erva-mate tem Indicação Geográfica (IG São Matheus). Visite:\n• Rua do Mathe (lojas e degustação)\n• Ervateiras tradicionais\n• Chimarródromo',
            'mate': 'A erva-mate de São Mateus tem Indicação Geográfica! 🧉\nVisite a Rua do Mathe, o Chimarródromo e as ervateiras da região.',

            // Cultura polonesa
            'polonesa': 'Somos a Capital Polonesa do Paraná! 🇵🇱\n\nDescubra:\n• Igrejas centenárias construídas por imigrantes\n• Gastronomia (Pierogi, Golabki, Borscht)\n• Baile do Pierogi (Abril) e Polskie Smaki (Agosto)\n• Grupo folclórico Karolinka\n• Mês Polonês — agosto inteiro de eventos!',
            'polskie': 'A 7ª Polskie Smaki será em 29/08/2026! 🇵🇱\nDesfile na Av. Ozy Mendonça, comidas polonesas na Rua do Mathe e Concurso Papa Pierogi. Não perca!',
            'pierogi': 'O Baile do Pierogi é em 25/04/2026 no CEPOM, a partir das 21h30! 🥟\nMais de 29 anos de história. Abertura da Vodka Polonesa, escolha da rainha e o tradicional pierogi ao molho.',

            // Gastronomia
            'restaurante': 'Nossa gastronomia é incrível! 🍽️\n\nRecomendo experimentar:\n🥟 Pierogi (pastel polonês autêntico)\n🥬 Golabki (charuto de repolho)\n🧀 Queijos artesanais\n🍞 Pães coloniais\n🍓 Morangos da colheita própria\n🧉 Chimarrão com erva-mate IG',
            'comida': 'Nossa gastronomia mistura tradições polonesas e caipiras! 🍽️\nPratos típicos: Pierogi, Golabki, Borscht, Makowiec, queijos artesanais, café colonial.',
            'feira': 'A Feira Gastronômica acontece toda quarta e sexta, das 17h às 22h na Rua do Mathe! 🏪\nA Feira do Produtor é todo sábado, das 7h às 12h, com produtos frescos direto do campo.',
            'gastronom': 'Nossa gastronomia tem tradições polonesas! 🍽️\nFeira Gastronômica: quarta e sexta, 17h-22h.\nFeira do Produtor: sábados, 7h-12h. Ambas na Rua do Mathe!',

            // Hospedagem
            'hotel': 'Temos várias opções de hospedagem! 🏨\n\n• Hotéis no centro da cidade\n• Pousadas rurais nas colônias\n• Chalés com vista para o campo\n\nConsulte a página "Onde Ficar" para mais informações!',
            'hospedagem': 'Para se hospedar em São Mateus do Sul consulte nossa página "Onde Ficar"! 🏨',
            'pousada': 'Temos pousadas rurais incríveis! 🏡\nAlgumas ficam nas próprias colônias polonesas, com café colonial incluso.',

            // Eventos — CALENDÁRIO 2026
            'eventos': 'Nosso Calendário 2026 tem mais de 280 eventos! 📅\n\nDestaques:\n• Baile do Pierogi — 25/04\n• Miss Paraná Internacional — Jun\n• Mês Polonês + Festival do Cordeiro — Agosto\n• 7ª Polskie Smaki — 29/08\n• V AgroSamas — 18-21/09\n• Natal Ouro Verde — Dez',
            'agrosamas': 'O V AgroSamas 2026 será de 18 a 21 de setembro! 🌿\nMaior evento do município com shows nacionais, feira gastronômica, exposição agropecuária e parque de diversões. Entrada gratuita!',
            'agro': 'O V AgroSamas 2026 acontece de 18 a 21/09 na Rua do Mathe! 🌿 Shows, gastronomia e exposições. Entrada gratuita!',
            'natal': 'O Natal Ouro Verde em Família ocorre de 6 a 20/12/2026! 🎄\nDesfiles natalinos, shows, chegada do Papai Noel e feira gastronômica permanente.',
            'mes polones': 'O Mês Polonês em agosto é espetacular! 🇵🇱\nBaile Polonês (01/08), Festival do Cordeiro (07-09/08), Jantar Polonês (08/08), Polskie Smaki (29/08) e muito mais!',
            'cordeiro': 'O Festival do Cordeiro será de 7 a 9 de agosto de 2026! 🐑\nGastronomia de cordeiro, shows nativistas, duelo de laço e exposição de ovinos.',
            'samas run': 'O 4º Desafio Samas Run Internacional 7K será em 12/07/2026! 🏃\nLocal: Parque de Exposições.',

            // Contato
            'contato': 'Entre em contato com o Turismo:\n\n📞 (42) 3532-0000\n📧 turismo@saomateusdosul.pr.gov.br\n📍 Rua Barão do Rio Branco, Centro\n🏡 Chalé da Cultura — Praça do Rio Iguaçu',
            'telefone': '📞 Secretaria de Turismo: (42) 3532-0000',
            'email': '📧 E-mail: turismo@saomateusdosul.pr.gov.br',

            // Como chegar
            'como chegar': '📍 São Mateus do Sul fica a:\n\n• 150 km de Curitiba (BR-376, aprox. 2h)\n• 60 km de União da Vitória\nO aeroporto mais próximo é em Curitiba (Afonso Pena).',
            'curitiba': 'De Curitiba até São Mateus do Sul são cerca de 150 km pela BR-376, aproximadamente 2 horas de carro! 🚗',

            // Galeria
            'galeria': 'Nossa Galeria tem fotos e vídeos incríveis! 📸\n\n🏠 Patrimônio Histórico (Igreja Água Branca)\n🌊 Belezas Naturais\n🍽️ Gastronomia\n🎭 Eventos e Tradições\n🎨 Arte & História\n🎥 Vídeos das rotas turísticas\n\nAcesse galeria.html para ver tudo!',
            'foto': 'Temos uma galeria completa de fotos e vídeos! Acesse a página Galeria no menu. 📸',
            'video': 'Temos vídeos institucionais e das rotas turísticas na Galeria! Incluindo vídeos no YouTube e arquivos locais em alta qualidade. 🎥',

            // Reservas
            'reserva': 'Você pode reservar atividades turísticas pelo nosso portal! 📝\n\nAcesse a página Reservas para agendar:\n• Passeios de barco no Rio Iguaçu\n• Visitas guiadas\n• Degustações de erva-mate\n• Rotas rurais\n\nOu ligue: (42) 3532-0000',
            'agendar': 'Para agendar atividades turísticas acesse a página de Reservas ou ligue (42) 3532-0000! 📝',

            // Igreja Água Branca
            'agua branca': 'A Igreja Água Branca é uma joia da arquitetura polonesa rural! ⛪\n\nConstruida pelos imigrantes poloneses no séc. XIX, é um dos pontos mais fotográficos da região. Veja fotos na nossa Galeria!',
            'igreja': 'São Mateus tem igrejas históricas incríveis! ⛪\n\n• Igreja Matriz — neogótica no centro\n• Igreja Água Branca — arquitetura polonesa rural\n• Diversas capelas nas colônias\n• Santuário de N. Sra. Częstochowa',

            // Default
            'default': 'Não entendi bem sua pergunta. 🤔\n\nPosso ajudar com:\n• Atrações e rotas turísticas\n• Galeria de fotos e vídeos\n• Gastronomia polonesa\n• Eventos 2026 (AgroSamas, Polskie Smaki...)\n• Reservas de atividades\n• Hospedagem\n• Como chegar\n• Contato da Secretaria'
        },
        
        isOpen: false,
        isInitialized: false,
        
        init: function() {
            if (this.isInitialized) {
                console.log('🤖 Chatbot já inicializado');
                return;
            }
            
            console.log('🤖 Inicializando Chatbot...');
            
            try {
                this.renderWidget();
                this.bindEvents();
                this.isInitialized = true;
                console.log('✅ Chatbot iniciado com sucesso!');
            } catch (error) {
                console.error('❌ Erro ao inicializar chatbot:', error);
            }
        },
        
        renderWidget: function() {
            var existingWidget = document.getElementById('chatbot-widget');
            if (existingWidget) {
                existingWidget.remove();
            }
            
            var widget = document.createElement('div');
            widget.id = 'chatbot-widget';
            widget.innerHTML = 
                '<button class="chatbot-trigger" id="chatbot-trigger" type="button">' +
                    '<span class="chatbot-avatar">' + this.config.avatar + '</span>' +
                    '<span class="chatbot-badge">1</span>' +
                '</button>' +
                '<div class="chatbot-window" id="chatbot-window">' +
                    '<div class="chatbot-header">' +
                        '<div class="chatbot-header-info">' +
                            '<span class="chatbot-header-avatar">' + this.config.avatar + '</span>' +
                            '<div><strong>' + this.config.nome + '</strong><span class="chatbot-status">Online</span></div>' +
                        '</div>' +
                        '<button class="chatbot-close" id="chatbot-close" type="button">×</button>' +
                    '</div>' +
                    '<div class="chatbot-messages" id="chatbot-messages"></div>' +
                    '<div class="chatbot-suggestions" id="chatbot-suggestions">' +
                        '<button type="button" data-msg="O que fazer">🏛️ O que fazer</button>' +
                        '<button type="button" data-msg="Restaurantes">🍽️ Onde comer</button>' +
                        '<button type="button" data-msg="Eventos">📅 Eventos</button>' +
                        '<button type="button" data-msg="Contato">📞 Contato</button>' +
                    '</div>' +
                    '<form class="chatbot-input" id="chatbot-form">' +
                        '<input type="text" id="chatbot-input-field" placeholder="Digite sua pergunta...">' +
                        '<button type="submit">➤</button>' +
                    '</form>' +
                '</div>';
            
            document.body.appendChild(widget);
            this.injetarEstilos();
            
            var self = this;
            setTimeout(function() {
                self.adicionarMensagem(self.config.mensagemInicial, 'bot');
            }, 1000);
        },
        
        injetarEstilos: function() {
            var existingStyles = document.getElementById('chatbot-styles');
            if (existingStyles) existingStyles.remove();
            
            var cor = this.config.corPrimaria;
            var styles = document.createElement('style');
            styles.id = 'chatbot-styles';
            styles.textContent = 
                '#chatbot-widget{position:fixed;bottom:90px;right:20px;z-index:999999;font-family:Raleway,sans-serif}' +
                '#chatbot-widget .chatbot-trigger{width:65px;height:65px;border-radius:50%;background:' + cor + ';border:none;cursor:pointer;box-shadow:0 4px 25px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;transition:transform 0.3s}' +
                '#chatbot-widget .chatbot-trigger:hover{transform:scale(1.1)}' +
                '#chatbot-widget .chatbot-avatar{font-size:2.2rem}' +
                '#chatbot-widget .chatbot-badge{position:absolute;top:-5px;right:-5px;background:#e74c3c;color:#fff;width:24px;height:24px;border-radius:50%;font-size:12px;font-weight:bold;display:flex;align-items:center;justify-content:center;border:2px solid #fff}' +
                '#chatbot-widget .chatbot-window{position:absolute;bottom:80px;right:0;width:360px;height:500px;background:#fff;border-radius:20px;box-shadow:0 15px 50px rgba(0,0,0,0.3);display:none;flex-direction:column;overflow:hidden}' +
                '#chatbot-widget .chatbot-window.active{display:flex;animation:chatUp 0.3s ease}' +
                '@keyframes chatUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}' +
                '#chatbot-widget .chatbot-header{background:' + cor + ';color:#fff;padding:1rem;display:flex;justify-content:space-between;align-items:center}' +
                '#chatbot-widget .chatbot-header-info{display:flex;align-items:center;gap:0.75rem}' +
                '#chatbot-widget .chatbot-header-avatar{font-size:1.8rem}' +
                '#chatbot-widget .chatbot-header strong{display:block}' +
                '#chatbot-widget .chatbot-status{font-size:0.75rem;opacity:0.9}' +
                '#chatbot-widget .chatbot-close{background:rgba(255,255,255,0.2);border:none;color:#fff;width:32px;height:32px;border-radius:50%;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
                '#chatbot-widget .chatbot-close:hover{background:rgba(255,255,255,0.3)}' +
                '#chatbot-widget .chatbot-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;background:#f8f9fa}' +
                '#chatbot-widget .chatbot-msg{max-width:85%;padding:0.85rem 1rem;border-radius:18px;line-height:1.5;font-size:0.9rem;white-space:pre-line}' +
                '#chatbot-widget .chatbot-msg.bot{background:#fff;align-self:flex-start;border-bottom-left-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,0.1)}' +
                '#chatbot-widget .chatbot-msg.user{background:' + cor + ';color:#fff;align-self:flex-end;border-bottom-right-radius:5px}' +
                '#chatbot-widget .chatbot-suggestions{padding:0.75rem 1rem;display:flex;flex-wrap:wrap;gap:0.5rem;border-top:1px solid #eee;background:#fff}' +
                '#chatbot-widget .chatbot-suggestions button{background:#f0f2f5;border:none;padding:0.5rem 0.9rem;border-radius:20px;font-size:0.8rem;cursor:pointer;transition:all 0.2s}' +
                '#chatbot-widget .chatbot-suggestions button:hover{background:' + cor + ';color:#fff}' +
                '#chatbot-widget .chatbot-input{display:flex;padding:0.75rem;gap:0.5rem;border-top:1px solid #eee;background:#fff}' +
                '#chatbot-widget .chatbot-input input{flex:1;border:2px solid #e0e0e0;border-radius:25px;padding:0.7rem 1rem;font-size:0.9rem;outline:none}' +
                '#chatbot-widget .chatbot-input input:focus{border-color:' + cor + '}' +
                '#chatbot-widget .chatbot-input button[type="submit"]{background:' + cor + ';color:#fff;border:none;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:1.1rem}' +
                '@media(max-width:500px){#chatbot-widget .chatbot-window{width:calc(100vw - 30px);height:65vh}}';
            document.head.appendChild(styles);
        },
        
        bindEvents: function() {
            var self = this;
            var trigger = document.getElementById('chatbot-trigger');
            var closeBtn = document.getElementById('chatbot-close');
            var form = document.getElementById('chatbot-form');
            var suggestions = document.getElementById('chatbot-suggestions');
            
            if (!trigger) {
                console.error('❌ Trigger não encontrado');
                return;
            }
            
            trigger.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Clique no chatbot');
                self.toggle();
                return false;
            };
            
            if (closeBtn) {
                closeBtn.onclick = function(e) {
                    e.preventDefault();
                    self.fechar();
                    return false;
                };
            }
            
            if (form) {
                form.onsubmit = function(e) {
                    e.preventDefault();
                    self.enviarMensagem();
                    return false;
                };
            }
            
            if (suggestions) {
                suggestions.onclick = function(e) {
                    if (e.target.tagName === 'BUTTON') {
                        var msg = e.target.getAttribute('data-msg');
                        if (msg) self.processarMensagem(msg);
                    }
                };
            }
            
            console.log('✅ Eventos vinculados');
        },
        
        toggle: function() {
            if (this.isOpen) {
                this.fechar();
            } else {
                this.abrir();
            }
        },
        
        abrir: function() {
            var chatWindow = document.getElementById('chatbot-window');
            var badge = document.querySelector('#chatbot-widget .chatbot-badge');
            
            if (chatWindow) {
                chatWindow.classList.add('active');
                this.isOpen = true;
                console.log('📭 Chat aberto');
            }
            if (badge) badge.style.display = 'none';
        },
        
        fechar: function() {
            var chatWindow = document.getElementById('chatbot-window');
            if (chatWindow) {
                chatWindow.classList.remove('active');
                this.isOpen = false;
                console.log('📪 Chat fechado');
            }
        },
        
        enviarMensagem: function() {
            var input = document.getElementById('chatbot-input-field');
            if (!input) return;
            
            var msg = input.value.trim();
            if (!msg) return;
            
            this.processarMensagem(msg);
            input.value = '';
        },
        
        processarMensagem: function(msg) {
            var self = this;
            this.adicionarMensagem(msg, 'user');
            
            setTimeout(function() {
                var resposta = self.encontrarResposta(msg);
                self.adicionarMensagem(resposta, 'bot');
            }, 500 + Math.random() * 500);
        },
        
        encontrarResposta: function(msg) {
            var msgLower = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            for (var chave in this.respostas) {
                if (chave === 'default') continue;
                if (msgLower.indexOf(chave) !== -1) {
                    return this.respostas[chave];
                }
            }
            return this.respostas['default'];
        },
        
        adicionarMensagem: function(texto, tipo) {
            var container = document.getElementById('chatbot-messages');
            if (!container) return;
            
            var msg = document.createElement('div');
            msg.className = 'chatbot-msg ' + tipo;
            msg.textContent = texto;
            container.appendChild(msg);
            container.scrollTop = container.scrollHeight;
        }
    };
    
    window.Chatbot = Chatbot;
    
    function inicializarChatbot() {
        if (document.getElementById('chatbot-widget')) return;
        Chatbot.init();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarChatbot);
    } else {
        inicializarChatbot();
    }
    
    setTimeout(function() {
        if (!Chatbot.isInitialized) inicializarChatbot();
    }, 1500);
    
    setTimeout(function() {
        if (!Chatbot.isInitialized) inicializarChatbot();
    }, 3000);
    
})();
