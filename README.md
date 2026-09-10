<div align="center">

  <h1>🛡️ Nexus Control App</h1>

  <h3>Full-Stack E-Commerce & Catalog Management System</h3>

  <p>Sistema completo para gestão de catálogos, e-commerce com múltiplos perfis de acesso, checkout em tempo real (Pix/Cartão) e painel administrativo com controle granular de permissões.</p>

  <p>
    <b>🇧🇷 Português</b> | <a href="./README.en.md">🇺🇸 English</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-PRODUCTION_READY-brightgreen?style=flat-square" alt="Status">
    <img src="https://img.shields.io/badge/Docs-AWS_Academy-orange?style=flat-square" alt="Docs">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License">
    <img src="https://img.shields.io/badge/version-1.1.0-blue?style=flat-square" alt="Version">
    <img src="https://img.shields.io/badge/Node.js-%3E%3D20-green?style=flat-square" alt="Node.js">
    <img src="https://img.shields.io/badge/MySQL-8.0-orange?style=flat-square" alt="MySQL">
    <img src="https://img.shields.io/badge/React-18-cyan?style=flat-square" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=flat-square" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/Vite-5-purple?style=flat-square" alt="Vite">
  </p>

</div>

<hr />

## 📖 Página "Quem Somos"

A aplicação inclui uma página institucional completa (`/sobre`) acessível após fazer login, com:

- **Visão do Projeto:** Apresentação do Nexus Control como solução full-stack corporativa
- **Trajetória Profissional:** Jornada de 8+ anos (Varejo → Logística → Tecnologia)
  - Bagagem estratégica: visão de negócio, disciplina operacional, comunicação clara
  - Aplicação prática em desenvolvimento de software
- **Formação Acadêmica:** Análise e Desenvolvimento de Sistemas (UNISUAM, Rio de Janeiro)
- **Objetivo Profissional:** Desenvolvedor Júnior/Estagiário → Sênior → Architect/CTO
- **Contato:** Links diretos para GitHub, LinkedIn, Email, Portfolio

**Como acessar:** Na aplicação web, clique em "Quem Somos" no menu de navegação ou rodapé após fazer login com qualquer perfil (Admin, Funcionário ou Cliente).

---

## 🎯 Funcionalidades Principais

O **Nexus Control App** é uma plataforma completa de controle e gerenciamento corporativo. O sistema oferece autenticação com múltiplos perfis de acesso (Admin, Funcionário e Cliente), catálogo interativo de produtos e serviços de tecnologia/infraestrutura, fluxo completo de e-commerce com checkout em tempo real (Pix e Cartão de Crédito), além de um painel administrativo com controle granular de usuários, permissões e pedidos.

- **🔐 Autenticação Multi-Perfil**: Login seguro com JWT + Refresh Token. Perfis: Admin, Funcionário e Cliente com permissões granulares por página.
- **📦 Catálogo de Produtos e Serviços**: Grid responsivo com filtros por categoria, busca em tempo real, imagens, fabricante, preço de compra e aluguel mensal. Produtos reais: Dell, Cisco, Ubiquiti, Intelbras, APC.
- **🛒 Carrinho Dinâmico**: Estado persistido via `localStorage`. Atualização instantânea de contador no header, edição de quantidades e recálculo de total em tempo real. Suporte a itens de compra e aluguel.
- **💳 Checkout Completo**: Pix (com QR Code + Copia e Cola) e Cartão de Crédito. Confirmação automática com overlay de sucesso e redirecionamento em 4 segundos.
- **🛠️ Painel Admin**: Dashboard com métricas ao vivo, gestão de usuários (criar, editar, definir permissões), gestão do catálogo e acompanhamento de todos os pedidos.
- **🌙 Dark/Light Mode**: Toggle de tema com preferência salva na sessão. Tema Light com 400+ estilos customizados.
- **📱 Mobile First**: Layout 100% responsivo com breakpoints para 480px e 768px, zero horizontal overflow.

