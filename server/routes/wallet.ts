import { Router, Request, Response } from 'express';
import { cdpPayment } from '../lib/payments/cdp-payment.js';
import { mongodb } from '../lib/db/mongodb.js';

export const walletRouter = Router();

/**
 * Get wallet info
 * GET /api/wallet
 * Falls back to demo mode if CDP service is unavailable
 */
walletRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const address = await cdpPayment.getWalletAddress();
    const balance = await cdpPayment.getBalance();
    const network = cdpPayment.getNetwork();

    res.json({
      address,
      balance,
      currency: 'USDC',
      network: network.name,
      networkId: network.id,
      demoMode: false,
      cdpReady: cdpPayment.isReady(),
    });
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    console.warn('[Route:wallet] CDP service unavailable, using demo mode:', errorMessage);

    // Return demo wallet info when CDP fails
    const demoAddress = process.env.CDP_WALLET_ADDRESS || '0x3845Ad4c3226454aCdEb624d091D906938DC1e8C';
    const initError = cdpPayment.getInitError();

    res.json({
      address: demoAddress,
      balance: 10.00,
      currency: 'USDC',
      network: 'Base',
      networkId: 'base-mainnet',
      demoMode: true,
      cdpReady: false,
      cdpError: initError || errorMessage,
    });
  }
});

/**
 * Get wallet balance
 * GET /api/wallet/balance
 */
walletRouter.get('/balance', async (_req: Request, res: Response) => {
  try {
    const balance = await cdpPayment.getBalance();
    res.json({ balance, currency: 'USDC' });
  } catch (error: any) {
    console.error('[Route:wallet] Failed to get balance:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all transactions
 * GET /api/wallet/transactions
 */
walletRouter.get('/transactions', async (req: Request, res: Response) => {
  try {
    const runId = req.query.runId as string | undefined;
    const transactions = await mongodb.listTransactions(runId);
    res.json(transactions);
  } catch (error: any) {
    console.error('[Route:wallet] Failed to list transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific transaction
 * GET /api/wallet/transactions/:txHash
 */
walletRouter.get('/transactions/:txHash', async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;
    const transaction = await mongodb.getTransactionByHash(txHash);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error: any) {
    console.error('[Route:wallet] Failed to get transaction:', error);
    res.status(500).json({ error: error.message });
  }
});
