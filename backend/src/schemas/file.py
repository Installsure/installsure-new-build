from pydantic import BaseModel
from datetime import datetime


class FileUploadResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    file_size: int
    file_type: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class FileResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    file_size: int
    file_type: str | None
    created_at: datetime

    class Config:
        from_attributes = True
