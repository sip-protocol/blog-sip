---
title: 'MPC and Confidential Computing: How Arcium Works'
description: 'How Arcium uses Multi-Party Computation (MPC) for private DeFi on Solana. Covers MXE clusters, C-SPL tokens, and confidential computing.'
pubDate: 'Jan 12 2026'
category: 'technical'
tags: ['privacy', 'solana', 'arcium', 'mpc', 'confidential-computing', 'c-spl', 'defi']
draft: false
author: 'SIP Protocol Team'
tldr: 'Arcium uses Multi-Party Computation (MPC) across distributed nodes to compute over encrypted data. No single node sees the plaintext. C-SPL tokens enable confidential balances while keeping recipients public.'
keyTakeaways:
  - 'MPC distributes trust across multiple nodes—no single point can see your data'
  - 'Arcium MXE clusters process encrypted computations in ~3 seconds'
  - 'C-SPL tokens hide amounts but keep recipients public (different from stealth addresses)'
  - 'MPC enables programmable privacy—not just transfers, but DeFi operations'
  - 'The Arcis framework integrates MPC into Solana programs'
targetAudience: 'DeFi developers, cryptography enthusiasts, Solana builders'
prerequisites:
  - 'Basic understanding of encryption'
  - 'Familiarity with Solana programs'
relatedPosts:
  - 'solana-privacy-landscape-2026'
  - 'building-arcium-mpc-application'
---

Privacy in DeFi faces a fundamental challenge: how do you compute over data without revealing it? Pool mixing hides you in a crowd. Stealth addresses create unlinkable recipients. But what if you want to execute a private swap, a confidential loan, or a shielded governance vote?

Enter Multi-Party Computation (MPC)—a cryptographic technique that lets multiple parties compute a function over their inputs while keeping those inputs private. Arcium brings this technology to Solana, enabling programmable privacy for DeFi operations.

## What is Multi-Party Computation?

Imagine three friends want to calculate their average salary without revealing their individual incomes. With MPC, each person can contribute their encrypted salary to a computation that outputs only the average—no one learns anyone else's actual number.

This isn't magic. It's mathematics.

### The Core Idea: Secret Sharing

MPC typically starts with **secret sharing**—splitting a secret into pieces such that:
- No single piece reveals anything about the original secret
- Combining enough pieces reconstructs the secret

The most common scheme is **Shamir's Secret Sharing**:

```
Secret: S = 1,000,000 (your balance)
Split into 3 shares: [Share₁, Share₂, Share₃]
Any 2 shares can reconstruct S
Any 1 share reveals nothing about S
```

Think of it like a treasure map torn into three pieces. One piece tells you nothing. Two pieces show the location.

### Computing Over Encrypted Data

Here's where MPC gets interesting. With properly designed protocols, parties holding secret shares can perform computations—addition, multiplication, comparisons—on the shared values without reconstructing them.

```
Alice holds: Share_A of amount₁
Bob holds: Share_B of amount₁
Carol holds: Share_C of amount₁

They can compute Share_A' + Share_B' + Share_C' = Share of (amount₁ + amount₂)
Without ever reconstructing amount₁ or amount₂
```

The computation happens in the "encrypted domain." Only the final result is revealed (if desired).

### No Single Point of Trust

This is the key differentiator from other privacy approaches:

| Approach | Trust Model |
|----------|------------|
| TEE (Trusted Execution Environment) | Trust the hardware manufacturer |
| Centralized Service | Trust the service operator |
| MPC | Trust is distributed—no single party sees data |

With MPC, even if some participants are malicious or compromised, your data remains private (up to a threshold).

### The MPC Round Model

MPC protocols proceed in **rounds**. Each round, participants:
1. Perform local computations on their shares
2. Exchange encrypted messages with other participants
3. Update their local state based on received messages

More complex operations require more rounds. A simple addition might be 1 round. A comparison might be 10+ rounds. This is why MPC has latency—you're coordinating across multiple parties.

## Arcium Architecture

Arcium (formerly Elusiv) has built a production MPC infrastructure on Solana. Let's examine how it works.

### MXE: Multi-party eXecution Environment

The core of Arcium is the **MXE cluster**—a network of nodes that collectively execute MPC computations.

