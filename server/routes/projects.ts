import { Router, Request, Response } from 'express';
import { mongodb } from '../lib/db/mongodb.js';

export const projectsRouter = Router();

/**
 * List all projects
 * GET /api/projects
 */
projectsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const runId = req.query.runId as string | undefined;
    const projects = await mongodb.listProjects(runId);
    res.json(projects);
  } catch (error: any) {
    console.error('[Route:projects] Failed to list projects:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific project
 * GET /api/projects/:id
 */
projectsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await mongodb.getProject(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    console.error('[Route:projects] Failed to get project:', error);
    res.status(500).json({ error: error.message });
  }
});
