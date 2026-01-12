---
title: 'Viewing Keys: Privacy That Passes Compliance'
description: 'How viewing keys enable selective disclosure for auditors while keeping everything else private. Privacy regulators can work with.'
pubDate: 'Jan 12 2026'
category: 'technical'
tags: ['privacy', 'compliance', 'viewing-keys', 'selective-disclosure', 'audit', 'regulation']
draft: false
author: 'SIP Protocol Team'
tldr: 'Viewing keys separate spending rights from viewing rights. You can share a viewing key with an auditor to prove compliance without giving them control of your funds. This enables "privacy that passes compliance."'
keyTakeaways:
  - 'Viewing keys provide read-only access to transaction data'
  - 'Scope can be limited by transaction, time range, or specific auditor'
  - 'Institutions can prove compliance without sacrificing operational privacy'
  - 'This solves the "all-or-nothing" problem of traditional privacy tools'
  - 'SIP viewing keys work across all supported blockchains'
targetAudience: 'Compliance officers, institutional DeFi users, privacy-conscious enterprises'
prerequisites:
  - 'Basic understanding of public key cryptography'
  - 'Awareness of compliance requirements (AML/KYC)'
relatedPosts:
  - 'why-privacy-matters-solana'
  - 'regulatory-landscape-privacy-2026'
  - 'stealth-addresses-eip-5564'
---

The privacy paradox in Web3 is real: full transparency exposes your business operations to competitors, while full anonymity makes you untouchable by regulators. For institutions, this creates an impossible choice. Viewing keys resolve this tension.

## The All-or-Nothing Problem

Traditional privacy in crypto has been binary. You either expose everything or hide everything. Neither works for serious institutional use.

### Transparent Transactions: A Competitive Liability

When your treasury transactions are public, competitors can see:

- Your treasury size and burn rate
- Which protocols you integrate with
- When you're accumulating or selling assets
- Your vendor payments and partnership deals

A public blockchain is a public spreadsheet of your business strategy.

### Full Anonymity: A Compliance Dead End

On the other end, tools like Tornado Cash offered complete anonymity. The problem? Regulators view "complete opacity" as a red flag. Institutions legally cannot use tools that provide no audit path. Compliance officers, auditors, and tax authorities need visibility.

The result: major institutions avoided privacy tools entirely, accepting the competitive disadvantage of full transparency over the regulatory risk of anonymity.

### What Institutions Actually Need

The requirement is not "hide everything" or "show everything." It is selective disclosure:

- **Operational privacy**: Competitors cannot see your strategy
- **Regulatory transparency**: Auditors can verify compliance when required
- **Granular control**: Choose what to reveal, to whom, and for how long

This is exactly what viewing keys provide.

## Viewing Keys: Separating Viewing from Spending

A viewing key is a cryptographic primitive that separates the ability to *see* transaction details from the ability to *control* funds. It is read-only access to your financial data.

### The Key Hierarchy

In SIP Protocol, you have two distinct cryptographic capabilities:

```
Spending Key (Master)
├── Controls funds
├── Signs transactions
└── Must remain secret

Viewing Key (Derived)
├── Reveals transaction details
├── Cannot move funds
└── Can be shared selectively
```

Your spending key never leaves your control. From it, you derive viewing keys that can be shared with specific parties for specific purposes.

### What Viewing Keys Can and Cannot Do

| Capability | Spending Key | Viewing Key |
|-----------|--------------|-------------|
| Send funds | Yes | No |
| Receive funds | Yes | No |
| View transaction amounts | Yes | Yes |
| View sender/recipient addresses | Yes | Yes |
| View transaction timestamps | Yes | Yes |
| Sign new transactions | Yes | No |
| Derive child viewing keys | Yes | Yes* |

*Child viewing keys can only be derived from a parent viewing key if explicitly permitted.

### The Security Model

Sharing a viewing key is like giving someone read access to a specific folder. They can see the contents but cannot modify anything. Even if the viewing key is compromised, your funds remain secure because it cannot authorize any transactions.

## How Viewing Keys Work Under the Hood

SIP Protocol implements viewing keys using industry-standard cryptographic primitives. Understanding the mechanics helps you trust the security properties.

### Key Derivation

Viewing keys are derived from your master key using HMAC-SHA512, following BIP32-style hierarchical derivation:

```typescript
// Simplified derivation logic
childKey = HMAC-SHA512(masterKey, childPath)
// First 32 bytes become the derived key
viewingKey = childKey.slice(0, 32)
```

This provides:

- **One-way derivation**: Cannot compute parent from child
- **Non-correlatable keys**: Different paths produce unrelated keys
- **Hierarchical structure**: Create key trees for organizational use

### Encryption and Decryption

