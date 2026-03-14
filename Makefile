# Project build configuration for different platforms

.PHONY: help frontend-build backend-build install install-frontend install-backend dev dev-frontend dev-backend

help:
	@echo "Available commands:"
	@echo "  install              - Reset stale git hooks config and install all workspace dependencies"
	@echo "  install-frontend     - Install frontend dependencies"
	@echo "  install-backend      - Install backend dependencies"
	@echo "  frontend-build       - Build frontend for production"
	@echo "  backend-build        - Build backend for production"
	@echo "  dev                  - Start development environment"
	@echo "  dev-frontend         - Start frontend development server"
	@echo "  dev-backend          - Start backend development server"

# Installation targets
install:
	git config --local --unset core.hooksPath || true
	corepack enable
	corepack pnpm install --frozen-lockfile

install-frontend:
	corepack enable
	corepack pnpm install --frozen-lockfile --filter frontend

install-backend:
	corepack enable
	corepack pnpm install --frozen-lockfile --filter backend

# Development targets
dev:
	@echo "Starting both services..."
	@echo "Frontend will be at http://localhost:3000"
	@echo "Backend will be at http://localhost:4000"
	corepack enable
	corepack pnpm run dev

dev-frontend:
	corepack enable
	cd frontend && corepack pnpm dev

dev-backend:
	corepack enable
	cd backend && corepack pnpm dev

# Production build targets
frontend-build-render:
	corepack enable
	corepack pnpm install --frozen-lockfile --filter frontend
	cd frontend && corepack pnpm build

frontend-build:
	@echo "Building frontend for production..."
	corepack enable
	corepack pnpm install --frozen-lockfile
	cd frontend && corepack pnpm build

backend-build:
	@echo "Building backend for production..."
	corepack enable
	corepack pnpm install --frozen-lockfile
	cd backend && corepack pnpm prisma generate && corepack pnpm build

# Render.com deployment (frontend only)
render-build-frontend: frontend-build-render

# 🎯 RENDER.COM FIX - Copy this to your Render.com Build Command field:
# make render-frontend-build
# OR directly: cd frontend && corepack enable && corepack pnpm build

# Simple Render command (copy this to Render.com build field)
render-simple: frontend-build-render

# Render.com ready command - just copy this to build field:

docker-run:
	docker-compose up --build
