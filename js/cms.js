/**
 * ============================================================
 * SISTEMA CMS SIMPLES - VERSÃO 3.0
 * ============================================================
 * 
 * CMS básico para gerenciar notícias.
 * Firebase Firestore como fonte primária, localStorage como fallback.
 */

const CMS = {
    
    // Configurações
    config: {
        storageKey: 'sms_cms_posts',
        categorias: ['Eventos', 'Cultura', 'Gastronomia', 'Turismo', 'Institucional'],
        maxPosts: 50
    },
    
    // Posts armazenados
    posts: [],
    _initPromise: null,
    
    // Inicializar CMS
    init: async function() {
        if (!this._initPromise) {
            this._initPromise = this.carregarPosts().then(() => this);
        }
        return this._initPromise;
    },
    
    // Carregar posts — Firebase primeiro, localStorage como fallback
    carregarPosts: async function() {
        try {
            const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            if (typeof CONFIG === 'undefined' || !CONFIG.firebase) throw new Error('CONFIG.firebase ausente');
            const firebaseConfig = CONFIG.firebase;
            const existingApp = getApps().find(a => a.name === 'cms-app');
            const app = existingApp || initializeApp(firebaseConfig, 'cms-app');
            const db = getFirestore(app);
            const snap = await getDocs(query(collection(db, 'noticias'), orderBy('data', 'desc')));
            if (!snap.empty) {
                this.posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // Garantir campos esperados pelo render
                this.posts = this.posts.map(p => ({
                    ...p,
                    titulo: p.titulo || 'Sem título',
                    slug: p.slug || this.gerarSlug(p.titulo || ''),
                    categoria: p.categoria || 'Institucional',
                    resumo: p.resumo || '',
                    conteudo: p.conteudo || '',
                    imagem: p.imagem || 'images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg',
                    autor: p.autor || 'Departamento de Turismo',
                    dataPublicacao: p.data || p.dataPublicacao || new Date().toISOString(),
                    destaque: p.destaque || false,
                    publicado: true
                }));
                return this.posts;
            }
        } catch (err) {
            console.warn('Firebase CMS indisponível, usando localStorage:', err.message);
        }
        // Fallback: localStorage ou posts iniciais
        const stored = localStorage.getItem(this.config.storageKey);
        this.posts = stored ? JSON.parse(stored) : this.getPostsIniciais();
        return this.posts;
    },
    
    // Salvar posts no localStorage (fallback local)
    salvarPosts: function() {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.posts));
    },
    
    // Posts iniciais de exemplo
    getPostsIniciais: function() {
        return [
            {
                id: 1,
                titulo: '5º AgroSamas 2026: Programação Completa Revelada',
                slug: 'agrosamas-2026-programacao',
                categoria: 'Eventos',
                resumo: 'O maior evento do município acontece de 17 a 21 de setembro com shows nacionais, feira gastronômica e exposição agropecuária.',
                conteudo: 'O maior evento do município acontece de 17 a 21 de setembro com shows nacionais, feira gastronômica e exposição agropecuária. Confira todos os detalhes da programação que promete superar todas as edições anteriores.\n\nA 5ª edição do AgroSamas promete ser a maior de todas, com atrações para toda a família, entrada gratuita e muita diversão.',
                imagem: 'images/RUA_DO_MATHE.jpg',
                autor: 'Departamento de Turismo',
                dataPublicacao: '2026-01-15T10:00:00',
                destaque: true,
                publicado: true
            },
            {
                id: 2,
                titulo: 'Polskie Smaki 2026: Festival Polonês em Agosto',
                slug: 'polskie-smaki-2026',
                categoria: 'Cultura',
                resumo: 'A 7ª edição do festival de gastronomia polonesa trará pratos típicos, apresentações folclóricas e oficinas culturais.',
                conteudo: 'A 7ª edição do festival de gastronomia polonesa trará pratos típicos, apresentações folclóricas e oficinas culturais.\n\nO evento celebra a rica herança polonesa de São Mateus do Sul com pierogi, golabki, danças típicas e muito mais.',
                imagem: 'images/POLSKIE_SMAKI__1_.jpg',
                autor: 'Departamento de Turismo',
                dataPublicacao: '2026-01-10T14:00:00',
                destaque: false,
                publicado: true
            },
            {
                id: 3,
                titulo: 'Nova Rota Turística: Caminhos do Iguaçu',
                slug: 'nova-rota-caminhos-iguacu',
                categoria: 'Turismo',
                resumo: 'Prefeitura inaugura roteiro de ecoturismo às margens do Rio Iguaçu com trilhas, mirantes e passeios de barco.',
                conteudo: 'A Prefeitura Municipal inaugurou a nova Rota Caminhos do Iguaçu, um roteiro de ecoturismo que percorre as margens do Rio Iguaçu.\n\nO percurso inclui trilhas ecológicas, mirantes panorâmicos e passeios de barco, oferecendo uma experiência única de contato com a natureza.',
                imagem: 'images/PRACA_DO_RIO_IGUACU.jpg',
                autor: 'Departamento de Turismo',
                dataPublicacao: '2026-01-05T09:00:00',
                destaque: false,
                publicado: true
            },
            {
                id: 4,
                titulo: 'Erva-Mate de São Mateus Conquista Prêmio Nacional',
                slug: 'erva-mate-premio-nacional',
                categoria: 'Gastronomia',
                resumo: 'Produtores locais recebem reconhecimento pela qualidade excepcional da erva-mate com Indicação Geográfica.',
                conteudo: 'Os produtores de erva-mate de São Mateus do Sul conquistaram mais um prêmio nacional de qualidade.\n\nA erva-mate com Indicação Geográfica (IG São Matheus) foi reconhecida como uma das melhores do Brasil, destacando o trabalho dos produtores locais.',
                imagem: 'images/PARRERAL__1_.jpg',
                autor: 'Departamento de Turismo',
                dataPublicacao: '2026-01-02T11:00:00',
                destaque: false,
                publicado: true
            }
        ];
    },
    
    // Obter todos os posts publicados
    getPostsPublicados: function() {
        return this.posts
            .filter(p => p.publicado)
            .sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao));
    },
    
    // Obter post por slug
    getPostPorSlug: function(slug) {
        return this.posts.find(p => p.slug === slug);
    },
    
    // Obter post por ID
    getPostPorId: function(id) {
        return this.posts.find(p => p.id === id);
    },
    
    // Obter posts por categoria
    getPostsPorCategoria: function(categoria) {
        return this.getPostsPublicados().filter(p => p.categoria === categoria);
    },
    
    // Obter post destaque
    getPostDestaque: function() {
        return this.posts.find(p => p.destaque && p.publicado);
    },
    
    // Criar novo post
    criarPost: function(dados) {
        const novoId = Math.max(...this.posts.map(p => p.id), 0) + 1;
        const slug = this.gerarSlug(dados.titulo);
        
        const novoPost = {
            id: novoId,
            titulo: dados.titulo,
            slug: slug,
            categoria: dados.categoria || 'Institucional',
            resumo: dados.resumo || '',
            conteudo: dados.conteudo || '',
            imagem: dados.imagem || '',
            autor: dados.autor || 'Departamento de Turismo',
            dataPublicacao: dados.dataPublicacao || new Date().toISOString(),
            destaque: dados.destaque || false,
            publicado: dados.publicado || false
        };
        
        this.posts.unshift(novoPost);
        this.salvarPosts();
        
        return novoPost;
    },
    
    // Atualizar post
    atualizarPost: function(id, dados) {
        const index = this.posts.findIndex(p => p.id === id);
        if (index === -1) return null;
        
        this.posts[index] = { ...this.posts[index], ...dados };
        this.salvarPosts();
        
        return this.posts[index];
    },
    
    // Excluir post
    excluirPost: function(id) {
        const index = this.posts.findIndex(p => p.id === id);
        if (index === -1) return false;
        
        this.posts.splice(index, 1);
        this.salvarPosts();
        
        return true;
    },
    
    // Gerar slug a partir do título
    gerarSlug: function(titulo) {
        return titulo
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
    },
    
    // Formatar data
    formatarData: function(dataISO) {
        const data = new Date(dataISO);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    },
    
    // Escapar HTML para prevenir XSS
    escapeHTML: function(str) {
        if (window.SMSecurity) return window.SMSecurity.html(str);
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    safeURL: function(url, fallback) {
        if (window.SMSecurity) return window.SMSecurity.url(url, fallback || '');
        return this.escapeHTML(url || fallback || '');
    },

    // Renderizar lista de posts
    renderizarLista: function(containerId, limite = 10) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const posts = this.getPostsPublicados().slice(0, limite);

        container.innerHTML = posts.map(post => `
            <article class="post-card" data-id="${this.escapeHTML(String(post.id))}">
                <div class="post-image" style="background-image: url('${this.safeURL(post.imagem, 'images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg')}');"></div>
                <div class="post-content">
                    <span class="post-category">${this.escapeHTML(post.categoria)}</span>
                    <h3 class="post-title">${this.escapeHTML(post.titulo)}</h3>
                    <p class="post-excerpt">${this.escapeHTML(post.resumo)}</p>
                    <div class="post-meta">
                        <span>📅 ${this.formatarData(post.dataPublicacao)}</span>
                        <a href="/noticia?slug=${encodeURIComponent(post.slug)}" class="post-link">Leia mais →</a>
                    </div>
                </div>
            </article>
        `).join('');
    }
};

// Exportar
window.CMS = CMS;

// Auto-inicializar
document.addEventListener('DOMContentLoaded', function() {
    CMS.init();
});
