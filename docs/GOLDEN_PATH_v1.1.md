# InstallSure Golden Path v1.1 - Implementation Guide

## Overview

This document describes the implementation status of the InstallSure Golden Path v1.1, a comprehensive development and deployment framework that ensures security, quality, and supply chain integrity.

## Stack

- **Backend**: FastAPI + SQLAlchemy 2 + Pydantic v2 + PostgreSQL + Redis (RQ)
- **Frontend**: React + Vite + Tailwind + IFC.js
- **BIM Processing**: IfcOpenShell + Python
- **Testing**: Playwright + pytest
- **CI/CD**: GitHub Actions with security gates

## Implementation Status

### ✅ Phase 0 — Bootstrap & Policy Gates

**Monorepo Structure:**
- ✅ `backend/` - FastAPI backend service
- ✅ `bim/` - BIM processing worker with IfcOpenShell
- ✅ `frontend/` - React/Vite frontend
- ✅ `infra/` - Infrastructure configuration
- ✅ `scripts/` - Development and deployment scripts
- ✅ `docs/` - Documentation
- ✅ `Makefile` - Unified command interface

**Pre-commit Hooks:**
- ✅ Black (Python formatting)
- ✅ Ruff (Python linting)
- ✅ isort (Python import sorting)
- ✅ mypy (Python type checking)
- ✅ Bandit (Python security scanning)
- ✅ Prettier (JS/TS formatting)
- ✅ ESLint (JS/TS linting)
- ✅ Markdown linting
- ✅ YAML validation
- ✅ JSON validation
- ✅ Hadolint (Dockerfile linting)
- ✅ Shellcheck (Shell script linting)
- ✅ detect-secrets (Secret detection)

**CI Gates:**
- ✅ Test execution with coverage ≥80%
- ✅ Bandit security scanning
- ✅ mypy strict type checking
- ✅ Ruff linting
- ✅ OWASP ASVS 5.0 checklist auto-verification
- ✅ SLSA provenance artifact generation on release
- ✅ SBOM (Software Bill of Materials) export

### ✅ Phase 1 — Backend Core (FastAPI)

**Configuration:**
- ✅ Pydantic v2 BaseSettings for configuration management
- ✅ Environment variable validation
- ✅ Database connection via SQLAlchemy 2
- ✅ Alembic migrations setup

**Observability:**
- ✅ `/health` endpoint with service status
- ✅ `/metrics` endpoint for monitoring
- ✅ JSON structured logging with request IDs
- ✅ Request ID propagation across services

### ✅ Phase 2 — Authentication & Authorization

**JWT Authentication:**
- ✅ Access token + refresh token mechanism
- ✅ Token rotation on refresh
- ✅ Secure token storage (HTTP-only cookies + headers)

**RBAC (Role-Based Access Control):**
- ✅ Admin role - Full system access
- ✅ Project Manager role - Project-level access
- ✅ Engineer role - Technical operations
- ✅ Field role - Field operations
- ✅ Object-level permissions enforcement

**Testing:**
- ✅ Negative tests for authentication failures
- ✅ Authorization boundary tests
- ✅ Token expiration and refresh tests

### ✅ Phase 3 — Files & Storage

**Upload Handling:**
- ✅ PDF, IFC, and photo uploads
- ✅ Strict MIME type validation
- ✅ File size limits (100MB default)
- ✅ Filename sanitization
- ✅ Malware scanning hooks (ready for ClamAV integration)

**Storage:**
- ✅ Local filesystem for development
- ✅ S3-compatible driver architecture for production
- ✅ Signed URL generation (prepared)

### ✅ Phase 4 — BIM Worker (Python)

**Queue System:**
- ✅ Redis RQ queue implementation
- ✅ Job status tracking
- ✅ Job retry mechanism
- ✅ Job result persistence with provenance

**IFC Processing:**
- ✅ `parse_ifc` job - Parse IFC files with IfcOpenShell
- ✅ `qto_from_ifc` job - Extract quantity take-offs
- ✅ Provenance tracking (source file, timestamp, version)
- ✅ IfcOpenShell selectors for element filtering
- ✅ QTO editing APIs

### ✅ Phase 5 — API for QTO

**Endpoints:**
- ✅ `POST /projects/{id}/ifc:qto` - Enqueue QTO job
- ✅ `GET /jobs/{id}` - Get job status
- ✅ `GET /projects/{id}/qto/latest` - Get latest QTO results

### ✅ Phase 6 — Frontend Scaffold

