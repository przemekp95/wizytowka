# Personal Portfolio Website

A full-stack portfolio application built with Next.js 16, React 19, NestJS 11, and TypeScript. The repo includes a public-facing frontend, a NestJS backend, automated tests, Docker assets, and CI suitable for production hardening.

## Description

This repository contains:

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: NestJS 11 with GraphQL and REST APIs
- **Data Layer**: MongoDB, accessed through Prisma for contact data and the MongoDB driver for portfolio data
- **Contact Flow**: persistence-backed outbox semantics, where a submission is considered successful once it is stored and accepted for asynchronous provider delivery; `resend` mode adds idempotent submission plus signed webhook confirmation
- **File Storage**: AWS S3 integration for portfolio assets
- **Internationalization**: locale-aware frontend routes and translations
- **Testing**: backend/frontend unit tests, executable Cucumber BDD scenarios, backend transport E2E, and Playwright browser E2E
- **Deployment Assets**: Docker and CI workflow definitions

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Next.js     │    │     NestJS      │    │     MongoDB     │
│   Frontend      │◄──►│     Backend     │◄──►│   Database      │
│                 │    │   GraphQL+REST  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│  Contact Form   │    │    Portfolio    │
│ Outbox/Provider │    │      Items      │
└─────────────────┘    └─────────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** 20, 22, or 24+
- **Corepack** (bundled with modern Node.js releases)
- **Docker** and Docker Compose
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/przemekp95/wizytowka.git
   cd wizytowka
   ```

2. **Install dependencies**

   ```bash
   corepack enable
   make install
   ```

   `make install` removes stale local Git hook configuration from older clones and installs all workspace dependencies with the repository-pinned pnpm version.

3. **Environment Setup**

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

4. **Database Setup**

   ```bash
   # Start MongoDB (and optional local tooling like MailHog)
   docker compose up -d mongo mailhog

   # Generate Prisma client for the backend workspace
   corepack pnpm -F backend exec prisma generate --schema prisma/schema.prisma
   ```

### Portfolio Data Workflow

Portfolio items for MongoDB are now tracked in
[`backend/scripts/portfolio.data.json`](backend/scripts/portfolio.data.json).
Use the backend scripts to sync that file with your local or remote MongoDB target selected by
`MONGODB_URI` and `MONGODB_DB`. The scripts also accept `MONGODB_URL` or
`MONGO_URL`, and they fall back to the database name embedded in the URI when
`MONGODB_DB` is omitted.

```bash
# Pull current MongoDB portfolio data into the tracked JSON file
corepack pnpm -F backend portfolio:pull

# Edit backend/scripts/portfolio.data.json locally, then push changes back
corepack pnpm -F backend portfolio:push

# Optional: also delete remote portfolio entries missing from the file
corepack pnpm -F backend portfolio:push:prune

# Reset a local MongoDB instance from the tracked file
corepack pnpm -F backend portfolio:seed
```

### Running the Application

**Development Mode:**

```bash
make dev

