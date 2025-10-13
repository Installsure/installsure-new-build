def load_ifc_file(file_path: str):
    """Load IFC file using ifcopenshell"""
    import ifcopenshell
    return ifcopenshell.open(file_path)


def get_ifc_elements(ifc_file, element_type: str):
    """Get elements of specific type from IFC file"""
    return ifc_file.by_type(element_type)
