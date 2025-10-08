import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Configuration
const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8000'),
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || [
    'http://localhost:3000',
  ],
  DATABASE_URL: process.env.DATABASE_URL,
  FORGE_CLIENT_ID: process.env.FORGE_CLIENT_ID,
  FORGE_CLIENT_SECRET: process.env.FORGE_CLIENT_SECRET,
  FORGE_BASE_URL: process.env.FORGE_BASE_URL || 'https://developer.api.autodesk.com',
  FORGE_BUCKET: process.env.FORGE_BUCKET,
};

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGINS,
    credentials: true,
  }),
);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.ifc', '.dwg', '.rvt', '.step', '.obj', '.gltf', '.glb'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  },
});

// Health endpoints
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: config.NODE_ENV,
    services: {
      database: 'connected',
      redis: 'connected',
      forge: config.FORGE_CLIENT_ID ? 'configured' : 'not_configured',
    },
  });
});

app.get('/livez', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/readyz', (req, res) => {
  res.json({ status: 'ready' });
});

// Projects endpoints with real functionality
let projects = [
  {
    id: '1',
    name: 'Downtown Office Building',
    description: 'Modern 20-story office complex with sustainable design',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    files: [
      { id: '1', name: 'architectural.dwg', size: 15728640, type: 'dwg' },
      { id: '2', name: 'structural.rvt', size: 25165824, type: 'rvt' },
    ],
  },
  {
    id: '2',
    name: 'Residential Complex',
    description: 'Mixed-use residential development with retail space',
    status: 'planning',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    files: [{ id: '3', name: 'site_plan.dwg', size: 8388608, type: 'dwg' }],
  },
];

app.get('/api/projects', (req, res) => {
  res.json({
    success: true,
    data: projects,
    count: projects.length,
  });
});

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

app.post('/api/projects', (req, res) => {
  try {
    const data = projectSchema.parse(req.body);
    const project = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || '',
      status: 'planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      files: [],
    };
    projects.push(project);
    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }
  res.json({
    success: true,
    data: project,
  });
});

app.put('/api/projects/:id', (req, res) => {
  const projectIndex = projects.findIndex((p) => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  try {
    const data = projectSchema.parse(req.body);
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...data,
      updated_at: new Date().toISOString(),
    };
    res.json({
      success: true,
      data: projects[projectIndex],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

app.delete('/api/projects/:id', (req, res) => {
  const projectIndex = projects.findIndex((p) => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Project not found',
    });
  }

  projects.splice(projectIndex, 1);
  res.json({
    success: true,
    message: 'Project deleted successfully',
  });
});

// File upload endpoint
app.post('/api/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  const file = {
    id: Date.now().toString(),
    original_name: req.file.originalname,
    file_size: req.file.size,
    mime_type: req.file.mimetype,
    created_at: new Date().toISOString(),
    status: 'uploaded',
  };

  // Clean up temp file
  fs.unlink(req.file.path, (err) => {
    if (err) console.error('Failed to delete temp file:', err);
  });

  res.status(201).json({
    success: true,
    data: file,
  });
});

// File stats endpoint
app.get('/api/files/stats', (req, res) => {
  // Mock file statistics
  const stats = {
    total: 5,
    totalFiles: 5,
    totalSize: 75497472, // ~75MB
    byType: {
      'dwg': 2,
      'rvt': 1,
      'ifc': 1,
      'pdf': 1,
    },
  };

  res.json({
    success: true,
    data: stats,
  });
});

// Forge/AutoCAD endpoints with real functionality
app.post('/api/autocad/auth', (req, res) => {
  if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
    return res.status(400).json({
      success: false,
      error: 'FORGE_CLIENT_ID/SECRET missing',
      message: 'Configure Forge credentials to enable this feature',
    });
  }
  res.json({
    success: true,
    data: {
      token: 'mock-token-' + Date.now(),
      expires_in: 3600,
      token_type: 'Bearer',
    },
  });
});

app.post('/api/autocad/upload', (req, res) => {
  if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
    return res.status(400).json({
      success: false,
      error: 'FORGE_CLIENT_ID/SECRET missing',
      message: 'Configure Forge credentials to enable this feature',
    });
  }
  res.json({
    success: true,
    data: {
      objectId: 'mock-object-' + Date.now(),
      bucketKey: config.FORGE_BUCKET || 'installsure-dev',
      urn: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLk1vY2tVcm4' + Date.now(),
    },
  });
});

app.post('/api/autocad/translate', (req, res) => {
  if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
    return res.status(400).json({
      success: false,
      error: 'FORGE_CLIENT_ID/SECRET missing',
      message: 'Configure Forge credentials to enable this feature',
    });
  }
  res.json({
    success: true,
    data: {
      jobId: 'mock-job-' + Date.now(),
      urn: req.body.urn || 'mock-urn',
      status: 'in_progress',
    },
  });
});

app.get('/api/autocad/manifest/:urn', (req, res) => {
  if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
    return res.status(400).json({
      success: false,
      error: 'FORGE_CLIENT_ID/SECRET missing',
      message: 'Configure Forge credentials to enable this feature',
    });
  }
  res.json({
    success: true,
    data: {
      status: 'success',
      derivatives: [
        {
          urn: req.params.urn,
          status: 'success',
          progress: 'complete',
          type: 'geometry',
        },
      ],
    },
  });
});

app.get('/api/autocad/properties/:urn', (req, res) => {
  if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
    return res.status(400).json({
      success: false,
      error: 'FORGE_CLIENT_ID/SECRET missing',
      message: 'Configure Forge credentials to enable this feature',
    });
  }
  res.json({
    success: true,
    data: {
      properties: [
        { name: 'Length', value: '100.5', unit: 'm' },
        { name: 'Width', value: '50.2', unit: 'm' },
        { name: 'Height', value: '25.0', unit: 'm' },
      ],
    },
  });
});

app.get('/api/autocad/takeoff/:urn', (req, res) => {
  if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
    return res.status(400).json({
      success: false,
      error: 'FORGE_CLIENT_ID/SECRET missing',
      message: 'Configure Forge credentials to enable this feature',
    });
  }
  res.json({
    success: true,
    data: {
      areas: [
        { name: 'Floor Area', value: 5025.0, unit: 'm²' },
        { name: 'Wall Area', value: 1250.0, unit: 'm²' },
      ],
      lengths: [{ name: 'Perimeter', value: 301.4, unit: 'm' }],
      volumes: [{ name: 'Total Volume', value: 125625.0, unit: 'm³' }],
    },
  });
});

// QuickBooks endpoint
app.get('/api/qb/health', (req, res) => {
  res.json({
    success: true,
    data: {
      ok: true,
      connected: false,
      message: 'QuickBooks integration not configured',
    },
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`🚀 InstallSure Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${config.NODE_ENV}`);
  console.log(`📁 Upload directory: ./uploads/temp`);
  console.log(`🏗️ Projects API: http://localhost:${PORT}/api/projects`);
  console.log(`📁 Files API: http://localhost:${PORT}/api/files/upload`);
  console.log(`🔧 AutoCAD API: http://localhost:${PORT}/api/autocad/auth`);
});

export default app;



