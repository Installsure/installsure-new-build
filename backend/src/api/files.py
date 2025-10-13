from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException
from sqlalchemy.orm import Session
from src.core.deps import get_db
from src.db.models.file import File
from src.schemas.file import FileUploadResponse, FileResponse
from src.services.files.storage import save_uploaded_file

router = APIRouter()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    project_id: int = None,
    db: Session = Depends(get_db)
):
    # Save file
    file_path, file_size = await save_uploaded_file(file)
    
    # Create file record
    new_file = File(
        project_id=project_id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file.content_type
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    return new_file


@router.get("/{file_id}", response_model=FileResponse)
def get_file(file_id: int, db: Session = Depends(get_db)):
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file


@router.get("/project/{project_id}", response_model=list[FileResponse])
def list_project_files(project_id: int, db: Session = Depends(get_db)):
    files = db.query(File).filter(File.project_id == project_id).all()
    return files