# Or run the workspace commands explicitly
corepack pnpm -F backend dev
corepack pnpm -F frontend dev
```

**Local container mode:**

```bash
docker compose --profile dev up -d --build
```

Production deployment should run the frontend and backend behind a managed TLS
edge or reverse proxy, with databases supplied as managed/private services and
secrets injected by the hosting platform.

**Available URLs**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **GraphQL Endpoint**: http://localhost:4000/graphql
- **GraphQL Sandbox**: http://localhost:4000/graphql (`NODE_ENV != production`)
- **Swagger Docs (REST only)**: http://localhost:4000/api/docs (`NODE_ENV != production` or `ENABLE_API_DOCS=true`)
- **GraphQL SDL Docs**: http://localhost:4000/api/graphql/schema (`NODE_ENV != production` or `ENABLE_GRAPHQL_SCHEMA_DOCS=true`)
- **Liveness Check**: http://localhost:4000/api/health/live
- **Readiness Check**: http://localhost:4000/api/health/ready

## Environment Variables

### Backend (`backend/.env`)

| Variable                                    | Description                                                                   | Example                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| `NODE_ENV`                                  | Environment mode                                                              | `development`                                 |
| `PORT`                                      | Backend port                                                                  | `4000`                                        |
| `FRONTEND_URL`                              | Primary frontend origin                                                       | `http://localhost:3000`                       |
| `CORS_ORIGINS`                              | Additional allowed origins                                                    | `http://localhost:3000,http://localhost:3001` |
| `TRUST_PROXY`                               | Trust reverse proxy for `req.ip`                                              | `false`                                       |
| `THROTTLE_STORAGE`                          | Shared throttle storage driver (`mongo` or explicit `memory`)                 | `mongo`                                       |
| `ENABLE_API_DOCS`                           | Keep REST Swagger docs enabled in production                                  | `false`                                       |
| `ENABLE_GRAPHQL_SCHEMA_DOCS`                | Keep `/api/graphql/schema` enabled in production                              | `false`                                       |
| `PUBLIC_HTTP_THROTTLE_LIMIT`                | Shared per-IP limit for public HTTP contact submissions                       | `30`                                          |
| `PUBLIC_HTTP_THROTTLE_TTL_MS`               | Window for the public HTTP contact limit                                      | `60000`                                       |
| `CHAT_HTTP_THROTTLE_LIMIT`                  | Per-IP limit for the public chat HTTP endpoint                                | `20`                                          |
| `CHAT_HTTP_THROTTLE_TTL_MS`                 | Window for the public chat HTTP limit                                         | `60000`                                       |
| `CHAT_HTTP_GLOBAL_THROTTLE_LIMIT`           | Shared global ceiling for paid chat completions across all clients            | `100`                                         |
| `CHAT_HTTP_GLOBAL_THROTTLE_TTL_MS`          | Window for the global paid-chat ceiling                                       | `60000`                                       |
| `INTERNAL_PROXY_SHARED_SECRET`              | Shared HMAC secret for signed client IP forwarding from the frontend proxy    | `change-me`                                   |
| `MONGODB_URI`                               | Preferred MongoDB connection string (`MONGODB_URL` / `MONGO_URL` also work)   | `mongodb://localhost:27017/wizytowka`         |
| `MONGODB_DB`                                | MongoDB database name (falls back to the database in the URI)                 | `wizytowka`                                   |
| `CONTACT_NOTIFICATION_PROVIDER`             | Contact delivery transport (`smtp` or `resend`)                               | `smtp`                                        |
| `SMTP_HOST`                                 | SMTP server host when `CONTACT_NOTIFICATION_PROVIDER=smtp`                    | `localhost`                                   |
| `SMTP_PORT`                                 | SMTP port                                                                     | `1025`                                        |
| `SMTP_SECURE`                               | SMTP TLS flag                                                                 | `false`                                       |
| `SMTP_FROM`                                 | Sender address for contact emails, reused by SMTP and Resend modes            | `portfolio@example.com`                       |
| `SMTP_TO`                                   | Recipient address for contact emails, reused by SMTP and Resend modes         | `owner@example.com`                           |
| `SMTP_USER`                                 | Optional SMTP username                                                        | `mailer@example.com`                          |
| `SMTP_PASS`                                 | Optional SMTP password                                                        | `super-secret`                                |
| `SMTP_DEBUG`                                | Enable verbose nodemailer transport logs                                      | `false`                                       |
| `RESEND_API_KEY`                            | Resend API key used when `CONTACT_NOTIFICATION_PROVIDER=resend`               | `re_...`                                      |
| `RESEND_WEBHOOK_SECRET`                     | Svix signing secret for `POST /api/contact/webhooks/resend`                   | `whsec_...`                                   |
| `CONTACT_NOTIFICATION_DISPATCH_ENABLED`     | Enable the background contact notification dispatcher                         | `true`                                        |
| `CONTACT_NOTIFICATION_DISPATCH_INTERVAL_MS` | Poll interval for queued contact notifications                                | `1000`                                        |
| `CONTACT_NOTIFICATION_DISPATCH_BATCH_SIZE`  | Max queued notifications claimed per dispatcher tick                          | `10`                                          |
| `CONTACT_NOTIFICATION_LEASE_MS`             | Lease timeout before another worker can retry an in-flight notification       | `30000`                                       |
| `CONTACT_NOTIFICATION_MAX_ATTEMPTS`         | Max asynchronous delivery attempts before marking a notification failed       | `5`                                           |
| `CONTACT_NOTIFICATION_BASE_DELAY_MS`        | Base delay for exponential retry backoff                                      | `30000`                                       |
| `CONTACT_NOTIFICATION_MAX_DELAY_MS`         | Maximum delay for exponential retry backoff                                   | `900000`                                      |
| `CONTACT_NOTIFICATION_SUBMITTED_RECHECK_MS` | Delay before re-checking stale Resend `submitted` notifications               | `300000`                                      |
| `CONTACT_NOTIFICATION_SUBMITTED_TIMEOUT_MS` | Max age of a Resend `submitted` notification before it is failed as timed out | `86400000`                                    |
| `CONTACT_DATA_RETENTION_ENABLED`             | Enable the automatic contact-data retention worker                           | `true`                                        |
| `CONTACT_DATA_RETENTION_DAYS`                | Maximum retention for contact messages, IPs, and related webhook records      | `90`                                          |
| `CONTACT_RETENTION_SWEEP_INTERVAL_MS`        | Interval between automatic contact-data retention sweeps                      | `3600000`                                     |
| `ADMIN_TOKEN`                               | Admin bearer token, or a comma-separated token set for zero-downtime rotation | `current-token,next-token`                    |
| `OPENAI_API_KEY`                            | Optional chat integration key                                                 | `sk-...`                                      |
| `CHAT_SESSION_RETENTION_MS`                  | Maximum in-memory retention for chat sessions                                 | `86400000`                                    |
| `AWS_REGION`                                | AWS region                                                                    | `us-east-1`                                   |
| `AWS_ACCESS_KEY_ID`                         | AWS access key                                                                | `AKIA...`                                     |
| `AWS_SECRET_ACCESS_KEY`                     | AWS secret key                                                                | `your-secret`                                 |
| `AWS_S3_BUCKET_NAME`                        | S3 bucket name                                                                | `your-bucket`                                 |

