# System Architecture

## High-Level View

```
┌─────────────────────────────────────────────────────────────┐
│                     Wizytówka System                        │
│                Personal Portfolio Website                   │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     User Layer                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   Browser       │ │   React SPA    │ │   REST/GraphQL  │ │
│  │   (Chrome/etc)  │ │   (Next.js)    │ │   Client         │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   Next.js 16    │ │   NestJS API    │ │ Access Control  │ │
│  │   Frontend      │ │   Backend       │ │  (Admin Token)  │ │
│  │                 │ │   TypeScript    │ │                 │ │
│  │   - App Router  │ │   - Controllers │ │ - Bearer token  │ │
│  │   - React 19    │ │   - Services    │ │ - Endpoint auth │ │
│  │   - TailwindCSS │ │   - GraphQL     │ │                 │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   MongoDB       │ │ Prisma + Mongo  │ │   AWS S3        │ │
│  │   App Data      │ │   Data Access   │ │   Files         │ │
│  │                 │ │                 │ │                 │ │
│  │   - Portfolio   │ │ - Contact data  │ │   - Static      │ │
│  │   - Contact     │ │ - Shared schema │ │   - CDN         │ │
│  │   - Aggregation │ │ - Type safety   │ │                 │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   Docker        │ │ Managed Hosting │ │   Edge / DNS    │ │
│  │   Containers    │ │   App Runtime   │ │   TLS / Limits  │ │
│  │                 │ │                 │ │                 │ │
│  │   - Multi-stage │ │   - Frontend    │ │   - HTTPS       │ │
│  │   - Local stack │ │   - Backend     │ │   - Rate limits │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 Development & Operations                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   GitHub CI/CD  │ │   Testing       │ │   Operations    │ │
│  │   Pipelines     │ │   Suite         │ │   Checks        │ │
│  │                 │ │                 │ │                 │ │
│  │   - Lint/Test   │ │   - Jest         │ │   - Winston     │ │
│  │   - Build/Deploy│ │   - E2E         │ │   - Health checks│ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture

```
src/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx               # Root layout with error boundaries
│   ├── page.tsx                 # Homepage
│   ├── [locale]/                # Internationalization routes
│   └── _components/             # Page components
│       ├── ContactForm.tsx      # Contact form with accessibility
│       ├── Header.tsx          # Navigation header
│       └── LanguageSwitcher.tsx # i18n switcher
├── components/                  # Shared components
│   ├── ErrorBoundary.tsx        # Error handling boundary
│   └── ui/                      # UI primitives (shadcn/ui)
├── lib/                         # Utilities
├── graphql/                     # GraphQL queries/client
├── i18n/                        # Internationalization
└── types/                       # TypeScript definitions
```

### Backend Architecture

```
src/
├── app.module.ts               # Root application module
├── main.ts                     # Application bootstrap
├── common/                     # Shared utilities and guards
├── contact/                    # Contact form handling
│   ├── application/            # Use cases + ports
│   ├── domain/                 # ContactSubmission + notification lifecycle rules
│   ├── infrastructure/         # Prisma + provider + dispatch/webhook adapters
│   ├── contact.controller.ts   # REST endpoints
│   ├── contact.service.ts      # Application service facade
│   ├── contact.resolver.ts     # GraphQL resolvers
│   └── dto/                    # Transport DTOs
├── chat/                       # AI assistant behavior
│   ├── application/            # Chat ports
│   ├── domain/                 # Conversation model
│   ├── infrastructure/         # OpenAI/context/session adapters
│   ├── chat.controller.ts      # REST endpoint
│   └── chat.service.ts         # Application service facade
├── portfolio/                  # Portfolio management
│   ├── application/            # Use cases + ports
│   ├── domain/                 # Portfolio aggregate and rules
│   ├── infrastructure/         # Mongo + S3 adapters
│   ├── portfolio.controller.ts # API endpoints
│   └── portfolio.service.ts    # Application service facade
├── prisma/                     # Database service
├── graphql/                    # GraphQL module
└── config/                     # Configuration modules
```

## Technology Stack Details

### Frontend Stack

- **Framework**: Next.js 16 (React 19, App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **Data Fetching**: App Router `fetch`, route handlers, and same-origin proxy routes
- **Internationalization**: next-intl

### Backend Stack

- **Framework**: NestJS 11 (Node.js)
- **Language**: TypeScript 5.9
- **Database**: MongoDB via Prisma and the MongoDB driver
- **API**: REST + GraphQL
- **Authentication**: `ADMIN_TOKEN` bearer header on protected admin endpoint(s)
- **File Storage**: AWS S3

### DevOps Stack

- **Containerization**: Docker + Docker Compose
- **Runtime**: provider-managed frontend and backend services or containers
- **CI/CD**: GitHub Actions
- **Testing**: Jest + Playwright + Vitest
- **Security**: Helmet + CORS + CSP
- **Operations**: Winston structured logs and health checks

## Deployment Architecture

### Development Environment

```
Local Machine
├── VS Code + Extensions
├── Node.js 20, 22 or 24+ + pnpm
├── Docker Desktop
├── Git
├── MongoDB and optional local tooling containers
└── Insomnia/Postman for API testing
```

### Production Environment

```
Managed TLS edge / reverse proxy
├── Frontend service (Next.js)
│   ├── App Router pages and route handlers
│   ├── Static generation where possible
│   └── Same-origin API proxies
├── Backend service (NestJS)
│   ├── REST/GraphQL APIs
│   ├── Health checks
│   └── Background contact dispatcher
└── Private managed dependencies
    ├── MongoDB
    ├── Object storage
    └── Secret management
