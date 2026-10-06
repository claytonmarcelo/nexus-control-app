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

- Backend: **92 testes verdes** em 4 suites (`api` 37, `businessRules` 23,
  `integration` 22, `security` 10), rodados de verdade nesta data — build TypeScript limpo.
  Inclui o fix do boot de produção: falha de banco agora encerra o processo (watchdog de 10s)
  em vez de deixá-lo ouvindo a porta sem MySQL.
- Frontend: **58 testes verdes** (49 anteriores + 9 das páginas de erro),
  `npm run build` OK, **ESLint sem erros** (lint limpo para o CI).
- Deploy: `backend/dist` e `frontend/dist` atualizados; o workflow de deploy agora executa
  o **mesmo** `deploy-aws.sh` do caminho manual (uma única fonte de verdade) e a
  documentação do passo a passo na EC2 foi corrigida — ver a entrada mais recente.
- Infra local: **stack Docker** adicionada (MySQL + API + Web) — ver a entrada
  "Prontidão de portfólio: Docker + README fiel ao código".
- Documentação: os 9 relatórios de `docs/reports/` revisados contra o código — ver a
  entrada "Revisão dos relatórios".

---

## 2026-10-06 · Bug fix: servidor ficava "online" com o banco morto em produção

Complementando o que a auditoria de deploy mostrou, a leitura do boot em produção revelou um
buraco no caminho de falha do banco: `initDatabase()` chamava `server.close(() => process.exit(1))`
sem watchdog. `server.close()` **espera as requisições em andamento terminarem** — se havia
uma delas no ar (upload parado, retry do webhook, cliente sem `requestTimeout`), o callback
nunca rodava e o processo continuava ouvindo a porta com o MySQL morto. Como o PM2 não
reinicia um processo que nunca sai, a AWS Academy ficava com o site no ar distribuindo erro
em silêncio — exatamente o tipo de falha que o health check do deploy não pegaria se o banco
caísse depois da virada.

- **Correção na íntegra**: a falha de inicialização do banco agora usa o
  `encerrar('falha-banco', 1)` que **já existia** para `SIGINT`/`SIGTERM` — mesmo watchdog de
  10s, mesmo `pool.end()` no MySQL, mesmo código de saída 1. Nenhuma regra de negócio, rota,
  validação ou configuração do PM2 foi alterada.
- **Prova antes/depois** (ensaio com `dist` real, `NODE_ENV=production`, host de banco
  inacessível e uma requisição com corpo incompleto em voo):
  - antes do fix: `❌ CONTINUA VIVO após 30s com o banco fora` (porta ocupada, nunca saía);
  - depois do fix: `Shutdown excedeu 10s; forçando saída.` → `✅ encerrou sozinho: código=1`
    — e com o processo encerrado o `autorestart`/`restart_delay` do PM2 cuida do reinício.
- **Regressão do caminho feliz**: boot real no schema isolado de ensaio (`nexus_deploy_dryrun`,
  **sem tocar no `nexusdb`**) → migrações ok, seed idempotente (`⏭️ Item já existe`),
  `/api/health` → `HTTP 200 {"status":"ok","database":"ok"}`, SPA `/acesso-negado` → 200,
  SIGTERM encerra normalmente.
- **Suíte completa**: `npm test` com `NODE_ENV=test` apontando para o schema de ensaio →
  **4 suites, 92 testes verdes**. `backend/dist/server.js` recompilado e commitado junto
  (regra do projeto: `dist` versionado; o rebuild só mudou este arquivo).
- **Documentação que mentia** corrigida junto, sem mudança de comportamento: o comentário do
  `ecosystem.config.cjs` afirmava que o backend emite `process.send('ready')` — não existe
  nenhuma chamada assim em `src/` (por isso `wait_ready: false` está correto, e ligá-lo só
  faria cada reload esperar os 15s de `listen_timeout`); e a nota 5 do `DEPLOY_CHECKLIST.md`
  dizia que o `wait_ready` estava configurado. A nota agora também registra o limite do PM2
  (`max_restarts: 10` com `restart_delay: 5000`): se o MySQL ficar fora por mais de ~50s, o
  processo fica `errored` e precisa de um `pm2 restart nexus-backend` quando o banco voltar.
