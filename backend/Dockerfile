# BUILD
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g npm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY pnpm-lock.yaml ./backend/pnpm-lock.yaml
COPY backend/tsconfig.json ./backend/tsconfig.json

COPY backend ./backend
RUN HUSKY_SKIP_INSTALL=1 pnpm --filter ./backend... install --prod --ignore-scripts --no-frozen-lockfile
RUN pnpm --filter ./backend... exec prisma generate && pnpm --filter ./backend... exec nest build

RUN echo "prune skipped"

RUN echo "deploy skipped"

# RUNTIME
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
COPY --from=build --chown=node:node /app/backend/dist ./dist
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||4000;const req=http.get({host:'127.0.0.1',port,path:'/api/health/live',timeout:4000},res=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1);});"
CMD ["node","./dist/main.js"]
