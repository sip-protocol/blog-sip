---
title: 'SIP SDK: Your First Private Transaction'
description: 'Step-by-step tutorial to build your first private transaction using SIP Protocol SDK. Learn stealth addresses, commitments, and viewing keys.'
pubDate: 'Jan 12 2026'
category: 'tutorials'
tags: ['tutorial', 'sdk', 'typescript', 'privacy', 'solana', 'getting-started']
draft: false
author: 'SIP Protocol Team'
series: 'privacy-education'
seriesNumber: 10
tldr: 'Install @sip-protocol/sdk, create stealth addresses for private receiving, use Pedersen commitments to hide amounts, and generate viewing keys for compliance. Full working examples included.'
keyTakeaways:
  - 'SIP SDK installs with npm/pnpm - no complex setup required'
  - 'Stealth addresses enable private receiving without prior coordination'
  - 'Pedersen commitments hide amounts while allowing verification'
  - 'Viewing keys enable selective disclosure for compliance'
  - 'Full TypeScript support with comprehensive types'
targetAudience: 'Developers new to privacy, TypeScript/JavaScript developers, Solana builders'
prerequisites:
  - 'Node.js 18+ installed'
  - 'Basic TypeScript/JavaScript knowledge'
  - 'Understanding of async/await'
relatedPosts:
  - 'pedersen-commitments-explained'
  - 'stealth-addresses-eip-5564'
  - 'viewing-keys-compliance'
---

Building privacy into your Web3 application does not require a PhD in cryptography. The SIP Protocol SDK abstracts away the complex mathematics—stealth addresses, Pedersen commitments, viewing keys—into a clean, TypeScript-first API.

By the end of this tutorial, you will have built a complete private payment flow: generating stealth addresses for private receiving, hiding transaction amounts with commitments, and creating viewing keys for compliance. All in under 100 lines of code.

This is Part 10 of our Privacy Education Series. We will focus on practical implementation, building on the concepts from earlier articles.

## What You Will Build

We will create a privacy-preserving payment system with four key capabilities:

1. **Private receiving**: Generate stealth addresses so senders cannot link payments to your identity
2. **Amount hiding**: Use Pedersen commitments to hide transaction amounts
3. **Compliant privacy**: Create viewing keys that let auditors verify transactions
4. **Payment scanning**: Detect incoming payments to your stealth addresses

By the end, you will understand how to integrate SIP Protocol into any TypeScript application—whether it is a wallet, DEX, DAO treasury, or enterprise payment system.

## Prerequisites

Before we start, ensure you have:

- **Node.js 18+**: Check with `node --version`
- **npm, pnpm, or yarn**: We will use pnpm in examples, but any works
- **Basic TypeScript knowledge**: Familiarity with async/await and types
- **A code editor**: VS Code recommended for TypeScript autocomplete

Optional but helpful:

- **Solana CLI**: For testing on devnet (we will show this later)
- Reading our previous articles on [Pedersen commitments](/blog/pedersen-commitments-explained) and [stealth addresses](/blog/stealth-addresses-eip-5564)

## Installation

Install the SIP Protocol packages:

```bash
# Using pnpm (recommended)
pnpm add @sip-protocol/sdk @sip-protocol/types

# Using npm
npm install @sip-protocol/sdk @sip-protocol/types

# Using yarn
yarn add @sip-protocol/sdk @sip-protocol/types
```

That is it. No native dependencies, no build steps, no complex configuration. The SDK is pure TypeScript/JavaScript and works in Node.js and modern browsers.

### Project Setup

Create a new TypeScript project or add to an existing one:

```bash
mkdir sip-tutorial && cd sip-tutorial
pnpm init -y
pnpm add @sip-protocol/sdk @sip-protocol/types
pnpm add -D typescript tsx @types/node

# Initialize TypeScript
npx tsc --init
```

Create a `tsconfig.json` with these settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

Create `src/index.ts` for our tutorial code. Run files with `pnpm tsx src/index.ts`.

## Core Concepts Overview

Before diving into code, let us understand the four pillars of SIP privacy:

