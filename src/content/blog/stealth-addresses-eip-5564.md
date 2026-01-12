---
title: 'Stealth Addresses Explained: EIP-5564 and Recipient Privacy'
description: 'Learn how stealth addresses provide recipient privacy. Deep-dive into EIP-5564, the cryptography behind one-time addresses, and how SIP implements them.'
pubDate: 'Jan 12 2026'
category: 'technical'
tags: ['cryptography', 'stealth-addresses', 'eip-5564', 'privacy', 'recipient-privacy', 'ecdh']
draft: false
author: 'SIP Protocol Team'
tldr: 'Stealth addresses create unique one-time addresses for each payment. Only the recipient can detect and spend funds sent to them. This prevents tracking by address reuse and provides complete recipient privacy.'
keyTakeaways:
  - 'Stealth addresses generate a fresh address for every payment'
  - 'EIP-5564 standardizes the meta-address format and announcement protocol'
  - 'Recipients scan for payments using their viewing key (efficient)'
  - 'Only the recipient can derive the spending key for their stealth address'
  - 'SIP supports stealth addresses across multiple chains (secp256k1, ed25519)'
targetAudience: 'Blockchain developers, cryptography enthusiasts, privacy engineers'
prerequisites:
  - 'Basic understanding of public key cryptography'
  - 'Familiarity with wallet addresses'
relatedPosts:
  - 'sip-vs-privacycash'
  - 'quantum-resistant-privacy-winternitz'
---

You hide your transaction amount with Pedersen commitments. You can even mix your funds through a privacy pool. But there is one piece of information that remains stubbornly visible on-chain: **who received the money**.

Every time someone sends you cryptocurrency to your published address, that transaction is forever linked to your identity. Your employer pays you? Linked. You receive a donation? Linked. A friend repays a loan? Linked. Over time, a complete financial profile emerges, tied to a single address.

Stealth addresses solve this problem by generating a **unique, one-time address for every payment** you receive. Only you can detect that the payment was meant for you. Only you can spend it. To everyone else, it looks like random noise.

## The Recipient Privacy Problem

Let us examine why recipient privacy is so difficult to achieve.

### Address Reuse Creates Trails

Consider Alice, who publishes her Ethereum address on her website for donations. Every donor transaction is permanently recorded:

```
Alice's public address: 0x742d35Cc...

Transaction 1: 0xabc... → 0x742d35Cc... (1 ETH)
Transaction 2: 0xdef... → 0x742d35Cc... (0.5 ETH)
Transaction 3: 0x123... → 0x742d35Cc... (2.3 ETH)
```

A blockchain analyst can now see:
- Every entity that has ever paid Alice
- The total amount Alice has received
- When each payment occurred
- Patterns in her income

If any of those senders are identified (exchange deposits, ENS names, social media), Alice's donors are exposed.

### Exchange Deposits Create Identity Links

The problem compounds when Alice deposits to an exchange. The exchange now knows her public address and, through KYC, her real identity. Every previous transaction to that address is retroactively linked to her.

### Even Hidden Amounts Are Not Enough

Pedersen commitments can hide transaction amounts, but the recipient address is still visible:

```
Commitment(hidden_amount) → 0x742d35Cc...
```

Anyone watching knows: "Someone sent Alice something." The **what** is hidden; the **who** is not.

## The Stealth Address Concept

Stealth addresses flip the model. Instead of publishing a static receiving address, Alice publishes a **meta-address**: a special public key that senders use to derive unique, one-time payment addresses.

Here is the key insight:

1. **Alice generates a meta-address once** (two public keys)
2. **Each sender derives a fresh address** from Alice's meta-address
3. **Only Alice can detect and spend** funds sent to these addresses
4. **No address is ever reused**

From the blockchain's perspective, every payment Alice receives goes to a completely different address. There is no common address linking her transactions together.

### Why "Stealth"?

The name comes from military stealth technology. Just as a stealth aircraft minimizes its radar signature, a stealth address minimizes the recipient's on-chain footprint. Payments are hidden in plain sight, indistinguishable from any other transaction.

## EIP-5564: The Ethereum Standard

