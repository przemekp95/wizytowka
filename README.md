# Personal Portfolio Website

A full-stack portfolio application built with Next.js 16, React 19, NestJS 11, and TypeScript. The repo includes a public-facing frontend, a NestJS backend, automated tests, Docker/Kubernetes assets, and CI suitable for production hardening.

## Description

This repository contains:

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: NestJS 11 with GraphQL and REST APIs
- **Data Layer**: MongoDB, accessed through Prisma for contact data and the MongoDB driver for portfolio data
- **Contact Flow**: strict success semantics, where a submission is considered successful only when both DB persistence and SMTP delivery succeed
- **File Storage**: AWS S3 integration for portfolio assets
- **Internationalization**: locale-aware frontend routes and translations
- **Testing**: unit and integration coverage in backend/frontend, plus Playwright E2E coverage
- **Deployment Assets**: Docker, Kubernetes, and CI workflow definitions

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
│   Contact Form  │    │    Portfolio    │
│   (SMTP/AWS)    │    │      Items      │
└─────────────────┘    └─────────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** 20+
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

### Running the Application

**Development Mode:**

```bash
make dev

# Or run the workspace commands explicitly
corepack pnpm -F backend dev
corepack pnpm -F frontend dev
```

**Production Mode:**

```bash
# Using Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or using Kubernetes
kubectl apply -f k8s/
```

**Available URLs**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **GraphQL Endpoint**: http://localhost:4000/graphql
- **Swagger Docs**: http://localhost:4000/api/docs
- **Liveness Check**: http://localhost:4000/api/health/live
- **Readiness Check**: http://localhost:4000/api/health/ready

## Environment Variables

### Backend (`backend/.env`)

| Variable                | Description                                                   | Example                                       |
| ----------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| `NODE_ENV`              | Environment mode                                              | `development`                                 |
| `PORT`                  | Backend port                                                  | `4000`                                        |
| `FRONTEND_URL`          | Primary frontend origin                                       | `http://localhost:3000`                       |
| `CORS_ORIGINS`          | Additional allowed origins                                    | `http://localhost:3000,http://localhost:3001` |
| `TRUST_PROXY`           | Trust reverse proxy for `req.ip`                              | `false`                                       |
| `THROTTLE_STORAGE`      | Shared throttle storage driver (`mongo` or explicit `memory`) | `mongo`                                       |
| `MONGODB_URI`           | MongoDB connection string                                     | `mongodb://localhost:27017/wizytowka`         |
| `MONGODB_DB`            | MongoDB database name                                         | `wizytowka`                                   |
| `SMTP_HOST`             | SMTP server host                                              | `localhost`                                   |
| `SMTP_PORT`             | SMTP port                                                     | `1025`                                        |
| `SMTP_SECURE`           | SMTP TLS flag                                                 | `false`                                       |
| `SMTP_FROM`             | Sender address                                                | `portfolio@example.com`                       |
| `SMTP_TO`               | Recipient address                                             | `owner@example.com`                           |
| `ADMIN_TOKEN`           | Admin authentication token                                    | `your-secret-token`                           |
| `OPENAI_API_KEY`        | Optional chat integration key                                 | `sk-...`                                      |
| `AWS_REGION`            | AWS region                                                    | `us-east-1`                                   |
| `AWS_ACCESS_KEY_ID`     | AWS access key                                                | `AKIA...`                                     |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key                                                | `your-secret`                                 |
| `AWS_S3_BUCKET_NAME`    | S3 bucket name                                                | `your-bucket`                                 |

### Frontend (`frontend/.env.local`)

| Variable                               | Description                                                | Example                         |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------- |
| `BACKEND_GRAPHQL_URL`                  | Backend GraphQL endpoint for server route handlers/codegen | `http://localhost:4000/graphql` |
| `BACKEND_API_URL`                      | Backend origin for server-side REST fetches and proxies    | `http://localhost:4000`         |
| `SITE_URL`                             | Public site URL for sitemap and metadata                   | `http://localhost:3000`         |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`        | Optional Google Analytics GA4 ID                           | `G-XXXXXXXXXX`                  |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional Search Console verification token                 | `token`                         |

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
├── k8s/                   # Kubernetes manifests
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
corepack pnpm -F backend test:e2e     # Run E2E tests
corepack pnpm -F backend test:cov     # Run tests with coverage

# Database
corepack pnpm -F backend exec prisma migrate dev
corepack pnpm -F backend exec prisma db push
corepack pnpm -F backend exec prisma generate
corepack pnpm -F backend exec prisma studio
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
corepack pnpm lint         # Run lint in every workspace
corepack pnpm typecheck    # Run TypeScript checks in every workspace
corepack pnpm test         # Run backend and frontend unit tests
corepack pnpm check        # Run lint + typecheck + tests + build
```

## APIs

### REST API Endpoints