```
┌─────────────────────────────────────────────────────────────┐
│  USER APPLICATION                                           │
│  └─ Encrypts data, sends to MXE                            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  MXE CLUSTER (Multi-party eXecution Environment)           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Node 1  │  │ Node 2  │  │ Node 3  │  │ Node 4  │       │
│  │ Share₁  │  │ Share₂  │  │ Share₃  │  │ Share₄  │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                    MPC Rounds                               │
│                    (~3 seconds)                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  SOLANA BLOCKCHAIN                                          │
│  └─ Receives final result, settles on-chain                │
└─────────────────────────────────────────────────────────────┘
```

Key properties:
- **Threshold Security**: 3-of-4, 4-of-6, or configurable thresholds
- **Geographic Distribution**: Nodes run by different operators in different jurisdictions
- **Accountable**: Node operators stake tokens, can be slashed for misbehavior

### The Arcis Framework

Arcis is Arcium's development framework for building MPC applications on Solana. It provides:

1. **Encryption Utilities**: Client-side encryption before sending to MXE
2. **Circuit Definitions**: Define the computation logic
3. **On-chain Programs**: Solana programs that interact with MXE results
4. **Verification**: Prove MPC was executed correctly

```rust
// Simplified Arcis program structure
#[arcis::program]
pub mod confidential_swap {
    // Define encrypted inputs
    #[encrypted]
    pub struct SwapInput {
        amount_in: EncryptedU64,
        min_amount_out: EncryptedU64,
    }

    // MPC computation
    #[mpc_compute]
    pub fn execute_swap(input: SwapInput, pool_state: PoolState) -> SwapOutput {
        // This runs inside MXE
        // No single node sees the plaintext values
    }
}
```

### C-SPL: Confidential SPL Tokens

Arcium's flagship application is **C-SPL**—a confidential token standard for Solana.

Standard SPL tokens expose everything:
- Your balance: visible
- Transfer amounts: visible
- Transaction history: fully traceable

C-SPL tokens flip this:
- Your balance: **encrypted on-chain**
- Transfer amounts: **hidden via MPC**
- Recipients: still visible (this is a design choice)

```
Standard SPL:    [Alice: 1000 SOL] → [Bob: 500 SOL]  // All visible
C-SPL:           [Alice: ████████] → [Bob: ████████]  // Amounts hidden
```

## Technical Deep-Dive

Let's trace a confidential transfer from user to on-chain settlement.

### Step 1: Client-Side Encryption

The user encrypts their transfer details using keys derived from the MXE cluster's public parameters:

```typescript
// Conceptual Arcium confidential transfer
import { ArciumClient, Encryption } from '@arcium/sdk'

const client = new ArciumClient({
  network: 'mainnet',
  mxeCluster: 'cluster-1'
})

// Get MXE public parameters for encryption
const mxeParams = await client.getMXEPublicParams()

// Encrypt the transfer amount
// Uses threshold encryption - requires k-of-n MXE nodes to decrypt
const encryptedAmount = Encryption.thresholdEncrypt(
  1_000_000_000n, // 1 SOL in lamports
  mxeParams
)

// Create the confidential transfer instruction
const transferIx = await client.createConfidentialTransfer({
  recipient: recipientPubkey,
  encryptedAmount,
  tokenMint: SOL_MINT
})
```

The encryption ensures no single MXE node can see the plaintext amount.

### Step 2: MPC Computation Rounds

When the transaction reaches Arcium, the MXE cluster kicks into action:

```
Round 1: Input Distribution
├─ Node 1 receives encrypted_amount.share_1
├─ Node 2 receives encrypted_amount.share_2
├─ Node 3 receives encrypted_amount.share_3
└─ Node 4 receives encrypted_amount.share_4

Round 2-5: Balance Verification
├─ Nodes compute: sender_balance >= transfer_amount
├─ Uses secure comparison protocol
└─ Outputs: {valid: true/false}

Round 6-8: Balance Updates
├─ Compute: new_sender_balance = sender_balance - amount
├─ Compute: new_recipient_balance = recipient_balance + amount
└─ Re-encrypt new balances

Round 9: Output Generation
├─ Nodes produce commitment to new state
└─ Generate proof of correct execution
```

This entire process takes approximately **3 seconds**—orders of magnitude faster than ZK proof generation, but slower than a standard transaction.

### Step 3: On-chain Settlement

The MXE cluster produces:
1. **Encrypted state updates**: New encrypted balances
2. **Validity proof**: Cryptographic proof the MPC was executed correctly
3. **Settlement transaction**: Solana instruction to update on-chain state

