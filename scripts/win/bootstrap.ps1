$ErrorActionPreference = "Stop"

Write-Host "🚀 InstallSure Bootstrap Script" -ForegroundColor Green

# Copy environment files if they don't exist
Copy-Item backend\.env.example backend\.env -ErrorAction SilentlyContinue
Copy-Item bim\.env.example bim\.env -ErrorAction SilentlyContinue
Copy-Item frontend\.env.example frontend\.env -ErrorAction SilentlyContinue

Write-Host "✅ Environment files ready" -ForegroundColor Green

# Start services with docker compose
Write-Host "🐳 Starting Docker services..." -ForegroundColor Cyan
docker compose -f docker-compose.yml up -d

Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run migrations (when Alembic is set up)
# Write-Host "🗄️ Running database migrations..." -ForegroundColor Cyan
# python scripts\alembic_upgrade_head.py

# Seed demo data (when script is ready)
# Write-Host "🌱 Seeding demo data..." -ForegroundColor Cyan
# python scripts\seed_demo.py

Write-Host ""
Write-Host "✨ InstallSure is ready!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
