# Image du site : build Angular (contenu + prérendu), puis runtime Node minimal.
FROM node:26-alpine3.24 AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Lance d'abord scripts/contenu.mjs (prebuild) : un contenu invalide fait échouer l'image.
RUN npm run build

FROM node:26-alpine3.24 AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Le serveur SSR est autonome : ses dépendances (Express…) sont incluses dans le bundle.
COPY --from=builder /app/dist/connaissances-univers ./dist/connaissances-univers

USER node
EXPOSE 4000
CMD ["node", "dist/connaissances-univers/server/server.mjs"]
