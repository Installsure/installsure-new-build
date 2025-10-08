import { db } from './db.js';
import { logger } from '../infra/logger.js';
import { Project } from '../types/projects.js';

// If running tests, use an in-memory repository to avoid DB dependency
const isTest = process.env.NODE_ENV === 'test';

export class ProjectsRepository {
  // In-memory store used only in test mode
  private store: Project[] = [];
  private idCounter = 1;

  async findAll(requestId?: string): Promise<Project[]> {
    if (isTest) {
      // Return a shallow copy sorted by created_at desc
      return [...this.store].sort(
        (a, b) => new Date(b.created_at as any).getTime() - new Date(a.created_at as any).getTime(),
      );
    }

    const result = await db.query<Project>(
      'SELECT * FROM projects ORDER BY created_at DESC',
      [],
      requestId,
    );
    return result.rows;
  }

  async findById(id: number, requestId?: string): Promise<Project | null> {
    if (isTest) {
      return this.store.find((p) => p.id === id) || null;
    }

    const result = await db.query<Project>('SELECT * FROM projects WHERE id = $1', [id], requestId);
    return result.rows[0] || null;
  }

  async create(data: { name: string; description?: string }, requestId?: string): Promise<Project> {
    if (isTest) {
      const now = new Date().toISOString();
      const project: any = {
        id: this.idCounter++,
        name: data.name,
        description: data.description || null,
        created_at: now,
        updated_at: now,
      };
      this.store.push(project);
      return project as Project;
    }

    const result = await db.query<Project>(
      'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *',
      [data.name, data.description || null],
      requestId,
    );
    return result.rows[0];
  }

  async update(
    id: number,
    data: { name?: string; description?: string },
    requestId?: string,
  ): Promise<Project | null> {
    if (isTest) {
      const idx = this.store.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const existing: any = this.store[idx];
      const updated = {
        ...existing,
        name: data.name !== undefined ? data.name : existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        updated_at: new Date().toISOString(),
      };
      this.store[idx] = updated as Project;
      return updated as Project;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (updates.length === 0) {
      return this.findById(id, requestId);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query<Project>(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values,
      requestId,
    );

    return result.rows[0] || null;
  }

  async delete(id: number, requestId?: string): Promise<boolean> {
    if (isTest) {
      const idx = this.store.findIndex((p) => p.id === id);
      if (idx === -1) return false;
      this.store.splice(idx, 1);
      return true;
    }

    const result = await db.query('DELETE FROM projects WHERE id = $1', [id], requestId);
    return (result.rowCount ?? 0) > 0;
  }

  async exists(id: number, requestId?: string): Promise<boolean> {
    if (isTest) {
      return this.store.some((p) => p.id === id);
    }

    const result = await db.query('SELECT 1 FROM projects WHERE id = $1', [id], requestId);
    return (result.rowCount ?? 0) > 0;
  }
}

export const projectsRepo = new ProjectsRepository();
