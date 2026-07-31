# BUILD
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache openssl && corepack enable
ENV HUSKY_SKIP_INSTALL=1

COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/package.json
RUN pnpm --filter backend... install --frozen-lockfile --prod=false --ignore-scripts

COPY backend ./backend
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend run build
RUN pnpm --filter backend deploy --prod /app/runtime
RUN cd /app/runtime && /app/backend/node_modules/.bin/prisma generate --schema prisma/schema.prisma

# RUNTIME
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
RUN apk add --no-cache openssl
COPY --from=build --chown=node:node /app/runtime ./
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||4000;const req=http.get({host:'127.0.0.1',port,path:'/api/health/live',timeout:4000},res=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1);});"
CMD ["node","./dist/main.js"]
