# Guia de Setup - Nexus Control App

## 🚀 Instalação e Configuração

### 1. Pré-requisitos

- **Node.js** >= 18.x
- **npm** ou **yarn**
- **MySQL** >= 8.0
- **.env** configurado (copie `.env.example`)

### 2. Variáveis de Ambiente

#### Backend (`.env`)

```env
# Servidor
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASS=seu_senha
DB_NAME=nexus_control
DB_SSL=false

# JWT
JWT_SECRET=sua_chave_super_secreta_aqui
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Email (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app_google

# Admin Root
ROOT_ADMIN_EMAIL=admin@nexuscontrol.com
ROOT_ADMIN_PASSWORD=26481#
ROOT_ADMIN_NAME=Administrador
```

#### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Setup do Banco de Dados

```bash
# Backend - Executar migrações
cd backend
npm run migrate

# Backend - Seedar dados iniciais
npm run seed
```

### 4. Instalar Dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 5. Iniciar Aplicação

```bash
# Terminal 1 - Backend (porta 3000)
cd backend
npm run dev

# Terminal 2 - Frontend (porta 5173)
cd frontend
npm run dev
```

Acesse: **http://localhost:5173**

---

## 📊 Dados Padrão Após Setup

### Usuários de Teste

| Email | Senha | Role | Descrição |
|-------|-------|------|-----------|
| `admin@nexuscontrol.com` | `26481#` | admin | Administrador raiz |
| `funcionario@nexuscontrol.com` | `func123` | funcionario | Operador de catálogo |
| `cliente@nexuscontrol.com` | `cliente123` | cliente | Cliente de compras |

### Estrutura de Dados

#### Tabelas Criadas

- **usuarios**: Usuários do sistema com 3 níveis de acesso
- **itens**: Catálogo de produtos (venda e aluguel)
- **pedidos**: Histórico de compras e checkout
- **negociacoes**: Simulações de compra/aluguel
- **password_resets**: Recuperação de senha
- **usuario_permissoes**: Permissões por página e usuário

#### Produtos Pré-carregados

- 25 produtos em várias categorias
- Valores de venda e aluguel mensal configurados
- Estoque inicial de 10 unidades por produto

#### Pedidos de Exemplo

- 2 pedidos do usuário "cliente@nexuscontrol.com"
- Status "confirmado" para demonstração
- Um com pagamento Pix e outro com Cartão

---

## 🔑 Permissões por Role

### Admin
- ✅ Dashboard
- ✅ Catálogo (itens)
- ✅ Carrinho de compras
- ✅ Checkout
- ✅ Gerenciar usuários
- ✅ Painel administrativo

### Funcionário
- ✅ Dashboard
- ✅ Catálogo (itens)
- ✅ Carrinho de compras
- ✅ Checkout
- ❌ Gerenciar usuários
- ❌ Painel administrativo

### Cliente
- ✅ Dashboard
- ✅ Catálogo (itens)
- ✅ Carrinho de compras
- ✅ Checkout
- ❌ Gerenciar usuários
- ❌ Painel administrativo

---

## 🛠️ Scripts Disponíveis

### Backend

```bash
npm run dev          # Iniciar servidor em modo desenvolvimento
npm run build        # Compilar TypeScript
npm run start        # Iniciar servidor compilado
npm run migrate      # Executar migrações do banco
npm run seed         # Seedar dados iniciais
npm run test         # Executar testes
npm run lint         # Verificar código
```

### Frontend

```bash
npm run dev          # Iniciar dev server com Vite
npm run build        # Build para produção
npm run preview      # Preview do build
npm run test         # Executar testes
npm run lint         # Verificar código com ESLint
npm run type-check   # Verificação de tipos TypeScript
```

---

