---
title: 'Noir ZK Proofs on Solana: A Production Implementation'
description: 'Deep dive into how SIP Protocol uses Noir (Aztec) for zero-knowledge privacy proofs on Solana. From circuit design to browser WASM.'
pubDate: 'Jan 29 2026'
category: 'technical'
tags: ['noir', 'zk', 'solana', 'aztec', 'privacy', 'hackathon', 'wasm', 'proofs']
draft: false
author: 'SIP Protocol Team'
tldr: 'We built 3 production Noir circuits (3,776 ACIR opcodes) with browser WASM support, 86 tests, and Solana integration. Noir enables privacy proofs that hide balance, sender identity, and transaction details while remaining compliant.'
keyTakeaways:
  - '3 production circuits: Funding (972 ops), Validity (1,113 ops), Fulfillment (1,691 ops)'
  - 'Full browser WASM support with Web Workers and mobile optimization'
  - 'NoirProofProvider for Node.js, BrowserNoirProvider for browsers'
  - 'Compliance proofs enable privacy + regulatory adherence through viewing keys'
  - 'Noir is one of 6 privacy backends in our aggregator architecture'
targetAudience: 'Developers building ZK applications, privacy protocol builders'
prerequisites:
  - 'Basic understanding of zero-knowledge proofs'
  - 'Familiarity with Solana or blockchain development'
relatedPosts:
  - 'complete-privacy-guide'
  - 'privacy-for-humans'
---

Zero-knowledge proofs sound complicated. They are. But Noir makes them accessible.

This post is a technical deep-dive into how SIP Protocol uses Noir (from Aztec) to build production-ready privacy proofs for Solana. We'll cover circuit design, TypeScript integration, browser WASM support, and how ZK fits into a multi-backend privacy architecture.

## Why Noir?

We evaluated several ZK frameworks before choosing Noir:

| Framework | Pros | Cons |
|-----------|------|------|
| **Noir** | Rust-like DSL, WASM support, active dev | Newer ecosystem |
| Circom | Mature, large community | JavaScript DSL, no native types |
| Halo2 | IPA (no trusted setup), flexible | Steep learning curve, Rust only |
| SP1 | Full Rust support | Heavy runtime, less browser-friendly |

**Why we chose Noir:**

1. **Rust-like DSL** — Familiar syntax, strong types, no JavaScript quirks
2. **WASM support** — Client-side proving in browsers (critical for UX)
3. **UltraHonk backend** — Production-ready prover from Aztec
4. **Active development** — Regular releases, responsive team

```noir
// Noir feels like Rust, but for ZK circuits
fn main(
    balance: Field,           // private
    minimum_required: pub Field,  // public
) {
    assert(balance >= minimum_required as Field);
}
```

## Our Circuit Architecture

We built three circuits that work together to enable private transactions:

```
┌─────────────────────────────────────────────────────────────┐
│  FUNDING PROOF (972 ACIR opcodes)                           │
│  "I have enough balance" without revealing how much         │
│                                                             │
│  Public: commitment_hash, minimum_required, asset_id        │
│  Private: balance, blinding                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDITY PROOF (1,113 ACIR opcodes)                        │
│  "I authorized this transaction" without revealing who I am │
│                                                             │
│  Public: intent_hash, sender_commitment, nullifier          │
│  Private: sender_address, signature, secret                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FULFILLMENT PROOF (1,691 ACIR opcodes)                     │
│  "The swap was executed correctly" without revealing path   │
│                                                             │
│  Public: intent_hash, output_commitment, recipient_stealth  │
│  Private: output_amount, solver_secret, oracle_attestation  │
└─────────────────────────────────────────────────────────────┘
```

### Circuit 1: Funding Proof

The funding proof lets users prove they have sufficient balance without revealing the actual amount.

