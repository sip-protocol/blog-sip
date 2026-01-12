---
title: 'TEE Privacy: Inco Lightning on Solana'
description: 'How Inco Lightning uses TEEs for fast encrypted computation on Solana. Near-zero latency with full privacy.'
pubDate: 'Jan 12 2026'
category: 'technical'
tags: ['privacy', 'solana', 'inco', 'tee', 'encryption', 'confidential-computing']
draft: false
author: 'SIP Protocol Team'
tldr: 'Inco Lightning uses hardware-based TEEs to process encrypted data at near-instant speeds. Both amounts and recipients can be encrypted. Trade-off: trust hardware manufacturer rather than cryptographic math alone.'
keyTakeaways:
  - 'TEEs use hardware enclaves to process encrypted data securely'
  - 'Inco Lightning achieves near-zero latency—fast enough for real-time DeFi'
  - 'Both amounts AND recipients can be fully encrypted (unlike C-SPL)'
  - 'Programmable access control determines who can decrypt'
  - 'Trust model relies on hardware manufacturer (Intel, AMD) attestation'
targetAudience: 'DeFi developers, privacy engineers, Solana builders'
prerequisites:
  - 'Basic understanding of encryption'
  - 'Familiarity with Solana'
relatedPosts:
  - 'solana-privacy-landscape-2026'
  - 'mpc-confidential-computing-arcium'
  - 'sip-vs-privacycash'
---

In our [Solana Privacy Landscape](/blog/solana-privacy-landscape-2026) overview, we introduced the four major approaches to privacy on Solana. Now we dive deep into one of the most performance-focused solutions: **Trusted Execution Environments (TEE)** and how Inco Lightning leverages them to bring fast, encrypted computation to Solana.

If MPC (which we covered in our [Arcium article](/blog/mpc-confidential-computing-arcium)) distributes trust across multiple parties, TEE takes a fundamentally different approach: trust the hardware itself.

## What are Trusted Execution Environments?

A Trusted Execution Environment is a secure area within a processor that guarantees code and data loaded inside are protected from everything else on the machine—including the operating system, hypervisor, and even the server administrator.

**The analogy**: Imagine a bank vault with a one-way glass viewing window. You can put documents inside, and the vault will perform operations on them (sorting, counting, signing), but nobody outside—not even the bank manager—can see what's happening inside. The vault's manufacturer guarantees this isolation through the physical construction of the vault itself.

That's a TEE. The "vault" is a hardware enclave inside the CPU. The "manufacturer guarantee" is cryptographic attestation from Intel, AMD, or ARM.

## TEE Fundamentals

### Hardware Enclaves

TEEs create isolated execution environments at the hardware level:

```
┌─────────────────────────────────────────────────────────────┐
│                    Normal Execution                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │     App     │  │     App     │  │     App     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Operating System                    │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    TEE / Enclave                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │   Encrypted Memory        Isolated Execution        │    │
│  │   ┌─────────────┐        ┌─────────────────┐       │    │
│  │   │  Private    │        │  Secure Code    │       │    │
│  │   │  Data       │───────▶│  (Attestable)   │       │    │
│  │   └─────────────┘        └─────────────────┘       │    │
│  └─────────────────────────────────────────────────────┘    │
│           ▲                                                  │
│           │ Hardware Isolation Boundary                      │
│           │ (OS/Hypervisor CANNOT cross)                    │
└─────────────────────────────────────────────────────────────┘
                            CPU
```

The key insight: **hardware enforces the isolation**, not software. The operating system kernel, the hypervisor, even root access cannot read enclave memory.

### Major TEE Implementations

**Intel SGX (Software Guard Extensions)**

Intel SGX pioneered application-level enclaves. User processes can create private memory regions ("enclaves") isolated from all other processes—privileged or not. While SGX was deprecated on consumer chips in 2021, it remains available on Intel Xeon processors and plays a role in TDX attestation.

**Intel TDX (Trust Domain Extensions)**

