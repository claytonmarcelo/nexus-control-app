# Frontend — Nexus Control App

SPA React 18 + Vite 6 + Tailwind CSS 3 + React Router 7. Testes com Vitest +
Testing Library. HTTP com axios através de `services/api.js`.

## Bootstrap

`frontend/src/main.jsx` monta `<BrowserRouter><App /></BrowserRouter>`.
`App.jsx` define as rotas, wraps de `PrivateRoute`/`PublicRoute` e faz
`React.lazy()` para todas as telas principais (code-splitting).

## Rotas

| Caminho | Componente | Acesso |
| :--- | :--- | :--- |
| `/` | `WelcomePage` | Público (landing) |
| `/login` | `Login` (`LoginForm` + `RegisterForm`) | Público |
| `/register` | `Register` (wrapper do RegisterForm) | Público |
| `/recuperar-senha` | `ForgotPassword` | Público |
| `/dashboard` | `Dashboard` | Autenticado + permissão `dashboard` |
| `/itens` | `Items` | Autenticado + permissão `itens` |
| `/itens/:itemId/editar` | `ItemEditPage` | Autenticado + permissão `itens` |
| `/carrinho` | `Cart` | Autenticado + permissão `carrinho` |
| `/checkout` | `Checkout` | Autenticado + permissão `checkout` |
| `/usuarios` | `Users` | Somente admin + permissão `usuarios` |
| `/admin` | `AdminControlCenter` | Somente admin + permissão `admin` |
| `/perfil` | `Profile` | Autenticado + permissão `perfil` |
| `*` | `NotFound` | Público |

`PrivateRoute` checa `isAuthenticated` + `allowedRoles` + `requiredPermission`;
todos os redirecionam para `/dashboard` em caso de falha.

## Contextos

| Contexto | Provider | Responsabilidade |
| :--- | :--- | :--- |
| `AuthContext` | `AuthProvider` | Guarda `user`, `accessToken`, `refreshToken`; exibe `isAdmin/isFuncionario/isCliente`; expõe `login/register/logout/updateUser/refreshSession` |
| `CartContext` | `CartProvider` | Itens do carrinho, subtotal, `addItem/removeItem/clearCart` |
| `ModalContext` | `ModalProvider` | Diálogos profissionais (`confirm`, `alert`, `toast`) sem `alert()` nativo |
| `ThemeContext` | `ThemeProvider` | Alterna `dark`/`light`; persiste em `localStorage` |

## Serviços HTTP (`services/`)

- `api.js` — axios com `baseURL`, `withCredentials`, interceptors de
  Bearer token, refresh automático em 401 e normalização de erros.
- `services.js` — agregadores por domínio:
  - `authService` (`login`, `register`, `me`, `refresh`, `logout`, `forgotPassword`, `resetPassword`)
  - `userService` (`getAll`, `getById`, `create`, `update`, `changePassword`, `deleteOwnAccount`, `getPermissions`, `updatePermissions`)
  - `itemService` (`getAll`, `getById`, `create`, `update`, `remove`, `negotiate`, `getMyNegotiations`)
  - `checkoutService` (`checkout`, `getMyOrders`, `getAllOrders`, `updateOrder`, `deleteOrder`)
  - `alertService` (`getMyAlerts`, `getMyEvents`, `getUserEvents`) — novo nas regras de negócio
  - `rentalService` (`getForClient`, `getForOperation`, `updatePickup`, `createRegularization`) — novo nas regras de negócio
  - `healthService` (`check`)
- `adminService.js` — helpers do painel (`getPages`, `getPermissions`, `seedCatalog`, `getStats`).

## Componentes

### `components/auth/`

- `Login.jsx` — contém `LoginForm` + `RegisterForm`. Registro passou a
  solicitar `senha_conta_desativada` quando o backend sinaliza
  `verificacao_conta_desativada` e exibe banner de recuperação
  (`recuperou_historico`).
