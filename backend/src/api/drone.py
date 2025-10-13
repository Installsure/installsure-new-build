from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.deps import get_db
from src.db.models.drone_scan import DroneScan
from src.schemas.drone import DroneScanResponse

router = APIRouter()


@router.get("/{scan_id}", response_model=DroneScanResponse)
def get_drone_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(DroneScan).filter(DroneScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Drone scan not found")
    return scan


@router.get("/project/{project_id}", response_model=list[DroneScanResponse])
def list_project_scans(project_id: int, db: Session = Depends(get_db)):
    scans = db.query(DroneScan).filter(DroneScan.project_id == project_id).all()
    return scans
