/**
 * ============================================================
 * ROTEIROS COM IA - VERSÃO 4.0
 * ============================================================
 * 
 * Sistema inteligente que sugere roteiros personalizados
 * baseado nas preferências do visitante.
 */

const RoteiroIA = {
    
    // Base de conhecimento dos pontos turísticos
    pontosTuristicos: [
        {
            id: 1,
            nome: 'Igreja Matriz São Mateus',
            categoria: ['religioso', 'cultural', 'historico'],
            tempo: 45,
            melhorHorario: 'manha',
            publico: ['familia', 'casal', 'solo', 'idosos'],
            interesse: ['arquitetura', 'religiao', 'fotografia', 'historia'],
            descricao: 'Igreja neogótica centenária, símbolo da cidade.',
            imagem: 'images/IGREJA_MATRIZ_FRONTAL.jpg'
        },
        {
            id: 2,
            nome: 'Praça do Rio Iguaçu',
            categoria: ['natureza', 'lazer', 'familia'],
            tempo: 60,
            melhorHorario: 'tarde',
            publico: ['familia', 'casal', 'criancas', 'solo'],
            interesse: ['natureza', 'relaxamento', 'fotografia', 'passeio'],
            descricao: 'Área verde às margens do Rio Iguaçu com playground e quiosques.',
            imagem: 'images/PRACA_DO_RIO_IGUACU.jpg'
        },
        {
            id: 3,
            nome: 'Rua do Mathe',
            categoria: ['gastronomia', 'cultural', 'compras'],
            tempo: 90,
            melhorHorario: 'tarde',
            publico: ['familia', 'casal', 'solo', 'grupos'],
            interesse: ['gastronomia', 'erva-mate', 'compras', 'cultura'],
            descricao: 'Centro gastronômico com erva-mate, chimarrão e produtos locais.',
            imagem: 'images/RUA_DO_MATHE.jpg'
        },
        {
            id: 4,
            nome: 'Igreja de Água Branca',
            categoria: ['religioso', 'cultural', 'historico', 'polonesa'],
            tempo: 60,
            melhorHorario: 'manha',
            publico: ['familia', 'casal', 'solo', 'idosos'],
            interesse: ['arquitetura', 'religiao', 'polonesa', 'historia', 'fotografia'],
            descricao: 'Igreja de madeira centenária, patrimônio da imigração polonesa.',
            imagem: 'images/IGREJA_AGUA_BRANCA.jpg'
        },
        {
            id: 5,
            nome: 'Passeio de Barco Rio Iguaçu',
            categoria: ['natureza', 'aventura', 'nautico'],
            tempo: 120,
            melhorHorario: 'manha',
            publico: ['familia', 'casal', 'grupos', 'aventureiros'],
            interesse: ['natureza', 'aventura', 'fotografia', 'relaxamento'],
            descricao: 'Navegação pelo Rio Iguaçu com vistas panorâmicas.',
            imagem: 'images/PONTE_SOB_O_RIO_IGUACU.jpg'
        },
        {
            id: 6,
            nome: 'Experiência Gastronômica Polonesa',
            categoria: ['gastronomia', 'cultural', 'polonesa'],
            tempo: 180,
            melhorHorario: 'almoco',
            publico: ['familia', 'casal', 'grupos', 'gastronomos'],
            interesse: ['gastronomia', 'polonesa', 'cultura', 'culinaria'],
            descricao: 'Degustação de pierogi, golabki e pratos típicos poloneses.',
            imagem: 'images/POLSKIE_SMAKI__1_.jpg'
        },
        {
            id: 7,
            nome: 'Trilha Ecológica',
            categoria: ['natureza', 'aventura', 'ecoturismo'],
            tempo: 180,
            melhorHorario: 'manha',
            publico: ['aventureiros', 'casal', 'grupos'],
            interesse: ['natureza', 'aventura', 'ecoturismo', 'fotografia'],
            descricao: 'Caminhada pela mata nativa com observação de fauna e flora.',
            imagem: 'images/PARRERAL__1_.jpg'
        },
        {
            id: 8,
            nome: 'Feira Gastronômica',
            categoria: ['gastronomia', 'cultural', 'familia'],
            tempo: 120,
            melhorHorario: 'noite',
            publico: ['familia', 'casal', 'grupos', 'solo'],
            interesse: ['gastronomia', 'cultura', 'compras', 'passeio'],
            descricao: 'Feira semanal com comidas típicas e artesanato local.',
            imagem: 'images/POLSKIE_SMAKI__5_.jpg'
        },
        {
            id: 9,
            nome: 'Museu da Erva-Mate',
            categoria: ['cultural', 'historico', 'educativo'],
            tempo: 60,
            melhorHorario: 'manha',
            publico: ['familia', 'casal', 'solo', 'estudantes'],
            interesse: ['historia', 'erva-mate', 'cultura', 'educacao'],
            descricao: 'História da produção de erva-mate na região.',
            imagem: 'images/PARRERAL__4_.jpg'
        },
        {
            id: 10,
            nome: 'Pôr do Sol no Rio Iguaçu',
            categoria: ['natureza', 'romantico', 'fotografia'],
            tempo: 60,
            melhorHorario: 'tarde',
            publico: ['casal', 'solo', 'fotografos'],
            interesse: ['fotografia', 'natureza', 'romantico', 'relaxamento'],
            descricao: 'Mirante com vista privilegiada do pôr do sol sobre o rio.',
            imagem: 'images/IMG_2371.jpg'
        }
    ],
    
    // Roteiros pré-definidos
    roteirosPredefinidos: {
        'cultural-polonesa': {
            nome: 'Imersão na Cultura Polonesa',
            duracao: '1 dia',
            pontos: [4, 6, 1, 3],
            descricao: 'Descubra a rica herança polonesa de São Mateus do Sul.'
        },
        'natureza-aventura': {
            nome: 'Natureza e Aventura',
            duracao: '1 dia',
            pontos: [5, 7, 2, 10],
            descricao: 'Para os amantes da natureza e atividades ao ar livre.'
        },
        'gastronomico': {
            nome: 'Sabores de São Mateus',
            duracao: 'Meio dia',
            pontos: [3, 6, 8],
            descricao: 'Tour gastronômico pela culinária local e polonesa.'
        },
        'religioso': {
            nome: 'Turismo de Fé',
            duracao: '1 dia',
            pontos: [1, 4],
            descricao: 'Visite as igrejas centenárias e patrimônios religiosos.'
        },
        'familia': {
            nome: 'Diversão em Família',
            duracao: '1 dia',
            pontos: [2, 3, 9, 8],
            descricao: 'Atividades para todas as idades.'
        },
        'romantico': {
            nome: 'Escapada Romântica',
            duracao: '1 dia',
            pontos: [5, 6, 10],
            descricao: 'Momentos especiais a dois na Capital Polonesa.'
        }
    },
    
    // Perguntas para o quiz
    perguntas: [
        {
            id: 'tempo',
            texto: 'Quanto tempo você tem disponível?',
            opcoes: [
                { valor: 'meio-dia', texto: '🕐 Meio dia (4-5 horas)', peso: { tempo: 240 } },
                { valor: 'dia-inteiro', texto: '📅 Um dia inteiro', peso: { tempo: 480 } },
                { valor: 'dois-dias', texto: '🗓️ Dois dias ou mais', peso: { tempo: 960 } }
            ]
        },
        {
            id: 'companhia',
            texto: 'Com quem você está viajando?',
            opcoes: [
                { valor: 'solo', texto: '🚶 Sozinho(a)', tags: ['solo'] },
                { valor: 'casal', texto: '💑 Em casal', tags: ['casal', 'romantico'] },
                { valor: 'familia', texto: '👨‍👩‍👧‍👦 Com família', tags: ['familia', 'criancas'] },
                { valor: 'amigos', texto: '👥 Com amigos', tags: ['grupos', 'aventureiros'] }
            ]
        },
        {
            id: 'interesse',
            texto: 'O que mais te interessa?',
            multiplo: true,
            opcoes: [
                { valor: 'cultura', texto: '🏛️ Cultura e História', tags: ['cultural', 'historico', 'polonesa'] },
                { valor: 'natureza', texto: '🌿 Natureza', tags: ['natureza', 'ecoturismo'] },
                { valor: 'gastronomia', texto: '🍽️ Gastronomia', tags: ['gastronomia'] },
                { valor: 'religiao', texto: '⛪ Turismo Religioso', tags: ['religioso'] },
                { valor: 'aventura', texto: '🚣 Aventura', tags: ['aventura', 'nautico'] },
                { valor: 'fotografia', texto: '📸 Fotografia', tags: ['fotografia'] }
            ]
        },
        {
            id: 'ritmo',
            texto: 'Qual seu ritmo de viagem?',
            opcoes: [
                { valor: 'tranquilo', texto: '🧘 Tranquilo, sem pressa', multiplicador: 1.5 },
                { valor: 'moderado', texto: '🚶 Moderado', multiplicador: 1.0 },
                { valor: 'intenso', texto: '🏃 Intenso, quero ver tudo!', multiplicador: 0.7 }
            ]
        }
    ],
    
    // Estado do quiz
    respostas: {},
    
    // Inicializar
    init: function(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.renderizarInicio();
    },
    
    // Renderizar tela inicial
    renderizarInicio: function() {
        this.container.innerHTML = `
            <div class="roteiro-ia-inicio">
                <div class="ia-icon">🤖</div>
                <h2>Roteiro Inteligente</h2>
                <p>Descubra o roteiro perfeito para sua visita a São Mateus do Sul!</p>
                <p class="ia-subtitle">Nossa IA vai criar um roteiro personalizado baseado nas suas preferências.</p>
                
                <button class="btn-iniciar-quiz" onclick="RoteiroIA.iniciarQuiz()">
                    ✨ Criar Meu Roteiro
                </button>
                
                <div class="roteiros-prontos">
                    <h3>Ou escolha um roteiro pronto:</h3>
                    <div class="roteiros-grid">
                        ${Object.entries(this.roteirosPredefinidos).map(([key, roteiro]) => `
                            <button class="roteiro-pronto-btn" onclick="RoteiroIA.mostrarRoteiroPronto('${key}')">
                                ${this.getIconeRoteiro(key)} ${roteiro.nome}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    // Obter ícone do roteiro
    getIconeRoteiro: function(key) {
        const icones = {
            'cultural-polonesa': '🇵🇱',
            'natureza-aventura': '🌿',
            'gastronomico': '🍽️',
            'religioso': '⛪',
            'familia': '👨‍👩‍👧‍👦',
            'romantico': '💑'
        };
        return icones[key] || '📍';
    },
    
    // Iniciar quiz
    iniciarQuiz: function() {
        this.respostas = {};
        this.perguntaAtual = 0;
        this.renderizarPergunta();
    },
    
    // Renderizar pergunta
    renderizarPergunta: function() {
        const pergunta = this.perguntas[this.perguntaAtual];
        const progresso = ((this.perguntaAtual + 1) / this.perguntas.length) * 100;
        
        this.container.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-progresso">
                    <div class="quiz-progresso-bar" style="width: ${progresso}%"></div>
                </div>
                <p class="quiz-contador">Pergunta ${this.perguntaAtual + 1} de ${this.perguntas.length}</p>
                
                <h2 class="quiz-pergunta">${pergunta.texto}</h2>
                
                <div class="quiz-opcoes ${pergunta.multiplo ? 'multiplo' : ''}">
                    ${pergunta.opcoes.map((opcao, i) => `
                        <button class="quiz-opcao" data-valor="${opcao.valor}" onclick="RoteiroIA.selecionarOpcao('${pergunta.id}', '${opcao.valor}', this, ${pergunta.multiplo || false})">
                            ${opcao.texto}
                        </button>
                    `).join('')}
                </div>
                
                ${pergunta.multiplo ? `
                    <button class="btn-continuar" onclick="RoteiroIA.proximaPergunta()" style="display: none;" id="btn-continuar">
                        Continuar →
                    </button>
                ` : ''}
                
                <button class="btn-voltar" onclick="RoteiroIA.voltarPergunta()" ${this.perguntaAtual === 0 ? 'style="visibility: hidden;"' : ''}>
                    ← Voltar
                </button>
            </div>
        `;
    },
    
    // Selecionar opção
    selecionarOpcao: function(perguntaId, valor, elemento, multiplo) {
        if (multiplo) {
            elemento.classList.toggle('selecionado');
            
            if (!this.respostas[perguntaId]) {
                this.respostas[perguntaId] = [];
            }
            
            const index = this.respostas[perguntaId].indexOf(valor);
            if (index > -1) {
                this.respostas[perguntaId].splice(index, 1);
            } else {
                this.respostas[perguntaId].push(valor);
            }
            
            const btnContinuar = document.getElementById('btn-continuar');
            if (btnContinuar) {
                btnContinuar.style.display = this.respostas[perguntaId].length > 0 ? 'block' : 'none';
            }
        } else {
            this.respostas[perguntaId] = valor;
            this.proximaPergunta();
        }
    },
    
    // Próxima pergunta
    proximaPergunta: function() {
        this.perguntaAtual++;
        
        if (this.perguntaAtual >= this.perguntas.length) {
            this.gerarRoteiro();
        } else {
            this.renderizarPergunta();
        }
    },
    
    // Voltar pergunta
    voltarPergunta: function() {
        if (this.perguntaAtual > 0) {
            this.perguntaAtual--;
            this.renderizarPergunta();
        }
    },
    
    // Gerar roteiro personalizado
    gerarRoteiro: function() {
        // Mostrar loading
        this.container.innerHTML = `
            <div class="gerando-roteiro">
                <div class="loading-spinner"></div>
                <p>🤖 Analisando suas preferências...</p>
                <p class="loading-sub">Criando o roteiro perfeito para você!</p>
            </div>
        `;
        
        // Simular processamento da IA
        setTimeout(() => {
            const roteiro = this.calcularRoteiro();
            this.mostrarRoteiro(roteiro);
        }, 2000);
    },
    
    // Calcular roteiro baseado nas respostas
    calcularRoteiro: function() {
        const respostas = this.respostas;
        let pontosOrdenados = [];
        
        // Obter tags de interesse
        let tagsInteresse = [];
        if (respostas.interesse) {
            respostas.interesse.forEach(interesse => {
                const opcao = this.perguntas[2].opcoes.find(o => o.valor === interesse);
                if (opcao && opcao.tags) {
                    tagsInteresse = tagsInteresse.concat(opcao.tags);
                }
            });
        }
        
        // Obter tags de companhia
        let tagsCompanhia = [];
        const opcaoCompanhia = this.perguntas[1].opcoes.find(o => o.valor === respostas.companhia);
        if (opcaoCompanhia && opcaoCompanhia.tags) {
            tagsCompanhia = opcaoCompanhia.tags;
        }
        
        // Calcular pontuação para cada ponto turístico
        this.pontosTuristicos.forEach(ponto => {
            let score = 0;
            
            // Pontos por categoria
            ponto.categoria.forEach(cat => {
                if (tagsInteresse.includes(cat)) score += 10;
            });
            
            // Pontos por público
            ponto.publico.forEach(pub => {
                if (tagsCompanhia.includes(pub)) score += 5;
            });
            
            // Pontos por interesse
            ponto.interesse.forEach(int => {
                if (tagsInteresse.includes(int)) score += 3;
            });
            
            pontosOrdenados.push({ ...ponto, score });
        });
        
        // Ordenar por score
        pontosOrdenados.sort((a, b) => b.score - a.score);
        
        // Determinar tempo disponível
        let tempoDisponivel = 480; // 8 horas padrão
        if (respostas.tempo === 'meio-dia') tempoDisponivel = 300;
        if (respostas.tempo === 'dois-dias') tempoDisponivel = 960;
        
        // Aplicar multiplicador de ritmo
        const opcaoRitmo = this.perguntas[3].opcoes.find(o => o.valor === respostas.ritmo);
        const multiplicador = opcaoRitmo ? opcaoRitmo.multiplicador : 1;
        
        // Selecionar pontos que cabem no tempo
        let tempoUsado = 0;
        let pontosSelecionados = [];
        
        for (const ponto of pontosOrdenados) {
            const tempoAjustado = ponto.tempo * multiplicador;
            if (tempoUsado + tempoAjustado <= tempoDisponivel && ponto.score > 0) {
                pontosSelecionados.push(ponto);
                tempoUsado += tempoAjustado + 30; // +30 min deslocamento
            }
            
            if (pontosSelecionados.length >= 6) break;
        }
        
        return {
            pontos: pontosSelecionados,
            tempoTotal: tempoUsado,
            respostas: respostas
        };
    },
    
    // Mostrar roteiro gerado
    mostrarRoteiro: function(roteiro) {
        const horas = Math.floor(roteiro.tempoTotal / 60);
        const minutos = roteiro.tempoTotal % 60;
        
        this.container.innerHTML = `
            <div class="roteiro-resultado">
                <div class="roteiro-header">
                    <h2>🎉 Seu Roteiro Personalizado</h2>
                    <p class="roteiro-tempo">⏱️ Duração estimada: ${horas}h${minutos > 0 ? minutos + 'min' : ''}</p>
                </div>
                
                <div class="roteiro-timeline">
                    ${roteiro.pontos.map((ponto, index) => `
                        <div class="timeline-item">
                            <div class="timeline-numero">${index + 1}</div>
                            <div class="timeline-conteudo">
                                <div class="timeline-imagem" style="background-image: url('${ponto.imagem}')"></div>
                                <div class="timeline-info">
                                    <h3>${ponto.nome}</h3>
                                    <p>${ponto.descricao}</p>
                                    <span class="timeline-tempo">⏱️ ${ponto.tempo} min</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="roteiro-acoes">
                    <button class="btn-compartilhar" onclick="RoteiroIA.compartilharRoteiro()">
                        📤 Compartilhar
                    </button>
                    <button class="btn-salvar" onclick="RoteiroIA.salvarRoteiro()">
                        💾 Salvar PDF
                    </button>
                    <button class="btn-refazer" onclick="RoteiroIA.renderizarInicio()">
                        🔄 Criar Novo Roteiro
                    </button>
                </div>
            </div>
        `;
        
        // Salvar roteiro atual
        this.roteiroAtual = roteiro;
    },
    
    // Mostrar roteiro pré-definido
    mostrarRoteiroPronto: function(key) {
        const roteiro = this.roteirosPredefinidos[key];
        const pontos = roteiro.pontos.map(id => this.pontosTuristicos.find(p => p.id === id));
        const tempoTotal = pontos.reduce((acc, p) => acc + p.tempo, 0);
        
        this.mostrarRoteiro({
            pontos: pontos,
            tempoTotal: tempoTotal,
            nome: roteiro.nome
        });
    },
    
    // Compartilhar roteiro
    compartilharRoteiro: function() {
        const texto = `🗺️ Meu Roteiro em São Mateus do Sul:\n\n` +
            this.roteiroAtual.pontos.map((p, i) => `${i + 1}. ${p.nome}`).join('\n') +
            `\n\nCrie seu roteiro em: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Roteiro São Mateus do Sul',
                text: texto,
                url: window.location.href
            });
        } else {
            // Fallback: copiar para clipboard
            navigator.clipboard.writeText(texto);
            alert('Roteiro copiado para a área de transferência!');
        }
    },
    
    // Salvar como PDF (simplificado)
    salvarRoteiro: function() {
        window.print();
    }
};

// Exportar
window.RoteiroIA = RoteiroIA;
