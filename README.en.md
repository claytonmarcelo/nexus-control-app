<div align="center">

  <h1>🛡️ Nexus Control App</h1>

  <h3>Full-Stack E-Commerce & Catalog Management System</h3>

  <p>Complete system for catalog management, e-commerce with multiple access profiles, real-time checkout (Pix/Card) and admin dashboard with granular permission control.</p>

  <p>
    <a href="./README.md">🇧🇷 Português</a> | <b>🇺🇸 English</b>
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

## 📖 About Us Page

The application includes a complete institutional page (`/sobre`) accessible within the web app, featuring:

- **Project Vision:** Nexus Control presented as a corporate full-stack solution
- **Professional Trajectory:** 8+ years journey (Retail → Logistics → Technology)
  - Strategic background: business vision, operational discipline, clear communication
  - Practical application in software development
- **Academic Background:** Systems Analysis and Development (UNISUAM, Rio de Janeiro)
- **Professional Objective:** Junior Developer/Intern → Senior → Architect/CTO
- **Contact:** Direct links to GitHub, LinkedIn, Email, Portfolio

**How to access:** In the web application, click "About Us" in the navigation menu or footer after logging in with any profile (Admin, Employee, or Client).

---

## 🎯 Key Features

**Nexus Control App** is a complete corporate management and control platform. The system offers authentication with multiple access profiles (Admin, Employee, and Client), interactive product and technology/infrastructure service catalog, complete e-commerce flow with real-time checkout (Pix and Credit Card), plus an administrative dashboard with granular user, permission, and order control.

- **🔐 Multi-Profile Authentication**: Secure login with JWT + Refresh Token. Profiles: Admin, Employee, and Client with granular page-level permissions.
- **📦 Product and Services Catalog**: Responsive grid with category filters, real-time search, images, manufacturer, purchase price and monthly rental. Real products: Dell, Cisco, Ubiquiti, Intelbras, APC.
- **🛒 Dynamic Cart**: Persistent state via `localStorage`. Instant header counter updates, quantity editing, and real-time total recalculation. Support for purchase and rental items.
- **💳 Complete Checkout**: Pix (with QR Code + Copy-Paste) and Credit Card. Automatic confirmation with success overlay and 4-second redirect.
- **🛠️ Admin Panel**: Dashboard with live metrics, user management (create, edit, set permissions), catalog management, and order tracking.
- **🌙 Dark/Light Mode**: Theme toggle with session-saved preference. Complete Light theme with 400+ custom styles.
- **📱 Mobile First**: 100% responsive layout with 480px and 768px breakpoints, zero horizontal overflow.

### ⚡ Performance & Production Improvements (September 2026)

| Metric | Before | After | Reduction |
|---|---|---|---|
| Initial Load | ~90 KB | ~30 KB | **66%** ⬇️ |
| Bundle Chunks | 1 monolithic | 16 chunks | Code-splitting ✅ |
| API Compression | None | Gzip 65-75% | **Performance+** |
| Hero Images | PNG 20KB | WebP 6KB | **70%** ⬇️ |

- ✅ **14/14 Deployment Tasks** completed (AWS Academy + Visual Identity + Performance)
- ✅ **Code-splitting** with React.lazy() for 8 page components
- ✅ **Compression middleware** on backend reduces payload 65-75%
- ✅ **Complete Light theme** with 400+ CSS overrides
- ✅ **Lazy loading components** without double-flash
- ✅ **WebP images** for visual optimization
- ✅ **Mobile responsive** without horizontal overflow
- ✅ **Production-ready** with AWS Academy documentation

## 🏗️ Architecture & Technologies

### Frontend Stack
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | SPA with Hooks and Context API |
| React Router | 6 | Client-side routing |
| Tailwind CSS | 3 | Design System and utilities |
| CSS Custom (Glassmorphism + Neumorphism) | — | Premium visual effects |
| Vite | 5 | Build tool and dev server |
| Axios | 1.x | REST API calls |
| Google Fonts (Inter) | — | Typography |