### Frontend (`frontend/.env.local`)

| Variable                               | Description                                                                         | Example                         |
| -------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------- |
| `BACKEND_GRAPHQL_URL`                  | Backend GraphQL endpoint for server route handlers/codegen                          | `http://localhost:4000/graphql` |
| `BACKEND_API_URL`                      | Backend origin for server-side REST fetches and proxies                             | `http://localhost:4000`         |
| `INTERNAL_PROXY_SHARED_SECRET`         | Same shared secret as the backend for signed client IP forwarding                   | `change-me`                     |
| `INTERNAL_PROXY_CLIENT_IP_HEADER`      | Trusted platform IP header to sign (`cf-connecting-ip` or `x-vercel-forwarded-for`) | `cf-connecting-ip`              |
| `SITE_URL`                             | Public site URL for sitemap and metadata                                            | `http://localhost:3000`         |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional Search Console verification token                                          | `token`                         |

## Project Structure

```
wizytowka/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── app.module.ts   # Main application module
│   │   ├── contact/        # Contact form functionality
│   │   ├── portfolio/      # Portfolio management
│   │   ├── graphql/        # GraphQL resolvers
│   │   └── prisma/         # Database service
│   ├── test/               # Backend tests
│   └── prisma/
│       └── schema.prisma   # Database schema
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # Reusable React components
│   │   ├── graphql/       # GraphQL queries
│   │   └── lib/           # Utility functions
│   ├── test/              # Frontend tests
│   └── public/            # Static assets
├── docker-compose.yml     # Docker Compose setup
└── .github/workflows/     # CI/CD pipelines
```

## Available Scripts

### Backend Scripts

