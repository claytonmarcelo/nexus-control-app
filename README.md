# 🛡️ Nexus Control App

Sistema full-stack corporativo com tema Gourmet Premium para gestão de catálogos, e-commerce e painel administrativo, desenvolvido com Node.js, Express, MySQL e React.

---

## 📋 Visão Geral

O **Nexus Control App** é uma plataforma completa de controle e gerenciamento corporativo. O sistema oferece autenticação com múltiplos perfis de acesso (Admin, Funcionário e Cliente), catálogo interativo de produtos e serviços de tecnologia/infraestrutura, fluxo completo de e-commerce com checkout em tempo real (Pix e Cartão de Crédito), além de um painel administrativo com controle granular de usuários, permissões e pedidos.

### 🎯 Funcionalidades Principais

- **🔐 Autenticação Multi-Perfil**: Login seguro com JWT + Refresh Token. Perfis: Admin, Funcionário e Cliente com permissões granulares por página.
- **📦 Catálogo de Produtos e Serviços**: Grid responsivo com filtros por categoria, busca em tempo real, imagens, fabricante, preço de compra e aluguel mensal. Produtos reais: Dell, Cisco, Ubiquiti, Intelbras, APC.
- **🛒 Carrinho Dinâmico**: Estado persistido via `localStorage`. Atualização instantânea de contador no header, edição de quantidades e recálculo de total em tempo real. Suporte a itens de compra e aluguel.
- **💳 Checkout Completo**: Pix (com QR Code + Copia e Cola) e Cartão de Crédito. Confirmação automática com overlay de sucesso e redirecionamento em 4 segundos.
- **🛠️ Painel Admin**: Dashboard com métricas ao vivo, gestão de usuários (criar, editar, definir permissões), gestão do catálogo e acompanhamento de todos os pedidos.
- **🌙 Dark/Light Mode**: Toggle de tema com preferência salva na sessão.
- **📱 Mobile First**: Layout 100% responsivo com breakpoints para 480px e 768px, zero horizontal overflow.

---

## 🏗️ Arquitetura & Tecnologias

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18 | SPA com Hooks e Context API |
| React Router | 6 | Roteamento client-side |
| Tailwind CSS | 3 | Design System e utilitários |
| CSS Custom (Glassmorphism + Neumorphism) | — | Efeitos visuais premium |
| Vite | 5 | Build tool e dev server |
| Axios | 1.x | Chamadas à API REST |
| Google Fonts (Inter) | — | Tipografia |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 4 | Framework HTTP |
| TypeScript | 5 | Type safety |
| MySQL2 | 3 | Driver do banco de dados |
| JWT (jsonwebtoken) | 9 | Autenticação stateless |
| bcryptjs | 2 | Hash de senhas |
| express-validator | 7 | Validação de entradas |
| Helmet | 7 | Segurança de headers HTTP |
| Morgan | 1 | Logging de requisições |
| Express Rate Limit | 8 | Proteção contra DDoS |

### Banco de Dados
- **MySQL 8+** com tabelas: `usuarios`, `itens`, `pedidos`, `negociacoes`, `usuario_permissoes`, `password_resets`

---

## 📂 Estrutura do Projeto

```
nexus-control-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Banco de dados, acesso
│   │   ├── controllers/     # authController, itemController, orderController, userController, adminController
│   │   ├── middleware/      # auth, validation, orderValidation
│   │   ├── models/          # User.js, Item.js, Order.js, Negotiation.js
│   │   ├── routes/          # auth.ts, items.ts, orders.ts, users.ts, admin.ts
│   │   ├── utils/           # migrate.js, seed.ts, response.js
│   │   └── server.ts        # Entry point Express
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/       # AdminControlCenter.jsx
    │   │   ├── auth/        # Login, Register, ForgotPassword
    │   │   ├── cart/        # Cart.jsx, Checkout.jsx
    │   │   ├── dashboard/   # Dashboard, Items, Users, Profile
    │   │   ├── layout/      # Layout.jsx (header + nav + footer)
    │   │   └── ui/          # LoadingScreen, EmptyState, NotFound
    │   ├── contexts/        # AuthContext, CartContext, ModalContext, ThemeContext
    │   ├── services/        # services.js (API calls), adminService.js
    │   └── main.jsx
    └── package.json
```

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- **Node.js** v20+
- **MySQL** 8+ (rodando localmente ou via RDS)
- **npm** v10+

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/nexus-control-app.git
cd nexus-control-app
```

### 2. Configurar o Backend

```bash
cd backend
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
# Banco de Dados
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=nexusdb

# JWT
JWT_SECRET=sua_chave_secreta_longa
JWT_REFRESH_SECRET=sua_chave_refresh_secreta
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Admin padrão
ROOT_ADMIN_EMAIL=admin@seudominio.com
ROOT_ADMIN_NAME=Administrador
ROOT_ADMIN_PASSWORD=SuaSenhaSegura123!
```

Instale as dependências e prepare o banco:

```bash
npm install
npm run db:migrate   # Cria as tabelas
npm run db:seed      # Insere dados iniciais
npm run dev          # Inicia em http://localhost:3000
```

### 3. Configurar o Frontend

```bash
cd ../frontend
npm install
npm run dev          # Inicia em http://localhost:5173
```

### 4. Acessar o Sistema

| URL | Descrição |
|---|---|
| `http://localhost:5173` | Aplicação Web |
| `http://localhost:3000/api/status` | Health check da API |

### Credenciais de Teste (após seed)

| Perfil | Email | Senha |
|---|---|---|
| Admin | `marcelo10@gmail.com` | (configurado no .env) |
| Funcionário | `funcionario@nexuscontrol.com` | `func123` |
| Cliente | `cliente@nexuscontrol.com` | `cliente123` |

---

## 🚀 Deploy em Produção

```bash
# Backend
cd backend
npm run build   # Compila TypeScript para /dist
npm start       # Inicia o servidor compilado

# Frontend
cd frontend
npm run build   # Gera os arquivos estáticos em /dist
```

Configure as variáveis de ambiente `NODE_ENV=production` e `FRONTEND_URL=https://seudominio.com` no servidor.

---

## 📄 API Endpoints

| Método | Rota | Descrição | Requer Login? | Status |
|---|---|---|---|---|
| POST | `/api/auth/register` | Cadastro de novo usuário | Não (Pública) | 🟢 100% Ativo |
| POST | `/api/auth/login` | Login e geração de tokens JWT | Não (Pública) | 🟢 100% Ativo |
| POST | `/api/auth/refresh` | Renovação de access token | Não (Pública) | 🟢 100% Ativo |
| GET | `/api/itens` | Listagem do catálogo de produtos | Sim (JWT) | 🟢 100% Ativo |
| POST | `/api/itens` | Criar novo item no catálogo | Sim (Admin/Func) | 🟢 100% Ativo |
| POST | `/api/pedidos/checkout` | Finalizar compra ou aluguel | Sim (Cliente) | 🟢 100% Ativo |
| GET | `/api/pedidos/me` | Pedidos do usuário logado | Sim (JWT) | 🟢 100% Ativo |
| GET | `/api/admin/overview` | Métricas gerais do sistema | Sim (Admin) | 🟢 100% Ativo |
| GET | `/api/usuarios` | Listagem e gestão de usuários | Sim (Admin) | 🟢 100% Ativo |

---

## 👨‍💻 Desenvolvedor

**Clayton Marcelo** — [github.com/claytonmarcelo](https://github.com/claytonmarcelo)

---

© 2025 Nexus Control App. Todos os direitos reservados.
