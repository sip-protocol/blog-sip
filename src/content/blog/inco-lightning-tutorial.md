---
title: 'Fast Privacy with Inco Lightning: A Developer Tutorial'
description: 'Complete tutorial for building with Inco Lightning on Solana. Learn encrypted data types, TEE computations, and programmable access control.'
pubDate: 'Jan 12 2026'
category: 'tutorials'
tags: ['tutorial', 'inco', 'tee', 'solana', 'privacy', 'encryption']
draft: false
author: 'SIP Protocol Team'
tldr: 'Use @inco/solana-sdk to encrypt amounts and recipients, perform computations on encrypted data in TEE, and decrypt with access control. ~2 second latency for real-time privacy.'
keyTakeaways:
  - 'encryptValue() encrypts any data type (numbers, buffers, booleans)'
  - 'TEE processes encrypted computations without seeing plaintext'
  - 'Access control policies determine who can decrypt results'
  - 'Arithmetic and comparison operations work on encrypted values'
  - 'React hooks make integration straightforward'
targetAudience: 'Solana developers, dApp builders, privacy engineers'
prerequisites:
  - 'TypeScript/JavaScript proficiency'
  - 'Solana basics (transactions, accounts)'
  - 'Understanding of encryption concepts'
relatedPosts:
  - 'tee-encryption-inco-lightning'
  - 'solana-privacy-landscape-2026'
---

Privacy on Solana has traditionally meant trade-offs. Pool mixing requires waiting. Zero-knowledge proofs demand heavy computation. Multi-party computation adds coordination overhead. What if you could encrypt data and process it in under two seconds?

Inco Lightning brings Trusted Execution Environment (TEE) based privacy to Solana with near-native latency. This tutorial walks you through building confidential applications using the `@inco/solana-sdk`, from basic encryption to complex computations over encrypted data.

## What is Inco Lightning?

Inco Lightning is a confidential computing layer for Solana that uses TEE hardware to process encrypted data. Think of it as a secure vault where computations happen in isolation, with even the server operators unable to see the plaintext.

### Why TEE for Solana Privacy?

Different privacy approaches make different trade-offs:

| Approach | Latency | Trust Model | Use Case |
|----------|---------|-------------|----------|
| Pool Mixing | 5-10s | Anonymity set | Simple transfers |
| MPC | 3-5s | Distributed nodes | Private DeFi |
| ZK Proofs | 5-30s | Mathematical | Maximum privacy |
| TEE (Inco) | ~2s | Hardware | Real-time privacy |

Inco's TEE approach offers the fastest path to privacy because:

1. **No coordination overhead**: Unlike MPC, there are no multi-round protocols between nodes
2. **No heavy computation**: Unlike ZK, there is no proof generation on the client
3. **Instant encryption**: Data encrypts in milliseconds, not seconds

The trade-off is trusting the hardware manufacturer (Intel, AMD) and the TEE implementation. For many applications, this is an acceptable compromise for sub-second privacy.

### What Inco Lightning Enables

With Inco, you can build applications where:

- **Amounts stay hidden**: Transfer tokens without revealing how much
- **Recipients stay private**: Send to addresses that only the sender and receiver know
- **Logic stays confidential**: Execute conditional operations without exposing the conditions
- **Access is programmable**: Define who can decrypt what and when

Let's start building.

## Prerequisites

Before diving in, ensure you have:

**Technical Requirements:**
- Node.js 18+ and npm/pnpm/yarn
- TypeScript knowledge (we will use TypeScript throughout)
- A Solana wallet (Phantom, Solflare, or similar)
- Solana CLI installed (`solana --version`)

**Conceptual Understanding:**
- How Solana transactions and accounts work
- Basic encryption concepts (public/private keys, ciphertext)
- What a TEE does (isolated computation in secure hardware)

**Development Environment:**
```bash
# Verify Solana CLI
solana --version
# Output: solana-cli 1.18.x or higher

# Verify Node.js
node --version
# Output: v18.x.x or higher
```

