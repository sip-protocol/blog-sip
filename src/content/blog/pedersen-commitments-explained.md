---
title: 'Pedersen Commitments: The Math Behind Amount Hiding'
description: 'How Pedersen commitments hide transaction amounts while enabling verification. Covers homomorphic properties and range proofs.'
pubDate: 'Jan 12 2026'
category: 'technical'
tags: ['cryptography', 'pedersen-commitments', 'privacy', 'zero-knowledge', 'homomorphic', 'mathematics']
draft: false
author: 'SIP Protocol Team'
tldr: 'Pedersen commitments hide values using C = v*G + r*H. The magic: they are additively homomorphic, meaning you can verify C(a) + C(b) = C(a+b) without knowing a or b. This enables balance verification without revealing amounts.'
keyTakeaways:
  - 'Pedersen commitments are hiding (can''t extract value) AND binding (can''t change value)'
  - 'The formula C = v*G + r*H uses elliptic curve math'
  - 'Homomorphic property enables verifying sums without revealing individual amounts'
  - 'Range proofs (Bulletproofs) ensure amounts are positive without revealing them'
  - 'This is the cryptographic foundation of amount privacy in SIP'
targetAudience: 'Cryptography students, developers building privacy features, security researchers'
prerequisites:
  - 'Basic algebra'
  - 'Conceptual understanding of elliptic curves (helpful but not required)'
relatedPosts:
  - 'sip-vs-privacycash'
  - 'zero-knowledge-proofs-solana'
  - 'getting-started-sip-sdk'
---

Imagine you need to prove you have enough money to make a purchase, but you do not want the seller to know your actual balance. Traditional finance solves this with trusted intermediaries — your bank vouches for you. But in Web3, we need mathematical guarantees without trusted third parties.

Enter Pedersen commitments: the cryptographic primitive that lets you hide a value while still proving things about it.

This is Part 6 of our Privacy Education Series. We will go deep on the mathematics, but do not worry — we will build up from first principles.

## The Problem: Verifiable Secret Keeping

Before we dive into Pedersen commitments, let us understand why simpler approaches fail.

### Why Simple Hashing Is Not Enough

Your first instinct might be: "Just hash the value!" If I want to commit to 100 tokens, I compute `Hash(100)` and share the hash. Later, I reveal 100, and you verify the hash matches.

```
Commit:  H = SHA256(100) = 0x8c14e...
Reveal:  "The value is 100"
Verify:  SHA256(100) == 0x8c14e... ✓
```

This is **binding** — once I commit, I cannot open it to a different value. But it is NOT **hiding** for small values. An attacker can simply try all possible values:

```
SHA256(0)   = 0x5fed...  (no match)
SHA256(1)   = 0x4bf5...  (no match)
...
SHA256(100) = 0x8c14e... (match!)  ← Found it!
```

For transaction amounts (typically 0 to a few billion), brute force is trivial.

### What We Actually Need

A good commitment scheme must be:

1. **Hiding**: Looking at the commitment reveals nothing about the value
2. **Binding**: Once committed, you cannot open it to a different value

Hash commitments are binding but not hiding. We need both.

### A Visual Analogy: The Sealed Envelope

Think of a Pedersen commitment like a sealed envelope with special properties:

1. **You write your value on a card and add random noise** (the blinding factor)
2. **You seal it in a tamper-evident envelope** (the commitment)
3. **Anyone can see the envelope, but cannot see inside** (hiding)
4. **Opening the envelope proves what you wrote** (binding)
5. **Envelopes can be mathematically combined** (homomorphism)

The magic is in step 5: if Alice and Bob each seal their values, a third party can verify their combined total by examining only the combined envelope — without ever opening either individual envelope.

## Pedersen Commitment Basics

Pedersen commitments solve this using elliptic curve cryptography. The formula is deceptively simple:

```
C = v*G + r*H
```

Where:
- **v** = the value you are committing to (e.g., 100 tokens)
- **r** = a random "blinding factor" (keeps the value hidden)
- **G** = a generator point on the elliptic curve (publicly known)
- **H** = an independent generator point (publicly known, but nobody knows its discrete log relative to G)
- **C** = the resulting commitment (a point on the curve)

Let us unpack each component.

### Generator Points G and H

