from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, func
from src.db.base import Base


class QTOResult(Base):
    __tablename__ = "qto_results"

    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("files.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    wall_area_m2 = Column(Float, default=0.0)
    door_count = Column(Integer, default=0)
    window_count = Column(Integer, default=0)
    results = Column(JSON)
    confidence = Column(Float)
    created_at = Column(DateTime, server_default=func.now())