### 1. The SIP Client

The main entry point. Manages configuration, wallet connections, and privacy operations.

```typescript
import { SIP } from '@sip-protocol/sdk'

const sip = new SIP({
  network: 'testnet',  // 'mainnet' | 'testnet'
})
```

### 2. Privacy Levels

Every operation in SIP has a privacy level:

| Level | Description | Use Case |
|-------|-------------|----------|
| `transparent` | No privacy, fully public | Public donations, verified payments |
| `shielded` | Full privacy, all details hidden | Personal transfers, business operations |
| `compliant` | Privacy + viewing key for auditors | Institutional use, regulated entities |

### 3. Stealth Addresses

One-time addresses that prevent linking payments to your identity. You publish a "meta-address" and senders derive unique payment addresses from it.

### 4. Commitments

Pedersen commitments hide amounts while enabling verification. The blockchain sees a cryptographic commitment, not the actual value.

Let us implement each of these.

## Tutorial Part 1: Initialize the SIP Client

Create `src/index.ts`:

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

// Initialize SIP client for testnet
const sip = new SIP({
  network: 'testnet',
})

console.log('SIP SDK initialized')
console.log('Network:', sip.getNetwork())
console.log('Mode:', sip.getMode())

// Output:
// SIP SDK initialized
// Network: testnet
// Mode: demo
```

The SDK starts in "demo" mode by default, which returns mock quotes for testing. For production with real NEAR Intents settlement, you would configure it differently:

```typescript
// Production configuration (for later)
const sipProduction = new SIP({
  network: 'mainnet',
  mode: 'production',
  defaultPrivacy: PrivacyLevel.SHIELDED,
  intentsAdapter: {
    jwtToken: process.env.NEAR_INTENTS_JWT,  // Your NEAR 1Click API token
  },
})
```

For this tutorial, we will stick with demo mode to focus on the privacy primitives.

## Tutorial Part 2: Generate a Stealth Meta-Address

The first step for receiving private payments is generating a stealth meta-address. This is your "privacy-enabled receiving address" that you can share publicly.

```typescript
import {
  generateStealthMetaAddress,
  encodeStealthMetaAddress,
} from '@sip-protocol/sdk'

// Generate stealth keys for Solana
const {
  metaAddress,
  spendingPrivateKey,
  viewingPrivateKey,
} = generateStealthMetaAddress('solana', 'My Privacy Wallet')

// Encode for sharing (QR codes, websites, profiles)
const encoded = encodeStealthMetaAddress(metaAddress)

console.log('=== Your Stealth Meta-Address ===')
console.log('Share this publicly:', encoded)
console.log('')
console.log('Chain:', metaAddress.chain)
console.log('Label:', metaAddress.label)
console.log('Spending Key:', metaAddress.spendingKey.slice(0, 20) + '...')
console.log('Viewing Key:', metaAddress.viewingKey.slice(0, 20) + '...')
console.log('')
console.log('=== PRIVATE - Keep Secret! ===')
console.log('Spending Private Key:', spendingPrivateKey.slice(0, 20) + '...')
console.log('Viewing Private Key:', viewingPrivateKey.slice(0, 20) + '...')

// Output:
// === Your Stealth Meta-Address ===
// Share this publicly: sip:solana:0x7b8c9d...abc:0x3f4e5a...def
//
// Chain: solana
// Label: My Privacy Wallet
// Spending Key: 0x7b8c9d1e2f3a4b5c...
// Viewing Key: 0x3f4e5a6b7c8d9e0f...
//
// === PRIVATE - Keep Secret! ===
// Spending Private Key: 0x1a2b3c4d5e6f7890...
// Viewing Private Key: 0x9f8e7d6c5b4a3210...
```

**Important**: Store the private keys securely. Anyone with the spending private key can claim funds sent to your stealth addresses. The viewing private key allows detecting payments but cannot spend them.

The encoded format `sip:solana:0x...spending:0x...viewing` can be shared anywhere—your website, social media, or embedded in a QR code.

### Multi-Chain Support

SIP supports multiple chains with the same API:

```typescript
// Ethereum (secp256k1 curve)
const ethKeys = generateStealthMetaAddress('ethereum', 'ETH Wallet')