```bash
# Development
corepack pnpm -F backend dev          # Start with hot reload
corepack pnpm -F backend start:prod   # Start production build

# Building
corepack pnpm -F backend build        # Build for production
corepack pnpm -F backend format       # Format code with Prettier
corepack pnpm -F backend lint         # Run ESLint
corepack pnpm -F backend lint:fix     # Run ESLint with autofix
corepack pnpm -F backend typecheck    # Run TypeScript type checking

# Testing
corepack pnpm -F backend test         # Run unit tests
corepack pnpm -F backend test:bdd     # Run backend Gherkin scenarios
corepack pnpm -F backend test:e2e     # Run E2E tests
corepack pnpm -F backend test:cov     # Run tests with coverage

# Database
corepack pnpm -F backend exec prisma migrate dev
corepack pnpm -F backend exec prisma db push
corepack pnpm -F backend exec prisma generate
corepack pnpm -F backend exec prisma studio

# Portfolio data sync
corepack pnpm -F backend portfolio:pull
corepack pnpm -F backend portfolio:push
corepack pnpm -F backend portfolio:push:prune
corepack pnpm -F backend portfolio:seed
```

### Frontend Scripts

```bash
# Development
corepack pnpm -F frontend dev         # Start development server
corepack pnpm -F frontend build       # Build for production
corepack pnpm -F frontend start       # Start production server

# Code Quality
corepack pnpm -F frontend lint        # Run ESLint
corepack pnpm -F frontend lint:fix    # Run ESLint with autofix + Prettier
corepack pnpm -F frontend format      # Format code
corepack pnpm -F frontend typecheck   # TypeScript type checking

# Testing
corepack pnpm -F frontend test        # Run unit tests
corepack pnpm -F frontend test:watch  # Run tests in watch mode
corepack pnpm -F frontend test:e2e    # Run Playwright E2E tests
corepack pnpm -F frontend coverage    # Run tests with coverage
```

### Workspace Checks

```bash
corepack pnpm lint         # Generate Prisma client, then lint every workspace
corepack pnpm typecheck    # Run TypeScript checks in every workspace
corepack pnpm test:unit    # Run backend and frontend unit tests
corepack pnpm test:bdd     # Run executable Cucumber scenarios
corepack pnpm test:e2e     # Run backend transport and Playwright browser E2E
corepack pnpm check        # Run lint + typecheck + build + unit + BDD + E2E
```

## Engineering Conventions

- **TDD**: for behavior changes, prefer starting with the smallest failing test.
- **Architecture**: the backend is a layered, ports-and-adapters hybrid rather
  than a complete DDD implementation. Contact keeps notification lifecycle
  rules in the domain layer and persistence/provider access behind ports; chat
  and portfolio retain lighter application/infrastructure boundaries.
- **BDD**: user-visible backend behavior should be captured in
  `backend/features/**/*.feature` and executed with
  `corepack pnpm -F backend test:bdd`. Contact and chat are covered there now.

## APIs

### REST API Endpoints

| Method | Endpoint                | Description                                |
| ------ | ----------------------- | ------------------------------------------ |
| GET    | `/api`                  | Basic hello endpoint                       |
| GET    | `/api/health`           | Process health snapshot                    |
| GET    | `/api/health/live`      | Process liveness check                     |
| GET    | `/api/health/ready`     | Dependency readiness check                 |
| GET    | `/api/portfolio`        | Get portfolio items                        |
| POST   | `/api/portfolio`        | Create portfolio item (admin bearer token) |
| PATCH  | `/api/portfolio/:id`    | Update portfolio item (admin bearer token) |
| DELETE | `/api/portfolio/:id`    | Delete portfolio item (admin bearer token) |
| POST   | `/api/contact`          | Public contact submission                  |
| POST   | `/api/chat/message`     | Chat message endpoint                      |
| GET    | `/api/contact/messages` | Get contact messages (admin bearer token)  |
| GET    | `/api/links`            | List external links                        |
| GET    | `/api/links/r/:slug`    | Redirect to external link                  |

### GraphQL Schema

The GraphQL API is documented through its schema and GraphQL-native tooling, not through OpenAPI.

- Runtime endpoint: `http://localhost:4000/graphql`
- Interactive explorer: Apollo Sandbox on `/graphql` outside production
- Runtime SDL docs: `http://localhost:4000/api/graphql/schema`
- Build artifact snapshot: [`backend/schema.gql`](backend/schema.gql)
- Swagger at `/api/docs` intentionally documents REST only

