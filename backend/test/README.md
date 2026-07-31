# Backend E2E tests

These Jest and Supertest suites verify transport-level contracts: REST,
GraphQL, Apollo CSRF, CORS, auth, throttling, health responses, upload bounds,
and signed webhooks.

Run them from the repository root with `corepack pnpm test:e2e:backend`.
Executable visitor behavior is kept separately in `backend/features` and runs
with `corepack pnpm test:bdd`.
