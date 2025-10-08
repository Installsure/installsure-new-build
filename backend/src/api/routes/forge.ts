import { Router, Request, Response } from 'express';
import { forgeService } from '../../services/forgeService.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  forgeUploadSchema,
  forgeTranslateSchema,
  forgeAuthResponseSchema,
  forgeUploadResponseSchema,
  forgeTranslationResponseSchema,
  forgeManifestResponseSchema,
  forgePropertiesResponseSchema,
  forgeTakeoffResponseSchema,
} from '../schemas/files.js';
import { z } from 'zod';

const router = Router();

// POST /api/autocad/auth - Get 2-legged token
router.post(
  '/auth',
  asyncHandler(async (req: Request, res: Response) => {
    // This is a simple endpoint that returns a mock token
    // In a real implementation, this would call the Forge service
    res.json({
      token: 'mock-forge-token',
    });
  }),
);

// POST /api/autocad/upload - Upload file to Forge
router.post(
  '/upload',
  validateBody(forgeUploadSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await forgeService.uploadFile(req.body, req.requestId);
    res.json(result);
  }),
);

// POST /api/autocad/translate - Start translation job
router.post(
  '/translate',
  validateBody(forgeTranslateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await forgeService.translateFile(req.body, req.requestId);
    res.json(result);
  }),
);

// GET /api/autocad/manifest/:urn - Get model manifest
router.get(
  '/manifest/:urn',
  validateParams(z.object({ urn: z.string() })),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await forgeService.getManifest(req.params.urn, req.requestId);
    res.json(result);
  }),
);

// GET /api/autocad/properties/:urn - Get model properties
router.get(
  '/properties/:urn',
  validateParams(z.object({ urn: z.string() })),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await forgeService.getProperties(req.params.urn, req.requestId);
    res.json(result);
  }),
);

// GET /api/autocad/takeoff/:urn - Get quantity takeoff
router.get(
  '/takeoff/:urn',
  validateParams(z.object({ urn: z.string() })),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await forgeService.getTakeoff(req.params.urn, req.requestId);
    res.json(result);
  }),
);

export default router;
