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
- **pnpm** 9+
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
   # Install all dependencies (frontend + backend)
   pnpm install

   # Or install separately
   cd frontend && pnpm install && cd ..
   cd backend && pnpm install && cd ..
   ```

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
   cd backend
   pnpm prisma generate
   cd ..
   ```

### Running the Application

**Development Mode:**

```bash
# Start backend (Terminal 1)
cd backend && npm run start:dev

# Start frontend (Terminal 2)
cd frontend && npm run dev
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
- **Health Check**: http://localhost:4000/api/health/live

## Environment Variables

### Backend (`backend/.env`)

| Variable                | Description                   | Example                                       |
| ----------------------- | ----------------------------- | --------------------------------------------- |
| `NODE_ENV`              | Environment mode              | `development`                                 |
| `PORT`                  | Backend port                  | `4000`                                        |
| `FRONTEND_URL`          | Primary frontend origin       | `http://localhost:3000`                       |
| `CORS_ORIGINS`          | Additional allowed origins    | `http://localhost:3000,http://localhost:3001` |
| `MONGODB_URI`           | MongoDB connection string     | `mongodb://localhost:27017/wizytowka`         |
| `MONGODB_DB`            | MongoDB database name         | `wizytowka`                                   |
| `SMTP_HOST`             | SMTP server host              | `localhost`                                   |
| `SMTP_PORT`             | SMTP port                     | `1025`                                        |
| `SMTP_SECURE`           | SMTP TLS flag                 | `false`                                       |
| `SMTP_FROM`             | Sender address                | `portfolio@example.com`                       |
| `SMTP_TO`               | Recipient address             | `owner@example.com`                           |
| `ADMIN_TOKEN`           | Admin authentication token    | `your-secret-token`                           |
| `OPENAI_API_KEY`        | Optional chat integration key | `sk-...`                                      |
| `AWS_REGION`            | AWS region                    | `us-east-1`                                   |
| `AWS_ACCESS_KEY_ID`     | AWS access key                | `AKIA...`                                     |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key                | `your-secret`                                 |
| `AWS_S3_BUCKET_NAME`    | S3 bucket name                | `your-bucket`                                 |

### Frontend (`frontend/.env.local`)

| Variable                               | Description                                | Example                         |
| -------------------------------------- | ------------------------------------------ | ------------------------------- |
| `NEXT_PUBLIC_GRAPHQL_URL`              | GraphQL endpoint                           | `http://localhost:4000/graphql` |
| `NEXT_PUBLIC_API_URL`                  | Backend base URL for client-side fetches   | `http://localhost:4000`         |
| `NEXT_PUBLIC_API_BASE_URL`             | Backend REST base URL                      | `http://localhost:4000/api`     |
| `NEXT_PUBLIC_SITE_URL`                 | Public site URL                            | `http://localhost:3000`         |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`        | Optional Google Analytics GA4 ID           | `G-XXXXXXXXXX`                  |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional Search Console verification token | `token`                         |

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
cd backend

# Development
npm run start:dev          # Start with hot reload
npm run start:prod         # Start production build

# Building
npm run build              # Build for production
npm run format             # Format code with Prettier
npm run lint               # Run ESLint
npm run lint:fix           # Run ESLint with autofix
npm run typecheck          # Run TypeScript type checking

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run E2E tests
npm run test:cov           # Run tests with coverage

# Database
npx prisma migrate dev     # Apply migrations (dev)
npx prisma db push         # Push schema changes
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open Prisma Studio
```

### Frontend Scripts

```bash
cd frontend

# Development
npm run dev                # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Run ESLint with autofix + Prettier
npm run format             # Format code
npm run typecheck          # TypeScript type checking

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:e2e           # Run Playwright E2E tests
npm run coverage           # Run tests with coverage
```

### Workspace Checks

```bash
pnpm lint                  # Run lint in every workspace
pnpm typecheck             # Run TypeScript checks in every workspace
pnpm test                  # Run backend and frontend unit tests
pnpm check                 # Run lint + typecheck + tests + build
```

## APIs

### REST API Endpoints

| Method | Endpoint                | Description                  |
| ------ | ----------------------- | ---------------------------- |
| GET    | `/api/health`           | Health check                 |
| GET    | `/api/portfolio`        | Get portfolio items          |
| POST   | `/api/contact`          | Send contact message         |
| GET    | `/api/contact/messages` | Get contact messages (admin) |

### GraphQL Schema

The GraphQL API provides full CRUD operations for portfolio items and contact management.

Example query:

```graphql
query GetPortfolio {
  portfolioItems {
    id
    title
    description
    tags
    image
  }
}
```

## Testing

Run complete test suite:

```bash
# Backend tests
cd backend && npm run test:e2e

# Frontend tests
cd frontend && npm run test:e2e
```

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
4. Run the test suite: `npm run test`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

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