- Ensaio repetido contra o schema isolado depois do fix, e a suíte de backend (92 testes)
  rodada verde contra ele — o `nexusdb` local não foi tocado por nenhum dos ensaios.

---

## 2026-10-06 · Pipeline de atualização na AWS deixado à prova de falha

Auditoria do caminho "push no GitHub → EC2 rodando a versão nova", com **ensaio completo de
deploy em produção** (clone limpo, schema MySQL isolado, `NODE_ENV=production`, poda de
devDependencies, boot, health check e smoke das rotas). O ensaio passou em tudo e mostrou
quatro pontos que fariam a atualização real quebrar ou falhar em silêncio, mais dois textos de
documentação que mentiam para quem segue o checklist. **Nenhuma linha de
código de negócio foi tocada** — só CI, script de deploy e documentação.

- **`.github/workflows/deploy.yml` (bug que quebraria o deploy)**: o passo SSH tinha uma
  sequência própria que começava com `npm ci --omit=dev` e depois rodava `npm run build`.
  Como o `build` é `tsc` e TypeScript é **devDependency**, o binário não existia e o build
  morria no Actions; além disso `npm run db:migrate || true` e `db:seed || true` escondiam
  qualquer erro de banco, e não havia verificação nenhuma de que o servidor subiu. O passo
  agora localiza o repositório na instância e chama `bash deploy-aws.sh` (com
  `script_stop: true`), então CI e deploy manual são exatamente o mesmo roteiro, e uma
  falha faz o workflow vermelho em vez de deixar código antigo no ar.
- **`deploy-aws.sh` (robustez em SSH não-interativo)**: bloco de `PATH` antes dos pré-voos,
  acrescentando `/usr/local/bin`, `/opt/node/bin`, `~/.npm-global/bin` e versões do nvm. Sem
  isso, um SSH do GitHub Actions pode não enxergar `pm2` (instalado via `npm -g`), o script
  entraria no ramo "PM2 não encontrado" e o health check morreria por um motivo fictício.
- **`INSTRUCOES_ATUALIZACAO_AWS.md` · Método 2**: o passo a passo manual tinha o mesmo bug do
  CI (`npm install --omit=dev` antes do build) e fechava com `pm2 restart all`, que derruba o
  processo em vez de recarregar a quente. Reescrito na ordem correta — `npm ci` (com devDeps)
  → build → `node dist/utils/migrate.js` → `node dist/utils/seed.js` → `npm prune --omit=dev`
  → frontend → `pm2 reload ecosystem.config.cjs --env production` → `curl /api/health` — e o
  Método 1 ganhou os pré-voos, a poda, o health check e a nota de paridade com o CI.
- **`INSTRUCOES_ATUALIZACAO_AWS.md` · novo Método 3**: tabela dos secrets do GitHub Actions
  (`EC2_HOST`, `EC2_SSH_KEY`, `EC2_USER`, `EC2_PORT`) com a armadilha que mais dá erro na AWS
  Academy — o usuário SSH da Amazon Linux é `ec2-user`, não o `ubuntu` usado como padrão, e o
  `EC2_HOST` precisa ser atualizado a cada start do laboratório porque o IP público muda.
- **`DEPLOY_CHECKLIST.md`**: nova seção sobre a **armadilha do `#` no dotenv** (descoberta no
  ensaio: um `DB_PASS=Algo#2026` chega ao processo como `Algo`, e o MySQL devolve
  `ER_ACCESS_DENIED_ERROR ... (using password: YES)` — parece senha errada, é senha truncada),
  a exigência de produção de `DB_PASS` preenchido, os critérios reais do boot seguro
  (`JWT_SECRET`/`JWT_REFRESH_SECRET` com ≥ 32 caracteres, diferentes e sem prefixo de exemplo;
  `DB_HOST`/`DB_USER`/`DB_PASS`/`DB_NAME` obrigatórios), a correção da política de senha do
  `ROOT_ADMIN_PASSWORD` (**5 ou 6 dígitos + exatamente 1 símbolo**, regex
  `/^\d{5,6}[^A-Za-z0-9\s]$/` — o texto dizia "exatamente 6 dígitos"), e a seção de comandos
  alinhada ao `deploy-aws.sh`.
