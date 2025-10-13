from typing import Dict


def run_auto_takeoff(project_id: int, file_id: int) -> Dict:
    """Run auto-takeoff analysis on file"""
    # enqueue BIM job 'auto_takeoff' with file path
    return {"job": "queued", "project_id": project_id, "file_id": file_id}
