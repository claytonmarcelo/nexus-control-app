# História do desenvolvimento — Nexus Control App

> 📌 Este é o relato narrativo por marcos. O **changelog oficial** (ordem
> mais-recente-primeiro) está em [`CHANGELOG.md`](../CHANGELOG.md) na raiz.

Linha do tempo completa do repositório, do commit inicial à entrega atual.
Agrupada por marcos. Cada entrada cita hash curto e o que foi entregue —
útil para entender *por que* cada parte existe.

## 2026-09-07 · Fundação

- `1e94fbe` **Initial commit** — esqueleto vazio.
- `b0c3c70` **Nexus Control funcional** — primeira versão com carrinho,
  temas dark/light e layout circular responsivo. React 18 + Vite + Tailwind,
  Express + MySQL, JWT de acesso.
- `7d70fa2` `.vite/` adicionado ao `.gitignore`.
- `d8b225b`, `89e6dcf` Ajustes de README (autenticação, contato, copyright).
- `d4f1acb` Backend ganha `compression` e validação de produção
  (obriga `FRONTEND_URL` quando `NODE_ENV=production`).
- `ba66db2` Frontend adota `React.lazy()` para 7 páginas + fallback
  `LoadingScreen`. Code-splitting reduz o bundle inicial.
- `ee42bf6` Identidade visual clara (light theme) + meta tags OG/Twitter.
- `260c312` Utilitários de otimização de imagens e scripts de build.
- `da6784f`, `ca5941a`, `12941a2`, `32f7130`, `787c5fc`, `35eac24` Onda de
  documentação: guias de otimização, infraestrutura AWS Academy, status
  production-ready, badges, README com perfil profissional.

## 2026-09-08 · v1.1.0 e primeiros ajustes

- `b52417f` Limpeza de arquivos redundantes.
- `aa06cd1` Página institucional "Quem Somos" com perfil profissional.
- `e410996` 4 recursos executivos de UX.
- `29a78de` Relatório E2E (10/10 testes).
- `1a1b869` **Release v1.1.0 production-ready**.
- `e95144f`, `d387cda` README multilíngue (Português / English).
- `cf67558`, `dc726ea` "Quem Somos" pública + links corrigidos.
- `9cf33e7`, `e8e1aaf`, `e22ba30` Rollback cirúrgico: recupera as telas
  originais de login/register/forgot password (design neumorphic circular
  com flip 3D).
- `65655fc` Rate limiter de login separado do geral.
- `908c233`, `27b6fbc`, `13c2f5f`, `b26a68b` Peripécia de tema: admin
  forçado dark → sistema completo de variáveis CSS → toggle dark/light
  restaurado.
- `3fbb049` Padronização de modais + responsividade multi-dispositivo.
- `0bf0edf` Link do LinkedIn no rodapé.

## 2026-09-10 · Correções críticas de auth

- `09ae627` Bugs resolvidos em login, cadastro e recuperação de senha.
- `0f250b6` Merge de mudanças remotas.

## 2026-09-13 · Tema claro maduro

- `541c6f1` Tema claro completo + otimizações mobile para telas de auth.

## 2026-09-16 · Clean architecture e histórico de pedidos

- `fdfd5dc` **Migração para clean architecture**: separação em `domain`,
  `application/use-cases`, `infrastructure`, `presentation`.
- `6b6ca9a` Histórico detalhado de pedidos + gestão administrativa.

## 2026-09-20 · Currículo técnico integrado (depois removido)

- `4a1f478` Currículo full-stack dentro do painel admin + deploy Vercel.
- `edf6602` Galeria de screenshots no README.
- `63623fb` Fix crítico: `previewMode` quebrava páginas com 500.
- `c5c23a4` Modo de edição exclusivo para admin, visualização pública limpa.

## 2026-09-24 · Refino visual

- `200be3f` Layout responsivo fluido, exportação de currículo estilizada,
  screenshots atualizadas.

## 2026-09-25 · Estabilização AWS

- `446be02` Auto-seed do catálogo em produção, resiliência CORS, correção
  de tokens no cadastro e recuperação de senha.
- `a709c3b` Correções críticas que causavam 504 no deploy.
- `76ac179` Screenshots reais substituem as ilustrativas; removeu
  Currículo e "Quem Somos" do escopo público.
- `7737cd2` Rota de acessos do usuário e persistência corrigidas.
- `aff46c5` Modal de edição de produtos: dimensões e scroll ajustados.
- `660abc1` `/admin/permissions` tolerante a falhas.
- `001aaf6` Bundles de frontend e backend versionados para deploy direto
  na AWS.

## 2026-10-01 · Segurança e política de senha

- `1c53aec` Reforço de segurança, acessos e preparo AWS.
- `ce20a24`, `d699bd4` Mínimo de senha reduzido para 8 caracteres (documentado).

## 2026-10-02 · Senhas, catálogo e perfil

- `bd46e51` Formato específico aceito para admin raiz.
- `1f0bb6f` Padronização de senha e correção do cadastro.
- `a4c0bcd` Refresh de token e testes de integração ajustados.
- `8fee8ad` Busca, paginação e edição de itens no catálogo.
- `038353a` CI preserva `#` nas senhas de teste.
- `f344623` Catálogo exibe todos os itens disponíveis (compra e aluguel).
- `9a87b3f` Itens sem preço preservados na gestão.
- `79ffc18` Testes cobrem busca + filtros combinados.
- `d39be89` **Desativação segura da própria conta** (embrião do que virou
  regra global).
- `585e5ef` Página de perfil aprimorada.
- `78a4e3d` API continua acessível nos ambientes publicados.

