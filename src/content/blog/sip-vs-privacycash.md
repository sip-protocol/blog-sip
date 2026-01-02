---
title: 'SIP vs Pool Mixing: The Cryptographic Difference'
description: 'Pedersen commitments vs pool mixing: why math-based privacy beats crowd-based anonymity. Comparing SIP, Tornado Cash, and Privacy Cash.'
pubDate: 'Jan 05 2025'
updatedDate: 'Jan 02 2026'
category: 'technical'
tags: ['privacy', 'pedersen-commitments', 'tornado-cash', 'privacy-cash', 'cryptography', 'comparison']
draft: false
author: 'SIP Protocol Team'
tldr: 'Pool mixing (Tornado Cash, Privacy Cash) hides you in a crowd. Pedersen commitments hide amounts mathematically. Both have evolved - but the fundamental approaches differ in how privacy is achieved and what guarantees they provide.'
keyTakeaways:
  - 'Pool mixing privacy depends on anonymity set size; cryptographic privacy is mathematically guaranteed'
  - 'Tornado Nova and Privacy Cash now support arbitrary amounts - but still rely on pool anonymity'
  - 'Both SIP and Privacy Cash offer compliance paths (viewing keys vs selective disclosure)'
  - 'SIP is chain-agnostic; pool mixers are typically single-chain'
  - 'Pedersen commitments enable homomorphic verification - proving sums without revealing amounts'
targetAudience: 'Blockchain developers, security researchers, crypto users comparing privacy solutions'
prerequisites:
  - 'Basic understanding of blockchain transactions'
  - 'Familiarity with privacy concepts'
---

Privacy in Web3 has evolved significantly. Tornado Cash pioneered pool mixing, Privacy Cash brought it to Solana with compliance features, and SIP Protocol introduced Pedersen commitment-based privacy. Let's examine how these approaches actually differ.

## Understanding Pool Mixing (Tornado Cash & Privacy Cash)

Pool mixing protocols break the on-chain link between deposits and withdrawals using zero-knowledge proofs and Merkle trees.

### How It Works

1. User deposits tokens into a privacy pool
2. A commitment is added to a Merkle tree
3. User withdraws to a new address using a ZK proof
4. The proof shows "I deposited" without revealing which deposit

Your privacy comes from the **anonymity set** - the crowd of depositors you're hiding in.

### Evolution: Not Just Fixed Amounts Anymore

**Classic Tornado Cash** still uses fixed denominations (0.1, 1, 10, 100 ETH). But the ecosystem has evolved:

**Tornado Cash Nova** (2021) introduced:
- Arbitrary deposit amounts via UTXO model
- Shielded transfers within the pool
- Currently limited to 1 ETH max (beta)

**Privacy Cash** on Solana (August 2025):
- Arbitrary amounts from launch
- Selective disclosure for authorized parties
- AML/KYT integration hooks
- Auditor keys for compliance
- Over 680K SOL processed, 11.7K+ wallets

Pool mixing has matured. The "fixed amounts only" criticism applies to classic Tornado, not modern implementations.

## The SIP Approach: Pedersen Commitments

SIP Protocol takes a fundamentally different approach. Instead of hiding in a crowd, we hide amounts *mathematically*.

### How It Works

```
Commitment = value × G + blinding × H
```

This commitment is:
- **Hiding**: No one can extract the value from the commitment
- **Binding**: You can't change the value after committing
- **Homomorphic**: You can verify `Commitment(A) + Commitment(B) = Commitment(A+B)` without knowing A or B

### Stealth Addresses

Each recipient gets a unique one-time address. Your transaction can't be linked to previous ones - not because you're in a pool, but because the address itself is cryptographically fresh.

```typescript
// Generate stealth address for recipient
const stealth = sip.generateStealthAddress(recipientPublicKey)
// Sender sends to stealth.address
// Only recipient can derive the private key to spend
```

### Viewing Keys for Compliance

Like Privacy Cash's selective disclosure, SIP includes viewing keys:

```typescript
const viewingKey = sip.generateViewingKey({
  scope: 'transaction',
  recipient: 'auditor-public-key'
})
```

The auditor can verify your transactions; the public cannot.

## The Real Differences

Let's be honest about what actually differentiates these approaches:

### 1. Privacy Source

| Approach | Privacy Comes From |
|----------|-------------------|
| Pool Mixing | Anonymity set (the crowd) |
| Pedersen | Mathematical hiding (cryptography) |

Pool mixing: Your privacy depends on pool participation. Early pools or unusual amounts have weaker guarantees.

Pedersen: Privacy is cryptographically guaranteed regardless of how many others use the system. 1.5 SOL and 1,000,000 SOL have identical privacy properties.

### 2. Homomorphic Properties

Pedersen commitments are additively homomorphic:

```
Commit(5) + Commit(3) = Commit(8)
```

This enables:
- Proving transaction balances without revealing amounts
- Range proofs (amount is positive, less than X)
- Aggregate proofs across multiple transactions

Pool mixing can't do this - you prove membership, not amount properties.

### 3. Chain Agnosticism

| Protocol | Chain Support |
|----------|--------------|
| Tornado Cash | Ethereum + EVM chains |
| Privacy Cash | Solana only |
| SIP Protocol | Chain-agnostic (Ethereum, Solana, NEAR, Bitcoin, Cosmos, Move chains) |

SIP's privacy layer sits above the blockchain - same primitives work everywhere.

### 4. Compliance Approaches

Both have compliance mechanisms now:

| Protocol | Compliance Mechanism |
|----------|---------------------|
| Privacy Cash | Selective disclosure, auditor keys, AML/KYT hooks |
| SIP Protocol | Viewing keys with scoped disclosure |

The implementations differ, but both acknowledge that "hide everything forever" isn't viable for institutional adoption.

## Technical Comparison

| Feature | Pool Mixing (Modern) | Pedersen (SIP) |
|---------|---------------------|----------------|
| Amount flexibility | Arbitrary (Nova/PrivacyCash) | Arbitrary |
| Privacy source | Anonymity set | Cryptographic |
| Compliance | Selective disclosure | Viewing keys |
| Homomorphic proofs | No | Yes |
| Chain support | Single chain | Chain-agnostic |
| Pool dependency | Yes - privacy scales with usage | No - constant guarantees |
| Stealth addresses | No | Yes (EIP-5564) |

## When to Use What

**Pool Mixing (Privacy Cash, Tornado)** is great when:
- You need simple deposit/withdraw privacy
- You're on a single chain (Solana or Ethereum)
- The pool has sufficient participation
- You want battle-tested, simpler cryptography

**Pedersen Commitments (SIP)** excels when:
- You need provable amount properties (range proofs, balance verification)
- You're building cross-chain applications
- You need privacy guarantees independent of adoption
- You want stealth addresses for recipient privacy

## Conclusion

Pool mixing and Pedersen commitments solve privacy differently. Pool mixing has evolved beyond fixed denominations, and protocols like Privacy Cash have added compliance features. The "Tornado bad, Pedersen good" narrative oversimplifies reality.

The real question is: **Do you want crowd-based anonymity or mathematical hiding?**

SIP Protocol chose mathematical hiding because:
1. Privacy guarantees don't depend on pool size
2. Homomorphic properties enable richer proofs
3. Chain-agnostic design fits our vision of universal privacy

Both approaches have their place. We're building the cryptographic primitive layer that makes privacy a default, not an afterthought.

---

*Next up: Deep-dive into Pedersen commitment mathematics and range proofs.*
