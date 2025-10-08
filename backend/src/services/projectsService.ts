import { projectsRepo } from '../data/projectsRepo.js';
import { logger } from '../infra/logger.js';
import { cache } from '../infra/redis.js';
import { Project, CreateProjectData, UpdateProjectData } from '../types/projects.js';
import { createError } from '../api/middleware/errorHandler.js';

export class ProjectsService {
  async getAllProjects(requestId?: string): Promise<Project[]> {
    const childLogger = logger.child({ requestId, service: 'projects' });

    try {
      // Try to get from cache first
      const cacheKey = 'projects:all';
      const cachedProjects = await cache.get<Project[]>(cacheKey, { prefix: 'projects', ttl: 300 });

      if (cachedProjects) {
        childLogger.debug({ count: cachedProjects.length }, 'Projects fetched from cache');
        return cachedProjects;
      }

      childLogger.debug('Fetching all projects from database');
      const projects = await projectsRepo.findAll(requestId);

      // Cache the results
      await cache.set(cacheKey, projects, { prefix: 'projects', ttl: 300 });

      childLogger.debug({ count: projects.length }, 'Projects fetched successfully');
      return projects;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Failed to fetch projects');
      throw createError('Failed to fetch projects', 500);
    }
  }

  async getProjectById(id: number, requestId?: string): Promise<Project> {
    const childLogger = logger.child({ requestId, service: 'projects', projectId: id });

    try {
      childLogger.debug('Fetching project by ID');
      const project = await projectsRepo.findById(id, requestId);

      if (!project) {
        childLogger.warn('Project not found');
        throw createError('Project not found', 404);
      }

      childLogger.debug('Project fetched successfully');
      return project;
    } catch (error) {
      if (error instanceof Error && error.message === 'Project not found') {
        throw error;
      }
      childLogger.error({ error: (error as Error).message }, 'Failed to fetch project');
      throw createError('Failed to fetch project', 500);
    }
  }

  async createProject(data: CreateProjectData, requestId?: string): Promise<Project> {
    const childLogger = logger.child({ requestId, service: 'projects' });

    try {
      childLogger.debug({ name: data.name }, 'Creating new project');

      // Validate project name uniqueness (optional business rule)
      const existingProjects = await projectsRepo.findAll(requestId);
      const nameExists = existingProjects.some(
        (p) => p.name.toLowerCase() === data.name.toLowerCase(),
      );

      if (nameExists) {
        childLogger.warn({ name: data.name }, 'Project name already exists');
        throw createError('Project name already exists', 409);
      }

      const project = await projectsRepo.create(data, requestId);

      // Invalidate cache
      await cache.invalidatePattern('projects:*');

      childLogger.info(
        { projectId: project.id, name: project.name },
        'Project created successfully',
      );
      return project;
    } catch (error) {
      if (error instanceof Error && error.message === 'Project name already exists') {
        throw error;
      }
      childLogger.error({ error: (error as Error).message }, 'Failed to create project');
      throw createError('Failed to create project', 500);
    }
  }

  async updateProject(id: number, data: UpdateProjectData, requestId?: string): Promise<Project> {
    const childLogger = logger.child({ requestId, service: 'projects', projectId: id });

    try {
      childLogger.debug('Updating project');

      // Check if project exists
      const exists = await projectsRepo.exists(id, requestId);
      if (!exists) {
        childLogger.warn('Project not found for update');
        throw createError('Project not found', 404);
      }

      // Validate name uniqueness if name is being updated
      if (data.name) {
        const existingProjects = await projectsRepo.findAll(requestId);
        const nameExists = existingProjects.some(
          (p) => p.id !== id && p.name.toLowerCase() === data.name!.toLowerCase(),
        );

        if (nameExists) {
          childLogger.warn({ name: data.name }, 'Project name already exists');
          throw createError('Project name already exists', 409);
        }
      }

      const project = await projectsRepo.update(id, data, requestId);
      if (!project) {
        throw createError('Failed to update project', 500);
      }

      childLogger.info('Project updated successfully');
      return project;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Project not found' || error.message === 'Project name already exists')
      ) {
        throw error;
      }
      childLogger.error({ error: (error as Error).message }, 'Failed to update project');
      throw createError('Failed to update project', 500);
    }
  }

  async deleteProject(id: number, requestId?: string): Promise<void> {
    const childLogger = logger.child({ requestId, service: 'projects', projectId: id });

    try {
      childLogger.debug('Deleting project');

      const deleted = await projectsRepo.delete(id, requestId);
      if (!deleted) {
        childLogger.warn('Project not found for deletion');
        throw createError('Project not found', 404);
      }

      childLogger.info('Project deleted successfully');
    } catch (error) {
      if (error instanceof Error && error.message === 'Project not found') {
        throw error;
      }
      childLogger.error({ error: (error as Error).message }, 'Failed to delete project');
      throw createError('Failed to delete project', 500);
    }
  }
}

export const projectsService = new ProjectsService();
