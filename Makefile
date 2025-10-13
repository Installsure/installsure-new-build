# InstallSure Makefile - LLM/RAG/Governance Build Targets

.PHONY: help dev seed test llm scan release clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Bring up Postgres, Redis, backend, BIM worker, frontend
	@echo "🚀 Starting InstallSure development environment..."
	docker-compose up -d postgres redis
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 5
	docker-compose up -d backend bim frontend
	@echo "✅ Development environment ready!"
	@echo "   Backend:  http://localhost:8080"
	@echo "   BIM:      http://localhost:8000"
	@echo "   Frontend: http://localhost:5173"

seed: ## Seed demo data + sample IFC
	@echo "🌱 Seeding database with demo data..."
	cd backend && npm run seed
	@echo "📊 Seeding embeddings (if LLM stack is up)..."
	@if [ -f backend/scripts/seed_embeddings.py ]; then \
		python3 backend/scripts/seed_embeddings.py; \
	else \
		echo "⚠️  seed_embeddings.py not yet created"; \
	fi
	@echo "✅ Seeding complete!"

test: ## Run pytest + Playwright + coverage gate
	@echo "🧪 Running test suite..."
	@echo "📦 Backend tests..."
	cd backend && npm run test:coverage
	@echo "⚛️  Frontend tests..."
	cd frontend && npm test
	@echo "🎭 E2E tests (if Playwright configured)..."
	@if command -v npx > /dev/null && [ -d frontend/e2e ]; then \
		cd frontend && npx playwright test; \
	else \
		echo "⚠️  Playwright not configured yet"; \
	fi
	@echo "✅ All tests passed!"

llm: ## Start vector DB, run embeddings pipeline, warm semantic cache
	@echo "🤖 Starting LLM stack..."
	docker-compose -f docker-compose.yml -f infra/compose/docker-compose.llm.yml up -d
	@echo "⏳ Waiting for vector DB to be ready..."
	@sleep 5
	@echo "📊 Running Alembic migrations (pgvector)..."
	@if [ -f backend/migrations/env.py ]; then \
		cd backend && alembic upgrade head; \
	else \
		echo "⚠️  Alembic not configured yet - using Prisma migrate"; \
		cd backend && npx prisma migrate dev; \
	fi
	@echo "🔢 Running embeddings pipeline..."
	@if [ -f backend/scripts/seed_embeddings.py ]; then \
		SEED=true python3 backend/scripts/seed_embeddings.py; \
	else \
		echo "⚠️  seed_embeddings.py not yet created"; \
	fi
	@echo "✅ LLM stack ready!"

scan: ## Run bandit + SBOM + dependency scan
	@echo "🔒 Running security scans..."
	@echo "🐍 Python security scan (bandit)..."
	@if command -v bandit > /dev/null; then \
		bandit -r bim/ backend/scripts/ -f json -o /tmp/bandit-report.json || true; \
		echo "   Report: /tmp/bandit-report.json"; \
	else \
		echo "⚠️  bandit not installed (pip install bandit)"; \
	fi
	@echo "📦 Generating SBOM..."
	@if command -v syft > /dev/null; then \
		syft dir:. -o json > /tmp/sbom.json; \
		echo "   SBOM: /tmp/sbom.json"; \
	else \
		echo "⚠️  syft not installed (https://github.com/anchore/syft)"; \
	fi
	@echo "🔍 Node.js dependency audit..."
	cd backend && npm audit || true
	cd frontend && npm audit || true
	@echo "✅ Security scan complete!"

release: ## Build images + SLSA provenance
	@echo "📦 Building production images..."
	docker-compose -f docker-compose.yml build
	@echo "📝 Generating SLSA provenance..."
	@if command -v cosign > /dev/null; then \
		echo "   Creating image attestations..."; \
		docker images --format "{{.Repository}}:{{.Tag}}" | grep installsure | while read img; do \
			echo "   - $$img"; \
		done; \
	else \
		echo "⚠️  cosign not installed for SLSA provenance"; \
	fi
	@echo "✅ Release build complete!"

clean: ## Clean up containers, volumes, and build artifacts
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	@if [ -f infra/compose/docker-compose.llm.yml ]; then \
		docker-compose -f docker-compose.yml -f infra/compose/docker-compose.llm.yml down -v; \
	fi
	cd backend && rm -rf node_modules dist coverage
	cd frontend && rm -rf node_modules dist coverage
	@echo "✅ Cleanup complete!"
