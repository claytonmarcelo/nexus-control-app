# Changelog — Nexus Control App

Histórico completo de todas as alterações do código, **do mais recente para o
mais antigo**, do commit inicial até hoje. Este é o changelog oficial do
projeto. As instruções de instalação permanecem no [`README.md`](./README.md);
a história detalhada por marcos também pode ser lida em
[`docs/HISTORIA.md`](./docs/HISTORIA.md).

> Este projeto é acadêmico (AWS Academy). O pagamento é **fake/manual por
> design**: o checkout funciona em **Pix/Cartão com confirmação pelo
> administrador** em todos os ambientes; o gateway Mercado Pago é opcional e só
> é ativado se as credenciais de ambiente existirem.

## Estado atual (2026-10-06)

- Backend: **86 testes verdes**, build TypeScript limpo.
- Frontend: **49 testes verdes**, `npm run build` OK, **ESLint sem erros** (lint
  limpo para o CI).
- Deploy: `backend/dist` e `frontend/dist` atualizados; workflow de deploy
  corrigido e pronto para publicar na AWS.

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
