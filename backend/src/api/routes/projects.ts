import { Router, Request, Response } from 'express';
import { projectsService } from '../../services/projectsService.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';
import { createProjectSchema, updateProjectSchema, idSchema } from '../schemas/projects.js';
import { paginationSchema } from '../schemas/common.js';

const router = Router();

// GET /api/projects - List all projects
router.get(
  '/',
  cacheMiddleware({ ttl: 300, prefix: 'projects' }),
  validateBody(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const projects = await projectsService.getAllProjects(req.requestId);
    res.json(projects);
  }),
);

// GET /api/projects/:id - Get project by ID
router.get(
  '/:id',
  validateParams(idSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.getProjectById(parseInt(req.params.id), req.requestId);
    res.json(project);
  }),
);

// POST /api/projects - Create new project
router.post(
  '/',
  invalidateCache(['projects:*']),
  validateBody(createProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.createProject(req.body, req.requestId);
    res.status(201).json(project);
  }),
);

// PUT /api/projects/:id - Update project
router.put(
  '/:id',
  validateParams(idSchema),
  validateBody(updateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.updateProject(
      parseInt(req.params.id),
      req.body,
      req.requestId,
    );
    res.json(project);
  }),
);

// DELETE /api/projects/:id - Delete project
router.delete(
  '/:id',
  validateParams(idSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await projectsService.deleteProject(parseInt(req.params.id), req.requestId);
    res.status(204).send();
  }),
);

export default router;