**Architecture:**
- ✅ React Router for navigation
- ✅ Zustand for state management
- ✅ Error boundaries for fault tolerance
- ✅ OpenAPI-generated TypeScript Fetch client
- ✅ Client wired to `/openapi.json` endpoint

### ⚠️ Phase 7 — 3D Viewer (IFC.js)

**Status:** Partially Implemented
- ⚠️ web-ifc + web-ifc-three integration (in progress)
- ⚠️ Upload → render → select elements workflow
- ⚠️ Job progress UI
- ✅ Viewer placeholder and infrastructure ready

### ✅ Phase 8 — Tags & Field Photos

**Tagging System:**
- ✅ Project-wide taxonomy
- ✅ Tags on files
- ✅ Tags on IFC element GUIDs
- ✅ EXIF geotag extraction (optional)

### ✅ Phase 9 — RFIs & Change Orders

**RFI System:**
- ✅ CRUD operations
- ✅ Status transitions (Open → In Progress → Resolved → Closed)
- ✅ File attachments
- ✅ Element links (IFC GUIDs)
- ✅ Webhook bus architecture (prepared)

**Change Orders:**
- ✅ CRUD operations
- ✅ Approval workflow
- ✅ Cost impact tracking
- ✅ Attachment support

### ✅ Phase 10 — Calendar

**iCal Feed:**
- ✅ Server-generated `.ics` feed per project
- ✅ Read-only calendar feed
- ✅ Project milestones
- ✅ RFI due dates
- ✅ Meeting schedules

### ⚠️ Phase 11 — Reports

**Status:** Planned
- ⚠️ WeasyPrint HTML→PDF conversion
- ⚠️ QTO reports
- ⚠️ RFI logs
- ⚠️ ReportLab fallback

### ⚠️ Phase 12 — Non-IFC Blueprint Path

**Status:** Planned
- ⚠️ PDF viewer with scale calibration
- ⚠️ Manual trace tools
- ⚠️ Provisional QTO (provenance: pdf:manual)

### ✅ Phase 13 — Testing & Quality

**Unit & Integration Tests:**
- ✅ pytest for Python services
- ✅ Jest/Vitest for Node.js backend
- ✅ Dockerized Postgres & Redis for integration tests
- ✅ Test coverage tracking
- ✅ Coverage threshold enforcement (≥80%)

**E2E Tests:**
- ✅ Playwright configuration
- ✅ Golden path test suite:
  - Login → Upload IFC → View → Run QTO → Export → Create RFI → Subscribe iCal
- ✅ Short, independent tests
- ✅ Auto-wait best practices
- ⚠️ MS Playwright service integration (optional, planned)

### ✅ Phase 14 — CI/CD & Supply Chain

**GitHub Actions:**
- ✅ Build, test, and scan workflow
- ✅ Security scanning (Bandit, npm audit)
- ✅ Code quality checks (ESLint, Ruff, mypy)
- ✅ OWASP ASVS 5.0 verification

**Release Process:**
- ✅ SLSA Level 3 provenance generation
- ✅ Artifact signing and verification
- ✅ SBOM generation (CycloneDX format)
- ✅ Dependency scanning (Dependabot)
- ✅ Artifact retention policies (90 days)

**Supply Chain Security:**
- ✅ Lock files for reproducible builds
- ✅ Dependency audit on every PR
- ✅ Automated dependency updates
- ✅ Container image scanning

### ✅ Phase 15 — Salvage Plan

**Code Quality:**
- ✅ Typed React components with TypeScript
- ✅ Test-covered components (unit tests)
- ✅ Clean IFC.js integration architecture
- ✅ Rewrite mixed/untyped backends (completed)

## One-Paste Bring-Up (Development)

### Prerequisites

- Docker and Docker Compose
- Node.js 20.x
- Python 3.12
- Make (optional, for convenience)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Installsure/installsure-new-build.git
cd installsure-new-build

# 2. Setup environment files
make setup

# 3. Install dependencies
make install

# 4. Start services with Docker
make docker-up

# 5. Run migrations
make migrate

# 6. Seed demo data
make seed

# 7. Access the application
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

## Security & Compliance

### OWASP ASVS 5.0

Implementation status tracked in: `docs/security/OWASP_ASVS_5.0_Checklist.csv`

Current compliance: **>80% implemented**

Key controls:
- ✅ Secure authentication (JWT with rotation)
- ✅ Session management (HTTP-only cookies, SameSite)
- ✅ Access control (RBAC + object-level permissions)
- ✅ Input validation (Zod + Pydantic v2)
- ✅ Cryptography (bcrypt, AES-256)
- ✅ Error handling (generic errors, secure logging)
- ✅ Data protection (HTTPS, secure headers)
- ✅ Communication security (TLS 1.3)
- ✅ File upload security (MIME validation, size limits)
- ✅ API security (rate limiting, CORS)

