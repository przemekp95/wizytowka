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
│  │   Next.js 15    │ │   NestJS API    │ │ Access Control  │ │
│  │   Frontend      │ │   Backend       │ │  (Admin Token)  │ │
│  │                 │ │   TypeScript    │ │                 │ │
│  │   - SSR/SSG     │ │   - Controllers │ │ - Bearer token  │ │
│  │   - React 18    │ │   - Services    │ │ - Endpoint auth │ │
│  │   - TailwindCSS │ │   - GraphQL     │ │                 │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   MongoDB       │ │   PostgreSQL    │ │   AWS S3        │ │
│  │   Portfolio     │ │   (Prisma ORM)  │ │   Files         │ │
│  │                 │ │   Contact DB    │ │                 │ │
│  │   - Documents   │ │   - Relational  │ │   - Static      │ │
│  │   - JSON Schema │ │   - NoSQL       │ │   - CDN         │ │
│  │   - Aggregation │ │   - Indexes     │ │                 │ │
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
│   ├── contact.controller.ts   # REST endpoints
│   ├── contact.service.ts      # Business logic (Documented)
│   ├── contact.resolver.ts     # GraphQL resolvers
│   └── dto/                    # Data transfer objects
├── portfolio/                  # Portfolio management
│   ├── portfolio.controller.ts # API endpoints
│   ├── portfolio.service.ts    # MongoDB operations (Documented)
│   └── entities/               # Data models
├── prisma/                     # Database service
├── graphql/                    # GraphQL module
└── config/                     # Configuration modules
```

## Technology Stack Details

### Frontend Stack

- **Framework**: Next.js 15 (React 18, App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **GraphQL Client**: Apollo Client (potential)
- **Internationalization**: next-i18n

### Backend Stack

- **Framework**: NestJS 11 (Node.js)
- **Language**: TypeStation 5.9
- **Database**: MongoDB + PostgreSQL via Prisma
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
3. hCaptcha validation → NestJS Service
    ↓   Business logic
4. Database storage → Prisma (PostgreSQL)
    ↓   Email notification
5. SMTP send → Contact Service
    ↓
6. Success/error response → Client
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