// Solana (ed25519 curve)
const solKeys = generateStealthMetaAddress('solana', 'SOL Wallet')

// NEAR (ed25519 curve)
const nearKeys = generateStealthMetaAddress('near', 'NEAR Wallet')

// Zcash (secp256k1 curve)
const zecKeys = generateStealthMetaAddress('zcash', 'ZEC Wallet')
```

The SDK automatically handles the different elliptic curves (secp256k1 vs ed25519) internally.

## Tutorial Part 3: Create a Stealth Address (Sender Side)

Now let us act as a sender who wants to pay someone privately. We have their meta-address and need to derive a one-time payment address.

```typescript
import {
  generateStealthAddress,
  decodeStealthMetaAddress,
  ed25519PublicKeyToSolanaAddress,
} from '@sip-protocol/sdk'

// Recipient's published meta-address (we will use the one we just generated)
const recipientMetaAddressString = encoded  // From previous step

// Decode the meta-address
const recipientMetaAddress = decodeStealthMetaAddress(recipientMetaAddressString)

// Generate a one-time stealth address for this payment
const { stealthAddress, sharedSecret } = generateStealthAddress(recipientMetaAddress)

console.log('=== One-Time Payment Address ===')
console.log('Stealth Address (hex):', stealthAddress.address)
console.log('Ephemeral Public Key:', stealthAddress.ephemeralPublicKey.slice(0, 20) + '...')
console.log('View Tag:', stealthAddress.viewTag)

// Convert to native Solana address format (base58)
const solanaAddress = ed25519PublicKeyToSolanaAddress(stealthAddress.address)
console.log('Solana Address (base58):', solanaAddress)

// Output:
// === One-Time Payment Address ===
// Stealth Address (hex): 0x8a9b7c6d5e4f3a2b1c0d...
// Ephemeral Public Key: 0x2d3e4f5a6b7c8d9e...
// View Tag: 142
// Solana Address (base58): 7Vbmv1jt4vyuqBZcpYPpnVhrqVe5e6ZPBJCyqLqzQPvN
```

Each call to `generateStealthAddress` produces a unique address. Even if you pay the same recipient 100 times, each payment goes to a different address—completely unlinkable on-chain.

### What to Publish On-Chain

When sending a payment, you need to publish:

1. **The stealth address**: Where you send the funds
2. **The ephemeral public key**: So the recipient can detect the payment
3. **The view tag**: For efficient payment scanning (optional but recommended)

```typescript
// Example: What a sender would publish with their transaction
const paymentAnnouncement = {
  stealthAddress: solanaAddress,
  ephemeralPublicKey: stealthAddress.ephemeralPublicKey,
  viewTag: stealthAddress.viewTag,
  // The actual transfer happens separately via your chain's native mechanism
}

console.log('Publish this announcement:', JSON.stringify(paymentAnnouncement, null, 2))
```

The announcement can go on-chain (EIP-5564 registry on Ethereum) or to an off-chain indexer service.

## Tutorial Part 4: Create a Shielded Intent

Now let us create a complete shielded intent using the SIP client. This combines stealth addresses with amount commitments and prepares everything for privacy-preserving execution.

```typescript
import { IntentBuilder, PrivacyLevel } from '@sip-protocol/sdk'

// Create a shielded intent using the builder pattern
const intent = await new IntentBuilder()
  // Input: 1 SOL from Solana
  .input('solana', 'SOL', 1_000_000_000n)  // Amount in lamports (1 SOL = 10^9 lamports)
  // Output: At least 90 USDC
  .output('solana', 'USDC', 90_000_000n)   // Amount in smallest unit (6 decimals)
  // Full privacy
  .privacy(PrivacyLevel.SHIELDED)
  // Recipient's stealth meta-address
  .recipient(recipientMetaAddressString)
  // Maximum 1% slippage
  .slippage(1)
  // Intent valid for 10 minutes
  .ttl(600)
  .build()

