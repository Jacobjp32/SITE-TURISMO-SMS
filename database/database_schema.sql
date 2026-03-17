-- ============================================
-- TURISMO SÃO MATEUS DO SUL
-- Schema do Banco de Dados - MySQL/MariaDB
-- Versão: 1.0
-- ============================================

-- Configurações iniciais
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';

-- Criar banco de dados (ajuste o nome conforme necessário)
-- CREATE DATABASE IF NOT EXISTS turismo_sms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE turismo_sms;

-- ============================================
-- TABELA: usuarios
-- Armazena os usuários do sistema
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(128) NOT NULL UNIQUE COMMENT 'UID único do usuário',
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL COMMENT 'Senha com hash bcrypt',
    telefone VARCHAR(20) DEFAULT NULL,
    tipo ENUM('turista', 'organizador', 'estabelecimento') DEFAULT 'turista',
    organizacao VARCHAR(255) DEFAULT NULL,
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    ativo TINYINT(1) DEFAULT 1,
    verificado TINYINT(1) DEFAULT 0,
    token_verificacao VARCHAR(255) DEFAULT NULL,
    token_reset_senha VARCHAR(255) DEFAULT NULL,
    token_reset_expira DATETIME DEFAULT NULL,
    ultimo_login DATETIME DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_uid (uid),
    INDEX idx_role (role),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: eventos_pendentes