## 🔗 Endpoints da API

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/refresh` - Renovar access token
- `GET /api/auth/me` - Obter dados do usuário autenticado
- `POST /api/auth/forgot-password` - Solicitar recuperação de senha
- `POST /api/auth/reset-password` - Redefinir senha
- `POST /api/auth/logout` - Fazer logout

### Itens (Catálogo)

- `GET /api/itens` - Listar itens com paginação
- `GET /api/itens/:id` - Obter item específico
- `POST /api/itens` - Criar novo item (admin)
- `PUT /api/itens/:id` - Atualizar item (admin/criador)
- `DELETE /api/itens/:id` - Deletar item (admin/criador)

### Pedidos (Checkout)

- `POST /api/pedidos/checkout` - Processar checkout
- `GET /api/pedidos/me` - Obter pedidos do usuário
- `GET /api/pedidos/:id` - Obter detalhes do pedido
- `GET /api/pedidos` - Listar todos os pedidos (admin)
- `PUT /api/pedidos/:id` - Atualizar status (admin)
- `DELETE /api/pedidos/:id` - Deletar pedido (admin)

### Admin

- `GET /api/admin/pages` - Mapeamento de páginas e acessos
- `GET /api/admin/users` - Listar usuários com permissões
- `GET /api/admin/users/:userId/permissions` - Permissões de usuário
- `PUT /api/admin/users/:userId/permissions` - Atualizar permissões
- `GET /api/admin/stats` - Estatísticas do sistema

### Usuários

- `GET /api/usuarios` - Listar usuários (admin)
- `GET /api/usuarios/:id` - Obter usuário (admin)
- `POST /api/usuarios` - Criar usuário (admin)
- `PUT /api/usuarios/:id` - Atualizar usuário (admin)
- `DELETE /api/usuarios/:id` - Deletar usuário (admin)

---

## 🎨 Design System

### Cores (Dark Gourmet Premium)

- **Charcoal Escuro**: `#121212` (fundo principal)
- **Charcoal Claro**: `#1A1A1A` (cards)
- **Ouro Champagne**: `#D4AF37` (destaques)
- **Ouro Champagne Claro**: `#E8C56D` (hover)

### Componentes

- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`
- Cards: `.card`, `.glass`, `.neumorphic`
- Modals: `.modal-overlay`, `.modal-content`
- Entrada: `.input`, `.label`

---

## 🔒 Segurança

- ✅ Autenticação JWT com refresh tokens
- ✅ Middleware de proteção de rotas
- ✅ Validação de entrada em todas as requisições
- ✅ Proteção CSRF via tokens
- ✅ Rate limiting (100 req/15min por IP)
- ✅ Helmet.js para headers de segurança
- ✅ CORS configurado para frontend autorizado
- ✅ Senhas com bcrypt (salt 12)
- ✅ Admin raiz protegido contra modificações

---

## 🐛 Troubleshooting

### "Connection refused" ao banco de dados

```bash
# Verifique se MySQL está rodando
# macOS (Homebrew)
brew services start mysql

# Windows (MySQL Community Server)
# Abra Services e inicie MySQL

# Linux
sudo systemctl start mysql
```

### Erro de porta em uso

```bash
# Altere a porta no .env
PORT=3001

# Frontend em .env
VITE_API_URL=http://localhost:3001/api
```

### Migração falha

```bash
# Verifique as credenciais do banco em .env
# Execute manualmente:
npm run migrate

# Se persistir, verifique os logs
```

### Token expirado no frontend

O sistema tenta renovar automaticamente. Se isso não funcionar:

```bash
# Limpe localStorage
localStorage.clear()

# Faça login novamente
```

---

## 📚 Documentação Adicional

- [Backend Architecture](./backend/README.md)
- [Frontend Architecture](./frontend/README.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/SCHEMA.md)

---

## 👨‍💻 Desenvolvimento

### Estrutura de Pastas

```
nexus-control-app/
├── backend/
│   ├── src/
│   │   ├── config/       # Configurações (DB, JWT, Permissões)
│   │   ├── controllers/  # Lógica de rotas
│   │   ├── middleware/   # Autenticação, validação
│   │   ├── models/       # Consultas ao banco
│   │   ├── routes/       # Definição de rotas
│   │   ├── utils/        # Utilitários (email, JWT, migrate, seed)
│   │   └── server.ts     # Aplicação Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # Context API (Auth, Cart, Modal, Theme)
│   │   ├── services/     # API clients
│   │   ├── utils/        # Utilitários
│   │   ├── App.jsx       # Rotas
│   │   └── main.jsx      # Entry point
│   └── package.json
└── docs/                 # Documentação
```

### Convenções de Código

- **Backend**: camelCase (JS), snake_case (SQL)
- **Frontend**: PascalCase (componentes), camelCase (funções)
- **Commits**: feat: novo recurso | fix: correção | docs: documentação | style: formatação | refactor: refatoração | test: testes
- **Branches**: feature/nome-feature | bugfix/nome-bug | hotfix/nome-hotfix

---

## 📝 Licença

Todos os direitos reservados © 2024 Nexus Control App

---

## 🤝 Suporte

Para dúvidas e problemas, abra uma issue no repositório ou entre em contato.

**Desenvolvido por Clayton Marcelo**