```

## Data Flow

### Contact Form Submission

```
1. User submits form → Next.js Client
    ↓   Validation (client-side)
2. GraphQL mutation / REST POST → NestJS API
    ↓   Validation + anti-abuse checks
3. Contact application service → normalize + persist message/outbox state
    ↓   Prisma (MongoDB)
4. Success/error response → Client
5. Background dispatcher claims pending notifications
    ↓   Provider adapter
6. SMTP marks delivered immediately or Resend submits with idempotency key
    ↓   Signed provider callback (Resend only)
7. Webhook confirms delivered/failed status, while retry policy stays in the outbox processor
    ↓   Provider API reconciliation when confirmation does not arrive
8. Stale `submitted` records are re-checked through the provider status API until they reach a terminal state
    ↓   Timeout guard for prolonged provider outages
9. Notifications that exceed the configured confirmation timeout are marked failed instead of remaining in `submitted`
```

### Chat Message Submission

```
1. User sends message → Next.js Client
    ↓   Validation (client-side)
2. REST POST /api/chat/message → NestJS API
    ↓   Validation pipe
3. Chat application service → bounded context orchestration
    ↓   System prompt/context port + session store port
4. Completion adapter → OpenAI
    ↓
5. Assistant response/session id → Client
```

### Portfolio Data Loading

```
1. Page request → Next.js App Router page
    ↓   server component / route handler fetch
2. GraphQL or REST query → NestJS API
    ↓   Service layer
3. MongoDB aggregation → Portfolio Service
    ↓   File URLs (AWS S3)
4. Rendered page → Client
```

## Security Considerations

- **Frontend Security**: same-origin API routes, bounded JSON bodies, input validation, and a per-request CSP script nonce
- **API Security**: Apollo CSRF prevention, strict CORS without credentials, validation pipes, shared contact throttling, per-IP plus global chat throttling, and admin bearer-token checks
- **Data Security**: Prisma/Mongo query layers, signed webhook verification, and MongoDB validation
- **Infrastructure**: Container security, secret management, SSL/TLS

## Scalability Considerations

- **Database Scaling**: MongoDB sharding and workload-specific indexing
- **API Scaling**: Stateless NestJS replicas with shared Mongo-backed throttling
- **CDN**: Global content delivery for assets
- **Operations**: Centralized logging and health checks
- **CI/CD**: Automated testing, blue-green deployments

## Performance Optimizations

- **Frontend**: Code splitting, lazy loading, image optimization
- **Backend**: Database indexing, query optimization, compression
- **Infrastructure**: Load balancing and auto-scaling when traffic requires it
- **Caching**: Browser cache and CDN cache

The backend is a layered ports-and-adapters hybrid. It borrows selected clean
architecture and domain-modelling practices, but it is not a complete CQRS,
hexagonal, clean-architecture, or DDD implementation. REST and GraphQL
transports call shared application services; provider-specific persistence,
mail, Resend, webhook, OpenAI, and S3 code remains behind explicit ports where
that separation has concrete value.

## Methodology Defaults

- **TDD**: behavior changes should start with the smallest failing test that
  proves the requirement when practical.
- **DDD**: contact, chat, and portfolio are pragmatic module boundaries with
  some domain/application/infrastructure separation. Contact has the strongest
  domain model; the repository does not claim a proven ubiquitous language or
  a complete strategic DDD design.
- **BDD**: user-visible backend behavior should be expressed as executable
  Gherkin scenarios. In this repo the first-class path is
  `backend/features/**/*.feature` plus TypeScript step definitions. Contact and
  chat are the current baseline scenarios.