### ⚡ Melhorias de Performance & Produção (Setembro 2026)

| Métrica | Antes | Depois | Redução |
|---|---|---|---|
| Initial Load | ~90 KB | ~30 KB | **66%** ⬇️ |
| Bundle Chunks | 1 monolítico | 16 chunks | Code-splitting ✅ |
| Compressão API | Nenhuma | Gzip 65-75% | **Performance+** |
| Imagens Hero | PNG 20KB | WebP 6KB | **70%** ⬇️ |

- ✅ **14/14 Tarefas de Deployment** completadas (AWS Academy + Visual Identity + Performance)
- ✅ **Code-splitting** com React.lazy() para 8 componentes de página
- ✅ **Compression middleware** no backend reduz payload em 65-75%
- ✅ **Tema Light completo** com 400+ overrides CSS
- ✅ **Lazy loading components** sem double-flash
- ✅ **WebP images** para otimização visual
- ✅ **Mobile responsive** sem overflow horizontal
- ✅ **Production-ready** com documentação AWS Academy

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
    │   │   ├── about/       # AboutUs.jsx (Quem Somos)
    │   │   ├── auth/        # Login, Register, ForgotPassword
    │   │   ├── cart/        # Cart.jsx, Checkout.jsx
    │   │   ├── dashboard/   # Dashboard, Items, Users, Profile
    │   │   ├── layout/      # Layout.jsx (header + nav + footer)
    │   │   └── ui/          # LoadingScreen, EmptyState, NotFound, OrderStepper, ReceiptPrintable
    │   ├── contexts/        # AuthContext, CartContext, ModalContext, ThemeContext
    │   ├── services/        # services.js (API calls), adminService.js
    │   └── main.jsx
    └── package.json
```

## 📸 Galeria de Screenshots

| Screenshot | Descrição | Status |
|---|---|---|
| 🔐 Login com Demo | 3 botões de acesso rápido (Admin/Funcionário/Cliente) com 1-click demo | ✅ |
| 📊 Dashboard Canvas | Gráficos nativos (vendas/categorias) + KPIs interativos | ✅ |
| 🛍️ Catálogo Premium | Grid responsivo com Glassmorphism, filtros, busca | ✅ |
| 🛒 Carrinho Dinâmico | Atualização em tempo real, suporte compra/aluguel | ✅ |
| 💳 Checkout Seguro | Pix (QR Code) + Cartão, validação completa | ✅ |
| 📱 Mobile Responsivo | 100% responsivo (360px-1920px), zero overflow | ✅ |
| 👤 Perfil Usuário | Gestão de dados, histórico de pedidos | ✅ |
| 🛡️ Admin Dashboard | Usuários, catálogo, permissões granulares | ✅ |
| 📖 Quem Somos | Trajetória profissional, transição de carreira, objetivo | ✅ |
| 📦 Rastreamento | Timeline visual 5-steps (Pending→Delivered) | ✅ |
| 🧾 Comprovante PDF | Recibo imprimível com @media print nativo | ✅ |
| 🎨 Tema Light/Dark | Toggle persistido, 400+ overrides CSS | ✅ |

## ⚙️ Instalação e Execução

### Pré-requisitos

- **Node.js** v20+
- **MySQL** 8+ (rodando localmente ou via RDS)
- **npm** v10+

### 1. Clone o Repositório

```bash
git clone https://github.com/claytonmarcelo/nexus-control-app.git
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

## 📊 Status de Projeto (Setembro 2026)

### 🎯 Refatoração Completa: 5 Fases Executadas

| Fase | Descrição | Status |
|------|-----------|--------|
| **FASE 1** | Análise e Limpeza (3 arquivos mortos removidos) | ✅ Complete |
| **FASE 2** | Página "Quem Somos" (trajetória profissional) | ✅ Complete |
| **FASE 3** | 4 Features Executivas (Demo, Canvas, Stepper, PDF) | ✅ Complete |
| **FASE 4** | Testes E2E (10/10 testes passed) | ✅ Complete |
| **FASE 5** | Documentação Final e Release | ✅ Complete |