The successor to SGX, TDX provides VM-level confidential computing. It isolates entire "trust domains" (confidential virtual machines) from each other and from the hypervisor. TDX uses a new processor mode called "Secure Arbitration Mode" (SEAM) rather than relying on a separate security processor.

**AMD SEV (Secure Encrypted Virtualization)**

AMD's approach encrypts virtual machine memory from the hypervisor's perspective. SEV-SNP (Secure Nested Paging) adds integrity protection and attestation capabilities. A paradigm shift from SGX's enclave model to VM-based TEE protection.

**ARM TrustZone and CCA**

ARM TrustZone splits between "Secure world" and "Normal world." ARM CCA (Confidential Compute Architecture) builds on this with "realms"—a partitioning of address space that isolates realms from one another using a Granule Protection Table (GPT).

### Memory Encryption

TEEs encrypt memory contents using hardware encryption engines:

```
┌────────────────┐         ┌────────────────┐
│   Plaintext    │         │   Ciphertext   │
│   in Enclave   │────────▶│   in RAM       │
│   (CPU only)   │  MEE    │   (Encrypted)  │
└────────────────┘         └────────────────┘
        │                          │
        │                          │
   CPU processes              Even physical
   decrypted data             memory access
                              sees only
                              encrypted data
```

The Memory Encryption Engine (MEE) encrypts data as it leaves the CPU and decrypts it on the way back. Physical access to RAM—even with specialized hardware—reveals only ciphertext.

### Attestation: Proving the Enclave

Attestation is how TEEs prove they're running legitimate code in a genuine enclave:

1. **Local Attestation**: One enclave proves itself to another enclave on the same machine
2. **Remote Attestation**: An enclave proves itself to a remote party over the network

