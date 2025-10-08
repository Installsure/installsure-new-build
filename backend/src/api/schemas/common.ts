import { z } from 'zod';

// Common schemas
export const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(100).optional(),
});

// Response schemas
export const successResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.any(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  requestId: z.string().optional(),
  retryAfter: z.number().optional(),
  stack: z.string().optional(),
  details: z.any().optional(),
});

// Health check schemas
export const healthResponseSchema = z.object({
  ok: z.boolean(),
  uptime: z.number(),
  version: z.string(),
  timestamp: z.string(),
  environment: z.string(),
});

// File schemas
export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number().int().positive(),
  destination: z.string(),
  filename: z.string(),
  path: z.string(),
});

export const allowedFileTypes = ['.ifc', '.dwg', '.rvt', '.step', '.obj', '.gltf', '.glb'] as const;

export const fileTypeSchema = z.enum(allowedFileTypes);
