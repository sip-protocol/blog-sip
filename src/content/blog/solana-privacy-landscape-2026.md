---
title: 'The State of Privacy on Solana (2026): A Technical Overview'
description: 'Survey of Solana privacy: PrivacyCash, ShadowWire, Arcium, Inco Lightning, and SIP. Compare approaches, features, and trade-offs.'
pubDate: 'Jan 12 2026'
updatedDate: 'Jan 29 2026'
category: 'technical'
tags: ['privacy', 'solana', 'privacycash', 'shadowwire', 'arcium', 'inco', 'sip-protocol', 'comparison']
draft: false
author: 'SIP Protocol Team'
tldr: 'Solana has five main privacy approaches: pool mixing (PrivacyCash), bulletproofs (ShadowWire), MPC (Arcium), TEE (Inco), and cryptographic middleware (SIP). Each has different trade-offs in latency, privacy guarantees, and compliance features.'
keyTakeaways:
  - 'Pool mixing hides you in a crowd; cryptographic methods hide data mathematically'
  - 'ShadowWire uses Bulletproofs for efficient sender anonymity without trusted setup'
  - 'Arcium uses distributed MPC for trustless computation over encrypted data'
  - 'Inco Lightning offers ~2 second latency with TEE-based encryption'
  - 'SIP aggregates multiple backends (including ShadowWire) through a unified API'
  - 'All modern solutions now offer compliance paths (viewing keys, auditor access)'
targetAudience: 'Solana developers, DeFi builders, privacy researchers'
prerequisites:
  - 'Basic understanding of Solana'
  - 'Familiarity with privacy concepts'
relatedPosts:
  - 'sip-vs-privacycash'
---

Privacy on Solana has transformed dramatically. After the shutdown of Elusiv in early 2024 and Light Protocol's pivot to ZK compression, many questioned whether privacy had a future on Solana's high-performance chain. The answer, as of January 2026, is a resounding yes—but the landscape looks nothing like what we expected.

Five distinct approaches have emerged, each with fundamentally different architectures, trust assumptions, and use cases. This technical overview surveys the major players and helps you understand which solution fits your needs.

## A Brief History: Solana's Privacy Journey

Understanding where we are requires knowing where we've been. Solana's relationship with privacy has been turbulent.

**2022-2023: Early Experiments**
Elusiv launched as Solana's first serious privacy solution, bringing private transfers and even private swaps to mainnet. The protocol gained traction but faced challenges with the regulatory environment post-Tornado Cash sanctions.

**Early 2024: The Reset**
On February 29, 2024, Elusiv announced sunsetting. The team realized that privacy needed to be "configurable and accessible enough to be leveraged by default"—a vision too ambitious for a single application. The team pivoted to building Arcium, focusing on infrastructure rather than end-user applications.

Light Protocol, which had started as a privacy solution, pivoted entirely to ZK compression for scalability. Their technology proved more valuable for reducing storage costs (up to 99% savings) than for privacy.

**Late 2024-2025: The Rebirth**
New protocols emerged with lessons learned. PrivacyCash launched with compliance features from day one. ShadowWire brought Bulletproof-based sender anonymity. Arcium revealed its MPC infrastructure vision. Inco brought TEE-based speed. And SIP Protocol introduced cryptographic middleware that aggregates multiple backends.

Now let's examine the five paradigms these protocols represent.

## The Five Privacy Paradigms

Before diving into specific protocols, let's understand the five fundamental approaches to blockchain privacy:

### 1. Pool Mixing (Statistical Privacy)

Users deposit funds into a shared pool, then withdraw to different addresses. Privacy comes from the anonymity set—the larger the pool, the harder to trace individual transactions. This is the approach pioneered by Tornado Cash on Ethereum.

**How anonymity sets work:** If 1,000 users each deposit 1 SOL, any withdrawal could have come from any of those 1,000 deposits. An observer has a 0.1% chance of guessing correctly. But if only 10 users deposited, odds jump to 10%. Pool size directly determines privacy strength.

