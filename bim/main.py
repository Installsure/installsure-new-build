from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import ifcopenshell
import numpy as np
import pandas as pd
import os
import json
import redis
import httpx
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="InstallSure BIM Processing Service",
    description="Advanced BIM file processing and quantity takeoff service",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# Data models
class BIMProcessingRequest(BaseModel):
    file_path: str
    project_id: str
    processing_options: Optional[Dict[str, Any]] = {}

class QuantityTakeoff(BaseModel):
    element_type: str
    quantity: float
    unit: str
    cost_estimate: Optional[float] = None
    material: Optional[str] = None

class BIMProcessingResult(BaseModel):
    success: bool
    processing_time: float
    total_elements: int
    quantity_takeoffs: List[QuantityTakeoff]
    bim_data: Dict[str, Any]
    cost_summary: Dict[str, Any]

# Cost database (in production, this would be a proper database)
COST_DATABASE = {
    "wall": {"material_cost_per_m2": 45.0, "labor_cost_per_m2": 35.0},
    "slab": {"material_cost_per_m2": 65.0, "labor_cost_per_m2": 25.0},
    "beam": {"material_cost_per_m": 120.0, "labor_cost_per_m": 80.0},
    "column": {"material_cost_per_m": 150.0, "labor_cost_per_m": 100.0},
    "door": {"material_cost_per_unit": 350.0, "labor_cost_per_unit": 150.0},
    "window": {"material_cost_per_unit": 280.0, "labor_cost_per_unit": 120.0},
    "roof": {"material_cost_per_m2": 85.0, "labor_cost_per_m2": 45.0},
}

def extract_element_properties(element):
    """Extract properties from IFC element"""
    properties = {}
    
    # Basic properties
    properties['global_id'] = getattr(element, 'GlobalId', '')
    properties['name'] = getattr(element, 'Name', '')
    properties['type'] = element.is_a()
    
    # Geometric properties
    try:
        if hasattr(element, 'Representation'):
            properties['has_geometry'] = True
        else:
            properties['has_geometry'] = False
    except:
        properties['has_geometry'] = False
    
    # Material properties
    properties['materials'] = []
    try:
        if hasattr(element, 'HasAssociations'):
            for association in element.HasAssociations:
                if association.is_a('IfcRelAssociatesMaterial'):
                    material = association.RelatingMaterial
                    if material.is_a('IfcMaterial'):
                        properties['materials'].append(material.Name)
    except:
        pass
    
    return properties

def calculate_quantities(ifc_file):
    """Calculate quantities from IFC file"""
    quantities = []
    
    # Process walls
    walls = ifc_file.by_type('IfcWall')
    for wall in walls:
        try:
            # Get wall properties
            properties = extract_element_properties(wall)
            
            # Calculate area (simplified calculation)
            if hasattr(wall, 'Representation') and wall.Representation:
                # In a real implementation, you would extract actual geometry
                # For demo purposes, using placeholder values
                area = np.random.uniform(10.0, 50.0)  # m²
                
                material_cost = area * COST_DATABASE["wall"]["material_cost_per_m2"]
                labor_cost = area * COST_DATABASE["wall"]["labor_cost_per_m2"]
                
                quantities.append(QuantityTakeoff(
                    element_type="Wall",
                    quantity=area,
                    unit="m²",
                    cost_estimate=material_cost + labor_cost,
                    material=properties['materials'][0] if properties['materials'] else "Concrete"
                ))
        except Exception as e:
            logger.warning(f"Error processing wall {wall.GlobalId}: {e}")
    
    # Process slabs
    slabs = ifc_file.by_type('IfcSlab')
    for slab in slabs:
        try:
            properties = extract_element_properties(slab)
            area = np.random.uniform(20.0, 100.0)  # m²
            
            material_cost = area * COST_DATABASE["slab"]["material_cost_per_m2"]
            labor_cost = area * COST_DATABASE["slab"]["labor_cost_per_m2"]
            
            quantities.append(QuantityTakeoff(
                element_type="Slab",
                quantity=area,
                unit="m²",
                cost_estimate=material_cost + labor_cost,
                material=properties['materials'][0] if properties['materials'] else "Concrete"
            ))
        except Exception as e:
            logger.warning(f"Error processing slab {slab.GlobalId}: {e}")
    
    # Process beams
    beams = ifc_file.by_type('IfcBeam')
    for beam in beams:
        try:
            properties = extract_element_properties(beam)
            length = np.random.uniform(3.0, 12.0)  # m
            
            material_cost = length * COST_DATABASE["beam"]["material_cost_per_m"]
            labor_cost = length * COST_DATABASE["beam"]["labor_cost_per_m"]
            
            quantities.append(QuantityTakeoff(
                element_type="Beam",
                quantity=length,
                unit="m",
                cost_estimate=material_cost + labor_cost,
                material=properties['materials'][0] if properties['materials'] else "Steel"
            ))
        except Exception as e:
            logger.warning(f"Error processing beam {beam.GlobalId}: {e}")
    
    # Process doors and windows
    doors = ifc_file.by_type('IfcDoor')
    for door in doors:
        try:
            properties = extract_element_properties(door)
            
            material_cost = COST_DATABASE["door"]["material_cost_per_unit"]
            labor_cost = COST_DATABASE["door"]["labor_cost_per_unit"]
            
            quantities.append(QuantityTakeoff(
                element_type="Door",
                quantity=1.0,
                unit="unit",
                cost_estimate=material_cost + labor_cost,
                material=properties['materials'][0] if properties['materials'] else "Wood"
            ))
        except Exception as e:
            logger.warning(f"Error processing door {door.GlobalId}: {e}")
    
    windows = ifc_file.by_type('IfcWindow')
    for window in windows:
        try:
            properties = extract_element_properties(window)
            
            material_cost = COST_DATABASE["window"]["material_cost_per_unit"]
            labor_cost = COST_DATABASE["window"]["labor_cost_per_unit"]
            
            quantities.append(QuantityTakeoff(
                element_type="Window",
                quantity=1.0,
                unit="unit",
                cost_estimate=material_cost + labor_cost,
                material=properties['materials'][0] if properties['materials'] else "Aluminum"
            ))
        except Exception as e:
            logger.warning(f"Error processing window {window.GlobalId}: {e}")
    
    return quantities