If you are new to TEE concepts, the core idea is simple: TEE hardware creates an isolated environment where code runs and data exists in a protected enclave. Even if someone has root access to the server, they cannot read the enclave's memory.

## Installation and Setup

### Step 1: Install the SDK

Create a new project and install the Inco SDK:

```bash
mkdir inco-privacy-demo
cd inco-privacy-demo
npm init -y
npm install @inco/solana-sdk @solana/web3.js @coral-xyz/anchor
npm install -D typescript ts-node @types/node
```

Or with pnpm:

```bash
pnpm add @inco/solana-sdk @solana/web3.js @coral-xyz/anchor
pnpm add -D typescript ts-node @types/node
```

### Step 2: Configure TypeScript

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Step 3: Initialize the Inco Client

Create `src/setup.ts`:

```typescript
import { Connection, Keypair, PublicKey } from '@solana/web3.js'

// Solana connection
const connection = new Connection(
  'https://api.devnet.solana.com',
  'confirmed'
)

// Load wallet from file (for development)
// In production, use wallet adapter
import fs from 'fs'
const secretKey = JSON.parse(
  fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, 'utf-8')
)
const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey))

console.log('Connected to Solana Devnet')
console.log('Wallet address:', wallet.publicKey.toString())

export { connection, wallet }
```

### Step 4: Verify Connection

```bash
npx ts-node src/setup.ts
# Output:
# Connected to Solana Devnet
# Wallet address: <your-wallet-address>
```

**Note:** The Inco SDK is currently in beta. API methods may change, and some features are only available on devnet. Always check the official documentation for the latest API.

## Tutorial Part 1: Encrypting Data

The foundation of Inco privacy is the `encryptValue()` function. It takes plaintext values and produces ciphertext that only the TEE can process.

### Basic Encryption

Create `src/encrypt.ts`:

```typescript
import { encryptValue, EncryptionError } from '@inco/solana-sdk/encryption'

async function demonstrateEncryption() {
  // Encrypt a number (amount in lamports)
  const amount = 1_000_000_000n // 1 SOL
  const encryptedAmount = await encryptValue(amount)

  console.log('Original amount:', amount.toString(), 'lamports')
  console.log('Encrypted amount:', encryptedAmount)
  // Output: 0x7f3a2b... (hex-encoded ciphertext)

  // Encrypt a boolean (for conditional logic)
  const isVIP = true
  const encryptedFlag = await encryptValue(isVIP)

  console.log('Original flag:', isVIP)
  console.log('Encrypted flag:', encryptedFlag)

  // Encrypt a smaller number
  const score = 42
  const encryptedScore = await encryptValue(score)

  console.log('Original score:', score)
  console.log('Encrypted score:', encryptedScore)
}

demonstrateEncryption().catch(console.error)
```

### Supported Data Types

The `encryptValue()` function accepts three types:

```typescript
type EncryptableValue = bigint | boolean | number

// Valid examples:
await encryptValue(42)                    // number
await encryptValue(1_000_000_000_000n)    // bigint (for large amounts)
await encryptValue(true)                  // boolean
await encryptValue(0)                     // zero is valid

// Invalid examples (will throw EncryptionError):
await encryptValue(3.14)                  // floating-point not supported
await encryptValue('hello')               // strings not supported
await encryptValue({ amount: 100 })       // objects not supported
await encryptValue(null)                  // null not supported
```

### Error Handling

Always handle encryption errors gracefully:

```typescript
import { encryptValue, EncryptionError } from '@inco/solana-sdk/encryption'

async function safeEncrypt(value: bigint | number | boolean) {
  try {
    const encrypted = await encryptValue(value)
    return { success: true, data: encrypted }
  } catch (error) {
    if (error instanceof EncryptionError) {
      console.error('Encryption failed:', error.message)
      return { success: false, error: error.message }
    }
    throw error // Re-throw unexpected errors
  }
}

// Usage
const result = await safeEncrypt(1000n)
if (result.success) {
  console.log('Encrypted:', result.data)
} else {
  console.log('Failed:', result.error)
}
```

