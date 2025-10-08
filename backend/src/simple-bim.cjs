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

// Simple health check first
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'BIM/CAD Estimating Engine',
    version: '1.0.0'
  });
});

// Basic file stats
app.get('/api/files/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalFiles: 5,
      totalSize: 75497472,
      byType: {
        'pdf': 1,
        'dwg': 2,
        'ifc': 1,
        'rvt': 1
      }
    }
  });
});

// Simple BIM estimation endpoint
app.post('/api/bim/estimate', (req, res) => {
  const { project_name = 'Whispering Pines Building A' } = req.body;
  
  res.json({
    success: true,
    data: {
      project_name,
      processed_at: new Date().toISOString(),
      summary: {
        walls: { count: 18, area_m2: 94.2 },
        doors: { count: 6, area_m2: 12.0 },
        windows: { count: 12, area_m2: 18.5 }
      },
      total_estimate: {
        materials_cost: 15702.80,
        labor_cost: 12200.00,
        total_project_cost: 36127.39
      }
    }
  });
});

// AutoCAD endpoints
app.post('/api/autocad/auth', (req, res) => {
  res.json({
    success: true,
    data: {
      token: 'mock-token-' + Date.now(),
      expires_in: 3600
    }
  });
});

app.get('/api/autocad/takeoff/:urn', (req, res) => {
  res.json({
    success: true,
    data: {
      areas: [
        { name: 'Floor Area', value: 616.1, unit: 'm²' },
        { name: 'Wall Area', value: 350.4, unit: 'm²' }
      ],
      volumes: [
        { name: 'Building Volume', value: 1848.3, unit: 'm³' }
      ]
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BIM/CAD Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`📐 Estimate: http://localhost:${PORT}/api/bim/estimate`);
  console.log(`🔧 AutoCAD: http://localhost:${PORT}/api/autocad/takeoff/test`);
});

module.exports = app;