When you create a shielded transaction in "compliant" mode, transaction details are encrypted using XChaCha20-Poly1305:

```typescript
// Transaction data encrypted for viewing key holder
encrypted = {
  ciphertext: XChaCha20-Poly1305.encrypt(
    key: deriveEncryptionKey(viewingKey),
    nonce: random24bytes(),
    plaintext: JSON.stringify({
      sender: "0x...",
      recipient: "0x...",
      amount: "1000",
      timestamp: 1736640000
    })
  ),
  viewingKeyHash: sha256(viewingKey)
}
```

Only someone with the matching viewing key can decrypt and read the transaction details. The `viewingKeyHash` allows verification of which key is needed without revealing the key itself.

### Domain Separation

SIP uses domain separation to ensure keys derived for different purposes cannot be confused:

```
Encryption Key = HKDF-SHA256(
  ikm: viewingKey,
  salt: "SIP-VIEWING-KEY-ENCRYPTION-V1",
  info: derivationPath,
  length: 32
)
```

This prevents a viewing key meant for one purpose from being misused for another.

## Types of Disclosure Scopes

Not all disclosure needs are the same. SIP supports granular scoping to match your exact requirements.

### Transaction-Level Disclosure

Share visibility into a single specific transaction. Useful for dispute resolution or one-time verification.

```typescript
import { generateViewingKey, createScopedKey } from '@sip-protocol/sdk'

// Create a key that reveals only one transaction
const singleTxKey = createScopedKey({
  masterKey: walletViewingKey,
  scope: 'transaction',
  transactionId: 'tx_abc123...',
  expires: new Date('2026-02-01')
})

// Share with counterparty for verification
shareWithCounterparty(singleTxKey)
```

The recipient can verify this specific transaction but learns nothing about your other activity.

### Time-Bounded Disclosure

Financial audits typically cover specific time periods. Create viewing keys that reveal activity within a date range:

```typescript
// Generate viewing key for 2025 tax year
const taxYearKey = generateViewingKey({
  scope: 'time-range',
  timeRange: {
    start: new Date('2025-01-01T00:00:00Z'),
    end: new Date('2025-12-31T23:59:59Z')
  },
  recipient: 'tax-auditor-public-key',
  permissions: ['view-amounts', 'view-counterparties']
})

// Auditor can see 2025 transactions only
// 2024 and 2026 activity remains private
```

When the audit concludes, the key becomes useless for any activity outside the specified window.

### Account-Level Disclosure

For ongoing compliance relationships, grant full visibility into an account:

```typescript
// Full account visibility for compliance department
const complianceKey = generateViewingKey({
  scope: 'account',
  account: treasuryAddress,
  recipient: 'compliance-department-key',
  permissions: ['view-amounts', 'view-counterparties', 'view-metadata']
})
```

This is appropriate for internal audit teams or regulatory bodies with ongoing oversight authority.

### Auditor-Specific Disclosure

Create keys that can only be used by a specific auditor. The key is encrypted to their public key:

```typescript
// Key only usable by specific auditor
const auditorKey = generateViewingKey({
  scope: 'account',
  timeRange: {
    start: new Date('2026-01-01'),
    end: new Date('2026-12-31')
  },
  recipient: 'auditor-firm-public-key',  // Encrypted to their key
  permissions: ['view-amounts', 'view-recipients'],
  revocable: true
})
```

Even if this key leaks, only the intended auditor (holding the corresponding private key) can use it.

## Practical Implementation with SIP SDK

The SIP SDK provides a clean API for working with viewing keys. Here is a complete flow from generation to audit verification.

### Generating and Managing Viewing Keys

```typescript
import {
  generateViewingKey,
  deriveViewingKey,
  encryptForViewing,
  decryptWithViewing
} from '@sip-protocol/sdk'

// Generate master viewing key for your organization
const masterViewingKey = generateViewingKey('m/0')
console.log('Master key path:', masterViewingKey.path)  // "m/0"
console.log('Key hash:', masterViewingKey.hash)  // For identification

// Derive department-specific keys
const treasuryKey = deriveViewingKey(masterViewingKey, 'treasury')
const operationsKey = deriveViewingKey(masterViewingKey, 'operations')

// Key paths reflect hierarchy
console.log(treasuryKey.path)    // "m/0/treasury"
console.log(operationsKey.path)  // "m/0/operations"
```

### Creating Compliant Transactions

