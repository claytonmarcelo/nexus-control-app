# Regras de negócio implementadas — Nexus Control App

Documento de referência das regras globais que passaram a valer no sistema. Nada
do que já existia foi removido: as mudanças são incrementais e reutilizam os
endpoints, status e telas anteriores.

Visão geral do escopo:

- Desativação de conta preservando histórico transacional.
- Recuperação do histórico ao se registrar novamente com o mesmo e-mail
  (verificação por senha antiga).
- Bloqueio de liberação de pedido sem pagamento confirmado.
- Controle de dias excedentes em aluguel e regularização pelo checkout.
- Alertas amigáveis para cliente e painel operacional para admin/funcionário.
- Aviso de inatividade comercial de 6 meses (sem bloqueio, apenas notificação).

Todas as regras vivem no backend. O frontend apenas apresenta o que a API
retorna — não valida, não decide e não hardcodar valores.

## 1. Estados e enums

`usuarios.status_conta`
: `ativo` · `aviso_inatividade` · `bloqueado_inatividade` · `desativada`

`pedidos.status_pagamento`
: `pendente` · `processando` · `confirmado` · `recusado` · `cancelado` · `falha` · `estornado`

`pedidos.status_pedido`
: `novo` · `processando` · `concluido` · `cancelado`

`alugueis.status`
: `aguardando_pagamento` · `ativo` · `vencido` · `regularizado` · `devolvido` · `cancelado`

`alugueis.status_retirada`
: `nenhum` · `pendente` · `agendada` · `realizada`

## 2. Migrations aditivas

Arquivo: `backend/src/utils/migrate.js` (idempotente, `IF NOT EXISTS` / `try/catch`).

Novas colunas:

- `usuarios.status_conta`, `usuarios.desativado_em`, `usuarios.email_original`,
  `usuarios.ultimo_login`
- `pedidos.pago_confirmado_em`, `pedidos.payment_provider`,
  `pedidos.provider_payment_id`, `pedidos.confirmado_por`

Novas tabelas:

- `alugueis` — locações em aberto, com prazo, dias excedentes e situação de retirada.
- `historico_eventos` — auditoria de ações relevantes (login, alerta, mudança de status).
- `vinculos_conta` — vínculo entre e-mail original e conta re-registrada.

Índices:

- `idx_usuarios_status_conta`, `idx_usuarios_email_original`,
  `idx_pedidos_provider_payment` (único, garante idempotência do webhook).

Nenhuma operação `DROP` / `TRUNCATE` / `DELETE FROM` em massa é executada
pela migration.

## 3. Endpoints novos ou ampliados

`backend/src/presentation/routes/index.ts`

| Rota | Método | Escopo | Uso |
| :--- | :--- | :--- | :--- |
| `/api/usuarios/me/alertas` | GET | Cliente / funcionário | Lista alertas ativos + resumo financeiro |
| `/api/usuarios/me/eventos` | GET | Cliente / funcionário | Timeline pessoal de auditoria |
| `/api/usuarios/:id/eventos` | GET | Admin | Eventos de um usuário específico |
| `/api/usuarios/me` | DELETE | Cliente | Desativação suave com `senha_atual` e `confirmar_obrigacoes` |
| `/api/pagamentos/webhook` | POST | Público (assinado) | Recebe eventos do Mercado Pago |
| `/api/pagamentos/pedido/:id` | GET | Autenticado | Consulta status de pagamento de um pedido |
| `/api/alugueis/me` | GET | Cliente | Aluguéis em aberto do usuário autenticado |
| `/api/alugueis/operacao` | GET | Admin / funcionário | Lista operacional com filtros de status e retirada |
| `/api/alugueis/:id/regularizacao` | POST | Cliente | Gera pedido de regularização de dias excedentes |
| `/api/alugueis/:id/retirada` | PUT | Admin / funcionário | Atualiza `status_retirada` e sincroniza `status` |

Comportamento ampliado (sem quebrar contrato existente):

- `POST /api/auth/register` aceita `senha_conta_desativada` para comprovar
  identidade na recuperação de histórico e retorna `recuperou_historico`.
- `GET /api/usuarios?status_conta=…` filtra contas por situação.
- `POST /api/pedidos` marca o pagamento como `processando` quando há token do
  Mercado Pago configurado e `pendente` caso contrário; liberação sempre exige
  `status_pagamento = confirmado`.

## 4. Regras aplicadas no backend

1. **Desativação suave** (`backend/src/infrastructure/Conta.js`) — `DELETE /usuarios/me`
   exige a senha atual, grava `status_conta = desativada` + `desativado_em`,
   preserva pedidos, pagamentos e aluguéis e registra evento de auditoria.
   Se houver pendências (`pedidos_pendentes` ou `alugueis_abertos`), responde
   `409` com `errors.obrigacoes` e requer `confirmar_obrigacoes: true`.
