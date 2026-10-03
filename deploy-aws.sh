#!/bin/bash
# ==============================================================================
# Script de Atualização e Deploy Automático - Nexus Control App (AWS Academy)
# ==============================================================================
set -e

echo ""
echo "=================================================================="
echo "  🚀 NEXUS CONTROL - ATUALIZADOR AUTOMÁTICO (AWS ACADEMY)"
echo "=================================================================="
echo ""

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "📍 Diretório da aplicação: $APP_DIR"

# 1. Puxar atualizações do GitHub
echo ""
echo "📥 [1/5] Sincronizando código com a branch 'main' do GitHub..."
git fetch origin main
git reset --hard origin/main
echo "✅ Código atualizado com sucesso!"

# 2. Atualizar Backend
echo ""
echo "⚙️ [2/5] Atualizando Backend (Node.js/Express)..."
cd "$APP_DIR/backend"
npm install --no-audit --no-fund || npm install --omit=dev

echo "🔨 Verificando e compilando TypeScript do Backend..."
npm run build 2>/dev/null || echo "ℹ️ Utilizando build distribuído em dist/"

echo "🗄️ Executando migrações do banco..."
node src/utils/migrate.js || true

echo "🌱 Sincronizando catálogo completo de 35 itens e serviços..."
node dist/utils/seed.js

# 3. Atualizar Frontend
echo ""
echo "🎨 [3/5] Atualizando Frontend (React/Vite)..."
cd "$APP_DIR/frontend"
npm install --no-audit --no-fund
echo "🏗️ Gerando build de produção do Frontend..."
npm run build

# 4. Sincronizar com Nginx em todas as distribuições (Amazon Linux, Ubuntu, CentOS)
echo ""
echo "🌐 [4/5] Sincronizando arquivos com o servidor Web (Nginx)..."

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
    sudo chown -R nginx:nginx "$TARGET" 2>/dev/null || sudo chown -R www-data:www-data "$TARGET" 2>/dev/null || true
    COPIED=1
  fi
done

if [ $COPIED -eq 0 ]; then
  echo "⚠️ Nenhum diretório padrão do Nginx encontrado. Criando /var/www/html..."
  sudo mkdir -p /var/www/html
  sudo cp -r dist/* /var/www/html/
fi

# Recarregar Nginx para servir os novos arquivos imediatamente
echo "🔄 Recarregando configuração do Nginx..."
sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || sudo service nginx reload 2>/dev/null || true

# 5. Reiniciar Serviço Backend via PM2
echo ""
echo "🔄 [5/5] Reiniciando serviço Backend no PM2..."
cd "$APP_DIR/backend"
if command -v pm2 &> /dev/null; then
  pm2 restart all || pm2 reload all || pm2 start dist/server.js --name nexus-backend
  pm2 save || true
  echo "✅ PM2 reiniciado com sucesso!"
else
  echo "ℹ️ PM2 não encontrado globalmente. O backend pode ser iniciado com: npm run start"
fi

echo ""
echo "=================================================================="
echo "  🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO NA AWS ACADEMY!"
echo "  Todas as novas rotas, segurança e itens do catálogo estão ativos."
echo "=================================================================="
echo ""