| Method | Endpoint                | Description                               |
| ------ | ----------------------- | ----------------------------------------- |
| GET    | `/api/health/live`      | Process liveness check                    |
| GET    | `/api/health/ready`     | Dependency readiness check                |
| GET    | `/api/portfolio`        | Get portfolio items                       |
| GET    | `/api/contact/messages` | Get contact messages (admin bearer token) |
| GET    | `/api/metrics`          | Prometheus metrics (admin bearer token)   |

### GraphQL Schema

The GraphQL API provides public contact submission.

Example query:

```graphql
mutation SendContact($input: ContactMessageInput!) {
  sendContact(input: $input) {
    ok
    error
  }
}
```

## Testing

Run complete test suite:

```bash
corepack pnpm -F backend test:e2e
corepack pnpm -F frontend test:e2e
```

Run the Kubernetes ingress throttle verification against an existing cluster:

```bash
K8S_INGRESS_KUBECONFIG=/path/to/kubeconfig \
corepack pnpm -F backend test:e2e:k8s-ingress
```

The ingress test now deploys a dedicated throttle-harness image inside the cluster, so it no longer needs `K8S_INGRESS_TARGET_HOST`.

- On local `k3d`, `kind`, and `minikube` clusters it builds the harness image locally and loads it into the cluster automatically.
- On other clusters, set `K8S_INGRESS_IMAGE` to a pullable image reference instead of relying on local image loading.
- Optional overrides: `K8S_INGRESS_CONTEXT`, `K8S_INGRESS_CLASS_NAME`, `K8S_INGRESS_CONTROLLER_NAMESPACE`, `K8S_INGRESS_CONTROLLER_SERVICE`, `K8S_INGRESS_CONTROLLER_PORT`, `K8S_INGRESS_CLUSTER_PROVIDER`, `K8S_INGRESS_CLUSTER_NAME`.

Run the AWS ALB throttle verification in dry-run mode:

```bash
AWS_ALB_DRY_RUN=1 \
AWS_ALB_KUBECONFIG=/path/to/kubeconfig \
AWS_ALB_IMAGE=ghcr.io/example/wizytowka-throttle-harness:latest \
corepack pnpm -F backend test:e2e:aws-alb
```

Run the live AWS ALB verification by building and pushing the harness image to ECR:

```bash
AWS_ALB_KUBECONFIG=/path/to/kubeconfig \
AWS_ALB_IMAGE_REPOSITORY=123456789012.dkr.ecr.eu-central-1.amazonaws.com/wizytowka-throttle-harness \
AWS_ALB_REGION=eu-central-1 \
corepack pnpm -F backend test:e2e:aws-alb
```

- `test:e2e:aws-alb` creates a temporary namespace, MongoDB, two harness replicas, and an `Ingress` handled by AWS Load Balancer Controller, then proves that the `30x 200 + 31st = 429` contract still holds through a real ALB.
- Optional ALB overrides: `AWS_ALB_CONTEXT`, `AWS_ALB_IMAGE`, `AWS_ALB_IMAGE_TAG`, `AWS_ALB_INGRESS_CLASS`, `AWS_ALB_SCHEME`, `AWS_ALB_TARGET_TYPE`, `AWS_ALB_LISTEN_PORTS_JSON`, `AWS_ALB_CERTIFICATE_ARN`, `AWS_ALB_SUBNETS`, `AWS_ALB_SECURITY_GROUPS`, `AWS_ALB_GROUP_NAME`, `AWS_ALB_ORIGIN_SCHEME`, `AWS_ALB_WAIT_SECONDS`, `AWS_ALB_HTTP_READY_SECONDS`.

## Operational Notes

- Frontend browser requests use same-origin `/api/contact` and `/api/chat` route handlers; the browser no longer talks to backend absolute URLs directly.
- `/api/health/ready` returns `200` only when Prisma and MongoDB are healthy; otherwise it returns `503` with dependency details.
- `/api/contact/messages` and `/api/metrics` require `Authorization: Bearer ${ADMIN_TOKEN}`.
- GraphQL contact throttling uses shared Mongo-backed storage by default; use `THROTTLE_STORAGE=memory` only for isolated local/test scenarios.
- `test:e2e:k8s-ingress` verifies the same shared throttling contract through a real Kubernetes ingress controller and is opt-in by design because it needs an existing cluster.
- `test:e2e:aws-alb` verifies the same contract through AWS Load Balancer Controller and a real ALB. It is intentionally opt-in because it touches cloud infrastructure.

### Test Coverage Requirements

- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: Full user journeys

## Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

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

- Rate limiting implemented
- Input validation with class-validator
- CORS configuration
- Helmet security headers
- hCaptcha integration
- CSRF protection
- Secure cookie configuration

## Performance

- Next.js optimizations (ISR, SSG where applicable)
- Image optimization with next/image
- Code splitting and lazy loading
- Database query optimization
- Redis caching (recommended for production)
- CDN integration for static assets

## Monitoring & Logging

- Structured logging with Winston
- Health checks implemented
- Error tracking ready for Sentry integration
- Performance monitoring setup
- Database query logging

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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
