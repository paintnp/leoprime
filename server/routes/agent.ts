import { Router, Request, Response } from 'express';
import { mongodb } from '../lib/db/mongodb.js';
import { startAgentRun } from '../lib/agent/orchestrator.js';

export const agentRouter = Router();

/**
 * Start a new agent run
 * POST /api/agent/run
 */
agentRouter.post('/run', async (req: Request, res: Response) => {
  try {
    const { goal } = req.body;

    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'Goal is required' });
    }

    const { runId } = await startAgentRun(goal);

    // Return the run ID immediately
    res.json({ runId, status: 'running' });
  } catch (error: any) {
    console.error('[Route:agent] Failed to start run:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stream agent events via SSE
 * GET /api/agent/run/:id/stream
 */
agentRouter.get('/run/:id/stream', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if run exists
    const run = await mongodb.getRun(id);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // If run is already complete, send final state and close
    if (run.status === 'completed' || run.status === 'failed') {
      res.write(`data: ${JSON.stringify({
        type: run.status === 'completed' ? 'complete' : 'error',
        runId: id,
        timestamp: new Date().toISOString(),
        data: { status: run.status },
      })}\n\n`);
      res.end();
      return;
    }

    // For active runs, we need to start a new orchestrator
    // This is a limitation - ideally we'd have a pub/sub system
    const { stream } = await startAgentRun(run.goal);

    // Stream events
    const eventStream = stream();
    for await (const event of eventStream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      if (event.type === 'complete' || event.type === 'error') {
        break;
      }
    }

    res.end();
  } catch (error: any) {
    console.error('[Route:agent] Stream error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      timestamp: new Date().toISOString(),
      data: { message: error.message },
    })}\n\n`);
    res.end();
  }
});

/**
 * Start a new agent run with streaming
 * POST /api/agent/run/stream
 */
agentRouter.post('/run/stream', async (req: Request, res: Response) => {
  try {
    const { goal } = req.body;

    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'Goal is required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const { runId, stream } = await startAgentRun(goal);

    // Send run ID first
    res.write(`data: ${JSON.stringify({
      type: 'run_started',
      runId,
      timestamp: new Date().toISOString(),
      data: { goal },
    })}\n\n`);

    // Stream all events
    const eventStream = stream();
    for await (const event of eventStream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      if (event.type === 'complete' || event.type === 'error') {
        break;
      }
    }

    res.end();
  } catch (error: any) {
    console.error('[Route:agent] Stream error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      timestamp: new Date().toISOString(),
      data: { message: error.message },
    })}\n\n`);
    res.end();
  }
});

/**
 * Get a specific run
 * GET /api/agent/run/:id
 */
agentRouter.get('/run/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const run = await mongodb.getRun(id);

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    res.json(run);
  } catch (error: any) {
    console.error('[Route:agent] Failed to get run:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all runs
 * GET /api/agent/runs
 */
agentRouter.get('/runs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const runs = await mongodb.listRuns(limit);
    res.json(runs);
  } catch (error: any) {
    console.error('[Route:agent] Failed to list runs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get logs for a run
 * GET /api/agent/run/:id/logs
 */
agentRouter.get('/run/:id/logs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await mongodb.listLogs(id);
    res.json(logs);
  } catch (error: any) {
    console.error('[Route:agent] Failed to get logs:', error);
    res.status(500).json({ error: error.message });
  }
});