-- Eventos aguardando aprovação
-- ============================================
CREATE TABLE IF NOT EXISTS eventos_pendentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE DEFAULT NULL,
    hora_inicio TIME DEFAULT NULL,
    hora_fim TIME DEFAULT NULL,
    local VARCHAR(255) NOT NULL,
    endereco TEXT DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    entrada ENUM('gratuito', 'pago') DEFAULT 'gratuito',
    valor DECIMAL(10,2) DEFAULT NULL,
    contato VARCHAR(255) DEFAULT NULL,
    site VARCHAR(500) DEFAULT NULL,
    imagem_url VARCHAR(500) DEFAULT NULL,
    
    -- Dados do solicitante
    submitted_by INT NOT NULL,
    submitted_by_name VARCHAR(255) DEFAULT NULL,
    submitted_by_email VARCHAR(255) DEFAULT NULL,
    
    -- Status e revisão
    status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    review_notes TEXT DEFAULT NULL,
    
    FOREIGN KEY (submitted_by) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_status (status),
    INDEX idx_submitted_by (submitted_by),
    INDEX idx_data_inicio (data_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: eventos_aprovados
-- Eventos aprovados e publicados
-- ============================================
CREATE TABLE IF NOT EXISTS eventos_aprovados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_original_id INT DEFAULT NULL COMMENT 'ID do evento pendente original',
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE DEFAULT NULL,
    hora_inicio TIME DEFAULT NULL,
    hora_fim TIME DEFAULT NULL,
    local VARCHAR(255) NOT NULL,
    endereco TEXT DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    entrada ENUM('gratuito', 'pago') DEFAULT 'gratuito',
    valor DECIMAL(10,2) DEFAULT NULL,
    contato VARCHAR(255) DEFAULT NULL,
    site VARCHAR(500) DEFAULT NULL,
    imagem_url VARCHAR(500) DEFAULT NULL,
    
    -- Dados do organizador
    submitted_by INT NOT NULL,
    submitted_by_name VARCHAR(255) DEFAULT NULL,
    submitted_by_email VARCHAR(255) DEFAULT NULL,
    
    -- Dados da aprovação
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT DEFAULT NULL,
    review_notes TEXT DEFAULT NULL,
    
    -- Visibilidade
    destaque TINYINT(1) DEFAULT 0 COMMENT 'Evento em destaque na home',
    ativo TINYINT(1) DEFAULT 1,
    
    FOREIGN KEY (submitted_by) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_data_inicio (data_inicio),
    INDEX idx_destaque (destaque),
    INDEX idx_ativo (ativo),
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: estabelecimentos_pendentes
-- Estabelecimentos aguardando aprovação
-- ============================================
CREATE TABLE IF NOT EXISTS estabelecimentos_pendentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT NULL,
    endereco TEXT NOT NULL,
    cidade VARCHAR(100) DEFAULT 'São Mateus do Sul',
    estado VARCHAR(2) DEFAULT 'PR',
    cep VARCHAR(10) DEFAULT NULL,
    latitude DECIMAL(10,8) DEFAULT NULL,
    longitude DECIMAL(11,8) DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    whatsapp VARCHAR(20) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    site VARCHAR(500) DEFAULT NULL,
    instagram VARCHAR(100) DEFAULT NULL,
    facebook VARCHAR(255) DEFAULT NULL,
    horario_funcionamento TEXT DEFAULT NULL,
    faixa_preco ENUM('$', '$$', '$$$', '$$$$') DEFAULT NULL,
    imagem_url VARCHAR(500) DEFAULT NULL,
    
    -- Dados do solicitante
    submitted_by INT NOT NULL,
    submitted_by_name VARCHAR(255) DEFAULT NULL,
    submitted_by_email VARCHAR(255) DEFAULT NULL,
    
    -- Status
    status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    review_notes TEXT DEFAULT NULL,
    
    FOREIGN KEY (submitted_by) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_status (status),
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: estabelecimentos_aprovados
-- Estabelecimentos aprovados e publicados
-- ============================================
CREATE TABLE IF NOT EXISTS estabelecimentos_aprovados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estabelecimento_original_id INT DEFAULT NULL,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT NULL,
    endereco TEXT NOT NULL,
    cidade VARCHAR(100) DEFAULT 'São Mateus do Sul',
    estado VARCHAR(2) DEFAULT 'PR',
    cep VARCHAR(10) DEFAULT NULL,
    latitude DECIMAL(10,8) DEFAULT NULL,
    longitude DECIMAL(11,8) DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    whatsapp VARCHAR(20) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    site VARCHAR(500) DEFAULT NULL,
    instagram VARCHAR(100) DEFAULT NULL,
    facebook VARCHAR(255) DEFAULT NULL,
    horario_funcionamento TEXT DEFAULT NULL,
    faixa_preco ENUM('$', '$$', '$$$', '$$$$') DEFAULT NULL,
    imagem_url VARCHAR(500) DEFAULT NULL,
    
    -- Dados do proprietário
    submitted_by INT NOT NULL,
    submitted_by_name VARCHAR(255) DEFAULT NULL,
    submitted_by_email VARCHAR(255) DEFAULT NULL,
    
    -- Aprovação
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT DEFAULT NULL,
    
    -- Visibilidade
    destaque TINYINT(1) DEFAULT 0,
    ativo TINYINT(1) DEFAULT 1,
    
    -- Avaliações (cache)
    avaliacao_media DECIMAL(2,1) DEFAULT 0,
    total_avaliacoes INT DEFAULT 0,
    
    FOREIGN KEY (submitted_by) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_categoria (categoria),
    INDEX idx_destaque (destaque),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: avaliacoes
-- Avaliações de estabelecimentos e eventos
-- ============================================
CREATE TABLE IF NOT EXISTS avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('estabelecimento', 'evento') NOT NULL,
    item_id INT NOT NULL COMMENT 'ID do estabelecimento ou evento',
    nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo TINYINT(1) DEFAULT 1,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_avaliacao (usuario_id, tipo, item_id),
    INDEX idx_item (tipo, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: sessoes
-- Controle de sessões ativas
-- ============================================
CREATE TABLE IF NOT EXISTS sessoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_token (token),
    INDEX idx_expira (expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: logs_atividade
-- Log de atividades para auditoria
-- ============================================
CREATE TABLE IF NOT EXISTS logs_atividade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT DEFAULT NULL,
    acao VARCHAR(100) NOT NULL,
    descricao TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    dados_extras JSON DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_acao (acao),
    INDEX idx_criado (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: configuracoes
-- Configurações gerais do sistema
-- ============================================
CREATE TABLE IF NOT EXISTS configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT DEFAULT NULL,
    descricao VARCHAR(255) DEFAULT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, descricao) VALUES
('site_nome', 'Turismo São Mateus do Sul', 'Nome do site'),
('site_email', 'turismo@saomateusdosul.pr.gov.br', 'E-mail de contato'),
('manutencao', '0', 'Modo manutenção ativo'),
('cadastro_aberto', '1', 'Permitir novos cadastros');
