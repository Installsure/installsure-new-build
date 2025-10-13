# InstallSure v2.0 - Enterprise Construction Management Platform

## 🏗️ Complete Build Summary

This is a comprehensive rebuild of InstallSure as an enterprise-grade construction management platform with multi-service architecture.

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

### 🔧 Development Scripts & Build System
- ✅ `Makefile` - Modern build system with LLM/RAG targets
- ✅ `scripts/dev.ps1` - Complete development environment startup
- ✅ `scripts/build.ps1` - Production build script
- ✅ `scripts/test.ps1` - Comprehensive testing
- ✅ `scripts/db-reset.ps1` - Database reset utility

**New Makefile Targets:**
- `make dev` - Start development environment
- `make llm` - Start LLM/RAG stack with vector DB
- `make test` - Run tests with coverage gates
- `make scan` - Security scanning (bandit, SBOM)
- `make release` - Build production images with SLSA provenance
- `make seed` - Seed demo data and embeddings

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

#### LLM/RAG Services (NEW)
- pgvector (vector embeddings storage)
- Redis (semantic caching)
- TypeScript RAG service (retrieval-augmented generation)
- Embeddings pipeline
- Groundedness & latency evaluations

#### Frontend
- React 18 with TypeScript
- React Router (navigation)
- Tailwind CSS (styling)
- Axios (HTTP client)
- React Hook Form (forms)
- Lucide React (icons)

## 🚀 Quick Start

1. **Environment Setup**:
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp bim/.env.example bim/.env
   ```

2. **Development Mode**:
   ```bash
   # Using new Makefile (recommended)
   make dev
   
   # Or using PowerShell script
   .\scripts\dev.ps1
   
   # Or Linux/Mac
   ./scripts/dev.sh
   ```

3. **Access the Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - BIM Service: http://localhost:8000

4. **Optional: Start LLM/RAG Stack** (NEW):
   ```bash
   make llm          # Start vector DB and run migrations
   make seed         # Seed demo data and embeddings
   ```

   See [LLM_RAG_GUIDE.md](./LLM_RAG_GUIDE.md) for detailed LLM/RAG documentation.

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

### RAG/LLM Endpoints (NEW)
- `POST /api/rag/search` - Search with RAG (returns answer + citations)
- `POST /api/rag/index` - Index a document for retrieval
- `GET /api/rag/health` - RAG service health check

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
- **NEW**: Automated security scanning (Bandit, npm audit)
- **NEW**: SBOM generation for supply chain security
- **NEW**: SLSA provenance for build integrity

## 📈 Performance Features
- Redis caching for BIM data
- Background job processing
- Database indexing and optimization
- Connection pooling
- Efficient file handling
- **NEW**: Semantic caching for LLM responses (3600s TTL)
- **NEW**: Vector embeddings for fast semantic search
- **NEW**: Latency monitoring with p95 tracking

## 🤖 LLM/RAG Features (NEW)
- Retrieval-Augmented Generation (RAG) for contextual answers
- Citation tracking and provenance
- Semantic caching with Redis
- Vector embeddings storage (pgvector)
- Document indexing and chunking
- Groundedness evaluation (≥85% hit rate)
- Latency evaluation (p95 ≤ 2.5s)
- Token usage tracking and budget alerts
- Factual requirement enforcement

## 🔄 CI/CD Pipeline (NEW)
- **Lint & Type Check**: ESLint, TypeScript strict mode, Ruff for Python
- **Tests**: Jest/Vitest with ≥80% coverage gate
- **Security Scanning**: Bandit for Python, npm audit for Node.js
- **Evaluations**: Groundedness and latency tests for RAG quality
- **SBOM Generation**: Automated supply chain tracking
- **Docker Build**: Multi-stage builds with caching
- **VS Code Integration**: Tasks for dev, test, LLM, security workflows

---

**Status**: ✅ Complete multi-service enterprise construction management platform
**Version**: 2.0.0
**Last Updated**: October 2025