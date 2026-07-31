# Frontend

Next.js 16 frontend for the portfolio site. It serves the locale-aware onepager, contact form, chat widget, and browser tests.

## Scripts

- `pnpm dev` - run the app locally
- `pnpm build` - production build
- `pnpm start` - run the production build
- `pnpm lint` - ESLint and Prettier check
- `pnpm typecheck` - TypeScript check
- `pnpm test` - Vitest unit tests
- `pnpm test:e2e` - Playwright browser tests

## Environment

Create `frontend/.env.local` from [`frontend/.env.example`](./.env.example).

- `BACKEND_GRAPHQL_URL` - backend GraphQL endpoint used by server route handlers and codegen
- `BACKEND_API_URL` - backend origin used by server fetches and route handlers
- `INTERNAL_PROXY_SHARED_SECRET` - optional shared secret used by `/api/contact` and `/api/chat` to forward a signed client IP to the backend
- `INTERNAL_PROXY_CLIENT_IP_HEADER` - optional trusted platform header to sign, limited to `cf-connecting-ip` or `x-vercel-forwarded-for`; leave unset to disable client-IP forwarding instead of trusting browser-controlled headers
- `SITE_URL` - public site URL for sitemap and metadata

## Testing Notes

- Playwright is the only maintained browser E2E path.
- Playwright starts isolated servers on ports 3100 and 4100 and never reuses an unrelated local server.
- Contact form and chat submit through same-origin `/api/contact` and `/api/chat` routes.
- Both proxy routes require JSON, stream at most 16 KiB, and return generic upstream errors.
- Dynamic pages receive a per-request CSP nonce; scripts no longer depend on `unsafe-inline`.
- The security boundary currently uses the compatible `src/middleware.ts` convention because Vercel CLI 58.x expects its traced middleware artifact; migrate back to `src/proxy.ts` only after `vercel build` accepts the Next.js 16 proxy output.
- No third-party analytics is loaded. Contact data is retained for at most 90 days by default; chat text is sent to OpenAI and its application session is retained in memory for at most 24 hours by default.
