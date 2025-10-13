from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.deps import get_db
from src.db.models.qto import QTOResult
from src.schemas.qto import QTOResponse
from src.services.workers.enqueue import enqueue_qto_job

router = APIRouter()


@router.post("/process/{file_id}")
def process_qto(file_id: int, db: Session = Depends(get_db)):
    # Enqueue QTO processing job
    job_id = enqueue_qto_job(file_id)
    return {"message": "QTO processing started", "job_id": job_id}


@router.get("/{qto_id}", response_model=QTOResponse)
def get_qto(qto_id: int, db: Session = Depends(get_db)):
    qto = db.query(QTOResult).filter(QTOResult.id == qto_id).first()
    if not qto:
        raise HTTPException(status_code=404, detail="QTO result not found")
    return qto


@router.get("/file/{file_id}", response_model=list[QTOResponse])
def get_qto_by_file(file_id: int, db: Session = Depends(get_db)):
    qto_results = db.query(QTOResult).filter(QTOResult.file_id == file_id).all()
    return qto_results
