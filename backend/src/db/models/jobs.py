from sqlalchemy import Column, Integer, String, DateTime, JSON, func
from src.db.base import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True)
    job_type = Column(String, nullable=False)
    status = Column(String, default="queued")
    payload = Column(JSON)
    result = Column(JSON)
    error = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)
