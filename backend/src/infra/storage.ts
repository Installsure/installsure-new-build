import { config } from './config.js';
import { logger } from './logger.js';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export interface StorageResult {
  key: string;
  url?: string;
  size: number;
}

export interface StorageProvider {
  upload(buffer: Buffer, key: string): Promise<StorageResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): Promise<string>;
}

class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.baseDir, key);
  }

  async upload(buffer: Buffer, key: string): Promise<StorageResult> {
    const filePath = this.getFilePath(key);
    const dirPath = path.dirname(filePath);

    await this.ensureDir(dirPath);
    await fs.writeFile(filePath, buffer);

    logger.debug({ key, size: buffer.length }, 'File uploaded to local storage');

    return {
      key,
      url: `/files/${key}`,
      size: buffer.length,
    };
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.unlink(filePath);
    logger.debug({ key }, 'File deleted from local storage');
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(key: string): Promise<string> {
    return `/files/${key}`;
  }
}

class S3StorageProvider implements StorageProvider {
  // S3 implementation would go here
  // For now, throw an error to indicate it's not implemented
  async upload(buffer: Buffer, key: string): Promise<StorageResult> {
    throw new Error('S3 storage not implemented yet');
  }

  async download(key: string): Promise<Buffer> {
    throw new Error('S3 storage not implemented yet');
  }

  async delete(key: string): Promise<void> {
    throw new Error('S3 storage not implemented yet');
  }

  async exists(key: string): Promise<boolean> {
    throw new Error('S3 storage not implemented yet');
  }

  async getUrl(key: string): Promise<string> {
    throw new Error('S3 storage not implemented yet');
  }
}

export const createStorageProvider = (): StorageProvider => {
  if (config.S3_ENDPOINT && config.S3_BUCKET) {
    logger.info('Using S3 storage provider');
    return new S3StorageProvider();
  } else {
    logger.info({ baseDir: config.FILES_LOCAL_DIR }, 'Using local storage provider');
    return new LocalStorageProvider(config.FILES_LOCAL_DIR);
  }
};

export const storage = createStorageProvider();

// Utility function to generate unique file keys
export const generateFileKey = (originalName: string, prefix: string = 'uploads'): string => {
  const timestamp = Date.now();
  const hash = createHash('md5')
    .update(originalName + timestamp)
    .digest('hex')
    .substring(0, 8);
  const ext = path.extname(originalName);
  return `${prefix}/${timestamp}-${hash}${ext}`;
};
