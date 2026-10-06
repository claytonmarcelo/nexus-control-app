import pool from '../config/database.js';
import dotenv from 'dotenv';
dotenv.config();
const migrations = [
    `CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel_acesso ENUM('admin', 'funcionario', 'cliente') NOT NULL DEFAULT 'cliente',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    `CREATE TABLE IF NOT EXISTS itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    criado_por INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    `CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expira_em DATETIME NOT NULL,
    usado_em DATETIME NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_password_resets_usuario (usuario_id),
    INDEX idx_password_resets_expiracao (expira_em)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    `CREATE TABLE IF NOT EXISTS usuario_permissoes (
    usuario_id INT NOT NULL,
    pagina VARCHAR(40) NOT NULL,
    permitido TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (usuario_id, pagina),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
];
const alterStatements = [
    `ALTER TABLE itens ADD COLUMN categoria VARCHAR(80) NOT NULL DEFAULT 'Informática'`,
    `ALTER TABLE itens ADD COLUMN fabricante VARCHAR(100) NULL`,
    `ALTER TABLE itens ADD COLUMN imagem_url VARCHAR(500) NULL`,
    `ALTER TABLE itens ADD COLUMN valor_venda DECIMAL(10,2) NULL`,
    `ALTER TABLE itens ADD COLUMN valor_aluguel_mensal DECIMAL(10,2) NULL`,
    `ALTER TABLE itens ADD COLUMN estoque INT NOT NULL DEFAULT 1`,
    `CREATE TABLE IF NOT EXISTS negociacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    item_id INT NOT NULL,
    tipo ENUM('compra', 'aluguel') NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    status ENUM('simulacao', 'solicitada', 'cancelada') NOT NULL DEFAULT 'simulacao',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    `CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    items LONGTEXT NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    metodo_pagamento ENUM('pix', 'cartao') NOT NULL DEFAULT 'pix',
    status_pagamento ENUM('pendente', 'confirmado', 'cancelado', 'falha') NOT NULL DEFAULT 'pendente',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_pedidos_usuario (usuario_id),
    INDEX idx_pedidos_status (status_pagamento)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    `ALTER TABLE pedidos ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1`,
    `ALTER TABLE pedidos MODIFY COLUMN status_pagamento ENUM('pendente', 'processando', 'confirmado', 'recusado', 'cancelado', 'falha', 'estornado') NOT NULL DEFAULT 'pendente'`,
    `ALTER TABLE pedidos ADD COLUMN status_pedido ENUM('novo', 'processando', 'concluido', 'cancelado') NOT NULL DEFAULT 'novo'`,
    // ── Regras de negócio: conta, pagamento, aluguel, histórico ──────────────
    // Status de conta explícito (a coluna 'ativo' continua sincronizada para compatibilidade
    // com o middleware de autenticação e o painel administrativo existentes).
    `ALTER TABLE usuarios ADD COLUMN status_conta ENUM('ativo', 'aviso_inatividade', 'bloqueado_inatividade', 'desativada') NOT NULL DEFAULT 'ativo'`,
    `ALTER TABLE usuarios ADD COLUMN desativado_em DATETIME NULL`,
    // Ao desativar, o e-mail é liberado para novo cadastro e guardado aqui (fonte do vínculo de histórico).
    `ALTER TABLE usuarios ADD COLUMN email_original VARCHAR(150) NULL`,
    `ALTER TABLE usuarios ADD COLUMN ultimo_login DATETIME NULL`,
    `ALTER TABLE usuarios ADD INDEX idx_usuarios_status_conta (status_conta)`,
    `ALTER TABLE usuarios ADD INDEX idx_usuarios_email_original (email_original)`,
    // Confirmação de pagamento auditável: quem confirmou, quando e a referência única do gateway
    // (a unicidade em provider_payment_id dá idempotência ao webhook — MySQL permite múltiplos NULL).
    `ALTER TABLE pedidos ADD COLUMN pago_confirmado_em DATETIME NULL`,
    `ALTER TABLE pedidos ADD COLUMN payment_provider VARCHAR(40) NULL`,
    `ALTER TABLE pedidos ADD COLUMN provider_payment_id VARCHAR(120) NULL`,
    `ALTER TABLE pedidos ADD COLUMN confirmado_por INT NULL`,
    `ALTER TABLE pedidos ADD UNIQUE INDEX idx_pedidos_provider_payment (provider_payment_id)`,
    // Registro operacional de locação. Nasce junto ao checkout de aluguel e só tem
    // data_inicio preenchido quando o pagamento é confirmado (regra de liberação).
    `CREATE TABLE IF NOT EXISTS alugueis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    usuario_id INT NOT NULL,
    item_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    dias_aluguel INT NOT NULL,
    valor_diario DECIMAL(10,2) NOT NULL,
    data_inicio DATETIME NULL,
    data_prevista_devolucao DATETIME NULL,
    status ENUM('aguardando_pagamento', 'ativo', 'vencido', 'regularizado', 'devolvido', 'cancelado') NOT NULL DEFAULT 'aguardando_pagamento',
    status_retirada ENUM('nenhum', 'pendente', 'agendada', 'realizada') NOT NULL DEFAULT 'nenhum',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE RESTRICT,
    INDEX idx_alugueis_usuario_status (usuario_id, status),
    INDEX idx_alugueis_devolucao (data_prevista_devolucao)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    // Trilha cronológica de auditoria (NUNCA apagada por desativação de conta).
    `CREATE TABLE IF NOT EXISTS historico_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    pedido_id INT NULL,
    aluguel_id INT NULL,
    evento VARCHAR(60) NOT NULL,
    descricao TEXT NULL,
    metadados LONGTEXT NULL,
    registrado_por INT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    FOREIGN KEY (aluguel_id) REFERENCES alugueis(id) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_eventos_usuario (usuario_id, criado_em),
    INDEX idx_eventos_pedido (pedido_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    // Vínculo legítimo entre uma conta nova e a conta desativada anterior (mesmo e-mail,
    // identidade comprovada pela senha da conta antiga). Só a tabela existante libera leitura do histórico.
    `CREATE TABLE IF NOT EXISTS vinculos_conta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    novo_usuario_id INT NOT NULL,
    antigo_usuario_id INT NOT NULL,
    verificado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novo_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (antigo_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_vinculo_par (novo_usuario_id, antigo_usuario_id),
    INDEX idx_vinculo_antigo (antigo_usuario_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
];
// Adicionar coluna ativo na tabela usuarios se não existir
const addUserActiveColumn = async () => {
    try {
        await pool.execute(`ALTER TABLE usuarios ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1`);
        console.log('✅ Coluna ativo adicionada à tabela usuarios');
    }
    catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⏭️ Coluna ativo já existe em usuarios');
        }
        else {
            throw error;
        }
    }
};
export const runMigrations = async () => {
    console.log('🔄 Executando migrações...');
    for (const migration of migrations) {
        try {
            await pool.execute(migration);
            console.log('✅ Migração executada com sucesso');
        }
        catch (error) {
            console.error('❌ Erro na migração:', error.message);
            throw error;
        }
    }
    for (const statement of alterStatements) {
        try {
            await pool.execute(statement);
            console.log('✅ Estrutura complementar verificada');
        }
        catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
                console.log('⏭️ Estrutura já existente, mantendo atual');
                continue;
            }
            console.error('❌ Erro na estrutura complementar:', error.message);
            throw error;
        }
    }
    // Adicionar coluna ativo se não existir
    await addUserActiveColumn();
    console.log('✅ Todas as migrações concluídas');
};
// Executar diretamente apenas quando chamado como script (não quando importado pelo servidor)
const isDirectRun = process.argv[1]?.endsWith('migrate.js');
if (isDirectRun) {
    const run = async () => {
        try {
            await runMigrations();
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Falha nas migrações:', error);
            process.exit(1);
        }
    };
    run();
}
