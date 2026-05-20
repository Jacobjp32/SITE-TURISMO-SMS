const APP_CHECK_SDK_URL = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js';

function getAppCheckConfig() {
    if (typeof window === 'undefined' || !window.CONFIG || !window.CONFIG.appCheck) {
        return null;
    }

    const config = window.CONFIG.appCheck;
    if (!config.enabled || !config.siteKey) {
        return null;
    }

    return config;
}

export async function initCompatAppCheck(firebaseRef) {
    const config = getAppCheckConfig();
    if (!config || !firebaseRef || !firebaseRef.appCheck || window.__smsCompatAppCheckInitialized) {
        return false;
    }

    try {
        // Firebase App Check preparado. Não ativar enforcement no console antes de validar em produção.
        firebaseRef.appCheck().activate(config.siteKey, true);
        window.__smsCompatAppCheckInitialized = true;
        return true;
    } catch (error) {
        if (error && /already|activated|initialized/i.test(error.message || '')) {
            window.__smsCompatAppCheckInitialized = true;
            return true;
        }
        console.warn('[app-check] Falha ao inicializar App Check compat:', error && error.message ? error.message : error);
        return false;
    }
}

export async function initModularAppCheck(app) {
    const config = getAppCheckConfig();
    if (!config || !app) {
        return false;
    }

    window.__smsModularAppCheckInitialized = window.__smsModularAppCheckInitialized || {};
    const appName = app.name || '[DEFAULT]';
    if (window.__smsModularAppCheckInitialized[appName]) {
        return false;
    }

    try {
        const { initializeAppCheck, ReCaptchaV3Provider } = await import(APP_CHECK_SDK_URL);
        // Firebase App Check preparado. Não ativar enforcement no console antes de validar em produção.
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(config.siteKey),
            isTokenAutoRefreshEnabled: true
        });
        window.__smsModularAppCheckInitialized[appName] = true;
        return true;
    } catch (error) {
        if (error && /already|activated|initialized/i.test(error.message || '')) {
            window.__smsModularAppCheckInitialized[appName] = true;
            return true;
        }
        console.warn('[app-check] Falha ao inicializar App Check modular:', error && error.message ? error.message : error);
        return false;
    }
}
