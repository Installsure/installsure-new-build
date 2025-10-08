import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../infra/logger.js';
import { createError } from '../api/middleware/errorHandler.js';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

export interface OptimizedUploadOptions {
  maxFileSize: number;
  allowedMimeTypes: string[];
  chunkSize: number;
  tempDir: string;
}

const defaultOptions: OptimizedUploadOptions = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    'application/octet-stream', // Generic binary
    'application/step', // STEP files
    'application/ifc', // IFC files
    'application/dwg', // AutoCAD DWG
    'application/rvt', // Revit
    'model/gltf-binary', // GLB
    'model/gltf+json', // GLTF
  ],
  chunkSize: 1024 * 1024, // 1MB chunks
  tempDir: './uploads/temp',
};

export class UploadOptimizer {
  private options: OptimizedUploadOptions;

  constructor(options: Partial<OptimizedUploadOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  // Create optimized multer storage for large files
  createStorage() {
    return multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          const uploadDir = this.options.tempDir;
          await this.ensureDirectory(uploadDir);
          cb(null, uploadDir);
        } catch (error) {
          cb(error as Error, '');
        }
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const hash = createHash('md5')
          .update(file.originalname + timestamp + Math.random())
          .digest('hex')
          .substring(0, 8);

        const ext = path.extname(file.originalname);
        const filename = `upload_${timestamp}_${hash}${ext}`;
        cb(null, filename);
      },
    });
  }

  // Create optimized multer instance
  createUploadMiddleware() {
    return multer({
      storage: this.createStorage(),
      limits: {
        fileSize: this.options.maxFileSize,
        files: 1, // Single file upload
        fieldSize: 10 * 1024 * 1024, // 10MB field size
      },
      fileFilter: (req, file, cb) => {
        this.validateFile(file, cb);
      },
    });
  }

  // Validate uploaded file
  private validateFile(file: Express.Multer.File, cb: multer.FileFilterCallback) {
    const allowedTypes = ['.ifc', '.dwg', '.rvt', '.step', '.obj', '.gltf', '.glb'];

    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedTypes.includes(ext)) {
      return cb(
        createError(`Invalid file type: ${ext}. Allowed types: ${allowedTypes.join(', ')}`, 400),
      );
    }

    if (file.size > this.options.maxFileSize) {
      return cb(
        createError(
          `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: ${(this.options.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
          400,
        ),
      );
    }

    cb(null, true);
  }

  // Ensure directory exists
  private async ensureDirectory(dirPath: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Process uploaded file with streaming
  async processFile(
    file: Express.Multer.File,
    requestId?: string,
  ): Promise<{
    id: string;
    originalName: string;
    size: number;
    hash: string;
    path: string;
    processedAt: string;
  }> {
    const childLogger = logger.child({
      requestId,
      filename: file.originalname,
      size: file.size,
    });

    try {
      childLogger.debug('Starting file processing');

      // Calculate file hash
      const hash = await this.calculateFileHash(file.path);

      // Create unique file ID
      const fileId = createHash('md5')
        .update(file.originalname + hash + Date.now())
        .digest('hex');

      // Move to permanent location
      const permanentPath = path.join(
        './uploads/processed',
        `${fileId}${path.extname(file.originalname)}`,
      );
      await this.ensureDirectory(path.dirname(permanentPath));

      // Stream file to permanent location
      await this.streamFile(file.path, permanentPath);

      // Clean up temporary file
      await this.cleanupTempFile(file.path);

      const result = {
        id: fileId,
        originalName: file.originalname,
        size: file.size,
        hash,
        path: permanentPath,
        processedAt: new Date().toISOString(),
      };

      childLogger.info({ fileId, hash }, 'File processed successfully');
      return result;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'File processing failed');

      // Clean up on error
      await this.cleanupTempFile(file.path);
      throw error;
    }
  }

  // Calculate file hash using streaming
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  // Stream file from source to destination
  private async streamFile(sourcePath: string, destPath: string): Promise<void> {
    const source = createReadStream(sourcePath);
    const dest = createWriteStream(destPath);

    await pipeline(source, dest);
  }

  // Clean up temporary file
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn({ error: (error as Error).message, filePath }, 'Failed to cleanup temp file');
    }
  }

  // Middleware for file upload progress tracking
  static progressMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const fileSize = req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0;
      let uploadedBytes = 0;

      req.on('data', (chunk) => {
        uploadedBytes += chunk.length;
        const progress = (uploadedBytes / fileSize) * 100;

        // Emit progress via WebSocket if available
        if (global.webSocketManager) {
          global.webSocketManager.sendToUser(req.user?.id || 0, {
            type: 'file_upload',
            payload: {
              progress: Math.round(progress),
              uploadedBytes,
              totalBytes: fileSize,
            },
          });
        }
      });

      next();
    };
  }

  // Middleware for chunked upload support
  static chunkedUploadMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const chunkNumber = parseInt(req.headers['x-chunk-number'] as string) || 0;
      const totalChunks = parseInt(req.headers['x-total-chunks'] as string) || 1;
      const chunkSize = parseInt(req.headers['x-chunk-size'] as string) || 0;

      if (chunkNumber > 0) {
        // Handle chunked upload
        req.chunkInfo = {
          chunkNumber,
          totalChunks,
          chunkSize,
          isComplete: chunkNumber === totalChunks - 1,
        };
      }

      next();
    };
  }
}

// Create optimized upload middleware
export const createOptimizedUpload = (options?: Partial<OptimizedUploadOptions>) => {
  const optimizer = new UploadOptimizer(options);
  return optimizer.createUploadMiddleware();
};

// Default optimized upload middleware
export const optimizedUpload = createOptimizedUpload();