console.log('=== Shielded Intent Created ===')
console.log('Intent ID:', intent.intentId)
console.log('Privacy Level:', intent.privacyLevel)
console.log('Version:', intent.version)
console.log('Created At:', new Date(intent.createdAt * 1000).toISOString())
console.log('Expires At:', new Date(intent.expiry * 1000).toISOString())
console.log('')
console.log('Output Asset:', intent.outputAsset.symbol)
console.log('Min Output:', intent.minOutputAmount.toString())
console.log('Max Slippage:', intent.maxSlippage * 100, '%')
console.log('')
console.log('Input Commitment:', intent.inputCommitment.value.slice(0, 30) + '...')
console.log('Recipient Stealth:', intent.recipientStealth.address.slice(0, 30) + '...')

// Output:
// === Shielded Intent Created ===
// Intent ID: sip-a1b2c3d4e5f6789012345678
// Privacy Level: shielded
// Version: 0.6.0
// Created At: 2026-01-12T10:30:00.000Z
// Expires At: 2026-01-12T10:40:00.000Z
//
// Output Asset: USDC
// Min Output: 90000000
// Max Slippage: 1 %
//
// Input Commitment: 0x02a1b2c3d4e5f6789012...
// Recipient Stealth: 0x037f8e9d0c1b2a3456...
```

The shielded intent contains:

- **Input Commitment**: A Pedersen commitment hiding the input amount
- **Sender Commitment**: Hides the sender's identity
- **Recipient Stealth**: The one-time stealth address for this payment

On-chain, observers see cryptographic commitments, not actual values.

## Tutorial Part 5: Create Pedersen Commitments Directly

Sometimes you need to work with commitments directly—for custom verification logic or integration with other protocols. Here is how:

```typescript
import { commit, verifyOpening, addCommitments, addBlindings } from '@sip-protocol/sdk'

// Commit to an amount (e.g., 1000 tokens)
const amount = 1000n
const { commitment, blinding } = commit(amount)

console.log('=== Pedersen Commitment ===')
console.log('Value (hidden):', amount.toString())
console.log('Commitment:', commitment)
console.log('Blinding Factor:', blinding.slice(0, 30) + '...')

// Verify the commitment opens correctly
const isValid = verifyOpening(commitment, amount, blinding)
console.log('Verification:', isValid ? 'VALID' : 'INVALID')

// Try to open with wrong value (should fail)
const isFake = verifyOpening(commitment, 9999n, blinding)
console.log('Fake verification:', isFake ? 'VALID' : 'INVALID')

// Output:
// === Pedersen Commitment ===
// Value (hidden): 1000
// Commitment: 0x02a1b2c3d4e5f6789012345678901234567890abcdef...
// Blinding Factor: 0x7f8e9d0c1b2a3456789012...
// Verification: VALID
// Fake verification: INVALID
```

### Homomorphic Addition

The magic of Pedersen commitments is that you can add them without knowing the underlying values:

```typescript
// Alice commits to 500
const alice = commit(500n)

// Bob commits to 300
const bob = commit(300n)

// Add the commitments (no one knows individual amounts!)
const sumCommitment = addCommitments(alice.commitment, bob.commitment)

// To verify the sum, combine the blindings
const sumBlinding = addBlindings(alice.blinding, bob.blinding)

// Verify: sum commits to 800
const sumValid = verifyOpening(sumCommitment.commitment, 800n, sumBlinding)
console.log('Sum verification (800):', sumValid ? 'VALID' : 'INVALID')

// Verify: sum does NOT commit to 900
const sumInvalid = verifyOpening(sumCommitment.commitment, 900n, sumBlinding)
console.log('Sum verification (900):', sumInvalid ? 'VALID' : 'INVALID')

// Output:
// Sum verification (800): VALID
// Sum verification (900): INVALID
```

A third party can verify the sum is 800 without ever learning that Alice contributed 500 and Bob contributed 300.

## Tutorial Part 6: Generate and Use Viewing Keys

For compliant privacy—private by default but transparent to auditors—we use viewing keys.

```typescript
import {
  generateViewingKey,
  deriveViewingKey,
  encryptForViewing,
  decryptWithViewing,
} from '@sip-protocol/sdk'