**Trust assumption:** Privacy depends on pool participation. Small pools or unusual amounts weaken guarantees.

### 2. Multi-Party Computation (MPC)

Multiple independent nodes perform computations over encrypted data without any single node seeing the plaintext. Data is split into "shares" distributed across nodes—no single share reveals anything.

**Example:** To add two encrypted numbers, each node adds its shares locally. The combined result gives the correct answer without any node seeing the original inputs. This enables complex operations (swaps, auctions, lending) over private data.

**Trust assumption:** Distributed trust across node operators. Privacy guaranteed with honest minority (sometimes just one honest node).

### 3. Trusted Execution Environments (TEE)

Hardware-based secure enclaves (like Intel SGX or AMD SEV) process encrypted data in isolated memory regions. The hardware manufacturer guarantees that even the server operator cannot access the data.

**Remote attestation:** Users can cryptographically verify that the correct code is running in a genuine TEE before sending sensitive data. This prevents operators from running modified software.

**Trust assumption:** Hardware manufacturer and TEE implementation are secure. Side-channel attacks remain a concern.

### 4. Cryptographic Primitives (Mathematical Privacy)

Zero-knowledge proofs, Pedersen commitments, and stealth addresses provide privacy through mathematical guarantees. No trusted hardware, no trusted operators—just mathematics.

**Why mathematics?** Cryptographic privacy doesn't degrade with small user counts. The security of hiding 1 SOL is identical to hiding 1,000,000 SOL—both rely on the same mathematical hardness assumptions that secure all modern cryptography.

**Trust assumption:** The cryptographic assumptions (discrete log hardness, etc.) hold. These same assumptions underpin Bitcoin, Ethereum, and virtually all blockchain security.

### 5. ZK Range Proofs (Bulletproofs)

Bulletproofs are a specialized form of zero-knowledge proof optimized for proving that a value lies within a range without revealing the value itself. They're particularly efficient for proving transaction validity (amounts are positive, no overflow) with small proof sizes.

**How it works:** When you send tokens, Bulletproofs prove that (1) the amount is positive, (2) you have sufficient balance, and (3) no tokens were created from nothing—all without revealing actual amounts.

**Key advantage:** No trusted setup required. Unlike SNARKs that need an initial ceremony, Bulletproofs derive security purely from cryptographic assumptions. This eliminates a major trust concern.

**Trust assumption:** Discrete log hardness (same as Bitcoin/Ethereum signatures). Proof sizes are logarithmic in the range size, making them practical for blockchain use.

## Major Players on Solana

### PrivacyCash: Pool Mixing Comes to Solana

**Approach:** Pool mixing with zero-knowledge proofs
**Launch:** August 2025
**Status:** Production mainnet

PrivacyCash brought Tornado Cash-style privacy to Solana. The protocol maintains privacy pools where users deposit tokens, receive commitments added to a Merkle tree, and later withdraw to fresh addresses using ZK proofs.

#### How It Works

1. User deposits SOL (or supported SPL tokens) into the privacy pool
2. A commitment hash is added to the protocol's Merkle tree
3. User generates a ZK proof showing they made a valid deposit
4. User withdraws to any address—the proof reveals nothing about which deposit

#### Key Metrics

- **Total volume:** $160M+ in private transfers
- **TVL:** ~$888K (as of January 2026)
- **Supported tokens:** SOL, USDC, USDT, ZEC, ORE
- **Fee structure:** 0.35% + 0.006 SOL per withdrawal

#### Technical Features

Unlike classic Tornado Cash with fixed denominations, PrivacyCash supports arbitrary amounts from launch. The protocol also includes compliance mechanisms:

- **Selective disclosure:** Users can prove transaction history to authorized parties
- **Auditor keys:** Designated auditors can view transaction details
- **AML/KYT hooks:** Integration points for compliance providers

