#!/bin/bash

# InstallSure Development Startup Script
echo "🏗️ Starting InstallSure Development Environment..."

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

# Start infrastructure services
echo "🐳 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Setup backend
echo "📦 Setting up backend..."
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created backend .env file"
fi

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed

# Start backend in background
echo "🚀 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Setup BIM service
echo "🐍 Setting up BIM service..."
cd ../bim
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created BIM service .env file"
fi

python3 -m pip install -r requirements.txt

# Start BIM service in background
echo "🧠 Starting BIM processing service..."
python3 main.py &
BIM_PID=$!

# Setup frontend
echo "⚛️ Setting up frontend..."
cd ../frontend
if [ ! -f ".env" ]; then
    echo "VITE_API_URL=http://localhost:8080" > .env
    echo "VITE_BIM_API_URL=http://localhost:8000" >> .env
    echo "✅ Created frontend .env file"
fi

npm install

# Start frontend
echo "🎨 Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 InstallSure Development Environment Started!"
echo ""
echo "📊 Services:"
echo "  • Frontend:  http://localhost:5173"
echo "  • Backend:   http://localhost:8080"
echo "  • BIM API:   http://localhost:8000"
echo "  • Database:  postgresql://localhost:5432/installsure"
echo "  • Redis:     redis://localhost:6379"
echo ""
echo "👤 Demo Login:"
echo "  • Email:     owner@example.com"
echo "  • Password:  demo123"
echo ""
echo "🛑 To stop all services: Ctrl+C, then run: docker-compose down"
echo ""

# Wait for interrupt
trap 'echo "🛑 Shutting down..."; kill $BACKEND_PID $BIM_PID $FRONTEND_PID; docker-compose down; exit' INT
wait