from pathlib import Path


def get_file_path(file_id: int) -> str:
    """Get file path for file ID"""
    # Placeholder - should query database
    return f"../uploads/file_{file_id}.ifc"


def save_result(result: dict, output_path: str):
    """Save processing result to file"""
    import json
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)
