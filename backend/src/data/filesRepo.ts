import { db } from './db.js';
import { logger } from '../infra/logger.js';
import { File } from '../types/files.js';

export class FilesRepository {
  async findAll(requestId?: string): Promise<File[]> {
    const result = await db.query<File>(
      'SELECT * FROM files ORDER BY created_at DESC',
      [],
      requestId,
    );
    return result.rows;
  }

  async findById(id: number, requestId?: string): Promise<File | null> {
    const result = await db.query<File>('SELECT * FROM files WHERE id = $1', [id], requestId);
    return result.rows[0] || null;
  }

  async create(
    data: {
      filename: string;
      original_name: string;
      file_path: string;
      file_size: number;
      file_type: string;
    },
    requestId?: string,
  ): Promise<File> {
    const result = await db.query<File>(
      'INSERT INTO files (filename, original_name, file_path, file_size, file_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.filename, data.original_name, data.file_path, data.file_size, data.file_type],
      requestId,
    );
    return result.rows[0];
  }

  async delete(id: number, requestId?: string): Promise<boolean> {
    const result = await db.query('DELETE FROM files WHERE id = $1', [id], requestId);
    return (result.rowCount ?? 0) > 0;
  }

  async findByFilename(filename: string, requestId?: string): Promise<File | null> {
    const result = await db.query<File>(
      'SELECT * FROM files WHERE filename = $1',
      [filename],
      requestId,
    );
    return result.rows[0] || null;
  }

  async exists(id: number, requestId?: string): Promise<boolean> {
    const result = await db.query('SELECT 1 FROM files WHERE id = $1', [id], requestId);
    return (result.rowCount ?? 0) > 0;
  }

  async getTotalSize(requestId?: string): Promise<number> {
    const result = await db.query<{ total_size: string }>(
      'SELECT COALESCE(SUM(file_size), 0) as total_size FROM files',
      [],
      requestId,
    );
    return parseInt(result.rows[0].total_size);
  }

  async getFileCount(requestId?: string): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM files',
      [],
      requestId,
    );
    return parseInt(result.rows[0].count);
  }

  async getStats(
    requestId?: string,
  ): Promise<{ total: number; totalSize: number; byType: Record<string, number> }> {
    const [totalSize, total, byTypeResult] = await Promise.all([
      this.getTotalSize(requestId),
      this.getFileCount(requestId),
      db.query<{ file_type: string; count: string }>(
        'SELECT file_type, COUNT(*) as count FROM files GROUP BY file_type',
        [],
        requestId,
      ),
    ]);

    const byType: Record<string, number> = {};
    byTypeResult.rows.forEach((row) => {
      byType[row.file_type] = parseInt(row.count);
    });

    return {
      total,
      totalSize,
      byType,
    };
  }
}

export const filesRepo = new FilesRepository();