[EIP-5564](https://eips.ethereum.org/EIPS/eip-5564) standardizes stealth addresses for Ethereum and EVM chains. The standard defines:

1. **Meta-address format**: How recipients publish their stealth keys
2. **Address derivation**: How senders compute one-time addresses
3. **Announcement mechanism**: How recipients discover payments
4. **View tags**: How to efficiently filter payments

### The Meta-Address Format

A stealth meta-address contains two public keys:

```
st:eth:0x02abc...123:0x03def...456
   │    │             └── Viewing Key (K_view)
   │    └── Spending Key (K_spend)
   └── Chain identifier
```

- **Spending Key (K_spend)**: Used to derive the one-time address. The recipient needs the corresponding private key to spend received funds.
- **Viewing Key (K_view)**: Used to scan for incoming payments. The recipient can share this with third parties (auditors, wallets) to detect payments without granting spending authority.

This separation is crucial: you can delegate payment detection without delegating spending rights.

### SIP's Meta-Address Format

SIP extends the concept to support multiple chains:

```
sip:ethereum:0x02abc...123:0x03def...456
sip:solana:0x7b8c...def:0x9e1f...abc
```

The format is `sip:<chain>:<spending_key>:<viewing_key>`, enabling the same stealth address standard across different blockchain ecosystems.

## The Cryptography: ECDH Key Exchange

At the heart of stealth addresses lies **Elliptic Curve Diffie-Hellman (ECDH)**: a method for two parties to establish a shared secret over an insecure channel.

### The Analogy: Paint Mixing

Imagine Alice and Bob want to agree on a secret color, but they can only communicate through postcards everyone can read.

1. They publicly agree on a starting color (yellow)
2. Alice picks a secret color (blue) and mixes it with yellow, sending the result (green)
3. Bob picks a secret color (red) and mixes it with yellow, sending the result (orange)
4. Alice mixes her secret (blue) with Bob's result (orange), getting brown
5. Bob mixes his secret (red) with Alice's result (green), getting the same brown

Even though everyone saw green and orange on the postcards, nobody except Alice and Bob knows the final brown color. This is ECDH with colors.

### The Mathematics

In elliptic curve cryptography:

- **G** is a generator point (the "starting color")
- **a** is Alice's private key (secret number)
- **A = a * G** is Alice's public key (her "mixed result")
- **b** is Bob's private key
- **B = b * G** is Bob's public key

The shared secret is:
```
S = a * B = a * (b * G) = (a * b) * G = b * (a * G) = b * A
```

Both parties arrive at the same point S, but an observer who only sees A and B cannot compute S without knowing a or b.

### Applying ECDH to Stealth Addresses

For stealth addresses, we adapt ECDH:

1. **Recipient (Bob)** publishes meta-address containing K_spend and K_view
2. **Sender (Alice)** generates a random ephemeral keypair (r, R = r * G)
3. **Shared secret**: S = r * K_spend
4. **Stealth address**: P_stealth = K_view + H(S) * G

Where H() is a cryptographic hash function converting the shared secret into a scalar.

The recipient can detect this payment because:
- They see R (ephemeral public key) on-chain
- They compute S = k_spend * R (same shared secret)
- They derive the same stealth address and recognize it as theirs

## Step-by-Step Example

Let us walk through a complete payment from Alice to Bob.

### Step 1: Bob Generates His Meta-Address

Bob runs this once and publishes the result:

```typescript
import { generateStealthMetaAddress, encodeStealthMetaAddress } from '@sip-protocol/sdk'

// Generate stealth keypairs
const { metaAddress, spendingPrivateKey, viewingPrivateKey } =
  generateStealthMetaAddress('ethereum', 'Bob Privacy Wallet')

// Encode for sharing
const encoded = encodeStealthMetaAddress(metaAddress)
console.log('Share this publicly:', encoded)
// Output: sip:ethereum:0x02abc...123:0x03def...456

// Store private keys securely (never share these!)
secureStorage.save({ spendingPrivateKey, viewingPrivateKey })
```

Bob publishes `sip:ethereum:0x02abc...123:0x03def...456` on his website, social media, or ENS record.

### Step 2: Alice Derives a Stealth Address

Alice wants to pay Bob. She uses his published meta-address:

```typescript
import { generateStealthAddress, decodeStealthMetaAddress } from '@sip-protocol/sdk'

// Decode Bob's meta-address
const bobMetaAddress = decodeStealthMetaAddress('sip:ethereum:0x02abc...123:0x03def...456')

// Generate one-time stealth address
const { stealthAddress, sharedSecret } = generateStealthAddress(bobMetaAddress)

console.log('Stealth address:', stealthAddress.address)
// Output: 0x03789...xyz (unique for this payment)

console.log('Ephemeral key:', stealthAddress.ephemeralPublicKey)
// Output: 0x02fed...987 (publish this for Bob to find)

console.log('View tag:', stealthAddress.viewTag)
// Output: 142 (optimization for scanning)
```

The cryptographic steps inside `generateStealthAddress`:

```
1. Generate ephemeral keypair: r (random), R = r * G
2. Compute shared secret: S = r * K_spend
3. Hash the secret: h = SHA256(S)
4. Derive stealth address: P_stealth = K_view + h * G
5. Compute view tag: first byte of h
```

### Step 3: Alice Sends the Payment

Alice creates a transaction with two pieces of information:

```typescript
// Send ETH to the stealth address
const tx = await wallet.sendTransaction({
  to: stealthAddress.address,
  value: ethers.parseEther('1.0'),
})

// Publish announcement (ephemeral key + view tag)
await announcer.publish({
  ephemeralPublicKey: stealthAddress.ephemeralPublicKey,
  viewTag: stealthAddress.viewTag,
  stealthAddress: stealthAddress.address,
})
```

The announcement can go on-chain (EIP-5564 registry) or off-chain (indexer service).

### Step 4: Bob Scans for Payments

Bob periodically scans announcements to find payments addressed to him:

```typescript
import { checkStealthAddress, deriveStealthPrivateKey } from '@sip-protocol/sdk'

// Fetch recent announcements
const announcements = await announcer.getRecent()

for (const ann of announcements) {
  // Quick filter using view tag
  const isMatch = checkStealthAddress(
    {
      address: ann.stealthAddress,
      ephemeralPublicKey: ann.ephemeralPublicKey,
      viewTag: ann.viewTag,
    },
    spendingPrivateKey,
    viewingPrivateKey
  )

  if (isMatch) {
    console.log('Found payment at:', ann.stealthAddress)

    // Derive private key to spend
    const recovery = deriveStealthPrivateKey(
      {
        address: ann.stealthAddress,
        ephemeralPublicKey: ann.ephemeralPublicKey,
        viewTag: ann.viewTag,
      },
      spendingPrivateKey,
      viewingPrivateKey
    )

    // Now Bob can spend from this address
    console.log('Private key:', recovery.privateKey)
  }
}
```

### The Mathematical Verification

Why does Bob find his payment?

```
Sender computed:    S = r * K_spend
Recipient computes: S' = k_spend * R = k_spend * (r * G) = r * (k_spend * G) = r * K_spend = S

Same shared secret!

Sender derived:     P_stealth = K_view + H(S) * G
Recipient derives:  P_stealth = K_view + H(S') * G = K_view + H(S) * G

Same stealth address!
```

Bob can also derive the private key for P_stealth:
```
p_stealth = k_view + H(S)
P_stealth = p_stealth * G = (k_view + H(S)) * G = K_view + H(S) * G ✓
```

## View Tags: Efficient Scanning

Scanning every announcement requires expensive elliptic curve operations. View tags provide a shortcut.

The view tag is the first byte of H(S), a value between 0 and 255. When scanning:

1. Compute S = k_spend * R (required)
2. Check if first byte of H(S) equals the published view tag
3. If no match, skip this announcement (99.6% rejection rate)
4. If match, do the full address derivation

This reduces scanning computation by approximately 256x, since only 1 in 256 announcements will pass the view tag filter on average.

```typescript
// Inside checkStealthAddress - view tag optimization
const sharedSecretHash = sha256(sharedSecretPoint)

// Quick rejection (256x speedup)
if (sharedSecretHash[0] !== stealthAddress.viewTag) {
  return false
}

// Full check only if view tag matches
// ... expensive derivation ...
```

## Privacy Analysis

### Unlinkability Guarantees

Stealth addresses provide strong unlinkability:

| Property | Guarantee |
|----------|-----------|
| Receiver privacy | Addresses cannot be linked to recipient |
| Payment unlinkability | Multiple payments to same recipient are unlinkable |
| Sender privacy | Sender is only visible if their address is known |
| Amount privacy | Requires Pedersen commitments (separate feature) |

### What Observers See

An observer watching the blockchain sees:

```
Tx 1: 0xAlice → 0xStealth_1 (1 ETH)
Tx 2: 0xCarol → 0xStealth_2 (2 ETH)
Tx 3: 0xDave  → 0xStealth_3 (0.5 ETH)
```

Without Bob's viewing key, observers cannot determine:
- Whether any of these are for the same recipient
- Who the recipient is
- Any connection between these addresses

### The Viewing Key Tradeoff

Bob can share his viewing key with:
- **Auditors**: For tax compliance without spending access
- **Wallet services**: For balance notifications
- **Institutional custody**: For monitoring without control

This creates a "compliant privacy" model: private by default, selectively transparent when required.

## Multi-Chain Considerations

Different blockchains use different elliptic curves:

| Chain | Curve | Public Key Size |
|-------|-------|-----------------|
| Ethereum, Bitcoin | secp256k1 | 33 bytes (compressed) |
| Solana, NEAR | ed25519 | 32 bytes |
| Aptos, Sui | ed25519 | 32 bytes |

### SIP's Chain-Agnostic Approach

SIP implements stealth addresses for both curve families:

```typescript
// secp256k1 chains (Ethereum, Bitcoin, etc.)
const ethKeys = generateStealthMetaAddress('ethereum')

// ed25519 chains (Solana, NEAR, etc.)
const solKeys = generateStealthMetaAddress('solana')
```

The underlying mathematics remain the same, only the curve parameters differ:

**secp256k1 (EIP-5564 style):**
```
S = r * K_spend (ECDH)
P_stealth = K_view + SHA256(S) * G
```

**ed25519 (adapted DKSAP):**
```
S = scalar(r) * K_spend
P_stealth = K_view + SHA256(S) * G
```

### Address Format Conversion

SIP handles the conversion to native address formats:

```typescript
import {
  generateStealthAddress,
  ed25519PublicKeyToSolanaAddress,
  publicKeyToEthAddress
} from '@sip-protocol/sdk'

// Solana stealth address
const solStealth = generateStealthAddress(solanaMetaAddress)
const solanaAddress = ed25519PublicKeyToSolanaAddress(solStealth.stealthAddress.address)
// Returns: "7Vbmv1jt4vyuqBZcpYPpnVhrqVe5e6ZPBJCyqLqzQPvN"

// Ethereum stealth address
const ethStealth = generateStealthAddress(ethereumMetaAddress)
const ethereumAddress = publicKeyToEthAddress(ethStealth.stealthAddress.address)
// Returns: "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
```

## Limitations and Practical Considerations

### Gas Costs for Announcements

Each payment requires publishing an announcement. On Ethereum mainnet:
- On-chain registry: ~50,000 gas per announcement
- Calldata-based: ~20,000 gas

At 50 gwei and $3,000 ETH: $3-7.50 per payment announcement.

Solutions:
- **L2 announcements**: Arbitrum/Optimism reduce costs 10-100x
- **Off-chain indexers**: Zero gas, but requires trust assumptions
- **Batched announcements**: Aggregate multiple announcements

### Scanning Overhead

Recipients must scan all announcements to find their payments. For 1 million announcements:

| Approach | Time (single core) |
|----------|-------------------|
| No optimization | ~10 minutes |
| With view tags | ~2 seconds |

View tags make scanning practical for most users. Heavy recipients (exchanges, services) may need dedicated scanning infrastructure.

### Key Management Complexity

Users must manage additional keys:
- Spending private key (for claiming funds)
- Viewing private key (for detecting payments)

This differs from standard wallets where one seed controls everything. Wallet UX must abstract this complexity.

### Quantum Considerations

Current stealth addresses rely on elliptic curve security. Quantum computers threaten:
- ECDH shared secrets
- Elliptic curve signatures

SIP is researching Winternitz-based stealth addresses for quantum resistance. See our [quantum-resistant privacy](/blog/quantum-resistant-privacy-winternitz) article for details.

## SIP Implementation Details

### Core Functions

```typescript
import {
  // Meta-address generation
  generateStealthMetaAddress,
  encodeStealthMetaAddress,
  decodeStealthMetaAddress,

  // Stealth address derivation
  generateStealthAddress,

  // Payment scanning
  checkStealthAddress,

  // Key recovery
  deriveStealthPrivateKey,

  // Curve utilities
  getCurveForChain,
  isEd25519Chain,
} from '@sip-protocol/sdk'
```

### Integration Example

A complete privacy-preserving payment flow:

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

const sip = new SIP({
  network: 'mainnet',
})

// Create shielded intent with stealth recipient
const intent = await sip.createIntent({
  input: {
    asset: { chain: 'ethereum', symbol: 'ETH', address: null, decimals: 18 },
    amount: 1_000_000_000_000_000_000n, // 1 ETH
  },
  output: {
    asset: { chain: 'ethereum', symbol: 'ETH', address: null, decimals: 18 },
    minAmount: 0n,
    maxSlippage: 0.01,
  },
  privacy: PrivacyLevel.SHIELDED,
  recipientMetaAddress: 'sip:ethereum:0x02abc...123:0x03def...456',
})

// The intent includes:
// - Hidden amount (Pedersen commitment)
// - Stealth recipient address
// - Ephemeral public key for recipient detection
```

## Conclusion: Complete Recipient Privacy

Stealth addresses are the missing piece for blockchain privacy. They provide:

- **One-time addresses**: No address reuse, no transaction linking
- **Recipient unlinkability**: Multiple payments cannot be connected
- **Selective disclosure**: Viewing keys for compliance without spending access
- **Standard compatibility**: EIP-5564 for Ethereum, adapted DKSAP for other chains

Combined with Pedersen commitments (amount privacy) and viewing keys (compliance), stealth addresses complete the privacy picture.

In traditional finance, receiving a payment does not automatically publish your entire transaction history. With stealth addresses, blockchain can finally offer the same basic privacy guarantee.

SIP implements stealth addresses across 15+ chains with a unified API. Whether you are building a privacy-preserving wallet, a confidential payment system, or an institutional custody solution, stealth addresses are the foundation for recipient privacy.

---

*Next in the series: Viewing Keys and Compliance explains how to provide transparency to authorized parties while maintaining privacy from the public.*
