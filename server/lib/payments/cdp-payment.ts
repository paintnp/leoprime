import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import type { PaywallService } from '@shared/types/index.js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CDP PAYMENT SERVICE (Real USDC on Base)
// Uses @coinbase/coinbase-sdk v0.25.0+ with Ed25519 key support
// ============================================================================

export interface PaymentResult {
  success: boolean;
  txHash: string;
  amount: number;
  currency: string;
  recipient: string;
  explorerUrl: string;
}

class CDPPaymentService {
  private wallet: Wallet | null = null;
  private isInitialized = false;
  private initError: string | null = null;

  /**
   * Initialize the CDP SDK and wallet
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initError) {
      throw new Error(this.initError);
    }

    console.log('[CDP] Initializing Coinbase SDK v0.25.0...');

    try {
      const apiKeyName = process.env.CDP_API_KEY_ID;
      const privateKey = process.env.CDP_API_KEY_SECRET;

      if (!apiKeyName || !privateKey) {
        throw new Error('CDP_API_KEY_ID and CDP_API_KEY_SECRET are required');
      }

      console.log('[CDP] Using API key:', apiKeyName.substring(0, 8) + '...');

      // Configure the SDK - supports Ed25519 keys in base64 format
      Coinbase.configure({
        apiKeyName,
        privateKey,
      });

      console.log('[CDP] SDK configured, checking for wallet seed...');

      // Try to import wallet from environment variable first (for production)
      const walletSeedEnv = process.env.CDP_WALLET_SEED;
      const seedPath = path.join(process.cwd(), 'wallet-seed.json');

      if (walletSeedEnv) {
        console.log('[CDP] Found wallet seed in environment, importing...');
        const seedData = JSON.parse(walletSeedEnv);
        this.wallet = await Wallet.import(seedData);
        const address = await this.wallet.getDefaultAddress();
        console.log(`[CDP] Imported wallet from env: ${address.getId()}`);
      } else if (fs.existsSync(seedPath)) {
        console.log('[CDP] Found wallet seed file, importing...');
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        this.wallet = await Wallet.import(seedData);
        const address = await this.wallet.getDefaultAddress();
        console.log(`[CDP] Imported wallet from file: ${address.getId()}`);
      } else {
        // List existing wallets
        console.log('[CDP] No seed file, listing wallets...');
        const wallets = await Wallet.listWallets();
        console.log('[CDP] Found wallets:', wallets.data?.length || 0);

        if (wallets.data && wallets.data.length > 0) {
          // Fetch the first wallet with its seed
          const walletId = wallets.data[0].getId();
          if (!walletId) {
            throw new Error('Wallet ID not found');
          }
          console.log('[CDP] Fetching wallet:', walletId);
          this.wallet = await Wallet.fetch(walletId);
          const address = await this.wallet.getDefaultAddress();
          console.log(`[CDP] Using wallet: ${address.getId()}`);
        } else {
          console.log('[CDP] Creating new wallet on base-mainnet...');
          this.wallet = await Wallet.create({
            networkId: process.env.NETWORK_ID || 'base-mainnet'
          });

          // Save the seed for future use
          const exportedSeed = this.wallet.export();
          fs.writeFileSync(seedPath, JSON.stringify(exportedSeed, null, 2));
          console.log('[CDP] Wallet seed saved to:', seedPath);

          const address = await this.wallet.getDefaultAddress();
          console.log(`[CDP] Created wallet: ${address.getId()}`);
        }
      }

      this.isInitialized = true;
      console.log('[CDP] Initialization complete');
    } catch (error: any) {
      console.error('[CDP] Initialization failed:', error?.message || error);
      if (error?.httpCode) {
        console.error('[CDP] HTTP Code:', error.httpCode);
      }
      if (error?.apiMessage) {
        console.error('[CDP] API Message:', error.apiMessage);
      }
      this.initError = error?.message || error?.toString() || 'CDP initialization failed';
      throw new Error(this.initError || 'CDP initialization failed');
    }
  }

  /**
   * Check if initialized successfully
   */
  isReady(): boolean {
    return this.isInitialized && this.wallet !== null;
  }

