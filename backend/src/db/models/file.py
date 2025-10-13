from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from src.db.base import Base


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    file_type = Column(String)
    created_at = Column(DateTime, server_default=func.now())
