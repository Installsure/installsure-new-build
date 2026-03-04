import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { plansUploadService, UploadError } from '../../services/plansUploadService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../../infra/logger.js';
import { config } from '../../infra/config.js';
import { z } from 'zod';

const router = Router();

// ─── Multer setup ─────────────────────────────────────────────────────────────

const plansUploadDir = config.PLANS_UPLOAD_DIR;

// Ensure upload directory exists
try {
  fs.mkdirSync(plansUploadDir, { recursive: true });
} catch {
  // Directory might already exist
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(plansUploadDir, { recursive: true });
    } catch {
      // ignore
    }
    cb(null, plansUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'plan-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: config.PLANS_MAX_FILE_SIZE },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

const planIdSchema = z.object({
  id: z.string().min(1, 'Plan ID is required'),
});

/**
 * POST /api/plans/upload
 * Upload a plan file (multipart/form-data).
 * Optional form fields: projectId, uploadedById
 */
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    }

    const childLogger = logger.child({
      requestId: req.requestId,
      originalName: req.file.originalname,
      size: req.file.size,
    });

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fsPromises.readFile(req.file.path);
    } catch (err) {
      childLogger.error({ error: (err as Error).message }, 'Failed to read uploaded file from disk');
      return res.status(500).json({ error: 'Failed to process uploaded file' });
    } finally {
      // Always clean up the temp file from disk
      fsPromises.unlink(req.file.path).catch(() => {});
    }

    const projectId = typeof req.body?.projectId === 'string' ? req.body.projectId : undefined;
    const uploadedById = typeof req.body?.uploadedById === 'string' ? req.body.uploadedById : undefined;

    try {
      const planFile = await plansUploadService.uploadPlan(
        fileBuffer,
        req.file.originalname,
        req.file.mimetype,
        { projectId, uploadedById, requestId: req.requestId },
      );

      return res.status(201).json(planFile);
    } catch (err) {
      if (err instanceof UploadError) {
        return res.status(err.statusCode).json({
          error: err.message,
          retryable: err.retryable,
          requestId: req.requestId,
        });
      }
      throw err; // let global error handler deal with unexpected errors
    }
  }),
);

/**
 * GET /api/plans/:id
 * Retrieve plan file metadata by ID.
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = planIdSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const planFile = await plansUploadService.getPlanById(parsed.data.id, req.requestId);
    return res.json(planFile);
  }),
);

export default router;