- **`backend/.env.example` e `backend/.env.production.example`**: os modelos que viram o
  `.env` da EC2 agora avisam do `#` do dotenv logo na entrada e repetem a política de senha
  correta (5–6 dígitos + 1 símbolo, com exemplos válidos e inválidos). São **só comentários**:
  nenhum valor mudou, e a leitura pelos dois dotenv (o da máquina e o do processo) foi
  conferida depois da edição.

**Validação do ensaio**: migrações + seed idempotentes a partir de schema vazio; boot após a
poda de devDeps; `/api/health` → `{"status":"ok","database":"ok"}`; `/` e a nova
`/acesso-negado` respondendo 200 `text/html` pelo fallback SPA do Express; 404 JSON contract
preservado em rota de API desconhecida; login + `/auth/me` + `/itens` + `/pedidos` +
`/usuarios` com JWT (e 401 sem token); frontend de `npm ci` limpo com build OK e **58 testes
verdes**; conferência automática de rotas → *59 rotas no backend, 47 chamadas distintas no
frontend, nenhuma chamada órfã*.

---

## 2026-10-06 · Bug fix: o ponto dourado do badge da Welcome voltou a pulsar

Consequência de auditar as animações ao fazer as páginas de erro. O Tailwind 3 só
emite um `@keyframes` do `theme.extend` quando a classe utility (`animate-*`) é
usada em algum JSX — **referenciar o nome em CSS puro não força a emissão**. Como
`animate-pulse-soft` nunca foi usado, o `keyframes pulseSoft` do
`tailwind.config.js` **não chegava ao bundle**, e as duas regras que o chamavam em
CSS puro ficavam paradas: `.welcome-badge-dot` (o ponto "ao vivo" do badge
*Plataforma Corporativa de TI*) e `.welcome-orb-3` (o brilho central do hero).

- `@keyframes pulseSoft` **declarado localmente** em `frontend/src/index.css`, do
  lado do uso — mesmo comportamento do token (opacity 1 → 0,8).
- Escalado com a propriedade independente `scale`, e **não** com `transform`: o
  `.welcome-orb-3` depende de `transform: translate(-50%, -50%)` para ficar
  centralizado, e um keyframe que escrevesse `transform` iria arrastar o orb para
  fora do lugar. Verificado no navegador: durante a animação o `transform`
  calculado continua `matrix(1, 0, 0, 1, -203, -300)` enquanto `scale` oscila.
- O ponto de 6 px ganhou keyframe próprio, `welcome-badge-pulse` (opacity +
  `scale` 1 → 1,6 + halo `box-shadow` champagne): o `pulseSoft` original é sutil
  demais para uma bolinha de 6 px.
- `@media (prefers-reduced-motion: reduce)` desliga as duas animações — quem pede
  menos movimento vê o ponto aceso, só que parado.
- **Não mexido:** `.welcome-orb-1/-2` usam `animation: float`, que tem o mesmo
  problema (o keyframe não é emitido). Corrigi-lo adicionaria movimento a dois
  orbs que hoje estão estáticos — mudança visual além do pedido, então ficou como
  observação.
- Validação: `npm run build` (os dois keyframes aparecem no `dist`), **58 testes
  verdes**, ESLint limpo, e conferido no navegador em `localhost:5199` com
  `getAnimations()` + `getComputedStyle` na página real.

---

## 2026-10-06 · Páginas de erro personalizadas (404 · 403 · 500) com animação

