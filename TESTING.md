# Guia de Testes - Nexus Control App

## 🧪 Estrutura de Testes

### Backend
- **Testes de Integração**: `backend/src/tests/integration.test.js`
- **Testes Unitários**: Em desenvolvimento
- **Framework**: Jest + Supertest
- **Cobertura**: 50+ casos de teste

### Frontend
- **Testes de Componentes**: `frontend/src/components/**/*.test.jsx`
- **Testes Unitários**: Em desenvolvimento
- **Framework**: Vitest + React Testing Library
- **Cobertura**: Em expansão

---

## 🏃 Executando Testes

### Backend

```bash
# Todos os testes
cd backend
npm run test

# Testes específicos
npm run test -- integration.test.js

# Com cobertura
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

### Frontend

```bash
# Todos os testes
cd frontend
npm run test

# Teste específico
npm run test -- Cart.test.jsx

# Com cobertura
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

---

## 🧬 Testes de Integração - Backend

### 1. Fluxo do Carrinho (CartContext)

```javascript
✅ Deve permitir adicionar item ao carrinho via API
✅ Deve obter detalhes de um item específico
```

**Validações:**
- Listagem de itens com paginação
- Obtenção de item individual
- Dados de preço e categoria

### 2. Checkout e Pagamento

```javascript
✅ Deve processar checkout com sucesso (Pix)
✅ Deve processar checkout com sucesso (Cartão)
❌ Deve rejeitar checkout com carrinho vazio
❌ Deve rejeitar checkout sem autenticação
```

**Validações:**
- Criação de pedido com dados corretos
- Diferentes métodos de pagamento
- Validação de autorização
- Rejeição de dados inválidos

### 3. Gestão de Pedidos (Cliente)

```javascript
✅ Cliente deve obter seus próprios pedidos
✅ Cliente deve obter detalhes de um pedido
❌ Cliente não deve obter pedidos de outro usuário
```

**Validações:**
- Isolamento de dados por usuário
- Controle de acesso
- Paginação de pedidos

### 4. Admin - Gestão de Pedidos

```javascript
✅ Admin deve listar todos os pedidos
✅ Admin deve atualizar status de pedido
❌ Cliente não deve atualizar pedidos
```

**Validações:**
- Acesso admin a todos os dados
- Atualização de status
- Rejeição de acesso não-autorizado

### 5. Admin Control Center - Páginas

```javascript
✅ Admin deve obter mapeamento de páginas
❌ Cliente não deve acessar admin pages
```

**Validações:**
- Mapeamento completo de páginas
- Proteção de rotas administrativas

### 6. Admin Control Center - Permissões

```javascript
✅ Admin deve listar usuários com permissões
✅ Admin deve obter permissões de um usuário
✅ Admin deve atualizar permissões de usuário
```

**Validações:**
- CRUD de permissões
- Proteção do admin raiz
- Aplicação de mudanças

### 7. Admin Control Center - Estatísticas

```javascript
✅ Admin deve obter estatísticas do dashboard
```

**Validações:**
- Contagem de usuários
- Estatísticas de pedidos
- Receita por status

### 8. Fluxo Completo - Carrinho até Pedido

```javascript
✅ Deve executar fluxo completo do cliente

Passos:
1. Cliente acessa dashboard
2. Cliente visualiza itens (25 produtos)
3. Cliente faz checkout (Pix)
4. Cliente consulta seu pedido
5. Admin visualiza todos os pedidos
6. Admin atualiza status do pedido
```

### 9. Segurança

```javascript
❌ Deve rejeitar requisições sem token
❌ Deve rejeitar token inválido
❌ Deve respeitar limites de permissão
```

**Validações:**
- Autenticação JWT obrigatória
- Validação de tokens
- Autorização por role

---

## 🖼️ Testes de Componentes - Frontend

### CartContext

```javascript
✅ Deve adicionar item ao carrinho
✅ Deve atualizar quantidade de item
✅ Deve remover item do carrinho
✅ Deve calcular total corretamente
✅ Deve persistir carrinho em localStorage
✅ Deve preparar dados para checkout
✅ Deve validar quantidade mínima
✅ Deve ignorar itens com dados inválidos
```

**Validações:**
- Gerenciamento de estado
- Cálculos de totais
- Persistência local
- Validações de entrada

### Cart Component