In elliptic curve cryptography, a "generator point" is a special point on the curve. When you multiply it by a number, you get another point on the curve. The magic is that this multiplication is easy to compute forward but practically impossible to reverse.

**G (The Base Generator)**: This is the standard generator for the curve. For secp256k1 (used in Bitcoin, Ethereum, and SIP), G is a fixed, well-known point.

**H (The Independent Generator)**: This is a second generator with a critical property: **nobody knows the discrete logarithm of H with respect to G**. In other words, nobody knows a value `x` such that `H = x*G`.

Why does this matter? If someone knew `x`, they could break the binding property. We will see why shortly.

### The Discrete Log Problem

The security of Pedersen commitments rests on the **discrete logarithm problem**. Given two points P and Q on an elliptic curve, if Q = k*P for some integer k, finding k is computationally infeasible.

This is why you cannot work backwards from a commitment:

```
Given: C = v*G + r*H
Find:  v and r

This requires solving TWO discrete log problems simultaneously.
With a 256-bit curve, there are more possible solutions than atoms in the universe.
```

### Why It Is Hiding (Information-Theoretic)

The blinding factor `r` is what makes the commitment hiding. For any commitment C, there exist valid (v, r) pairs for EVERY possible value:

```
C = 100*G + r1*H    ← Opens to 100
C = 200*G + r2*H    ← Also valid (with different r)
C = 999*G + r3*H    ← Also valid
```

Without knowing r, you cannot determine which value was committed. This is called **perfect hiding** or **information-theoretic hiding** — even with unlimited computing power, the value cannot be determined from the commitment alone.

### Why It Is Binding (Computational)

The commitment is binding because opening it to two different values would require finding the discrete log relationship between G and H.

Suppose I commit to 100 but later want to claim it was 200:

```
Original:  C = 100*G + r1*H
Fake:      C = 200*G + r2*H

For both to equal C:
100*G + r1*H = 200*G + r2*H
(r1 - r2)*H = 100*G
H = 100/(r1 - r2) * G
```

This gives us the discrete log of H relative to G — something assumed to be impossible to compute. Therefore, binding is **computationally secure** (breaks only if discrete log is solved).

## Step-by-Step Example

Let us work through a concrete example. We will use simplified numbers for clarity (real implementations use 256-bit values).

### Step 1: Choose Your Value

You want to commit to **v = 100** tokens.

### Step 2: Generate Random Blinding

Generate a random blinding factor **r**. This should be cryptographically random and kept secret:

```
r = 0x7a3f...b821  (a random 256-bit number)
```

### Step 3: Compute the Commitment

```
C = v*G + r*H
C = 100*G + r*H
```

The result C is a point on the elliptic curve, typically represented as a 33-byte compressed point:

```
C = 0x02abc123...def456  (33 bytes, compressed)
```

### Step 4: Share the Commitment

You publish C. Everyone can see it, but they cannot determine that it commits to 100.

### Step 5: Later — Open the Commitment

When ready to reveal, you share:
- The value: v = 100
- The blinding factor: r = 0x7a3f...b821

### Step 6: Verification

The verifier recomputes:

```
C' = 100*G + r*H
```

If C' equals C, the commitment is valid. The value was indeed 100.

```typescript
// Verification in code
const recomputed = G.multiply(100n).add(H.multiply(r))
const isValid = recomputed.equals(C)  // true
```

## Homomorphic Properties (THE KEY FEATURE)

Here is where Pedersen commitments become magical. They are **additively homomorphic**, meaning you can add commitments without knowing the underlying values.

### Additive Homomorphism

If you have two commitments:

```
C1 = v1*G + r1*H    (commits to v1)
C2 = v2*G + r2*H    (commits to v2)
```

Adding the commitment points gives:

```
C1 + C2 = (v1*G + r1*H) + (v2*G + r2*H)
        = (v1 + v2)*G + (r1 + r2)*H
        = C(v1 + v2, r1 + r2)
```

**The sum of commitments commits to the sum of values!**

This is not just mathematical elegance — it is the foundation of privacy-preserving verification.

### Why This Matters for Balance Verification

Consider a transaction with inputs and outputs:

```
Inputs:   [C_in1, C_in2]     (committed input amounts)
Outputs:  [C_out1, C_out2]   (committed output amounts)
Fee:      f                  (public)
```

