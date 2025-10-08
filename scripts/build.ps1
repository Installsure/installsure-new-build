# InstallSure Production Build Script
Write-Host "🏗️ Building InstallSure for Production..." -ForegroundColor Green

# Check for required tools
$tools = @("node", "python", "docker")
foreach ($tool in $tools) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "❌ $tool is required but not installed. Aborting." -ForegroundColor Red
        exit 1
    }
}

# Build backend
Write-Host "📦 Building backend..." -ForegroundColor Blue
Set-Location backend
npm install --production
npx prisma generate
npm run build

# Build BIM service requirements
Write-Host "🐍 Preparing BIM service..." -ForegroundColor DarkGreen
Set-Location ../bim
python -m pip install -r requirements.txt

# Build frontend
Write-Host "⚛️ Building frontend..." -ForegroundColor Cyan
Set-Location ../frontend
npm install
npm run build

# Build Docker images
Write-Host "🐳 Building Docker images..." -ForegroundColor DarkBlue
Set-Location ..
docker-compose -f docker-compose.prod.yml build

Write-Host ""
Write-Host "✅ Production build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To deploy:" -ForegroundColor White
Write-Host "  docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor Gray
Write-Host ""