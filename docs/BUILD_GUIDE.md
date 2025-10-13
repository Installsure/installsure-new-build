# InstallSure — Golden Path v2.0 Build Guide

This guide provides a production-grade baseline of InstallSure following the Golden Path v2.0 architecture.

## Architecture

**Backend**: FastAPI (Python 3.11), SQLAlchemy 2, Pydantic v2, Alembic, Redis RQ
**BIM Worker**: Python service (IfcOpenShell, OpenCV optional), Redis RQ
**Frontend**: React + Vite + TypeScript + Tailwind + IFC.js (web-ifc)
**DB**: PostgreSQL 14+ (pgvector optional), Redis 7+

## Quick Start

### Bootstrap (First Run)

**Windows**: `.\scripts\win\bootstrap.ps1`
**macOS/Linux**: `bash scripts/unix/bootstrap.sh`

Access: http://localhost:5173

## Services

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
