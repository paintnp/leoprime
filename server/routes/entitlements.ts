import { Router, Request, Response } from 'express';
import { mongodb } from '../lib/db/mongodb.js';
import { paywallService } from '../lib/paywall/paywall-service.js';
import type { PaywallService } from '@shared/types/index.js';

export const entitlementsRouter = Router();

/**
 * List all entitlements
 * GET /api/entitlements
 */
entitlementsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const runId = req.query.runId as string | undefined;
    const entitlements = await mongodb.listEntitlements(runId);

    // Add active status based on expiration
    const now = new Date();
    const enriched = entitlements.map(e => ({
      ...e,
      isExpired: new Date(e.expiresAt) < now,
      timeRemaining: Math.max(0, new Date(e.expiresAt).getTime() - now.getTime()),
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error('[Route:entitlements] Failed to list entitlements:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get active entitlements status
 * GET /api/entitlements/status
 */
entitlementsRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const services: PaywallService[] = ['voyage', 'mongodb', 'cdp'];
    const status: Record<string, { active: boolean; expiresAt?: string }> = {};

    for (const service of services) {
      const entitlement = await mongodb.getActiveEntitlement(service);
      status[service] = {
        active: entitlement !== null,
        expiresAt: entitlement?.expiresAt?.toISOString(),
      };
    }

    res.json(status);
  } catch (error: any) {
    console.error('[Route:entitlements] Failed to get status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get service prices
 * GET /api/entitlements/prices
 */
entitlementsRouter.get('/prices', async (_req: Request, res: Response) => {
  try {
    const prices = paywallService.getServicePrices();
    res.json(prices);
  } catch (error: any) {
    console.error('[Route:entitlements] Failed to get prices:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reset all entitlements (for demo purposes)
 * DELETE /api/entitlements/reset
 */
entitlementsRouter.delete('/reset', async (_req: Request, res: Response) => {
  try {
    const count = await mongodb.deactivateAllEntitlements();
    console.log(`[Route:entitlements] Reset ${count} entitlements for demo`);
    res.json({
      success: true,
      message: `Deactivated ${count} entitlements`,
      count,
    });
  } catch (error: any) {
    console.error('[Route:entitlements] Failed to reset entitlements:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Subscribe to a service (manual trigger)
 * POST /api/entitlements/subscribe/:service
 */
entitlementsRouter.post('/subscribe/:service', async (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const { runId } = req.body;

    if (!['voyage', 'mongodb', 'cdp'].includes(service)) {
      return res.status(400).json({ error: 'Invalid service' });
    }

    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    const result = await paywallService.subscribe(runId, service as PaywallService);

    res.json({
      success: true,
      txHash: result.txHash,
      entitlement: result.entitlement,
      explorerUrl: result.explorerUrl,
    });
  } catch (error: any) {
    console.error('[Route:entitlements] Failed to subscribe:', error);
    res.status(500).json({ error: error.message });
  }
});
