# Modelo de dados — Nexus Control App

Banco: **MySQL 8**, schema `nexusdb`. Charset `utf8mb4`, collation
`utf8mb4_unicode_ci`. Pool gerenciado em
`backend/src/config/database.js` (`mysql2/promise`).

Todas as mudanças de schema são aplicadas por
`backend/src/utils/migrate.js`, **idempotente**: `CREATE TABLE IF NOT EXISTS`
para tabelas novas e blocos `ALTER TABLE ... ADD COLUMN` embrulhados em
`try/catch`. Nunca há `DROP`, `TRUNCATE` ou `DELETE FROM` em massa.

## `usuarios`

| Coluna | Tipo | Nullable | Observações |
| :--- | :--- | :--- | :--- |
| id | INT AUTO_INCREMENT PK | não | |
| nome | VARCHAR(100) | não | |
| email | VARCHAR(150) UNIQUE | não | Ao desativar, é liberado para re-cadastro |
| senha | VARCHAR(255) | não | bcrypt, custo 12 |
| nivel_acesso | ENUM('admin','funcionario','cliente') | não | default `cliente` |
| ativo | TINYINT(1) | não | default 1 — mantido por compatibilidade legada |
| criado_em | DATETIME | não | default CURRENT_TIMESTAMP |
| status_conta | ENUM('ativo','aviso_inatividade','bloqueado_inatividade','desativada') | não | default `ativo` |
| desativado_em | DATETIME | sim | |
| email_original | VARCHAR(150) | sim | Preserva o e-mail no momento da desativação |
| ultimo_login | DATETIME | sim | |

Índices: `idx_usuarios_status_conta`, `idx_usuarios_email_original`.

## `itens`

| Coluna | Tipo | Nullable | Observações |
| :--- | :--- | :--- | :--- |
| id | INT AUTO_INCREMENT PK | não | |
| nome | VARCHAR(200) | não | |
| descricao | TEXT | sim | |
| criado_por | INT FK → usuarios.id ON DELETE CASCADE | não | |
| criado_em | DATETIME | não | |
| categoria | VARCHAR(80) | não | default `Informática` |
| fabricante | VARCHAR(100) | sim | |
| imagem_url | VARCHAR(500) | sim | |
| valor_venda | DECIMAL(10,2) | sim | Preço de compra |
| valor_aluguel_mensal | DECIMAL(10,2) | sim | Valor da mensalidade de aluguel |
| estoque | INT | não | default 1 |

## `pedidos`

| Coluna | Tipo | Nullable | Observações |
| :--- | :--- | :--- | :--- |
| id | INT AUTO_INCREMENT PK | não | |
| usuario_id | INT FK → usuarios.id | não | |
| items | LONGTEXT (JSON serializado) | não | Lista de itens com tipo (compra/aluguel) |
| total | DECIMAL(12,2) | não | |
| metodo_pagamento | ENUM('pix','cartao') | não | default `pix` |
| status_pagamento | ENUM('pendente','processando','confirmado','recusado','cancelado','falha','estornado') | não | default `pendente` |
| status_pedido | ENUM('novo','processando','concluido','cancelado') | não | default `novo` |
| ativo | TINYINT(1) | não | default 1 |
| criado_em | DATETIME | não | |
| pago_confirmado_em | DATETIME | sim | Preenchido pelo webhook MP ou admin |
| payment_provider | VARCHAR(40) | sim | `mercadopago`, `manual`, etc. |
| provider_payment_id | VARCHAR(120) UNIQUE | sim | Idempotência do webhook |
| confirmado_por | INT FK → usuarios.id | sim | Admin que confirmou |

Índices: `idx_pedidos_usuario`, `idx_pedidos_status`,
`idx_pedidos_provider_payment` (único).

## `negociacoes`

Simulações e propostas em torno de itens.

| Coluna | Tipo | Observações |
| :--- | :--- | :--- |
| id | INT PK | |
| usuario_id | INT FK | |
| item_id | INT FK | |
| tipo | ENUM('compra','aluguel') | |
| quantidade | INT | default 1 |
| valor_unitario | DECIMAL(10,2) | |
| status | ENUM('simulacao','solicitada','cancelada') | default `simulacao` |
| criado_em | DATETIME | |

## `alugueis`

Locações vigentes. Materializado pelo checkout quando o item tem
`tipo = aluguel`.

