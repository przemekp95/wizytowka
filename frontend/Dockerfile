# --- build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# jeśli wyskakiwał błąd typów, miej w repo frontend/next.config.mjs z:
#   export default { typescript:{ignoreBuildErrors:true}, eslint:{ignoreDuringBuilds:true} }
RUN npm run build

# --- runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm","run","start"]