- `Register.jsx` — wrapper que renderiza `RegisterForm` isolado.
- `ForgotPassword.jsx` — solicitação e redefinição com token.

### `components/dashboard/`

- `Dashboard.jsx` — hero por papel, cards de métricas, `AlertsBanner`
  (novo), `OrdersSummaryWidget`, `RecentItems`.
- `DashboardCanvas.jsx` — visual alternativo com gráficos.
- `Items.jsx` — catálogo paginado, filtros combinados, busca, `ItemEditPage`.
- `ItemFormModal.jsx` — criar/editar item.
- `Users.jsx` — gestão de usuários (admin).
- `UserFormModal.jsx` — criar/editar usuário.
- `PermissionFormModal.jsx` — matiz de permissões por página.
- `UserHistoryModal.jsx` — timeline de um usuário.
- `OrdersSummaryWidget.jsx` — mini resumo de pedidos.
- `RecentItems.jsx` — últimos itens criados.
- `Profile.jsx` — abas **Perfil**, **Segurança**, **Histórico**, **Alertas**.
  Inclui `PendingObligationsModal` para o caso 409 da desativação e seção
  de "Desativar conta" com `ModalContext.confirm()`.

### `components/admin/`

- `AdminControlCenter.jsx` — seis abas: Visão geral, Pedidos, Itens,
  Usuários, Acessos, **Aluguéis** (novo). Inclui filtros por status de
  pedido/situação de conta/status de aluguel/status de retirada,
  `UserEventsPanel` com timeline, `RentalRow`, `RetiradaPill`, `ControlIcon`.
  Todas as ações críticas passam por `ModalContext.confirm()`.

### `components/cart/`

- `Cart.jsx` — lista do carrinho, edição de quantidade, `removeItem`.
- `Checkout.jsx` — escolhe método (`pix` | `cartao`), dispara
  `checkoutService.checkout`, renderiza QR/payload Pix, `OrderStepper`,
  banner "processando pagamento" quando MP está ativo.
- `ReceiptPrintable.jsx` — comprovante imprimível.

### `components/layout/`

- `Layout.jsx` — sidebar com links condicionais por papel, header com
  `ThemeToggle` e badge de carrinho.

### `components/ui/`

- `Spinner`, `StatCard`, `EmptyState`, `NexusLogo`, `ThemeToggle`,
  `OrderStepper`, `ErrorBoundary`, `LoadingScreen`, `NotFound`.

### `components/welcome/`

- `WelcomePage.jsx` — landing pública com hero + CTA.

## Utilitários (`utils/`)

- `access.js` — `ROOT_ADMIN_EMAIL`, helpers de comparação de papel,
  `canRenderPage(user, key)`.
- `date.js` — `formatDate`, `formatCurrencyPtBr`, `daysBetween`.
- `password.js` — valida a regra "5–6 dígitos + 1 símbolo (6 ou 7 caracteres)".

## Testes

- `frontend/src/**/*.test.jsx` com Vitest + Testing Library.
- `tests/setup.js` registra `@testing-library/jest-dom` e configura
  `window.matchMedia` e `IntersectionObserver` stubs.

Rodar: `npm run test` / `npm run test:watch` / `npm run test:coverage`.

## E2E e roteamento

- `scripts/test-navigation-e2e.js` — navegação completa com puppeteer-core.
- `scripts/verify-all-routes.js` — percorre todas as rotas e confere o
  status HTTP do bundle.

## Diretrizes visuais

- Tema escuro "Navy" (`nexus-*`) é o padrão; tema claro via `ThemeContext`.
- Superfícies reutilizam as classes `.glass`, `.card`, `.neumorphic`,
  `.gradient-border`.
- Botões seguem `.btn`, `.btn-primary`, `.btn-secondary`,
  `.btn-ghost`, `.btn-danger`, `.btn-warning` com estados
  `disabled` e `focus:ring`.
- Formulários usam `.input` e `.label` consistentes; erros aparecem em
  `<p role="alert">` com `.text-red-400`.