```
┌─────────────────────────────────────────────────────────────┐
│  SOLANA TRANSACTION                                         │
│  ├─ Instruction: UpdateConfidentialBalance                 │
│  ├─ Data: [new_encrypted_balance_alice, new_encrypted_     │
│  │         balance_bob, mpc_validity_proof]                │
│  └─ Signers: [MXE_cluster_signature]                       │
└─────────────────────────────────────────────────────────────┘
```

The Solana program verifies the MXE cluster signature and updates the encrypted balances.

### MPC vs TEE: Key Differences

Arcium chose MPC over Trusted Execution Environments (TEEs) like Intel SGX or ARM TrustZone. Here's why:

| Aspect | TEE | MPC |
|--------|-----|-----|
| Trust | Hardware manufacturer (Intel/AMD/ARM) | Distributed across nodes |
| Attack surface | Side-channel attacks, firmware bugs | Protocol-level (mathematical) |
| Transparency | Closed hardware, attestation-based | Open protocol, verifiable |
| Performance | Fast (single machine) | Slower (network rounds) |
| Decentralization | Single point of failure | True distribution |

TEEs have had notable vulnerabilities (Spectre, Meltdown, SGX-Step). MPC's security is based on mathematical assumptions, not hardware correctness.

## C-SPL Token Standard: Deep Dive

Let's examine what C-SPL actually hides and exposes.

### What's Hidden

- **Balances**: Your token balance is stored encrypted on-chain
- **Transfer amounts**: The amount you send is never revealed
- **Historical balances**: Past balance states remain confidential

### What's Public

- **Recipients**: Transfer destinations are visible (this enables compliance)
- **Transaction existence**: The fact that a transfer occurred is on-chain
- **Token type**: Which token is being transferred

This is a deliberate design trade-off. Unlike stealth addresses (which hide recipients), C-SPL prioritizes amount privacy while maintaining recipient transparency.

### Transfer Mechanics

A C-SPL transfer involves:

```typescript
// C-SPL Transfer Flow
async function cSplTransfer(
  recipient: PublicKey,
  amount: bigint,
  client: ArciumClient
) {
  // 1. Fetch your current encrypted balance
  const myEncryptedBalance = await client.getConfidentialBalance(myWallet)

  // 2. Create transfer proof request
  const transferRequest = {
    sender: myWallet,
    recipient,
    encryptedAmount: client.encrypt(amount),
    currentBalance: myEncryptedBalance
  }

  // 3. Submit to MXE for processing
  const mxeResult = await client.submitToMXE(transferRequest)

  // 4. MXE returns settlement transaction
  const settlementTx = mxeResult.settlementTransaction

  // 5. User signs and submits to Solana
  const signature = await wallet.signAndSendTransaction(settlementTx)

  return signature
}
```

### Confidential DeFi Operations

C-SPL enables more than transfers. Consider a confidential swap:

```typescript
// Confidential AMM Swap (conceptual)
const swapIx = await client.createConfidentialSwap({
  poolId: 'SOL-USDC',
  inputToken: 'SOL',
  outputToken: 'USDC',
  encryptedInputAmount: client.encrypt(1_000_000_000n),
  encryptedMinOutput: client.encrypt(95_000_000n), // Min USDC out
})

// MXE computes:
// 1. Verify sender has sufficient balance
// 2. Calculate output amount from AMM curve
// 3. Verify output >= minOutput (comparison in MPC)
// 4. Update encrypted balances
```

