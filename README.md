# Personal Portfolio Website

A modern, full-stack portfolio website built with Next.js 15, React 18, NestJS, and TypeScript. Features internationalization, contact forms, portfolio management, and seamless CI/CD deployment.

## Description

This is a comprehensive portfolio website that showcases professional work and provides contact functionality. The application features:

- **Frontend**: Next.js 15 with React 18, TypeScript, and Tailwind CSS
- **Backend**: NestJS with GraphQL and REST APIs
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Token-based admin access
- **Contact System**: Email notifications via SMTP
- **File Storage**: AWS S3 integration
- **Internationalization**: Built-in i18n support
- **Testing**: Comprehensive unit, integration, and E2E tests
- **Deployment**: Docker + Kubernetes ready

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

- **Node.js** 18+
- **pnpm** (recommended) or npm/yarn
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
   # Backend environment variables
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration

   # Frontend environment variables
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local if needed
   ```

4. **Database Setup**
   ```bash
   # Start database containers
   docker-compose up -d postgres mongo

   # Generate Prisma client and seed database
   cd backend
   npx prisma generate
   npx prisma db seed
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

**Available URLs:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **GraphQL Playground**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/api/health

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` / `production` |
| `PORT` | Backend port | `4000` |
| `DATABASE_URL` | MongoDB connection string | `mongodb://localhost:27017/wizytowka` |
| `ADMIN_TOKEN` | Admin authentication token | `your-secret-token` |
| `JWT_SECRET` | JWT signing secret | `your-jwt-secret` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP password | `your-app-password` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `your-secret` |
| `AWS_S3_BUCKET` | S3 bucket name | `your-bucket` |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000/api` |
| `NEXT_PUBLIC_GRAPHQL_URL` | GraphQL endpoint | `http://localhost:4000/graphql` |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | hCaptcha site key | `your-site-key` |

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
│   │   ├── app/           # Next.js 13+ app router
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
npm run format             # Format code
npm run type-check         # TypeScript type checking

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:e2e           # Run Playwright E2E tests
npm run coverage           # Run tests with coverage
```

## APIs

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/portfolio` | Get portfolio items |
| POST | `/api/contact` | Send contact message |
| GET | `/api/contact/messages` | Get contact messages (admin) |

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
- LinkedIn: [Your LinkedIn Profile]
- Email: contact@pplegalsolutions.pl