The flow:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Enclave requests attestation report                     │
│     ┌────────────┐                                          │
│     │  Enclave   │ ──▶ "Generate report for my code"       │
│     └────────────┘                                          │
├─────────────────────────────────────────────────────────────┤
│  2. CPU generates signed report                             │
│     ┌────────────┐                                          │
│     │    CPU     │ ──▶ Report includes:                    │
│     │  Hardware  │     • Code measurement (hash)           │
│     └────────────┘     • Enclave configuration             │
│                        • Hardware signature                 │
├─────────────────────────────────────────────────────────────┤
│  3. Verifier checks with manufacturer                       │
│     ┌────────────┐    ┌─────────────────┐                  │
│     │  Verifier  │───▶│ Intel/AMD/ARM   │                  │
│     │  (Remote)  │◀───│ Attestation     │                  │
│     └────────────┘    │ Service         │                  │
│                       └─────────────────┘                  │
│     "Yes, this is genuine Intel SGX running                │
│      the expected code version X.Y.Z"                      │
└─────────────────────────────────────────────────────────────┘
```

Attestation proves: (1) the code running is exactly what's expected, (2) it's running in a genuine TEE, and (3) the hardware is authentic.

## The TEE Trust Model

Here's the critical difference from cryptographic approaches: **TEE security depends on trusting hardware manufacturers**.

With MPC or zero-knowledge proofs, security comes from mathematical hardness—breaking the system requires solving computationally infeasible problems. With TEE, security comes from:

1. **Hardware design**: Intel/AMD/ARM designed the isolation correctly
2. **Manufacturing integrity**: No backdoors introduced during fabrication
3. **Attestation infrastructure**: Manufacturer's attestation service is honest
4. **Firmware updates**: Security patches are applied promptly

This is a significant philosophical difference:

| Approach | Trust Assumption |
|----------|------------------|
| ZK Proofs | Mathematical hardness (computational) |
| MPC | Threshold of honest parties (n-of-m) |
| TEE | Hardware manufacturer (Intel, AMD, ARM) |

For some applications, trusting Intel is acceptable. For others—particularly nation-state threat models—it's not. The a16z crypto team summarizes it well: TEEs offer greater efficiency but require accepting hardware-based trust assumptions.

### Historical Vulnerabilities

TEEs are not invulnerable. Notable attacks include:

- **Spectre/Meltdown (2018)**: Side-channel attacks exploiting speculative execution
- **Foreshadow/L1TF (2018)**: Attack against Intel SGX L1 cache
- **Plundervolt (2019)**: Voltage manipulation to extract secrets

Each was eventually patched, but these demonstrate that TEE security evolves. The key mitigation strategies:

1. **Design for eventual compromise**: Assume breaches will happen; ensure they're recoverable
2. **Key rotation**: Regularly replace encryption keys to limit breach impact
3. **ORAM**: Oblivious RAM techniques obscure memory access patterns
4. **Forward secrecy**: Use ephemeral session keys so historical data remains protected

## Inco Lightning Architecture

Inco Lightning brings TEE-based confidential computing to Solana. Launched on Solana Devnet in January 2026, it enables encrypted computation without the latency overhead of pure cryptographic approaches like FHE.

### How Inco Lightning Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │   Solana Program (Anchor)                           │    │
│  │   - Uses encrypted types (Euint128, Ebool)          │    │
│  │   - Performs CPI to Inco Lightning program          │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
├─────────────────────────────────────────────────────────────┤
│                  Inco Lightning Layer                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │   Inco Lightning Program (On-chain)                 │    │
│  │   - Handles encrypted operation requests            │    │
│  │   - Routes to TEE for computation                   │    │
│  │   - Returns encrypted results                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
├─────────────────────────────────────────────────────────────┤
│                      TEE Enclave                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │   Verifiable Compute (TEE)                          │    │
│  │   - Decrypts input values                           │    │
│  │   - Performs computation on plaintext               │    │
│  │   - Encrypts result                                 │    │
│  │   - Provides attestation                            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

The key insight: **encrypted values never exist in plaintext on-chain or in normal memory**. They're only decrypted inside the TEE enclave, processed, and re-encrypted before leaving.

### Encrypted Data Types

Inco Lightning provides encrypted types for Solana programs:

- **Euint128**: 128-bit encrypted unsigned integers
- **Ebool**: Encrypted booleans
- **Eaddress**: Encrypted addresses (for recipient privacy)

These aren't the actual encrypted values—they're 128-bit **handles** that reference encrypted data stored off-chain. The encryption itself happens via the SDK before submission.

```rust
// Rust example using Inco Lightning SDK
use inco_lightning::types::{Euint128, Ebool};
use inco_lightning::cpi::{e_add, e_sub, e_ge, e_select};

// These are handles, not the encrypted values themselves
pub struct PrivateBalance {
    pub encrypted_balance: Euint128,  // Handle to encrypted value
    pub is_active: Ebool,              // Handle to encrypted boolean
}
```

### Encrypted Operations

Inco Lightning supports comprehensive operations on encrypted data:

**Arithmetic Operations** (return `Euint128`):
- Addition: `e_add(a, b)`
- Subtraction: `e_sub(a, b)`
- Multiplication: `e_mul(a, b)`
- Division: `e_div(a, b)`
- Remainder: `e_rem(a, b)`
- Bitwise: `e_and`, `e_or`, `e_xor`
- Shifts: `e_shr`, `e_shl`, `e_rotr`, `e_rotl`

**Comparison Operations** (return `Ebool`):
- Equal: `e_eq(a, b)`
- Not equal: `e_ne(a, b)`
- Greater than: `e_gt(a, b)`
- Less than: `e_lt(a, b)`
- Greater or equal: `e_ge(a, b)`
- Less or equal: `e_le(a, b)`

**Conditional Logic**:
- Select: `e_select(condition, if_true, if_false)`
- Min/Max: `e_min(a, b)`, `e_max(a, b)`

**Random Number Generation**:
- `e_rand()`: Generate encrypted random number
- `e_randBounded(bound)`: Random within encrypted bounds

All operations execute via Cross-Program Invocations (CPI), routing computation through the Inco Lightning program to the TEE.

### Code Example: Private Transfer

Here's a conceptual example of an encrypted transfer using Inco Lightning:

```rust
use anchor_lang::prelude::*;
use inco_lightning::cpi::accounts::Operation;
use inco_lightning::cpi::{e_sub, e_add, e_ge, e_select, new_euint128};
use inco_lightning::types::{Euint128, Ebool};
use inco_lightning::ID as INCO_LIGHTNING_ID;

