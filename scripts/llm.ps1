# InstallSure LLM/RAG Stack Management Script
param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "seed", "test", "llm", "scan", "release", "clean", "evals", "help")]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "InstallSure LLM/RAG Build Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\scripts\llm.ps1 <command>" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  dev       - Start development environment" -ForegroundColor Cyan
    Write-Host "  llm       - Start LLM/RAG stack with vector DB" -ForegroundColor Cyan
    Write-Host "  seed      - Seed demo data and embeddings" -ForegroundColor Cyan
    Write-Host "  test      - Run all tests with coverage" -ForegroundColor Cyan
    Write-Host "  scan      - Run security scans" -ForegroundColor Cyan
    Write-Host "  evals     - Run RAG evaluations" -ForegroundColor Cyan
    Write-Host "  release   - Build production images" -ForegroundColor Cyan
    Write-Host "  clean     - Clean up containers and artifacts" -ForegroundColor Cyan
    Write-Host "  help      - Show this help message" -ForegroundColor Cyan
    Write-Host ""
}

function Start-Dev {
    Write-Host "🚀 Starting InstallSure development environment..." -ForegroundColor Green
    docker-compose up -d postgres redis
    Start-Sleep -Seconds 5
    docker-compose up -d backend bim frontend
    Write-Host "✅ Development environment ready!" -ForegroundColor Green
    Write-Host "   Backend:  http://localhost:8080" -ForegroundColor Gray
    Write-Host "   BIM:      http://localhost:8000" -ForegroundColor Gray
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Gray
}

function Start-LLM {
    Write-Host "🤖 Starting LLM/RAG stack..." -ForegroundColor Green
    docker-compose -f docker-compose.yml -f infra/compose/docker-compose.llm.yml up -d
    Start-Sleep -Seconds 5
    Write-Host "📊 Running migrations..." -ForegroundColor Blue
    Set-Location backend
    npx prisma migrate dev
    Set-Location ..
    Write-Host "✅ LLM stack ready!" -ForegroundColor Green
}

function Run-Seed {
    Write-Host "🌱 Seeding database..." -ForegroundColor Green
    Set-Location backend
    npm run seed
    Set-Location ..
    Write-Host "📊 Seeding embeddings..." -ForegroundColor Blue
    $env:SEED = "true"
    python backend/scripts/seed_embeddings.py
    Remove-Item Env:\SEED
    Write-Host "✅ Seeding complete!" -ForegroundColor Green
}

function Run-Tests {
    Write-Host "🧪 Running test suite..." -ForegroundColor Green
    
    Write-Host "📦 Backend tests..." -ForegroundColor Blue
    Set-Location backend
    npm run test:coverage
    Set-Location ..
    
    Write-Host "⚛️  Frontend tests..." -ForegroundColor Blue
    Set-Location frontend
    npm test
    Set-Location ..
    
    Write-Host "✅ Tests complete!" -ForegroundColor Green
}

function Run-Scan {
    Write-Host "🔒 Running security scans..." -ForegroundColor Green
    
    Write-Host "🐍 Python security scan..." -ForegroundColor Blue
    if (Get-Command bandit -ErrorAction SilentlyContinue) {
        bandit -r bim/ backend/scripts/ -f json -o bandit-report.json
        Write-Host "   Report: bandit-report.json" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  bandit not installed (pip install bandit)" -ForegroundColor Yellow
    }
    
    Write-Host "📦 NPM audit..." -ForegroundColor Blue
    Set-Location backend
    npm audit
    Set-Location ..
    
    Set-Location frontend
    npm audit
    Set-Location ..
    
    Write-Host "✅ Security scan complete!" -ForegroundColor Green
}

function Run-Evals {
    Write-Host "🧪 Running RAG evaluations..." -ForegroundColor Green
    Set-Location backend
    npx tsx src/evals/run-all.ts
    Set-Location ..
}

function Build-Release {
    Write-Host "📦 Building production images..." -ForegroundColor Green
    docker-compose -f docker-compose.yml build
    Write-Host "✅ Release build complete!" -ForegroundColor Green
}

function Clean-All {
    Write-Host "🧹 Cleaning up..." -ForegroundColor Green
    docker-compose down -v
    if (Test-Path "infra/compose/docker-compose.llm.yml") {
        docker-compose -f docker-compose.yml -f infra/compose/docker-compose.llm.yml down -v
    }
    Remove-Item -Recurse -Force backend/node_modules -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force backend/dist -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force frontend/node_modules -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force frontend/dist -ErrorAction SilentlyContinue
    Write-Host "✅ Cleanup complete!" -ForegroundColor Green
}

# Main command dispatch
switch ($Command) {
    "dev"     { Start-Dev }
    "llm"     { Start-LLM }
    "seed"    { Run-Seed }
    "test"    { Run-Tests }
    "scan"    { Run-Scan }
    "evals"   { Run-Evals }
    "release" { Build-Release }
    "clean"   { Clean-All }
    "help"    { Show-Help }
    default   { Show-Help }
}
