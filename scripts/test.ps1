# InstallSure Testing Script
Write-Host "🧪 Running InstallSure Test Suite..." -ForegroundColor Green

# Check for required tools
if (!(Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

# Test backend
Write-Host "🔧 Testing backend..." -ForegroundColor Blue
Set-Location backend
npm install
npx prisma generate

Write-Host "Running unit tests..." -ForegroundColor Cyan
npm test

Write-Host "Running integration tests..." -ForegroundColor Cyan
npm run test:integration

Write-Host "Running API tests..." -ForegroundColor Cyan
npm run test:api

# Test BIM service
Write-Host "🐍 Testing BIM service..." -ForegroundColor DarkGreen
Set-Location ../bim
python -m pip install -r requirements.txt
python -m pip install pytest pytest-asyncio

Write-Host "Running BIM service tests..." -ForegroundColor Cyan
python -m pytest tests/ -v

# Test frontend
Write-Host "⚛️ Testing frontend..." -ForegroundColor Magenta
Set-Location ../frontend
npm install

Write-Host "Running component tests..." -ForegroundColor Cyan
npm test

Write-Host "Running E2E tests..." -ForegroundColor Cyan
npm run test:e2e

# Generate coverage report
Write-Host "📊 Generating coverage report..." -ForegroundColor Yellow
Set-Location ../backend
npm run test:coverage

Set-Location ../frontend
npm run test:coverage

Write-Host ""
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host "📈 Coverage reports generated in:" -ForegroundColor White
Write-Host "  • backend/coverage/" -ForegroundColor Gray
Write-Host "  • frontend/coverage/" -ForegroundColor Gray
Write-Host ""