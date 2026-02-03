<?php
/**
 * Classe Auth - Gerencia autenticação e autorização
 */

require_once __DIR__ . '/database.php';

class Auth {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Registra novo usuário
     * @param array $data Dados do usuário
     * @return array Resultado da operação
     */
    public function register(array $data): array {
        try {
            // Validar dados obrigatórios
            if (empty($data['nome']) || empty($data['email']) || empty($data['senha'])) {
                return ['success' => false, 'message' => 'Nome, e-mail e senha são obrigatórios.'];
            }

            // Validar e-mail
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return ['success' => false, 'message' => 'E-mail inválido.'];
            }

            // Verificar se e-mail já existe
            $existing = $this->db->fetchOne(
                "SELECT id FROM usuarios WHERE email = ?",
                [$data['email']]
            );

            if ($existing) {
                return ['success' => false, 'message' => 'Este e-mail já está cadastrado.'];
            }

            // Validar senha (mínimo 6 caracteres)
            if (strlen($data['senha']) < 6) {
                return ['success' => false, 'message' => 'A senha deve ter pelo menos 6 caracteres.'];
            }

            // Gerar UID único
            $uid = $this->generateUID();

            // Hash da senha
            $senhaHash = password_hash($data['senha'], PASSWORD_BCRYPT, ['cost' => 10]);

            // Inserir usuário
            $sql = "INSERT INTO usuarios (uid, nome, email, senha_hash, telefone, tipo, organizacao, role, ativo, verificado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 1, 0)";
            
            $params = [
                $uid,
                $data['nome'],
                $data['email'],
                $senhaHash,
                $data['telefone'] ?? null,
                $data['tipo'] ?? 'turista',
                $data['organizacao'] ?? null
            ];

            $userId = $this->db->insert($sql, $params);

            // Log da atividade
            $this->logActivity($userId, 'registro', 'Novo usuário registrado');

            // Criar sessão
            $token = $this->createSession($userId);

            // Buscar dados do usuário criado
            $user = $this->getUserById($userId);

            return [
                'success' => true,
                'message' => 'Cadastro realizado com sucesso!',
                'user' => $this->sanitizeUser($user),
                'token' => $token
            ];

        } catch (Exception $e) {
            $this->logError('Erro no registro: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erro ao criar conta. Tente novamente.'];
        }
    }

    /**
     * Realiza login
     * @param string $email E-mail do usuário
     * @param string $senha Senha do usuário
     * @return array Resultado da operação
     */
    public function login(string $email, string $senha): array {
        try {
            // Buscar usuário pelo e-mail
            $user = $this->db->fetchOne(
                "SELECT * FROM usuarios WHERE email = ?",
                [$email]
            );

            if (!$user) {
                return ['success' => false, 'message' => 'E-mail ou senha incorretos.'];
            }

            // Verificar se está ativo
            if (!$user['ativo']) {
                return ['success' => false, 'message' => 'Conta desativada. Entre em contato com o suporte.'];
            }

            // Verificar senha
            if (!password_verify($senha, $user['senha_hash'])) {
                return ['success' => false, 'message' => 'E-mail ou senha incorretos.'];
            }

            // Atualizar último login
            $this->db->execute(
                "UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?",
                [$user['id']]
            );

            // Criar sessão
            $token = $this->createSession($user['id']);

            // Log da atividade
            $this->logActivity($user['id'], 'login', 'Login realizado');

            return [
                'success' => true,
                'message' => 'Login realizado com sucesso!',
                'user' => $this->sanitizeUser($user),
                'token' => $token
            ];

        } catch (Exception $e) {
            $this->logError('Erro no login: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erro ao fazer login. Tente novamente.'];
        }
    }

    /**
     * Realiza logout
     * @param string $token Token da sessão
     * @return array Resultado da operação
     */
    public function logout(string $token): array {
        try {
            // Buscar sessão
            $session = $this->db->fetchOne(
                "SELECT usuario_id FROM sessoes WHERE token = ?",
                [$token]
            );

            if ($session) {
                // Remover sessão
                $this->db->execute("DELETE FROM sessoes WHERE token = ?", [$token]);
                
                // Log da atividade
                $this->logActivity($session['usuario_id'], 'logout', 'Logout realizado');
            }

            return ['success' => true, 'message' => 'Logout realizado com sucesso.'];

        } catch (Exception $e) {
            return ['success' => true, 'message' => 'Logout realizado.'];
        }
    }

    /**
     * Verifica se o token é válido e retorna o usuário
     * @param string $token Token da sessão
     * @return array|null Dados do usuário ou null
     */
    public function validateToken(string $token): ?array {
        try {
            $session = $this->db->fetchOne(
                "SELECT s.*, u.* FROM sessoes s 
                 JOIN usuarios u ON s.usuario_id = u.id 
                 WHERE s.token = ? AND s.expira_em > NOW() AND u.ativo = 1",
                [$token]
            );

            if ($session) {
                return $this->sanitizeUser($session);
            }

            return null;

        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Obtém usuário atual a partir do header Authorization
     * @return array|null
     */
    public function getCurrentUser(): ?array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $this->validateToken($matches[1]);
        }

        return null;
    }

    /**
     * Verifica se o usuário atual é admin
     * @return bool
     */
    public function isAdmin(): bool {
        $user = $this->getCurrentUser();
        return $user && $user['role'] === 'admin';
    }

    /**
     * Verifica se o usuário atual é moderador ou admin
     * @return bool
     */
    public function isModerator(): bool {
        $user = $this->getCurrentUser();
        return $user && in_array($user['role'], ['admin', 'moderator']);
    }

    /**
     * Cria uma sessão para o usuário
     * @param int $userId ID do usuário
     * @return string Token da sessão
     */
    private function createSession(int $userId): string {
        // Gerar token único
        $token = bin2hex(random_bytes(32));

        // Calcular expiração
        $expiraEm = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);

        // Inserir sessão
        $sql = "INSERT INTO sessoes (usuario_id, token, ip_address, user_agent, expira_em) 
                VALUES (?, ?, ?, ?, ?)";
        
        $this->db->insert($sql, [
            $userId,
            $token,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $expiraEm
        ]);

        return $token;
    }

    /**
     * Busca usuário por ID
     * @param int $id ID do usuário
     * @return array|null
     */
    public function getUserById(int $id): ?array {
        return $this->db->fetchOne(
            "SELECT * FROM usuarios WHERE id = ?",
            [$id]
        );
    }

    /**
     * Busca usuário por e-mail
     * @param string $email E-mail do usuário
     * @return array|null
     */
    public function getUserByEmail(string $email): ?array {
        return $this->db->fetchOne(
            "SELECT * FROM usuarios WHERE email = ?",
            [$email]
        );
    }

    /**
     * Lista todos os usuários (apenas admin)
     * @return array
     */
    public function getAllUsers(): array {
        if (!$this->isAdmin()) {
            return [];
        }

        return $this->db->fetchAll(
            "SELECT id, uid, nome, email, telefone, tipo, organizacao, role, ativo, verificado, ultimo_login, criado_em 
             FROM usuarios 
             ORDER BY criado_em DESC"
        );
    }

    /**
     * Altera o role de um usuário (apenas admin)
     * @param int $userId ID do usuário
     * @param string $newRole Novo role
     * @return array Resultado da operação
     */
    public function setUserRole(int $userId, string $newRole): array {
        if (!$this->isAdmin()) {
            return ['success' => false, 'message' => 'Permissão negada.'];
        }

        $validRoles = ['user', 'moderator', 'admin'];
        if (!in_array($newRole, $validRoles)) {
            return ['success' => false, 'message' => 'Role inválido.'];
        }

        try {
            $this->db->execute(
                "UPDATE usuarios SET role = ? WHERE id = ?",
                [$newRole, $userId]
            );

            $currentUser = $this->getCurrentUser();
            $this->logActivity($currentUser['id'], 'alterar_role', "Role do usuário $userId alterado para $newRole");

            return ['success' => true, 'message' => 'Permissão atualizada!'];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Erro ao atualizar permissão.'];
        }
    }

    /**
     * Ativa/Desativa um usuário (apenas admin)
     * @param int $userId ID do usuário
     * @param bool $ativo Status
     * @return array Resultado da operação
     */
    public function toggleUserStatus(int $userId, bool $ativo): array {
        if (!$this->isAdmin()) {
            return ['success' => false, 'message' => 'Permissão negada.'];
        }

        try {
            $this->db->execute(
                "UPDATE usuarios SET ativo = ? WHERE id = ?",
                [$ativo ? 1 : 0, $userId]
            );

            $status = $ativo ? 'ativado' : 'desativado';
            $currentUser = $this->getCurrentUser();
            $this->logActivity($currentUser['id'], 'alterar_status', "Usuário $userId $status");

            return ['success' => true, 'message' => "Usuário $status!"];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Erro ao atualizar status.'];
        }
    }

    /**
     * Gera UID único
     * @return string
     */
    private function generateUID(): string {
        return bin2hex(random_bytes(16));
    }

    /**
     * Remove dados sensíveis do usuário
     * @param array $user Dados do usuário
     * @return array Dados sanitizados
     */
    private function sanitizeUser(array $user): array {
        unset($user['senha_hash']);
        unset($user['token_verificacao']);
        unset($user['token_reset_senha']);
        unset($user['token_reset_expira']);
        return $user;
    }

    /**
     * Log de atividade
     * @param int|null $userId ID do usuário
     * @param string $acao Ação realizada
     * @param string $descricao Descrição
     */
    private function logActivity(?int $userId, string $acao, string $descricao): void {
        try {
            $sql = "INSERT INTO logs_atividade (usuario_id, acao, descricao, ip_address, user_agent) 
                    VALUES (?, ?, ?, ?, ?)";
            
            $this->db->insert($sql, [
                $userId,
                $acao,
                $descricao,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (Exception $e) {
            // Silenciar erros de log
        }
    }

    /**
     * Log de erros
     * @param string $message Mensagem de erro
     */
    private function logError(string $message): void {
        $logFile = __DIR__ . '/../logs/auth_errors.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message" . PHP_EOL;
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
}
