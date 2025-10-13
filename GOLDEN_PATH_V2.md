# InstallSure — Golden Path v2.0

## Overview

This repository implements the **Golden Path v2.0** architecture for InstallSure, a production-grade construction management platform focused on BIM processing, quantity takeoffs (QTO), and drone/3D scan integration.

## Architecture

- **Backend**: FastAPI (Python 3.11) with SQLAlchemy 2, Pydantic v2, Alembic, Redis RQ
- **BIM Worker**: Python service using IfcOpenShell for IFC processing, Redis RQ for job queue
- **Frontend**: React + Vite + TypeScript + Tailwind + IFC.js (web-ifc)
- **Database**: PostgreSQL 14+ (with optional pgvector support)
- **Cache/Queue**: Redis 7+

## Core Features

✅ **File Uploads & Management** - Local and S3 storage support
✅ **Authentication** - JWT-based auth with bcrypt password hashing
✅ **QTO (Quantity Takeoff)** - IFC file parsing and analysis
✅ **Auto-Takeoff** - AI-assisted automated takeoff with confidence scoring
✅ **Pattern/Similarity Search** - Find similar elements across projects
✅ **Plan Diff** - Version comparison for BIM models
✅ **Drone/3D Scan Overlay** - Point cloud integration and alignment

## Quick Start

### Prerequisites

- Docker Desktop
- Python 3.11+
- Node.js 20+
- Git

### One-Command Bootstrap

**Windows (PowerShell)**:
```powershell
.\scripts\win\bootstrap.ps1
```

**macOS/Linux**:
```bash
bash scripts/unix/bootstrap.sh
```

This will:
1. Copy `.env.example` files to `.env` for all services
2. Start Docker containers (PostgreSQL, Redis, Backend, BIM Worker, Frontend)
3. Wait for services to be healthy
4. Run database migrations (when Alembic is configured)
5. Seed demo data (when seed script is ready)

### Access Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432 (postgres/postgres)
- **Redis**: localhost:6379

## Project Structure

```
installsure/
├── backend/                    # FastAPI Backend
│   ├── src/
│   │   ├── api/               # API route handlers
│   │   │   ├── auth.py        # Authentication endpoints
│   │   │   ├── files.py       # File upload/download
│   │   │   ├── projects.py    # Project management
│   │   │   ├── qto.py         # QTO processing
│   │   │   └── drone.py       # Drone scan endpoints
│   │   ├── core/              # Core utilities
│   │   │   ├── config.py      # Configuration via pydantic-settings
│   │   │   ├── logging.py     # Logging setup
│   │   │   ├── security.py    # JWT & password hashing
│   │   │   └── deps.py        # FastAPI dependencies
│   │   ├── db/                # Database layer
│   │   │   ├── base.py        # SQLAlchemy base
│   │   │   ├── session.py     # Database session
│   │   │   └── models/        # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   │   ├── files/         # File storage (local/S3)
│   │   │   ├── qto/           # QTO computation
│   │   │   ├── auto_takeoff/  # Auto-takeoff service
│   │   │   ├── similarity_search/  # Pattern matching
│   │   │   ├── plan_diff/     # Plan comparison
│   │   │   ├── drone_ops/     # Drone integration
│   │   │   └── workers/       # Job enqueuing
│   │   └── tests/             # Backend tests
│   ├── alembic/               # Database migrations
│   ├── main.py                # FastAPI app entry point
│   └── requirements.txt       # Python dependencies
│
├── bim/                       # BIM Worker Service
│   ├── src/
│   │   ├── worker.py          # Redis RQ worker
│   │   ├── jobs/              # Background jobs
│   │   │   ├── parse_ifc.py   # IFC parsing
│   │   │   ├── qto_from_ifc.py  # QTO computation
│   │   │   ├── auto_takeoff.py  # Auto-takeoff job
│   │   │   ├── plan_diff.py   # Plan diff job
│   │   │   ├── similarity_index.py  # Similarity indexing
│   │   │   └── drone_ingest.py  # Drone data ingestion
│   │   ├── utils/             # Utility functions
│   │   │   ├── ifc.py         # IFC file utilities
│   │   │   ├── geometry.py    # Geometric computations
│   │   │   ├── images.py      # Image processing
│   │   │   └── storage.py     # File storage utilities
│   │   └── tests/             # BIM worker tests
│   └── requirements.txt       # Python dependencies
│
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Viewer/        # IFC viewer components
│   │   │   │   ├── IFCViewer.tsx  # 3D IFC viewer
│   │   │   │   ├── AutoTakeoffReview.tsx  # AI takeoff review
│   │   │   │   ├── FindSimilarButton.tsx  # Similarity search
│   │   │   │   ├── PlanDiffToggle.tsx  # Plan comparison toggle
│   │   │   │   └── ScanOverlayToggle.tsx  # Drone overlay toggle
│   │   │   ├── QTO/
│   │   │   │   └── QTOTable.tsx  # QTO results display
│   │   │   └── CitationsPanel.tsx  # Source citations
│   │   ├── lib/
│   │   │   ├── api.ts         # API client
│   │   │   └── semanticCacheBadge.ts  # Cache indicators
│   │   └── pages/             # Page components
│   └── package.json           # Node dependencies
│
├── infra/                     # Infrastructure
│   ├── docker/
│   │   ├── backend.Dockerfile
│   │   ├── bim.Dockerfile
│   │   └── frontend.Dockerfile
│   └── compose/               # (optional compose variants)
│
├── scripts/                   # Utility scripts
│   ├── unix/
│   │   └── bootstrap.sh       # Unix bootstrap script
│   ├── win/
│   │   └── bootstrap.ps1      # Windows bootstrap script
│   ├── seed_demo.py           # Demo data seeding
│   └── alembic_upgrade_head.py  # Migration helper
│
├── docs/
│   └── BUILD_GUIDE.md         # Detailed build guide
│
├── docker-compose.yml         # Multi-service orchestration
├── Makefile                   # Common dev commands
└── README.md                  # This file
```

