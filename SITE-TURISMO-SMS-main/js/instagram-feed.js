/**
 * ============================================================
 * FEED DO INSTAGRAM - VERSÃO 2.0
 * ============================================================
 * 
 * Exibe as últimas postagens do Instagram do turismo.
 * Requer configuração da API do Instagram Basic Display.
 * 
 * Instruções:
 * 1. Criar app no Facebook Developers
 * 2. Configurar Instagram Basic Display
 * 3. Gerar token de acesso
 * 4. Substituir INSTAGRAM_ACCESS_TOKEN abaixo
 */

const InstagramFeed = {
    
    // Configurações
    config: {
        accessToken: 'INSTAGRAM_ACCESS_TOKEN', // Substitua pelo seu token
        userId: 'me',
        limit: 6,
        containerId: 'instagram-feed'
    },
    
    // Inicializar feed
    init: function(options = {}) {
        this.config = { ...this.config, ...options };
        
        if (this.config.accessToken === 'INSTAGRAM_ACCESS_TOKEN') {
            console.warn('⚠️ Instagram Feed: Token não configurado');
            this.renderPlaceholder();
            return;
        }
        
        this.fetchMedia();
    },
    
    // Buscar mídia do Instagram
    fetchMedia: async function() {
        const container = document.getElementById(this.config.containerId);
        if (!container) return;
        
        container.innerHTML = '<div class="instagram-loading">Carregando...</div>';
        
        try {
            const url = `https://graph.instagram.com/${this.config.userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${this.config.accessToken}&limit=${this.config.limit}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.data) {
                this.renderFeed(data.data);
            } else {
                throw new Error('Sem dados');
            }
        } catch (error) {
            console.error('Erro ao carregar Instagram:', error);
            this.renderPlaceholder();
        }
    },
    
    // Renderizar feed
    renderFeed: function(posts) {
        const container = document.getElementById(this.config.containerId);
        if (!container) return;
        
        const html = `
            <div class="instagram-grid">
                ${posts.map(post => `
                    <a href="${post.permalink}" target="_blank" class="instagram-item" rel="noopener">
                        <img src="${post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}" 
                             alt="${post.caption ? post.caption.substring(0, 50) : 'Post do Instagram'}"
                             loading="lazy">
                        <div class="instagram-overlay">
                            <span>${post.media_type === 'VIDEO' ? '▶' : '📷'}</span>
                        </div>
                    </a>
                `).join('')}
            </div>
            <a href="https://instagram.com/turismoSMS" target="_blank" class="instagram-follow">
                📸 Siga @turismoSMS no Instagram
            </a>
        `;
        
        container.innerHTML = html;
    },
    
    // Placeholder quando não configurado
    renderPlaceholder: function() {
        const container = document.getElementById(this.config.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="instagram-placeholder">
                <div class="instagram-grid">
                    ${Array(6).fill().map(() => `
                        <div class="instagram-item placeholder">
                            <div class="placeholder-content">📷</div>
                        </div>
                    `).join('')}
                </div>
                <p class="instagram-note">
                    Feed do Instagram em breve!<br>
                    <a href="https://instagram.com/turismoSMS" target="_blank">Siga @turismoSMS</a>
                </p>
            </div>
        `;
    }
};

// Estilos do Instagram Feed
const instagramStyles = `
<style>
.instagram-section {
    padding: 4rem 2rem;
    background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%);
}

.instagram-section .section-title {
    color: white !important;
    text-align: center;
}

.instagram-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    max-width: 1200px;
    margin: 2rem auto;
}

.instagram-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 10px;
}

.instagram-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.instagram-item:hover img {
    transform: scale(1.1);
}

.instagram-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
    color: white;
    font-size: 2rem;
}

.instagram-item:hover .instagram-overlay {
    opacity: 1;
}

.instagram-item.placeholder {
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
}

.placeholder-content {
    font-size: 2rem;
    opacity: 0.5;
}

.instagram-follow {
    display: block;
    text-align: center;
    color: white;
    text-decoration: none;
    font-weight: 600;
    padding: 1rem 2rem;
    background: rgba(255,255,255,0.2);
    border-radius: 30px;
    max-width: 300px;
    margin: 0 auto;
    transition: all 0.3s;
}

.instagram-follow:hover {
    background: white;
    color: #833ab4;
}

.instagram-note {
    text-align: center;
    color: white;
    opacity: 0.9;
    margin-top: 1rem;
}

.instagram-note a {
    color: white;
    text-decoration: underline;
}

.instagram-loading {
    text-align: center;
    color: white;
    padding: 3rem;
    font-size: 1.2rem;
}

@media (max-width: 992px) {
    .instagram-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 600px) {
    .instagram-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
`;

// Exportar
window.InstagramFeed = InstagramFeed;
