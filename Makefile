.PHONY: help install setup dev test lint format clean docker-up docker-down docker-build migrate seed

# Default target
help:
	@echo "InstallSure Golden Path v1.1 - Available Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install        - Install all dependencies (Node, Python, pre-commit)"
	@echo "  make setup          - Setup environment files and initialize database"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start development environment"
	@echo "  make dev-backend    - Start backend only"
	@echo "  make dev-frontend   - Start frontend only"
	@echo "  make dev-bim        - Start BIM worker only"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run all tests"
	@echo "  make test-backend   - Run backend tests"
	@echo "  make test-frontend  - Run frontend tests"
	@echo "  make test-bim       - Run BIM worker tests"
	@echo "  make test-e2e       - Run Playwright E2E tests"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo ""
	@echo "Quality & Security:"
	@echo "  make lint           - Run all linters"
	@echo "  make lint-fix       - Run linters with auto-fix"
	@echo "  make format         - Format code (black, prettier)"
	@echo "  make typecheck      - Run type checking (mypy, tsc)"
	@echo "  make security       - Run security scans (bandit, npm audit)"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        - Run database migrations"
	@echo "  make seed           - Seed database with demo data"
	@echo "  make db-reset       - Reset database (drop, migrate, seed)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      - Start all services with Docker Compose"
	@echo "  make docker-down    - Stop all services"
	@echo "  make docker-build   - Build all Docker images"
	@echo "  make docker-logs    - Show Docker logs"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build          - Build all services for production"
	@echo "  make clean          - Clean build artifacts and caches"
	@echo "  make sbom           - Generate SBOM (Software Bill of Materials)"

# Installation
install: install-backend install-frontend install-bim install-pre-commit
	@echo "✅ All dependencies installed"

install-backend:
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

install-bim:
	@echo "🐍 Installing BIM worker dependencies..."
	cd bim && pip3 install -r requirements.txt

install-pre-commit:
	@echo "🔧 Installing pre-commit hooks..."
	pip3 install pre-commit
	pre-commit install

# Setup
setup: setup-env
	@echo "✅ Setup complete"

setup-env:
	@echo "📝 Setting up environment files..."
	@test -f backend/.env || cp backend/.env.example backend/.env
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	@test -f bim/.env || cp bim/.env.example bim/.env
	@echo "✅ Environment files ready"

# Development
dev:
	@echo "🚀 Starting development environment..."
	docker-compose up -d postgres redis
	@sleep 3
	@echo "🗄️  Database and Redis started"
	@echo "Starting all services..."
	@make -j3 dev-backend dev-frontend dev-bim

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

dev-bim:
	cd bim && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Testing
test: test-backend test-frontend test-bim
	@echo "✅ All tests passed"

test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && npm test

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test

test-bim:
	@echo "🧪 Running BIM worker tests..."
	cd bim && pytest -v

test-e2e:
	@echo "🎭 Running Playwright E2E tests..."
	cd frontend && npx playwright test

test-coverage:
	@echo "📊 Running tests with coverage..."
	cd backend && npm run test:coverage
	cd frontend && npm run test:coverage
	cd bim && pytest --cov=. --cov-report=html

# Linting & Formatting
lint: lint-backend lint-frontend lint-bim lint-docs
	@echo "✅ All linting passed"

lint-backend:
	@echo "🔍 Linting backend..."
	cd backend && npm run lint

lint-frontend:
	@echo "🔍 Linting frontend..."
	cd frontend && npm run lint

lint-bim:
	@echo "🔍 Linting BIM worker..."
	cd bim && ruff check . && black --check . && isort --check-only .

lint-docs:
	@echo "🔍 Linting documentation..."
	@command -v markdownlint >/dev/null 2>&1 && markdownlint '**/*.md' --ignore node_modules || echo "⚠️  markdownlint not installed, skipping"

lint-fix:
	@echo "🔧 Auto-fixing linting issues..."
	cd backend && npm run lint:fix
	cd frontend && npm run lint:fix
	cd bim && ruff check --fix . && black . && isort .

format: lint-fix
	@echo "✨ Code formatted"

typecheck:
	@echo "🔍 Type checking..."
	cd backend && npx tsc --noEmit
	cd frontend && npx tsc --noEmit
	cd bim && mypy . --ignore-missing-imports

security:
	@echo "🔒 Running security scans..."
	cd backend && npm audit --audit-level=moderate
	cd frontend && npm audit --audit-level=moderate
	cd bim && bandit -r . -ll

# Database
migrate:
	@echo "🗄️  Running database migrations..."
	cd backend && npx prisma migrate dev

seed:
	@echo "🌱 Seeding database..."
	cd backend && npm run seed

db-reset:
	@echo "♻️  Resetting database..."
	docker-compose down postgres
	docker-compose up -d postgres
	@sleep 5
	cd backend && npx prisma migrate reset --force

# Docker
docker-up:
	@echo "🐳 Starting Docker services..."
	docker-compose up -d

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker-compose down

docker-build:
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-logs:
	docker-compose logs -f

# Build
build: build-backend build-frontend
	@echo "✅ Build complete"

build-backend:
	@echo "📦 Building backend..."
	cd backend && npm run build

build-frontend:
	@echo "📦 Building frontend..."
	cd frontend && npm run build

# Clean
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf backend/dist backend/node_modules
	rm -rf frontend/dist frontend/node_modules
	rm -rf bim/__pycache__ bim/.pytest_cache
	@echo "✅ Clean complete"

# SBOM Generation
sbom:
	@echo "📋 Generating SBOM..."
	@mkdir -p sbom
	cd backend && npx @cyclonedx/cyclonedx-npm --output-file ../sbom/backend-sbom.json
	cd frontend && npx @cyclonedx/cyclonedx-npm --output-file ../sbom/frontend-sbom.json
	cd bim && pip3 install cyclonedx-bom && cyclonedx-py requirements requirements.txt --output ../sbom/bim-sbom.json
	@echo "✅ SBOM generated in ./sbom/"
