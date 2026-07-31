# Backend

NestJS backend for the portfolio site. It exposes the public contact and chat
APIs, portfolio read endpoints, admin or ops endpoints, and the provider-backed
contact notification flow.

## Scripts

- `pnpm dev` - run the backend in watch mode
- `pnpm build` - production build
- `pnpm start` - run the compiled app
- `pnpm lint` - ESLint check
- `pnpm typecheck` - TypeScript check
- `pnpm test` - unit and integration tests
- `pnpm test:e2e` - HTTP and GraphQL e2e tests
- `pnpm test:bdd` - Cucumber feature scenarios

## Environment

Create `backend/.env` from [`backend/.env.example`](./.env.example).

Supported Node runtimes for backend tooling are `20`, `22`, and `24+`.

Important groups:

- app and transport config used by Nest bootstrap
- portfolio persistence and asset storage config
- contact notification provider config for `smtp` or `resend`
- automatic contact-data retention (90 days by default) and in-memory chat-session retention (24 hours by default)
- optional shared-secret config for trusted proxy throttling
- a shared global chat-completion ceiling in addition to the per-IP chat limit

## Structure

- `src/chat` - public chat flow and OpenAI-backed completion adapters
- `src/contact` - contact submission flow, persisted outbox, provider adapters, and webhook confirmation
- `src/portfolio` - public portfolio reads and storage adapters
- `test` - e2e coverage for REST, GraphQL, OpenAPI, throttling, and ops auth
- `features` - executable BDD scenarios for contact and chat flows

Public JSON request bodies are capped at 16 KiB. Portfolio uploads have a
separate 5 MiB limit and are accepted only when their JPEG, PNG, or WebP file
signature matches the declared MIME type.

Project-wide architecture notes live in the repository root `README.md` and
`ARCHITECTURE.md`.
