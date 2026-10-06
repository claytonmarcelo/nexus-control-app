# Referência de API

Todas as rotas vivem sob o prefixo `/api` montado em `backend/src/server.ts`.
As respostas seguem o envelope de `utils/response.js`:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "...",
  "data": { "...": "..." },
  "errors": null,
  "timestamp": "2026-10-06T02:00:00.000Z"
}
```

Erros retornam `success: false` e, quando houver validação, um objeto
`errors` descritivo.

## Autenticação e sessão — `/api/auth`

| Método | Rota | Auth | Descrição |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | Público | Cria conta; aceita `senha_conta_desativada` para recuperar histórico |
| POST | `/api/auth/login` | Público | Retorna `{ access, refresh, user }` |
| POST | `/api/auth/forgot-password` | Público | Envia link/token por e-mail (rate-limited) |
| POST | `/api/auth/reset-password` | Público | Conclui redefinição com token |
| POST | `/api/auth/refresh` | Público | Emite novo access token com refresh válido |
| GET  | `/api/auth/me` | JWT | Dados da sessão corrente |
| POST | `/api/auth/logout` | JWT | Invalida refresh na blacklist |

Corpo de `register`:

```json
{ "nome": "…", "email": "…", "senha": "123456#",
  "nivel_acesso": "cliente", "senha_conta_desativada": "654321#" }
```

Resposta (quando recupera histórico):

```json
{ "success": true, "data": { "user": {…}, "recuperou_historico": true } }
```

Erros de registro com conta desativada anterior devolvem:

```json
{ "statusCode": 400, "success": false,
  "errors": { "verificacao_conta_desativada": true } }
```

## Catálogo — `/api/itens`

Todas as rotas exigem JWT e permissão de página `itens`.

| Método | Rota | Papel | Descrição |
| :--- | :--- | :--- | :--- |
| POST | `/api/itens` | admin/funcionário | Cria item |
| GET | `/api/itens` | Autenticado | Lista com paginação, filtros `categoria`, `fabricante`, `busca` |
| GET | `/api/itens/my-items` | Autenticado | Itens criados pelo usuário |
| GET | `/api/itens/my-negotiations` | Autenticado | Negociações do usuário |
| POST | `/api/itens/:id/negotiate` | Autenticado | Simula ou solicita negociação (compra/aluguel) |
| GET | `/api/itens/:id` | Autenticado | Detalha um item |
| PUT | `/api/itens/:id` | admin/funcionário | Atualiza item |
| DELETE | `/api/itens/:id` | admin/funcionário | Remove item |

## Usuários e perfil — `/api/usuarios`

| Método | Rota | Papel | Descrição |
| :--- | :--- | :--- | :--- |
| GET | `/api/usuarios/me/alertas` | Autenticado | Alertas da própria conta + resumo financeiro |
| GET | `/api/usuarios/me/eventos` | Autenticado | Timeline pessoal de auditoria |
| DELETE | `/api/usuarios/me` | Autenticado | Desativa a própria conta (soft delete) |
| POST | `/api/usuarios` | Admin | Cria usuário |
| GET | `/api/usuarios` | Admin | Lista paginada; aceita `status_conta`, `q` |
| GET | `/api/usuarios/:id/permissions` | Admin | Permissões de página |
| GET | `/api/usuarios/:id/eventos` | Admin | Auditoria de um usuário |
| PUT | `/api/usuarios/:id/permissions` | Admin | Atualiza permissões |
| DELETE | `/api/usuarios/:id` | Admin | Desativa usuário |
| GET | `/api/usuarios/:id` | Autenticado (dono ou admin) | Detalha usuário |
| PUT | `/api/usuarios/:id` | Autenticado (dono ou admin) | Atualiza cadastro |
| PUT | `/api/usuarios/:id/password` | Autenticado (dono ou admin) | Troca senha |

Corpo de `DELETE /me`:

```json
{ "senha_atual": "123456#", "confirmar_obrigacoes": false }
```

Se a conta possuir pedidos pendentes ou aluguéis abertos, a resposta é
`409` com:

```json
{ "statusCode": 409, "success": false, "message": "…",
  "errors": { "obrigacoes": {
    "possui_obrigacoes": true,
    "pedidos_pendentes": [{ "id": 7, "total": 120 }],
    "alugueis_abertos": [{ "id": 3, "item_nome": "Notebook Dell", "status": "ativo" }],
    "debitos": 120 } } }
