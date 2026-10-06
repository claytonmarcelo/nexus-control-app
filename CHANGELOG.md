# Changelog — Nexus Control App

Histórico completo de todas as alterações do código, **do mais recente para o
mais antigo**, do commit inicial até hoje. Este é o changelog oficial do
projeto. As instruções de instalação permanecem no [`README.md`](./README.md);
a história detalhada por marcos também pode ser lida em
[`docs/HISTORIA.md`](./docs/HISTORIA.md).

> Este projeto é acadêmico (AWS Academy). O pagamento é **fake por design**: no
> **modo simulado** (sem gateway) o checkout **confirma o pagamento na hora**, no
> **backend**, para **Pix e Cartão** — como era em 2026-10-03 — e o cliente cai
> direto no modal de sucesso. Com o gateway **Mercado Pago** configurado
> (`MP_ACCESS_TOKEN`), o **Pix** passa a gerar o QR real e a liberação vem do
> webhook (único caminho que fica pendente). A regra de liberação fica sempre no
> backend, nunca no frontend. Um pedido que ainda esteja **pendente** pode ser
> concluído pelo próprio dono a partir do alerta no perfil
> (`POST /pedidos/:id/pagamento`), que confirma na hora no modo simulado.

## Estado atual (2026-10-06)

- Backend: **92 testes verdes**, build TypeScript limpo.
- Frontend: **49 testes verdes**, `npm run build` OK, **ESLint sem erros** (lint
  limpo para o CI).
- Deploy: `backend/dist` e `frontend/dist` atualizados; workflow de deploy
  corrigido e pronto para publicar na AWS.

---

## 2026-10-06 · Botão "Excluir" da página "Usuários" agora funciona em todos os casos

- `fix(usuarios): excluir conta sem histórico e desativar conta com histórico`
  - O usuário relatou que em `http://localhost:5173/usuarios` o **botão Excluir
    não funcionava**. Causa: ao excluir um cliente que já tinha pedido, o backend
    devolvia um erro específico que o frontend **descartava** mostrando apenas
    "Erro ao excluir usuário". Além disso, a exclusão física **cascateava** a
    remoção dos `pedidos` da pessoa (FK `ON DELETE CASCADE`), o que **viola o
    guardrail** de nunca apagar pedidos/pagamentos/histórico.
  - `User.js`: novo `usuarioComHistorico(id)` — conta pedidos e aluguéis **antes**
    de qualquer `DELETE`, para nunca depender de erro de FK nem cascatear histórico.
  - `userController.ts` (`remove`): conta **com histórico** é **desativada**
    (soft delete via `desativarConta` — a linha e todo o histórico ficam
    preservados, e-mail reservado em `email_original`); conta **totalmente vazia**
    é removida fisicamente. Resposta agora traz `data.desativada` e mensagem
    específica.
  - `Users.jsx`: o `catch` passa a exibir a **mensagem real do backend**
    (`error.response?.data?.message`); após desativação a lista **recarrega** para
    refletir o estado, e cada linha ganhou o selo **"Desativada"** (escondendo
    editar/permissões/excluir de contas já desativadas, mantendo só o histórico).
  - `api.test.js`: +2 testes (exclusão física de conta sem histórico; desativação
    de conta com pedido preservando o registro). Backend sobe para **92 testes**.

---

## 2026-10-06 · Página "Aluguéis" do admin reorganizada (textos quebrados + controle)