#[program]
pub mod private_transfer {
    use super::*;

    pub fn transfer(
        ctx: Context<Transfer>,
        encrypted_amount: Euint128,  // Amount to transfer (encrypted)
    ) -> Result<()> {
        // Check if sender has sufficient balance (encrypted comparison)
        let has_sufficient: Ebool = e_ge(
            &ctx.accounts.sender_balance.amount,
            &encrypted_amount,
            // ... CPI accounts
        )?;

        // Zero value for conditional logic
        let zero = new_euint128(0, /* ... */)?;

        // Conditional amount: if sufficient then amount, else 0
        let transfer_amount = e_select(
            &has_sufficient,
            &encrypted_amount,
            &zero,
            // ... CPI accounts
        )?;

        // Subtract from sender (encrypted arithmetic)
        ctx.accounts.sender_balance.amount = e_sub(
            &ctx.accounts.sender_balance.amount,
            &transfer_amount,
            // ... CPI accounts
        )?;

        // Add to recipient (encrypted arithmetic)
        ctx.accounts.recipient_balance.amount = e_add(
            &ctx.accounts.recipient_balance.amount,
            &transfer_amount,
            // ... CPI accounts
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub sender_balance: Account<'info, PrivateBalance>,
    #[account(mut)]
    pub recipient_balance: Account<'info, PrivateBalance>,
    /// CHECK: Inco Lightning program
    #[account(address = INCO_LIGHTNING_ID)]
    pub inco_program: AccountInfo<'info>,
}

#[account]
pub struct PrivateBalance {
    pub owner: Pubkey,
    pub amount: Euint128,  // Encrypted balance
}
```

Notice what's happening: the entire transfer—balance check, conditional logic, arithmetic—operates on encrypted values. The TEE processes the plaintext internally but nothing is exposed on-chain.

### Access Control for Decryption

Inco Lightning implements programmable access control for decryption. Not everyone can decrypt—only authorized parties:

```rust
// Define who can decrypt this encrypted value
pub fn set_decrypt_permission(
    ctx: Context<SetPermission>,
    encrypted_value: Euint128,
    authorized_address: Pubkey,
) -> Result<()> {
    // Grant decryption rights to authorized_address
    // They can now call reveal() on this value
    // ...
    Ok(())
}

// Authorized party decrypts
pub fn reveal_balance(
    ctx: Context<Reveal>,
    encrypted_balance: Euint128,
) -> Result<u128> {
    // Only works if ctx.accounts.authority has permission
    let plaintext = reveal(
        &encrypted_balance,
        &ctx.accounts.authority,
        // ... CPI accounts
    )?;

    Ok(plaintext)
}
```

This enables compliance use cases: a DeFi protocol can grant viewing rights to auditors without exposing balances publicly.

## Inco Lightning vs Inco Atlas: TEE vs FHE

Inco offers two distinct products:

| Feature | Inco Lightning (TEE) | Inco Atlas (FHE/MPC) |
|---------|---------------------|---------------------|
| Technology | Trusted Execution Environments | Fully Homomorphic Encryption + MPC |
| Trust Model | Hardware manufacturer | Cryptographic (mathematical) |
| Latency | Near-zero | Higher (FHE computation overhead) |
| Target Chains | Solana (first), Base | Ethereum, EVM chains |
| Use Case | Speed-critical (DeFi, gaming) | Maximum trustlessness |
| Status | Beta (Devnet) | Launching later 2026 |

**Why TEE for Solana?** Solana's value proposition is speed. With 400ms block times and high throughput expectations, latency matters. FHE's computational overhead—while improving—still introduces meaningful delays. TEE provides encryption benefits without sacrificing Solana's performance characteristics.

**Why FHE for Ethereum?** Ethereum's architecture is more tolerant of higher latency (12-second blocks), and its community often prioritizes trustlessness over speed. For applications where trusting Intel isn't acceptable, Atlas provides a cryptographically pure alternative.

## Privacy Analysis

What does Inco Lightning actually hide?

### What's Protected

- **Amounts**: Fully encrypted using `Euint128`
- **Recipients**: Can be encrypted using `Eaddress`
- **Balances**: Account balances stored as encrypted handles
- **Computation logic**: All operations happen inside the TEE

### What's Visible

- **Transaction existence**: That a transaction occurred is public
- **Encrypted handles**: The ciphertext handles are visible (but meaningless without decryption)
- **Program interactions**: Which programs are called
- **Gas/compute usage**: Transaction resource consumption

### Trust Model Assessment

| Component | Trust Level | Notes |
|-----------|-------------|-------|
| TEE Hardware | High trust required | Intel/AMD manufacturing integrity |
| Attestation Service | Medium trust | Manufacturer-run infrastructure |
| Inco Infrastructure | Medium trust | TEE nodes, key management |
| Solana Validators | Low trust | Don't see plaintext regardless |
| End Users | Protected | Data encrypted client-side |

Compared to other approaches:

| Approach | Trust Dependencies |
|----------|-------------------|
| C-SPL (ElGamal) | Math only (computational hardness) |
| Arcium (MPC) | 2-of-3 node operators |
| Inco Lightning (TEE) | Intel/AMD hardware + Inco infrastructure |
| Pool Mixing | Anonymity set size + operator |

## Use Cases

TEE-based privacy excels in specific scenarios:

### Private Transfers

The most direct use case: transfer tokens without revealing amounts. Unlike C-SPL's homomorphic encryption, TEE can also hide the recipient using `Eaddress`.

### Confidential Voting

DAOs can implement private voting where:
- Vote amounts are encrypted
- Only final tallies are revealed
- Individual votes remain private
- Vote weighting can be verified without exposure

```rust
pub fn cast_vote(
    ctx: Context<Vote>,
    encrypted_vote_weight: Euint128,
    vote_option: u8,  // 0 = against, 1 = for
) -> Result<()> {
    // Add encrypted weight to appropriate tally
    if vote_option == 1 {
        ctx.accounts.proposal.for_votes = e_add(
            &ctx.accounts.proposal.for_votes,
            &encrypted_vote_weight,
            // ...
        )?;
    } else {
        ctx.accounts.proposal.against_votes = e_add(
            &ctx.accounts.proposal.against_votes,
            &encrypted_vote_weight,
            // ...
        )?;
    }
    Ok(())
}
```

### Sealed-Bid Auctions

NFT auctions where bids remain encrypted until reveal:

1. Bidders submit encrypted bids
2. Auction ends, TEE compares all bids
3. Winner determined without revealing losing bids
4. Only winning bid amount optionally disclosed

### Private Gaming

On-chain games with hidden information:
- Poker hands that can't be front-run
- Hidden moves in strategy games
- Private inventories in MMOs
- Fair randomness generation

The speed advantage of TEE makes gaming particularly compelling—sub-second latency enables real-time gameplay.

## Trade-offs and Considerations

### Advantages

**Performance**: Near-zero latency for encrypted operations. TEE processes data at native CPU speed—the encryption/decryption happens at hardware speeds, not cryptographic proof generation speeds.

**Full Encryption**: Both amounts AND recipients can be encrypted. C-SPL encrypts amounts but not recipients. TEE can encrypt arbitrary data types.

**Programmable Access Control**: Fine-grained decryption permissions enable compliance without sacrificing privacy for everyone.

**Developer Experience**: Write normal Rust code. No need to learn specialized circuit languages or proof systems.

### Limitations

**Hardware Trust**: You're trusting Intel, AMD, or ARM. For adversaries at the nation-state level, this may not be acceptable. Hardware backdoors, manufacturing vulnerabilities, or attestation service compromise could theoretically expose data.

**Centralization Vectors**: TEE infrastructure typically runs on specific nodes. While attestation ensures correct code execution, there's still infrastructure to trust.

**Side-Channel Risks**: Historical attacks (Spectre, Foreshadow) demonstrate TEEs aren't invulnerable. Security depends on ongoing firmware updates and mitigation patches.

**Key Management**: Encryption keys must be managed securely. Key compromise would expose data.

### When to Choose TEE

**Choose Inco Lightning (TEE) when:**
- Speed is critical (DeFi trading, gaming, real-time applications)
- Full privacy (amount + recipient) is required
- Hardware trust is acceptable for your threat model
- Developer velocity matters (simpler integration)

**Consider alternatives when:**
- Maximum trustlessness is required (use FHE/MPC)
- Nation-state adversaries are in scope
- You need on-chain verifiability without hardware dependencies
- Long-term data protection is paramount (quantum concerns)

## Comparison with Other Approaches

| Feature | C-SPL (ElGamal) | Arcium (MPC) | Inco Lightning (TEE) |
|---------|-----------------|--------------|---------------------|
| Amount Privacy | Yes | Yes | Yes |
| Recipient Privacy | No | Yes | Yes |
| Trust Model | Math only | 2-of-3 nodes | Hardware |
| Latency | Low | Higher | Near-zero |
| Programmability | Limited | Full | Full |
| Compliance | Auditor keys | Access policies | Programmable |
| Maturity | Production | Beta | Beta |

## Getting Started with Inco Lightning

Inco Lightning is currently in beta on Solana Devnet.

### Installation

```toml
# Cargo.toml
[dependencies]
inco-lightning = { version = "0.1.4", features = ["cpi"] }
```

### Configure Anchor

```toml
# Anchor.toml
[programs.devnet]
your_program = "YOUR_PROGRAM_ID"

[programs.devnet.inco_lightning]
address = "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"
```

### Resources

- **Documentation**: [docs.inco.org/svm/home](https://docs.inco.org/svm/home)
- **Rust SDK**: [docs.inco.org/svm/rust-sdk/overview](https://docs.inco.org/svm/rust-sdk/overview)
- **JavaScript SDK**: For client-side encryption/decryption
- **Program ID**: `5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj` (Devnet)

## Conclusion

Inco Lightning represents a pragmatic approach to privacy on Solana: sacrifice some trustlessness for significant performance gains. By leveraging TEEs, it achieves near-zero latency encrypted computation—fast enough for real-time DeFi and gaming—while providing full encryption for amounts, recipients, and arbitrary data.

The trade-off is clear: you trust hardware manufacturers (Intel, AMD) rather than relying solely on mathematical hardness. For many applications, this is acceptable. For others, cryptographic purity matters more.

In our privacy landscape series, we've now covered:
1. **C-SPL**: Token Extensions with homomorphic encryption (amount privacy, math-only trust)
2. **Arcium**: MPC-based confidential computing (threshold trust, full privacy)
3. **Inco Lightning**: TEE-based encryption (hardware trust, maximum speed)

Each approach has its place. The Solana privacy ecosystem is maturing rapidly, giving developers genuine choices based on their specific requirements.

**Coming next**: How SIP Protocol integrates with these approaches to provide a unified privacy layer—same API, your choice of backend.

---

*This is Part 5 of our Privacy Education Series. For the full landscape overview, see [Solana Privacy Landscape 2026](/blog/solana-privacy-landscape-2026).*

**Sources:**
- [Inco Documentation](https://docs.inco.org/svm/home)
- [a16z Crypto TEE Primer](https://a16zcrypto.com/posts/article/trusted-execution-environments-tees-primer/)
- [Inco Lightning Beta Announcement](https://www.inco.org/blog/inco-lightning-beta-launches-on-solana-devnet)
