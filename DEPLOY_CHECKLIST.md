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
  - ⚠️ Deve seguir a política atual da aplicação: **5 ou 6 dígitos seguidos de exatamente 1 símbolo** (6 ou 7 caracteres no total), validada pela regex `/^\d{5,6}[^A-Za-z0-9\s]$/`
  - ✅ Válidas: `12345@`, `123456$`; ❌ inválidas: `1234@` (4 dígitos), `1234567@` (7 dígitos), `12345a` (letra não conta como símbolo)
  - ❌ NUNCA reutilize uma senha pessoal nem compartilhe o valor
  - ✅ Esta é a sua conta pessoal de administrador - não compartilhe

- **`DB_PASS`**: Senha do banco de dados MySQL
  - ⚠️ **CRÍTICO**: Use uma senha forte para o MySQL
  - ❌ NUNCA deixe em branco ou use valores óbvios
  - ⚠️ Em `NODE_ENV=production` o servidor **nem sobe** com `DB_PASS` vazio: o `backend/src/config/database.js` lança `Configuração de banco obrigatória em produção: DB_PASS`
  - ⚠️ Se a senha contiver `#`, `;` ou espaços, **escreva entre aspas** no `.env` — veja a armadilha do dotenv logo abaixo
  - ✅ Configure tanto no MySQL quanto nesta variável

## 🕳️ Armadilha do `.env`: o caractere `#` corta a senha em silêncio

O `dotenv` interpreta `#` como **início de comentário** quando o valor não está entre aspas.
Isso já derrubou um deploy de teste aqui: `DB_PASS=Senha#Forte2026` chega ao processo como
`Senha`, e o MySQL responde `ER_ACCESS_DENIED_ERROR ... (using password: YES)` — um erro que
parece credencial errada, mas é a senha truncada.

```dotenv
# ❌ PERIGOSO — tudo depois do # é descartado
DB_PASS=Senha#Forte2026
ROOT_ADMIN_PASSWORD=123456#

# ✅ CORRETO — aspas preservam o valor literal
DB_PASS="Senha#Forte2026"
ROOT_ADMIN_PASSWORD="123456#"
```

Regras práticas:

