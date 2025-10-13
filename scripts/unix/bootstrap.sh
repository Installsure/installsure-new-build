#!/usr/bin/env bash
set -euo pipefail

echo "🚀 InstallSure Bootstrap Script"

# Copy environment files if they don't exist
cp -n backend/.env.example backend/.env || true
cp -n bim/.env.example bim/.env || true
cp -n frontend/.env.example frontend/.env || true

echo "✅ Environment files ready"

# Start services with docker compose
echo "🐳 Starting Docker services..."
docker compose -f docker-compose.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run migrations (when Alembic is set up)
# echo "🗄️ Running database migrations..."
# python scripts/alembic_upgrade_head.py

# Seed demo data (when script is ready)
# echo "🌱 Seeding demo data..."
# python scripts/seed_demo.py

echo ""
echo "✨ InstallSure is ready!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