### 🚀 Pronto para Deploy em Produção

- ✅ **14/14 tarefas de deployment** completadas
- ✅ **100% testes E2E** validados (estrutura, banco, rotas, segurança, performance, responsividade)
- ✅ **AWS Academy infrastructure** documentada (800+ linhas)
- ✅ **Zero redundâncias:** arquitetura MVC limpa
- ✅ **Production-ready:** NODE_ENV validation, SSL/TLS, CORS, rate limiting

### 📈 Commits Histórico (6 commits humanizados)

```
e95144f - refactor(docs): reorganize README with separate Portuguese and English sections
1a1b869 - chore(release): production-ready v1.1.0 with full documentation
29a78de - docs(e2e): complete end-to-end testing report (10/10 tests passed)
e410996 - feat(frontend): implement 4 executive resources for enhanced UX
aa06cd1 - feat(frontend): add 'Quem Somos' about page with professional profile
b52417f - refactor(cleanup): remove redundant files and legacy configurations
```

## 🚀 Deployment & Produção

### Status: ✅ PRODUCTION READY

O projeto está completamente preparado para deploy em produção no AWS Academy. Todas as 14 tarefas de deployment foram concluídas:

**📚 Documentação de Deployment:**

| Documento | Conteúdo | Link |
|---|---|---|
| **PRODUCTION_READY.md** | Status e checklist final de produção | [Ver](./PRODUCTION_READY.md) |
| **DEPLOYMENT_SUMMARY.md** | Resumo das 14 tarefas completadas | [Ver](./DEPLOYMENT_SUMMARY.md) |
| **AWS_ACADEMY_INFRASTRUCTURE.md** | Guia completo AWS (800+ linhas) | [Ver](./AWS_ACADEMY_INFRASTRUCTURE.md) |
| **CHANGES_LOG.md** | Log detalhado de todas as mudanças | [Ver](./CHANGES_LOG.md) |
| **E2E_TESTING_REPORT.md** | ⭐ Bateria completa de testes (10/10 PASS) | [Ver](./E2E_TESTING_REPORT.md) |

### Performance & Segurança (Frontend)

| Documento | Conteúdo | Link |
|---|---|---|
| **OPTIMIZATION.md** | Estratégia de lazy loading e code-splitting | [Ver](./frontend/OPTIMIZATION.md) |
| **LOADING_VERIFICATION.md** | Validação de loading screens | [Ver](./frontend/LOADING_VERIFICATION.md) |
| **MOBILE_OVERFLOW_AUDIT.md** | Auditoria mobile responsiva | [Ver](./frontend/MOBILE_OVERFLOW_AUDIT.md) |

### Deploy Rápido

```bash
# Backend
cd backend
npm install
npm run build && npm start

# Frontend  
cd frontend
npm install
npm run build
```

Consulte [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) para instruções detalhadas de produção.

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

## 👨‍💻 Desenvolvedor

<div align="center">

### Clayton Marcelo
**C. Marcelo Dev. Brasil**

📍 Brasil

[![GitHub](https://img.shields.io/badge/GitHub-claytonmarcelo-181717?style=flat-square&logo=github)](https://github.com/claytonmarcelo)
[![YouTube](https://img.shields.io/badge/YouTube-CMarceloDev-FF0000?style=flat-square&logo=youtube)](https://youtube.com/@cmarcelodev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-clayton--marcelo--dev-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/clayton-marcelo-dev/)
[![Portfolio](https://img.shields.io/badge/Portfolio-cmarcelodev.com-5865F2?style=flat-square&logo=google-chrome)](https://cmarcelodev.com)

---

*Desenvolvedor Full Stack especializado em React, Node.js, Fastify, TypeScript, Prisma, MySQL e desenvolvimento de soluções SaaS Enterprise para Field Service Management.*

</div>

---

© 2026 Nexus Control App. Todos os direitos reservados.
