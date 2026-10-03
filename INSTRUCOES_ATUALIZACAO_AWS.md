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
- ✅ `git fetch` e `git reset` para a versão mais recente da branch `main`
- ✅ Instalação de dependências e compilação do Backend (`npm run build`)
- ✅ Migração do banco e sincronização automática dos 35 itens do catálogo
- ✅ Compilação completa do Frontend React com Vite
- ✅ Cópia para o Nginx (caso configurado em `/var/www/html` ou `/var/www/nexus-control`)
- ✅ Reinicialização do PM2 com recarregamento a quente

---

### Método 2: Comandos Manuais (Caso prefira executar passo a passo)

Se preferir rodar manualmente na EC2:

```bash
# 1. Entrar na pasta do projeto e puxar o código novo
cd ~/nexus-control-app
git pull origin main

# 2. Atualizar o Backend
cd backend
npm install --omit=dev
npm run build
npm run db:migrate
npm run db:seed

# 3. Atualizar o Frontend
cd ../frontend
npm install
npm run build

# 4. Reiniciar o serviço no PM2
cd ../backend
pm2 restart all
pm2 save
```

---

## 🔍 Como Testar no Navegador

Após executar a atualização:
- Acesse no navegador: `http://<SEU-IP-PUBLICO-EC2>:3000`
- O aplicativo Nexus Control abrirá por completo, com:
  - 🛡️ Todas as proteções contra injeção e sequestro de sessão
  - 📦 Os 35 itens oficiais no catálogo de produtos e serviços
  - 🔐 Login preservado e protegido contra ataques de força bruta
  - 🌐 Roteamento SPA funcionando sem erro 404 em rotas internas
