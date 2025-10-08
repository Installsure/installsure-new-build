import { Router, Request, Response } from 'express';
import multer from 'multer';
import { filesService } from '../../services/filesService.js';
import { validateParams } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { idSchema } from '../schemas/common.js';
import { logger } from '../../infra/logger.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/temp';
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
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
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.ifc', '.dwg', '.rvt', '.step', '.obj', '.gltf', '.glb'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      const error = new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      cb(error);
    }
  },
});

// GET /api/files - List all files
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const files = await filesService.getAllFiles(req.requestId);
    res.json(files);
  }),
);

// GET /api/files/stats - Get file statistics
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await filesService.getFileStats(req.requestId);
    res.json(stats);
  }),
);

// POST /api/files/upload - Upload file
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = await filesService.uploadFile(req.file, req.requestId);
    res.status(201).json(file);
  }),
);

// GET /api/files/:id - Get file by ID
router.get(
  '/:id',
  validateParams(idSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const file = await filesService.getFileById(parseInt(req.params.id), req.requestId);
    res.json(file);
  }),
);

// DELETE /api/files/:id - Delete file
router.delete(
  '/:id',
  validateParams(idSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await filesService.deleteFile(parseInt(req.params.id), req.requestId);
    res.status(204).send();
  }),
);

export default router;
