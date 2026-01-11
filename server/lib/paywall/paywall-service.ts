import * as jose from 'jose';
import { mongodb } from '../db/mongodb.js';
import { cdpPayment } from '../payments/cdp-payment.js';
import type { PaywallService, Entitlement } from '@shared/types/index.js';

// ============================================================================
// PAYWALL SERVICE - Manages subscriptions and entitlements
// ============================================================================

export interface SubscriptionResult {
  success: boolean;
  txHash: string;
  entitlement: Entitlement;
  explorerUrl: string;
}

// Paywall recipient address (the service provider receiving payments)
// Set PAYWALL_RECIPIENT env var to your own wallet for "pay to self" demo mode
const PAYWALL_RECIPIENT = process.env.PAYWALL_RECIPIENT || '0x742d35Cc6634C0532925a3b844Bc9e7595f12AB3';

class PaywallServiceManager {
  private signingSecret: Uint8Array | null = null;

  private getSigningSecret(): Uint8Array {
    if (!this.signingSecret) {
      const secret = process.env.PAYWALL_SIGNING_SECRET;
      if (!secret) {
        throw new Error('PAYWALL_SIGNING_SECRET is required');
      }
      this.signingSecret = new TextEncoder().encode(secret);
    }
    return this.signingSecret;
  }

  /**
   * Subscribe to a service (pay and mint entitlement)
   */
  async subscribe(runId: string, service: PaywallService): Promise<SubscriptionResult> {
    console.log(`[Paywall] Processing subscription for ${service}`);

    // Check if already has active entitlement
    const existing = await mongodb.getActiveEntitlement(service);
    if (existing) {
      console.log(`[Paywall] Already has active entitlement for ${service}`);
      return {
        success: true,
        txHash: '',
        entitlement: existing,
        explorerUrl: '',
      };
    }

    // Determine if we should use real or simulated payments
    const useRealPayments = await cdpPayment.shouldUseRealPayments();

    // Execute payment
    let paymentResult;
    if (useRealPayments) {
      console.log(`[Paywall] Processing REAL payment for ${service}`);
      paymentResult = await cdpPayment.payForService(service, PAYWALL_RECIPIENT);
    } else {
      console.log(`[Paywall] Processing SIMULATED payment for ${service} (insufficient balance)`);
      paymentResult = await cdpPayment.simulatePayment(service, PAYWALL_RECIPIENT);
    }

    // Store transaction
    const tx = await mongodb.createTransaction({
      runId,
      txHash: paymentResult.txHash,
      amount: paymentResult.amount,
      currency: paymentResult.currency,
      recipient: paymentResult.recipient,
      purpose: `Subscribe to ${service}`,
      status: 'confirmed',
      confirmedAt: new Date(),
      explorerUrl: paymentResult.explorerUrl,
    });

    // Update run cost
    await mongodb.updateRunCost(runId, paymentResult.amount);

    // Mint entitlement token
    const token = await this.mintEntitlementToken(service, runId, tx._id);

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store entitlement
    const entitlement = await mongodb.createEntitlement({
      runId,
      txId: tx._id,
      service,
      token,
      expiresAt,
      isActive: true,
    });

    console.log(`[Paywall] Entitlement created for ${service}, expires ${expiresAt.toISOString()}`);

    return {
      success: true,
      txHash: paymentResult.txHash,
      entitlement,
      explorerUrl: paymentResult.explorerUrl,
    };
  }

  /**
   * Mint a signed JWT entitlement token
   */
  private async mintEntitlementToken(service: PaywallService, runId: string, txId: string): Promise<string> {
    const secret = this.getSigningSecret();

    const token = await new jose.SignJWT({
      service,
      runId,
      txId,
      type: 'entitlement',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .setIssuer('leo-prime')
      .setSubject(service)
      .sign(secret);

    return token;
  }

  /**
   * Verify an entitlement token
   */
  async verifyEntitlementToken(token: string): Promise<{ valid: boolean; service?: PaywallService }> {
    try {
      const secret = this.getSigningSecret();
      const { payload } = await jose.jwtVerify(token, secret);

      return {
        valid: true,
        service: payload.service as PaywallService,
      };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Check if a service is currently unlocked
   */
  async isServiceUnlocked(service: PaywallService): Promise<boolean> {
    const entitlement = await mongodb.getActiveEntitlement(service);
    return entitlement !== null;
  }

  /**
   * Get all active entitlements
   */
  async getActiveEntitlements(): Promise<PaywallService[]> {
    const services: PaywallService[] = ['voyage', 'mongodb', 'cdp'];
    const active: PaywallService[] = [];

    for (const service of services) {
      if (await this.isServiceUnlocked(service)) {
        active.push(service);
      }
    }

    return active;
  }

  /**
   * Get service prices
   */
  getServicePrices(): Record<PaywallService, number> {
    return {
      voyage: parseFloat(process.env.PAYWALL_PRICE_VOYAGE_USDC || '0.50'),
      mongodb: parseFloat(process.env.PAYWALL_PRICE_MONGODB_USDC || '0.50'),
      cdp: parseFloat(process.env.PAYWALL_PRICE_CDP_USDC || '0.50'),
    };
  }
}

// Export singleton instance
export const paywallService = new PaywallServiceManager();
