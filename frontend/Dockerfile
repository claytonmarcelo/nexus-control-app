# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Nexus Control - Frontend (React + Vite), servido por Nginx.
# Build em dois estagios: gera o bundle estatico (dist) e depois serve via
# Nginx com fallback de SPA e proxy reverso de /api para o backend.
# ---------------------------------------------------------------------------

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_API_URL fica vazio por padrao: em Docker o app fala com a API via /api
# (proxy do Nginx) ou, no navegador em localhost, com http://localhost:3000/api.
# Defina este ARG apenas se a API publica tiver outra URL absoluta.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