## Development

### Using Make Commands

```bash
make dev      # Start all services
make stop     # Stop all services
make migrate  # Run database migrations
make seed     # Seed demo data
make test     # Run tests
make release  # Build Docker images
```

### Manual Docker Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f bim

# Stop services
docker compose down

# Rebuild images
docker compose build
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## API Endpoints

### Health Check
- `GET /healthz` - Service health status

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create new project
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project

### Files
- `POST /files/upload` - Upload file (IFC, plans, etc.)
- `GET /files/{id}` - Get file metadata
- `GET /files/project/{project_id}` - List project files

### QTO (Quantity Takeoff)
- `POST /qto/process/{file_id}` - Trigger QTO processing
- `GET /qto/{id}` - Get QTO result
- `GET /qto/file/{file_id}` - Get QTO results for file

### Drone Scans
- `GET /drone/{scan_id}` - Get drone scan details
- `GET /drone/project/{project_id}` - List project scans

## Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/installsure
REDIS_URL=redis://redis:6379/0
JWT_SECRET=change_me_in_production
FILE_STORAGE=local
FILE_STORAGE_BASE=../uploads
FACTUAL_REQUIRES_RETRIEVAL=true
```

#### BIM Worker (.env)
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/installsure
REDIS_URL=redis://redis:6379/0
WORKER_CONCURRENCY=2
```

#### Frontend (.env)
```env
VITE_API_BASE=http://localhost:8000
```

## Technology Stack

### Backend
- **FastAPI 0.114.2** - Modern Python web framework
- **SQLAlchemy 2.0.35** - ORM for database access
- **Pydantic 2.9.2** - Data validation
- **Alembic 1.13.2** - Database migrations
- **Redis 5.0.7** - Caching and job queue
- **RQ 1.16.2** - Redis-based job queue
- **python-jose** - JWT authentication
- **passlib[bcrypt]** - Password hashing

### BIM Processing
- **IfcOpenShell ≥0.8.0** - IFC file parsing
- **NumPy 2.1.1** - Numerical computations
- **OpenCV 4.10.0** - Image processing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **IFC.js (web-ifc)** - Browser IFC viewer

### Infrastructure
- **PostgreSQL 14** - Primary database
- **Redis 7** - Cache and queue
- **Docker & Docker Compose** - Containerization

## Testing

### Backend Tests
Located in `backend/src/tests/`:
- `conftest.py` - Test fixtures and configuration
- `test_health.py` - Health check endpoint tests
- `test_auth.py` - Authentication tests

Run with:
```bash
cd backend
pytest -v
```

### Test Coverage Target
≥80% code coverage for all services

## CI/CD

GitHub Actions workflow will be configured to:
- ✅ Run linters (ruff, black, mypy for Python)
- ✅ Run tests with coverage reporting
- ✅ Build Docker images
- ✅ Security scanning
- ✅ Deploy to staging/production

## Production Deployment

1. **Update Environment Variables**
   - Use strong, unique JWT secrets
   - Configure production database credentials
   - Set up S3 or cloud storage for files
   - Enable HTTPS/TLS

2. **Database Migrations**
   ```bash
   python scripts/alembic_upgrade_head.py
   ```

3. **Build & Deploy**
   ```bash
   make release
   docker compose -f docker-compose.prod.yml up -d
   ```

## Security

- JWT-based authentication
- Bcrypt password hashing
- CORS configuration
- File upload validation
- Rate limiting (to be added)
- SQL injection protection (via SQLAlchemy)

## Roadmap

### Phase 2 Enhancements
- [ ] Complete Alembic migration setup
- [ ] Full IFC.js integration in frontend
- [ ] Real-time QTO updates via WebSockets
- [ ] Enhanced similarity search with ML embeddings
- [ ] Drone mission planning interface
- [ ] Multi-tenancy support
- [ ] Advanced RBAC (role-based access control)

### Phase 3 Advanced Features
- [ ] AI-powered cost estimation
- [ ] Progress tracking via drone imagery
- [ ] Clash detection
- [ ] BIM 360 / ACC integration
- [ ] Mobile app (React Native)

## Support & Contributing

For questions, issues, or contributions:
1. Check the documentation in `docs/BUILD_GUIDE.md`
2. Review existing issues on GitHub
3. Submit pull requests with tests

## License

See LICENSE file for details.

---

**Status**: ✅ Golden Path v2.0 core implementation complete
**Version**: 2.0.0
**Last Updated**: October 2025
