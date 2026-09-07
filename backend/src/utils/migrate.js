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
];

// Adicionar coluna ativo na tabela usuarios se não existir
const addUserActiveColumn = async () => {
  try {
    await pool.execute(`ALTER TABLE usuarios ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1`);
    console.log('✅ Coluna ativo adicionada à tabela usuarios');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⏭️ Coluna ativo já existe em usuarios');
    } else {
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
    } catch (error) {
      console.error('❌ Erro na migração:', error.message);
      throw error;
    }
  }

  for (const statement of alterStatements) {
    try {
      await pool.execute(statement);
      console.log('✅ Estrutura complementar verificada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️ Coluna já existente, mantendo estrutura atual');
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

const run = async () => {
  try {
    await runMigrations();
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha nas migrações:', error);
    process.exit(1);
  }
};

run();