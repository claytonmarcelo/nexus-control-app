# Segurança — Nexus Control App

## Autenticação

- **JWT com par access/refresh**: `backend/src/utils/jwt.ts` assina e verifica.
- `access` curto (default 24h), `refresh` longo (default 7d).
- Segredos vêm de `JWT_SECRET` / `JWT_REFRESH_SECRET`. Em produção o
  bootstrap falha se:
  - faltar qualquer segredo,
  - tiver menos de 32 caracteres,
  - for igual entre access e refresh,
  - ou se parecer placeholder conhecido (`replace_with_`, `your_`, etc.).
- Senhas hash com **bcryptjs custo 12**; comparação com `bcrypt.compare`.
- Política de senha: exatamente 6 dígitos seguidos de 1 símbolo (7 caracteres).
  Validada em `infrastructure/utils/passwordPolicy.js` e replicada no
  frontend em `utils/password.js`.

## Autorização

Camadas cumulativas:

1. `authenticate` — valida JWT, carrega `req.user` **rejeitando contas
   desativadas ou bloqueadas por inatividade** (`status_conta`).
2. `authorize(...roles)` — checa `nivel_acesso ∈ roles`.
3. `authorizePage('nome')` — checa a permissão por página vinda de
   `usuario_permissoes` (ou o default do papel).
4. Checagens de posse dentro dos controllers (ex.: `getOrderById` verifica
   `pedido.usuario_id === req.user.id || req.user.nivel_acesso === 'admin'`).

`ROOT_ADMIN_EMAIL` (env) define a conta administrativa raiz protegida: não
pode ser desativada, não pode perder a permissão `admin`, não pode ter senha
redefinida via fluxo público.

## Rate limiting

`backend/src/server.ts`:

| Camada | Janela | Limite | Escopo |
| :--- | :--- | :--- | :--- |
| `generalLimiter` | 15 min | 10000 req/IP | `/api/*` (ignora `/health`, `/api/health`, `/api/status`) |
| `loginLimiter` | 15 min | 50 (apenas falhas contam) | `POST /api/auth/login` |
| `passwordResetLimiter` | 15 min | 15 | `POST /api/auth/forgot-password` e `POST /api/auth/reset-password` |

Headers `RateLimit-*` padrão; headers legados `X-RateLimit-*` desabilitados.

## Proteção contra abuso

- `infrastructure/security/bruteForceProtection.js` — contadores por chave.
- `infrastructure/security/tokenBlacklist.js` — revoga refresh em logout.
- `infrastructure/security/securityMiddleware.js` — headers extras,
  detecção de padrões SQLi/XSS nas entradas.
- Helmet com CSP específica liberando Google Fonts e `data:` URIs para os
  ícones SVG inline do tema.

## Validação de entrada

`middleware/validation.js` + `middleware/orderValidation.js` rodam
`express-validator` em cada payload. Todas as respostas de erro seguem o
envelope `sendError(res, message, statusCode, errors?)`.

## Webhook Mercado Pago

- Rota pública `POST /api/pagamentos/webhook`.
- Valida assinatura `x-signature` (HMAC-SHA256) usando `MP_WEBHOOK_SECRET`.
- Descarta eventos duplicados via índice único `pedidos.provider_payment_id`.
- Em caso de falha de assinatura: `401` e log no servidor.

## Gestão de segredos e `.env`

- Nenhum segredo versionado. `backend/.env.example` traz apenas placeholders.
- Arquivos sensíveis bloqueados por `.gitignore`: `.env`, `.env.local`,
  `.env.production`, `.env.bak`, `**/.env.bak`.
- Deploy AWS carrega envs por SSM/Secrets Manager (ver
  `AWS_ACADEMY_INFRASTRUCTURE.md`).

## CORS

`backend/src/config` monta `cors` com `credentials: true` e allowlist
derivada de `FRONTEND_URL` (e `PUBLIC_URL` quando configurado). Em produção
a origem precisa estar definida; o `server.ts` lança erro claro se faltar.

## Logs e observabilidade

- Morgan registra requisições em formato `combined` (exceto `/api/health`).
- Nenhum log inclui senha, token JWT, ou `provider_payment_id` completo.
- Erros 500 retornam mensagem genérica ao cliente; stack trace vai para o
  stdout do processo.

## Trilha de auditoria

Toda ação relevante grava em `historico_eventos` via
`infrastructure/EventLog.js`:

- Login/logout
- Desativação / reativação de conta
- Mudança de permissões
- Confirmação de pagamento
- Alteração de `status_retirada` de aluguel
- Alerta emitido ao cliente

Consultáveis em:
- `GET /api/usuarios/me/eventos` (visão própria)
- `GET /api/usuarios/:id/eventos` (admin)

## Recomendações para produção

- Rotacionar `JWT_SECRET` / `JWT_REFRESH_SECRET` a cada 90 dias.
- Manter `MP_WEBHOOK_SECRET` em cofre, nunca em repositório.
- Habilitar SSL (`DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=true`) no MySQL.
- Monitorar `RateLimit-*` para detectar ataques; subir `generalLimiter`
  somente com justificativa.
- Backups diários de `nexusdb` com `mysqldump` e retenção de 30 dias.