```noir
/// Funding Proof Circuit
///
/// Proves: balance >= minimum_required
/// Hides: actual balance, blinding factor

use std::hash::pedersen_hash;
use std::hash::blake3;

fn main(
    // Public inputs
    commitment_hash: pub [u8; 32],
    minimum_required: pub u64,
    asset_id: pub Field,

    // Private inputs (witness)
    balance: u64,
    blinding: Field,
) {
    // Constraint 1: Balance check
    assert(balance >= minimum_required, "Insufficient balance");

    // Constraint 2: Verify commitment
    let balance_field = balance as Field;
    let commitment = pedersen_hash([balance_field, blinding]);

    // Constraint 3: Verify commitment hash
    let computed_hash = compute_commitment_hash(commitment, asset_id);
    for i in 0..32 {
        assert(computed_hash[i] == commitment_hash[i]);
    }
}
```

**Key insight**: The Pedersen commitment hides the balance behind a blinding factor. Even if someone sees the commitment, they can't reverse-engineer the balance without the blinding factor.

### Circuit 2: Validity Proof

The validity proof lets users authorize transactions without revealing their identity.

```noir
/// Validity Proof Circuit
///
/// Proves: Intent was authorized by legitimate sender
/// Hides: sender identity, signature, secret key

use std::ecdsa_secp256k1::verify_signature;

fn main(
    // Public inputs
    intent_hash: pub Field,
    sender_commitment_x: pub Field,
    sender_commitment_y: pub Field,
    nullifier: pub Field,
    timestamp: pub u64,
    expiry: pub u64,

    // Private inputs
    sender_address: Field,
    sender_blinding: Field,
    sender_secret: Field,
    pub_key_x: [u8; 32],
    pub_key_y: [u8; 32],
    signature: [u8; 64],
    message_hash: [u8; 32],
    nonce: Field,
) {
    // 1. Verify ECDSA signature
    let valid_sig = verify_signature(pub_key_x, pub_key_y, signature, message_hash);
    assert(valid_sig, "Invalid signature");

    // 2. Verify sender commitment
    let commitment = pedersen_hash([sender_address, sender_blinding]);
    // ... verify commitment matches public inputs

    // 3. Verify nullifier (prevents double-spending)
    let computed_nullifier = pedersen_hash([sender_secret, intent_hash, nonce]);
    assert(computed_nullifier == nullifier);

    // 4. Time bounds
    assert(timestamp < expiry, "Intent expired");
}
```

**Key insight**: The nullifier prevents double-spending. It's derived from the sender's secret and the intent hash, so the same intent can't be used twice.

### Circuit 3: Fulfillment Proof

The fulfillment proof lets solvers prove they executed a swap correctly without revealing their execution path.

```noir
/// Fulfillment Proof Circuit
///
/// Proves: Solver delivered correct output to recipient
/// Hides: execution path, liquidity sources, solver strategy

fn main(
    // Public inputs
    intent_hash: pub Field,
    output_commitment_x: pub Field,
    output_commitment_y: pub Field,
    recipient_stealth: pub Field,
    min_output_amount: pub u64,
    solver_id: pub Field,
    fulfillment_time: pub u64,
    expiry: pub u64,

    // Private inputs
    output_amount: u64,
    output_blinding: Field,
    solver_secret: Field,
    // Oracle attestation data...
) {
    // 1. Output meets minimum requirement
    assert(output_amount >= min_output_amount);

    // 2. Verify output commitment
    let commitment = pedersen_hash([output_amount as Field, output_blinding]);
    // ... verify commitment matches

    // 3. Verify solver authorization
    let computed_solver_id = pedersen_hash([solver_secret]);
    assert(computed_solver_id == solver_id);

    // 4. Verify oracle attestation
    // ... signature verification

    // 5. Time bounds
    assert(fulfillment_time < expiry);
}
```

## TypeScript Integration

Our SDK provides two providers: `NoirProofProvider` for Node.js and `BrowserNoirProvider` for browsers.

### Node.js Usage

```typescript
import { NoirProofProvider } from '@sip-protocol/sdk'

// Initialize provider
const provider = new NoirProofProvider({ verbose: true })
await provider.initialize()

// Generate a funding proof
const { proof, publicInputs } = await provider.generateFundingProof({
  balance: BigInt('1000000000'),      // 1 SOL in lamports
  minimumRequired: BigInt('500000000'), // 0.5 SOL minimum
  blindingFactor: randomBytes(32),
  assetId: 'SOL',
  userAddress: '0x...',
  ownershipSignature: signature,
})

console.log('Proof type:', proof.type)        // 'funding'
console.log('Proof size:', proof.proof.length / 2, 'bytes')

// Verify the proof
const isValid = await provider.verifyProof(proof)
console.log('Valid:', isValid)  // true

// Clean up
await provider.destroy()
```