As páginas de erro **já existiam** em código, mas estavam **sem estilo nenhum**: o
`<ErrorPage />` (`frontend/src/components/ui/ErrorBoundary.jsx`) escrevia as classes
BEM `.error-page*` — e nenhuma dessas classes tinha CSS em lugar algum. O mesmo
valia para `.page-transition`, usada em `App.jsx` a cada troca de rota. Ou seja:
404 e 500 apareciam como HTML puro, sem a identidade visual do projeto. Esta
entrada **adiciona o que faltava** e uma página nova; nada que já funcionava foi
alterado.

- **CSS das páginas de erro** (`frontend/src/index.css`, seção nova ao final do
  arquivo, 100% com variáveis de tema — nenhuma cor hardcoded nos elementos):
  código do status em `clamp(4rem, 15vw, 8rem)` com o gradiente champagne do
  projeto recortado no texto, régua vertical em degradê, eyebrow em pílula,
  cantoneiras de moldura (`::before`/`::after`), brilho radial que **respira**
  (`error-glow-drift`, 12 s) e **entrada escalonada** dos blocos (`error-rise`,
  0,05 s → 0,55 s) com a mesma curva `cubic-bezier(0.23, 1, 0.32, 1)` da Welcome.
- **Tons por tipo de erro**: `--gold` (404, padrão), `--warning` (403, âmbar) e
  `--danger` (500, vermelho). O tom só troca as variáveis `--error-accent*`, então
  dark e light funcionam sem override dedicado.
- **Ícone do botão primário gira no hover** (`error-icon-turn`) — reforça "tentar
  de novo" sem inventar linguagem visual nova.
- **Mobile** (≤ 640 px): ações empilhadas em largura total e a régua some.
- **`prefers-reduced-motion: reduce`**: todas as animações das páginas de erro e da
  transição de rota são desligadas, sem esconder conteúdo (as animações usam
  `fill: both`, então com `animation: none` tudo aparece no lugar).
- **Transição de rota** (`.page-transition`): fade de 0,24 s **só em opacidade** —
  de propósito. Animar `transform` nesse invólucro criaria um bloco de contenção e
  quebraria header/sidebar `fixed`/`sticky` do Layout durante a navegação.
- **`<ErrorPage />` ganhou props opcionais** (`tone`, `hint`, `secondaryLabel`,
  `secondaryHref`), todas com default igual ao comportamento anterior: os chamados
  existentes (404 e 500) continuam renderizando as mesmas strings que os testes
  já cobrem.
- **404** (`NotFound.jsx`): agora informa **qual rota não existe** na dica técnica
  (`Nenhuma rota corresponde a /xyz`), em fonte mono.
- **403 nova** (`frontend/src/components/ui/Forbidden.jsx` + rota
  `/acesso-negado` em `App.jsx`): superfície de "acesso negado" que o projeto não
  tinha. **Os guards de rota (`PrivateRoute`) não foram tocados** — continuam
  redirecionando para `/dashboard` como sempre; a página fica disponível para uso
  quando (e se) você preferir exibir o erro em vez de redirecionar.
- **Testes**: suíte nova `frontend/src/components/ui/ErrorPages.test.jsx` com 9
  casos (estrutura BEM, tom, dica condicional, link secundário customizado, ação
  primária, 404 com a rota tentada, 403 âmbar). Total do frontend: **58 testes
  verdes**, `npm run build` OK, ESLint limpo nos arquivos alterados, e
  `frontend/dist` reconstruído e commitado (o `dist` é versionado neste projeto).
- **Validação visual**: `404` e `403` renderizados no navegador em tema **dark e
  light** (Vite em `localhost:5199`), com a Welcome page conferida antes/depois
  para garantir zero regressão.

---

## 2026-10-06 · Suítes rodadas de verdade: 92 backend + 49 frontend verdes

Execução completa das duas suítes contra o MySQL local (`nexusdb`), sem `--coverage`:

- `backend`: `npm test` (que primeiro roda `npm run build`) → **Test Suites: 4 passed, 4
  total; Tests: 92 passed, 92 total** em ~17 s. O `tsc` compilou sem erros e o build
  **reproduziu o `backend/dist` versionado** — os únicos diffs eram quebra de linha, o
  conteúdo byte a byte (após normalizar CRLF) é idêntico ao que está commitado.
- `frontend`: `npm run test` (Vitest) → **8 arquivos, 49 testes passando** em ~8,5 s
  (`Cart` 10, `Dashboard` 4, `Items` 6, `Profile` 8, `Login` 9, `ErrorBoundary` 3,
  `ThemeToggle` 5, `services/api` 4). O stack trace que aparece no meio da saída é do
  próprio teste do `ErrorBoundary`, que provoca um erro para verificar o fallback — não
  é falha.
- Os testes de backend escrevem no banco de desenvolvimento (criam contas
  `*@example.test` via `POST /api/auth/register` e as removem no `afterAll` com
  `DELETE FROM usuarios WHERE id = ?`); nenhum dado de cliente ou pedido real foi tocado,
  e as contas `probe.*@test.local` que já existiam continuam preservadas, como registrado
  em `docs/reports/RELATORIO_IMPLEMENTACAO_REGRAS_NEGOCIO.md` §9.4.
- Com isso, o número de **92** que a revisão anterior tinha contado no código está
  confirmado como verde, e os textos de `docs/HISTORIA.md` e do relatório de regras de
  negócio passaram a dizer "testes verdes" em vez de "casos declarados".
- Rodado numa cópia de trabalho do repositório na Desktop (a pasta em `Documents` estava
  somente leitura para as ferramentas); nenhum arquivo de código-fonte mudou.

---

## 2026-10-06 · Revisão dos relatórios de `docs/reports/` antes da entrega

Passo os nove documentos de fase em revista contra o código atual. **Nenhum texto
original foi apagado**: o que estava desatualizado ganhou uma atualização datada
dentro do próprio documento, para continuar servindo como registro da época.

- **Três afirmações que estavam factualmente erradas:**
  - `ANALISE_AUTH_FLOWS.md` dizia que "no estado atual" a senha exigia **12+ caracteres**.
    A política vigente é **5–6 dígitos + 1 símbolo** (`infrastructure/utils/passwordPolicy.js`,
    replicada em `utils/` e no frontend). O mesmo aviso foi corrigido quanto ao token de
    recuperação: ele só aparece na resposta em `development`/`test`; em produção não sai da API.
  - `RELATORIO_IMPLEMENTACAO_REGRAS_NEGOCIO.md` §9 ensinava que, sem `MP_ACCESS_TOKEN`,
    o pagamento ficava **manual para o admin confirmar**. Hoje o modo simulado **confirma na
    mesma requisição** (Pix `provider: 'fake'`, cartão `provider: 'manual'`), fiel ao
    comportamento restaurado nesta data; a pendência só existe com gateway real ou em pedidos
    legados, retomáveis por `POST /api/pedidos/:id/pagamento`.
  - O mesmo relatório §7 listava **11 erros de ESLint** "pré-existentes". `npm run lint` no
    frontend roda limpo hoje (verificado nesta revisão, sem `--fix`), e os símbolos citados
    (`cartSubtotal`, `toggleTheme`, `UserIcon`, `vi`) já não aparecem nos arquivos.
- **Contagem de testes:** o backend tinha **86** casos na entrega das regras de negócio e hoje
  tem **92** (`api` 37, `businessRules` 23, `integration` 22, `security` 10). O número foi
  atualizado em `docs/HISTORIA.md` (seção "Estado atual") e anotado dentro do relatório, que
  continua mostrando 86 como foto daquela rodada. Frontend seguem **49**, conferem.
- **Caminhos obsoletos sinalizados, não reescritos:** `backend/src/models|controllers|routes`
  viraram `infrastructure/` e `presentation/`; componentes `.js` são `.jsx`; o `App.tsx` do
  template Vite já foi removido (os assets `hero.png`/`react.svg`/`vite.svg` continuam em
  `frontend/src/assets/`); `node src/utils/migrate.js` agora é `npm run db:migrate` em `backend/`.
