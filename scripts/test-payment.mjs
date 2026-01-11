#!/usr/bin/env node
/**
 * Test real USDC payment on Base network
 *
 * This script tests the CDP payment flow:
 * 1. Initialize CDP SDK
 * 2. Check wallet balance
 * 3. Optionally send a test payment
 *
 * Usage:
 *   node scripts/test-payment.mjs           # Check balance only
 *   node scripts/test-payment.mjs --send    # Send a $0.01 test payment
 */

import 'dotenv/config';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import * as fs from 'fs';
import * as path from 'path';

const TEST_AMOUNT = 0.01; // $0.01 USDC for test
const RECIPIENT = process.env.PAYWALL_RECIPIENT || process.env.CDP_WALLET_ADDRESS;

async function main() {
  const shouldSend = process.argv.includes('--send');

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         LEO Prime - Payment Test Script                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Step 1: Configure CDP SDK
  console.log('1. Configuring CDP SDK...');
  const apiKeyName = process.env.CDP_API_KEY_ID;
  const privateKey = process.env.CDP_API_KEY_SECRET;

  if (!apiKeyName || !privateKey) {
    console.error('❌ Missing CDP_API_KEY_ID or CDP_API_KEY_SECRET');
    process.exit(1);
  }

  Coinbase.configure({ apiKeyName, privateKey });
  console.log('   ✓ SDK configured\n');

  // Step 2: Load wallet
  console.log('2. Loading wallet...');
  const seedPath = path.join(process.cwd(), 'wallet-seed.json');

  let wallet;
  if (fs.existsSync(seedPath)) {
    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    wallet = await Wallet.import(seedData);
    console.log('   ✓ Wallet imported from seed file');
  } else {
    console.error('❌ No wallet-seed.json found. Run the app first to create one.');
    process.exit(1);
  }

  const address = await wallet.getDefaultAddress();
  console.log(`   Address: ${address.getId()}\n`);

  // Step 3: Check balance
  console.log('3. Checking balances...');
  const usdcBalance = await wallet.getBalance('usdc');
  const ethBalance = await wallet.getBalance('eth');
  const balanceNum = parseFloat(usdcBalance.toString());
  const ethNum = parseFloat(ethBalance.toString());
  console.log(`   USDC: ${balanceNum}`);
  console.log(`   ETH:  ${ethNum}\n`);

  if (balanceNum < 0.50) {
    console.log('⚠️  Balance below $0.50 - real payments will be simulated');
    console.log('   Fund this wallet to enable real payments:\n');
    console.log(`   Send USDC (Base network) to: ${address.getId()}\n`);
  }

  // Step 4: Check recipient
  console.log('4. Payment configuration...');
  console.log(`   Recipient: ${RECIPIENT}`);

  if (RECIPIENT === address.getId()) {
    console.log('   Mode: PAY TO SELF (money returns to you)');
  } else {
    console.log('   Mode: REAL PAYMENT (money leaves wallet)');
  }
  console.log('');

  // Step 5: Optionally send test payment
  if (shouldSend) {
    if (balanceNum < TEST_AMOUNT) {
      console.log(`❌ Insufficient balance for test payment (need ${TEST_AMOUNT} USDC)`);
      process.exit(1);
    }

    console.log(`5. Sending test payment of ${TEST_AMOUNT} USDC...`);
    console.log('   This is a REAL blockchain transaction!\n');

    // Check for ETH for gas
    if (ethNum < 0.0001) {
      console.log('⚠️  Warning: Very low ETH balance for gas fees');
      console.log('   Transfer may fail. Consider adding ~$0.01 ETH to wallet.\n');
    }

    const useGasless = process.argv.includes('--gasless');
    const transferOptions = {
      amount: TEST_AMOUNT,
      assetId: 'usdc',
      destination: RECIPIENT,
    };

    if (useGasless) {
      transferOptions.gasless = true;
      console.log('   Mode: Gasless (requires CDP account feature enabled)');
    } else {
      console.log('   Mode: Standard (uses ETH for gas)');
    }

    try {
      console.log('   Creating transfer...');
      const transfer = await wallet.createTransfer(transferOptions);

      console.log('   Transfer created:', transfer.getId ? transfer.getId() : 'pending');
      console.log('   ⏳ Waiting for confirmation...');

      await transfer.wait();

      const txHash = transfer.getTransactionHash();
      console.log('\n   ✅ PAYMENT SUCCESSFUL!\n');
      console.log(`   TX Hash: ${txHash}`);
      console.log(`   Explorer: https://basescan.org/tx/${txHash}`);
      console.log(`   Amount: ${TEST_AMOUNT} USDC`);

      // Check new balance
      const newBalance = await wallet.getBalance('usdc');
      console.log(`\n   New Balance: ${parseFloat(newBalance.toString())} USDC`);

    } catch (error) {
      console.error('\n❌ Payment failed:', error.message || error);
      if (error.apiCode) console.error('   API Code:', error.apiCode);
      if (error.apiMessage) console.error('   API Message:', error.apiMessage);
      if (error.httpCode) console.error('   HTTP Code:', error.httpCode);
      if (error.correlationId) console.error('   Correlation ID:', error.correlationId);
      console.error('   Full error:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
  } else {
    console.log('5. Dry run mode - no payment sent');
    console.log('   Run with --send to test a real payment\n');
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('Demo Requirements:');
  console.log('────────────────────────────────────────────────────────────────');

  const serviceCost = 0.50;
  const numServices = 3;
  const totalNeeded = serviceCost * numServices;

  if (balanceNum >= totalNeeded) {
    console.log(`✅ Wallet has ${balanceNum} USDC - enough for full demo!`);
    console.log(`   (Demo uses ${numServices} services × $${serviceCost} = $${totalNeeded} total)`);
  } else if (balanceNum >= serviceCost) {
    console.log(`⚠️  Wallet has ${balanceNum} USDC - partial demo possible`);
    console.log(`   Can demonstrate ${Math.floor(balanceNum / serviceCost)} of ${numServices} payments`);
  } else {
    console.log(`❌ Wallet needs USDC for real payment demo`);
    console.log(`   Minimum: $${serviceCost} (1 service)`);
    console.log(`   Full demo: $${totalNeeded} (${numServices} services)`);
  }

  console.log('════════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
