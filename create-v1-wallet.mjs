/**
 * Create a CDP v1 Wallet
 * Run: node create-v1-wallet.mjs
 */

import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import "dotenv/config";
import * as fs from 'fs';

console.log("=".repeat(60));
console.log("CREATE CDP v1 WALLET");
console.log("=".repeat(60));
console.log("");

const apiKeyName = process.env.CDP_API_KEY_ID;
const privateKey = process.env.CDP_API_KEY_SECRET;

if (!apiKeyName || !privateKey) {
  console.error("❌ Missing CDP_API_KEY_ID or CDP_API_KEY_SECRET");
  process.exit(1);
}

try {
  console.log("[1] Configuring SDK...");
  Coinbase.configure({
    apiKeyName,
    privateKey,
  });
  console.log("    ✓ SDK configured");

  console.log("");
  console.log("[2] Checking existing wallets...");
  const existing = await Wallet.listWallets();
  console.log(`    Found ${existing.data?.length || 0} existing wallets`);

  if (existing.data && existing.data.length > 0) {
    console.log("");
    console.log("    Existing wallets:");
    for (const w of existing.data) {
      const addr = await w.getDefaultAddress();
      console.log(`      - ${addr.getId()} (network: ${w.getNetworkId()})`);
    }
    console.log("");
    console.log("    Using first existing wallet...");

    const wallet = existing.data[0];
    const address = await wallet.getDefaultAddress();

    console.log("");
    console.log("=".repeat(60));
    console.log("WALLET INFO");
    console.log("=".repeat(60));
    console.log(`Address:  ${address.getId()}`);
    console.log(`Network:  ${wallet.getNetworkId()}`);
    console.log(`Wallet ID: ${wallet.getId()}`);
    console.log("");
    console.log("Update your .env:");
    console.log(`CDP_WALLET_ADDRESS=${address.getId()}`);

  } else {
    console.log("");
    console.log("[3] Creating new wallet on base-mainnet...");

    const wallet = await Wallet.create({
      networkId: 'base-mainnet'
    });

    const address = await wallet.getDefaultAddress();

    console.log("    ✓ Wallet created!");
    console.log("");
    console.log("=".repeat(60));
    console.log("NEW WALLET CREATED");
    console.log("=".repeat(60));
    console.log(`Address:   ${address.getId()}`);
    console.log(`Network:   ${wallet.getNetworkId()}`);
    console.log(`Wallet ID: ${wallet.getId()}`);
    console.log("");

    // Export the wallet seed for persistence
    const seedPath = './wallet-seed.json';
    const seedData = wallet.export();
    fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2));
    console.log(`Seed saved to: ${seedPath}`);
    console.log("⚠️  IMPORTANT: Keep this file safe for wallet recovery!");
    console.log("");
    console.log("Update your .env:");
    console.log(`CDP_WALLET_ADDRESS=${address.getId()}`);
    console.log("");
    console.log("Fund this address with Base ETH + USDC:");
    console.log(`https://basescan.org/address/${address.getId()}`);
  }

} catch (error) {
  console.error("❌ Error:", error.message);
  if (error.httpCode) {
    console.error("   HTTP Code:", error.httpCode);
  }
  if (error.apiMessage) {
    console.error("   API Message:", error.apiMessage);
  }
  process.exit(1);
}
