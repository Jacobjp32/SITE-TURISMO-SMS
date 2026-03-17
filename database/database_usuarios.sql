-- ============================================
-- TURISMO SÃO MATEUS DO SUL
-- Dados Iniciais de Usuários - MySQL/MariaDB
-- ============================================

-- ATENÇÃO: Execute este script APÓS o database_schema.sql
-- A senha padrão 'Admin@123' deve ser alterada no primeiro acesso

-- ============================================
-- INSERIR USUÁRIO ADMINISTRADOR
-- Senha: Admin@123 (hash bcrypt)
-- ============================================

INSERT INTO usuarios (
    uid,
    nome,
    email,
    senha_hash,
    telefone,
    tipo,
    organizacao,
    role,
    ativo,
    verificado
) VALUES (
    'admin_001',
    'Administrador',
    'admin@saomateusdosul.pr.gov.br',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@123
    '(42) 99999-0000',
    'organizador',
    'Prefeitura Municipal de São Mateus do Sul',
    'admin',
    1,
    1
);

-- ============================================
-- INSERIR USUÁRIO JACOB (DESENVOLVEDOR)
-- ============================================

INSERT INTO usuarios (
    uid,
    nome,
    email,
    senha_hash,
    telefone,
    tipo,
    organizacao,
    role,
    ativo,
    verificado
) VALUES (
    '4EMo0psXyyetEzMhEcWLdxGvbAz2',
    'Jacob Jonson Portela',
    'jacobjonson32@gmail.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Alterar após login
    '42988283963',
    'organizador',
    'Desenvolvimento',
    'admin',
    1,
    1
);

-- ============================================
-- LOG DA CRIAÇÃO
-- ============================================

INSERT INTO logs_atividade (acao, descricao) VALUES
('sistema_inicializado', 'Banco de dados criado e usuários iniciais inseridos');
