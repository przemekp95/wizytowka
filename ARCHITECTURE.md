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
│  │   - SSR/SSG     │ │   - Controllers │ │ - Bearer token  │ │
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
│  │   Docker        │ │   Kubernetes    │ │   Cloudflare    │ │
│  │   Containers    │ │   Orchestration │ │   CDN/DNS       │ │
│  │                 │ │                 │ │                 │ │
│  │   - Multi-stage │ │   - Auto-scale  │ │   - Global      │ │
│  │   - Security    │ │   - Health      │ │   - SSL         │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 Development & Operations                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   GitHub CI/CD  │ │   Testing       │ │   Monitoring    │ │
│  │   Pipelines     │ │   Suite         │ │   Stack         │ │
│  │                 │ │                 │ │                 │ │
│  │   - Lint/Test   │ │   - Jest         │ │   - Winston     │ │
│  │   - Build/Deploy│ │   - E2E         │ │   - Prometheus   │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Architecture

```
src/
├── app/                          # Next.js 13+ App Router
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
│   ├── domain/                 # ContactSubmission and domain rules
│   ├── infrastructure/         # Prisma + SMTP adapters
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
- **GraphQL Client**: Apollo Client (potential)
- **Internationalization**: next-i18n

### Backend Stack

- **Framework**: NestJS 11 (Node.js)
- **Language**: TypeScript 5.9
- **Database**: MongoDB via Prisma and the MongoDB driver
- **API**: REST + GraphQL
- **Authentication**: `ADMIN_TOKEN` bearer header on protected admin endpoint(s)
- **File Storage**: AWS S3

### DevOps Stack

- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Testing**: Jest + Playwright + Vitest
- **Security**: Helmet + CORS + CSP
- **Monitoring**: Winston (structured logging)

## Deployment Architecture

### Development Environment

```
Local Machine
├── VS Code + Extensions
├── Node.js 18+ + pnpm
├── Docker Desktop
├── Git with premade hooks
├── MongoDB/PostgreSQL containers
└── Insomnia/Postman for API testing
```

### Production Environment

```
Kubernetes Cluster
├── Frontend Deployment (Next.js)
│   ├── SSR/SSG static generation
│   ├── CDN caching
│   └── Horizontal Pod Autoscaler
├── Backend Deployment (NestJS)
│   ├── REST/GraphQL APIs
│   ├── Database connections
│   └── Health checks
└── Infrastructure
    ├── Ingress controller
    ├── Certificate management
    ├── Monitoring stack
    └── Secret management
```

## Data Flow

### Contact Form Submission

```
1. User submits form → Next.js Client
    ↓   Validation (client-side)
2. GraphQL mutation → NestJS API
    ↓   Validation + anti-abuse checks
3. Database storage → Prisma (MongoDB)
    ↓   Email notification
4. SMTP send → Contact Service
    ↓
5. Success/error response → Client
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
1. Page request → Next.js SSR
    ↓   getServerSideProps/getStaticProps
2. GraphQL query → NestJS API
    ↓   Service layer
3. MongoDB aggregation → Portfolio Service
    ↓   File URLs (AWS S3)
4. Rendered page → Client
```

## Security Considerations

- **Frontend Security**: Helmet, CSP headers, input sanitization
- **API Security**: Rate limiting, admin bearer token checks, validation pipes
- **Data Security**: SQL injection prevention, MongoDB validation
- **Infrastructure**: Container security, secret management, SSL/TLS

## Scalability Considerations

- **Database Scaling**: MongoDB sharding, PostgreSQL read replicas
- **API Scaling**: Rate limiting, caching, Redis clustering
- **CDN**: Global content delivery for assets
- **Monitoring**: Centralized logging, metric collection
- **CI/CD**: Automated testing, blue-green deployments

## Performance Optimizations

- **Frontend**: Code splitting, lazy loading, image optimization
- **Backend**: Database indexing, query optimization, compression
- **Infrastructure**: Load balancing, auto-scaling, monitoring
- **Caching**: Browser cache, CDN cache, Redis cache

This architecture follows clean architecture principles, ensuring maintainability, scalability, and security while providing an excellent developer and user experience.

## Methodology Defaults

- **TDD**: behavior changes should start with the smallest failing test that
  proves the requirement when practical.
- **DDD**: backend slices with real business behavior should preserve domain,
  application, and infrastructure boundaries instead of collapsing everything
  into controllers and SDK calls. Contact, chat, and portfolio are the current
  reference bounded contexts in this repo.
- **BDD**: user-visible backend behavior should be expressed as executable
  Gherkin scenarios. In this repo the first-class path is
  `backend/features/**/*.feature` plus TypeScript step definitions. Contact and
  chat are the current baseline scenarios.