  /**
   * Get initialization error if any
   */
  getInitError(): string | null {
    return this.initError;
  }

  /**
   * Get the wallet address
   */
  async getWalletAddress(): Promise<string> {
    // Use the configured address if available (for demo mode)
    const configuredAddress = process.env.CDP_WALLET_ADDRESS;
    if (configuredAddress && !this.isInitialized) {
      return configuredAddress;
    }

    await this.initialize();
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    const address = await this.wallet.getDefaultAddress();
    return address.getId();
  }

  /**
   * Get the USDC balance
   */
  async getBalance(): Promise<number> {
    await this.initialize();
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const balance = await this.wallet.getBalance('usdc');
      return parseFloat(balance.toString());
    } catch (error) {
      console.warn('[CDP] Failed to get balance, returning 0');
      return 0;
    }
  }

  /**
   * Get the price for a service subscription
   */
  getServicePrice(service: PaywallService): number {
    const prices: Record<PaywallService, number> = {
      voyage: parseFloat(process.env.PAYWALL_PRICE_VOYAGE_USDC || '0.50'),
      mongodb: parseFloat(process.env.PAYWALL_PRICE_MONGODB_USDC || '0.50'),
      cdp: parseFloat(process.env.PAYWALL_PRICE_CDP_USDC || '0.50'),
    };
    return prices[service];
  }

  /**
   * Transfer USDC to pay for a service
   */
  async payForService(service: PaywallService, recipient: string): Promise<PaymentResult> {
    await this.initialize();
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const amount = this.getServicePrice(service);
    console.log(`[CDP] Paying ${amount} USDC for ${service} to ${recipient}`);

    try {
      // Create and broadcast the transfer
      // Note: gasless: true requires CDP account feature to be enabled
      // Using standard transfer which uses ETH for gas (~$0.001 on Base)
      const transfer = await this.wallet.createTransfer({
        amount,
        assetId: 'usdc',
        destination: recipient,
      });

      // Wait for confirmation
      await transfer.wait();

      const txHash = transfer.getTransactionHash() || '';
      const explorerUrl = `https://basescan.org/tx/${txHash}`;

      console.log(`[CDP] Payment complete: ${txHash}`);

      return {
        success: true,
        txHash,
        amount,
        currency: 'USDC',
        recipient,
        explorerUrl,
      };
    } catch (error: any) {
      console.error('[CDP] Payment failed:', error.message);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  /**
   * Simulate a payment (for demo/testing when wallet has no funds)
   * This creates a fake transaction hash but doesn't actually transfer funds
   */
  async simulatePayment(service: PaywallService, recipient: string): Promise<PaymentResult> {
    const amount = this.getServicePrice(service);
    console.log(`[CDP] SIMULATING payment of ${amount} USDC for ${service}`);

    // Generate a fake but realistic-looking tx hash
    const fakeHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const explorerUrl = `https://basescan.org/tx/${fakeHash}`;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`[CDP] Simulated payment complete: ${fakeHash}`);

    return {
      success: true,
      txHash: fakeHash,
      amount,
      currency: 'USDC',
      recipient,
      explorerUrl,
    };
  }

  /**
   * Check if we should use real payments or simulations
   */
  async shouldUseRealPayments(): Promise<boolean> {
    try {
      await this.initialize();
      if (!this.wallet) return false;

      const usdcBalance = await this.getBalance();
      const ethBalance = await this.wallet.getBalance('eth');
      const ethNum = parseFloat(ethBalance.toString());

      // Need USDC for payment and ETH for gas
      const hasEnoughUsdc = usdcBalance >= 0.50;
      const hasEnoughEth = ethNum >= 0.00001; // ~$0.03 ETH minimum

      console.log(`[CDP] Balance check: ${usdcBalance} USDC, ${ethNum} ETH`);
      return hasEnoughUsdc && hasEnoughEth;
    } catch {
      return false;
    }
  }

  /**
   * Get network info
   */
  getNetwork(): { id: string; name: string } {
    return {
      id: process.env.NETWORK_ID || 'base-mainnet',
      name: 'Base',
    };
  }
}

// Export singleton instance
export const cdpPayment = new CDPPaymentService();
