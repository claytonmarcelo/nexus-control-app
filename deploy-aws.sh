#!/bin/bash
# ==============================================================================
# Script de Atualização e Deploy Automático - Nexus Control App (AWS Academy)
# ==============================================================================
# Pré-requisitos na instância EC2:
#   - Node.js >= 20.19 (verificado abaixo)
#   - npm >= 10
#   - MySQL/RDS acessível via backend/.env (DB_HOST, DB_USER, DB_PASS, DB_NAME)
#   - PM2 instalado globalmente (`sudo npm install -g pm2`)
#   - backend/.env preenchido — use backend/.env.example como template;
#     NUNCA commite o .env real.
# Uso:
#   cd ~/nexus-control-app
#   bash deploy-aws.sh
# ==============================================================================
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo ""
echo "=================================================================="
echo "  🚀 NEXUS CONTROL - ATUALIZADOR AUTOMÁTICO (AWS ACADEMY)"
echo "=================================================================="
echo ""
echo "📍 Diretório da aplicação: $APP_DIR"

# ── Pré-voos ──────────────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js não encontrado. Instale Node 20.19+ antes de continuar."
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "❌ Node.js $NODE_MAJOR detectado; este projeto exige 20.19 ou superior."
  exit 1
fi
echo "🟢 Node $(node -v) OK"

if [ ! -f "backend/.env" ]; then
  echo "❌ Arquivo backend/.env não encontrado. Copie backend/.env.example,"
  echo "   preencha as variáveis e rode novamente. Sem .env o deploy aborta"
  echo "   para não subir o serviço com segredos incorretos."
  exit 1
fi
echo "🟢 backend/.env presente"

# Garante pasta de logs exigida pelo ecosystem.config.cjs
mkdir -p backend/logs

# ── 1. Git ────────────────────────────────────────────────────────────────
echo ""
echo "📥 [1/6] Sincronizando código com a branch 'main' do GitHub..."
git fetch origin main
git reset --hard origin/main
echo "✅ Código atualizado."

# ── 2. Backend ────────────────────────────────────────────────────────────
echo ""
echo "⚙️ [2/6] Atualizando Backend (Node.js/Express + TypeScript)..."
cd "$APP_DIR/backend"
npm ci --no-audit --no-fund || npm install --no-audit --no-fund

echo "🔨 Compilando TypeScript..."
npm run build

echo "🗄️ Aplicando migrações do banco (idempotentes)..."
node dist/utils/migrate.js

echo "🌱 Sincronizando catálogo oficial (35 itens) e administradores..."
node dist/utils/seed.js

# Remove devDependencies apenas se o ambiente for explicitamente produção
if [ "${SKIP_PRUNE:-0}" != "1" ]; then
  echo "🧹 Poda de devDependencies..."
  npm prune --omit=dev || true
fi

# ── 3. Frontend ───────────────────────────────────────────────────────────
echo ""
echo "🎨 [3/6] Atualizando Frontend (React/Vite)..."
cd "$APP_DIR/frontend"
npm ci --no-audit --no-fund || npm install --no-audit --no-fund

if [ -f ".env.production" ]; then
  echo "📄 Usando frontend/.env.production"
elif [ -f ".env" ]; then
  echo "📄 Usando frontend/.env"
else
  echo "ℹ️ Nenhum .env de frontend; usando defaults de build."
fi

echo "🏗️ Gerando build de produção do frontend..."
npm run build

# ── 4. Nginx ──────────────────────────────────────────────────────────────
echo ""
echo "🌐 [4/6] Sincronizando arquivos com o servidor Web (Nginx)..."

NGINX_TARGETS=(
  "/usr/share/nginx/html"
  "/var/www/html"
  "/var/www/nexus-control"
)

COPIED=0
for TARGET in "${NGINX_TARGETS[@]}"; do
  if [ -d "$TARGET" ]; then
    echo "  -> Copiando arquivos para $TARGET..."
    sudo cp -r dist/* "$TARGET/" 2>/dev/null || cp -r dist/* "$TARGET/"
    sudo chown -R nginx:nginx "$TARGET" 2>/dev/null \
      || sudo chown -R www-data:www-data "$TARGET" 2>/dev/null \
      || true
    COPIED=1
  fi
done

if [ "$COPIED" -eq 0 ]; then
  echo "ℹ️ Nenhum diretório Nginx encontrado; o Express servirá o SPA em /."
fi

echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx 2>/dev/null \
  || sudo nginx -s reload 2>/dev/null \
  || sudo service nginx reload 2>/dev/null \
  || true

# ── 5. PM2 ────────────────────────────────────────────────────────────────
echo ""
echo "🔄 [5/6] Reiniciando serviço Backend no PM2..."
cd "$APP_DIR/backend"
if command -v pm2 &> /dev/null; then
  if pm2 describe nexus-backend >/dev/null 2>&1; then
    pm2 reload ecosystem.config.cjs --env production || \
      pm2 restart nexus-backend --update-env
  else
    pm2 start ecosystem.config.cjs --env production
  fi
  pm2 save || true
  echo "✅ PM2 recarregado com sucesso."
else
  echo "ℹ️ PM2 não encontrado; inicie com `npm start` dentro de backend/."
fi

# ── 6. Health check ───────────────────────────────────────────────────────
echo ""
echo "🩺 [6/6] Aguardando health check..."
HEALTHY=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 2
  CODE=$(curl -sS -o /dev/null -w '%{http_code}' "http://localhost:${PORT:-3000}/api/health" 2>/dev/null || echo "000")
  if [ "$CODE" = "200" ]; then
    echo "✅ /api/health retornou 200 na tentativa $i."
    HEALTHY=1
    break
  fi
  echo "  … tentativa $i: HTTP $CODE"
done

if [ "$HEALTHY" -eq 0 ]; then
  echo "❌ Health check não respondeu em 20s. Verifique logs em:"
  echo "   - pm2 logs nexus-backend --lines 100"
  echo "   - backend/logs/error.log"
  echo "   - MySQL: DB_HOST/DB_USER/DB_PASS/DB_NAME em backend/.env"
  exit 1
fi

echo ""
echo "=================================================================="
echo "  🎉 DEPLOY CONCLUÍDO COM SUCESSO NA AWS ACADEMY!"
echo "  Backend, frontend, banco e regras de negócio estão ativos."
echo "=================================================================="
echo ""
echo "Próximos passos recomendados:"
echo "  • Configure o webhook do Mercado Pago apontando para:"
echo "      POST https://<host>/api/pagamentos/webhook"
echo "    e sincronize MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET e PUBLIC_URL em backend/.env."
echo "  • Valide o rate limit do ALB/CloudFront com teste de carga leve."
echo "  • Acompanhe pm2 monit e backend/logs/ por 5 minutos após a virada."
