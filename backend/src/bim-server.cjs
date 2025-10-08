/**
 * Simple Mock BIM/CAD Server for Testing
 * Demonstrates the 3D BIM estimating workflow endpoints
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration for BIM files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/bim';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `bim_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.ifc', '.pdf', '.dwg', '.rvt', '.step', '.obj'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      bim_parser: 'active',
      estimating_engine: 'ready',
      viewer: 'available'
    }
  });
});

// BIM File Upload and Processing
app.post('/api/bim/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No BIM file uploaded'
    });
  }

  const fileInfo = {
    id: `bim_${Date.now()}`,
    original_name: req.file.originalname,
    file_path: req.file.path,
    file_size: req.file.size,
    mime_type: req.file.mimetype,
    uploaded_at: new Date().toISOString()
  };

  // Simulate BIM file processing
  setTimeout(() => {
    console.log(`📁 Processing BIM file: ${req.file.originalname}`);
  }, 100);

  res.json({
    success: true,
    data: fileInfo,
    message: 'BIM file uploaded successfully'
  });
});

// BIM Estimation Endpoint
app.post('/api/bim/estimate', (req, res) => {
  const { file_id, project_name } = req.body;
  
  // Mock BIM estimation results
  const estimationResult = {
    project_name: project_name || 'Whispering Pines Building A',
    file_id: file_id,
    processed_at: new Date().toISOString(),
    summary: {
      walls: { count: 18, area_m2: 94.2, volume_m3: 23.55 },
      doors: { count: 6, area_m2: 12.0 },
      windows: { count: 12, area_m2: 18.5 },
      slabs: { count: 3, area_m2: 150.0, volume_m3: 22.5 },
      beams: { count: 24, length_m: 144.0, volume_m3: 8.64 },
      columns: { count: 8, height_m: 24.0, volume_m3: 3.84 }
    },
    materials: {
      concrete: { quantity: 58.53, unit: 'm³', cost_per_unit: 120, total_cost: 7023.60 },
      steel_rebar: { quantity: 2.93, unit: 'tonnes', cost_per_unit: 1200, total_cost: 3516.00 },
      drywall: { quantity: 220, unit: 'sheets', cost_per_unit: 15, total_cost: 3300.00 },
      lumber: { quantity: 1250, unit: 'board_feet', cost_per_unit: 0.85, total_cost: 1062.50 },
      insulation: { quantity: 94.2, unit: 'm²', cost_per_unit: 8.50, total_cost: 800.70 }
    },
    labor_estimates: {
      framing: { hours: 120, rate_per_hour: 35, total_cost: 4200.00 },
      concrete_work: { hours: 80, rate_per_hour: 40, total_cost: 3200.00 },
      finishing: { hours: 160, rate_per_hour: 30, total_cost: 4800.00 }
    },
    total_estimate: {
      materials_cost: 15702.80,
      labor_cost: 12200.00,
      equipment_cost: 2500.00,
      overhead: 3040.28,
      profit: 2684.31,
      total_project_cost: 36127.39
    }
  };

  res.json({
    success: true,
    data: estimationResult
  });
});

// IFC Element Tagging
app.post('/api/bim/tag', (req, res) => {
  const { file_id, element_id, tag_type, coordinates, notes } = req.body;
  
  const tag = {
    id: `tag_${Date.now()}`,
    file_id,
    element_id,
    tag_type, // 'defect', 'change_request', 'note', 'quantity_check'
    coordinates,
    notes,
    created_at: new Date().toISOString(),
    status: 'active'
  };

  res.json({
    success: true,
    data: tag,
    message: 'Element tagged successfully'
  });
});

// Get project tags
app.get('/api/bim/tags/:file_id', (req, res) => {
  const { file_id } = req.params;
  
  // Mock tagged elements
  const tags = [
    {
      id: 'tag_001',
      element_id: 'wall_001',
      tag_type: 'defect',
      coordinates: { x: 10.5, y: 2.0, z: 5.2 },
      notes: 'Crack observed in wall section',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'tag_002',
      element_id: 'door_003',
      tag_type: 'change_request',
      coordinates: { x: 15.2, y: 0.1, z: 3.5 },
      notes: 'Client requested wider door opening',
      created_at: new Date(Date.now() - 43200000).toISOString()
    }
  ];

  res.json({
    success: true,
    data: tags
  });
});

// AutoCAD/Forge Integration Endpoints
app.post('/api/autocad/auth', (req, res) => {
  res.json({
    success: true,
    data: {
      token: `forge_token_${Date.now()}`,
      expires_in: 3600,
      token_type: 'Bearer'
    }
  });
});

app.post('/api/autocad/upload', (req, res) => {
  res.json({
    success: true,
    data: {
      objectId: `obj_${Date.now()}`,
      bucketKey: 'installsure-bim-dev',
      urn: `urn:adsk:objects:os.object:installsure-bim-dev/file_${Date.now()}`
    }
  });
});

app.post('/api/autocad/translate', (req, res) => {
  res.json({
    success: true,
    data: {
      jobId: `job_${Date.now()}`,
      urn: req.body.urn,
      status: 'in_progress'
    }
  });
});

app.get('/api/autocad/properties/:urn', (req, res) => {
  res.json({
    success: true,
    data: {
      properties: [
        { name: 'Building Length', value: '30.5', unit: 'm' },
        { name: 'Building Width', value: '20.2', unit: 'm' },
        { name: 'Building Height', value: '3.0', unit: 'm' },
        { name: 'Floor Area', value: '616.1', unit: 'm²' },
        { name: 'Total Volume', value: '1848.3', unit: 'm³' }
      ]
    }
  });
});

app.get('/api/autocad/takeoff/:urn', (req, res) => {
  res.json({
    success: true,
    data: {
      areas: [
        { name: 'Total Floor Area', value: 616.1, unit: 'm²' },
        { name: 'Wall Area', value: 350.4, unit: 'm²' },
        { name: 'Roof Area', value: 650.0, unit: 'm²' }
      ],
      lengths: [
        { name: 'Exterior Perimeter', value: 101.4, unit: 'm' },
        { name: 'Interior Walls', value: 85.2, unit: 'm' }
      ],
      volumes: [
        { name: 'Building Volume', value: 1848.3, unit: 'm³' },
        { name: 'Concrete Volume', value: 58.5, unit: 'm³' }
      ],
      counts: [
        { name: 'Doors', value: 6, unit: 'units' },
        { name: 'Windows', value: 12, unit: 'units' },
        { name: 'Electrical Outlets', value: 24, unit: 'units' }
      ]
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BIM/CAD Estimating Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏗️ BIM Upload: http://localhost:${PORT}/api/bim/upload`);
  console.log(`📐 Estimation: http://localhost:${PORT}/api/bim/estimate`);
  console.log(`🔧 AutoCAD API: http://localhost:${PORT}/api/autocad/*`);
  console.log('');
  console.log('📁 Upload directory: ./uploads/bim');
  console.log('🎯 Ready for BIM/CAD 3D estimating tests!');
});

module.exports = app;