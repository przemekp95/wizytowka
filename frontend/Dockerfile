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

COPY --from=build /workspace/frontend/.next ./frontend/.next
COPY --from=build /workspace/frontend/public ./frontend/public
COPY --from=build /workspace/frontend/next.config.ts ./frontend/next.config.ts

WORKDIR /workspace/frontend
EXPOSE 3000
CMD ["pnpm","start"]
