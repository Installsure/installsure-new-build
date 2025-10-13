from pydantic import BaseModel
from datetime import datetime
from typing import Any


class DroneScanResponse(BaseModel):
    id: int
    project_id: int
    file_path: str
    scan_type: str | None
    status: str
    metadata: dict[str, Any] | None
    created_at: datetime

    class Config:
        from_attributes = True