#### Recent Developments

In January 2026, PrivacyCash partnered with ORE to launch an official shielded pool, bringing private transfers to the Solana mining token. This represents an expansion from simple transfers to "Privacy DeFi."

#### Limitations

- Privacy depends on pool size—early adoption means smaller anonymity sets
- Fixed pool architecture limits composability
- Statistical analysis can narrow down possibilities with unusual amounts

### ShadowWire: Bulletproof-Based Privacy

**Approach:** Pedersen commitments + Bulletproofs for sender anonymity
**Developer:** Radr Labs
**Status:** Production mainnet
**Website:** [radrlabs.io](https://radrlabs.io)

ShadowWire takes a different approach from pool mixing: rather than hiding transactions in a crowd, it uses Bulletproofs to mathematically prove transaction validity without revealing amounts or sender identity.

#### How It Works

1. User deposits tokens into their ShadowWire balance (on-chain transaction)
2. For transfers, Bulletproofs prove the sender has sufficient balance
3. Pedersen commitments hide the actual amounts being transferred
4. Recipients receive funds without the public ledger revealing who sent what

```
Deposit → ShadowWire Balance → Private Transfer → Withdrawal
            (hidden)              (ZK proof)        (on-chain)
```

#### Key Features

- **No trusted setup:** Unlike SNARKs, Bulletproofs don't require a ceremony
- **Sender anonymity:** Internal transfers hide the sender identity
- **Amount hiding:** Pedersen commitments conceal transaction values
- **Arbitrary amounts:** No fixed denominations like pool mixing
- **Multi-token support:** SOL, USDC, RADR, ORE, BONK, and more

#### Technical Details

- **Proof generation:** ~500ms client-side (WASM available)
- **Verification:** Efficient on-chain verification
- **Transfer types:**
  - **Internal:** Between ShadowWire users (full privacy)
  - **External:** To non-users (sender privacy only)

#### SIP Integration

SIP Protocol integrates ShadowWire as a privacy backend, adding viewing keys for compliance:

```typescript
import { ShadowWireBackend } from '@sip-protocol/sdk'

const backend = new ShadowWireBackend()
const result = await backend.execute({
  chain: 'solana',
  sender: senderPubkey,
  recipient: recipientPubkey,
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: 1000000n, // 1 USDC
  decimals: 6,
  viewingKey: viewingKey, // SIP adds compliance
})
```

#### Limitations

- Requires deposit/withdrawal steps (not direct wallet-to-wallet)
- Solana-only currently
- External transfers reveal sender to recipient
- Limited DeFi composability (transfers only, no swaps)

### Arcium: MPC-Powered Encrypted Computing

**Approach:** Multi-party computation with encrypted shared state
**Status:** Mainnet Alpha (Q1 2026 full mainnet planned)
**Backing:** Major Solana ecosystem investors

Arcium represents a fundamentally different approach: rather than hiding transactions after they happen, Arcium enables computation over encrypted data. Their vision is "Privacy 2.0"—moving from isolated private states to shared encrypted states.

#### Architecture

Arcium's core innovation is the **MXE (Multi-Party Execution)** system:

```
User Request → MXE Cluster → Encrypted Computation → Result
                   ↓
         Multiple independent nodes
         each holding encrypted shares
```

The protocol uses two primary computation systems:

**Cerberus** (Production)
- Combines semi-homomorphic encryption with MPC
- "Dishonest majority" trust model—privacy guaranteed with just one honest node
- Cheating detection and identifiable termination
- Orders of magnitude faster than fully homomorphic encryption (FHE)

**Manticore** (AI-focused)
- Designed for machine learning scenarios
- Lighter security assumptions for trusted environments
- Optimized for AI training and inference

#### C-SPL: Confidential SPL Tokens

Arcium is building **C-SPL** as an ecosystem standard for confidential tokens on Solana. In collaboration with core Solana developers, C-SPL enables:

- Encrypted token balances
- Private transfers between parties
- Confidential DeFi operations

#### Ecosystem Applications

Several applications are already building on Arcium:

- **Umbra:** Privacy protocol that raised $155M in ICO commitments
- **Dark Pool:** Institutional trading with hidden order books
- **Phantom Fleet:** Confidential gaming mechanics

#### Technical Considerations

- **Latency:** MPC adds coordination overhead between nodes
- **Throughput:** Limited by slowest node in the cluster
- **Decentralization:** More nodes = better security but higher latency

### Inco Lightning: TEE-Based Speed

**Approach:** Trusted Execution Environments for confidential compute
**Launch:** January 2026 (Solana Devnet beta)
**Funding:** $10M total ($5M from a16z CSX in April 2025)

Inco Lightning prioritizes speed. By leveraging TEE hardware, the protocol achieves near-native latency while providing confidentiality—critical for gaming, high-frequency DeFi, and real-time applications.

#### How TEE Privacy Works

```
User Data → TEE Enclave → Encrypted Processing → Output
              ↓
    Hardware-isolated memory
    Even server operators cannot access
```

The TEE (Intel SGX, AMD SEV, or similar) creates a secure enclave where:

1. Data is encrypted before entering
2. Processing happens in isolated memory
3. Only the result (encrypted for the recipient) leaves the enclave
4. Attestation proves the enclave is running approved code

#### Key Features

- **~2 second latency:** Near-native Solana speed
- **Encrypted data types:** Native support for confidential values in programs
- **Programmable access control:** Define who can decrypt what
- **Cross-chain support:** Also available on Base Sepolia

#### Solana Integration

Inco Lightning enables developers to build confidential Solana programs with:

```rust
// Pseudocode example
pub fn private_transfer(
    ctx: Context<Transfer>,
    encrypted_amount: EncryptedU64,
) -> Result<()> {
    // Amount remains encrypted throughout
    // TEE handles decryption and re-encryption
}
```

#### Trust Considerations

TEE-based privacy introduces hardware trust assumptions:

- **Hardware manufacturer:** Intel/AMD must not have backdoors
- **Side-channel attacks:** TEEs have had vulnerabilities (Spectre, Meltdown)
- **Attestation:** Users must verify the enclave is running correct code

Inco's roadmap includes **Atlas**, a future product using FHE (Fully Homomorphic Encryption) for trustless confidentiality without hardware dependencies.

### SIP Protocol: Cryptographic Middleware

**Approach:** Pedersen commitments, stealth addresses, viewing keys
**Status:** Production SDK (v0.6.0), Solana same-chain integration in development
**Achievement:** Zypherpunk Hackathon winner ($6,500, 3 tracks, December 2025)

SIP Protocol takes a different architectural position: rather than being a single privacy solution, SIP is privacy middleware that can aggregate multiple backends.

#### Core Cryptographic Primitives

**Stealth Addresses (EIP-5564 style)**

Each recipient gets a unique one-time address:

```typescript
// Generate stealth address for recipient
const stealth = sip.generateStealthAddress(recipientPublicKey)
// Transaction goes to stealth.address
// Only recipient can derive the spending key
```

Benefits:
- No address reuse → no transaction linking
- Recipient privacy preserved
- Works across any chain supporting the curve

**Pedersen Commitments**

Amounts are hidden mathematically:

```
Commitment = value × G + blinding × H
```

Properties:
- **Hiding:** Cannot extract value from commitment
- **Binding:** Cannot change committed value
- **Homomorphic:** `Commit(A) + Commit(B) = Commit(A+B)`

This enables proving transaction balance without revealing amounts—impossible with pool mixing.

**Viewing Keys for Compliance**

Selective disclosure without compromising privacy:

```typescript
const viewingKey = sip.generateViewingKey({
  scope: 'transaction', // or 'all', 'range'
  recipient: 'auditor-public-key'
})
```

Auditors can verify specific transactions while the public sees nothing.

#### Architecture: The Middleware Approach

SIP's unique position is aggregating multiple privacy backends:

```
┌─────────────────────────────────────────┐
│  Application Layer                      │
│  (Wallets, DEXs, DAOs)                  │
└────────────────────┬────────────────────┘
                     │ Unified Privacy API
                     ▼
┌─────────────────────────────────────────┐
│  SIP Protocol                           │
│  • Stealth Addresses                    │
│  • Pedersen Commitments                 │
│  • Viewing Keys                         │
│  • Backend Router                       │
└────────────────────┬────────────────────┘
                     │ Multiple Settlement Options
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Solana  │  │  NEAR   │  │Ethereum │
   │ Native  │  │ Intents │  │   EVM   │
   └─────────┘  └─────────┘  └─────────┘
```

This means applications integrate once with SIP and gain access to multiple privacy mechanisms.

#### Current Status

- **SDK:** Production-ready with 6,850+ tests
- **Chain support:** Solana, Ethereum, NEAR, Bitcoin, Cosmos, Move chains
- **Active development:** Solana same-chain privacy (M17 milestone)

## Comparison Table

| Feature | PrivacyCash | ShadowWire | Arcium | Inco Lightning | SIP Protocol |
|---------|-------------|------------|--------|----------------|--------------|
| **Privacy Model** | Pool mixing | Bulletproofs | MPC | TEE | Middleware |
| **Trust Assumption** | Anonymity set | Math only | 1 honest node | Hardware | Backend-dependent |
| **Latency** | ~5-10s | ~2s | ~5-15s | ~2s | Backend-dependent |
| **Arbitrary Amounts** | Yes | Yes | Yes | Yes | Yes |
| **Compliance** | Selective disclosure | Via SIP | Configurable | Access control | Viewing keys |
| **Chain Support** | Solana only | Solana only | Solana (expanding) | Multi-chain | Chain-agnostic |
| **Composability** | Limited | Limited | High | High | High |
| **Status** | Production | Production | Mainnet Alpha | Devnet Beta | SDK Production |
| **Trusted Setup** | Yes (ZK) | No | No | N/A | Backend-dependent |
| **Homomorphic** | No | No | Yes (limited) | No | Yes |

## DEX and Wallet Integration

Privacy is only useful if it integrates with the applications you use. Here's the current state:

### Jupiter Integration

Jupiter, Solana's dominant aggregator, has shown interest in privacy features:

- PrivacyCash: No direct integration (separate interface)
- ShadowWire: No direct integration (transfers only, no swaps)
- Arcium: Potential dark pool integration for institutional trades
- Inco: Possible confidential limit orders
- SIP: Active development of Jupiter privacy wrapper (aggregates all backends)

### Wallet Support

| Wallet | PrivacyCash | ShadowWire | Arcium | Inco | SIP |
|--------|-------------|------------|--------|------|-----|
| Phantom | Via webapp | Via webapp | Planned | Planned | SDK ready |
| Solflare | Via webapp | Via webapp | Planned | Planned | SDK ready |
| Backpack | Via webapp | Via webapp | Planned | Planned | SDK ready |

Most solutions currently require dedicated web interfaces rather than native wallet integration.

## What's Coming: 2026 Roadmaps

### PrivacyCash

- Expanded token support (more SPL tokens)
- Improved anonymity set tools
- Cross-protocol shielded pools

### ShadowWire

- Expanded token support (community-requested tokens)
- Improved proof generation performance
- Mobile SDK for native app integration
- Potential DeFi integrations beyond transfers

### Arcium

- **Q1 2026:** Full mainnet launch and TGE
- C-SPL ecosystem standard finalization
- Expanded MXE cluster network

### Inco Lightning

- Solana mainnet deployment
- Atlas (FHE-based) development
- Gaming-focused SDK

### SIP Protocol

- **M17:** Solana same-chain privacy with native integration
- **M18:** Ethereum same-chain with L2 support
- Viewing key standard proposal

## Choosing the Right Solution

### Use PrivacyCash when:

- You need simple deposit/withdraw privacy today
- You're comfortable with pool-based anonymity
- Single-chain (Solana) is sufficient
- You want a battle-tested approach

### Use ShadowWire when:

- You want mathematical privacy without trusted setup
- Sender anonymity is your primary concern
- You prefer Bulletproofs over pool-based mixing
- You need fast proof generation (~500ms)
- Compliance via SIP viewing keys is acceptable

### Use Arcium when:

- You need computation over encrypted data
- Building confidential DeFi (dark pools, private auctions)
- Institutional use cases requiring multiple party coordination
- You can wait for mainnet maturity

### Use Inco Lightning when:

- Latency is critical (gaming, HFT)
- You accept hardware trust assumptions
- Building real-time confidential applications
- Cross-chain confidentiality matters

### Use SIP Protocol when:

- You need cryptographic (not trust-based) privacy guarantees
- Building chain-agnostic applications
- Compliance via viewing keys is required
- You want homomorphic properties for amount proofs

## The Bigger Picture

Solana's privacy landscape in 2026 reflects broader industry maturation. Gone are the days of "hide everything, ask questions never." Every major solution now includes compliance mechanisms—viewing keys, selective disclosure, auditor access.

This isn't capitulation; it's pragmatism. Institutional adoption requires regulatory clarity. Privacy protocols that offer compliance paths will see enterprise adoption; those that don't will remain niche tools.

### The Solana Foundation's Privacy Strategy

The foundation has articulated three pillars for privacy infrastructure:

1. **ZK Compression** (Light Protocol/Helius): Reducing on-chain storage costs while maintaining privacy-preserving properties
2. **Confidential Transfers**: Native token privacy at the protocol level
3. **Light Clients and Bridges**: Privacy-preserving cross-chain communication

All five major protocols align with this strategy in different ways. The foundation isn't picking winners—it's fostering an ecosystem.

### What Developers Should Consider

When evaluating privacy solutions for your Solana application, consider:

**Latency requirements:** Gaming and HFT need Inco's speed. Batch transfers can tolerate pool mixing delays.

**Privacy guarantees:** Mathematical privacy (SIP) doesn't degrade with low adoption. Pool mixing requires critical mass.

**Composability needs:** MPC (Arcium) and cryptographic (SIP) approaches integrate better with DeFi. Pool mixing is largely standalone.

**Compliance requirements:** All solutions now offer compliance paths, but implementations differ. Choose based on your regulatory environment.

**Development maturity:** PrivacyCash is production-ready today. Others are at various stages. Consider your timeline.

### Competition Breeds Innovation

The competition between approaches is healthy. Pool mixing, Bulletproofs, MPC, TEE, and cryptographic middleware each have legitimate use cases. Developers now have choices that didn't exist two years ago.

For Solana specifically, the Solana Privacy Hack (January 12-30, 2026) signals foundation-level commitment to privacy infrastructure. With $100,000+ in prizes and participation from all five major protocols, expect rapid innovation in the coming months.

The protocols covered here aren't just competing—they're expanding the design space. Arcium's C-SPL could become the confidential token standard. ShadowWire's no-trusted-setup Bulletproofs offer an alternative to pool mixing. SIP's viewing key pattern might influence compliance across the ecosystem. Inco's TEE work pushes latency boundaries.

Privacy on Solana isn't just possible—it's becoming a first-class citizen of the ecosystem. The question isn't whether to add privacy to your application, but which approach fits your specific needs.

---

*This is Part 2 of our Privacy Education Series. Next: "Understanding Pool Mixing: How Tornado Cash and PrivacyCash Actually Work."*
