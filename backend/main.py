from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.logging import setup_logging
from src.api import auth, files, projects, qto, drone

app = FastAPI(title="InstallSure API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

setup_logging()


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(files.router, prefix="/files", tags=["files"])
app.include_router(qto.router, prefix="/qto", tags=["qto"])
app.include_router(drone.router, prefix="/drone", tags=["drone"])