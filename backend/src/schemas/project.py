from pydantic import BaseModel
from src.schemas.common import TimestampMixin


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectResponse(TimestampMixin):
    id: int
    name: str
    description: str | None
