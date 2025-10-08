from __future__ import annotations
from PyPDF2 import PdfReader
from pathlib import Path
from typing import Dict, Any

def process_pdf(pdf_path: Path) -> Dict[str, Any]:
    # Why: Keep a deterministic, explainable baseline cost model for demos.
    reader = PdfReader(str(pdf_path))
    num_pages = len(reader.pages)
    base_cost_per_page = 25.0
    complexity_multiplier = 1.0  # TODO: derive from content in future
    subtotal = num_pages * base_cost_per_page * complexity_multiplier
    taxes = round(subtotal * 0.0825, 2)
    total = round(subtotal + taxes, 2)
    return {
        "file": pdf_path.name,
        "pages": num_pages,
        "assumptions": {
            "base_cost_per_page": base_cost_per_page,
            "complexity_multiplier": complexity_multiplier,
            "tax_rate": 0.0825,
        },
        "costs": {
            "subtotal": round(subtotal, 2),
            "taxes": taxes,
            "total": total,
        },
        "line_items": [
            {"name": "Baseline takeoff", "qty": num_pages, "unit": "page", "unit_cost": base_cost_per_page, "amount": round(num_pages * base_cost_per_page, 2)}
        ],
    }