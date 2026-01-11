# CDP Wallet Configuration Fixes

## Problem Summary

The LEO Prime app was failing to connect to CDP (Coinbase Developer Platform) with undefined errors during `Wallet.listWallets()` calls.

## Root Causes Identified

### 1. SDK Version Incompatibility
- **Installed**: `@coinbase/coinbase-sdk@0.15.0`
- **Required**: `@coinbase/coinbase-sdk@0.20.0+` for Ed25519 key support
- **Current**: `@coinbase/coinbase-sdk@0.25.0`

### 2. Key Algorithm Mismatch
The CDP API key uses **Ed25519** algorithm (64-byte base64-encoded secret). SDK versions < 0.20.0 only supported ECDSA (PEM format) keys.

**Ed25519 key signature**: 64 bytes when base64-decoded, no PEM headers.

### 3. Missing Wallet Seed
The v1 SDK requires importing the wallet seed to sign transactions. Without the seed, the wallet is read-only.

## Fixes Applied

### Fix 1: SDK Upgrade
```bash
npm install @coinbase/coinbase-sdk@latest
```
Upgraded from 0.15.0 → 0.25.0

### Fix 2: Updated `cdp-payment.ts`
- Removed legacy file-based key loading
- Added wallet seed import from `wallet-seed.json`
- Added proper error handling with HTTP/API codes

### Fix 3: Created V1 Wallet
Created a new wallet using the Node SDK:
```bash
node create-v1-wallet.mjs
```

## Wallet Configuration

### V1 Wallet (Active - Node SDK)
- **Address**: `0x0A3DbA6E8A200228F9Db0a15fA8D7F6A7958172B`
- **Network**: base-mainnet
- **Wallet ID**: `0c861752-da3c-4a4c-a3bc-9d2321fbd1c3`
- **Seed File**: `wallet-seed.json`
- **Status**: ✅ Ready (needs funding)

### V2 Wallet (Legacy - Python SDK)
- **Address**: `0x3845Ad4c3226454aCdEb624d091D906938DC1e8C`
- **Balance**: 3 USDC
- **Status**: ⚠️ Stuck - has USDC but no ETH for gas fees
- **Note**: Created via Python `cdp-sdk`, incompatible with Node `coinbase-sdk`

## SDK Differences

| Feature | Node `@coinbase/coinbase-sdk` (v1) | Python `cdp-sdk` (v2) |
|---------|------------------------------------|-----------------------|
| Wallet Model | `Wallet` objects with seeds | `EvmServerAccount` |
| Signing | Requires imported seed | Server-side signing |
| API | `Wallet.listWallets()` | `client.evm.list_accounts()` |
| Key Format | Ed25519 base64 (0.20.0+) | Ed25519 base64 |

## Environment Variables

```env
# API Authentication
CDP_API_KEY_ID=e6a1f796-3890-4381-b079-bc1449326dae
CDP_API_KEY_SECRET=<64-byte Ed25519 key in base64>

# V1 Wallet (Node SDK)
CDP_WALLET_ADDRESS=0x0A3DbA6E8A200228F9Db0a15fA8D7F6A7958172B
CDP_WALLET_ID=0c861752-da3c-4a4c-a3bc-9d2321fbd1c3

# Network
CDP_NETWORK=base
NETWORK_ID=base-mainnet
```

## Diagnostic Tools

Created `test-cdp.mjs` to diagnose CDP issues:
```bash
node test-cdp.mjs
```

Checks:
1. SDK version compatibility
2. Environment variables
3. Key algorithm detection
4. Network connectivity
5. Wallet listing

## To Fund the V1 Wallet

Send Base ETH + USDC to:
```
0x0A3DbA6E8A200228F9Db0a15fA8D7F6A7958172B
```

Explorer: https://basescan.org/address/0x0A3DbA6E8A200228F9Db0a15fA8D7F6A7958172B

## To Unstick the V2 Wallet

The V2 wallet has 3 USDC but cannot transfer without gas. Send ~$0.01 Base ETH to:
```
0x3845Ad4c3226454aCdEb624d091D906938DC1e8C
```

Then run transfer via Python:
```python
# From apps/leo-hack directory
python -c "..." # See transfer script
```

## Key Learnings

1. **Always check SDK version** when using Ed25519 keys
2. **V1 and V2 CDP SDKs are different products** - wallets don't cross over
3. **Wallet seeds are required** for signing in the Node SDK
4. **ERC-20 transfers need ETH for gas** even for USDC-only wallets