// Generate a master viewing key
const masterViewingKey = generateViewingKey('m/0')

console.log('=== Viewing Key Generated ===')
console.log('Key:', masterViewingKey.key.slice(0, 30) + '...')
console.log('Path:', masterViewingKey.path)
console.log('Hash:', masterViewingKey.hash.slice(0, 30) + '...')

// Derive child keys for different purposes
const auditKey = deriveViewingKey(masterViewingKey, 'audit/2026')
const taxKey = deriveViewingKey(masterViewingKey, 'tax/2025')

console.log('')
console.log('Audit Key Path:', auditKey.path)  // m/0/audit/2026
console.log('Tax Key Path:', taxKey.path)      // m/0/tax/2025

// Output:
// === Viewing Key Generated ===
// Key: 0xa1b2c3d4e5f6789012345678...
// Path: m/0
// Hash: 0x9f8e7d6c5b4a3210fedcba98...
//
// Audit Key Path: m/0/audit/2026
// Tax Key Path: m/0/tax/2025
```

### Encrypt Transaction Data for Viewing Key Holders

```typescript
// Transaction data to encrypt
const transactionData = {
  sender: '7Vbmv1jt4vyuqBZcpYPpnVhrqVe5e6ZPBJCyqLqzQPvN',
  recipient: 'DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz',
  amount: '1000000000',  // 1 SOL in lamports
  timestamp: Math.floor(Date.now() / 1000),
}

// Encrypt for viewing key holder
const encrypted = encryptForViewing(transactionData, masterViewingKey)

console.log('=== Encrypted Transaction ===')
console.log('Ciphertext:', encrypted.ciphertext.slice(0, 50) + '...')
console.log('Nonce:', encrypted.nonce)
console.log('Viewing Key Hash:', encrypted.viewingKeyHash.slice(0, 30) + '...')

// The auditor can decrypt with their viewing key
const decrypted = decryptWithViewing(encrypted, masterViewingKey)

console.log('')
console.log('=== Decrypted by Auditor ===')
console.log('Sender:', decrypted.sender)
console.log('Recipient:', decrypted.recipient)
console.log('Amount:', decrypted.amount)
console.log('Timestamp:', new Date(decrypted.timestamp * 1000).toISOString())

// Output:
// === Encrypted Transaction ===
// Ciphertext: 0xa1b2c3d4e5f6789012345678901234567890abcd...
// Nonce: 0x1a2b3c4d5e6f7890abcdef123456789012345678...
// Viewing Key Hash: 0x9f8e7d6c5b4a3210fedcba...
//
// === Decrypted by Auditor ===
// Sender: 7Vbmv1jt4vyuqBZcpYPpnVhrqVe5e6ZPBJCyqLqzQPvN
// Recipient: DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz
// Amount: 1000000000
// Timestamp: 2026-01-12T10:30:00.000Z
```

The encrypted data is stored on-chain or off-chain. Only someone with the matching viewing key can decrypt it.

## Tutorial Part 7: Scan for Incoming Payments

As a recipient, you need to scan announcements to find payments sent to your stealth addresses.

```typescript
import { checkStealthAddress, deriveStealthPrivateKey } from '@sip-protocol/sdk'

// Simulate announcements (in production, fetch from chain or indexer)
const announcements = [
  {
    stealthAddress: stealthAddress.address,  // From the sender example
    ephemeralPublicKey: stealthAddress.ephemeralPublicKey,
    viewTag: stealthAddress.viewTag,
    txHash: '5wHGkVU8cJJ...mock',
    amount: '1000000000',
  },
  // ... other announcements from the network
]

console.log('=== Scanning for Payments ===')
console.log(`Checking ${announcements.length} announcements...`)

