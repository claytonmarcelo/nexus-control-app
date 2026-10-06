# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Nexus Control - API (Node 20 + Express + TypeScript, MySQL)
# Build em dois estagios: compila src -> dist (tsc) e depois roda apenas o
# runtime de producao. Em producao o proprio boot executa as migracoes
# idempotentes (CREATE TABLE IF NOT EXISTS / ALTER ADD COLUMN) e sincroniza o
# catalogo - nao ha SQL destrutivo aqui.
# Nenhum segredo e gravado na imagem: tudo vem por variaveis de ambiente.
# ---------------------------------------------------------------------------

FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=development
# Dependencias primeiro para aproveitar o cache de camadas.
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# /app precisa pertencer ao usuario 'node' para o npm ci conseguir criar node_modules.
RUN chown -R node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
