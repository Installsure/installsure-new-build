def ingest_drone_scan(project_id: int, file_path: str) -> dict:
    """Ingest drone scan data"""
    return {"status": "ingested", "project_id": project_id}