## 2026-10-03 · Infra, segurança e identidade visual

- `08bf9dc` Remove "about page" obsoleta dos READMEs.
- `25fa538` Bloqueia commit de arquivos AWS no `.gitignore`.
- `0d44c2c` Sincroniza catálogo oficial na subida em produção.
- `791a87f` Atualiza artefatos de produção do backend.
- `acd2938` **Catálogo expandido para 35 itens oficiais** + bundles.
- `6b387f6` Defesa contra injeção, proteção de sessão, reorganização de rotas.
- `0a1ce3c` Automação de deploy AWS Academy, origens dinâmicas, serviço
  estático do frontend.
- `4c4bb02` Sincroniza 35 itens + Nginx no Amazon Linux.
- `c2ecb2e` Rate limiter dedicado para redefinição de senha.
- `432f59b` `deploy-aws.sh` marcado como executável.
- `fe13ef4` **Redesign completo da identidade visual Nexus**.
- `c75eb3a` **Evolução completa das experiências por perfil** (dashboard
  segmentado admin/funcionário/cliente).

## 2026-10-06 · Regras globais de negócio (fase atual)

- `8e91d6e` **Fix dos suites de teste**: dashboard e backend voltam a ficar
  verdes após mudanças de tema e de layout.
- `615f5b6` **Implementação global das regras de negócio Nexus** (a maior
  entrega em escopo):

  **Schema / migrations** (idempotentes, aditivas, sem destrutivos):
  - `usuarios`: + `status_conta`, `desativado_em`, `email_original`,
    `ultimo_login` + índices.
  - `pedidos`: + `pago_confirmado_em`, `payment_provider`,
    `provider_payment_id` (único), `confirmado_por`.
  - Novas tabelas: `alugueis`, `historico_eventos`, `vinculos_conta`.

  **Backend**:
  - Módulos novos de `infrastructure`: `Conta.js`, `Aluguel.js`,
    `Pagamento.js`, `EventLog.js`, `Preco.js`.
  - `payments/mercadopago.js` — cliente MP + validação HMAC do webhook
    (`MP_WEBHOOK_SECRET`, `MP_ACCESS_TOKEN`, `PUBLIC_URL`).
  - Controllers `alertController`, `aluguelController`, `paymentController`.
  - Rotas novas: `/api/pagamentos`, `/api/alugueis`, `/api/usuarios/me/alertas`,
    `/api/usuarios/me/eventos`, `/api/usuarios/:id/eventos`.
  - `authController`: `register` aceita `senha_conta_desativada` para
    recuperar histórico e retorna `recuperou_historico`.
  - `userController`: `DELETE /me` passa a ser desativação suave; 409 com
    pendências se existirem pedidos/aluguéis abertos.
  - `orderController`: liberação só com `status_pagamento = confirmado`;
    grava `pago_confirmado_em` e `confirmado_por`.
  - `middleware/auth`: rejeita JWT de conta `desativada` / `bloqueado_inatividade`.
  - `businessRules.test.js`: 6 suítes cobrindo as regras (§1–§16, §50/§51).

  **Frontend**:
  - `services.js`: `alertService`, `rentalService`, `deleteOwnAccount`,
    `confirmarPagamento`.
  - `AuthContext.register()` retorna `{ user, recuperou_historico }`.
  - `Login.jsx` (RegisterForm): campo condicional `senha_conta_desativada`
    + banner de recuperação.
  - `Checkout.jsx`: banner "processando/confirmado", ícones coerentes;
    nenhum checkout paralelo.
  - `Dashboard.jsx`: `AlertsBanner` para cliente e funcionário.
  - `Profile.jsx`: aba "Alertas" com resumo, lista e timeline; seção
    "Desativar conta" com `ModalContext.confirm()`; `PendingObligationsModal`
    para o 409 de pendências.
  - `AdminControlCenter.jsx`: aba "Aluguéis" com filtros de status e
    retirada; `UserEventsPanel` com auditoria por usuário; filtro
    "Situação" na seção de acessos; atualização de retirada via
    `ModalContext.confirm()`.
  - Testes de vitest atualizados para `alertService`.

  **Docs**:
  - `REGRAS_NEGOCIO.md` (raiz) — enums, migrations, endpoints, regras.
  - `RELATORIO_IMPLEMENTACAO_REGRAS_NEGOCIO.md` (hoje em `docs/reports/`) — entrega final
    das 8 fases com checklist §117.

## Estado atual

- Backend: **92 testes verdes** em 4 suites (`api` 37, `businessRules` 23,
  `integration` 22, `security` 10), rodados em 2026-10-06 com `npm test` — build
  TypeScript limpo e o `npm run build` reproduz o `backend/dist` versionado
  byte a byte (só muda quebra de linha). O número anterior de 86 que aparecia
  aqui era o total da entrega das regras de negócio; a suíte cresceu com os
  fixes de checkout, alertas e exclusão de conta.
- Frontend: **49 testes verdes** em 8 arquivos (rodados em 2026-10-06 com
  `npm run test`), `npm run build` OK, **ESLint limpo** (erros pré-existentes
  resolvidos para o CI passar).
- Banco: schema atualizado com colunas/tabelas aditivas; dados preservados.
- Deploy: bundles `frontend/dist` e `backend/dist` atualizados para AWS.
- Infra local: stack Docker (`docker compose up -d --build`) sobe MySQL + API +
  Web com migrações e seed no boot; validada em 2026-10-06.
- Documentação técnica centralizada em `docs/`, com os relatórios de fase em
  `docs/reports/`; instruções de instalação permanecem em `README.md` (na raiz)
  e `SETUP.md`.
