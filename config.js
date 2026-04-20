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
        url: 'https://turismo.saomateusdosul.pr.gov.br',
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
        instagram2: 'https://www.instagram.com/depculturaeturismosms/',
        youtube: 'https://youtube.com/@prefeiturasms',
        tiktok: 'https://www.tiktok.com/@prefeiturasms'
    },

    // ============================================================
    // GOOGLE ANALYTICS
    // ============================================================
    analytics: {
        enabled: true,
        ga4Id: 'G-YPRT7FFFV8'
    },

    // ============================================================
    // FORMULÁRIO DE CONTATO
    // ============================================================
    formulario: {
        formspree: {
            enabled: false,
            formId: 'xpqykpqd'
        },
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
    // FIREBASE
    // Configuração centralizada do Firebase
    // ============================================================
    firebase: {
        apiKey: 'AIzaSyAy5161iVe7JoLgLMp1EN52OsBHXjo3JYQ',
        authDomain: 'turismo-sms.firebaseapp.com',
        projectId: 'turismo-sms',
        storageBucket: 'turismo-sms.firebasestorage.app',
        messagingSenderId: '1042825829044',
        appId: '1:1042825829044:web:13173093e28be3199955e1'
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
            'youtube': CONFIG.redesSociais.youtube,
            'tiktok': CONFIG.redesSociais.tiktok
        };
        
        document.querySelectorAll('[data-social]').forEach(function(link) {
            const platform = link.getAttribute('data-social');
            if (platform && socialLinks[platform]) {
                link.href = socialLinks[platform];
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
    if (CONFIG.analytics && CONFIG.analytics.enabled && CONFIG.analytics.ga4Id && !window.__SMS_GA_INITIALIZED) {
        if (typeof window.gtag === 'function') {
            window.__SMS_GA_INITIALIZED = true;
            return;
        }

        // Carregar script do GA4
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.analytics.ga4Id;
        document.head.appendChild(script);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', CONFIG.analytics.ga4Id);
        window.__SMS_GA_INITIALIZED = true;
    }
    
});

// Exportar para uso global
window.CONFIG = CONFIG;