- `fix(admin): reorganiza a aba Aluguéis do painel e conserta o controle de retirada`
  - O usuário apontou que a tela **Admin → Aluguéis** estava **fora do padrão** e
    com **textos quebrados**: a coluna de prazo mostrava o intervalo no formato
    longo (`6 de out. de 2026, 01:07 → 6 de out. de 2026, 01:07`), que quebrava em
    várias linhas, e o **select de "Retirada"** na coluna Ações ficava **cortado**
    ("Pe"/"Re") — a classe `.input` é `w-full` e colapsava dentro do rótulo
    `inline-flex` da célula alinhada à direita.
  - `AdminControlCenter.jsx` (componentes `RentalsSection` e `RentalRow`):
    - **Datas compactas**: novo helper `formatDateShort` (dd/mm/aaaa, sem hora) e a
      coluna virou **Período** em duas linhas rotuladas ("Início" / "Devolução") +
      "N dias · Qtd N" — nada de quebra.
    - **Controle de retirada corrigido**: o `select` agora fica num contêiner de
      largura fixa (`w-40`), com rótulo "Alterar retirada" acima; mantém o
      comportamento de **confirmar antes de salvar** (PUT `/alugueis/:id/retirada`,
      regra no backend). Quando o aluguel ainda não tem retirada, exibe "Sem
      retirada" (placeholder desabilitado) em vez de fingir "Pendente"; em aluguel
      **cancelado** o controle fica desabilitado ("Indisponível").
    - **Rótulos mais curtos** em `RETIRADA_STATUS` ("Realizada" em vez de
      "Realizada (entregue/devolvida)") para caber no seletor.
    - **Cabeçalho no padrão** das outras abas: título `text-xl`, pill de contagem
      ("N aluguéis") e filtro de status com largura fixa (`w-64`).
    - Células de texto longo (Item/Cliente) com `truncate` + `title`; colunas
      curtas com `whitespace-nowrap`; linhas com `align-top`.
  - Sem mudança de backend/regra: a manipulação continua restrita à retirada
    (admin/funcionário) e o status `devolvido` segue derivado no servidor ao marcar
    "Realizada".
  - Validação: **ESLint limpo**, `npm run build` OK, **49 testes frontend verdes**;
    `frontend/dist` reconstruído. (Verificação E2E no navegador não foi feita porque
    a sessão local estava deslogada e não se manuseiam credenciais aqui.)

---

## 2026-10-06 · Retomar pagamento pendente agora confirma o pedido

- `fix(pagamento): alerta de pagamento pendente conclui o pedido em modo simulado`
  - Em **`/perfil` → Alertas**, o alerta `pagamento_pendente` abre o checkout do
    próprio pedido (`/checkout?pedido=ID`). Ao retomar um pedido que ainda estava
    `pendente` (legado, criado antes do checkout confirmar na hora), a tela só
    oferecia **"Já paguei — verificar"**, que apenas **consulta** o status
    (`GET /pagamentos/pedido/:id`) e **nunca confirma**. Resultado: o pedido
    continuava pendente e o alerta não sumia — o caminho que o usuário relatou.
  - **Backend** (`orderController.ts` + `routes/orders.ts`): novo endpoint
    `POST /pedidos/:id/pagamento` (rota autenticada, `validateOrderId`). Regra
    100% no backend, no estilo do checkout:
    - Aceita o **dono** do pedido ou **admin/staff**; senão **403**.
    - Pedido **já confirmado** → responde sucesso idempotente (sem efeito colateral).
    - **Sem gateway** (modo simulado da academia) → confirma **na hora** via
      `aplicarStatusPagamento(CONFIRMADO)` (`provider: 'fake'` para Pix,
      `'manual'` para Cartão), pela mesma trilha atômica: libera o pedido, inicia
      os aluguéis e registra o evento. Devolve o pedido atualizado com `pagamento.status = 'confirmado'`.
    - **Com gateway Mercado Pago** ativo → **não** auto-confirma: mantém `pendente`
      e orienta a usar "Já paguei — verificar" (a liberação vem do webhook).
    - Estados terminais (recusado/cancelado/falha/estornado) → **409** (exigem novo pedido).
  - **Frontend** (`Checkout.jsx`, `services.js`): no modo retomada (`?pedido=ID`) e
    sem QR real, o overlay de pendência passa a mostrar um botão **"Pagar agora"**
    (chama `checkoutService.payOrder(id)`), que reflete o `confirmado` retornado e
    abre o modal de sucesso — encerrando em `/perfil` com o alerta resolvido. O
    fluxo de checkout normal (sem retomada) está inalterado.
  - Testes: `businessRules.test.js` ganha um `describe` cobrindo o endpoint — dono
    confirma e aluguel inicia; terceiros recebem **403**; repetição é idempotente;
    com `MP_ACCESS_TOKEN` definido **não** auto-confirma. **90 testes backend
    verdes**, `tsc` limpo. Frontend: **49 testes**, ESLint limpo, `build` OK.
  - Observação de validação: o caminho E2E no navegador exige sessão logada e um
    pedido legado pendente; a confirmação em si é exercitada de forma determinística
    pelos novos testes de integração do backend.

