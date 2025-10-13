from pathlib import Path
from fastapi import UploadFile
import shutil
from src.core.config import settings


async def save_uploaded_file(file: UploadFile) -> tuple[str, int]:
    """Save uploaded file to storage and return path and size"""
    upload_dir = Path(settings.file_storage_base)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_dir / file.filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = file_path.stat().st_size
    return str(file_path), file_size