```

## Pedidos e checkout — `/api/pedidos`

| Método | Rota | Papel | Descrição |
| :--- | :--- | :--- | :--- |
| POST | `/api/pedidos/checkout` | Autenticado | Cria pedido a partir do carrinho |
| GET | `/api/pedidos/me` | Autenticado | Histórico próprio, paginado |
| GET | `/api/pedidos` | Admin | Todos os pedidos, filtros por status |
| GET | `/api/pedidos/user/:userId` | Admin | Pedidos de um usuário |
| GET | `/api/pedidos/:id` | Autenticado (dono ou admin) | Detalha pedido |
| PUT | `/api/pedidos/:id` | Admin | Atualiza `status_pedido` / `status_pagamento` |
| DELETE | `/api/pedidos/:id` | Autenticado (dono ou admin) | Cancela pedido |

Checkout aceita:

```json
{ "items": [{ "id": 42, "quantidade": 1, "tipo": "compra" }],
  "metodo_pagamento": "pix" }
```

Tipos válidos: `compra` | `aluguel`. Métodos: `pix` | `cartao` (mantidos do
projeto original). Com `MP_ACCESS_TOKEN` configurado o pedido nasce
`status_pagamento = processando` e a resposta inclui `init_point` do gateway;
sem o token, o pedido nasce `pendente` e a liberação fica manual pelo admin.

## Painel administrativo — `/api/admin`

Rotas protegidas por `authenticate + authorize('admin')`.

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| GET | `/api/admin/pages` | Mapa de páginas ↔ roles |
| GET | `/api/admin/permissions` | Todas as permissões |
| GET | `/api/admin/permissions/:userId` | Permissões de um usuário |
| GET | `/api/admin/users/:userId/permissions` | Alias compatível |
| PUT/POST | `/api/admin/permissions[/:userId]` | Atualiza permissões |
| GET | `/api/admin/users` | Usuários com permissões |
| GET | `/api/admin/stats` | Métricas do dashboard |
| POST | `/api/admin/seed` | Semear/restaurar catálogo |

## Pagamentos — `/api/pagamentos`

| Método | Rota | Auth | Descrição |
| :--- | :--- | :--- | :--- |
| POST | `/api/pagamentos/webhook` | HMAC (`x-signature`) | Recebe eventos do Mercado Pago |
| GET | `/api/pagamentos/pedido/:id` | JWT | Consulta status local + reconsulta ao gateway |

Webhook validado por `MP_WEBHOOK_SECRET`. Idempotente via índice único em
`pedidos.provider_payment_id`.

## Aluguéis — `/api/alugueis`

| Método | Rota | Papel | Descrição |
| :--- | :--- | :--- | :--- |
| GET | `/api/alugueis/me` | Autenticado | Aluguéis do cliente (inclui contas desativadas vinculadas) |
| GET | `/api/alugueis/operacao` | Admin/funcionário | Painel operacional com filtros `status`, `retirada` |
| POST | `/api/alugueis/:id/regularizacao` | Autenticado | Gera pedido de regularização de dias excedentes |
| PUT | `/api/alugueis/:id/retirada` | Admin/funcionário | Muda `status_retirada` (pendente/agendada/realizada) |

## Saúde do serviço

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| GET | `/api/status` | Status agregado |
| GET | `/api/health` | Healthcheck sem rate limit |

## Códigos e erros recorrentes

- `400` — validação de entrada (`errors` preenchido com campo → mensagem)
- `401` — JWT ausente/expirado (`authenticate`)
- `403` — papel insuficiente (`authorize`), permissão de página (`authorizePage`), conta desativada
- `404` — recurso não encontrado
- `409` — conflito (ex.: desativação com pendências, webhook duplicado tratado por idempotência)
- `429` — rate limit
- `500` — erro interno; sempre com log no servidor