| Coluna | Tipo | Observações |
| :--- | :--- | :--- |
| id | INT PK | |
| pedido_id | INT FK → pedidos.id | Origem |
| usuario_id | INT FK → usuarios.id | |
| item_id | INT FK → itens.id | |
| item_nome | VARCHAR(200) | Snapshot no momento da criação |
| valor_aluguel_mensal | DECIMAL(10,2) | Snapshot |
| data_inicio | DATETIME | Início efetivo (na confirmação do pagamento) |
| data_prevista_devolucao | DATETIME | |
| status | ENUM('aguardando_pagamento','ativo','vencido','regularizado','devolvido','cancelado') | |
| status_retirada | ENUM('nenhum','pendente','agendada','realizada') | default `nenhum` |
| criado_em | DATETIME | |

O cálculo de `dias_excedentes` é feito na aplicação (não é coluna fixa) com
base em `data_prevista_devolucao` e `NOW()`.

## `usuario_permissoes`

Controle granular por página.

| Coluna | Tipo | Observações |
| :--- | :--- | :--- |
| usuario_id | INT FK | PK composto |
| pagina | VARCHAR(40) | PK composto — uma das chaves de `PAGE_PERMISSION_KEYS` |
| permitido | TINYINT(1) | default 0 |

## `password_resets`

| Coluna | Tipo | Observações |
| :--- | :--- | :--- |
| id | INT PK | |
| usuario_id | INT FK ON DELETE CASCADE | |
| token_hash | CHAR(64) UNIQUE | SHA-256 do token enviado |
| expira_em | DATETIME | |
| usado_em | DATETIME | Null = ainda válido |
| criado_em | DATETIME | |

Índices: `idx_password_resets_usuario`, `idx_password_resets_expiracao`.

## `historico_eventos`

Trilha de auditoria. Escrita por `infrastructure/EventLog.js`.

| Coluna | Tipo | Observações |
| :--- | :--- | :--- |
| id | BIGINT PK | |
| usuario_id | INT FK | |
| tipo_evento | VARCHAR(60) | Ex.: `conta_desativada`, `alerta_pago_pendente`, `retirada_atualizada` |
| entidade | VARCHAR(40) | `pedido`, `aluguel`, `usuario`, etc. |
| entidade_id | INT | |
| payload | LONGTEXT (JSON) | Metadados |
| criado_em | DATETIME | |

## `vinculos_conta`

Relaciona e-mails históricos a contas re-registradas.

| Coluna | Tipo | Observações |
| :--- | :--- | :--- |
| id | INT PK | |
| usuario_id | INT FK | Conta ativa que recuperou o e-mail |
| email_original | VARCHAR(150) | E-mail pré-desativação |
| usuario_anterior_id | INT FK (nullable) | Conta antiga, se ainda existir |
| criado_em | DATETIME | |

## Enums consolidados

```ts
USER_ROLES          = { ADMIN: 'admin', FUNCIONARIO: 'funcionario', CLIENTE: 'cliente' }
STATUS_CONTA        = ['ativo','aviso_inatividade','bloqueado_inatividade','desativada']
STATUS_PAGAMENTO    = ['pendente','processando','confirmado','recusado','cancelado','falha','estornado']
STATUS_PEDIDO       = ['novo','processando','concluido','cancelado']
STATUS_ALUGUEL      = ['aguardando_pagamento','ativo','vencido','regularizado','devolvido','cancelado']
STATUS_RETIRADA     = ['nenhum','pendente','agendada','realizada']
METODO_PAGAMENTO    = ['pix','cartao']
TIPO_NEGOCIACAO     = ['compra','aluguel']
STATUS_NEGOCIACAO   = ['simulacao','solicitada','cancelada']
```

## Como inspecionar o schema

```bash
cd backend
node src/utils/migrate.js               # aplica as migrations idempotentes
mysql -u root -p nexusdb -e "SHOW TABLES"
mysql -u root -p nexusdb -e "DESCRIBE alugueis"
```

## Backup e recuperação

- Dump: `mysqldump -u root -p nexusdb > backup.sql`
- Restore: `mysql -u root -p nexusdb < backup.sql`

Como todas as migrations são aditivas e idempotentes, restaurar um dump mais
antigo e reaplicar `migrate.js` recria apenas as colunas/tabelas novas sem
tocar nos dados existentes.
