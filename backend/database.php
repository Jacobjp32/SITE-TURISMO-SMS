<?php
/**
 * Classe Database - Gerencia conexões PDO com MySQL
 * Padrão Singleton para evitar múltiplas conexões
 */

require_once __DIR__ . '/config.php';

class Database {
    private static $instance = null;
    private $conn;

    /**
     * Construtor privado - Singleton
     */
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch (PDOException $e) {
            $this->logError('Erro de conexão: ' . $e->getMessage());
            
            if (ENVIRONMENT === 'development') {
                die("Erro de conexão: " . $e->getMessage());
            } else {
                die("Erro ao conectar com o banco de dados. Tente novamente mais tarde.");
            }
        }
    }

    /**
     * Previne clonagem
     */
    private function __clone() {}

    /**
     * Previne unserialize
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }

    /**
     * Obtém a instância única do banco
     * @return Database
     */
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Obtém a conexão PDO
     * @return PDO
     */
    public function getConnection(): PDO {
        return $this->conn;
    }

    /**
     * Executa uma query preparada
     * @param string $sql Query SQL
     * @param array $params Parâmetros
     * @return PDOStatement
     */
    public function query(string $sql, array $params = []): PDOStatement {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->logError("Erro na query: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Executa INSERT e retorna o último ID inserido
     * @param string $sql Query SQL de INSERT
     * @param array $params Parâmetros
     * @return int ID do registro inserido
     */
    public function insert(string $sql, array $params = []): int {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return (int) $this->conn->lastInsertId();
        } catch (PDOException $e) {
            $this->logError("Erro no INSERT: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Executa UPDATE/DELETE e retorna quantidade de linhas afetadas
     * @param string $sql Query SQL
     * @param array $params Parâmetros
     * @return int Número de linhas afetadas
     */
    public function execute(string $sql, array $params = []): int {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->logError("Erro no EXECUTE: " . $e->getMessage() . " | SQL: " . $sql);
            throw $e;
        }
    }

    /**
     * Busca um único registro
     * @param string $sql Query SQL
     * @param array $params Parâmetros
     * @return array|null
     */
    public function fetchOne(string $sql, array $params = []): ?array {
        $stmt = $this->query($sql, $params);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * Busca múltiplos registros
     * @param string $sql Query SQL
     * @param array $params Parâmetros
     * @return array
     */
    public function fetchAll(string $sql, array $params = []): array {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Inicia uma transação
     */
    public function beginTransaction(): bool {
        return $this->conn->beginTransaction();
    }

    /**
     * Confirma uma transação
     */
    public function commit(): bool {
        return $this->conn->commit();
    }

    /**
     * Reverte uma transação
     */
    public function rollBack(): bool {
        return $this->conn->rollBack();
    }

    /**
     * Obtém o último ID inserido
     * @return string
     */
    public function lastInsertId(): string {
        return $this->conn->lastInsertId();
    }

    /**
     * Log de erros
     * @param string $message Mensagem de erro
     */
    private function logError(string $message): void {
        $logFile = __DIR__ . '/../logs/database_errors.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message" . PHP_EOL;
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
}

/**
 * Função helper para obter conexão rapidamente
 * @return PDO
 */
function db(): PDO {
    return Database::getInstance()->getConnection();
}