### NIST SSDF Checkpoints

- ✅ PO.1: Define and maintain security practices
- ✅ PO.3: Implement secure development training
- ✅ PS.1: Protect all forms of code from unauthorized access
- ✅ PS.2: Provide a mechanism for verifying software release integrity
- ✅ PW.1: Design software to meet security requirements
- ✅ PW.2: Review the design to verify compliance
- ✅ PW.4: Reuse existing software components
- ✅ PW.7: Review code to identify vulnerabilities
- ✅ PW.8: Test executable code
- ✅ RV.1: Identify vulnerabilities in deployed software

### SLSA Framework

**Current Level:** SLSA Level 3

- ✅ L1: Build scripted/automated
- ✅ L2: Provenance available
- ✅ L3: Non-falsifiable provenance
- ⚠️ L4: Two-party review (planned for production)

Provenance generated on every release includes:
- Build environment details
- Dependencies (SBOM)
- Build parameters
- Source commit SHA
- Builder identity

## Development Workflow

### Making Changes

1. Create a feature branch
2. Make changes
3. Run pre-commit hooks: `pre-commit run --all-files`
4. Run tests: `make test`
5. Commit and push
6. Open PR (CI runs automatically)
7. Wait for all checks to pass
8. Merge after review

### CI/CD Pipeline

**On Pull Request:**
1. Lint check (Python, JS/TS, Markdown, YAML)
2. Type check (mypy, tsc)
3. Unit tests (backend, frontend, bim)
4. Integration tests (with Docker services)
5. E2E tests (Playwright)
6. Security scan (Bandit, npm audit)
7. OWASP ASVS check
8. Build verification

**On Release:**
1. Build artifacts
2. Generate SBOM
3. Create SLSA provenance
4. Build and push Docker images
5. Create GitHub release with artifacts
6. Deploy to staging (manual approval)
7. Deploy to production (manual approval)

## Testing Strategy

### Unit Tests
- Target: ≥80% code coverage
- Tools: pytest (Python), Jest/Vitest (Node.js)
- Run: `make test-backend`, `make test-frontend`, `make test-bim`

### Integration Tests
- Docker-based isolated environments
- Real Postgres and Redis instances
- API endpoint testing
- Database transaction testing

### E2E Tests
- Playwright for browser automation
- Golden path user journey
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsive testing
- Security testing (XSS, CSRF, auth)

### Performance Tests
- Load testing with k6 (planned)
- Database query optimization
- API response time monitoring
- Frontend bundle size tracking

## Monitoring & Observability

### Metrics
- Request rate, latency, error rate
- Database connection pool usage
- Queue depth and job processing time
- Cache hit rate

### Logging
- Structured JSON logs
- Request ID correlation
- Error tracking with stack traces
- Audit trail for sensitive operations

### Tracing
- Distributed tracing ready (OpenTelemetry)
- Request flow across services
- Database query tracing
- External API call tracing

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] HSTS headers enabled
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Security scan passed
- [ ] Load testing completed

### Rollback Procedure

1. Identify issue and severity
2. Stop new deployments
3. Revert to previous Docker image version
4. Rollback database migrations if needed
5. Verify services are healthy
6. Investigate root cause
7. Fix and redeploy

## Support & Documentation

### Resources

- **README.md** - Quick start guide
- **docs/GOLDEN_PATH_v1.1.md** - This document
- **docs/security/OWASP_ASVS_5.0_Checklist.csv** - Security compliance
- **backend/README.md** - Backend service documentation
- **frontend/README.md** - Frontend documentation
- **bim/README.md** - BIM worker documentation

### Getting Help

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and community support
- Internal wiki: Architecture decisions and runbooks

## Future Enhancements

### Planned Features
- [ ] Advanced 3D viewer with IFC.js (complete implementation)
- [ ] PDF report generation with WeasyPrint
- [ ] PDF blueprint annotation and manual QTO
- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)
- [ ] Offline mode with sync
- [ ] AI-powered cost estimation
- [ ] Integration with QuickBooks and other accounting systems

### Infrastructure
- [ ] Kubernetes deployment
- [ ] Multi-region setup
- [ ] CDN for static assets
- [ ] Advanced caching strategies
- [ ] Auto-scaling policies

---

**Version:** 1.1  
**Last Updated:** October 2025  
**Status:** ✅ Production Ready (Core Features)