def generate_cost_summary(quantities: List[QuantityTakeoff]) -> Dict[str, Any]:
    """Generate cost summary from quantities"""
    summary = {
        "total_cost": 0.0,
        "by_element_type": {},
        "by_material": {},
        "element_count": len(quantities)
    }
    
    for qty in quantities:
        # By element type
        if qty.element_type not in summary["by_element_type"]:
            summary["by_element_type"][qty.element_type] = {
                "total_cost": 0.0,
                "total_quantity": 0.0,
                "count": 0
            }
        
        summary["by_element_type"][qty.element_type]["total_cost"] += qty.cost_estimate or 0.0
        summary["by_element_type"][qty.element_type]["total_quantity"] += qty.quantity
        summary["by_element_type"][qty.element_type]["count"] += 1
        
        # By material
        material = qty.material or "Unknown"
        if material not in summary["by_material"]:
            summary["by_material"][material] = {
                "total_cost": 0.0,
                "element_types": set()
            }
        
        summary["by_material"][material]["total_cost"] += qty.cost_estimate or 0.0
        summary["by_material"][material]["element_types"].add(qty.element_type)
        
        summary["total_cost"] += qty.cost_estimate or 0.0
    
    # Convert sets to lists for JSON serialization
    for material in summary["by_material"]:
        summary["by_material"][material]["element_types"] = list(summary["by_material"][material]["element_types"])
    
    return summary

async def process_ifc_file(file_path: str, project_id: str) -> BIMProcessingResult:
    """Process IFC file and extract quantities"""
    start_time = datetime.now()
    
    try:
        # Open IFC file
        ifc_file = ifcopenshell.open(file_path)
        
        # Extract basic information
        project = ifc_file.by_type('IfcProject')[0] if ifc_file.by_type('IfcProject') else None
        buildings = ifc_file.by_type('IfcBuilding')
        
        # Calculate quantities
        quantities = calculate_quantities(ifc_file)
        
        # Generate cost summary
        cost_summary = generate_cost_summary(quantities)
        
        # Create BIM data summary
        bim_data = {
            "project_info": {
                "name": project.Name if project else "Unknown Project",
                "global_id": project.GlobalId if project else "",
                "description": project.Description if project else ""
            },
            "building_count": len(buildings),
            "total_elements": len(ifc_file.by_type('IfcProduct')),
            "element_summary": {
                "walls": len(ifc_file.by_type('IfcWall')),
                "slabs": len(ifc_file.by_type('IfcSlab')),
                "beams": len(ifc_file.by_type('IfcBeam')),
                "columns": len(ifc_file.by_type('IfcColumn')),
                "doors": len(ifc_file.by_type('IfcDoor')),
                "windows": len(ifc_file.by_type('IfcWindow')),
            }
        }
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        result = BIMProcessingResult(
            success=True,
            processing_time=processing_time,
            total_elements=bim_data["total_elements"],
            quantity_takeoffs=quantities,
            bim_data=bim_data,
            cost_summary=cost_summary
        )
        
        # Cache result in Redis
        cache_key = f"bim_processing:{project_id}:{os.path.basename(file_path)}"
        redis_client.setex(
            cache_key, 
            int(os.getenv("CACHE_TTL", "3600")),
            json.dumps(result.dict(), default=str)
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing IFC file {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process IFC file: {str(e)}")

# API Routes

@app.get("/")
async def root():
    return {"message": "InstallSure BIM Processing Service", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "redis": "connected" if redis_client.ping() else "disconnected",
            "ifc_processor": "operational"
        }
    }

@app.post("/process-ifc", response_model=BIMProcessingResult)
async def process_ifc_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: str = "default"
):
    """Process uploaded IFC file"""
    
    if not file.filename.lower().endswith('.ifc'):
        raise HTTPException(status_code=400, detail="Only IFC files are supported")
    
    # Save uploaded file
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{project_id}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Process file
    result = await process_ifc_file(file_path, project_id)
    
    # Clean up file in background
    background_tasks.add_task(os.remove, file_path)
    
    return result

@app.post("/process-ifc-path", response_model=BIMProcessingResult)
async def process_ifc_from_path(request: BIMProcessingRequest):
    """Process IFC file from file path"""
    
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check cache first
    cache_key = f"bim_processing:{request.project_id}:{os.path.basename(request.file_path)}"
    cached_result = redis_client.get(cache_key)
    
    if cached_result:
        logger.info(f"Returning cached result for {request.file_path}")
        return BIMProcessingResult(**json.loads(cached_result))
    
    # Process file
    return await process_ifc_file(request.file_path, request.project_id)

@app.get("/cost-database")
async def get_cost_database():
    """Get current cost database"""
    return {"cost_database": COST_DATABASE}

@app.put("/cost-database")
async def update_cost_database(costs: Dict[str, Dict[str, float]]):
    """Update cost database"""
    global COST_DATABASE
    COST_DATABASE.update(costs)
    return {"message": "Cost database updated", "cost_database": COST_DATABASE}

@app.get("/cache/clear")
async def clear_cache():
    """Clear Redis cache"""
    redis_client.flushdb()
    return {"message": "Cache cleared"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)