```typescript
import { SIP, PrivacyLevel } from '@sip-protocol/sdk'

const sip = new SIP({ network: 'mainnet' })

// Create shielded transaction with viewing key
const intent = await sip.createShieldedIntent({
  input: {
    asset: { chain: 'solana', symbol: 'SOL', decimals: 9 },
    amount: BigInt(1_000_000_000)  // 1 SOL
  },
  output: {
    asset: { chain: 'solana', symbol: 'USDC', decimals: 6 },
    minAmount: BigInt(95_000_000),  // 95 USDC minimum
    maxSlippage: 0.01
  },
  privacy: PrivacyLevel.COMPLIANT,
  viewingKey: treasuryKey
})

// Transaction is private on-chain
// Only treasuryKey holders can decrypt details
```

### Audit Proof Generation and Verification

```typescript
// Organization: Generate proof for auditor
const auditProof = await sip.createAuditProof({
  transactions: ['tx_abc123', 'tx_def456', 'tx_ghi789'],
  viewingKey: treasuryKey,
  includeMetadata: true,
  format: 'standard'  // Industry-standard format
})

// Export for auditor
const proofPackage = {
  proof: auditProof,
  scopedViewingKey: createScopedKey({
    masterKey: treasuryKey,
    scope: 'transaction-set',
    transactionIds: ['tx_abc123', 'tx_def456', 'tx_ghi789'],
    expires: new Date('2026-03-01')
  })
}

// Auditor: Verify the proof
const auditorSIP = new SIP({ network: 'mainnet' })
const verification = await auditorSIP.verifyAuditProof({
  proof: proofPackage.proof,
  viewingKey: proofPackage.scopedViewingKey
})

console.log('Verification result:', verification.valid)
console.log('Transactions verified:', verification.transactionCount)
console.log('Total volume:', verification.aggregateAmount)
```

## Real-World Compliance Use Cases

Viewing keys unlock privacy for institutional scenarios that were previously impossible.

### Tax Reporting

Prove income and capital gains to tax authorities without revealing your full trading strategy:

```typescript
// Create tax-year viewing key
const taxKey = generateViewingKey({
  scope: 'time-range',
  timeRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-12-31')
  },
  recipient: 'tax-authority-key',
  permissions: ['view-amounts', 'view-timestamps']
})

// Generate required reports
const taxReport = await sip.generateTaxReport({
  viewingKey: taxKey,
  format: 'IRS-8949',  // Or jurisdiction-appropriate format
  costBasis: 'FIFO'
})
```

The tax authority sees your reportable transactions. They do not see unrelated activity or counterparty strategies.

### AML/KYC Source of Funds

Prove the legitimate source of funds without exposing your entire history:

```typescript
// Prove specific deposit source
const sourceProof = await sip.proveSourceOfFunds({
  amount: BigInt(100_000_000_000),  // 100 SOL
  viewingKey: kycViewingKey,
  includeChainOfCustody: true
})

// Auditor can verify:
// - Funds originated from verified exchange
// - Chain of custody is unbroken
// - No mixing with flagged addresses
```

### Institutional Trading Audit

Internal compliance teams need visibility without access to execution systems:

```typescript
// Trading desk creates compliant transactions
const trade = await sip.createShieldedIntent({
  // ... trade details
  privacy: PrivacyLevel.COMPLIANT,
  viewingKey: tradingDeskKey
})

// Compliance team holds derived viewing key
const complianceView = deriveViewingKey(tradingDeskKey, 'compliance')

// They can monitor all trades in real-time
// They cannot execute or modify trades
const liveMonitor = await sip.subscribeToTransactions({
  viewingKey: complianceView,
  onTransaction: (tx) => {
    runComplianceChecks(tx)
  }
})
```

### DAO Treasury Transparency

DAOs need member transparency without exposing operational details to competitors:

```typescript
// Treasury multisig creates scoped key for members
const memberViewingKey = generateViewingKey({
  scope: 'account',
  account: daoTreasury,
  recipient: 'dao-members-multisig',
  permissions: ['view-amounts', 'view-categories']
})

// Members can see:
// - Total treasury balance
// - Spending by category (development, marketing, etc.)
// - Large transactions above threshold

// Members cannot see:
// - Specific vendor identities
// - Negotiated rates
// - Strategic partnership details
```

## Comparison with Other Approaches

How do SIP viewing keys compare to alternatives?

### vs. PrivacyCash Selective Disclosure

