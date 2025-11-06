# ---------- BUILD ----------
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g npm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY pnpm-lock.yaml ./backend/pnpm-lock.yaml
COPY backend/tsconfig.json ./backend/tsconfig.json

RUN pnpm fetch --prod --filter ./backend...

COPY backend ./backend
RUN HUSKY_SKIP_INSTALL=1 pnpm --filter ./backend... install --offline --prod --ignore-scripts --no-frozen-lockfile
RUN npm install -g @nestjs/cli && (cd backend && nest build)
RUN echo "prune skipped"

RUN echo "deploy skipped"

# ---------- RUNTIME ----------
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=build /app/backend/dist ./dist
EXPOSE 3000
CMD ["node","./dist/main.js"]  # w distroless entrypoint to `node`, więc wystarczy ścieżka do pliku