for (const ann of announcements) {
  // Quick check using view tag (256x faster)
  const isMatch = checkStealthAddress(
    {
      address: ann.stealthAddress,
      ephemeralPublicKey: ann.ephemeralPublicKey,
      viewTag: ann.viewTag,
    },
    spendingPrivateKey,  // Our spending private key
    viewingPrivateKey,   // Our viewing private key
  )

  if (isMatch) {
    console.log('')
    console.log('FOUND PAYMENT!')
    console.log('Stealth Address:', ann.stealthAddress.slice(0, 30) + '...')
    console.log('Transaction:', ann.txHash)
    console.log('Amount:', ann.amount)

    // Derive the private key to spend these funds
    const recovery = deriveStealthPrivateKey(
      {
        address: ann.stealthAddress,
        ephemeralPublicKey: ann.ephemeralPublicKey,
        viewTag: ann.viewTag,
      },
      spendingPrivateKey,
      viewingPrivateKey,
    )

    console.log('')
    console.log('Recovery Data:')
    console.log('Stealth Address:', recovery.stealthAddress.slice(0, 30) + '...')
    console.log('Private Key:', recovery.privateKey.slice(0, 30) + '... (KEEP SECRET)')

    // Now you can use this private key to spend from the stealth address
  }
}

// Output:
// === Scanning for Payments ===
// Checking 1 announcements...
//
// FOUND PAYMENT!
// Stealth Address: 0x8a9b7c6d5e4f3a2b1c0d9e8f...
// Transaction: 5wHGkVU8cJJ...mock
// Amount: 1000000000
//
// Recovery Data:
// Stealth Address: 0x8a9b7c6d5e4f3a2b1c0d9e8f...
// Private Key: 0x1a2b3c4d5e6f7890abcdef12... (KEEP SECRET)
```

The scanning process:

1. Fetches announcements from the network
2. Uses view tags for quick filtering (rejects ~99.6% of non-matching)
3. Performs full cryptographic check on remaining candidates
4. Derives private keys for matched payments

## Complete Example: Private Payment Flow

Here is a complete working example that ties everything together:

```typescript
// src/complete-example.ts
import {
  SIP,
  PrivacyLevel,
  IntentBuilder,
  generateStealthMetaAddress,
  encodeStealthMetaAddress,
  decodeStealthMetaAddress,
  generateStealthAddress,
  checkStealthAddress,
  deriveStealthPrivateKey,
  generateViewingKey,
  encryptForViewing,
  decryptWithViewing,
  ed25519PublicKeyToSolanaAddress,
} from '@sip-protocol/sdk'

