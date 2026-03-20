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
- `SITE_URL` - public site URL for sitemap and metadata
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - optional GA4 ID

## Testing Notes

- Playwright is the only maintained browser E2E path.
- Contact form and chat submit through same-origin `/api/contact` and `/api/chat` routes.