### Encrypting Multiple Values

For batch operations, encrypt multiple values:

```typescript
async function encryptTransferData(
  amount: bigint,
  recipientIndex: number,
  priority: boolean
) {
  const [encAmount, encRecipient, encPriority] = await Promise.all([
    encryptValue(amount),
    encryptValue(recipientIndex),
    encryptValue(priority)
  ])

  return {
    encryptedAmount: encAmount,
    encryptedRecipientIndex: encRecipient,
    encryptedPriority: encPriority
  }
}

// Usage
const transferData = await encryptTransferData(
  5_000_000_000n,  // 5 SOL
  42,               // recipient index in allowlist
  true              // high priority
)
```

## Tutorial Part 2: Building Encrypted Transactions

Now let's use encrypted values in actual Solana transactions.

### Creating an Encrypted Transfer

The Inco SDK provides methods to create transfer instructions with encrypted amounts:

```typescript
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { encryptValue } from '@inco/solana-sdk/encryption'
import { hexToBuffer } from '@inco/solana-sdk/utils'

async function createEncryptedTransfer(
  connection: Connection,
  sender: PublicKey,
  recipient: PublicKey,
  amount: bigint,
  tokenMint: PublicKey
) {
  // Step 1: Encrypt the transfer amount
  const encryptedAmount = await encryptValue(amount)

  // Step 2: Convert to buffer for instruction data
  const amountBuffer = hexToBuffer(encryptedAmount)

  // Step 3: Create the transfer instruction
  // This would use Inco's confidential token program
  const transferInstruction = {
    programId: INCO_CONFIDENTIAL_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: sender, isSigner: true, isWritable: true },
      { pubkey: recipient, isSigner: false, isWritable: true },
      { pubkey: tokenMint, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      Buffer.from([0x01]), // Transfer instruction discriminator
      amountBuffer
    ])
  }

  return transferInstruction
}
```

### Complete Transfer Flow

Here is a complete example showing the full transfer lifecycle:

```typescript
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js'
import { encryptValue } from '@inco/solana-sdk/encryption'

// Program IDs (these are example addresses)
const INCO_PROGRAM_ID = new PublicKey('IncoXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')

async function privateTransfer(
  connection: Connection,
  wallet: Keypair,
  recipientPubkey: PublicKey,
  amountLamports: bigint
) {
  console.log('Starting private transfer...')
  console.log('Amount:', amountLamports.toString(), 'lamports')

  // 1. Encrypt the amount
  const encryptedAmount = await encryptValue(amountLamports)
  console.log('Amount encrypted successfully')

  // 2. Build the transaction
  // Note: Actual instruction format depends on the Inco program
  const transaction = new Transaction()

  // Add Inco confidential transfer instruction
  // This is a simplified example - actual implementation
  // uses the Inco Anchor program IDL
  transaction.add({
    programId: INCO_PROGRAM_ID,
    keys: [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: recipientPubkey, isSigner: false, isWritable: true },
    ],
    data: Buffer.from(encryptedAmount.slice(2), 'hex') // Remove 0x prefix
  })

  // 3. Send the transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [wallet]
  )

  console.log('Transfer complete!')
  console.log('Signature:', signature)

  return signature
}
```

### Using with Anchor Programs

If you are building with Anchor, the integration is cleaner:

```typescript
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { encryptValue } from '@inco/solana-sdk/encryption'
import { hexToBuffer } from '@inco/solana-sdk/utils'

// Assuming you have an Inco-enabled Anchor program
interface ConfidentialTransferAccounts {
  sender: anchor.web3.PublicKey
  recipient: anchor.web3.PublicKey
  senderTokenAccount: anchor.web3.PublicKey
  recipientTokenAccount: anchor.web3.PublicKey
}

async function anchorConfidentialTransfer(
  program: Program,
  amount: bigint,
  accounts: ConfidentialTransferAccounts
) {
  // Encrypt the amount
  const encryptedAmount = await encryptValue(amount)
  const amountBuffer = hexToBuffer(encryptedAmount)

  // Call the program method
  const tx = await program.methods
    .confidentialTransfer(amountBuffer)
    .accounts(accounts)
    .rpc()

  return tx
}
```