In `NODE_ENV=production`, Apollo Sandbox and GraphQL introspection stay disabled. `/api/docs` and `/api/graphql/schema` are also hidden by default unless you explicitly set `ENABLE_API_DOCS=true` or `ENABLE_GRAPHQL_SCHEMA_DOCS=true`. Use [`backend/schema.gql`](backend/schema.gql) as the default offline schema snapshot.

Current public operations:

- `Query.hello`
- `Mutation.sendContact(input: ContactMessageInput!): ContactResult!`

Example query:

```graphql
mutation SendContact($input: ContactMessageInput!) {
  sendContact(input: $input) {
    ok
    error
  }
}
```

Example introspection query:

```graphql
query GraphqlDocs {
  __schema {
    queryType {
      name
    }
    mutationType {
      name
    }
    types {
      name
      description
    }
  }
}
```

## Testing

Run the complete local quality gate (including unit, executable BDD, backend
E2E, and browser E2E):

```bash
corepack pnpm check
```

Test ownership is intentionally split to avoid duplicate scenarios:

- unit tests cover domain/application rules and adapter edge cases;
- executable BDD owns visitor-facing contact and chat behavior;
- backend E2E owns transport and infrastructure contracts such as GraphQL,
  authorization, throttling, signed proxy metadata, health, and webhooks;
- Playwright owns browser flows, accessibility, and SEO behavior.

Playwright owns isolated local ports `3100` (frontend) and `4100` (backend) and
does not reuse unrelated development servers. Override them with
`E2E_FRONTEND_PORT` and `E2E_BACKEND_PORT` when necessary.

## Operational Notes

- Frontend browser requests use same-origin `/api/contact` and `/api/chat` route handlers; the browser no longer talks to backend absolute URLs directly.
- The frontend does not load third-party analytics. Search Console verification, when configured, is metadata only.
- Frontend same-origin `/api/contact` and `/api/chat` route handlers can forward a signed client IP only when `INTERNAL_PROXY_SHARED_SECRET` is set on both apps and `INTERNAL_PROXY_CLIENT_IP_HEADER` points to a trusted platform header such as `cf-connecting-ip` or `x-vercel-forwarded-for`.
- `/api/health/ready` returns `200` only when Prisma and MongoDB are healthy; otherwise it returns `503` with dependency details.
- `/api/contact/messages` requires `Authorization: Bearer ${ADMIN_TOKEN}`.
- `POST /api/portfolio`, `PATCH /api/portfolio/:id`, and `DELETE /api/portfolio/:id` also require `Authorization: Bearer ${ADMIN_TOKEN}`.
- Public `POST /api/contact`, GraphQL `sendContact`, and `POST /api/chat/message` are rate-limited per tracker using the shared throttle storage.
- `POST /api/contact` and GraphQL `sendContact` return success once the message is persisted and accepted for async delivery, not when the owner mailbox has already received it.
- When `CONTACT_NOTIFICATION_PROVIDER=resend`, background delivery is submitted with an idempotency key and finalized through signed callbacks on `POST /api/contact/webhooks/resend`.
- If a Resend callback is delayed or lost, the dispatcher periodically reconciles stale `submitted` records through `GET /emails/:id` until they reach a terminal state.
- If confirmation still cannot be obtained before `CONTACT_NOTIFICATION_SUBMITTED_TIMEOUT_MS`, the notification is marked as failed instead of remaining in `submitted` forever.
- Contact form content, stored IP/request metadata, and related webhook records are deleted after `CONTACT_DATA_RETENTION_DAYS` (90 days by default).
- `/api/chat/message` is always mounted; when `OPENAI_API_KEY` is missing it returns `503` with `{ error, code: "CHAT_UNAVAILABLE" }`.
- Chat text is sent to OpenAI when chat is enabled; server-side sessions remain in memory for at most `CHAT_SESSION_RETENTION_MS` (24 hours by default) and are not persisted by the application.
- Portfolio image uploads only accept JPEG, PNG, and WebP up to `5 MiB`; both the declared MIME type and file signature are verified before upload.
- JSON proxy and backend bodies are capped at `16 KiB`. The portfolio multipart upload keeps its separate `5 MiB` file limit.
- Chat session continuation accepts only opaque UUIDv4 identifiers generated by the backend. Per-IP throttling is supplemented by a shared global completion ceiling.
- GraphQL contact throttling uses shared Mongo-backed storage by default; use `THROTTLE_STORAGE=memory` only for isolated local/test scenarios.
- GraphQL schema documentation lives in [`backend/schema.gql`](backend/schema.gql); the runtime `/api/graphql/schema` endpoint and `/api/docs` stay disabled by default in production.
CI reports unit-test coverage and requires lint, typecheck, build, unit, BDD,
backend E2E, and browser E2E to pass. The repository does not currently enforce
a numeric coverage threshold.

