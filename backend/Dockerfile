# --- build ---
FROM node:20-alpine AS build
WORKDIR /app

# 1) deps (pełne – z dev, bo potrzebny jest CLI prisma)
COPY package*.json ./
RUN npm install

# 2) schema Prisma + generate (musi być PRZED buildem)
COPY prisma ./prisma
RUN npx prisma generate

# 3) reszta kodu i build Nesta
COPY . .
RUN npm run build

# 4) zredukuj deps do produkcyjnych (klient już wygenerowany)
RUN npm prune --omit=dev

# --- runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# kopiujemy ZREDUKOWANE node_modules (z wygenerowanym klientem)
COPY --from=build /app/node_modules ./node_modules

# artefakty buildu
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node","dist/main.js"]
