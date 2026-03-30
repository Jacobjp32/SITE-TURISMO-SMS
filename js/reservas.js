/**
 * ============================================================
 * SISTEMA DE RESERVAS ONLINE - VERSÃO 3.0
 * ============================================================
 * 
 * Sistema para reservas de passeios, hospedagens e experiências.
 * Integra com WhatsApp e email para confirmação.
 */

const Reservas = {
    
    // Configurações
    config: {
        whatsapp: '554235320000', // Secretaria Municipal de Turismo
        email: 'turismo@saomateusdosul.pr.gov.br',
        storageKey: 'sms_reservas'
    },
    
    // Experiências disponíveis
    experiencias: [
        {
            id: 1,
            nome: 'Passeio de Barco pelo Rio Iguaçu',
            categoria: 'Náutico',
            duracao: '2 horas',
            preco: 'R$ 80,00',
            precoNum: 80,
            descricao: 'Navegue pelas águas do Rio Iguaçu e descubra a beleza natural da região.',
            imagem: 'images/PRACA_DO_RIO_IGUACU.jpg',
            horarios: ['09:00', '14:00', '16:00'],
            diasDisponiveis: ['Sáb', 'Dom'],
            vagasPorHorario: 12
        },
        {
            id: 2,
            nome: 'Tour Rota da Erva-Mate',
            categoria: 'Cultural',
            duracao: '4 horas',
            preco: 'R$ 120,00',
            precoNum: 120,
            descricao: 'Visite ervateiras tradicionais e aprenda sobre o "Ouro Verde" paranaense.',
            imagem: 'images/PARRERAL__1_.jpg',
            horarios: ['08:30', '13:30'],
            diasDisponiveis: ['Ter', 'Qui', 'Sáb'],
            vagasPorHorario: 15
        },
        {
            id: 3,
            nome: 'Experiência Gastronômica Polonesa',
            categoria: 'Gastronomia',
            duracao: '3 horas',
            preco: 'R$ 150,00',
            precoNum: 150,
            descricao: 'Aprenda a fazer pierogi e outras delícias polonesas com famílias tradicionais.',
            imagem: 'images/POLSKIE_SMAKI__1_.jpg',
            horarios: ['10:00', '15:00'],
            diasDisponiveis: ['Qua', 'Sex', 'Sáb'],
            vagasPorHorario: 8
        },
        {
            id: 4,
            nome: 'Roteiro de Turismo Religioso',
            categoria: 'Religioso',
            duracao: '5 horas',
            preco: 'R$ 100,00',
            precoNum: 100,
            descricao: 'Visite as igrejas centenárias de herança polonesa e ucraniana.',
            imagem: 'images/IGREJA_AGUA_BRANCA.jpg',
            horarios: ['08:00', '13:00'],
            diasDisponiveis: ['Seg', 'Qua', 'Sex'],
            vagasPorHorario: 20
        },
        {
            id: 5,
            nome: 'Trilha Ecológica do Iguaçu',
            categoria: 'Natureza',
            duracao: '3 horas',
            preco: 'R$ 60,00',
            precoNum: 60,
            descricao: 'Caminhada guiada pela mata nativa com observação de fauna e flora.',
            imagem: 'images/PONTE_SOB_O_RIO_IGUACU.jpg',
            horarios: ['07:00', '15:00'],
            diasDisponiveis: ['Sáb', 'Dom'],
            vagasPorHorario: 10
        },
        {
            id: 6,
            nome: 'City Tour São Mateus do Sul',
            categoria: 'Cultural',
            duracao: '3 horas',
            preco: 'R$ 70,00',
            precoNum: 70,
            descricao: 'Conheça os principais pontos turísticos da Capital Polonesa do Paraná.',
            imagem: 'images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg',
            horarios: ['09:00', '14:00'],
            diasDisponiveis: ['Ter', 'Qui', 'Sáb', 'Dom'],
            vagasPorHorario: 25
        }
    ],
    
    // Reservas armazenadas
    reservas: [],
    
    // Inicializar sistema
    init: function() {
        this.carregarReservas();
        console.log('🎫 Sistema de reservas iniciado');
        return this;
    },
    
    // Carregar reservas do localStorage
    carregarReservas: function() {
        const stored = localStorage.getItem(this.config.storageKey);
        this.reservas = stored ? JSON.parse(stored) : [];
        return this.reservas;
    },
    
    // Salvar reservas
    salvarReservas: function() {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.reservas));
    },
    
    // Obter experiência por ID
    getExperiencia: function(id) {
        return this.experiencias.find(e => e.id === id);
    },
    
    // Criar reserva (salva no Firestore + localStorage fallback)
    criarReserva: async function(dados) {
        const experiencia = this.getExperiencia(dados.experienciaId);
        if (!experiencia) return null;
        
        const reserva = {
            id: Date.now(),
            experienciaId: dados.experienciaId,
            experienciaNome: experiencia.nome,
            data: dados.data,
            horario: dados.horario,
            pessoas: dados.pessoas,
            nome: dados.nome,
            email: dados.email,
            telefone: dados.telefone,
            observacoes: dados.observacoes || '',
            valorTotal: experiencia.precoNum * dados.pessoas,
            status: 'pendente',
            criadaEm: new Date().toISOString()
        };
        
        // Tentar salvar no Firestore
        try {
            const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const firebaseConfig = {
                apiKey: 'AIzaSyAy5161iVe7JoLgLMp1EN52OsBHXjo3JYQ',
                authDomain: 'turismo-sms.firebaseapp.com',
                projectId: 'turismo-sms',
                storageBucket: 'turismo-sms.firebasestorage.app',
                messagingSenderId: '1042825829044',
                appId: '1:1042825829044:web:13173093e28be3199955e1'
            };
            const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig, 'reservas-app');
            const db = getFirestore(app);
            const docRef = await addDoc(collection(db, 'reservas'), {
                ...reserva,
                criadoEm: serverTimestamp()
            });
            reserva.firestoreId = docRef.id;
            console.log('✅ Reserva salva no Firestore:', docRef.id);
        } catch (fbErr) {
            console.warn('⚠️ Firestore indisponível, salvando só localStorage:', fbErr.message);
        }
        
        // Sempre salva no localStorage como fallback
        this.reservas.push(reserva);
        this.salvarReservas();
        
        return reserva;
    },
    
    // Gerar mensagem WhatsApp
    gerarMensagemWhatsApp: function(reserva) {
        const exp = this.getExperiencia(reserva.experienciaId);
        return encodeURIComponent(
            `🎫 *NOVA RESERVA*\n\n` +
            `*Experiência:* ${reserva.experienciaNome}\n` +
            `*Data:* ${this.formatarData(reserva.data)}\n` +
            `*Horário:* ${reserva.horario}\n` +
            `*Pessoas:* ${reserva.pessoas}\n` +
            `*Valor Total:* R$ ${reserva.valorTotal.toFixed(2)}\n\n` +
            `*Dados do Cliente:*\n` +
            `Nome: ${reserva.nome}\n` +
            `Email: ${reserva.email}\n` +
            `Telefone: ${reserva.telefone}\n` +
            (reserva.observacoes ? `Observações: ${reserva.observacoes}\n` : '') +
            `\n_Reserva #${reserva.id}_`
        );
    },
    
    // Abrir WhatsApp com reserva
    abrirWhatsApp: function(reserva) {
        const msg = this.gerarMensagemWhatsApp(reserva);
        window.open(`https://wa.me/${this.config.whatsapp}?text=${msg}`, '_blank');
    },
    
    // Formatar data
    formatarData: function(dataStr) {
        const data = new Date(dataStr + 'T00:00:00');
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    },
    
    // Renderizar card de experiência
    renderizarCard: function(experiencia) {
        return `
            <div class="reserva-card" data-id="${experiencia.id}">
                <div class="reserva-imagem" style="background-image: url('${experiencia.imagem}');">
                    <span class="reserva-categoria">${experiencia.categoria}</span>
                </div>
                <div class="reserva-info">
                    <h3 class="reserva-titulo">${experiencia.nome}</h3>
                    <p class="reserva-descricao">${experiencia.descricao}</p>
                    <div class="reserva-detalhes">
                        <span>⏱️ ${experiencia.duracao}</span>
                        <span>📅 ${experiencia.diasDisponiveis.join(', ')}</span>
                    </div>
                    <div class="reserva-footer">
                        <span class="reserva-preco">${experiencia.preco}</span>
                        <button class="btn-reservar" onclick="Reservas.abrirModal(${experiencia.id})">
                            Reservar →
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Renderizar lista de experiências
    renderizarLista: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="reservas-grid">
                ${this.experiencias.map(e => this.renderizarCard(e)).join('')}
            </div>
        `;
        
        this.injetarEstilos();
    },
    
    // Abrir modal de reserva
    abrirModal: function(experienciaId) {
        const exp = this.getExperiencia(experienciaId);
        if (!exp) return;
        
        // Remover modal existente
        const existente = document.getElementById('reserva-modal');
        if (existente) existente.remove();
        
        const modal = document.createElement('div');
        modal.id = 'reserva-modal';
        modal.innerHTML = `
            <div class="reserva-modal-overlay" onclick="Reservas.fecharModal()"></div>
            <div class="reserva-modal-content">
                <button class="reserva-modal-close" onclick="Reservas.fecharModal()">×</button>
                
                <div class="reserva-modal-header">
                    <h2>Reservar: ${exp.nome}</h2>
                    <p>${exp.descricao}</p>
                </div>
                
                <form id="form-reserva" onsubmit="Reservas.submeterReserva(event, ${exp.id})">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reserva-data">Data *</label>
                            <input type="date" id="reserva-data" required min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label for="reserva-horario">Horário *</label>
                            <select id="reserva-horario" required>
                                ${exp.horarios.map(h => `<option value="${h}">${h}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reserva-pessoas">Pessoas *</label>
                            <input type="number" id="reserva-pessoas" min="1" max="${exp.vagasPorHorario}" value="1" required
                                   onchange="Reservas.atualizarTotal(${exp.precoNum})">
                        </div>
                        <div class="form-group">
                            <label>Valor Total</label>
                            <div class="reserva-total" id="reserva-total">R$ ${exp.precoNum.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="reserva-nome">Nome Completo *</label>
                        <input type="text" id="reserva-nome" required placeholder="Seu nome">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reserva-email">Email *</label>
                            <input type="email" id="reserva-email" required placeholder="seu@email.com">
                        </div>
                        <div class="form-group">
                            <label for="reserva-telefone">Telefone *</label>
                            <input type="tel" id="reserva-telefone" required placeholder="(42) 99999-9999">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="reserva-obs">Observações</label>
                        <textarea id="reserva-obs" rows="2" placeholder="Alguma informação adicional..."></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:0.5rem">
                        <label style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.85rem;cursor:pointer;font-weight:400;color:#555;">
                            <input type="checkbox" id="reserva-lgpd" required style="margin-top:3px;flex-shrink:0;">
                            Concordo com o uso dos meus dados para contato sobre esta reserva, conforme a 
                            <a href="transparencia.html" target="_blank" style="color:#0a3d2e;">Política de Privacidade</a> (LGPD).
                        </label>
                    </div>
                    <div class="reserva-modal-footer">
                        <button type="button" class="btn-secundario" onclick="Reservas.fecharModal()">Cancelar</button>
                        <button type="submit" class="btn-primario">Confirmar Reserva</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },
    
    // Fechar modal
    fecharModal: function() {
        const modal = document.getElementById('reserva-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    },
    
    // Atualizar total
    atualizarTotal: function(precoUnitario) {
        const pessoas = parseInt(document.getElementById('reserva-pessoas').value) || 1;
        const total = precoUnitario * pessoas;
        document.getElementById('reserva-total').textContent = `R$ ${total.toFixed(2)}`;
    },
    
    // Submeter reserva
    submeterReserva: async function(event, experienciaId) {
        event.preventDefault();
        const btn = event.target.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
        
        const dados = {
            experienciaId: experienciaId,
            data: document.getElementById('reserva-data').value,
            horario: document.getElementById('reserva-horario').value,
            pessoas: parseInt(document.getElementById('reserva-pessoas').value),
            nome: document.getElementById('reserva-nome').value,
            email: document.getElementById('reserva-email').value,
            telefone: document.getElementById('reserva-telefone').value,
            observacoes: document.getElementById('reserva-obs').value
        };
        
        const reserva = await this.criarReserva(dados);
        
        if (reserva) {
            this.fecharModal();
            this.mostrarConfirmacao(reserva);
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Confirmar Reserva'; }
    },
    
    // Mostrar confirmação
    mostrarConfirmacao: function(reserva) {
        const modal = document.createElement('div');
        modal.id = 'reserva-confirmacao';
        modal.innerHTML = `
            <div class="reserva-modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="reserva-modal-content confirmacao">
                <div class="confirmacao-icon">✅</div>
                <h2>Reserva Enviada!</h2>
                <p>Sua reserva foi registrada com sucesso.</p>
                
                <div class="confirmacao-detalhes">
                    <p><strong>Código:</strong> #${reserva.id}</p>
                    <p><strong>Experiência:</strong> ${reserva.experienciaNome}</p>
                    <p><strong>Data:</strong> ${this.formatarData(reserva.data)}</p>
                    <p><strong>Horário:</strong> ${reserva.horario}</p>
                    <p><strong>Valor:</strong> R$ ${reserva.valorTotal.toFixed(2)}</p>
                </div>
                
                <p class="confirmacao-aviso">
                    Para confirmar sua reserva, entre em contato via WhatsApp:
                </p>
                
                <div class="confirmacao-botoes">
                    <button class="btn-whatsapp" onclick="Reservas.abrirWhatsApp(Reservas.reservas[Reservas.reservas.length-1])">
                        📱 Confirmar via WhatsApp
                    </button>
                    <button class="btn-secundario" onclick="this.closest('#reserva-confirmacao').remove()">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    // Injetar estilos
    injetarEstilos: function() {
        if (document.getElementById('reservas-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'reservas-styles';
        styles.textContent = `
            .reservas-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 2rem;
                padding: 2rem 0;
            }
            
            .reserva-card {
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                transition: transform 0.3s, box-shadow 0.3s;
            }
            
            .reserva-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 40px rgba(0,0,0,0.15);
            }
            
            .reserva-imagem {
                height: 180px;
                background-size: cover;
                background-position: center;
                position: relative;
            }
            
            .reserva-categoria {
                position: absolute;
                top: 15px;
                left: 15px;
                background: var(--gold-polish, #d4a574);
                color: var(--forest-deep, #0a3d2e);
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
            }
            
            .reserva-info {
                padding: 1.5rem;
            }
            
            .reserva-titulo {
                font-size: 1.2rem;
                color: var(--forest-deep, #0a3d2e);
                margin-bottom: 0.5rem;
            }
            
            .reserva-descricao {
                color: #666;
                font-size: 0.9rem;
                margin-bottom: 1rem;
                line-height: 1.5;
            }
            
            .reserva-detalhes {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
                font-size: 0.85rem;
                color: #888;
            }
            
            .reserva-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 1rem;
                border-top: 1px solid #eee;
            }
            
            .reserva-preco {
                font-size: 1.3rem;
                font-weight: 700;
                color: var(--forest-deep, #0a3d2e);
            }
            
            .btn-reservar {
                background: var(--forest-deep, #0a3d2e);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 25px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-reservar:hover {
                background: var(--gold-polish, #d4a574);
                color: var(--forest-deep, #0a3d2e);
            }
            
            /* Modal */
            #reserva-modal, #reserva-confirmacao {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .reserva-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.6);
            }
            
            .reserva-modal-content {
                position: relative;
                background: white;
                border-radius: 20px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .reserva-modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #999;
            }
            
            .reserva-modal-header {
                text-align: center;
                margin-bottom: 1.5rem;
            }
            
            .reserva-modal-header h2 {
                color: var(--forest-deep, #0a3d2e);
                margin-bottom: 0.5rem;
            }
            
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            
            .form-group {
                margin-bottom: 1rem;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #333;
            }
            
            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 10px;
                font-size: 1rem;
            }
            
            .reserva-total {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--forest-deep, #0a3d2e);
                padding: 10px;
                background: #f0f0f0;
                border-radius: 10px;
                text-align: center;
            }
            
            .reserva-modal-footer {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
            }
            
            .btn-primario, .btn-secundario {
                flex: 1;
                padding: 12px;
                border-radius: 25px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                transition: all 0.3s;
            }
            
            .btn-primario {
                background: var(--forest-deep, #0a3d2e);
                color: white;
            }
            
            .btn-secundario {
                background: #f0f0f0;
                color: #333;
            }
            
            /* Confirmação */
            .confirmacao {
                text-align: center;
            }
            
            .confirmacao-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            
            .confirmacao-detalhes {
                background: #f8f8f8;
                padding: 1rem;
                border-radius: 10px;
                margin: 1.5rem 0;
                text-align: left;
            }
            
            .confirmacao-aviso {
                color: #666;
                font-size: 0.9rem;
            }
            
            .confirmacao-botoes {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-top: 1.5rem;
            }
            
            .btn-whatsapp {
                background: #25D366;
                color: white;
                border: none;
                padding: 15px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 1.1rem;
                cursor: pointer;
            }
            
            @media (max-width: 600px) {
                .form-row {
                    grid-template-columns: 1fr;
                }
                
                .reserva-modal-content {
                    padding: 1.5rem;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
};

// Exportar
window.Reservas = Reservas;

// Auto-inicializar
document.addEventListener('DOMContentLoaded', function() {
    Reservas.init();
});