## Deployment

### Container Deployment

```bash
# Local integration environment
cp compose.env.example .env
# Fill every required value in .env with a fresh local secret.
docker compose --profile dev up -d --build
```

The Compose file is a local integration environment, not a production
deployment recipe. In production, keep databases off public ports and place the
application services behind TLS and request-size/rate-limit controls.

### Vercel + Render production baseline

- Vercel terminates TLS for `pietrzakprzemyslaw.pl`; keep the HTTP-to-HTTPS
  redirect, HSTS, and automatic platform DDoS mitigations enabled.
- Protect `POST /api/contact` and `POST /api/chat` with one IP-keyed Vercel WAF
  rate-limit rule (40 requests per 60 seconds across both paths). This outer
  ceiling protects the frontend functions; the stricter endpoint-specific and
  global application limits remain authoritative.
- Configure Vercel with `BACKEND_API_URL`, `BACKEND_GRAPHQL_URL`,
  `SITE_URL=https://pietrzakprzemyslaw.pl`,
  `INTERNAL_PROXY_CLIENT_IP_HEADER=x-vercel-forwarded-for`, and a generated
  `INTERNAL_PROXY_SHARED_SECRET`.
- Configure Render with `TRUST_PROXY=true`, `THROTTLE_STORAGE=mongo`, the
  documented public/chat limits, and the same `INTERNAL_PROXY_SHARED_SECRET`.
  MongoDB throttling must remain fail-closed when its shared storage is
  unavailable.
- Rotate the proxy secret on both providers in one maintenance window. Never
  place the value in Git, build logs, client-visible variables, or issue/PR
  text.
- Apply provider variables before deploying the matching code, publish the WAF
  draft after the deployment is healthy, then verify HTTPS, security headers,
  readiness, same-origin contact/chat behavior, and `429` responses.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Bootstrap locally with `corepack enable` and `make install`
5. Run workspace checks with `corepack pnpm check`
6. Commit your changes: `git commit -m 'feat: add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## Branch Maintenance

- `main` and `dev` are the only long-lived branches.
- Branches merged through GitHub are deleted automatically after merge.
- Stale branches older than 14 days should be archived with an `archive/YYYYMMDD/<branch>` tag and then removed.

### Commit Convention

This project uses [Conventional Commits](https://conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation update
style: code style changes
refactor: code refactoring
test: add tests
chore: maintenance
```

## Security

- Rate limiting for public contact and chat endpoints
- Input validation with `class-validator` and GraphQL DTO metadata
- CORS configuration on the backend API
- Helmet security headers on the backend
- GraphQL CSRF prevention enabled in Apollo Server
- Bearer-token protection for ops and portfolio mutation endpoints

## Performance

- Next.js App Router static generation where applicable
- Image optimization with next/image
- Code splitting and lazy loading
- Database query optimization
- CDN integration for static assets

## Operations & Logging

- Structured logging with Winston
- Health checks implemented
- Database query logging

## License

No license file is currently included. Do not assume permission to redistribute
or reuse the source without authorization from the repository owner.

## Acknowledgments

- **Next.js** - The React framework for production
- **NestJS** - A progressive Node.js framework
- **Prisma** - Next-generation ORM for TypeScript
- **Tailwind CSS** - A utility-first CSS framework
- **MongoDB** - NoSQL database
- **Docker** - Containerization platform
- **TypeScript** - Typed JavaScript

## Author

**Przemysław Pietrzak**

- GitHub: [@przemekp95](https://github.com/przemekp95)
- LinkedIn: [[LinkedIn Profile]](https://www.linkedin.com/in/przempietrzak/)
- Email: contact@ppsolutions.com.pl
