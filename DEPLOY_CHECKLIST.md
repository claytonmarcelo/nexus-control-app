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
  - ❌ Nunca reutilize o JWT_SECRET nem use valores de exemplo

- **`ROOT_ADMIN_PASSWORD`**: Senha do administrador raiz (conta pessoal real)
  - ⚠️ Deve seguir a política atual da aplicação: exatamente 6 dígitos seguidos de 1 símbolo (7 caracteres)
  - ❌ NUNCA reutilize uma senha pessoal nem compartilhe o valor
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
  - ⚠️ Configure com a origem pública do frontend (sem caminho)
- **`API_URL`**: Origem pública da API (ex: https://api.seu-dominio-aws.com)
  - ⚠️ Configure com a origem pública da API (sem `/api`)

### Frontend (.env)

- **`VITE_API_URL`**: URL pública da API backend (https://seu-dominio-aws.com/api)
  - ⚠️ Configure com a URL real da instância AWS Academy
- **`VITE_ROOT_ADMIN_EMAIL`**: mesmo valor configurado em `ROOT_ADMIN_EMAIL`; configure antes do build frontend

O seed não cria contas de demonstração nem pedidos de exemplo em produção. Credenciais de teste são exclusivas do ambiente de CI.

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

## 💳 Pagamentos (Mercado Pago) — Opcional

O projeto é acadêmico e funciona integralmente em modo manual (Pix/cartão com confirmação pelo administrador). As credenciais do Mercado Pago são **opcionais** e só precisam ser configuradas se você quiser pagamentos automáticos pelo gateway. **NUNCA versione tokens reais — apenas via `.env`.**

- **`MP_ACCESS_TOKEN`**: Token de acesso da conta Mercado Pago (produção ou testes). Deixe **vazio** para permanecer no modo manual (Pix/crédito confirmado pelo admin).
- **`MP_WEBHOOK_SECRET`**: Segredo do webhook (painel do Mercado Pago). Valida a assinatura HMAC do header `x-signature`. Sem ele o webhook rejeita eventos e a confirmação volta a ser manual.
- **`PUBLIC_URL`**: URL pública (https) deste backend, usada como `notification_url` do gateway e para montar a URL do webhook.

Após configurar, cadastre no painel do Mercado Pago o webhook apontando para: `POST https://<seu-host>/api/pagamentos/webhook`. A confirmação é idempotente (chave única em `provider_payment_id`), então notificações repetidas não geram pedidos duplicados.

## ✅ Checklist Pré-Deploy

Antes de iniciar o deploy na AWS Academy:

- [ ] Alterar `JWT_SECRET` para valor seguro e aleatório
- [ ] Alterar `JWT_REFRESH_SECRET` para valor seguro e diferente do JWT_SECRET
- [ ] Definir `ROOT_ADMIN_PASSWORD` com senha forte
- [ ] Configurar `DB_PASS` com senha forte do MySQL
- [ ] Definir `NODE_ENV=production`
- [ ] Configurar `FRONTEND_URL` com URL real da instância AWS
- [ ] Configurar `API_URL` com a origem pública da API
- [ ] Configurar `VITE_API_URL` com URL real da API backend
- [ ] Configurar `DB_CONNECTION_LIMIT=5` (recurso limitado AWS Academy)
- [ ] Opcional: Configurar variáveis SMTP se recuperação de senha for necessária
- [ ] Opcional: Configurar `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e `PUBLIC_URL` apenas para pagamentos automáticos (deixe em branco no modo manual Pix/crédito)
- [ ] Garantir que o diretório `backend/logs/` exista no servidor para os logs do PM2 (o `deploy-aws.sh` cria automaticamente)
- [ ] Verificar que não há valores de exemplo nas variáveis críticas

## 🚀 Comandos de Deploy

### Backend
```bash
cd backend
npm ci
npm run build
npm run db:migrate
npm run db:seed
npm prune --omit=dev
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm ci
npm run build
# Serve os arquivos estáticos em dist/ com nginx ou similar
```

## 📝 Notas Importantes

1. **Sessões Temporárias**: AWS Academy fornece sessões temporárias. O backup do banco de dados deve ser feito regularmente se os dados forem importantes.

2. **Recursos Limitados**: A configuração `DB_CONNECTION_LIMIT=5` foi definida para funcionar dentro dos limites de recursos da AWS Academy.

3. **Catálogo em produção**: Ao iniciar, o backend sincroniza os 35 produtos e serviços oficiais do projeto, mesmo quando o banco já contém outros itens. A sincronização atualiza descrição, categoria, fabricante, imagem e preços desses itens padrão, mantém o estoque em pelo menos 10 e não apaga itens personalizados nem pedidos. Alterações manuais nesses campos dos 35 itens oficiais serão substituídas pelos valores do catálogo do projeto no próximo reinício.

4. **Segurança e Git**: Nunca envie `.env`, `.env.production`, `.env.bak` ou outros arquivos de ambiente reais ao repositório. Use apenas os arquivos `.env.example` como template. Faça commits e pushes do código-fonte a partir do ambiente de desenvolvimento; na EC2, não use `git add .` para enviar arquivos gerados pelo build ou configurações locais.

5. **Encerramento gracioso (PM2)**: O backend trata `SIGINT`/`SIGTERM`, fecha o pool MySQL e sai com código adequado. O `ecosystem.config.cjs` está configurado com `wait_ready`, `kill_timeout` e `listen_timeout`, então um `pm2 reload` não derruba requisições em andamento nem o Mercado Pago webhook. Garanta que `backend/logs/` exista no servidor (o `deploy-aws.sh` cria automaticamente).

6. **Verificação de Segurança**: O backend valida automaticamente se as variáveis críticas foram alteradas dos valores de exemplo ao iniciar em modo `production`. Se a validação falhar, o servidor não iniciará.
