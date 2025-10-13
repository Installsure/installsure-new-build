def ingest_scan(project_id: int, file_path: str) -> dict:
    """Ingest drone scan data"""
    # register point cloud metadata; schedule alignment job
    return {"status": "queued"}
