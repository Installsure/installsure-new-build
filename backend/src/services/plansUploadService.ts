import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { db } from '../data/db.js';
import { storage } from '../infra/storage.js';
import { logger } from '../infra/logger.js';
import { createError } from '../api/middleware/errorHandler.js';
import { config } from '../infra/config.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlanFile {
  id: string;
  project_id: string | null;
  uploaded_by_id: string | null;
  name: string;
  type: string;
  path: string;
  checksum: string;
  size: number;
  mime_type: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface UploadPlanOptions {
  projectId?: string;
  uploadedById?: string;
  requestId?: string;
}

// Error subclass that indicates whether it's safe to retry
export class UploadError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'UploadError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.ifc', '.dwg', '.rvt', '.step', '.obj', '.gltf', '.glb', '.png', '.jpg', '.jpeg']);
const MAX_FILE_SIZE = config.PLANS_MAX_FILE_SIZE;
const DISK_SPACE_BUFFER_BYTES = 100 * 1024 * 1024; // 100 MB safety margin
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;
const UPLOAD_DIR = config.FILES_LOCAL_DIR;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Calculate SHA-256 hex digest for a buffer. */
export function calculateChecksum(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Sanitize a filename:
 *  - Strip directory components (path traversal protection)
 *  - Collapse consecutive dots / whitespace
 *  - Replace any characters outside alphanumerics, hyphens, underscores, dots
 */
export function sanitizeFilename(filename: string): string {
  // Remove any directory separators
  const base = path.basename(filename);
  // Replace dangerous characters while keeping extension dot
  const sanitized = base
    .replace(/\.{2,}/g, '.') // collapse multiple dots
    .replace(/[^a-zA-Z0-9._-]/g, '_') // keep safe chars
    .replace(/^[._-]+/, '') // strip leading dots/hyphens
    .slice(0, 255); // enforce max length

  if (!sanitized) {
    throw new UploadError('Filename is invalid after sanitization', 400, false);
  }

  return sanitized;
}

/**
 * Verify the file extension is on the allow-list.
 * Returns the lower-cased extension.
 */
export function validateExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new UploadError(
      `Invalid file type "${ext}". Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
      400,
      false,
    );
  }
  return ext;
}

/**
 * Check that the filesystem containing UPLOAD_DIR has at least
 * `requiredBytes + DISK_SPACE_BUFFER_BYTES` of free space.
 */
export async function validateDiskSpace(requiredBytes: number): Promise<void> {
  interface StatFsStats { bavail: number; bsize: number; }
  try {
    const statfs = (fsSync as any).statfs;
    if (typeof statfs !== 'function') {
      // statfs is not available (Node < 19); skip check with a warning
      logger.warn('fs.statfs not available – skipping disk space check');
      return;
    }
    const stats = await new Promise<StatFsStats>((resolve, reject) => {
      statfs(UPLOAD_DIR, (err: NodeJS.ErrnoException | null, stats: StatFsStats) => {
        if (err) reject(err);
        else resolve(stats);
      });
    });
    const freeBytes = stats.bavail * stats.bsize;
    const needed = requiredBytes + DISK_SPACE_BUFFER_BYTES;
    if (freeBytes < needed) {
      throw new UploadError(
        `Insufficient disk space. Need ${needed} bytes, available ${freeBytes} bytes`,
        507,
        false,
      );
    }
  } catch (err) {
    if (err instanceof UploadError) throw err;
    // If statfs fails (e.g. in test env), log a warning but don't block the upload
    logger.warn({ error: (err as Error).message }, 'Disk space check failed – skipping');
  }
}

/**
 * Execute an async operation with exponential back-off retry.
 * Retries only if the error is marked `retryable`.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; operationName?: string } = {},
): Promise<T> {
  const { maxRetries = MAX_RETRIES, baseDelayMs = BASE_RETRY_DELAY_MS, operationName = 'operation' } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err as Error;

      const isRetryable = !(err instanceof UploadError) || (err as UploadError).retryable;

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      logger.warn(
        { operationName, attempt: attempt + 1, maxRetries, delay, error: lastError.message },
        'Retrying operation after failure',
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ─── Service class ────────────────────────────────────────────────────────────

export class PlansUploadService {
  /**
   * Upload a plan file with full resilience:
   * - SHA-256 checksum & deduplication
   * - File size & extension validation
   * - Disk space check
   * - Exponential-backoff retry on storage write
   * - Transaction-safe DB insert
   * - Correlation-ID request logging
   */
  async uploadPlan(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    options: UploadPlanOptions = {},
  ): Promise<PlanFile> {
    const { projectId, uploadedById, requestId } = options;
    const childLogger = logger.child({ requestId, service: 'plans-upload', originalFilename });

    childLogger.info({ size: fileBuffer.length, mimeType }, 'Starting plan upload');

    // 1. Validate & sanitize filename (path-traversal protection)
    const safeFilename = sanitizeFilename(originalFilename);
    const fileExt = validateExtension(safeFilename);

    // 2. Validate file size
    if (fileBuffer.length === 0) {
      throw new UploadError('File is empty', 400, false);
    }
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new UploadError(
        `File too large. Maximum allowed size is ${MAX_FILE_SIZE} bytes`,
        413,
        false,
      );
    }

    // 3. Validate disk space
    await validateDiskSpace(fileBuffer.length);

    // 4. Calculate SHA-256 checksum
    const checksum = calculateChecksum(fileBuffer);
    childLogger.debug({ checksum }, 'Checksum calculated');

    // 5. Deduplication check
    const existing = await this.findByChecksum(checksum, requestId);
    if (existing) {
      childLogger.info({ checksum, existingId: existing.id }, 'Duplicate file detected – returning existing record');
      return existing;
    }

    // 6. Generate unique storage key
    const uniqueId = randomUUID();
    const storageKey = `plans/${uniqueId}${fileExt}`;

    // 7. Upload to storage with retry
    childLogger.debug({ storageKey }, 'Uploading to storage');
    await withRetry(() => storage.upload(fileBuffer, storageKey), {
      operationName: 'storageUpload',
      maxRetries: MAX_RETRIES,
    });

    // 8. Persist metadata in a DB transaction
    const planFile = await this.createRecord(
      {
        id: uniqueId,
        project_id: projectId ?? null,
        uploaded_by_id: uploadedById ?? null,
        name: safeFilename,
        type: fileExt.replace('.', '').toUpperCase(),
        path: storageKey,
        checksum,
        size: fileBuffer.length,
        mime_type: mimeType,
        metadata: null,
      },
      requestId,
    );

    childLogger.info({ planFileId: planFile.id, checksum }, 'Plan uploaded successfully');
    return planFile;
  }

  /** Retrieve a plan file record by its ID. */
  async getPlanById(id: string, requestId?: string): Promise<PlanFile> {
    const childLogger = logger.child({ requestId, service: 'plans-upload', planFileId: id });
    childLogger.debug('Fetching plan by ID');

    const result = await db.query<PlanFile>(
      'SELECT * FROM plan_files WHERE id = $1',
      [id],
      requestId,
    );

    if (!result.rows[0]) {
      childLogger.warn('Plan file not found');
      throw createError('Plan file not found', 404);
    }

    return result.rows[0];
  }

  /** Find a plan file by its SHA-256 checksum (for deduplication). */
  async findByChecksum(checksum: string, requestId?: string): Promise<PlanFile | null> {
    const result = await db.query<PlanFile>(
      'SELECT * FROM plan_files WHERE checksum = $1 LIMIT 1',
      [checksum],
      requestId,
    );
    return result.rows[0] ?? null;
  }

  /** Insert a new plan file record inside a transaction. */
  private async createRecord(
    data: Omit<PlanFile, 'created_at' | 'updated_at'>,
    requestId?: string,
  ): Promise<PlanFile> {
    return db.transaction(async (client) => {
      const result = await client.query<PlanFile>(
        `INSERT INTO plan_files
           (id, project_id, uploaded_by_id, name, type, path, checksum, size, mime_type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          data.id,
          data.project_id,
          data.uploaded_by_id,
          data.name,
          data.type,
          data.path,
          data.checksum,
          data.size,
          data.mime_type,
          data.metadata ? JSON.stringify(data.metadata) : null,
        ],
      );
      return result.rows[0];
    }, requestId);
  }
}

export const plansUploadService = new PlansUploadService();