async function main() {
  console.log('=== SIP Protocol: Complete Private Payment Flow ===\n')

  // ========================================
  // STEP 1: Recipient Setup
  // ========================================
  console.log('--- Step 1: Recipient generates stealth keys ---')

  const recipient = generateStealthMetaAddress('solana', 'Bob Privacy Wallet')
  const recipientEncodedAddress = encodeStealthMetaAddress(recipient.metaAddress)

  console.log('Recipient meta-address:', recipientEncodedAddress)
  console.log('(Bob shares this publicly)\n')

  // ========================================
  // STEP 2: Sender Creates Payment
  // ========================================
  console.log('--- Step 2: Sender creates private payment ---')

  // Decode recipient's published address
  const bobMetaAddress = decodeStealthMetaAddress(recipientEncodedAddress)

  // Generate one-time stealth address
  const { stealthAddress } = generateStealthAddress(bobMetaAddress)

  console.log('One-time stealth address generated')
  console.log('Solana address:', ed25519PublicKeyToSolanaAddress(stealthAddress.address))
  console.log('View tag:', stealthAddress.viewTag, '\n')

  // ========================================
  // STEP 3: Create Shielded Intent
  // ========================================
  console.log('--- Step 3: Create shielded intent ---')

  const sip = new SIP({ network: 'testnet' })

  const intent = await new IntentBuilder()
    .input('solana', 'SOL', 1_000_000_000n)  // 1 SOL
    .output('solana', 'USDC', 90_000_000n)   // Min 90 USDC
    .privacy(PrivacyLevel.SHIELDED)
    .recipient(recipientEncodedAddress)
    .slippage(1)
    .ttl(600)
    .build()

  console.log('Intent created:', intent.intentId)
  console.log('Privacy level:', intent.privacyLevel)
  console.log('Input commitment:', intent.inputCommitment.value.slice(0, 40) + '...\n')

  // ========================================
  // STEP 4: Compliant Mode with Viewing Keys
  // ========================================
  console.log('--- Step 4: Compliant mode with viewing keys ---')

  const viewingKey = generateViewingKey('m/org/treasury')

  const complianceIntent = await new IntentBuilder()
    .input('solana', 'SOL', 5_000_000_000n)  // 5 SOL
    .output('solana', 'USDC', 450_000_000n)  // Min 450 USDC
    .privacy(PrivacyLevel.COMPLIANT)
    .recipient(recipientEncodedAddress)
    .build()

  // Encrypt transaction details for auditor
  const transactionData = {
    sender: 'Alice Treasury Wallet',
    recipient: recipientEncodedAddress,
    amount: '5000000000',
    timestamp: Math.floor(Date.now() / 1000),
  }

  const encrypted = encryptForViewing(transactionData, viewingKey)

  console.log('Compliant intent created:', complianceIntent.intentId)
  console.log('Viewing key path:', viewingKey.path)
  console.log('Encrypted data created for auditor\n')

  // Auditor can decrypt
  const decrypted = decryptWithViewing(encrypted, viewingKey)
  console.log('Auditor decrypts:', decrypted.amount, 'lamports\n')

  // ========================================
  // STEP 5: Recipient Scans for Payment
  // ========================================
  console.log('--- Step 5: Recipient scans for payments ---')

  // Simulate receiving the announcement
  const announcements = [{
    stealthAddress: stealthAddress.address,
    ephemeralPublicKey: stealthAddress.ephemeralPublicKey,
    viewTag: stealthAddress.viewTag,
  }]

  for (const ann of announcements) {
    const isForMe = checkStealthAddress(
      ann,
      recipient.spendingPrivateKey,
      recipient.viewingPrivateKey
    )

    if (isForMe) {
      console.log('Payment found!')

      const recovery = deriveStealthPrivateKey(
        ann,
        recipient.spendingPrivateKey,
        recipient.viewingPrivateKey
      )

      console.log('Can now spend from:', recovery.stealthAddress.slice(0, 40) + '...')
      console.log('Private key derived successfully\n')
    }
  }

  console.log('=== Complete! ===')
}

main().catch(console.error)
```

Run with:

```bash
pnpm tsx src/complete-example.ts
```

## Error Handling Best Practices

Production code should handle errors gracefully:

```typescript
import {
  ValidationError,
  CryptoError,
  IntentError,
} from '@sip-protocol/sdk'

async function createPaymentSafely() {
  try {
    const intent = await new IntentBuilder()
      .input('solana', 'SOL', 1_000_000_000n)
      .output('solana', 'USDC', 0n)
      .privacy(PrivacyLevel.SHIELDED)
      .recipient('sip:solana:0x...:0x...')  // Recipient meta-address
      .build()

    return { success: true, intent }
  } catch (error) {
    if (error instanceof ValidationError) {
      // Input validation failed
      console.error('Invalid input:', error.message)
      console.error('Field:', error.field)
      return { success: false, error: 'VALIDATION', message: error.message }
    }

    if (error instanceof CryptoError) {
      // Cryptographic operation failed
      console.error('Crypto error:', error.message)
      return { success: false, error: 'CRYPTO', message: error.message }
    }

    if (error instanceof IntentError) {
      // Intent creation/execution failed
      console.error('Intent error:', error.message)
      console.error('Code:', error.code)
      return { success: false, error: 'INTENT', message: error.message }
    }

    // Unknown error
    throw error
  }
}
```

### Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid chain | Unsupported chain ID | Use: solana, ethereum, near, zcash, polygon, etc. |
| Invalid amount | Negative or non-bigint | Use positive BigInt values |
| Invalid meta-address | Wrong format | Format: `sip:<chain>:<spending>:<viewing>` |
| Invalid privacy level | Unknown level | Use: transparent, shielded, compliant |

## Security Best Practices

When building with SIP Protocol:

### 1. Protect Private Keys

```typescript
// DO: Store in secure storage
import { secureStorage } from './your-secure-storage'
await secureStorage.store('spending-key', spendingPrivateKey)

