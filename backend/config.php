<?php
/**
 * Configuração do Banco de Dados - Turismo SMS
 * Ajuste as constantes conforme seu servidor cPanel
 */

// ============================================
// CONFIGURAÇÕES DO BANCO DE DADOS
// ============================================

// Ambiente: 'development' ou 'production'
define('ENVIRONMENT', 'production');

// Configurações MySQL
define('DB_HOST', 'localhost');
define('DB_NAME', 'turismo_sms');          // Altere para o nome do seu banco
define('DB_USER', 'seu_usuario');           // Altere para seu usuário MySQL
define('DB_PASS', 'sua_senha');             // Altere para sua senha MySQL
define('DB_CHARSET', 'utf8mb4');

// ============================================
// CONFIGURAÇÕES DA APLICAÇÃO
// ============================================

define('SITE_NAME', 'Turismo São Mateus do Sul');
define('SITE_URL', 'https://turismo.saomateusdosul.pr.gov.br'); // Altere para sua URL
define('SITE_EMAIL', 'turismo@saomateusdosul.pr.gov.br');

// Chave secreta para tokens JWT
// IMPORTANTE: Defina JWT_SECRET como variável de ambiente no servidor!
// Nunca use o valor padrão em produção.
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'ALTERE_ESTA_CHAVE_EM_PRODUCAO_' . php_uname('n'));

// Tempo de expiração da sessão (em segundos) — 24 horas
define('SESSION_LIFETIME', 86400); // 1 dia

// ============================================
// CONFIGURAÇÕES DE UPLOAD
// ============================================

define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// ============================================
// CONFIGURAÇÕES DE E-MAIL (SMTP)
// ============================================

define('SMTP_HOST', 'smtp.saomateusdosul.pr.gov.br');
define('SMTP_PORT', 587);
define('SMTP_USER', 'turismo@saomateusdosul.pr.gov.br');
define('SMTP_PASS', 'sua_senha_smtp');
define('SMTP_FROM_NAME', 'Turismo São Mateus do Sul');

// ============================================
// CONFIGURAÇÕES DE SEGURANÇA
// ============================================

// Origens permitidas para CORS
define('ALLOWED_ORIGINS', [
    'https://turismo.saomateusdosul.pr.gov.br',
    'http://localhost',
    'http://127.0.0.1'
]);

// Rate limiting (requisições por minuto por IP)
define('RATE_LIMIT', 60);

// ============================================
// NÃO EDITE ABAIXO DESTA LINHA
// ============================================

// Configurar timezone
date_default_timezone_set('America/Sao_Paulo');

// Configurar tratamento de erros
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/php_errors.log');
}

// Configurar cookies de sessão seguros
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);

// Iniciar sessão se não iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Alerta em produção se JWT_SECRET não foi definida via env
if (ENVIRONMENT === 'production' && !getenv('JWT_SECRET')) {
    error_log('[SEGURANCA] JWT_SECRET não definida como variável de ambiente! Configure-a imediatamente.');
}