### Browser Usage

The browser provider adds WASM support, Web Workers, and mobile optimization:

```typescript
import { BrowserNoirProvider } from '@sip-protocol/sdk'

// Check browser compatibility first
const { supported, missing } = BrowserNoirProvider.checkBrowserSupport()
if (!supported) {
  console.error('Missing features:', missing)
  return
}

// Get recommended config for device
const config = BrowserNoirProvider.getRecommendedConfig()

// Initialize with progress callback
const provider = new BrowserNoirProvider({
  useWorker: true,  // Non-blocking UI
  ...config,
})

await provider.initialize((progress) => {
  updateLoadingBar(progress.percent)
  console.log(progress.message)  // "Loading WASM runtime..."
})

// Generate proof with progress updates
const result = await provider.generateFundingProof(params, (progress) => {
  updateProgressBar(progress.percent)
  // Stage: 'initializing' | 'witness' | 'proving' | 'complete'
})
```

**Mobile optimization**: The browser provider detects mobile devices and adjusts:
- Longer timeouts (2 minutes vs 1 minute)
- Memory-efficient initialization
- Worker fallback for low-memory devices

### Solana Verification

We also provide `SolanaNoirVerifier` for on-chain verification:

```typescript
import { SolanaNoirVerifier } from '@sip-protocol/sdk'

const verifier = new SolanaNoirVerifier({ network: 'devnet' })
await verifier.initialize()

// Off-chain verification (fast, free)
const isValid = await verifier.verifyOffChain(proof)

// On-chain verification (submits transaction)
const result = await verifier.verifyOnChain(proof, wallet)
console.log('Signature:', result.signature)

// Get proof statistics
const stats = verifier.getProofStatistics(proof)
console.log('Estimated compute units:', stats.estimatedComputeUnits)
```

## Compliance Proofs: Privacy + Regulation

Traditional privacy is binary: either everything is hidden, or nothing is. SIP Protocol introduces **selective disclosure** through viewing keys.

### The Problem

Regulators need visibility. Users need privacy. These seem incompatible.

### The Solution: Viewing Key Proofs

With viewing keys, you can prove things to auditors without revealing underlying data:

```typescript
import { ComplianceProofProvider } from '@sip-protocol/sdk'

const compliance = new ComplianceProofProvider()
await compliance.initialize()

// Prove you CAN decrypt a transaction (without revealing contents)
const viewingKeyProof = await compliance.generateViewingKeyAccessProof({
  viewingKey: myViewingKey,
  transactionHash: '0x...',
  encryptedData: encryptedTx,
  auditorPublicKey: auditorKey,
  timestamp: Date.now() / 1000,
})

// Prove neither party is sanctioned (without revealing addresses)
const sanctionsProof = await compliance.generateSanctionsClearProof({
  senderAddress: '0x...',
  recipientAddress: '0x...',
  senderBlinding: randomBytes(32),
  recipientBlinding: randomBytes(32),
  sanctionsListRoot: currentRoot,
  checkTimestamp: Date.now() / 1000,
  jurisdiction: 'US',
})

// Prove sufficient balance (without revealing exact amount)
const balanceProof = await compliance.generateBalanceAttestationProof({
  balance: BigInt('250000000000'),  // $250K
  minimumRequired: BigInt('100000000000'),  // $100K
  blindingFactor: randomBytes(32),
  assetId: 'USDC',
  accountCommitment: '0x...',
  attestationTime: Date.now() / 1000,
})

// Share proofs with auditor (no actual data revealed)
await sendToAuditor([viewingKeyProof, sanctionsProof, balanceProof])
```

## Noir in the Privacy Aggregator

Noir isn't our only privacy backend. SIP Protocol is a **privacy aggregator** — like OpenRouter for LLMs, but for privacy:

```
┌─────────────────────────────────────────────────────────────────────┐
│  SIP PROTOCOL — PRIVACY AGGREGATOR                                   │
├─────────────────────────────────────────────────────────────────────┤
│  TRANSACTION PRIVACY          │  COMPUTE PRIVACY                    │
│  ├─ SIP Native (stealth)      │  ├─ MagicBlock (TEE)               │
│  ├─ PrivacyCash (pools)       │  ├─ Arcium (MPC)                   │
│  └─ ShadowWire (ZK mixer)     │  └─ Inco (FHE)                     │
├─────────────────────────────────────────────────────────────────────┤
│  PROOF SYSTEM — NOIR ZK                                             │
│  • Validity proofs (ECDSA verification in ZK)                       │
│  • Funding proofs (balance verification)                            │
│  • Fulfillment proofs (execution verification)                      │
│  • Compliance proofs (selective disclosure)                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Why compose backends?**

Different privacy technologies excel at different things:

| Backend | Best For | Trade-off |
|---------|----------|-----------|
| **Noir (ZK)** | Validity proofs, compliance | Prover-side computation |
| **Arcium (MPC)** | Multi-party computation | Requires network of parties |
| **Inco (FHE)** | Computing on encrypted data | Higher latency |
| **MagicBlock (TEE)** | Hardware-level isolation | Hardware dependency |

By composing them, we can use the right tool for each job while presenting a unified API to developers.

## Performance Benchmarks

Our Noir integration meets production targets:

```
================================================================================
NOIR BENCHMARK SUMMARY
================================================================================
WASM Available: true
Initialization Time: 10.45ms

Circuit Constraints:
  - Funding:     972 ACIR opcodes
  - Validity:    1,113 ACIR opcodes
  - Fulfillment: 1,691 ACIR opcodes

Performance Targets:
  - Funding proof:     <5000ms (actual: ~1200ms)
  - Validity proof:    <10000ms (actual: ~3500ms)
  - Fulfillment proof: <15000ms (actual: ~5000ms)
  - Verification:      <100ms (actual: ~10ms)
  - Memory:            <1024MB (actual: ~265MB)
================================================================================
```

## Test Coverage

We maintain comprehensive test coverage across the Noir stack:

| Component | Tests | Coverage |
|-----------|-------|----------|
| Noir Circuits | 19 | All constraint paths |
| NoirProofProvider | 23 | Init, generate, verify |
| BrowserNoirProvider | 30 | Browser compat, WASM |
| Benchmarks | 14 | Performance targets |
| **Total** | **86** | Full stack |

Run the tests yourself:

```bash
# Circuit tests
cd circuits/funding_proof && nargo test
cd circuits/validity_proof && nargo test
cd circuits/fulfillment_proof && nargo test

# SDK tests
pnpm test -- --run tests/proofs/noir-provider.test.ts
pnpm test -- --run tests/proofs/browser-provider.test.ts
```

## Try It Yourself

Clone and run the demo:

```bash
git clone https://github.com/sip-protocol/sip-protocol
cd examples/noir-solana-demo
npm install
npm run demo
```

Output:
```
╔════════════════════════════════════════════════════════════╗
║        SIP Protocol: Noir on Solana Demo                  ║
║        Production ZK Proofs for Privacy                   ║
╚════════════════════════════════════════════════════════════╝

Demo 1: Funding Proof (Prove Balance >= Minimum)
═══════════════════════════════════════════════════════════
  Proof type: funding
  Proof size: 256 bytes
  Generation time: 1,234ms
  Proof valid: YES
...
```

## Conclusion

Noir makes ZK proofs accessible to TypeScript developers. Our implementation demonstrates:

1. **Real circuits** — Three production circuits with verified constraint counts
2. **Browser support** — WASM + Web Workers for client-side proving
3. **Compliance** — Viewing key proofs bridge privacy and regulation
4. **Composition** — Noir as part of a multi-backend privacy standard

The code is open source. The SDK is published. Privacy is a feature, not a product.

---

*Built with Noir 1.0.0-beta.18 | Part of the [SIP Protocol](https://sip-protocol.org) ecosystem | [GitHub](https://github.com/sip-protocol/sip-protocol)*
