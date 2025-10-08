# InstallSure Database Reset Script
Write-Host "🗄️ Resetting InstallSure Database..." -ForegroundColor Yellow

# Warning prompt
$confirmation = Read-Host "⚠️  This will DELETE ALL DATA. Are you sure? (type 'yes' to confirm)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Operation cancelled." -ForegroundColor Red
    exit 0
}

# Stop running services
Write-Host "🛑 Stopping services..." -ForegroundColor Red
docker-compose down

# Remove database volume
Write-Host "🗑️ Removing database volume..." -ForegroundColor DarkRed
docker volume rm installsure_postgres_data -f

# Start database
Write-Host "🐳 Starting fresh database..." -ForegroundColor Cyan
docker-compose up -d postgres redis

# Wait for database
Write-Host "⏳ Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Reset migrations
Write-Host "🔄 Resetting migrations..." -ForegroundColor Blue
Set-Location backend
npx prisma migrate reset --force

# Run migrations
Write-Host "📊 Running migrations..." -ForegroundColor Green
npx prisma migrate dev

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor DarkGreen
npm run seed

Write-Host ""
Write-Host "✅ Database reset complete!" -ForegroundColor Green
Write-Host "🚀 Run 'npm run dev' to start development." -ForegroundColor Cyan
Write-Host ""