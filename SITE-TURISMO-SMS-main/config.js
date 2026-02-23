/**
 * ============================================================
 * CONFIGURAÇÕES DO PORTAL DE TURISMO - SÃO MATEUS DO SUL
 * ============================================================
 * 
 * Este arquivo centraliza todas as configurações do site.
 * Edite os valores abaixo conforme necessário.
 */

const CONFIG = {
    
    // ============================================================
    // INFORMAÇÕES DO SITE
    // ============================================================
    site: {
        nome: 'Portal de Turismo de São Mateus do Sul',
        slogan: 'Capital Polonesa do Paraná',
        url: 'https://turismosaomateusdosul.netlify.app',
        email: 'turismo@saomateusdosul.pr.gov.br',
        telefone: '(42) 3532-0000',
        endereco: 'Rua Barão do Rio Branco, Centro • CEP 83900-000 • São Mateus do Sul - PR'
    },

    // ============================================================
    // REDES SOCIAIS
    // ============================================================
    redesSociais: {
        facebook: 'https://www.facebook.com/share/1CC3pQvqsi/',
        instagram: 'https://instagram.com/depculturaeturismosms',
        twitter: '#',
        youtube: 'https://youtube.com/@prefeiturasms',
        tiktok: 'https://www.tiktok.com/@prefeiturasms'
    },

    // ============================================================
    // GOOGLE ANALYTICS
    // ============================================================
    analytics: {
        enabled: true,
        measurementId: 'G-381594060'  // Seu ID do GA4
    },

    // ============================================================
    // FORMULÁRIO DE CONTATO
    // Configure uma das opções abaixo
    // ============================================================
    formulario: {
        // Opção 1: Netlify Forms (recomendado se hospedado no Netlify)
        netlifyForms: false,    // Mude para true se usar Netlify
        
        // Opção 2: Formspree
        formspree: {
            enabled: false,     // Mude para true se usar Formspree
            formId: 'YOUR_FORM_ID'  // Substitua pelo seu ID do Formspree
        },
        
        // Opção 3: Email direto (menos recomendado)
        emailDireto: 'turismo@saomateusdosul.pr.gov.br'
    },

    // ============================================================
    // BANNER AGROSAMAS
    // Controle de exibição do banner promocional
    // ============================================================
    agrosamas: {
        bannerAtivo: false,     // Mude para true para ativar o banner na home
        ano: 2026,
        dataInicio: '2026-09-17',
        dataFim: '2026-09-21',
        website: 'https://agrosamas.com.br',
        instagram: '@agrosamas2026'
    },

    // ============================================================
    // GOOGLE MAPS
    // Configure sua API key para melhor performance
    // ============================================================
    maps: {
        apiKey: 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8',  // Google Maps (modal de localização)
        centro: {
            lat: -25.8668,
            lng: -50.3828
        },
        zoom: 14
    },

    // ============================================================
    // IDIOMA PADRÃO
    // ============================================================
    idioma: {
        padrao: 'pt',
        disponiveis: ['pt', 'en', 'es', 'pl']
    },

    // ============================================================
    // FUNCIONALIDADES
    // Ative/desative recursos do site
    // ============================================================
    funcionalidades: {
        chatbot: true,          // Chatbot de atendimento ✅ ATIVO
        feedInstagram: true,    // Feed do Instagram ✅ ATIVO
        avaliacoes: true,       // Sistema de avaliações ✅ ATIVO
        reservas: true,         // Reservas online ✅ ATIVO
        blog: true,             // Blog dinâmico ✅ ATIVO
        newsletter: true,       // Newsletter no formulário
        darkMode: true          // Modo escuro ✅ ATIVO
    }
};

// ============================================================
// APLICAR CONFIGURAÇÕES AUTOMATICAMENTE
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Aplicar redes sociais
    if (CONFIG.redesSociais) {
        const socialLinks = {
            'facebook': CONFIG.redesSociais.facebook,
            'instagram': CONFIG.redesSociais.instagram,
            'twitter': CONFIG.redesSociais.twitter,
            'youtube': CONFIG.redesSociais.youtube
        };
        
        document.querySelectorAll('.social-link').forEach(function(link, index) {
            const platforms = ['facebook', 'instagram', 'twitter', 'youtube'];
            if (platforms[index] && socialLinks[platforms[index]] !== '#') {
                link.href = socialLinks[platforms[index]];
            }
        });
    }
    
    // Ativar banner AgroSamas se configurado
    if (CONFIG.agrosamas && CONFIG.agrosamas.bannerAtivo) {
        const banner = document.getElementById('agrosamas-banner');
        if (banner) {
            const fechouBanner = localStorage.getItem('agrosamas-banner-closed');
            if (!fechouBanner) {
                banner.classList.remove('agrosamas-hidden');
            }
        }
    }
    
    // Google Analytics
    if (CONFIG.analytics && CONFIG.analytics.enabled && CONFIG.analytics.ga4Id) {
        // Carregar script do GA4
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.analytics.ga4Id;
        document.head.appendChild(script);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', CONFIG.analytics.ga4Id);
    }
    
    console.log('✅ Configurações do site carregadas');
});

// Exportar para uso global
window.CONFIG = CONFIG;
