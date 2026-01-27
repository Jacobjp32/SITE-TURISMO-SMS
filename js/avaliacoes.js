/**
 * ============================================================
 * SISTEMA DE AVALIAÇÕES - VERSÃO 2.0
 * ============================================================
 * 
 * Sistema para visitantes avaliarem pontos turísticos.
 * Armazena avaliações no localStorage (pode ser integrado a backend).
 */

const AvaliacaoSistema = {
    
    // Armazenamento local das avaliações
    storageKey: 'sms_avaliacoes',
    
    // Inicializar sistema
    init: function() {
        this.carregarAvaliacoes();
        this.bindEvents();
        console.log('⭐ Sistema de avaliações iniciado');
    },
    
    // Carregar avaliações do localStorage
    carregarAvaliacoes: function() {
        const stored = localStorage.getItem(this.storageKey);
        this.avaliacoes = stored ? JSON.parse(stored) : {};
        return this.avaliacoes;
    },
    
    // Salvar avaliações
    salvarAvaliacoes: function() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.avaliacoes));
    },
    
    // Adicionar avaliação
    adicionarAvaliacao: function(localId, dados) {
        if (!this.avaliacoes[localId]) {
            this.avaliacoes[localId] = [];
        }
        
        const avaliacao = {
            id: Date.now(),
            nota: dados.nota,
            comentario: dados.comentario || '',
            nome: dados.nome || 'Anônimo',
            data: new Date().toISOString(),
            verificado: false
        };
        
        this.avaliacoes[localId].push(avaliacao);
        this.salvarAvaliacoes();
        
        return avaliacao;
    },
    
    // Obter média de avaliações
    getMedia: function(localId) {
        const avaliacoes = this.avaliacoes[localId] || [];
        if (avaliacoes.length === 0) return 0;
        
        const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0);
        return (soma / avaliacoes.length).toFixed(1);
    },
    
    // Obter total de avaliações
    getTotal: function(localId) {
        return (this.avaliacoes[localId] || []).length;
    },
    
    // Renderizar estrelas
    renderEstrelas: function(nota, interativo = false, localId = null) {
        const notaArredondada = Math.round(nota);
        let html = '<div class="rating-stars' + (interativo ? ' interativo' : '') + '"' + 
                   (localId ? ' data-local="' + localId + '"' : '') + '>';
        
        for (let i = 1; i <= 5; i++) {
            const classe = i <= notaArredondada ? 'filled' : 'empty';
            html += `<span class="star ${classe}" data-value="${i}">★</span>`;
        }
        
        html += '</div>';
        return html;
    },
    
    // Renderizar resumo de avaliações
    renderResumo: function(localId) {
        const media = this.getMedia(localId);
        const total = this.getTotal(localId);
        
        return `
            <div class="avaliacao-resumo" data-local="${localId}">
                ${this.renderEstrelas(media)}
                <span class="avaliacao-media">${media > 0 ? media : '-'}</span>
                <span class="avaliacao-total">(${total} ${total === 1 ? 'avaliação' : 'avaliações'})</span>
            </div>
        `;
    },
    
    // Renderizar formulário de avaliação
    renderFormulario: function(localId, nomeLocal) {
        return `
            <div class="avaliacao-form" id="avaliacao-form-${localId}">
                <h4>Avalie ${nomeLocal}</h4>
                <form onsubmit="AvaliacaoSistema.submeterAvaliacao(event, '${localId}')">
                    <div class="form-group">
                        <label>Sua avaliação:</label>
                        ${this.renderEstrelas(0, true, localId)}
                        <input type="hidden" name="nota" id="nota-${localId}" required>
                    </div>
                    <div class="form-group">
                        <label for="nome-${localId}">Seu nome (opcional):</label>
                        <input type="text" id="nome-${localId}" name="nome" placeholder="Seu nome">
                    </div>
                    <div class="form-group">
                        <label for="comentario-${localId}">Comentário (opcional):</label>
                        <textarea id="comentario-${localId}" name="comentario" rows="3" placeholder="Conte sua experiência..."></textarea>
                    </div>
                    <button type="submit" class="btn-avaliar">Enviar Avaliação</button>
                </form>
            </div>
        `;
    },
    
    // Submeter avaliação
    submeterAvaliacao: function(event, localId) {
        event.preventDefault();
        
        const nota = document.getElementById(`nota-${localId}`).value;
        const nome = document.getElementById(`nome-${localId}`).value;
        const comentario = document.getElementById(`comentario-${localId}`).value;
        
        if (!nota || nota < 1) {
            alert('Por favor, selecione uma nota de 1 a 5 estrelas');
            return;
        }
        
        this.adicionarAvaliacao(localId, {
            nota: parseInt(nota),
            nome: nome,
            comentario: comentario
        });
        
        // Feedback visual
        const form = document.getElementById(`avaliacao-form-${localId}`);
        form.innerHTML = `
            <div class="avaliacao-sucesso">
                <span>✅</span>
                <p>Obrigado pela sua avaliação!</p>
            </div>
        `;
        
        // Atualizar resumos na página
        this.atualizarResumos(localId);
    },
    
    // Atualizar resumos na página
    atualizarResumos: function(localId) {
        const resumos = document.querySelectorAll(`[data-local="${localId}"].avaliacao-resumo`);
        resumos.forEach(resumo => {
            resumo.outerHTML = this.renderResumo(localId);
        });
    },
    
    // Bind eventos de clique nas estrelas
    bindEvents: function() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('star') && e.target.closest('.interativo')) {
                const stars = e.target.closest('.rating-stars');
                const localId = stars.dataset.local;
                const valor = e.target.dataset.value;
                
                // Atualizar visual
                stars.querySelectorAll('.star').forEach((star, index) => {
                    star.classList.toggle('filled', index < valor);
                    star.classList.toggle('empty', index >= valor);
                });
                
                // Atualizar input hidden
                const input = document.getElementById(`nota-${localId}`);
                if (input) input.value = valor;
            }
        });
    }
};

// Estilos do sistema de avaliações
const avaliacaoStyles = `
<style>
.avaliacao-resumo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
}

.rating-stars {
    display: inline-flex;
    gap: 2px;
}

.rating-stars .star {
    font-size: 1.2rem;
    color: #ddd;
    cursor: default;
    transition: color 0.2s;
}

.rating-stars .star.filled {
    color: #ffc107;
}

.rating-stars.interativo .star {
    cursor: pointer;
}

.rating-stars.interativo .star:hover {
    color: #ffdb4d;
}

.avaliacao-media {
    font-weight: 700;
    color: var(--forest-deep);
}

.avaliacao-total {
    color: #666;
    font-size: 0.85rem;
}

.avaliacao-form {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 15px;
    margin-top: 1rem;
}

.avaliacao-form h4 {
    margin-bottom: 1rem;
    color: var(--forest-deep);
}

.avaliacao-form .form-group {
    margin-bottom: 1rem;
}

.avaliacao-form label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.avaliacao-form input,
.avaliacao-form textarea {
    width: 100%;
    padding: 0.7rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
}

.btn-avaliar {
    background: var(--forest-deep);
    color: white;
    border: none;
    padding: 0.8rem 2rem;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-avaliar:hover {
    background: var(--gold-polish);
    color: var(--forest-deep);
}

.avaliacao-sucesso {
    text-align: center;
    padding: 2rem;
}

.avaliacao-sucesso span {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
}

.avaliacao-sucesso p {
    color: #28a745;
    font-weight: 600;
}
</style>
`;

// Exportar
window.AvaliacaoSistema = AvaliacaoSistema;
