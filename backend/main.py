from __future__ import annotations

import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from bim_processor import process_pdf

# Load .env
load_dotenv()

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_RELOAD = os.getenv("API_RELOAD", "true").lower() == "true"
APP_VERSION = os.getenv("APP_VERSION", "2.0.0")

# Parse CORS origins
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
CORS_ORIGINS: List[str] = [o.strip() for o in _raw_origins if o.strip()]

MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", str(50 * 1024 * 1024)))
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads")).resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTS = {".pdf"}  # For now we only truly support PDF

app = FastAPI(title="InstallSure API", version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ServiceStatus(BaseModel):
    api: str = "operational"
    bim_processor: str = "operational"
    upload_service: str = "operational"

class HealthPayload(BaseModel):
    status: str
    timestamp: str
    version: str
    services: ServiceStatus

class DashboardStats(BaseModel):
    total_projects: int
    total_uploads: int
    pages_processed: int
    avg_cost: float

# In-memory demo data (replace with DB later)
PROJECTS = [
    {"id": "demo-001", "name": "Sample Project A", "created_at": "2025-09-15T12:00:00Z"},
    {"id": "demo-002", "name": "Sample Project B", "created_at": "2025-10-01T09:30:00Z"},
]

@app.get("/")
def root():
    return {"status": "operational", "version": APP_VERSION}

@app.get("/api/health", response_model=HealthPayload)
def health():
    now = datetime.now(timezone.utc).isoformat()
    return HealthPayload(
        status="healthy",
        timestamp=now,
        version=APP_VERSION,
        services=ServiceStatus(),
    )

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def dashboard_stats():
    # Why: Provide predictable demo stats for UI without DB.
    return DashboardStats(
        total_projects=len(PROJECTS),
        total_uploads=5,
        pages_processed=42,
        avg_cost=1875.50,
    )

@app.get("/api/projects")
def get_projects():
    return PROJECTS

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Currently only PDF is supported.",
        )

    # Stream to temp path while enforcing MAX_FILE_SIZE
    tmp_path = UPLOAD_DIR / f".tmp-{datetime.now(timezone.utc).timestamp()}-{filename}"
    bytes_written = 0
    chunk_size = 1024 * 1024

    with tmp_path.open("wb") as out:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            bytes_written += len(chunk)
            if bytes_written > MAX_FILE_SIZE:
                out.close()
                tmp_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds MAX_FILE_SIZE={MAX_FILE_SIZE} bytes.",
                )
            out.write(chunk)

    final_path = UPLOAD_DIR / filename
    if final_path.exists():
        final_path.unlink()
    shutil.move(str(tmp_path), str(final_path))

    # Process PDF
    try:
        estimation = process_pdf(final_path)
    except Exception as exc:
        # Why: Return actionable info without leaking internals.
        raise HTTPException(status_code=400, detail=f"Failed to process PDF: {exc}")

    return JSONResponse(
        content={
            "status": "ok",
            "estimation": estimation,
            "meta": {"stored_at": str(final_path), "size": bytes_written},
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=API_RELOAD)