// DON'T: Store in plain text, logs, or version control
console.log(spendingPrivateKey)  // Never do this!
localStorage.setItem('key', spendingPrivateKey)  // Never!
```

### 2. Validate All Inputs

```typescript
// DO: Validate before using
import { decodeStealthMetaAddress } from '@sip-protocol/sdk'

function validateRecipient(input: string) {
  try {
    const decoded = decodeStealthMetaAddress(input)
    return { valid: true, decoded }
  } catch {
    return { valid: false, error: 'Invalid stealth meta-address' }
  }
}

// DON'T: Trust user input blindly
const unsafeAddress = userInput  // Always validate!
```

### 3. Use Appropriate Privacy Levels

```typescript
// Transparent: Public donations, verified payments
PrivacyLevel.TRANSPARENT

// Shielded: Personal transfers, business operations
PrivacyLevel.SHIELDED

// Compliant: Institutional use, regulated entities
PrivacyLevel.COMPLIANT
```

### 4. Rotate Viewing Keys

```typescript
// Generate time-bounded viewing keys
const taxKey2025 = deriveViewingKey(masterKey, 'tax/2025')
const taxKey2026 = deriveViewingKey(masterKey, 'tax/2026')

// Share only the key for the relevant period
// Old keys cannot decrypt new transactions
```

## Next Steps

You now have the foundation to build privacy-preserving applications with SIP Protocol. Here are suggested next steps:

### 1. Explore the Full API

Check out our [SDK documentation](https://docs.sip-protocol.org/sdk) for:

- Production mode configuration
- NEAR Intents integration
- Wallet adapter implementations
- ZK proof generation

### 2. Read the Technical Deep-Dives

- [Pedersen Commitments Explained](/blog/pedersen-commitments-explained) — The math behind amount hiding
- [Stealth Addresses and EIP-5564](/blog/stealth-addresses-eip-5564) — How recipient privacy works
- [Viewing Keys for Compliance](/blog/viewing-keys-compliance) — Enterprise privacy patterns

### 3. Join the Community

- **GitHub**: [github.com/sip-protocol](https://github.com/sip-protocol)
- **Discord**: [discord.gg/sip-protocol](https://discord.gg/sip-protocol)
- **X**: [@sipprotocol](https://x.com/sipprotocol)

### 4. Build Something

Ideas for your first project:

- **Privacy wallet**: Integrate stealth addresses into an existing wallet
- **Private payments page**: Let users receive donations privately
- **DAO treasury**: Add viewing keys for member transparency
- **Compliance dashboard**: Build audit interfaces with viewing keys

## Conclusion

Privacy in Web3 does not have to be complicated. The SIP Protocol SDK provides production-ready primitives—stealth addresses, Pedersen commitments, viewing keys—with a clean TypeScript API.

In this tutorial, you learned:

1. **How to generate stealth meta-addresses** for private receiving
2. **How to derive one-time addresses** as a sender
3. **How to create shielded intents** with hidden amounts
4. **How to use viewing keys** for compliant privacy
5. **How to scan for payments** to your stealth addresses

The code examples are complete and runnable. Clone, modify, and build something private.

---

*This is Part 10 of our Privacy Education Series. For conceptual background, start with [Why Privacy Matters for Solana](/blog/why-privacy-matters-solana). For the full API reference, see our [documentation](https://docs.sip-protocol.org).*

## Further Reading

- [SIP Protocol SDK on npm](https://www.npmjs.com/package/@sip-protocol/sdk)
- [API Documentation](https://docs.sip-protocol.org/sdk)
- [GitHub Repository](https://github.com/sip-protocol/sip-protocol)
- [Example Applications](https://github.com/sip-protocol/sip-app)
