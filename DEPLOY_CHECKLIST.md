# Checklist de Deploy para AWS Academy

Este documento lista todas as variáveis de ambiente que precisam ser configuradas manualmente na instância AWS Academy antes do deploy. **NÃO use valores de exemplo em produção.**

## ⚠️ Variáveis Críticas de Segurança (JAMAIS usar valores de exemplo)

### Backend (.env)

- **`JWT_SECRET`**: Segredo para assinar tokens JWT de acesso
  - ⚠️ **CRÍTICO**: Use uma string longa e aleatória (mínimo 32 caracteres)
  - ❌ NUNCA use: `nexus_secret_key_gourmet_2026` ou qualquer valor do .env.example
  - ✅ Exemplo seguro: `gerar_uma_string_aleatoria_longa_aqui_123456789`

- **`JWT_REFRESH_SECRET`**: Segredo para assinar tokens de refresh
  - ⚠️ **CRÍTICO**: Use uma string diferente do JWT_SECRET (mínimo 32 caracteres)
  - ❌ NUNCA use: `nexus_refresh_secret_key_gourmet_2026` ou qualquer valor do .env.example
  - ✅ Exemplo seguro: `outra_string_aleatoria_diferente_aqui_987654321`

- **`ROOT_ADMIN_PASSWORD`**: Senha do administrador raiz (conta pessoal real)
  - ⚠️ **CRÍTICO**: Use uma senha forte (mínimo 12 caracteres, com letras, números e símbolos)
  - ❌ NUNCA use valores de exemplo ou senhas fracas
  - ✅ Esta é a sua conta pessoal de administrador - não compartilhe

- **`DB_PASS`**: Senha do banco de dados MySQL
  - ⚠️ **CRÍTICO**: Use uma senha forte para o MySQL
  - ❌ NUNCA deixe em branco ou use valores óbvios
  - ✅ Configure tanto no MySQL quanto nesta variável

## 🔧 Variáveis de Configuração Obrigatórias

### Backend (.env)

- **`PORT`**: Porta onde o backend vai rodar (padrão: 3000)
- **`NODE_ENV`**: Ambiente (definir como `production`)
- **`DB_HOST`**: Host do banco de dados MySQL (IP da instância RDS ou localhost)
- **`DB_USER`**: Usuário do MySQL (padrão: root)
- **`DB_NAME`**: Nome do banco de dados (padrão: nexusdb)
- **`DB_CONNECTION_LIMIT`**: Limite de conexões MySQL (padrão: 5 para AWS Academy)
- **`FRONTEND_URL`**: URL pública do frontend (https://seu-dominio-aws.com)
  - ⚠️ Configure com a URL real da instância AWS Academy

### Frontend (.env)

- **`VITE_API_URL`**: URL pública da API backend (https://seu-dominio-aws.com/api)
  - ⚠️ Configure com a URL real da instância AWS Academy

## 👤 Contas de Usuário

### Conta de Demonstração (Pública)
- **`DEMO_ADMIN_EMAIL`**: `admin.demo@nexuscontrol.com` (fixo)
- **`DEMO_ADMIN_PASSWORD`**: `999618` (fixo)
- ✅ Estas credenciais são públicas e podem ser compartilhadas em apresentações

### Contas de Teste (Seed)
- **`SEED_FUNCIONARIO_PASSWORD`**: `func123` (pode manter como está)
- **`SEED_CLIENTE_PASSWORD`**: `cliente123` (pode manter como está)
- ✅ Senhas de teste podem permanecer com valores padrão

### Credenciais de Teste (Automação)
- **`TEST_ADMIN_EMAIL`**: `admin@nexuscontrol.com` (padrão)
- **`TEST_ADMIN_PASSWORD`**: `admin123` (padrão)
- **`TEST_CLIENTE_EMAIL`**: `cliente@nexuscontrol.com` (padrão)
- **`TEST_CLIENTE_PASSWORD`**: `cliente123` (padrão)
- ✅ Usados apenas em testes automatizados

## 📧 Configuração de Email (Opcional)

Se o recurso de recuperação de senha for necessário:

- **`SMTP_HOST`**: Servidor SMTP (ex: smtp.gmail.com)
- **`SMTP_PORT`**: Porta SMTP (padrão: 587)
- **`SMTP_SECURE`**: TLS/SSL (false para TLS, true para SSL)
- **`SMTP_USER`**: Email do remetente
- **`SMTP_PASS`**: Senha ou app-specific password do email
- **`SMTP_FROM`**: Email de origem (deve ser o mesmo do SMTP_USER)

## 🔒 Configurações de SSL (Opcional)

Se o banco de dados exigir SSL:

- **`DB_SSL`**: `true` para habilitar SSL
- **`DB_SSL_REJECT_UNAUTHORIZED`**: `false` se usar certificados auto-assinados

## ✅ Checklist Pré-Deploy

Antes de iniciar o deploy na AWS Academy:

- [ ] Alterar `JWT_SECRET` para valor seguro e aleatório
- [ ] Alterar `JWT_REFRESH_SECRET` para valor seguro e diferente do JWT_SECRET
- [ ] Definir `ROOT_ADMIN_PASSWORD` com senha forte
- [ ] Configurar `DB_PASS` com senha forte do MySQL
- [ ] Definir `NODE_ENV=production`
- [ ] Configurar `FRONTEND_URL` com URL real da instância AWS
- [ ] Configurar `VITE_API_URL` com URL real da API backend
- [ ] Configurar `DB_CONNECTION_LIMIT=5` (recurso limitado AWS Academy)
- [ ] Opcional: Configurar variáveis SMTP se recuperação de senha for necessária
- [ ] Verificar que não há valores de exemplo nas variáveis críticas

## 🚀 Comandos de Deploy

### Backend
```bash
cd backend
npm install
npm run build
npm run db:migrate
npm run db:seed
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm install
npm run build
# Serve os arquivos estáticos em dist/ com nginx ou similar
```

## 📝 Notas Importantes

1. **Sessões Temporárias**: AWS Academy fornece sessões temporárias. O backup do banco de dados deve ser feito regularmente se os dados forem importantes.

2. **Recursos Limitados**: A configuração `DB_CONNECTION_LIMIT=5` foi definida para funcionar dentro dos limites de recursos da AWS Academy.

3. **Segurança**: Nunca commit o arquivo `.env` real no repositório. Use apenas `.env.example` como template.

4. **Demo vs Produção**: A conta `admin.demo@nexuscontrol.com` é para demonstrações públicas. A conta `ROOT_ADMIN_EMAIL` é pessoal e não deve ser compartilhada.

5. **Verificação de Segurança**: O backend valida automaticamente se as variáveis críticas foram alteradas dos valores de exemplo ao iniciar em modo `production`. Se a validação falhar, o servidor não iniciará.
