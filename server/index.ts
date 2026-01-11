import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { mongodb } from './lib/db/mongodb.js';
import { agentRouter } from './routes/agent.js';
import { walletRouter } from './routes/wallet.js';
import { memoriesRouter } from './routes/memories.js';
import { entitlementsRouter } from './routes/entitlements.js';
import { projectsRouter } from './routes/projects.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client');
  app.use(express.static(clientPath));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'connected',
      voyage: 'configured',
      openai: 'configured',
      cdp: 'configured',
    },
  });
});

// API Routes
app.use('/api/agent', agentRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/entitlements', entitlementsRouter);
app.use('/api/projects', projectsRouter);

// Catch-all for SPA in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    const clientPath = path.join(__dirname, '../client');
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    // Connect to MongoDB
    await mongodb.connect();
    console.log('[Server] MongoDB connected');

    // Start listening - bind to 0.0.0.0 for Docker/fly.io
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    app.listen(Number(PORT), host, () => {
      console.log(`[Server] LEO Prime API running on http://${host}:${PORT}`);
      console.log('[Server] Available endpoints:');
      console.log('  - GET  /api/health');
      console.log('  - POST /api/agent/run');
      console.log('  - POST /api/agent/run/stream');
      console.log('  - GET  /api/agent/runs');
      console.log('  - GET  /api/wallet');
      console.log('  - GET  /api/memories');
      console.log('  - POST /api/memories');
      console.log('  - GET  /api/entitlements');
      console.log('  - GET  /api/projects');
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();