To verify the transaction balances without seeing amounts:

```
Sum(inputs) = Sum(outputs) + fee
C_in1 + C_in2 = C_out1 + C_out2 + f*G
```

If this equation holds (comparing curve points), the transaction balances — even though nobody knows the individual amounts.

### Proving Sums Without Revealing Amounts

Real-world application: A company wants to prove their total payroll equals $1M for tax purposes, without revealing individual salaries.

```
Salary commitments:  [C1, C2, C3, ..., C100]
Total commitment:    C_total = C1 + C2 + ... + C100

Verifier checks:     C_total opens to $1,000,000
```

The verifier learns ONLY that the sum is $1M. Individual salaries remain hidden.

### Code Example: Homomorphic Verification

Here is how this works in practice using the SIP Protocol SDK:

```typescript
import {
  commit,
  addCommitments,
  addBlindings,
  verifyOpening
} from '@sip-protocol/sdk'

// Alice commits to 500 tokens
const alice = commit(500n)
// alice.commitment = "0x02abc..."
// alice.blinding = "0x7a3f..."

// Bob commits to 300 tokens
const bob = commit(300n)
// bob.commitment = "0x039de..."
// bob.blinding = "0x4c81..."

// Add commitments (without knowing individual values!)
const sumCommitment = addCommitments(
  alice.commitment,
  bob.commitment
)
// sumCommitment.commitment = "0x028f1..."

// To verify the sum, we need the combined blinding
const sumBlinding = addBlindings(alice.blinding, bob.blinding)

// Verify: the sum commitment opens to 800
const isValid = verifyOpening(
  sumCommitment.commitment,
  800n,  // 500 + 300
  sumBlinding
)
console.log(isValid)  // true

// But if someone claims it is 900...
const isFake = verifyOpening(
  sumCommitment.commitment,
  900n,
  sumBlinding
)
console.log(isFake)  // false
```

A third party can verify the sum is 800 without ever knowing that Alice had 500 and Bob had 300.

## Range Proofs: The Missing Piece

There is a subtle problem we have not addressed: what if someone commits to a **negative** amount?

### The Problem: Negative Amounts

Recall that Pedersen commitments work in a mathematical group where values "wrap around" at the curve order (a huge number, roughly 2^256).

A commitment to -100 is actually a commitment to `(curve_order - 100)`, which is a valid positive number. This creates an attack vector:

```
Attacker commits to: -100 (appears as large positive number)
Victim commits to:   100

Sum commitment opens to: 0
Attacker gained 100 tokens from nothing!
```

### Range Proofs: Proving 0 <= v < 2^64

A **range proof** proves that a committed value lies within a valid range (typically 0 to 2^64) without revealing the actual value.

The basic idea: decompose the value into bits and prove each bit is 0 or 1.

```
v = b0 + 2*b1 + 4*b2 + ... + 2^63*b63

Each bi is proven to be 0 or 1 using sub-commitments.
```

This proves v is between 0 and 2^64-1 without revealing v.

### Bulletproofs: Efficient Range Proofs

Early range proofs were large (kilobytes per proof). **Bulletproofs**, introduced in 2017, compress this dramatically:

| Approach | Proof Size |
|----------|-----------|
| Naive bit decomposition | ~13 KB |
| Bulletproofs | ~0.7 KB |

Bulletproofs achieve logarithmic proof size through clever polynomial commitments and inner-product arguments. The math is beyond our scope, but the result is practical: range proofs that fit in real transactions.

### In Practice

Most privacy protocols bundle range proofs with commitments:

```typescript
// Conceptual (simplified)
const { commitment, blinding, rangeProof } = commitWithRangeProof(
  amount,
  { min: 0n, max: 2n ** 64n - 1n }
)

// Verifier checks BOTH:
// 1. The commitment opens correctly
// 2. The range proof is valid (amount is positive)
```

## SIP Protocol Implementation

Now let us see how SIP Protocol implements Pedersen commitments. The implementation lives in `packages/sdk/src/commitment.ts` and uses the battle-tested `@noble/curves` library.

### Creating Commitments

