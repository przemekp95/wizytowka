FROM node:20-alpine AS build
WORKDIR /workspace
RUN corepack enable
ENV CYPRESS_INSTALL_BINARY=0

COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/package.json
RUN pnpm --filter ./frontend... install --frozen-lockfile

COPY frontend ./frontend
RUN pnpm --filter ./frontend... run build

FROM node:20-alpine AS runtime
WORKDIR /workspace
ENV NODE_ENV=production
ENV PORT=3000
ENV HUSKY_SKIP_INSTALL=1
RUN corepack enable

COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/package.json
RUN pnpm --filter ./frontend... install --frozen-lockfile --prod --ignore-scripts

COPY --from=build --chown=node:node /workspace/frontend/.next ./frontend/.next
COPY --from=build --chown=node:node /workspace/frontend/public ./frontend/public
COPY --from=build --chown=node:node /workspace/frontend/next.config.ts ./frontend/next.config.ts

WORKDIR /workspace/frontend
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3000;const req=http.get({host:'127.0.0.1',port,path:'/sitemap.xml',timeout:4000},res=>process.exit(res.statusCode>=200&&res.statusCode<400?0:1));req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1);});"
CMD ["pnpm","start"]