PrivacyCash (Solana's Tornado-style mixer) added selective disclosure in response to compliance concerns:

| Feature | SIP Viewing Keys | PrivacyCash Selective Disclosure |
|---------|------------------|----------------------------------|
| Granularity | Transaction, time-range, account | Transaction-level only |
| Key derivation | Hierarchical (BIP32-style) | Flat |
| Revocation | Supported | Limited |
| Cross-chain | Yes (chain-agnostic) | Solana only |
| Privacy source | Cryptographic (Pedersen) | Pool anonymity |

SIP provides more granular control and works across all chains. PrivacyCash ties you to Solana and pool-based privacy.

### vs. Full Transparency

Some argue: "If you have nothing to hide, use public blockchains."

| Aspect | Full Transparency | SIP Compliant Mode |
|--------|------------------|-------------------|
| Competitor visibility | Complete | None |
| Regulatory compliance | Automatic | On-demand |
| Operational security | Low | High |
| Strategic advantage | None | Preserved |

Full transparency is not a compliance requirement - it is a competitive surrender.

### vs. Complete Anonymity (Tornado Cash)

Classic Tornado Cash had no disclosure mechanism:

| Aspect | Tornado Cash | SIP Compliant Mode |
|--------|-------------|-------------------|
| Audit capability | None | Full with viewing key |
| Regulatory acceptance | Sanctioned | Designed for compliance |
| Institutional adoption | Impossible | Enabled |

Complete anonymity prevents legitimate institutional use. It is why Tornado was sanctioned and why institutions avoided it.

## Privacy Guarantees for Non-Viewers

What remains hidden when you share a viewing key?

### Cryptographic Guarantees

Without a viewing key (or the spending key), an observer cannot:

- Determine transaction amounts (Pedersen commitment hiding)
- Link transactions to your identity (stealth addresses)
- Correlate multiple transactions (fresh addresses per transaction)
- Derive other viewing keys (one-way HMAC derivation)

These are mathematical guarantees, not policy promises.

### Scoped Key Limitations

A scoped viewing key reveals *only* what you specify:

- Transaction-scoped keys reveal nothing about other transactions
- Time-bounded keys reveal nothing outside the specified range
- Auditor-specific keys are unusable by anyone else

The cryptographic design enforces these boundaries. An auditor with a 2025 viewing key mathematically cannot see 2026 transactions, even if they try.

### Forward Secrecy Considerations

Current SIP viewing keys do not provide forward secrecy by default. If a viewing key is compromised, past transactions encrypted to that key can be decrypted.

Mitigations:

1. **Time-bounded keys**: Rotate keys annually or quarterly
2. **Revocation**: Mark keys as revoked (auditors' systems reject them)
3. **Hierarchical derivation**: Compromise of child does not affect parent

Roadmap item: SIP is researching forward-secret viewing keys using ratchet protocols.

## Implementation Considerations

Deploying viewing keys in production requires careful planning.

### Key Management Best Practices

```typescript
// Recommended: Hierarchical key structure
const orgMasterKey = generateViewingKey('m/org')

// Department keys
const treasuryKey = deriveViewingKey(orgMasterKey, 'treasury')
const operationsKey = deriveViewingKey(orgMasterKey, 'operations')
const complianceKey = deriveViewingKey(orgMasterKey, 'compliance')

// Purpose-specific keys
const taxAuditKey = deriveViewingKey(complianceKey, '2025-tax')
const internalAuditKey = deriveViewingKey(complianceKey, 'internal')

// Store master key with same security as spending keys
// Derived keys can be stored with less stringent requirements
```

### Revocation Mechanisms

For enterprise deployments, implement key revocation:

```typescript
// Maintain revocation list
const revokedKeys = new Set<string>()

// Revoke a compromised key
function revokeViewingKey(viewingKey: ViewingKey) {
  revokedKeys.add(viewingKey.hash)
  // Publish to revocation registry
  publishRevocation(viewingKey.hash)
}

// Check before accepting audit proofs
function isKeyValid(viewingKey: ViewingKey): boolean {
  return !revokedKeys.has(viewingKey.hash)
}
```

### Storage and Backup

- **Master viewing keys**: HSM or secure enclave, same as spending keys
- **Derived viewing keys**: Encrypted at rest, access-controlled
- **Shared viewing keys**: Transmitted over encrypted channels, stored by recipient

Never store viewing keys in:
- Plain text files
- Environment variables
- Version control
- Unencrypted databases

## Conclusion: Privacy AND Compliance

The narrative that privacy and compliance are mutually exclusive is false. Viewing keys prove you can have both:

- **Operational privacy** from competitors and bad actors
- **Selective transparency** for regulators and auditors
- **Granular control** over who sees what and when

For institutions, this transforms privacy from a liability into an asset. You no longer choose between competitive advantage and regulatory acceptance.

SIP Protocol implements viewing keys as a first-class primitive, available across all supported blockchains. Whether you are on Solana, Ethereum, NEAR, or any other chain in our ecosystem, the same viewing key architecture provides the same compliance capabilities.

Privacy that passes compliance is not a compromise. It is the standard institutions have been waiting for.

---

*Ready to implement compliant privacy? Check out our [SDK documentation](https://docs.sip-protocol.org/sdk) or explore the [viewing keys API reference](https://docs.sip-protocol.org/api/viewing-keys).*
