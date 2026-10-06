# Testes — Nexus Control App

## Backend (Jest + supertest)

Config: `backend/package.json` → script `test` faz build (`tsc`) e roda
Jest em `dist/tests` sequencialmente.

Rodar:

```bash
cd backend
NODE_ENV=test npm test          # todas as suítes
NODE_ENV=test npm run test:watch # watch mode
```

Suites:

| Arquivo | Escopo |
| :--- | :--- |
| `tests/api.test.js` | Testes funcionais de auth, itens, pedidos, usuarios |
| `tests/integration.test.js` | Fluxo completo: login → catálogo → checkout → consulta admin |
| `tests/security.test.js` | Rate limits, JWT inválido, RBAC, headers |
| `tests/businessRules.test.js` | Regras globais: liberação, excedentes, desativação, inatividade, webhook MP, RBAC novas rotas |

Ambiente: `NODE_ENV=test` relaxa rate limits (`max: 1000`) e aceita
`loginLimiter.skipSuccessfulRequests = true`.

Fixtures / helpers:

- `tests/helpers/testClient.js` — cria cliente HTTP com `supertest` apontando
  para o servidor real e utilitários (`register`, `login`, `me`).
- Contas de teste usam e-mails `rules-*@example.test` e são limpas no
  `afterAll` da suíte nova. Contas históricas `probe.*@test.local` podem
  permanecer no banco local (a regra §87 proíbe `DELETE FROM` em massa).

Password de teste: sempre 6 dígitos + 1 símbolo, ex. `123456#`, `654321#`.

## Frontend (Vitest + Testing Library)

Config: `frontend/vitest.config.ts` — ambiente `jsdom`, setup
`src/tests/setup.js` que registra `@testing-library/jest-dom` e stubs de
`matchMedia`/`IntersectionObserver`.

Rodar:

```bash
cd frontend
npm run test             # run once
npm run test:watch
npm run test:coverage    # usa @vitest/coverage-v8
```

Suites principais:

| Arquivo | Escopo |
| :--- | :--- |
| `components/dashboard/Dashboard.test.jsx` | Boas-vindas, cards por papel, quick actions admin/cliente, `alertService` |
| `components/dashboard/Profile.test.jsx` | Abas, desativação suave, modal de obrigações (409), centro de alertas, admin raiz protegido |
| `components/dashboard/Items.test.jsx` | Busca, paginação, modal de edição |
| `components/cart/Cart.test.jsx` | Adicionar/remover item, subtotal, persistência |
| `components/auth/Login.test.jsx` | Login, register, banner de recuperação |
| `components/ui/ThemeToggle.test.jsx` | Alternância dark/light |
| `components/ui/ErrorBoundary.test.jsx` | Captura de erros de render |
| `services/api.test.js` | Interceptor de refresh em 401, normalização de erros |

Padrões:

- `vi.mock('../../services/services', () => ({ ... }))` substitui a camada
  HTTP; cada suíte decide quais serviços e métodos usa.
- Componentes sob teste são renderizados dentro de `<BrowserRouter>` +
  `AuthProvider`/`ModalProvider`/`CartProvider` conforme necessidade.
- `screen.findByRole('dialog', { name: /…/i })` garante acessibilidade e
  foco no texto correto do modal.
- `waitFor` é o padrão para assertions assíncronas; evita `setTimeout`.

## E2E / roteamento

Scripts Node em `frontend/scripts/`:

- `test-navigation-e2e.js` — Puppeteer-core percorra o bundle e verifica
  a navegação entre telas. Requer Chrome/Chromium disponível.
- `verify-all-routes.js` — faz fetch de cada rota e confere 200/302.
- `convert-images.js` — utilitário de otimização de assets (não roda em CI).

Rodar:

```bash
cd frontend
npm run test:e2e         # requer browser
npm run test:routes      # só HTTP
```

## Lint e build

- `npm run lint` no frontend — ESLint 8, `--max-warnings 0`.
- `npm run build` — Vite; deve passar antes de commit.

## Checklist de regressão (§110)

Antes de um release:

1. `cd backend && NODE_ENV=test npm test` — todas as 4 suítes verdes.
2. `cd frontend && npm run test` — todas as 8 suítes verdes.
3. `cd frontend && npm run build` — Vite ✓.
4. `cd frontend && npm run lint` — **sem novos erros**; os 11 pré-existentes
   de `theme`/`toggleTheme`/`cartSubtotal`/`UserIcon`/`vi` ficam fora de escopo.
5. Testes manuais guiados: login, register, forgot password, checkout,
   admin confirmar pagamento, admin mudar retirada, desativar conta com
   409 de obrigações, re-registrar com senha antiga → recuperar histórico.
6. Conferir `git status` antes de commitar — sem `.env`, sem `node_modules`,
   sem artefatos indesejados.

## Troubleshooting

- `Cannot find module '@testing-library/jest-dom'` — rode `npm install` na
  raiz do frontend.
- `ECONNREFUSED 127.0.0.1:3306` nos testes de backend — MySQL não está
  rodando; suba a instância local ou aponte `DB_HOST` para um container.
- `No alertService export is defined on the mock` — o `vi.mock(...)` da
  suíte não incluiu `alertService`; reescreva o mock incluindo
  `getMyAlerts`/`getMyEvents`/`getUserEvents`.
- Rate limit 429 durante testes locais — confirme `NODE_ENV=test`.
