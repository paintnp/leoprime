/**
 * CDP SDK Diagnostic Script
 * Run: node test-cdp.mjs
 *
 * This script tests CDP connectivity and identifies configuration issues.
 */

import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { createRequire } from 'module';
import "dotenv/config";

const require = createRequire(import.meta.url);

console.log("=".repeat(60));
console.log("CDP SDK DIAGNOSTIC");
console.log("=".repeat(60));
console.log("");

// 1. Check SDK version
try {
  const pkg = require("@coinbase/coinbase-sdk/package.json");
  console.log(`[1] SDK Version: ${pkg.version}`);

  const [major, minor] = pkg.version.split('.').map(Number);
  if (major === 0 && minor < 20) {
    console.log("    ⚠️  WARNING: SDK < 0.20.0 does not support Ed25519 keys!");
    console.log("    Run: npm install @coinbase/coinbase-sdk@latest");
  } else {
    console.log("    ✓ SDK version supports Ed25519");
  }
} catch (e) {
  console.log("[1] SDK Version: Could not determine");
}

console.log("");

// 2. Check environment variables
console.log("[2] Environment Variables:");

const envVars = [
  "CDP_API_KEY_ID",
  "CDP_API_KEY_SECRET",
  "CDP_WALLET_SECRET",
  "CDP_WALLET_ADDRESS",
  "CDP_NETWORK",
  "NETWORK_ID"
];

for (const v of envVars) {
  const val = process.env[v];
  if (val) {
    const preview = val.length > 20 ? val.substring(0, 20) + "..." : val;
    console.log(`    ${v}: ${preview}`);
  } else {
    console.log(`    ${v}: ❌ NOT SET`);
  }
}

console.log("");

// 3. Analyze key format
console.log("[3] Key Analysis:");

const apiKeyId = process.env.CDP_API_KEY_ID;
const apiKeySecret = process.env.CDP_API_KEY_SECRET;

if (apiKeyId) {
  if (apiKeyId.includes("organizations/")) {
    console.log("    API Key ID: ✓ Full organization path format");
  } else {
    console.log("    API Key ID: ⚠️  Just UUID - may need full path");
    console.log("    Expected format: organizations/<org_id>/apiKeys/<key_id>");
  }
}

if (apiKeySecret) {
  // Check if it's Ed25519 (base64, 64 bytes decoded)
  try {
    const decoded = Buffer.from(apiKeySecret, 'base64');
    console.log(`    API Key Secret: ${decoded.length} bytes`);

    if (decoded.length === 64) {
      console.log("    Key Type: Ed25519 (64-byte base64)");
      console.log("    ✓ This is the correct format for Ed25519");
    } else if (apiKeySecret.includes("-----BEGIN")) {
      console.log("    Key Type: PEM (ECDSA)");
    } else {
      console.log("    Key Type: Unknown format");
    }
  } catch (e) {
    console.log("    API Key Secret: Could not decode");
  }
}

console.log("");

// 4. Test network connectivity
console.log("[4] Network Connectivity:");
try {
  const resp = await fetch("https://api.cdp.coinbase.com/platform", {
    method: "HEAD"
  });
  console.log(`    CDP API: ✓ Reachable (status: ${resp.status})`);
} catch (e) {
  console.log(`    CDP API: ❌ Not reachable - ${e.message}`);
}

console.log("");

// 5. Try to configure and list wallets
console.log("[5] SDK Test:");

// The v1 SDK expects apiKeyName to be the full path OR just the key name
// And privateKey to be the secret
const apiKeyName = apiKeyId;
const privateKey = apiKeySecret;

if (!apiKeyName || !privateKey) {
  console.log("    ❌ Missing API key credentials, cannot test");
} else {
  console.log("    Configuring SDK...");

  try {
    Coinbase.configure({
      apiKeyName,
      privateKey,
    });
    console.log("    ✓ SDK configured");

    console.log("    Calling Wallet.listWallets()...");
    const wallets = await Wallet.listWallets();
    console.log(`    ✓ Success! Found ${wallets.data?.length || 0} wallets`);

    if (wallets.data && wallets.data.length > 0) {
      for (const w of wallets.data) {
        const addr = await w.getDefaultAddress();
        console.log(`      - Wallet: ${addr.getId()}`);
      }
    }
  } catch (error) {
    console.log("    ❌ SDK Error:", error.message);

    if (error.httpCode) {
      console.log(`       HTTP Code: ${error.httpCode}`);
    }
    if (error.apiCode) {
      console.log(`       API Code: ${error.apiCode}`);
    }
    if (error.apiMessage) {
      console.log(`       API Message: ${error.apiMessage}`);
    }

    // Common error patterns
    if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      console.log("");
      console.log("    LIKELY CAUSE: Invalid API key or wrong format");
      console.log("    SOLUTIONS:");
      console.log("      1. Upgrade SDK: npm install @coinbase/coinbase-sdk@latest");
      console.log("      2. Check API key name format (may need full org path)");
      console.log("      3. Verify key is not expired in CDP Portal");
    }

    if (error.httpCode === null || error.httpCode === undefined) {
      console.log("");
      console.log("    LIKELY CAUSE: Network failure or JWT signing issue");
      console.log("    SOLUTIONS:");
      console.log("      1. Check VPN/firewall isn't blocking api.cdp.coinbase.com");
      console.log("      2. Ensure SDK version supports your key algorithm");
    }
  }
}

console.log("");
console.log("=".repeat(60));
console.log("DIAGNOSTIC COMPLETE");
console.log("=".repeat(60));
