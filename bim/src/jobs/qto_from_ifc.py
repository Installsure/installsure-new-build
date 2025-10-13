def qto_from_ifc(file_path: str) -> dict:
    """Compute QTO from IFC file"""
    # compute simple QTO totals; extend with proper geometry in rules.py
    return {"wall_area_m2": 0.0, "door_count": 0}