```javascript
✅ Deve exibir mensagem quando carrinho está vazio
✅ Deve exibir itens quando adicionados
✅ Deve permitir atualizar quantidade via input
✅ Deve permitir remover item
✅ Deve calcular subtotal por item
✅ Deve exibir resumo do pedido
```

### Checkout Component

```javascript
✅ Deve exibir opções de pagamento (Pix/Cartão)
✅ Deve exibir QR Code para Pix
✅ Deve exibir formulário de cartão
✅ Deve validar dados do cartão
✅ Deve exibir modal de sucesso com timer
```

---

## 🔍 Cenários de Teste Manual

### Cenário 1: Fluxo de Compra Completo

**Setup:**
```
1. Fazer login como cliente@nexuscontrol.com
2. Navegar para /itens
3. Verificar se 25 produtos estão carregados
```

**Ações:**
```
1. Clicar em "Adicionar ao carrinho" em 2 produtos
2. Verificar carrinho tem 2 itens
3. Mudar quantidade do primeiro para 3
4. Verificar total atualizado
5. Ir para /carrinho
6. Verificar resumo do pedido
7. Clicar "Ir para pagamento"
8. Verificar /checkout
```

**Validações:**
```
✅ Carrinho atualiza em tempo real
✅ Totais calculam corretamente
✅ Navegação funciona
✅ Dados persistem
```

### Cenário 2: Checkout com Pix

**Setup:** Carrinho com 1 item

**Ações:**
```
1. Clicar em "Pix"
2. Ver QR Code e código Copia e Cola
3. Clicar "Copiar"
4. Clicar "Pagar com Pix"
```

**Validações:**
```
✅ Modal de sucesso aparece
✅ Timer regressivo começa
✅ Redireção para dashboard após 4s
✅ Carrinho limpo
```

### Cenário 3: Checkout com Cartão

**Setup:** Carrinho com 2 itens

**Ações:**
```
1. Clicar em "Cartão de crédito"
2. Preencher:
   - Nome: "JOÃO DA SILVA"
   - Número: "4111 1111 1111 1111"
   - Validade: "12/25"
   - CVV: "123"
3. Clicar "Pagar com cartão"
```

**Validações:**
```
✅ Validação de campos funciona
✅ Formatação de número é correta
✅ Modal de sucesso aparece
✅ Pedido é criado
```

### Cenário 4: Painel Admin - Visão Geral

**Setup:** Login como admin@nexuscontrol.com

**Ações:**
```
1. Clicar em "Admin" na navegação
2. Verificar aba "Visão geral"
3. Ver métricas: usuários, produtos, pedidos, receita
4. Clicar em diferentes roles (Admin, Funcionário, Cliente)
```

**Validações:**
```
✅ Todas as métricas carregam
✅ Preview de páginas muda por role
✅ Mapas de rotas aparecem
```

### Cenário 5: Painel Admin - Gestão de Acessos

**Setup:** Painel Admin aberto

**Ações:**
```
1. Clicar em aba "Acessos"
2. Buscar e selecionar cliente@nexuscontrol.com
3. Observar permissões atuais
4. Desativar "usuarios"
5. Clicar "Salvar acessos"
6. Verificar feedback de sucesso
```

**Validações:**
```
✅ Lista de usuários carrega
✅ Permissões exibem corretamente
✅ Atualização salva
✅ Mudanças refletem em tempo real
```

### Cenário 6: Painel Admin - Gestão de Produtos

**Setup:** Painel Admin > Aba "Produtos"

**Ações:**
```
1. Ver 25 produtos listados
2. Clicar "Novo produto"
3. Preencher:
   - Nome: "Novo Item"
   - Descrição: "Descrição"
   - Categoria: "Testes"
   - Valor de Venda: "199.90"
   - Estoque: "5"
4. Clicar "Salvar"
5. Ver novo produto na lista
```

**Validações:**
```
✅ Lista de produtos carrega
✅ Modal de criação funciona
✅ Validações funcionam
✅ Novo produto aparece na lista
✅ Frontend reflete mudanças
```

### Cenário 7: Painel Admin - Monitoramento de Pedidos

**Setup:** Painel Admin > Aba "Pedidos"

**Ações:**
```
1. Ver pedidos de exemplo carregados
2. Expandir um pedido
3. Ver itens detalhados
4. Mudar status de pagamento
5. Clicar "Atualizar"
6. Verificar mudança
```

