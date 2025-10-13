.PHONY: dev stop migrate seed test scan release help

dev: ## start full stack
	docker compose -f docker-compose.yml up -d

stop: ## stop services
	docker compose -f docker-compose.yml down

migrate: ## alembic upgrade head
	python scripts/alembic_upgrade_head.py

seed: ## seed demo project and sample IFC
	python scripts/seed_demo.py

test: ## backend + e2e
	pytest -q
	cd frontend && npx playwright install --with-deps && npm run test:e2e

scan: ## security scan placeholder
	@echo "Run bandit / dependency scans here"

release: ## build images (attach provenance in your release pipeline)
	docker compose -f docker-compose.yml build

help: ## show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
