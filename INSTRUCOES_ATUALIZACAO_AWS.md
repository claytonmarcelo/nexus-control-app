# ☁️ Guia de Atualização e Deploy - AWS Academy (Nexus Control)

Este documento explica por que as alterações no GitHub não refletiam na nuvem AWS Academy e como rodar a atualização completa com 1 único comando.

---

## ❓ Por que a AWS Academy não atualizava automaticamente pelo GitHub?

1. **O GitHub não envia o código sozinho para a máquina**:
   - O comando `git push` apenas envia os commits para os servidores do GitHub.
   - A máquina virtual EC2 na AWS Academy é um servidor independente; ela não sabe que novos commits foram enviados a menos que seja instruída a buscar as atualizações (`git pull`).

2. **O processo Node.js / PM2 continua com o código antigo na memória**:
   - Mesmo quando alguém faz `git pull`, se o TypeScript não for recompilado (`npm run build`) e o PM2 não for recarregado (`pm2 reload`), o servidor continua executando a versão compilada anterior.

3. **Arquivos do Frontend (React / Vite)**:
   - O frontend React gera arquivos estáticos (`dist/`). Sem recompilar o frontend na EC2, o navegador do usuário continua recebendo a versão antiga dos arquivos HTML e JavaScript.

4. **IPs Dinâmicos na AWS Academy**:
   - Sempre que o laboratório da AWS Academy é iniciado ou pausado, a instância EC2 recebe um novo endereço IP público. Antes, o CORS e a verificação estrita de URL podiam bloquear requisições caso o `.env` estivesse com o IP antigo. Agora o servidor detecta e permite dinamicamente requisições da AWS e da mesma origem!

5. **Serviço Unificado Frontend + API**:
   - Antes, o Express apenas respondia a requisições `/api`. Se você abrisse a porta do servidor diretamente no navegador (`http://<ip-ec2>:3000`), recebia o erro `Rota não encontrada`. Agora o Express serve o frontend React completo diretamente caso o Nginx não esteja configurado, permitindo que a aplicação abra imediatamente em qualquer cenário!

---

## 🚀 Como Atualizar a AWS Academy (Passo a Passo)

### Método 1: Script Automático em 1 Comando (Recomendado)

Conecte-se na sua instância EC2 na AWS Academy (via **EC2 Instance Connect** no console AWS ou via SSH/PuTTY) e execute:

```bash
cd ~/nexus-control-app
bash deploy-aws.sh
```

O script `deploy-aws.sh` fará automaticamente:
- ✅ Pré-voos: exige Node 20.19+ e `backend/.env` presente (aborta antes de subir com segredo errado)
- ✅ Cria `backend/logs/`, exigido pelo `ecosystem.config.cjs`
- ✅ `git fetch` e `git reset` para a versão mais recente da branch `main`
- ✅ Instalação de dependências (com devDeps, necessárias ao `tsc`) e compilação do Backend (`npm run build`)
- ✅ Migração do banco e sincronização automática dos 35 itens do catálogo (idempotentes, sem exclusões)
- ✅ Poda de devDependencies após o build
- ✅ Compilação completa do Frontend React com Vite
- ✅ Cópia para o Nginx (caso configurado em `/usr/share/nginx/html`, `/var/www/html` ou `/var/www/nexus-control`)
- ✅ Recarregamento a quente do PM2 com `--env production`
- ✅ Health check em `/api/health` (até 20s): o script falha com erro claro se a API não subir

> Este é exatamente o mesmo script executado pelo workflow `.github/workflows/deploy.yml`
> quando os secrets `EC2_HOST` e `EC2_SSH_KEY` existem no repositório. Ou seja: o que você roda
> na mão e o que o GitHub Actions rodam são a mesma sequência, sem risco de divergência.

---

### Método 2: Comandos Manuais (Caso prefira executar passo a passo)

Se preferir rodar manualmente na EC2:

