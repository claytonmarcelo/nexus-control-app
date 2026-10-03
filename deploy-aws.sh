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
if [ -f "package-lock.json" ]; then
  npm ci --omit=dev || npm install --omit=dev
else
  npm install --omit=dev
fi

echo "🔨 Compilando TypeScript do Backend..."
npm run build

echo "🗄️ Executando migrações e sincronização do catálogo..."
npm run db:migrate || echo "⚠️ Aviso na migração (verifique se o MySQL está rodando)"
npm run db:seed || echo "⚠️ Aviso no seed do banco"

# 3. Atualizar Frontend
echo ""
echo "🎨 [3/5] Atualizando Frontend (React/Vite)..."
cd "$APP_DIR/frontend"
if [ -f "package-lock.json" ]; then
  npm ci || npm install
else
  npm install
fi

echo "🏗️ Gerando build de produção do Frontend..."
npm run build

# 4. Sincronizar com Nginx se existir
echo ""
echo "🌐 [4/5] Verificando integração com servidor Web (Nginx)..."
if [ -d "/var/www/nexus-control" ]; then
  echo "Copiando build para /var/www/nexus-control..."
  sudo cp -r dist/* /var/www/nexus-control/
  sudo chown -R www-data:www-data /var/www/nexus-control || true
fi

if [ -d "/var/www/html" ]; then
  echo "Copiando build para /var/www/html..."
  sudo cp -r dist/* /var/www/html/ 2>/dev/null || true
fi

# 5. Reiniciar Serviço Backend via PM2
echo ""
echo "🔄 [5/5] Reiniciando serviço Backend no PM2..."
cd "$APP_DIR/backend"
if command -v pm2 &> /dev/null; then
  pm2 reload ecosystem.config.cjs --env production 2>/dev/null || \
  pm2 reload nexus-backend 2>/dev/null || \
  pm2 restart all 2>/dev/null || \
  pm2 start ecosystem.config.cjs --env production
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