- Cite **`DB_PASS`, `ROOT_ADMIN_PASSWORD`, `SMTP_PASS`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `JWT_SECRET` e `JWT_REFRESH_SECRET`** sempre que o valor contiver `#`, `;`, `$`, espaços ou qualquer caractere de pontuação.
- As aspas **não** fazem parte do valor: o processo recebe `Senha#Forte2026`.
- Para segredos gerados aleatoriamente, o caminho mais seguro é usar só letras+números (sem `#`), por exemplo a saída de `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — 64 caracteres hex, compatível com a guarda de produção do JWT (mínimo 32).
- Se aparecer erro de autenticação no MySQL ou no login do admin logo após editar o `.env`, confira primeiro o que o processo realmente recebeu:
  `node -e "require('dotenv').config({path:'backend/.env'}); console.log(JSON.stringify(process.env.DB_PASS))"`

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

- [ ] Alterar `JWT_SECRET` para valor seguro e aleatório (mínimo 32 caracteres — necessário para o boot em produção)
- [ ] Alterar `JWT_REFRESH_SECRET` para valor seguro e diferente do JWT_SECRET
- [ ] Definir `ROOT_ADMIN_PASSWORD` com senha forte dentro da política (5–6 dígitos + 1 símbolo)
- [ ] Configurar `DB_PASS` com senha forte do MySQL (sem valor vazio: o servidor não sobe em produção)
- [ ] Colocar aspas em qualquer valor de `.env` que contenha `#`, `;`, `$` ou espaços (armadilha do dotenv)
- [ ] Definir `NODE_ENV=production`
- [ ] Configurar `FRONTEND_URL` com URL real da instância AWS
- [ ] Configurar `API_URL` com a origem pública da API
- [ ] Configurar `VITE_API_URL` com URL real da API backend (opcional: em IP público da EC2 o frontend cai na mesma origem `/api`)
- [ ] Configurar `DB_CONNECTION_LIMIT=5` (recurso limitado AWS Academy)
- [ ] Opcional: Configurar variáveis SMTP se recuperação de senha for necessária
- [ ] Opcional: Configurar `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e `PUBLIC_URL` apenas para pagamentos automáticos (deixe em branco no modo manual Pix/crédito)
- [ ] Garantir que o diretório `backend/logs/` exista no servidor para os logs do PM2 (o `deploy-aws.sh` cria automaticamente)
- [ ] Verificar que não há valores de exemplo nas variáveis críticas
- [ ] Instalar dependências **com** devDependencies antes do build (`npm ci`) e podar depois (`npm prune --omit=dev`) — o build usa `tsc`, que é devDependency
- [ ] Rodar `bash deploy-aws.sh` (ou o workflow `🚀 Deploy para AWS Academy / Produção`) e conferir o health check `/api/health` = 200

## 🚀 Comandos de Deploy

### Caminho recomendado (backend + frontend + banco + PM2 + health check)

```bash
cd ~/nexus-control-app
bash deploy-aws.sh
```

O mesmo script é executado pelo GitHub Actions no push da branch `main` quando os secrets
`EC2_HOST` e `EC2_SSH_KEY` existem. Detalhes passo a passo em `INSTRUCOES_ATUALIZACAO_AWS.md`.

### Backend (passo a passo, equivalente ao que o script faz)
```bash
cd backend
npm ci                    # instala TAMBÉM as devDeps (o build roda tsc)
npm run build
node dist/utils/migrate.js   # migrações idempotentes
node dist/utils/seed.js      # catálogo oficial + admin raiz (só INSERT/UPDATE)
npm prune --omit=dev      # poda depois do build, nunca antes
pm2 reload ecosystem.config.cjs --env production
```

### Frontend
```bash
cd frontend
npm ci
npm run build
# Serve os arquivos estáticos em dist/ com nginx ou similar
# (se o Nginx não estiver configurado, o próprio Express serve o SPA em /)
```

## 📝 Notas Importantes

1. **Sessões Temporárias**: AWS Academy fornece sessões temporárias. O backup do banco de dados deve ser feito regularmente se os dados forem importantes.

2. **Recursos Limitados**: A configuração `DB_CONNECTION_LIMIT=5` foi definida para funcionar dentro dos limites de recursos da AWS Academy.

3. **Catálogo em produção**: Ao iniciar, o backend sincroniza os 35 produtos e serviços oficiais do projeto, mesmo quando o banco já contém outros itens. A sincronização atualiza descrição, categoria, fabricante, imagem e preços desses itens padrão, mantém o estoque em pelo menos 10 e não apaga itens personalizados nem pedidos. Alterações manuais nesses campos dos 35 itens oficiais serão substituídas pelos valores do catálogo do projeto no próximo reinício.

4. **Segurança e Git**: Nunca envie `.env`, `.env.production`, `.env.bak` ou outros arquivos de ambiente reais ao repositório. Use apenas os arquivos `.env.example` como template. Faça commits e pushes do código-fonte a partir do ambiente de desenvolvimento; na EC2, não use `git add .` para enviar arquivos gerados pelo build ou configurações locais.

5. **Encerramento gracioso (PM2)**: O backend trata `SIGINT`/`SIGTERM`, fecha o pool MySQL e sai com código adequado. O `ecosystem.config.cjs` está configurado com `kill_timeout` e `listen_timeout`, então um `pm2 reload` não derruba requisições em andamento nem o Mercado Pago webhook. Se `wait_ready` está `false` é porque o backend **não** emite `process.send('ready')`; quem confirma que a API e o banco estão prontos é o health check `/api/health` no fim do `deploy-aws.sh`. Garanta que `backend/logs/` exista no servidor (o `deploy-aws.sh` cria automaticamente).

   Falha de banco na subida: em `NODE_ENV=production` o backend sai com código 1 (watchdog de 10s, o mesmo do encerramento gracioso) para o PM2 tentar de novo. Como `max_restarts: 10` com `restart_delay: 5000`, se o MySQL ficar fora do ar por mais de ~50s o processo fica em estado `errored` e **não** volta sozinho quando o banco voltar — basta então `pm2 restart nexus-backend`. É comportamento padrão do PM2, e o motivo de o health check do script ser a verificação oficial do deploy.

6. **Verificação de Segurança (boot em produção)**: o backend se recusa a subir em `NODE_ENV=production` quando a configuração está errada, e o erro diz exatamente o que falta:
   - `JWT_SECRET` / `JWT_REFRESH_SECRET`: ausentes, menores que 32 caracteres, iguais entre si, ou começando com prefixo de exemplo (`replace_with_`, `your_`, `change_in_production`, `test_`, `sua_`, `gere_`) → `backend/src/config/jwt.js` lança o erro antes de qualquer rota existir.
   - `DB_HOST` / `DB_USER` / `DB_PASS` / `DB_NAME`: qualquer um em branco → `Configuração de banco obrigatória em produção: DB_PASS` (ou o nome da variável faltante), lançado por `backend/src/config/database.js`.
   - O `deploy-aws.sh` falha ainda mais cedo se `backend/.env` não existir, e no fim exige `/api/health` = 200; assim um deploy nunca fica "no ar" silenciosamente com configuração inválida.

7. **IP dinâmico da AWS Academy**: o Express aceita origens `localhost`, `*.amazonaws.com` e IPv4, então trocar o IP público da EC2 não exige editar `FRONTEND_URL`. O frontend em host não-local usa a mesma origem `/api`, então o build funciona sem `VITE_API_URL`.