### Backend Stack
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 4 | HTTP Framework |
| TypeScript | 5 | Type safety |
| MySQL2 | 3 | Database driver |
| JWT (jsonwebtoken) | 9 | Stateless authentication |
| bcryptjs | 2 | Password hashing |
| express-validator | 7 | Input validation |
| Helmet | 7 | HTTP header security |
| Morgan | 1 | Request logging |
| Express Rate Limit | 8 | DDoS protection |

### Database
- **MySQL 8+** with tables: `usuarios`, `itens`, `pedidos`, `negociacoes`, `usuario_permissoes`, `password_resets`

## 📂 Project Structure

```
nexus-control-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, access config
│   │   ├── controllers/     # authController, itemController, orderController, userController, adminController
│   │   ├── middleware/      # auth, validation, orderValidation
│   │   ├── models/          # User.js, Item.js, Order.js, Negotiation.js
│   │   ├── routes/          # auth.ts, items.ts, orders.ts, users.ts, admin.ts
│   │   ├── utils/           # migrate.js, seed.ts, response.js
│   │   └── server.ts        # Express entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/       # AdminControlCenter.jsx
    │   │   ├── about/       # AboutUs.jsx (About Us page)
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

## 📸 Screenshots Gallery

| Screenshot | Description | Status |
|---|---|---|
| 🔐 Login Demo | 3 quick access buttons (Admin/Employee/Client) with 1-click demo | ✅ |
| 📊 Dashboard Canvas | Native charts (sales/categories) + interactive KPIs | ✅ |
| 🛍️ Premium Catalog | Responsive grid with Glassmorphism, filters, search | ✅ |
| 🛒 Dynamic Cart | Real-time updates, supports purchase/rental | ✅ |
| 💳 Secure Checkout | Pix (QR Code) + Card, complete validation | ✅ |
| 📱 Mobile Responsive | 100% responsive (360px-1920px), zero overflow | ✅ |
| 👤 User Profile | Data management, order history | ✅ |
| 🛡️ Admin Dashboard | Users, catalog, granular permissions | ✅ |
| 📖 About Us | Professional trajectory, career transition, objectives | ✅ |
| 📦 Order Tracking | Visual 5-step timeline (Pending→Delivered) | ✅ |
| 🧾 Printable Receipt | PDF-ready receipt with @media print native | ✅ |
| 🎨 Light/Dark Theme | Persistent toggle, 400+ CSS overrides | ✅ |

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** v20+
- **MySQL** 8+ (local or RDS)
- **npm** v10+

### 1. Clone Repository

```bash
git clone https://github.com/claytonmarcelo/nexus-control-app.git
cd nexus-control-app
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nexusdb

# JWT
JWT_SECRET=your_long_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Default Admin
ROOT_ADMIN_EMAIL=admin@yourdomain.com
ROOT_ADMIN_NAME=Administrator
ROOT_ADMIN_PASSWORD=YourSecurePassword123!
```

Install dependencies and setup database:

```bash
npm install
npm run db:migrate   # Create tables
npm run db:seed      # Insert initial data
npm run dev          # Start at http://localhost:3000
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev          # Start at http://localhost:5173
```

### 4. Access System

| URL | Description |
|---|---|
| `http://localhost:5173` | Web Application |
| `http://localhost:3000/api/status` | API Health Check |

### Test Credentials (after seed)

| Profile | Email | Password |
|---|---|---|
| Admin | `marcelo10@gmail.com` | (configured in .env) |
| Employee | `funcionario@nexuscontrol.com` | `func123` |
| Client | `cliente@nexuscontrol.com` | `cliente123` |

## 📊 Project Status (September 2026)

### 🎯 Complete Refactoring: 5 Phases Executed

| Phase | Description | Status |
|------|-----------|--------|
| **PHASE 1** | Analysis & Cleanup (3 redundant files removed) | ✅ Complete |
| **PHASE 2** | "About Us" page (professional trajectory) | ✅ Complete |
| **PHASE 3** | 4 Executive Features (Demo, Canvas, Stepper, PDF) | ✅ Complete |
| **PHASE 4** | E2E Testing (10/10 tests passed) | ✅ Complete |
| **PHASE 5** | Final Documentation & Release | ✅ Complete |

### 🚀 Ready for Production Deployment