## Tutorial Part 3: Decryption with Access Control

Encryption is only half the story. The key question is: who can decrypt the data and when?

### The Attested Decrypt Pattern

Inco uses **attested decryption**, meaning:

1. The user proves ownership via wallet signature
2. The TEE verifies the signature
3. Only authorized parties receive decrypted data

```typescript
import { decrypt } from '@inco/solana-sdk/attested-decrypt'
import { useWallet } from '@solana/wallet-adapter-react'

async function viewEncryptedBalance(
  encryptedBalanceHandle: string,
  wallet: { publicKey: PublicKey, signMessage: (msg: Uint8Array) => Promise<Uint8Array> }
) {
  // Request decryption with wallet signature
  const result = await decrypt(
    [encryptedBalanceHandle], // Array of encrypted value handles
    {
      address: wallet.publicKey,
      signMessage: wallet.signMessage
    }
  )

  // The TEE verifies:
  // 1. The signature is valid
  // 2. The signer owns the encrypted data
  // 3. Access policy allows this decryption

  const decryptedBalance = result.plaintexts[0]
  console.log('Your balance:', decryptedBalance.toString())

  return decryptedBalance
}
```

### Access Control Policies

Inco supports programmable access control, defining who can decrypt:

```typescript
// Define an access policy (conceptual - actual API may vary)
interface AccessPolicy {
  owner: PublicKey           // Primary owner
  allowedViewers: PublicKey[] // Additional authorized parties
  expiry?: Date              // Optional time limit
  conditions?: {
    minAmount?: bigint       // Only reveal if above threshold
    requireMultisig?: boolean // Require multiple signatures
  }
}

// Example: Create a balance with auditor access
async function createAuditableBalance(
  amount: bigint,
  owner: PublicKey,
  auditor: PublicKey
) {
  const encryptedAmount = await encryptValue(amount)

  // Register access policy with the Inco program
  // The TEE enforces this policy on decryption
  const policy: AccessPolicy = {
    owner,
    allowedViewers: [auditor],
    expiry: new Date('2026-12-31')
  }

  // Policy is stored on-chain, encrypted amounts reference it
  return { encryptedAmount, policy }
}
```

### Signature-Based Decryption Flow

Here is the complete flow for signature-based decryption:

```typescript
async function fullDecryptionFlow(
  encryptedHandle: string,
  wallet: WalletAdapter
) {
  // Step 1: Create the message to sign
  const message = new TextEncoder().encode(
    `Decrypt request for handle: ${encryptedHandle}\nTimestamp: ${Date.now()}`
  )

  // Step 2: Sign with wallet
  const signature = await wallet.signMessage(message)

  // Step 3: Request decryption
  const result = await decrypt(
    [encryptedHandle],
    {
      address: wallet.publicKey,
      signMessage: async (msg) => signature // Pre-signed
    }
  )

  // Step 4: Handle the result
  if (result.plaintexts.length > 0) {
    return {
      success: true,
      value: result.plaintexts[0],
      // For on-chain verification
      attestation: result.ed25519Instructions
    }
  }

  return { success: false, error: 'Decryption failed' }
}
```

### On-Chain Verification

For use cases requiring on-chain proof of decryption, use the attestation instructions:

```typescript
import { Transaction } from '@solana/web3.js'

async function verifiedDecryption(
  encryptedHandle: string,
  wallet: WalletAdapter,
  connection: Connection
) {
  const result = await decrypt(
    [encryptedHandle],
    {
      address: wallet.publicKey,
      signMessage: wallet.signMessage
    }
  )

  // Build transaction with attestation
  const transaction = new Transaction()

  // Add Ed25519 signature verification instruction
  // This proves the TEE attested the decryption
  if (result.ed25519Instructions) {
    transaction.add(...result.ed25519Instructions)
  }

  // Add your program instruction that uses the decrypted value
  transaction.add(
    yourProgram.instruction.useVerifiedValue(
      result.plaintexts[0],
      { /* accounts */ }
    )
  )

  return transaction
}
```