- **Datas que faltavam:** `PROJECT_STATUS`, `IMPLEMENTATION_SUMMARY`, `PRODUCTION_READY`,
  `DEPLOYMENT_SUMMARY`, `ASSETS_AUDIT_REPORT` e `E2E_TESTING_REPORT` receberam aviso de
  *snapshot histórico* no topo com a data do registro; `PROJECT_STATUS` e
  `IMPLEMENTATION_SUMMARY` traziam **2024** por engano no "Data de Conclusão" (corrigido para 2026).
- **Índice** `docs/reports/README.md` ganhou a coluna "Registro de" e um parágrafo explicando
  que cada arquivo é foto de um momento, não especificação viva.
- **Checagem automática:** 29 links markdown internos conferidos um a um — **0 quebrados**;
  varredura por segredo (JWT, `access_token`, chaves de gateway, caminho absoluto, e-mail
  pessoal) não achou nada além do e-mail demo do admin, que já é credencial de seed pública.
- Só documentação mudou: nada em `src/` nem em `dist/`, então o app continua idêntico.

---

## 2026-10-06 · Prontidão de portfólio: Docker + README fiel ao código

Foco em deixá-lo apresentável para análise de vaga (estágio/júnior) **sem** publicar demo no ar.

- **Docker (aditivo, não toca o código do app):** `backend/Dockerfile` (build em 2 estágios,
  `node:20-alpine`, `tsc`→`dist`, runtime só com `--omit=dev`, usuário sem privilégios),
  `frontend/Dockerfile` (bundle do Vite servido por **Nginx** com fallback de SPA e proxy reverso
  de `/api`), `frontend/nginx.conf`, `docker-compose.yml` (**MySQL 8 + API + Web**) e os
  `.dockerignore`. `docker compose up -d --build` sobe tudo: app em `http://localhost:8080`, API
  em `http://localhost:3000`. O backend roda as **migrações idempotentes + seed no boot** (nenhum
  SQL destrutivo). **Nenhum segredo fica na imagem ou no compose** — tudo por variáveis de
  ambiente, com defaults claros de desenvolvimento que devem ser trocados em produção.
- **README.md (correções de exatidão):** versões reais (**React Router 7**, **Vite 6**,
  **TypeScript 5.4**) no lugar de 6/5/5.5; **lista de tabelas do banco** corrigida (adicionadas
  `alugueis`, `historico_eventos`, `vinculos_conta`; `negociacoes` mantida, pois ainda é usada
  por `Negotiation.js`/`GET /api/itens/my-negotiations`); novos bullets de capacidades já
  implementadas (**aluguéis/retiradas, alertas e varreduras periódicas, desativação de conta com
  preservação de histórico, webhook do Mercado Pago, checkout fiel à regra do backend**); badge de
  Docker e a seção **🐳 Rodar com Docker**.
- **Organização da raiz:** 9 relatórios/status/auditorias históricos movidos com `git mv` para
  [`docs/reports/`](./docs/reports/) (com índice próprio), reduzindo a raiz de 18 para 9 `.md`.
  Links corrigidos em `README.en.md`, `docs/README.md`, `docs/HISTORIA.md` e dentro dos próprios
  arquivos movidos (`./` → `../../`). **Nenhum documento foi apagado** — só relocalizado.
- **Validação da stack Docker** (`docker compose up`): API `/api/status` 200, `/api/health`
  `{"status":"ok","database":"ok"}`, migrações + seed (35 itens) no boot, proxy `/api` do Nginx,
  fallback de SPA e **login admin real pela interface** levando ao `/dashboard` — tudo verde.
- Testes/build do app **inalterados** (mudou só Docker + docs), então `backend/dist` e
  `frontend/dist` permanecem válidos e a aplicação continua funcionando como antes.

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
