FROM node:20-alpine AS build
WORKDIR /workspace
# Enable PNPM (workspace-based monorepo)
RUN corepack enable

# Install all workspace dependencies from root manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
RUN pnpm install --frozen-lockfile --filter frontend

# Copy frontend sources and build using the workspace
COPY frontend ./frontend
WORKDIR /workspace
RUN cd frontend && pnpm install --frozen-lockfile && npm run build

FROM node:20-alpine AS runtime
WORKDIR /workspace
ENV NODE_ENV=production
ENV PORT=3000
ENV HUSKY_SKIP_INSTALL=1
RUN corepack enable

# Install production dependencies for the workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Bring in the built frontend assets
COPY --from=build /workspace/frontend/.next ./frontend/.next
COPY --from=build /workspace/frontend/public ./frontend/public
COPY --from=build /workspace/frontend/next.config.mjs ./frontend/next.config.mjs

WORKDIR /workspace/frontend
EXPOSE 3000
CMD [\"pnpm\",\"start\"]
