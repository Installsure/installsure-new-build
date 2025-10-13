from typing import Dict


def diff_versions(project_id: int, base_file_id: int, new_file_id: int) -> Dict:
    """Compute differences between two plan versions"""
    # compute geo/element deltas; return {added:[], removed:[], changed:[]}
    return {"added": [], "removed": [], "changed": []}
