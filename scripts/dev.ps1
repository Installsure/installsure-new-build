# InstallSure Development Startup Script
Write-Host "🏗️ Starting InstallSure Development Environment..." -ForegroundColor Green

# Check for required tools
$tools = @("node", "python", "docker")
foreach ($tool in $tools) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "❌ $tool is required but not installed. Aborting." -ForegroundColor Red
        exit 1
    }
}

# Start infrastructure services
Write-Host "🐳 Starting PostgreSQL and Redis..." -ForegroundColor Cyan
docker-compose up -d postgres redis

# Wait for services to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Setup backend
Write-Host "📦 Setting up backend..." -ForegroundColor Blue
Set-Location backend

if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created backend .env file" -ForegroundColor Green
}

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed

# Start backend in background
Write-Host "🚀 Starting backend server..." -ForegroundColor Magenta
$backend = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden

# Setup BIM service
Write-Host "🐍 Setting up BIM service..." -ForegroundColor DarkGreen
Set-Location ../bim

if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created BIM service .env file" -ForegroundColor Green
}

python -m pip install -r requirements.txt

# Start BIM service in background
Write-Host "🧠 Starting BIM processing service..." -ForegroundColor DarkCyan
$bim = Start-Process -FilePath "python" -ArgumentList "main.py" -PassThru -WindowStyle Hidden

# Setup frontend
Write-Host "⚛️ Setting up frontend..." -ForegroundColor Blue
Set-Location ../frontend

if (!(Test-Path ".env")) {
    @"
VITE_API_URL=http://localhost:8080
VITE_BIM_API_URL=http://localhost:8000
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Created frontend .env file" -ForegroundColor Green
}

npm install

# Start frontend
Write-Host "🎨 Starting frontend development server..." -ForegroundColor Cyan
$frontend = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden

Write-Host ""
Write-Host "🎉 InstallSure Development Environment Started!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Services:" -ForegroundColor White
Write-Host "  • Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  • Backend:   http://localhost:8080" -ForegroundColor Blue
Write-Host "  • BIM API:   http://localhost:8000" -ForegroundColor DarkGreen
Write-Host "  • Database:  postgresql://localhost:5432/installsure" -ForegroundColor Yellow
Write-Host "  • Redis:     redis://localhost:6379" -ForegroundColor Red
Write-Host ""
Write-Host "👤 Demo Login:" -ForegroundColor White
Write-Host "  • Email:     owner@example.com" -ForegroundColor Gray
Write-Host "  • Password:  demo123" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 To stop all services: Press Ctrl+C, then run: docker-compose down" -ForegroundColor Yellow
Write-Host ""

# Wait for interrupt and cleanup
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "🛑 Shutting down..." -ForegroundColor Red
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $bim.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    docker-compose down
}