## Tutorial Part 4: Encrypted Computations

The most powerful feature of TEE-based privacy is computing over encrypted data without decryption.

### Arithmetic Operations

The TEE can perform math on encrypted values:

```typescript
// Note: These operations are processed by the TEE
// The client never sees intermediate plaintext values

// Conceptual API for encrypted arithmetic
interface EncryptedOperations {
  add(a: string, b: string): Promise<string>
  subtract(a: string, b: string): Promise<string>
  multiply(a: string, scalar: number): Promise<string>
  divide(a: string, divisor: number): Promise<string>
}

async function demonstrateArithmetic() {
  const balance1 = await encryptValue(1000n)
  const balance2 = await encryptValue(500n)

  // Add two encrypted balances
  // Result is encrypted - TEE never reveals plaintext
  const sum = await incoOps.add(balance1, balance2)
  // sum represents encrypted(1500), not 1500

  // Multiply by scalar (useful for fees, percentages)
  const doubled = await incoOps.multiply(balance1, 2)
  // doubled represents encrypted(2000)

  return { sum, doubled }
}
```

### Comparison Operations

Compare encrypted values without revealing them:

```typescript
async function demonstrateComparisons() {
  const userBalance = await encryptValue(1000n)
  const minimumRequired = await encryptValue(500n)

  // Greater than comparison - returns encrypted boolean
  const hasSufficient = await incoOps.greaterThan(userBalance, minimumRequired)
  // hasSufficient is encrypted(true)

  // Equality check
  const targetAmount = await encryptValue(1000n)
  const isExact = await incoOps.equals(userBalance, targetAmount)
  // isExact is encrypted(true)

  // Less than or equal
  const maxAmount = await encryptValue(10000n)
  const withinLimit = await incoOps.lessThanOrEqual(userBalance, maxAmount)
  // withinLimit is encrypted(true)

  return { hasSufficient, isExact, withinLimit }
}
```

### Conditional Logic

Use encrypted booleans for branching:

```typescript
// Select between two values based on encrypted condition
async function conditionalSelect(
  condition: string,      // encrypted boolean
  valueIfTrue: string,    // encrypted value
  valueIfFalse: string    // encrypted value
): Promise<string> {
  // TEE evaluates: condition ? valueIfTrue : valueIfFalse
  // All values remain encrypted throughout
  return await incoOps.select(condition, valueIfTrue, valueIfFalse)
}

// Practical example: tiered pricing
async function calculateTieredPrice(
  quantity: bigint,
  isVIP: boolean
) {
  const encQuantity = await encryptValue(quantity)
  const encIsVIP = await encryptValue(isVIP)

  const regularPrice = await incoOps.multiply(encQuantity, 100) // 100 per unit
  const vipPrice = await incoOps.multiply(encQuantity, 80)      // 80 per unit (20% discount)

  // Select based on encrypted VIP status
  const finalPrice = await incoOps.select(encIsVIP, vipPrice, regularPrice)

  return finalPrice // Encrypted final price
}
```

## Tutorial Part 5: Building a Private Voting System

Let us build a complete example: a private voting system where votes are encrypted and tallied without revealing individual choices.

### The Contract Design

```typescript
// Vote submission - all values encrypted
interface EncryptedVote {
  choice: string      // encrypted choice (0, 1, 2, etc.)
  weight: string      // encrypted voting weight
  timestamp: number   // public timestamp
}

// Tally state - computed in TEE
interface EncryptedTally {
  option0Count: string  // encrypted vote count for option 0
  option1Count: string  // encrypted vote count for option 1
  totalWeight: string   // encrypted total weight
}
```

### Submitting Encrypted Votes

