from pydantic import BaseModel
from datetime import datetime
from typing import Any


class QTOResponse(BaseModel):
    id: int
    file_id: int
    project_id: int
    wall_area_m2: float
    door_count: int
    window_count: int
    confidence: float | None
    results: dict[str, Any] | None
    created_at: datetime

    class Config:
        from_attributes = True
