const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8000;

// CORS configuration - fixed ports
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Create uploads directory
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration with size limit
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Currently only PDF is supported.'));
    }
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: "operational", 
    version: "2.0.0" 
  });
});

// Health endpoint - fixed
app.get('/api/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    services: {
      api: "operational",
      bim_processor: "operational",
      upload_service: "operational"
    }
  });
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    total_projects: 2,
    total_uploads: 5,
    pages_processed: 42,
    avg_cost: 1875.50
  });
});

// Projects endpoint
app.get('/api/projects', (req, res) => {
  res.json([
    { id: "demo-001", name: "Sample Project A", created_at: "2025-09-15T12:00:00Z" },
    { id: "demo-002", name: "Sample Project B", created_at: "2025-10-01T09:30:00Z" }
  ]);
});

// Upload endpoint with proper PDF processing simulation
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    const filename = req.file.originalname;
    const fileSize = req.file.size;
    
    // Simulate PDF processing
    const simulatedPages = Math.floor(Math.random() * 20) + 5; // 5-25 pages
    const baseCostPerPage = 25.0;
    const complexityMultiplier = 1.0;
    const subtotal = simulatedPages * baseCostPerPage * complexityMultiplier;
    const taxes = Math.round(subtotal * 0.0825 * 100) / 100;
    const total = Math.round((subtotal + taxes) * 100) / 100;

    const estimation = {
      file: filename,
      pages: simulatedPages,
      assumptions: {
        base_cost_per_page: baseCostPerPage,
        complexity_multiplier: complexityMultiplier,
        tax_rate: 0.0825
      },
      costs: {
        subtotal: Math.round(subtotal * 100) / 100,
        taxes: taxes,
        total: total
      },
      line_items: [
        {
          name: "Baseline takeoff",
          qty: simulatedPages,
          unit: "page",
          unit_cost: baseCostPerPage,
          amount: Math.round(simulatedPages * baseCostPerPage * 100) / 100
        }
      ]
    };

    res.json({
      status: "ok",
      estimation: estimation,
      meta: {
        stored_at: req.file.path,
        size: fileSize
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload processing failed',
      detail: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File exceeds MAX_FILE_SIZE=52428800 bytes.'
      });
    }
  }
  
  if (error.message.includes('Unsupported file type')) {
    return res.status(400).json({
      error: error.message
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 InstallSure API v2.0.0 running on http://0.0.0.0:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`📁 Upload: POST http://localhost:${PORT}/api/upload`);
  console.log(`✅ CORS enabled for: http://localhost:5173, http://localhost:3000`);
});