The AMM price is public (it's on-chain), but your trade size remains hidden. This prevents front-running and sandwich attacks.

## Privacy Analysis

Let's be precise about what Arcium does and doesn't provide.

### Threat Model

**Protected against:**
- Balance surveillance (your holdings are hidden)
- Transfer amount analysis (amounts are encrypted)
- Single-node compromise (threshold security)
- Front-running/sandwich attacks (trade sizes hidden)

**Not protected against:**
- Recipient analysis (recipients are public)
- Transaction graph analysis (sender → recipient links visible)
- Timing correlation (when you transact is visible)
- MXE cluster collusion (if threshold nodes collude)

### Trust Assumptions

For security, you trust that:
1. At least `t` of `n` MXE nodes are honest (threshold assumption)
2. The MPC protocol is implemented correctly
3. Client-side encryption is performed correctly
4. Solana smart contracts are correct

If fewer than `t` nodes are honest, they could potentially reconstruct secrets. Arcium mitigates this through:
- Economic incentives (staking/slashing)
- Diverse node operators
- Geographic distribution

### Comparison to Other Privacy Approaches

| Feature | Pool Mixing | Stealth Addresses | C-SPL (MPC) |
|---------|-------------|-------------------|-------------|
| Amount hidden | Partially | Yes | Yes |
| Recipient hidden | Yes | Yes | No |
| Sender hidden | Yes | No | No |
| DeFi operations | No | Limited | Yes |
| Latency | Variable | Fast | ~3 seconds |
| Trust model | Anonymity set | Cryptographic | Distributed |

## Use Cases

### Private DeFi Trading

Hide your trade sizes from MEV bots and competitors:

```typescript
// Place a large order without revealing size
const order = await arcium.createConfidentialLimitOrder({
  market: 'SOL-PERP',
  side: 'buy',
  encryptedSize: encrypt(100_000n), // Size hidden
  price: 150_00n, // Price can be public for order matching
})
```

### Confidential Lending

Borrow without revealing your collateral position:

```typescript
// Deposit collateral and borrow with hidden amounts
const depositTx = await arcium.depositCollateral({
  encryptedAmount: encrypt(1000_000_000_000n), // 1000 SOL
})

const borrowTx = await arcium.borrow({
  asset: 'USDC',
  encryptedAmount: encrypt(50_000_000_000n), // Hidden borrow amount
})

// Protocol can verify collateral ratio via MPC without seeing values
```

### Private Governance Voting

Vote without revealing your token holdings:

```typescript
// Vote with hidden voting power
const vote = await arcium.castConfidentialVote({
  proposal: proposalId,
  choice: 'FOR',
  // Your voting power (based on token balance) is verified but not revealed
})
```

### Confidential Payroll

Pay employees without revealing individual salaries:

```typescript
// Batch confidential payments
const payroll = await arcium.batchConfidentialTransfer([
  { recipient: employee1, encryptedAmount: encrypt(salary1) },
  { recipient: employee2, encryptedAmount: encrypt(salary2) },
  { recipient: employee3, encryptedAmount: encrypt(salary3) },
])
// Total may be visible, individual amounts are not
```

## Trade-offs and Considerations

### Pros

1. **No Single Point of Trust**: Unlike TEEs, no single party can compromise your privacy
2. **Programmable Privacy**: Support complex DeFi operations, not just transfers
3. **Verifiable Execution**: Proofs that MPC was executed correctly
4. **Compliance-Friendly**: Recipients are visible (regulators can see flow)
5. **No Trusted Setup**: Unlike some ZK systems, no ceremony required

### Cons

1. **Latency**: ~3 seconds per operation vs. instant for standard transactions
2. **Complexity**: More moving parts than simple encryption
3. **Cost**: Multiple nodes = higher compute costs
4. **Threshold Trust**: Security degrades if many nodes are compromised
5. **Recipient Visibility**: Not full anonymity (by design)

### When to Use MPC (Arcium)

**Good fit:**
- DeFi operations where you need computation over private data
- Applications where recipient transparency is acceptable
- Use cases requiring programmable privacy logic
- When you want distributed trust, not hardware trust

**Not ideal for:**
- Maximum anonymity (recipients visible)
- Latency-sensitive applications (3s overhead)
- Simple transfers where other solutions suffice
- Cost-sensitive applications

## Conclusion

Arcium represents a different philosophy in blockchain privacy. Instead of hiding in a crowd (pool mixing) or using one-time addresses (stealth), MPC enables computation over encrypted data with distributed trust.

The key insight: **privacy isn't just about hiding data—it's about computing privately.** When you need a private swap, a confidential loan, or a shielded governance vote, you need more than encryption. You need private computation.

C-SPL tokens bring this to Solana with a practical trade-off: hide amounts but keep recipients visible. This enables compliance while protecting the financial details that matter most.

For DeFi developers, Arcium opens new possibilities:
- MEV-resistant trading with hidden order sizes
- Confidential lending without revealing positions
- Private voting that still counts correctly

The ~3 second latency is a real cost, but for many use cases, that's an acceptable trade-off for genuine computational privacy.

MPC isn't the only path to privacy. Stealth addresses, Pedersen commitments, and ZK proofs each have their place. Understanding when to use which tool—that's the art of privacy engineering.

---

*Next in this series: Building your first MPC application with Arcium's Arcis framework.*
