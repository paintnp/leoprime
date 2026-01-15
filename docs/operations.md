# LEO Prime Operations Guide

## Reset Entitlements (Before Demo)

Reset all entitlements so payments will trigger again:

```bash
# Production (fly.io)
curl -X DELETE https://leoprime.fly.dev/api/entitlements/reset

# Local development
curl -X DELETE http://localhost:3001/api/entitlements/reset
```

## Check Status

```bash
# Wallet balance
curl https://leoprime.fly.dev/api/wallet | jq .

# Entitlement status (should all be "active": false before demo)
curl https://leoprime.fly.dev/api/entitlements/status | jq .

# Health check
curl https://leoprime.fly.dev/api/health | jq .
```

## Fly.io Deployment

```bash
cd apps/leoprime/app

# Deploy latest code
fly deploy --now

# Check logs
fly logs

# Set environment variables
fly secrets set DEMO_MODE=true
fly secrets set PAYWALL_RECIPIENT=0x0A3DbA6E8A200228F9Db0a15fA8D7F6A7958172B
```

## Environment Variables (Production)

These should be set on fly.io:

| Variable | Value | Purpose |
|----------|-------|---------|
| `DEMO_MODE` | `true` | Force payments even if LLM skips them |
| `PAYWALL_RECIPIENT` | `0x0A3D...172B` | Pay-to-self (money returns to wallet) |
| `CDP_WALLET_SEED` | JSON | Wallet credentials |
| `CDP_API_KEY_ID` | UUID | Coinbase API key |
| `CDP_API_KEY_SECRET` | Base64 | Coinbase API secret |

## Wallet Info

- **Address**: `0x0A3DbA6E8A200228F9Db0a15fA8D7F6A7958172B`
- **Network**: Base (L2)
- **Explorer**: https://basescan.org/address/0x0A3DbA6E8A200228F9Db0a15fA8D7F6A7958172B

## Demo Costs

| Item | Cost |
|------|------|
| Voyage AI service | $0.50 USDC |
| MongoDB service | $0.50 USDC |
| Gas per transaction | ~$0.001 ETH |
| **Total per demo run** | **$1.00 USDC** (returns if pay-to-self) |
