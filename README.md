# InstallSure v2.0 - Enterprise Construction Management Platform

[![CI](https://github.com/Installsure/installsure-new-build/actions/workflows/ci.yml/badge.svg)](https://github.com/Installsure/installsure-new-build/actions/workflows/ci.yml)
[![OWASP ASVS 5.0](https://img.shields.io/badge/OWASP%20ASVS-5.0-blue)](./docs/security/OWASP_ASVS_5.0_Checklist.csv)
[![SLSA 3](https://img.shields.io/badge/SLSA-Level%203-green)](https://slsa.dev)

## 🏗️ Complete Build Summary

This is a comprehensive rebuild of InstallSure as an enterprise-grade construction management platform with multi-service architecture, following the **Golden Path v1.1** framework for secure, tested, and compliant software development.

📖 **[View Golden Path v1.1 Implementation Guide](./docs/GOLDEN_PATH_v1.1.md)**

## 📋 What's Included

### 🎯 Core Architecture
- **Backend**: Node.js Fastify API (Port 8080) with TypeScript
- **BIM Service**: Python FastAPI (Port 8000) with IFC processing
- **Frontend**: React with TypeScript and Vite (Port 5173)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and BIM caching
- **Queue**: BullMQ for background job processing
- **Docker**: Complete containerization with docker-compose

### 🛠️ Key Features

#### Backend API (Node.js/Fastify)
- ✅ JWT Authentication & Authorization
- ✅ Project Management (CRUD operations)
- ✅ RFI (Request for Information) System
- ✅ Task Management with assignments and deadlines
- ✅ Tag System for organization
- ✅ Change Order Management
- ✅ Calendar Events & Scheduling
- ✅ File Upload & Management
- ✅ User Management with roles (OWNER, ADMIN, PROJECT_MANAGER, MEMBER)
- ✅ Rate limiting and security
- ✅ Background job processing with BullMQ

#### BIM Processing Service (Python/FastAPI)
- ✅ IFC file parsing and processing
- ✅ Quantity takeoffs from BIM models
- ✅ Cost estimation based on material quantities
- ✅ Real-time caching with Redis
- ✅ AI integration ready (Ollama LLM support)
- ✅ Forge/AutoCAD integration capabilities

#### Frontend (React/TypeScript)
- ✅ Modern React with TypeScript
- ✅ React Router for navigation
- ✅ Tailwind CSS for styling
- ✅ Authentication pages (Login/Register)
- ✅ Dashboard with project overview
- ✅ Project management interface
- ✅ RFI management system
- ✅ Task tracking
- ✅ Calendar integration
- ✅ File management
- ✅ Settings panel
- ✅ Responsive design with sidebar navigation

#### Database Schema (Prisma)
- ✅ Comprehensive data model with 15+ entities
- ✅ Users with role-based access control
- ✅ Projects with member management
- ✅ RFIs with workflow tracking
- ✅ Tasks with assignments and status tracking
- ✅ Tags for categorization
- ✅ Change orders and approvals
- ✅ Calendar events and scheduling
- ✅ File attachments and metadata
- ✅ Audit trails and timestamps

### 📁 Project Structure
```
installsure/
├── backend/
│   ├── src/
│   │   ├── index.ts         # Main Fastify server (576 lines)
│   │   └── types/           # TypeScript definitions
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema (400+ lines)
│   │   └── seed.ts          # Demo data seeding
│   ├── Dockerfile
│   └── package.json         # Node.js dependencies
├── bim/
│   ├── main.py              # FastAPI BIM service (300+ lines)
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main React app
│   │   ├── contexts/        # React contexts (Auth, Toast, Project)
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utilities (API client)
│   ├── Dockerfile
│   └── package.json         # React dependencies
├── scripts/
│   ├── dev.ps1             # Development startup (PowerShell)
│   ├── dev.sh              # Development startup (Bash)
│   ├── build.ps1           # Production build
│   ├── test.ps1            # Test runner
│   └── db-reset.ps1        # Database reset utility
└── docker-compose.yml      # Multi-service orchestration
```

### 🔧 Development Scripts
- ✅ `scripts/dev.ps1` - Complete development environment startup
- ✅ `scripts/build.ps1` - Production build script
- ✅ `scripts/test.ps1` - Comprehensive testing
- ✅ `scripts/db-reset.ps1` - Database reset utility

### 🐳 Docker Configuration
- ✅ Multi-service docker-compose setup
- ✅ PostgreSQL database container
- ✅ Redis cache container
- ✅ Backend API container
- ✅ BIM processing service container
- ✅ Frontend container with Nginx
- ✅ Health checks and proper networking

### 🌱 Demo Data
- ✅ Seed script with sample users, projects, RFIs, tasks
- ✅ Demo login credentials:
  - Owner: `owner@example.com` / `demo123`
  - Project Manager: `pm@example.com` / `demo123`

### 📦 Dependencies

#### Backend
- Fastify (web framework)
- Prisma (ORM)
- BullMQ (job queues)
- bcrypt (password hashing)
- JWT (authentication)
- Redis (caching)

#### BIM Service
- FastAPI (Python web framework)
- IfcOpenShell (IFC processing)
- numpy/pandas (data processing)
- Redis (caching)

#### Frontend
- React 18 with TypeScript
- React Router (navigation)
- Tailwind CSS (styling)
- Axios (HTTP client)
- React Hook Form (forms)
- Lucide React (icons)

## 🚀 Quick Start

### Using Makefile (Recommended)

```bash
# Setup environment and install dependencies
make install
make setup

# Start all services with Docker
make docker-up

# Run database migrations and seed demo data
make migrate
make seed

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
# BIM Service: http://localhost:8000
```

### Using Scripts (Alternative)

**Windows PowerShell:**
```powershell
.\scripts\dev.ps1
```

**Linux/Mac:**
```bash
./scripts/dev.sh
```

### Manual Setup

1. **Environment Setup**:
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp bim/.env.example bim/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Install Dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../bim && pip install -r requirements.txt
   ```

3. **Start Services**:
   ```bash
   docker-compose up -d postgres redis
   cd backend && npm run dev &
   cd frontend && npm run dev &
   cd bim && uvicorn main:app --reload
   ```

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Projects
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### RFIs
- `GET /rfis` - List RFIs
- `POST /rfis` - Create RFI
- `GET /rfis/:id` - Get RFI details
- `PUT /rfis/:id` - Update RFI
- `POST /rfis/:id/responses` - Add RFI response

### Tasks
- `GET /tasks` - List tasks
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

## 🏗️ Construction Management Features

### Project Management
- Project creation and management
- Member assignment and role management
- Project status tracking (Planning, Active, On Hold, Completed)
- Budget tracking and reporting

### RFI System
- Request for Information creation and tracking
- Priority levels (Low, Medium, High, Critical)
- Due date management
- Response tracking and approval workflow

### Task Management
- Task assignment and tracking
- Priority levels and due dates
- Status tracking (Todo, In Progress, Review, Completed)
- Task dependencies and scheduling

### Tag System
- Categorization with colored tags
- Project-wide tag management
- Filtering and organization

### Change Orders
- Change request creation and approval
- Cost impact tracking
- Approval workflow management

### Calendar & Scheduling
- Project milestone tracking
- Meeting scheduling
- Inspection scheduling
- Deadline management

## 🔒 Security Features
- JWT-based authentication
- Role-based access control
- Rate limiting
- CORS protection
- Helmet security headers
- Password hashing with bcrypt

## 📈 Performance Features
- Redis caching for BIM data
- Background job processing
- Database indexing and optimization
- Connection pooling
- Efficient file handling

## 🧪 Testing & Quality

### Running Tests

```bash
# Run all tests
make test

# Run tests by service
make test-backend
make test-frontend
make test-bim

# Run E2E tests
make test-e2e

# Generate coverage report
make test-coverage
```

### Quality Gates

All pull requests must pass:
- ✅ Unit tests with ≥80% coverage
- ✅ Integration tests
- ✅ E2E tests (Playwright)
- ✅ Linting (ESLint, Ruff, Prettier, Black)
- ✅ Type checking (TypeScript, mypy)
- ✅ Security scanning (Bandit, npm audit)
- ✅ OWASP ASVS 5.0 verification

### Pre-commit Hooks

Install pre-commit hooks to ensure code quality:

```bash
pip install pre-commit
pre-commit install
```

Hooks include:
- Code formatting (Black, Prettier, isort)
- Linting (Ruff, ESLint)
- Type checking (mypy)
- Security scanning (Bandit, detect-secrets)
- Documentation linting (markdownlint)

## 🔒 Security & Compliance

### OWASP ASVS 5.0

InstallSure implements >80% of OWASP Application Security Verification Standard 5.0 controls.

See [OWASP ASVS Checklist](./docs/security/OWASP_ASVS_5.0_Checklist.csv) for details.

### SLSA Supply Chain Security

- **Level 3**: Non-falsifiable provenance
- Signed artifacts on every release
- SBOM (Software Bill of Materials) included
- Dependency scanning with Dependabot

### Security Features Summary

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting and DDoS protection
- Input validation and sanitization
- SQL injection prevention (ORM)
- XSS protection (React auto-escaping)
- CSRF protection (SameSite cookies)
- Secure headers (Helmet middleware)
- TLS/HTTPS enforcement
- File upload validation and scanning hooks
- Secrets management (environment variables)
- Audit logging for sensitive operations

## 🛠️ Development

### Available Commands

```bash
# Development
make dev              # Start all services
make dev-backend      # Start backend only
make dev-frontend     # Start frontend only
make dev-bim          # Start BIM worker only

# Testing
make test             # Run all tests
make test-coverage    # Test with coverage report
make test-e2e         # Run E2E tests

# Quality & Security
make lint             # Run all linters
make lint-fix         # Auto-fix linting issues
make format           # Format all code
make typecheck        # Run type checkers
make security         # Run security scans

# Database
make migrate          # Run database migrations
make seed             # Seed demo data
make db-reset         # Reset database

# Docker
make docker-up        # Start Docker services
make docker-down      # Stop Docker services
make docker-build     # Build Docker images
make docker-logs      # View logs

# Build & Deploy
make build            # Build for production
make clean            # Clean build artifacts
make sbom             # Generate SBOM
```

See `Makefile` for all available commands.

## 📚 Documentation

- [Golden Path v1.1 Implementation Guide](./docs/GOLDEN_PATH_v1.1.md) - Complete development framework
- [OWASP ASVS 5.0 Checklist](./docs/security/OWASP_ASVS_5.0_Checklist.csv) - Security compliance tracker
- [Migration Guide](./MIGRATION_GUIDE.md) - Repository migration instructions

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting: `make test && make lint`
4. Commit with conventional commit messages
5. Push and open a pull request
6. Wait for CI checks to pass
7. Request review from maintainers

All contributions must pass CI gates including:
- Tests with ≥80% coverage
- Security scans
- Code quality checks
- OWASP ASVS verification

---

**Status**: ✅ Complete multi-service enterprise construction management platform  
**Version**: 2.0.0  
**Golden Path**: v1.1 ✅  
**SLSA Level**: 3  
**Last Updated**: October 2025