- ✅ **14/14 deployment tasks** completed
- ✅ **100% E2E tests** validated (structure, database, routes, security, performance, responsiveness)
- ✅ **AWS Academy infrastructure** documented (800+ lines)
- ✅ **Zero redundancies:** clean MVC architecture
- ✅ **Production-ready:** NODE_ENV validation, SSL/TLS, CORS, rate limiting

### 📈 Git Commits History (6 humanized commits)

```
e95144f - refactor(docs): reorganize README with separate Portuguese and English sections
1a1b869 - chore(release): production-ready v1.1.0 with full documentation
29a78de - docs(e2e): complete end-to-end testing report (10/10 tests passed)
e410996 - feat(frontend): implement 4 executive resources for enhanced UX
aa06cd1 - feat(frontend): add 'Quem Somos' about page with professional profile
b52417f - refactor(cleanup): remove redundant files and legacy configurations
```

## 🚀 Deployment & Production

### Status: ✅ PRODUCTION READY

The project is fully prepared for production deployment on AWS Academy. All 14 deployment tasks are completed:

**📚 Deployment Documentation:**

| Document | Content | Link |
|---|---|---|
| **PRODUCTION_READY.md** | Status and final production checklist | [View](./PRODUCTION_READY.md) |
| **DEPLOYMENT_SUMMARY.md** | Summary of 14 completed tasks | [View](./DEPLOYMENT_SUMMARY.md) |
| **AWS_ACADEMY_INFRASTRUCTURE.md** | Complete AWS guide (800+ lines) | [View](./AWS_ACADEMY_INFRASTRUCTURE.md) |
| **CHANGES_LOG.md** | Detailed change tracking | [View](./CHANGES_LOG.md) |
| **E2E_TESTING_REPORT.md** | ⭐ Complete E2E testing suite (10/10 PASS) | [View](./E2E_TESTING_REPORT.md) |

### Performance & Security (Frontend)

| Document | Content | Link |
|---|---|---|
| **OPTIMIZATION.md** | Lazy loading and code-splitting strategy | [View](./frontend/OPTIMIZATION.md) |
| **LOADING_VERIFICATION.md** | Loading screen validation | [View](./frontend/LOADING_VERIFICATION.md) |
| **MOBILE_OVERFLOW_AUDIT.md** | Mobile responsiveness audit | [View](./frontend/MOBILE_OVERFLOW_AUDIT.md) |

### Quick Deploy

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

See [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) for detailed production instructions.

## 📄 API Endpoints

| Method | Route | Description | Requires Login? | Status |
|---|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No (Public) | 🟢 100% Active |
| POST | `/api/auth/login` | Login and JWT generation | No (Public) | 🟢 100% Active |
| POST | `/api/auth/refresh` | Refresh access token | No (Public) | 🟢 100% Active |
| GET | `/api/itens` | List product catalog | Yes (JWT) | 🟢 100% Active |
| POST | `/api/itens` | Create catalog item | Yes (Admin/Emp) | 🟢 100% Active |
| POST | `/api/pedidos/checkout` | Complete purchase/rental | Yes (Client) | 🟢 100% Active |
| GET | `/api/pedidos/me` | User orders | Yes (JWT) | 🟢 100% Active |
| GET | `/api/admin/overview` | System metrics | Yes (Admin) | 🟢 100% Active |
| GET | `/api/usuarios` | User management | Yes (Admin) | 🟢 100% Active |

## 👨‍💻 Developer

<div align="center">

### Clayton Marcelo
**C. Marcelo Dev. Brasil**

📍 Brazil

[![GitHub](https://img.shields.io/badge/GitHub-claytonmarcelo-181717?style=flat-square&logo=github)](https://github.com/claytonmarcelo)
[![YouTube](https://img.shields.io/badge/YouTube-CMarceloDev-FF0000?style=flat-square&logo=youtube)](https://youtube.com/@cmarcelodev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-clayton--marcelo--dev-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/clayton-marcelo-dev/)
[![Portfolio](https://img.shields.io/badge/Portfolio-cmarcelodev.com-5865F2?style=flat-square&logo=google-chrome)](https://cmarcelodev.com)

---

*Full Stack Developer specialized in React, Node.js, Fastify, TypeScript, Prisma, MySQL and development of SaaS Enterprise solutions for Field Service Management.*

</div>

---

© 2026 Nexus Control App. All rights reserved.