```typescript
import { encryptValue } from '@inco/solana-sdk/encryption'
import { Program } from '@coral-xyz/anchor'

async function submitEncryptedVote(
  program: Program,
  proposalId: PublicKey,
  choice: number,      // 0 or 1
  votingPower: bigint,
  voter: PublicKey
) {
  // Encrypt the vote choice
  const encryptedChoice = await encryptValue(choice)

  // Encrypt the voting power
  const encryptedWeight = await encryptValue(votingPower)

  // Submit to the on-chain program
  const tx = await program.methods
    .submitVote({
      encryptedChoice,
      encryptedWeight
    })
    .accounts({
      proposal: proposalId,
      voter,
      voterTokenAccount: await getTokenAccount(voter)
    })
    .rpc()

  console.log('Vote submitted:', tx)
  console.log('Choice and weight remain encrypted')

  return tx
}
```

### Tallying Votes

The TEE aggregates encrypted votes:

```typescript
async function tallyVotes(
  program: Program,
  proposalId: PublicKey,
  authority: Keypair
) {
  // Request TEE to compute tally over all encrypted votes
  // This happens in the secure enclave
  const tallyTx = await program.methods
    .computeTally()
    .accounts({
      proposal: proposalId,
      authority: authority.publicKey
    })
    .signers([authority])
    .rpc()

  console.log('Tally computed in TEE:', tallyTx)

  // The tally result is still encrypted on-chain
  // Only authorized parties can decrypt it
  return tallyTx
}
```

### Revealing Results

Only authorized parties can reveal the final tally:

```typescript
async function revealResults(
  program: Program,
  proposalId: PublicKey,
  authority: WalletAdapter
) {
  // Fetch encrypted tally from chain
  const proposal = await program.account.proposal.fetch(proposalId)
  const encryptedTally = proposal.encryptedTally

  // Decrypt with authority signature
  const result = await decrypt(
    [encryptedTally.option0Count, encryptedTally.option1Count],
    {
      address: authority.publicKey,
      signMessage: authority.signMessage
    }
  )

  const [option0Votes, option1Votes] = result.plaintexts

  console.log('Final Results:')
  console.log('Option 0:', option0Votes.toString(), 'votes')
  console.log('Option 1:', option1Votes.toString(), 'votes')

  // Publish results on-chain with attestation
  const revealTx = await program.methods
    .publishResults({
      option0Votes,
      option1Votes,
      attestation: result.ed25519Instructions
    })
    .accounts({ proposal: proposalId })
    .rpc()

  return { option0Votes, option1Votes, revealTx }
}
```

## Tutorial Part 6: React Integration

Building a frontend? Here is how to integrate Inco with React and the Solana wallet adapter.

### Custom Hook: useIncoPrivacy

```typescript
// hooks/useIncoPrivacy.ts
import { useState, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { encryptValue, EncryptionError } from '@inco/solana-sdk/encryption'
import { decrypt } from '@inco/solana-sdk/attested-decrypt'

interface UseIncoPrivacyReturn {
  encrypt: (value: bigint | number | boolean) => Promise<string | null>
  decryptHandle: (handle: string) => Promise<bigint | null>
  balance: bigint | null
  loading: boolean
  error: string | null
}

export function useIncoPrivacy(): UseIncoPrivacyReturn {
  const { publicKey, signMessage } = useWallet()
  const { connection } = useConnection()

  const [balance, setBalance] = useState<bigint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const encrypt = useCallback(async (
    value: bigint | number | boolean
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      const encrypted = await encryptValue(value)
      return encrypted
    } catch (e) {
      if (e instanceof EncryptionError) {
        setError(e.message)
      } else {
        setError('Encryption failed')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const decryptHandle = useCallback(async (
    handle: string
  ): Promise<bigint | null> => {
    if (!publicKey || !signMessage) {
      setError('Wallet not connected')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const result = await decrypt([handle], {
        address: publicKey,
        signMessage
      })

      const value = result.plaintexts[0]
      return value
    } catch (e) {
      setError('Decryption failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [publicKey, signMessage])

  return {
    encrypt,
    decryptHandle,
    balance,
    loading,
    error
  }
}
```

### Private Balance Component