---

## 2026-10-06 · Checkout volta a confirmar o pagamento na hora (fiel a 2026-10-03)

- `feat(pagamento): checkout confirma Pix E Cartão na hora no modo simulado`
  - Referência ao comportamento de **2026-10-03**: naquela data o checkout criava
    o pedido direto com `status_pagamento: 'confirmado'` para **qualquer** método
    (sem tela de "aguardando confirmação", sem alerta de pendência). O fluxo de
    pendência/confirmação pelo admin só foi introduzido depois, no commit das
    regras de negócio (`615f5b6`). O usuário pediu para **manter como estava**.
  - No commit anterior desta data o **Pix** já confirmava na hora e o **Cartão**
    ficava pendente. Agora o **Cartão também confirma na hora** no modo simulado,
    igual a 2026-10-03.
  - Backend (`orderController.ts`, checkout): quando **não** há gateway Mercado
    Pago configurado, o pedido é criado `pendente` e, na mesma requisição,
    confirmado via `aplicarStatusPagamento` (`provider: 'fake'` para Pix,
    `'manual'` para Cartão) — disparando a mesma trilha atômica de liberação
    (aluguéis + eventos). A **única** situação que segue pendente é **Pix com
    gateway real** (aguarda webhook) e pedidos legados já pendentes.
  - `Checkout.jsx` permanece inalterado: já abre o modal de sucesso quando
    `order.status_pagamento === 'confirmado'`.
  - Testes: `integration.test.js` agora espera Pix **e** Cartão → `confirmado`;
    o helper `checkoutAluguel` de `businessRules.test.js` passa a criar o pedido
    de aluguel `pendente` **direto** via `createOrderWithRentals` (a rota não gera
    mais pendência), preservando os testes da regra de liberação. **86 testes
    backend verdes**, `tsc` limpo.
  - Validação: Pix confirmado na hora verificado no navegador (pedido #249);
    Cartão cobre o mesmo caminho de código e está coberto por teste automatizado.

---

## 2026-10-06 · Pix confirma na hora (modal de sucesso), cartão segue manual

- `feat(pagamento): checkout Pix em modo fake confirma o pagamento no backend`
  - Ao pagar com **Pix**, o checkout mostrava apenas
    *"Seu pedido foi criado e aguarda a confirmação do pagamento"* — o pedido
    nascia `pendente` para **todos** os métodos, e o modal de sucesso só aparecia
    depois de o administrador confirmar. O usuário pediu o comportamento anterior:
    **Pix pago → cai direto no modal de sucesso**; a tela de pendência só deve
    aparecer quando o cliente **não paga** ou há **erro** nos dados.
  - A mudança foi feita **no backend** (`orderController.ts`, checkout), não no
    frontend, respeitando a regra de que a liberação nunca é decidida pelo cliente:
    - **Pix sem gateway (modo fake/simulado):** o pedido é criado `pendente` e,
      ainda na mesma requisição, confirmado via `aplicarStatusPagamento`
      (`provider: 'fake'`). Isso dispara a mesma trilha atômica de confirmação —
      libera o pedido, inicia aluguéis e registra o evento — e devolve
      `status_pagamento: 'confirmado'` com a mensagem de sucesso.
    - **Pix com Mercado Pago configurado:** mantém o QR real e aguarda o webhook
      (inalterado).
    - **Cartão:** continua `pendente` até a confirmação manual do admin.
  - O `Checkout.jsx` **não precisou mudar**: ele já lê `order.status_pagamento` e
    abre o modal de sucesso quando vem `confirmado`.
  - Testes: `integration.test.js` passa a esperar Pix → `confirmado` (e Cartão →
    `pendente`); o helper `checkoutAluguel` de `businessRules.test.js` migra para
    `cartao` para continuar exercitando o fluxo manual pendente→confirma→libera.
    **86 testes backend verdes**, `tsc` limpo.
  - Validação no navegador: pedido Pix #249 criado já `confirmado`, com redirecionamento
    automático ao dashboard e carrinho limpo (modal de sucesso padrão).

---

## 2026-10-06 · Botão "Ir para o checkout" retoma o pagamento do próprio pedido

- `fix(alertas): alerta de pagamento pendente abre o checkout do pedido, não o carrinho vazio`
  - Em `/perfil` → **Alertas**, o botão "Ir para o checkout" de um alerta
    `pagamento_pendente` levava para `/checkout` **sem** pedido nem carrinho, e a
    tela redirecionava para `/carrinho` vazio — o usuário ficava sem caminho para
    quitar o débito que o próprio alerta apontava.
  - Agora `acaoHref` (`Profile.jsx`) usa o `pedido_id` que o backend já envia no
    alerta e gera `/checkout?pedido=<ID>`. O `Checkout.jsx` passou a aceitar esse
    parâmetro: em **modo retomada** ele carrega o pedido pendente existente via
    `checkoutService.getOrderById`, ignora o guard de carrinho vazio e reaproveita
    a **mesma** tela "Pedido #ID registrado / Já paguei — verificar" com o polling
    de `paymentService.getStatus` que já existia após criar um pedido.
  - O modo retomada **não cria pedido nem limpa o carrinho**: "Concluir agora" e o
    redirecionamento pós-confirmação voltam para `/perfil`. Falha de carregamento
    (404/sem acesso) mostra um aviso e devolve ao perfil.
  - Mudança **apenas no frontend** (`Checkout.jsx` + `Profile.jsx`); as regras de
    pagamento (quem paga, quando liberar, reconsulta do gateway) continuam
    **integralmente no backend**.
  - Validação: 49 testes frontend verdes, ESLint limpo, `npm run build` OK;
    navegador confirmou o clique no alerta → tela de pagamento do pedido #233.

---

## 2026-10-06 · Checkout resiliente a itens removidos do catálogo

- `fix(checkout): remove itens obsoletos do carrinho em vez de travar no 400`
  - No teste de navegação apareceu um `400 (Bad Request)` no
    `POST /api/pedidos/checkout`. A causa não era o fluxo em si (com um carrinho
    válido o checkout cria o pedido com **201**), e sim o carrinho guardado no
    `localStorage` do navegador: quando ele contém um item que **não existe mais**
    no catálogo/banco, o backend responde corretamente
    *"Um ou mais itens não foram encontrados no banco"* e o navegador loga o 400.
    O usuário ficava preso, com um item órfão no carrinho e um erro pouco claro.
  - A **regra de negócio permanece no backend** (valida a existência de cada
    item). No frontend (`Checkout.jsx`), ao receber esse 400 específico, agora o
    app confere item a item via `itemService.getById` e **remove do carrinho
    apenas os realmente inexistentes (HTTP 404)**, preservando os válidos e sem
    remover nada em falha transitória de rede. Mostra um aviso claro ("N itens não
    estão mais disponíveis no catálogo e foram removidos. Revise o pedido e tente
    novamente.") e, se o carrinho esvazia, redireciona para `/carrinho`.
  - Validação: 49 testes frontend verdes, ESLint limpo, `npm run build` OK e
    checagem no navegador — carrinho com item válido → **201** ("Pedido #233
    registrado"); carrinho com item obsoleto → item removido automaticamente e
    aviso exibido, sem travar.

---

## 2026-10-06 · Remove tema duplicado do menu do usuário

- `refactor(tema): remove o switch dark/light redundante do drawer do usuário`
  - O `Layout.jsx` renderizava **dois** controles de tema: o pill do cabeçalho
    (`header-theme-toggle` — o padrão global) e um `ThemeToggle variant="mobile"`
    dentro do menu lateral que mostra o nome do usuário e "Sair". Como o tema já
    é **global** e o pill do cabeçalho fica visível também no mobile (< 768px),
    o switch do menu era redundante e dava a impressão de ser uma função "do
    perfil".
  - Removido apenas o `<ThemeToggle variant="mobile" />` do drawer. O controle
    original do cabeçalho (padrão do projeto) permanece, assim como os toggles
    das telas de autenticação/bem-vindo (Login, ForgotPassword, WelcomePage),
    que não têm cabeçalho e precisam do próprio botão. A página de perfil
    (`Profile.jsx`) nunca teve controle de tema próprio.
  - Validação: 49 testes frontend verdes, ESLint limpo, `npm run build` OK.

---

## 2026-10-06 · Acesso às contas demo e política de senha

- `fix(auth): restaura login das contas demo e afrouxa a política de senha`
  - No banco as contas já existiam, e o `seed.ts` **nunca reescreve a senha de
    um usuário existente** (só garante nome/papel). Por isso os hashes antigos
    de `marcelo10@gmail.com` (admin) e `funcionario@nexuscontrol.com` não
    batiam com o `.env`/README e davam **401**, embora o fluxo de
    cadastro→login estivesse íntegro (verificado com round-trip: register 201 +
    login 200).
  - Política afrouxada, a pedido, de "exatamente 6 dígitos + 1 símbolo" para
    **"de 5 a 6 dígitos seguidos de 1 símbolo (6 ou 7 caracteres)"** — o valor
    atual do `.env` (`ROOT_ADMIN_PASSWORD="26481#"`, 5 dígitos) passa a ser
    válido, o que também **destrava o `seed` em base nova na AWS** (antes ele
    lançaria "senha não atende à política" e o boot falharia).
  - Alterações na fonte da regra (mantidas em sincronia):
    `infrastructure/utils/passwordPolicy.js` (caminho vivo), a cópia legada
    `utils/passwordPolicy.js`, e o espelho frontend `utils/password.js` — regex
    `^\d{5,6}[^A-Za-z0-9\s]$` e mensagens/hint correspondentes.
  - Testes/dicas/docs alinhados: `security.test.js` (bordas 5–6 dígitos; `1234#`
    rejeitado, `26481#`/`12345#` aceitos), `Login.test.jsx`, placeholders de
    `Profile.jsx`/`UserFormModal.jsx`, e as descrições em `README.md`,
    `README.en.md`, `docs/SEGURANCA.md`, `docs/FRONTEND.md`.
  - Banco (UPDATE não-destrutivo na coluna `senha`, sem tocar pedidos/histórico):
    admin re-criptografado para `26481#` e funcionario para `123457#`.
  - Validação final: **86 testes backend** e **49 testes frontend** verdes,
    ESLint limpo, `npm run build` OK, e login **200** confirmado via API para
    admin, funcionario e cliente.

---

## 2026-10-06 · Correção dos KPIs do Dashboard (teste de navegação)

- `fix(dashboard): contadores zerados/errados no painel por estouro do limite da API`
  - No teste de navegação com o sistema rodando, o Dashboard pedia o catálogo e
    os usuários com `limit: 200`, mas o validador da API (`validatePagination`)
    aceita no máximo `1–100`. A resposta **400** fazia o `Promise.allSettled`
    retornar erro e os KPIs "Itens no Catálogo" (todos os perfis) e "Usuários"
    (admin) apareciam como **0**, mesmo com 107 itens no catálogo.
  - "Meus Pedidos" era calculado pelo tamanho do array buscado (`limit: 50`),
    mostrando **50** quando o cliente tinha **57** pedidos reais.
  - Ajuste no frontend (`Dashboard.jsx`): buscas passam a usar `limit: 100`
    (dentro do teto da API) e o total de itens passa a ler `pagination.total`
    (107), não o tamanho do array. Regras de negócio e o teto da API permanecem
    no backend — nenhuma mudança destrutiva.
  - Validação: `vitest` do Dashboard (4/4 verdes), ESLint limpo, e checagem na
    API confirmou `/itens?limit=100` → 200 (total 107) e `/pedidos/me?limit=100`
    → 200 (57 pedidos). Confirmado visualmente no navegador: "Itens no Catálogo
    107" e "Meus Pedidos 57".
  - `OrdersSummaryWidget`: rótulo "pedidos realizados" (que mostrava apenas a
    prévia de `maxItems + 2` e contradiz o KPI de 57) corrigido para
    "pedidos recentes", coerente com a lista parcial exibida.

---

## 2026-10-06 · Prontidão para a nuvem (AWS Academy)

- `a58ea5f` **🐛 fix(deploy): destravar o deploy na AWS e alinhar o README à nuvem**
  - `deploy.yml`: o passo de deploy condicionava com `secrets.*` dentro de um `if`
    de passo — prática não permitida pelo GitHub Actions, que fazia o deploy nunca
    disparar. Segredos movidos para `env` do job e gate reescrito como
    `if: env.*`; o `with:` passa a ler `env.*`.
  - `README.md`/`README.en.md`: seção de Deployment reescrita para o fluxo real da
    AWS (`deploy-aws.sh`, `npm ci`, migrate/seed via `dist`, PM2 com reload
    gracioso, Nginx, verificação no `/api/health`); correção `DB_PASSWORD` →
    `DB_PASS` (o código lê `DB_PASS`); Mercado Pago registrado como opcional.
- `4fe3d42` **🔧 fix(aws): endurecer prontidão para AWS Academy**
  - `server.ts`: encerramento gracioso em `SIGINT`/`SIGTERM` (fecha o pool MySQL,
    watchdog de 10s) e tratamento de `unhandledRejection`/`uncaughtException`.
  - `ecosystem.config.cjs`: `kill_timeout`/`listen_timeout`/`wait_ready` e
    caminhos de log para o PM2.
  - `deploy-aws.sh`: pré-flight Node ≥ 20, guard de `.env`, criação de `logs/`,
    migrate via `dist`, reload condicional do PM2 e verificação de `/api/health`.
  - `deploy/nginx.conf.example` novo: upstream, proxy `/api` e webhook MP,
    fallback SPA, negação de `.env`/`.git`.
  - `.env.production.example` novo; `.env.example` ganha `DB_PORT`.
  - Docs de deploy revisadas (35 itens de catálogo, MP opcional, rate limits reais).
  - Frontend: remoção de variáveis não usadas (lint limpo para o CI).
- `3de8d51` **📚 docs: documentação técnica completa + grafo interativo do repositório**
  - `docs/ARQUITETURA.md`, `API.md`, `DADOS.md`, `FRONTEND.md`, `SEGURANCA.md`,
    `TESTES.md`, `HISTORIA.md`, `README.md` e o visualizador de grafo em
    `docs/graph/` (`scan.mjs` + `index.html` + `graph.json`).

### Regras globais de negócio (a maior entrega em escopo)

- `615f5b6` **✨ feat(regras-negocio): implementação global das regras de negócio Nexus**
  - **Schema / migrations** (idempotentes, aditivas, sem destrutivos):
    - `usuarios`: + `status_conta`, `desativado_em`, `email_original`,
      `ultimo_login` + índices.
    - `pedidos`: + `pago_confirmado_em`, `payment_provider`,
      `provider_payment_id` (único), `confirmado_por`.
    - Novas tabelas: `alugueis`, `historico_eventos`, `vinculos_conta`.
  - **Backend**:
    - Módulos novos de `infrastructure`: `Conta.js`, `Aluguel.js`, `Pagamento.js`,
      `EventLog.js`, `Preco.js`.
    - `payments/mercadopago.js` — cliente MP + validação HMAC do webhook
      (`MP_WEBHOOK_SECRET`, `MP_ACCESS_TOKEN`, `PUBLIC_URL`).
    - Controllers `alertController`, `aluguelController`, `paymentController`.
    - Rotas novas: `/api/pagamentos`, `/api/alugueis`,
      `/api/usuarios/me/alertas`, `/api/usuarios/me/eventos`,
      `/api/usuarios/:id/eventos`.
    - `authController`: `register` aceita `senha_conta_desativada` para recuperar
      histórico e retorna `recuperou_historico`.
    - `userController`: `DELETE /me` passa a ser desativação suave; 409 com
      pendências se existirem pedidos/aluguéis abertos.
    - `orderController`: liberação só com `status_pagamento = confirmado`; grava
      `pago_confirmado_em` e `confirmado_por`.
    - `middleware/auth`: rejeita JWT de conta `desativada` / `bloqueado_inatividade`.
    - `businessRules.test.js`: 6 suítes cobrindo as regras (§1–§16, §50/§51).
  - **Frontend**:
    - `services.js`: `alertService`, `rentalService`, `deleteOwnAccount`,
      `confirmarPagamento`.
    - `AuthContext.register()` retorna `{ user, recuperou_historico }`.
    - `Login.jsx` (RegisterForm): campo condicional `senha_conta_desativada` +
      banner de recuperação.
    - `Checkout.jsx`: banner "processando/confirmado", ícones coerentes; nenhum
      checkout paralelo.
    - `Dashboard.jsx`: `AlertsBanner` para cliente e funcionário.
    - `Profile.jsx`: aba "Alertas" com resumo, lista e timeline; seção "Desativar
      conta" com `ModalContext.confirm()`; `PendingObligationsModal` para o 409 de
      pendências.
    - `AdminControlCenter.jsx`: aba "Aluguéis" com filtros de status e retirada;
      `UserEventsPanel` com auditoria por usuário; filtro "Situação" na seção de
      acessos; atualização de retirada via `ModalContext.confirm()`.
    - Testes de vitest atualizados para `alertService`.
  - **Docs**: `REGRAS_NEGOCIO.md` e `RELATORIO_IMPLEMENTACAO_REGRAS_NEGOCIO.md`
    (raiz) — enums, migrations, endpoints, regras e entrega final das 8 fases.
- `8e91d6e` **test: corrigir suites de teste do dashboard e do backend** — volta a
  ficar verde após mudanças de tema e de layout (mock de `alertService`, `aria-label`
  no `PendingObligationsModal` e ajuste de mensagem de senha).

## 2026-10-03 · Infra, segurança e identidade visual

- `c75eb3a` **✨ feat(dashboard): evolução completa das experiências por perfil**
  (dashboard segmentado admin/funcionário/cliente).
- `fe13ef4` **✨ feat: redesign completo da identidade visual Nexus Control.**
- `432f59b` **chore(deploy): tornar `deploy-aws.sh` executável (+x).**
- `c2ecb2e` Rate limiter dedicado para redefinição de senha.
- `4c4bb02` Sincroniza 35 itens + Nginx no Amazon Linux.
- `0a1ce3c` Automação de deploy AWS Academy, origens dinâmicas, serviço estático
  do frontend.
- `6b387f6` Defesa contra injeção, proteção de sessão, reorganização de rotas.
- `acd2938` **Catálogo expandido para 35 itens oficiais** + bundles.
- `791a87f` Atualiza artefatos de produção do backend.
- `0d44c2c` Sincroniza catálogo oficial na subida em produção.
- `25fa538` Bloqueia commit de arquivos AWS no `.gitignore`.
- `08bf9dc` Remove "about page" obsoleta dos READMEs.

## 2026-10-02 · Senhas, catálogo e perfil

- `78a4e3d` API continua acessível nos ambientes publicados.
- `585e5ef` Página de perfil aprimorada.
- `d39be89` **Desativação segura da própria conta** (embrião da regra global).
- `79ffc18` Testes cobrem busca + filtros combinados.
- `9a87b3f` Itens sem preço preservados na gestão.
- `f344623` Catálogo exibe todos os itens disponíveis (compra e aluguel).
- `038353a` CI preserva `#` nas senhas de teste.
- `8fee8ad` Busca, paginação e edição de itens no catálogo.
- `a4c0bcd` Refresh de token e testes de integração ajustados.
- `1f0bb6f` Padronização de senha e correção do cadastro.
- `bd46e51` Formato específico aceito para admin raiz.

## 2026-10-01 · Segurança e política de senha

- `d699bd4`, `ce20a24` Mínimo de senha ajustado e documentado.
- `1c53aec` Reforço de segurança, acessos e preparo AWS.

## 2026-09-25 · Estabilização AWS

- `001aaf6` Bundles de frontend e backend versionados para deploy direto na AWS.
- `660abc1` `/admin/permissions` tolerante a falhas.
- `aff46c5` Modal de edição de produtos: dimensões e scroll ajustados.
- `7737cd2` Rota de acessos do usuário e persistência corrigidas.
- `76ac179` Screenshots reais substituem as ilustrativas; remove Currículo e
  "Quem Somos" do escopo público.
- `a709c3b` Correções críticas que causavam 504 no deploy.
- `446be02` Auto-seed do catálogo em produção, resiliência CORS, correção de tokens
  no cadastro e recuperação de senha.

## 2026-09-24 · Refino visual

- `200be3f` Layout responsivo fluido, exportação de currículo estilizada,
  screenshots atualizadas.

## 2026-09-20 · Currículo técnico integrado (depois removido)

- `c5c23a4` Modo de edição exclusivo para admin, visualização pública limpa.
- `63623fb` Fix crítico: `previewMode` quebrava páginas com 500.
- `edf6602` Galeria de screenshots no README.
- `4a1f478` Currículo full-stack dentro do painel admin + deploy Vercel.

## 2026-09-16 · Clean architecture e histórico de pedidos

- `6b6ca9a` Histórico detalhado de pedidos + gestão administrativa.
- `fdfd5dc` **Migração para clean architecture**: `domain`, `application/use-cases`,
  `infrastructure`, `presentation`.

## 2026-09-13 · Tema claro maduro

- `541c6f1` Tema claro completo + otimizações mobile para telas de auth.

## 2026-09-10 · Correções críticas de auth

- `0f250b6` Merge de mudanças remotas.
- `09ae627` Bugs resolvidos em login, cadastro e recuperação de senha.

## 2026-09-08 · v1.1.0 e primeiros ajustes

- `0bf0edf` Link do LinkedIn no rodapé.
- `3fbb049` Padronização de modais + responsividade multi-dispositivo.
- `b26a68b`, `13c2f5f`, `27b6fbc`, `908c233` Peripécia de tema: admin forçado dark
  → variáveis CSS completas → toggle dark/light restaurado.
- `65655fc` Rate limiter de login separado do geral.
- `e22ba30`, `e8e1aaf`, `9cf33e7` Rollback cirúrgico: recupera as telas originais de
  login/register/forgot password (neumorphic circular com flip 3D).
- `dc726ea`, `cf67558` "Quem Somos" pública + links corrigidos.
- `d387cda`, `e95144f` README multilíngue (Português / English).
- `1a1b869` **Release v1.1.0 production-ready.**
- `29a78de` Relatório E2E (10/10 testes).
- `e410996` 4 recursos executivos de UX.
- `aa06cd1` Página institucional "Quem Somos" com perfil profissional.
- `b52417f` Limpeza de arquivos redundantes.

## 2026-09-07 · Fundação

- `35eac24`, `787c5fc`, `32f7130`, `12941a2`, `ca5941a`, `da6784f` Onda de
  documentação: guias de otimização, infraestrutura AWS Academy, status
  production-ready, badges, README com perfil profissional.
- `260c312` Utilitários de otimização de imagens e scripts de build.
- `ee42bf6` Identidade visual clara (light theme) + meta tags OG/Twitter.
- `ba66db2` Frontend adota `React.lazy()` para 7 páginas + fallback `LoadingScreen`.
- `d4f1acb` Backend ganha `compression` e validação de produção (obriga
  `FRONTEND_URL` quando `NODE_ENV=production`).
- `89e6dcf`, `d8b225b` Ajustes de README (autenticação, contato, copyright).
- `7d70fa2` `.vite/` adicionado ao `.gitignore`.
- `b0c3c70` **Nexus Control funcional** — primeira versão com carrinho, temas
  dark/light e layout circular responsivo (React 18 + Vite + Tailwind, Express +
  MySQL, JWT de acesso).
- `1e94fbe` **Initial commit** — esqueleto vazio.
