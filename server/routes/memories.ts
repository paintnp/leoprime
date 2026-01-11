import { Router, Request, Response } from 'express';
import { mongodb } from '../lib/db/mongodb.js';
import { voyageEmbedding } from '../lib/ai/voyage-embedding.js';

export const memoriesRouter = Router();

/**
 * List all memories
 * GET /api/memories
 */
memoriesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const memories = await mongodb.listMemories(limit);

    // Don't send embeddings to frontend (too large)
    const sanitized = memories.map(m => ({
      _id: m._id,
      text: m.text,
      metadata: m.metadata,
      source: m.source,
      createdAt: m.createdAt,
      embeddingDimensions: m.embedding?.length || 0,
    }));

    res.json(sanitized);
  } catch (error: any) {
    console.error('[Route:memories] Failed to list memories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create a new memory
 * POST /api/memories
 */
memoriesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { text, metadata = {}, source = 'manual' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Generate embedding
    const embedding = await voyageEmbedding.embedDocument(text);

    // Store memory
    const memory = await mongodb.createMemory(text, embedding, metadata, source);

    res.json({
      _id: memory._id,
      text: memory.text,
      metadata: memory.metadata,
      source: memory.source,
      createdAt: memory.createdAt,
      embeddingDimensions: embedding.length,
    });
  } catch (error: any) {
    console.error('[Route:memories] Failed to create memory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search memories semantically
 * POST /api/memories/search
 */
memoriesRouter.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Generate query embedding
    const queryEmbedding = await voyageEmbedding.embedQuery(query);

    // Search memories
    const results = await mongodb.searchMemories(queryEmbedding, limit);

    res.json({
      query,
      results,
      model: voyageEmbedding.getModel(),
    });
  } catch (error: any) {
    console.error('[Route:memories] Failed to search memories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get memory count
 * GET /api/memories/count
 */
memoriesRouter.get('/count', async (_req: Request, res: Response) => {
  try {
    const count = await mongodb.getMemoryCount();
    res.json({ count });
  } catch (error: any) {
    console.error('[Route:memories] Failed to get count:', error);
    res.status(500).json({ error: error.message });
  }
});