```typescript
import { commit, verifyOpening } from '@sip-protocol/sdk'

// Commit to 1000 tokens
const { commitment, blinding } = commit(1000n)

console.log(commitment)  // "0x02a1b2c3..." (33-byte compressed point)
console.log(blinding)    // "0x7f8e9d..." (32-byte secret)

// Later: verify the commitment opens to 1000
const isValid = verifyOpening(commitment, 1000n, blinding)
console.log(isValid)  // true
```

### The Generator H: Nothing Up My Sleeve

How does SIP ensure nobody knows the discrete log of H? Using the **NUMS (Nothing Up My Sleeve)** method:

```typescript
// From commitment.ts (simplified)
const H_DOMAIN = 'SIP-PEDERSEN-GENERATOR-H-v1'

function generateH() {
  let counter = 0

  while (counter < 256) {
    // Hash domain separator with counter
    const input = `${H_DOMAIN}:${counter}`
    const hashBytes = sha256(input)

    // Try to create a valid curve point
    const point = tryCreatePoint(hashBytes)
    if (point && !point.equals(G)) {
      return point  // Found valid H
    }
    counter++
  }
}
```

The H generator is derived deterministically from a public string. Everyone can verify the derivation, and nobody can have chosen it to know its discrete log.

### Homomorphic Operations

```typescript
import {
  commit,
  addCommitments,
  subtractCommitments,
  addBlindings,
  subtractBlindings
} from '@sip-protocol/sdk'

// Create commitments
const c1 = commit(100n)
const c2 = commit(50n)

// Add: C(100) + C(50) = C(150)
const sum = addCommitments(c1.commitment, c2.commitment)
const sumBlinding = addBlindings(c1.blinding, c2.blinding)

// Subtract: C(100) - C(50) = C(50)
const diff = subtractCommitments(c1.commitment, c2.commitment)
const diffBlinding = subtractBlindings(c1.blinding, c2.blinding)

// Verify sum
verifyOpening(sum.commitment, 150n, sumBlinding)  // true

// Verify difference
verifyOpening(diff.commitment, 50n, diffBlinding)  // true
```

### Integration with Shielded Intents

In SIP, Pedersen commitments protect transaction amounts within shielded intents:

```typescript
import { SIP } from '@sip-protocol/sdk'

const sip = new SIP({
  chainId: 'solana:mainnet',
  privacyLevel: 'shielded'
})

// Create a shielded intent
const intent = await sip.createShieldedIntent({
  action: 'transfer',
  amount: 1000n,  // This gets committed, not sent in plaintext
  recipient: stealthAddress,
})

// intent.commitment contains C = 1000*G + r*H
// intent.blindingFactor is kept for later verification
// The blockchain sees the commitment, not 1000
```

## Security Analysis

Let us address common security questions.

### Why Can Not Attackers Find v?

Given commitment C, finding v requires solving:

```
C = v*G + r*H

Two unknowns (v, r), one equation over a huge finite field.
```

For any guessed value v', there exists an r' that makes the equation true. Without additional information, all values are equally likely from the commitment alone.

Even with quantum computers (which threaten discrete log), the hiding property remains: the commitment reveals nothing about v because of the random r.

### The Nothing-Up-My-Sleeve Construction

The security of binding depends on nobody knowing `log_G(H)`. SIP uses:

```
H = HashToCurve("SIP-PEDERSEN-GENERATOR-H-v1:0")
```

This construction is:
1. **Deterministic**: Anyone can reproduce H
2. **Verifiable**: The derivation is public
3. **Untamperable**: SHA256 is preimage-resistant

Nobody could have chosen this string to produce an H whose discrete log they know.

### Parameter Generation

The curve secp256k1 itself has well-established parameters chosen by cryptographers at Certicom. The generator G was chosen long before Bitcoin existed. These are industry-standard, battle-tested parameters.

### Quantum Considerations

Pedersen commitments have an interesting relationship with quantum computing:

- **Hiding remains secure**: The information-theoretic hiding means even quantum computers cannot extract v from C without knowing r
- **Binding is threatened**: Quantum computers could potentially solve discrete log, allowing commitment fraud

For long-term security, SIP is exploring quantum-resistant alternatives (see our [Winternitz integration](/blog/quantum-resistant-privacy-winternitz) article). However, for current use cases where commitments are verified relatively quickly, the existing scheme remains secure.

## Comparison to Other Hiding Schemes

How do Pedersen commitments compare to alternatives?