```typescript
// components/PrivateBalance.tsx
import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useIncoPrivacy } from '../hooks/useIncoPrivacy'

interface PrivateBalanceProps {
  encryptedBalanceHandle: string
}

export function PrivateBalance({ encryptedBalanceHandle }: PrivateBalanceProps) {
  const { connected } = useWallet()
  const { decryptHandle, loading, error } = useIncoPrivacy()

  const [revealed, setRevealed] = useState(false)
  const [balance, setBalance] = useState<bigint | null>(null)

  const handleReveal = async () => {
    if (!connected) return

    const decrypted = await decryptHandle(encryptedBalanceHandle)
    if (decrypted !== null) {
      setBalance(decrypted)
      setRevealed(true)
    }
  }

  const formatBalance = (lamports: bigint): string => {
    return (Number(lamports) / 1_000_000_000).toFixed(4)
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Private Balance</h3>

      {!connected && (
        <p className="text-gray-500">Connect wallet to view</p>
      )}

      {connected && !revealed && (
        <button
          onClick={handleReveal}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Decrypting...' : 'Reveal Balance'}
        </button>
      )}

      {revealed && balance !== null && (
        <div>
          <p className="text-2xl font-bold">{formatBalance(balance)} SOL</p>
          <button
            onClick={() => setRevealed(false)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Hide
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-500 mt-2">{error}</p>
      )}
    </div>
  )
}
```

### Private Transfer Component

```typescript
// components/PrivateTransfer.tsx
import { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { useIncoPrivacy } from '../hooks/useIncoPrivacy'

export function PrivateTransfer() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { encrypt, loading, error } = useIncoPrivacy()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleTransfer = async () => {
    if (!publicKey) return

    try {
      setStatus('Encrypting amount...')

      // Parse and encrypt the amount
      const lamports = BigInt(parseFloat(amount) * 1_000_000_000)
      const encryptedAmount = await encrypt(lamports)

      if (!encryptedAmount) {
        setStatus('Encryption failed')
        return
      }

      setStatus('Building transaction...')

      // Build the transaction (simplified)
      const recipientPubkey = new PublicKey(recipient)
      const tx = new Transaction()

      // Add your Inco transfer instruction here
      // tx.add(...)

      setStatus('Sending transaction...')

      const signature = await sendTransaction(tx, connection)
      await connection.confirmTransaction(signature)

      setStatus(`Transfer complete: ${signature}`)
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="p-4 border rounded-lg max-w-md">
      <h3 className="text-lg font-semibold mb-4">Private Transfer</h3>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Recipient address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Amount (SOL)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <button
          onClick={handleTransfer}
          disabled={loading || !recipient || !amount}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Send Privately'}
        </button>

        {status && (
          <p className="text-sm text-gray-600 break-all">{status}</p>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}
```

## Error Handling and Best Practices

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `EncryptionError: Cannot encrypt null` | Passing null/undefined | Validate inputs before encrypting |
| `EncryptionError: Floating-point not supported` | Using decimals | Convert to lamports (integer) first |
| `Decryption failed` | Invalid signature or unauthorized | Ensure wallet is connected and authorized |
| `Connection timeout` | Network issues | Retry with exponential backoff |
| `Insufficient funds` | Transaction fee shortage | Add SOL for fees |

### Input Validation

Always validate before encrypting:

```typescript
function validateAndEncrypt(value: unknown): Promise<string> {
  // Type check
  if (typeof value !== 'bigint' && typeof value !== 'number' && typeof value !== 'boolean') {
    throw new Error(`Invalid type: ${typeof value}. Expected bigint, number, or boolean.`)
  }

  // Range check for numbers
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new Error('Floating-point numbers not supported. Use integers.')
    }
    if (value < 0) {
      throw new Error('Negative numbers not supported.')
    }
  }

  // BigInt range check
  if (typeof value === 'bigint' && value < 0n) {
    throw new Error('Negative numbers not supported.')
  }

  return encryptValue(value)
}
```

### Retry Logic