```bash
# 1. Entrar na pasta do projeto e puxar o código novo
cd ~/nexus-control-app
git fetch origin main
git reset --hard origin/main

# 2. Criar a pasta de logs exigida pelo ecosystem.config.cjs
mkdir -p backend/logs

# 3. Atualizar o Backend
#    IMPORTANTE: instale SEM as devDependencies primeiro, porque o build roda `tsc`
#    (TypeScript é devDependency). Usar `npm install --omit=dev` aqui quebra com
#    "tsc: not found".
cd backend
npm ci
npm run build
node dist/utils/migrate.js
node dist/utils/seed.js
npm prune --omit=dev

# 4. Atualizar o Frontend
cd ../frontend
npm ci
npm run build

# 5. Reiniciar o serviço no PM2 (reload preserva requisições em andamento)
cd ../backend
pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
pm2 save

# 6. Conferir se a API respondeu
curl -i http://localhost:3000/api/health
```

> O `pm2 reload ... --env production` é preferível a `pm2 restart all`: ele sobe a nova
> versão e só derruba o processo antigo depois que o novo escuta na porta (graças ao
> `wait_ready`/`listen_timeout` do `ecosystem.config.cjs`), além de aplicar
> `NODE_ENV=production`. Se o processo ainda não existe no PM2, o comando final do passo 5
> faz o primeiro start.

---

## 🤖 Método 3: Deploy Automático pelo GitHub Actions

Se você quiser que o `git push` na branch `main` já atualize a EC2 sozinho, configure os
secrets do repositório (GitHub → **Settings → Secrets and variables → Actions → New repository
secret**):

| Secret | Obrigatório | Valor |
| --- | --- | --- |
| `EC2_HOST` | sim | IP público (ou DNS) da instância — **muda cada vez que o laboratório é parado e iniciado** |
| `EC2_SSH_KEY` | sim | Conteúdo **completo** da chave privada PEM (incluindo as linhas `-----BEGIN/END ... PRIVATE KEY-----`) |
| `EC2_USER` | não | `ec2-user` em Amazon Linux (padrão da AWS Academy) / `ubuntu` em AMI Ubuntu / `admin` em alguns imagens. Sem valor, o workflow usa `ubuntu` |
| `EC2_PORT` | não | `22`, salvo se você usar porta SSH diferente |

O workflow `.github/workflows/deploy.yml` então:

1. Roda os **92 testes do backend** contra um MySQL 8 de serviço, com `.env.test.example`.
2. Roda **lint + 58 testes + build do frontend**.
3. Se (e somente se) `EC2_HOST` e `EC2_SSH_KEY` existirem, conecta na EC2 e executa
   **`bash deploy-aws.sh`** — o mesmo script do Método 1. Sem esses secrets, o job termina
   verde só com testes/build, e nada é publicado.

Pré-requisitos na instância (uma única vez):

- O repositório clonado em `~/nexus-control-app` (o script também procura
  `/home/ubuntu/nexus-control-app` e `/var/www/nexus-control-app`);
- `backend/.env` preenchido — **o Actions não cria o `.env` e ele nunca sai da EC2**;
- `sudo npm install -g pm2`;
- Security group liberando a porta 22 (SSH) para o deploy, além das portas já usadas pelo app.

Custo de um deploy com erro: o `set -e` do script + `script_stop: true` do `appleboy/ssh-action`
fazem o passo falhar no primeiro problema (dependência, build, migração ou health check), e o
log do run mostra qual etapa. O serviço anterior continua no ar até a nova versão passar no
`/api/health`.

> ⚠️ Como o IP público da AWS Academy muda a cada start do laboratório, atualize o secret
> `EC2_HOST` sempre que reiniciar a instância. O CORS do backend aceita IPv4 e
> `*.amazonaws.com` dinamicamente, então **não** é preciso mexer em `FRONTEND_URL`/`API_URL`
> por causa de troca de IP — só no `EC2_HOST` do Actions.

---

## 🔍 Como Testar no Navegador

Após executar a atualização:
- Acesse no navegador: `http://<SEU-IP-PUBLICO-EC2>:3000`
- O aplicativo Nexus Control abrirá por completo, com:
  - 🛡️ Todas as proteções contra injeção e sequestro de sessão
  - 📦 Os 35 itens oficiais no catálogo de produtos e serviços
  - 🔐 Login preservado e protegido contra ataques de força bruta
  - 🌐 Roteamento SPA funcionando sem erro 404 em rotas internas
