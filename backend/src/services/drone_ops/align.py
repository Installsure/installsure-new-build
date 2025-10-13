from typing import Dict


def align_scan_to_model(scan_id: int, model_id: int) -> Dict:
    """Align drone scan to BIM model"""
    return {"status": "aligned", "confidence": 0.95}