### vs Hash Commitments

| Property | Hash Commitment | Pedersen |
|----------|----------------|----------|
| Hiding | No (brute forceable) | Yes (information-theoretic) |
| Binding | Yes (computationally) | Yes (computationally) |
| Homomorphic | No | Yes |
| Use case | Large data | Small values (amounts) |

Hash commitments work for large, high-entropy data. Pedersen commitments are designed for small values where brute force is a concern.

### vs Encryption

| Property | Encryption | Pedersen |
|----------|-----------|----------|
| Reveals value to key holder | Yes | No (unless opened) |
| Provable properties | Limited | Homomorphic proofs |
| Verifiable without decryption | No | Yes (with ZK proofs) |

Encryption protects data in transit/storage. Pedersen commitments enable computation on hidden values.

### vs Multi-Party Computation (MPC)

| Property | MPC | Pedersen |
|----------|-----|----------|
| Trust model | Threshold trust | Cryptographic (trustless) |
| Latency | High (rounds of communication) | Low (local computation) |
| Complexity | Protocol coordination | Single-party computation |
| Use case | Private computation | Value commitment |

MPC enables multi-party private computation. Pedersen commitments are simpler primitives for committing to values.

## Real-World Applications

Pedersen commitments power privacy features across the blockchain ecosystem:

### Confidential Transactions (Monero, Liquid)

Monero uses Pedersen commitments to hide transaction amounts. Every UTXO is a commitment, and balance verification uses homomorphic properties.

### Mimblewimble (Grin, Beam)

The entire Mimblewimble protocol is built on Pedersen commitments. Transactions are literally commitment arithmetic.

### Zcash Sapling

Zcash uses Pedersen commitments for note values within its shielded pool.

### SIP Protocol

SIP uses Pedersen commitments for:
- Hiding transaction amounts in shielded intents
- Proving balance constraints without revealing amounts
- Integration with viewing keys for selective disclosure

## Common Misconceptions

Before we conclude, let us address some common misunderstandings:

**"Pedersen commitments are encryption"**

No. Encryption is reversible with a key. Commitments are irreversible — you cannot "decrypt" a commitment. You can only verify it if you have the opening (value + blinding).

**"The commitment size depends on the value"**

No. Whether you commit to 1 or 1,000,000,000, the commitment is always 33 bytes (compressed point). This prevents amount inference from data size.

**"You need special hardware for the math"**

No. Modern cryptographic libraries (like noble-curves) make these operations efficient on any device. Creating a commitment takes milliseconds.

**"Homomorphic means fully homomorphic"**

No. Pedersen commitments are additively homomorphic only. You cannot multiply committed values. Fully homomorphic encryption (FHE) is a different, more expensive primitive.

## Conclusion: Mathematical Privacy

Pedersen commitments represent a fundamental shift in how we think about secrets. Instead of hiding information behind walls (encryption), we hide it within mathematical structure that enables computation.

The formula `C = v*G + r*H` is simple, but the implications are profound:
- Perfect hiding through randomization
- Computational binding through discrete log hardness
- Homomorphic properties that enable verification without revelation

When you use SIP Protocol, every shielded amount is protected by these mathematical guarantees. No trusted party. No timing analysis. No amount correlation. Just math.

The next time someone asks "how do you hide transaction amounts?", you can answer: "We commit to them using Pedersen commitments, then prove properties using homomorphic addition."

Privacy through mathematics. That is the foundation.

---

*This is Part 6 of our Privacy Education Series. Next up: [Stealth Addresses Explained: EIP-5564 and Recipient Privacy](/blog/stealth-addresses-eip-5564) — how we hide not just amounts, but recipients.*

## Further Reading

- [SIP vs Pool Mixing: The Cryptographic Difference](/blog/sip-vs-privacycash) — How Pedersen commitments compare to pool mixing
- [Zero-Knowledge Proofs on Solana](/blog/zero-knowledge-proofs-solana) — The broader ZK landscape
- [SIP Protocol SDK Documentation](https://docs.sip-protocol.org/sdk/commitments) — Implementation details
- [Bulletproofs Paper](https://eprint.iacr.org/2017/1066) — The efficient range proof scheme
- [noble-curves Library](https://github.com/paulmillr/noble-curves) — The cryptographic foundation
