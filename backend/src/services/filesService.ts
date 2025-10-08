import { filesRepo } from '../data/filesRepo.js';
import { storage, generateFileKey } from '../infra/storage.js';
import { logger } from '../infra/logger.js';
import { File, CreateFileData } from '../types/files.js';
import { createError } from '../api/middleware/errorHandler.js';
import { allowedFileTypes } from '../api/schemas/common.js';
import path from 'path';
import { promises as fs } from 'fs';

export class FilesService {
  async getAllFiles(requestId?: string): Promise<File[]> {
    const childLogger = logger.child({ requestId, service: 'files' });

    try {
      childLogger.debug('Fetching all files');
      const files = await filesRepo.findAll(requestId);
      childLogger.debug({ count: files.length }, 'Files fetched successfully');
      return files;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Failed to fetch files');
      throw createError('Failed to fetch files', 500);
    }
  }

  async getFileById(id: number, requestId?: string): Promise<File> {
    const childLogger = logger.child({ requestId, service: 'files', fileId: id });

    try {
      childLogger.debug('Fetching file by ID');
      const file = await filesRepo.findById(id, requestId);

      if (!file) {
        childLogger.warn('File not found');
        throw createError('File not found', 404);
      }

      childLogger.debug('File fetched successfully');
      return file;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      childLogger.error({ error: (error as Error).message }, 'Failed to fetch file');
      throw createError('Failed to fetch file', 500);
    }
  }

  async uploadFile(file: Express.Multer.File, requestId?: string): Promise<File> {
    const childLogger = logger.child({
      requestId,
      service: 'files',
      originalName: file.originalname,
      size: file.size,
    });

    try {
      childLogger.debug('Starting file upload');

      // Validate file type
      const fileExt = path.extname(file.originalname).toLowerCase() as
        | '.ifc'
        | '.dwg'
        | '.rvt'
        | '.step'
        | '.obj'
        | '.gltf'
        | '.glb';
      if (!allowedFileTypes.includes(fileExt)) {
        childLogger.warn({ fileExt, allowedTypes: allowedFileTypes }, 'Invalid file type');
        throw createError(`Invalid file type. Allowed: ${allowedFileTypes.join(', ')}`, 400);
      }

      // Validate file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        childLogger.warn({ size: file.size, maxSize }, 'File too large');
        throw createError('File too large. Maximum size: 100MB', 400);
      }

      // Generate unique file key
      const fileKey = generateFileKey(file.originalname);

      // Read file buffer
      const fileBuffer = await fs.readFile(file.path);

      // Upload to storage
      const storageResult = await storage.upload(fileBuffer, fileKey);

      // Create database record
      const fileData: CreateFileData = {
        filename: fileKey,
        original_name: file.originalname,
        file_path: storageResult.key,
        file_size: file.size,
        file_type: fileExt,
      };

      const dbFile = await filesRepo.create(fileData, requestId);

      // Clean up temporary file
      await fs.unlink(file.path).catch((err: any) => {
        childLogger.warn({ error: err.message }, 'Failed to clean up temporary file');
      });

      childLogger.info(
        {
          fileId: dbFile.id,
          originalName: file.originalname,
          size: file.size,
        },
        'File uploaded successfully',
      );

      return dbFile;
    } catch (error) {
      // Clean up temporary file on error
      if (file?.path) {
        await fs.unlink(file.path).catch(() => {});
      }

      if (error instanceof Error && error.message.includes('Invalid file type')) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('File too large')) {
        throw error;
      }

      childLogger.error({ error: (error as Error).message }, 'File upload failed');
      throw createError('File upload failed', 500);
    }
  }

  async deleteFile(id: number, requestId?: string): Promise<void> {
    const childLogger = logger.child({ requestId, service: 'files', fileId: id });

    try {
      childLogger.debug('Deleting file');

      // Get file record first
      const file = await filesRepo.findById(id, requestId);
      if (!file) {
        childLogger.warn('File not found for deletion');
        throw createError('File not found', 404);
      }

      // Delete from storage
      await storage.delete(file.filename);

      // Delete from database
      await filesRepo.delete(id, requestId);

      childLogger.info('File deleted successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      childLogger.error({ error: (error as Error).message }, 'Failed to delete file');
      throw createError('Failed to delete file', 500);
    }
  }

  async getFileStats(
    requestId?: string,
  ): Promise<{ total: number; totalSize: number; byType: Record<string, number> }> {
    const childLogger = logger.child({ requestId, service: 'files' });

    try {
      childLogger.debug('Fetching file statistics');
      const stats = await filesRepo.getStats(requestId);
      childLogger.debug({ stats }, 'File statistics fetched successfully');
      return stats;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Failed to fetch file statistics');
      throw createError('Failed to fetch file statistics', 500);
    }
  }
}

export const filesService = new FilesService();