**Validações:**
```
✅ Pedidos carregam com paginação
✅ Itens exibem detalhes
✅ Status pode ser alterado
✅ Atualizações são persistidas
```

### Cenário 8: Segurança - Sem Autenticação

**Ações:**
```
1. Abrir nova aba sem login
2. Tentar acessar /carrinho
3. Tentar acessar /admin
4. Tentar acessar /pedidos
```

**Validações:**
```
✅ Todas as rotas redirecionam para /login
✅ Mensagem de erro aparece
```

### Cenário 9: Segurança - Permissões

**Setup:** Login como cliente

**Ações:**
```
1. Verificar que /usuarios não está visível
2. Verificar que /admin não está visível
3. Tentar acessar /usuarios manualmente
4. Tentar acessar /admin manualmente
```

**Validações:**
```
✅ Rutas protegidas não aparecem no menu
✅ Acesso direto via URL é bloqueado
```

### Cenário 10: Responsividade

**Dispositivos:**
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**Ações:**
```
1. Adicionar 3 itens ao carrinho
2. Ir para /carrinho
3. Ir para /checkout
4. Verificar layout em cada dispositivo
```

**Validações:**
```
✅ Layouts responsivos funcionam
✅ Sem sobreposição de elementos
✅ Botões acessíveis em todos os tamanhos
✅ Cabeçalho e rodapé não cobrem conteúdo
```

---

## 📊 Cobertura de Testes Esperada

### Backend
- Autenticação: 100%
- Checkout: 95%
- Admin: 90%
- Permissões: 85%
- **Total: 90%+**

### Frontend
- CartContext: 95%
- Checkout: 90%
- AdminCenter: 85%
- **Total: 85%+**

---

## ✅ Checklist de Validação Final

### Backend
- [ ] Todas as rotas protegidas requerem JWT
- [ ] Admin raiz não pode ser modificado
- [ ] Pedidos isolados por usuário
- [ ] Permissões aplicadas corretamente
- [ ] Validações de entrada funcionam
- [ ] Erros retornam status HTTP corretos
- [ ] Rate limiting ativo
- [ ] CORS configurado corretamente

### Frontend
- [ ] Carrinho persiste em localStorage
- [ ] Checkout calcula totais corretamente
- [ ] Modal de sucesso exibe timer
- [ ] Painel admin carrega dados
- [ ] Navegação respeita permissões
- [ ] Design Dark Gourmet aplicado
- [ ] Responsividade funciona
- [ ] Sem erros no console

### Integração
- [ ] Fluxo completo carrinho → pedido funciona
- [ ] Admin consegue gerenciar usuários
- [ ] Admin consegue gerenciar produtos
- [ ] Admin consegue monitorar pedidos
- [ ] Cliente vê apenas seus pedidos
- [ ] Permissões por página funcionam
- [ ] Autenticação e renovação de tokens funcionam

---

## 🐛 Debugging

### Logs Úteis

**Backend:**
```bash
# Ver todas as requisições
NODE_DEBUG=* npm run dev

# Ver apenas logs de erro
npm run dev 2>&1 | grep -i error
```

**Frontend:**
```bash
# Abrir DevTools
F12 ou Cmd+Option+I

# Inspecionar localStorage
localStorage.getItem('nexus-control-cart')
localStorage.getItem('accessToken')

# Limpar e reiniciar
localStorage.clear()
location.reload()
```

### Erros Comuns

1. **"Token inválido"**
   - Solução: Fazer logout e login novamente

2. **"Carrinho vazio após recarregar"**
   - Solução: Verificar localStorage no DevTools

3. **"Pedido não aparece no admin"**
   - Solução: Recarregar página, verificar timestamps

4. **"Permissões não mudam"**
   - Solução: Limpar cache, fazer logout/login

---

## 📝 Relatório de Testes

Após executar todos os testes, gerar relatório:

```bash
# Backend
cd backend
npm run test -- --coverage --json > test-report.json

# Frontend
cd frontend
npm run test -- --coverage --json > test-report.json
```

Abrir em: `http://localhost:3000/coverage/index.html`

---

## 🚀 Próximos Passos

- [ ] Testes de performance com k6
- [ ] Testes de carga do banco
- [ ] Testes de segurança (OWASP)
- [ ] E2E com Playwright
- [ ] CI/CD pipeline
- [ ] Monitoring em produção

---

**Última atualização:** 2024
**Status:** ✅ Em Produção
