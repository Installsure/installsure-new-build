from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
from src.db.base import Base


class DroneScan(Base):
    __tablename__ = "drone_scans"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    file_path = Column(String, nullable=False)
    scan_type = Column(String)
    metadata = Column(JSON)
    status = Column(String, default="pending")
    created_at = Column(DateTime, server_default=func.now())