2. **Cliente desativado perde acesso** — `authenticate` rejeita JWT de conta
   desativada. O login responde `403` com o e-mail original preservado.
3. **Recuperação de identidade** — `POST /auth/register` detecta conta
   desativada com o mesmo e-mail. Se o corpo trouxer `senha_conta_desativada`
   correta, reativa a conta, restaura `email_original` e cria um registro em
   `vinculos_conta`. E-mail novo cria cliente novo (sem histórico).
4. **Liberação só com pagamento confirmado** — `orderController` não promove
   `status_pedido` enquanto `status_pagamento ≠ confirmado`. A confirmação vem
   do webhook do Mercado Pago ou de `confirmar-pagamento` pelo admin.
5. **Dias excedentes** — `Aluguel.calcularDiasExcedentes` compara
   `hoje` com `data_prevista_devolucao`. O excedente em reais considera
   `valor_aluguel_mensal` proporcional; a regularização usa o checkout normal.
6. **Retirada** — `PUT /alugueis/:id/retirada` só aceita valores do enum e
   sincroniza `alugueis.status` quando marcada como `realizada`.
7. **Inatividade comercial de 6 meses** — `Conta.avaliarInatividade` marca
   `aviso_inatividade` e emite alerta informativo. **Nunca bloqueia**
   (o estado `bloqueado_inatividade` só seria usado em política futura).
8. **Alertas amigáveis** — `alertController.montarAlertas` agrupa pedidos
   pendentes, aluguéis vencidos e avisos de inatividade em mensagens com
   `severidade` (`info` / `atencao` / `urgente`) e ações sugeridas.

## 5. Integração Mercado Pago

`backend/src/infrastructure/payments/mercadopago.js`

- Habilitado somente se `MP_ACCESS_TOKEN` existir; caso contrário o sistema
  opera em modo manual sem quebrar fluxos antigos.
- O webhook valida a assinatura `x-signature` com `MP_WEBHOOK_SECRET`
  (HMAC-SHA256) antes de processar.
- Idempotência garantida pelo índice único em `provider_payment_id`.
- Nenhum segredo é versionado. Configure via `.env`.

Variáveis novas (documentadas em `backend/.env.example`):

- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`
- `PUBLIC_URL`

## 6. Mudanças no frontend

- `components/cart/Checkout.jsx` — banner de pagamento processando/confirmado,
  ícone de relógio/coleta, sem criar checkout paralelo.
- `components/dashboard/Profile.jsx` — aba "Alertas" com resumo, lista de
  alertas e timeline; seção "Desativar conta" com confirmação profissional e
  modal de pendências quando a API responde `409`.
- `components/dashboard/Dashboard.jsx` — `AlertsBanner` para cliente e
  funcionário, baseado em `alertService.getMyAlerts()`.
- `components/admin/AdminControlCenter.jsx` — aba "Aluguéis" com filtros de
  status e retirada, atualização de retirada via `confirm()`, painel de
  auditoria por usuário, filtro "Situação" na seção de acessos.
- `components/auth/Login.jsx` — formulário de registro passa a solicitar a
  senha da conta desativada quando o backend sinaliza `verificacao_conta_desativada`.
- `contexts/AuthContext.jsx` — `register()` retorna `recuperou_historico` para
  a tela comunicar a recuperação com clareza.
- `services/services.js` — novo `alertService`, métodos `deleteOwnAccount`
  e `rentalService` cobrindo os endpoints listados acima.

## 7. Validação

- Backend: `NODE_ENV=test npm test` — 4 suítes, 86 testes, todos verdes
  (inclui `businessRules.test.js`).
- Frontend: `npm run test` — 8 arquivos, 49 testes, todos verdes.
- Frontend: `npm run build` — Vite ✓, 132 módulos transformados.
- Frontend: `npm run lint` — 11 erros **pré-existentes** (tema/toggleTheme em
  telas legadas, `cartSubtotal` em Dashboard, `UserIcon` em Users, `vi` em
  ThemeToggle.test.jsx). Escopo desta entrega não toca nesses arquivos.

## 8. Não-make list (preservado)

- Nenhum framework, banco ou biblioteca foi trocado.
- Nenhum endpoint antigo foi renomeado ou removido.
- Nenhum pedido, pagamento ou histórico foi apagado.
- Nenhum `alert()` / `confirm()` nativo — modais usam o `ModalContext`.
- Nenhum preço, status ou regra de negócio hardcoded no frontend.
