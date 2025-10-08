import { z } from 'zod';
import { fileTypeSchema } from './common.js';

export const fileResponseSchema = z.object({
  id: z.number().int().positive(),
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int().positive(),
  file_type: z.string(),
  created_at: z.string().datetime(),
});

export const fileUploadResponseSchema = z.object({
  id: z.number().int().positive(),
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int().positive(),
  file_type: z.string(),
  created_at: z.string().datetime(),
  url: z.string().optional(),
});

export const forgeUploadSchema = z.object({
  fileBuffer: z.string(), // base64 encoded
  fileName: z.string().min(1),
});

export const forgeTranslateSchema = z.object({
  objectId: z.string().min(1),
  fileName: z.string().min(1),
});

export const forgeAuthResponseSchema = z.object({
  token: z.string(),
});

export const forgeUploadResponseSchema = z.object({
  objectId: z.string(),
  bucketKey: z.string(),
  objectKey: z.string(),
  size: z.number(),
  location: z.string(),
});

export const forgeTranslationResponseSchema = z.object({
  urn: z.string(),
  status: z.string(),
  progress: z.string(),
  output: z.object({
    destination: z.object({
      region: z.string(),
    }),
    formats: z.array(
      z.object({
        type: z.string(),
        views: z.array(z.string()),
      }),
    ),
  }),
});

export const forgeManifestResponseSchema = z.object({
  urn: z.string(),
  status: z.string(),
  progress: z.string(),
  region: z.string(),
  version: z.string(),
  derivatives: z.array(z.any()),
});

export const forgePropertiesResponseSchema = z.object({
  collection: z.array(z.any()),
});

export const forgeTakeoffResponseSchema = z.object({
  areas: z.array(z.any()),
  lengths: z.array(z.any()),
  volumes: z.array(z.any()),
  counts: z.array(z.any()),
});
