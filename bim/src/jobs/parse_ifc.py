def parse_ifc(file_path: str) -> dict:
    """Parse IFC file and return summary"""
    # load IfcOpenShell and return summary counts/geometry handles
    import ifcopenshell
    m = ifcopenshell.open(file_path)
    walls = m.by_type("IfcWall")
    doors = m.by_type("IfcDoor")
    return {"walls": len(walls), "doors": len(doors)}