Network operations can fail. Implement retries:

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.warn(`Attempt ${attempt} failed:`, error)

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }
  }

  throw lastError
}

// Usage
const encrypted = await withRetry(() => encryptValue(1000n))
```

### Caching Encrypted Values

If you are encrypting the same value multiple times, cache it:

```typescript
const encryptionCache = new Map<string, string>()

async function cachedEncrypt(value: bigint | number | boolean): Promise<string> {
  const key = String(value)

  if (encryptionCache.has(key)) {
    return encryptionCache.get(key)!
  }

  const encrypted = await encryptValue(value)
  encryptionCache.set(key, encrypted)

  return encrypted
}
```

**Note:** Only cache if values do not need to be unique. For sensitive operations like transfers, always encrypt fresh.

## Performance Considerations

### Latency Expectations

| Operation | Typical Latency |
|-----------|-----------------|
| `encryptValue()` | 50-100ms |
| `decrypt()` | 200-500ms |
| TEE computation | 1-2s |
| Full transaction | 2-4s |

### Optimizing for Speed

**Batch Encryptions:**
```typescript
// Instead of sequential encryption
for (const value of values) {
  results.push(await encryptValue(value)) // Slow
}

// Use parallel encryption
const results = await Promise.all(
  values.map(v => encryptValue(v))
)
```

**Prefetch and Cache:**
```typescript
// Prefetch encrypted balances when user navigates to page
useEffect(() => {
  if (publicKey) {
    prefetchEncryptedBalance(publicKey)
  }
}, [publicKey])
```

**Lazy Decryption:**
```typescript
// Only decrypt when user explicitly requests
// Don't auto-decrypt on page load
```

### Memory Considerations

TEE operations can be memory-intensive on the server side. For client applications:

- Avoid keeping many encrypted values in state
- Clear caches when components unmount
- Use pagination for large lists of encrypted data

## Next Steps

You now have the foundation for building privacy-preserving applications with Inco Lightning. Here are paths to explore:

### Further Learning

1. **Confidential SPL Tokens**: Build a private token with hidden balances
2. **Private Auctions**: Implement sealed-bid auctions where bids are encrypted
3. **Confidential DeFi**: Create a swap where amounts are hidden from MEV bots
4. **Access Control Patterns**: Design complex permission systems

### Advanced Topics

- **Composing TEE with ZK**: Use ZK proofs for public verification, TEE for fast computation
- **Cross-chain Privacy**: Bridge encrypted assets between Solana and other chains
- **Compliance Integration**: Add viewing key patterns for auditor access

### Resources

- **Inco Documentation**: [docs.inco.org/svm/home](https://docs.inco.org/svm/home)
- **Solana Cookbook**: [solanacookbook.com](https://solanacookbook.com)
- **SIP Protocol**: For cryptographic privacy alternatives

### Beta Status Notice

The Inco SDK is in beta. Before production deployment:

1. Check for API changes in the official documentation
2. Test thoroughly on devnet before mainnet
3. Monitor the Inco Discord/Twitter for updates
4. Consider fallback mechanisms if the TEE is unavailable

## Conclusion

Inco Lightning brings a new paradigm to Solana privacy: fast, programmable, and practical. By leveraging TEE hardware, you get sub-two-second privacy without the computational overhead of ZK proofs or the coordination delays of MPC.

The key concepts to remember:

- **`encryptValue()`** encrypts numbers, bigints, and booleans for TEE processing
- **Attested decryption** ensures only authorized parties can view plaintext
- **TEE computations** enable arithmetic and logic on encrypted data
- **Access control** is programmable and enforced by the secure enclave

The trade-off is trusting the hardware. For applications where TEE trust is acceptable, Inco offers the fastest path to privacy on Solana.

Privacy is not just a feature. It is a fundamental property that enables new kinds of applications, from confidential voting to MEV-resistant trading. With tools like Inco Lightning, building these applications is now within reach for any Solana developer.

---

*This is Part 13 of our Privacy Education Series. For cryptographic alternatives that do not rely on hardware trust, see our series on Pedersen commitments and stealth addresses.*
