---
title: 'Integrating PrivacyCash Into Your Solana dApp'
description: 'Complete tutorial for adding PrivacyCash privacy features to your Solana dApp. Learn deposit, withdrawal, and compliance features.'
pubDate: 'Jan 12 2026'
category: 'tutorials'
tags: ['tutorial', 'privacycash', 'solana', 'dapp', 'privacy', 'integration']
draft: false
author: 'SIP Protocol Team'
series: 'privacy-education'
seriesNumber: 11
tldr: 'Install @privacycash/sdk, generate commitments for deposits, save notes securely, and withdraw with ZK proofs. Includes React hooks and compliance features.'
keyTakeaways:
  - 'PrivacyCash uses pool mixing with ZK proofs for unlinkable transfers'
  - 'Notes must be saved securely - they are required for withdrawal'
  - 'Relayers submit withdrawals to avoid linking sender to recipient'
  - 'Selective disclosure enables compliance without full transparency'
  - 'React integration with wallet adapters is straightforward'
targetAudience: 'Solana dApp developers, DeFi builders, privacy-focused projects'
prerequisites:
  - 'Solana development basics'
  - 'React and wallet adapter experience'
  - 'Understanding of pool mixing (see related article)'
relatedPosts:
  - 'understanding-pool-mixing-solana'
  - 'solana-privacy-landscape-2026'
---

Adding privacy to your Solana dApp is no longer a luxury — it is becoming an expectation. Users want control over their financial data, and regulations increasingly require selective disclosure capabilities. PrivacyCash provides a battle-tested foundation for adding pool-based privacy to your application.

This tutorial walks you through integrating PrivacyCash from scratch. By the end, you will have working deposit, withdrawal, and compliance features in your Solana dApp.

## Prerequisites

Before we begin, ensure you have the following:

**Development Environment:**
- Node.js 18+ installed
- Familiarity with TypeScript
- Solana CLI tools (optional but helpful)
- A Solana wallet with devnet SOL

**Knowledge Requirements:**
- Basic understanding of Solana transactions and PDAs
- Experience with React and hooks
- Familiarity with wallet adapters (`@solana/wallet-adapter-react`)

If you are new to pool mixing concepts, read our companion article "Understanding Pool Mixing: How PrivacyCash Works" first. It explains the cryptographic foundations that make this integration possible.

**What You Will Build:**
1. A basic PrivacyCash client setup
2. Deposit flow with commitment generation
3. Withdrawal flow with ZK proof generation
4. Private balance tracking
5. Compliance features (selective disclosure)
6. A complete React hook for your dApp

## PrivacyCash Overview

PrivacyCash brings Tornado Cash-style privacy to Solana. The protocol operates through a deployed Solana program that manages commitment trees, nullifier registries, and token escrows.

### Core Concepts

**Commitments:** When you deposit, you generate a cryptographic commitment from a secret nullifier and random value. This commitment is added to a Merkle tree on-chain.

**Notes:** Your deposit proof — containing the nullifier and secret — is stored off-chain. Lose it, and you lose your funds. There is no recovery mechanism.

**Nullifiers:** Revealed during withdrawal to prevent double-spending. Once a nullifier is used, that deposit is considered spent.

**ZK Proofs:** When withdrawing, you generate a zero-knowledge proof that demonstrates you made a valid deposit without revealing which deposit is yours.

### Program Details

PrivacyCash operates through the following on-chain program:

```
Program ID: 9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD
```

The program manages:
- Merkle tree state for tracking all commitments
- Nullifier registry preventing double-spends
- Token escrow accounts holding deposited assets
- Proof verification for withdrawal transactions

## Installation

Start by installing the required dependencies:

```bash
npm install @privacycash/sdk @solana/web3.js @solana/wallet-adapter-react
```

Or with pnpm:

```bash
pnpm add @privacycash/sdk @solana/web3.js @solana/wallet-adapter-react
```

For TypeScript projects, the SDK includes type definitions — no separate `@types` package needed.

### Package Structure

The `@privacycash/sdk` exports several key classes and utilities:

```typescript
import {
  PrivacyCash,           // Main client class
  Note,                  // Note type for deposit proofs
  Commitment,            // Commitment type
  PoolStats,             // Pool statistics type
  SelectiveDisclosure,   // Compliance disclosure type
  PrivacyCashError,      // Error class for handling failures
} from '@privacycash/sdk'
```

## Part 1: Basic Setup

Let us start by initializing the PrivacyCash client with a Solana connection.

```typescript
import { PrivacyCash } from '@privacycash/sdk'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'

// For devnet development
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

// For mainnet production
// const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')

// Initialize the PrivacyCash client
const privacyCash = new PrivacyCash({
  connection,
  programId: new PublicKey('9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD')
})
```

### Configuration Options

The PrivacyCash constructor accepts several configuration options:

```typescript
const privacyCash = new PrivacyCash({
  connection,
  programId: new PublicKey('9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD'),

  // Optional: Custom relayer endpoint
  relayerUrl: 'https://relayer.privacycash.io',

  // Optional: Commitment level for transactions
  commitment: 'confirmed',

  // Optional: Enable debug logging
  debug: process.env.NODE_ENV === 'development',
})
```

### Checking Pool Status

Before integrating, verify the protocol is accessible and check pool statistics:

```typescript
async function checkPoolStatus() {
  try {
    // Check if the program is accessible
    const programInfo = await connection.getAccountInfo(
      new PublicKey('9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD')
    )

    if (!programInfo) {
      throw new Error('PrivacyCash program not found')
    }

    // Get pool statistics
    const stats = await privacyCash.getPoolStats('SOL')

    console.log('Pool Statistics:')
    console.log(`  Total deposits: ${stats.totalDeposits}`)
    console.log(`  Anonymity set: ${stats.anonymitySetSize}`)
    console.log(`  TVL: ${stats.tvl / 1e9} SOL`)
    console.log(`  Supported tokens: ${stats.supportedTokens.join(', ')}`)

    return stats
  } catch (error) {
    console.error('Failed to check pool status:', error)
    throw error
  }
}
```

## Part 2: Deposit Flow

Depositing into PrivacyCash involves generating a commitment and submitting a deposit transaction. The commitment is stored on-chain in a Merkle tree, while you keep the note privately.

### Step 1: Generate Commitment

```typescript
import { Note } from '@privacycash/sdk'

async function generateCommitment(amountLamports: bigint, token: string = 'SOL') {
  // Generate commitment and note
  const { commitment, note } = await privacyCash.createCommitment({
    amount: amountLamports,
    token,
  })

  // CRITICAL: The note contains your nullifier and secret
  // Without it, your funds are UNRECOVERABLE
  console.log('Generated commitment:', commitment)
  console.log('SAVE THIS NOTE SECURELY:', note.toString())

  return { commitment, note }
}
```

### Step 2: Execute Deposit Transaction

```typescript
import { useWallet } from '@solana/wallet-adapter-react'

async function executeDeposit(
  amountLamports: bigint,
  wallet: WalletContextState
) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected')
  }

  // Step 1: Generate the commitment
  const { commitment, note } = await privacyCash.createCommitment({
    amount: amountLamports,
    token: 'SOL',
  })

  // Step 2: Build the deposit transaction
  const depositTx = await privacyCash.deposit({
    commitment,
    amount: amountLamports,
    wallet: wallet.publicKey,
  })

  // Step 3: Sign and send the transaction
  const signedTx = await wallet.signTransaction(depositTx)
  const signature = await connection.sendRawTransaction(signedTx.serialize())

  // Step 4: Confirm the transaction
  const confirmation = await connection.confirmTransaction(signature, 'confirmed')

  if (confirmation.value.err) {
    throw new Error(`Deposit failed: ${confirmation.value.err}`)
  }

  console.log(`Deposit successful! Signature: ${signature}`)
  console.log(`IMPORTANT: Save your note for withdrawal`)

  return {
    signature,
    commitment,
    note,  // MUST be saved securely
  }
}
```

### Complete Deposit Example

Here is a full deposit implementation with error handling:

```typescript
interface DepositResult {
  signature: string
  commitment: string
  note: Note
  timestamp: number
}

async function deposit(
  amountSol: number,
  wallet: WalletContextState
): Promise<DepositResult> {
  // Validate inputs
  if (amountSol <= 0) {
    throw new Error('Amount must be positive')
  }

  if (!wallet.connected || !wallet.publicKey) {
    throw new Error('Wallet not connected')
  }

  const amountLamports = BigInt(Math.floor(amountSol * 1e9))

  // Check wallet balance
  const balance = await connection.getBalance(wallet.publicKey)
  const estimatedFee = 10_000_000n  // ~0.01 SOL for transaction fees

  if (BigInt(balance) < amountLamports + estimatedFee) {
    throw new Error(`Insufficient balance. Need ${amountSol + 0.01} SOL`)
  }

  try {
    // Generate commitment
    const { commitment, note } = await privacyCash.createCommitment({
      amount: amountLamports,
      token: 'SOL',
    })

    // Build and send deposit transaction
    const depositTx = await privacyCash.deposit({
      commitment,
      amount: amountLamports,
      wallet: wallet.publicKey,
    })

    // Recent blockhash for transaction
    const { blockhash } = await connection.getLatestBlockhash()
    depositTx.recentBlockhash = blockhash
    depositTx.feePayer = wallet.publicKey

    // Sign and send
    const signedTx = await wallet.signTransaction!(depositTx)
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    })

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed')

    return {
      signature,
      commitment,
      note,
      timestamp: Date.now(),
    }
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for deposit and fees')
      }
      if (error.message.includes('blockhash')) {
        throw new Error('Transaction expired. Please try again.')
      }
    }
    throw error
  }
}
```

## Part 3: Withdrawal Flow

Withdrawing from PrivacyCash involves generating a zero-knowledge proof that demonstrates you made a valid deposit without revealing which one. The withdrawal goes to a fresh address, breaking the on-chain link.

### Step 1: Prepare Withdrawal

```typescript
import { Keypair } from '@solana/web3.js'

async function prepareWithdrawal(note: Note) {
  // Check if the note has already been spent
  const isSpent = await privacyCash.isNoteSpent(note)
  if (isSpent) {
    throw new Error('This note has already been spent')
  }

  // Check optimal withdrawal timing
  const timing = await privacyCash.getOptimalWithdrawalTiming({
    depositTimestamp: note.timestamp,
    targetAnonymitySet: 500,
  })

  console.log(`Current anonymity set: ${timing.currentAnonymitySet}`)
  console.log(`Recommended wait: ${timing.minimumWait} hours`)
  console.log(`Optimal withdrawal time: ${new Date(timing.optimalTime)}`)

  if (timing.currentAnonymitySet < 100) {
    console.warn('WARNING: Low anonymity set. Consider waiting longer.')
  }

  return timing
}
```

### Step 2: Execute Withdrawal

```typescript
async function executeWithdrawal(
  note: Note,
  recipientPublicKey: PublicKey,
  relayerFee: bigint = 10_000_000n  // 0.01 SOL default
) {
  // Build withdrawal transaction with ZK proof
  // The SDK generates the proof automatically
  const withdrawTx = await privacyCash.withdraw({
    note,
    recipient: recipientPublicKey,
    relayerFee,
  })

  // Withdrawals use relayers to avoid linking sender wallet to recipient
  // The relayer submits the transaction and receives the fee
  const signature = await privacyCash.submitViaRelayer(withdrawTx)

  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed')

  console.log(`Withdrawal successful! Signature: ${signature}`)
  console.log(`Recipient: ${recipientPublicKey.toString()}`)

  return signature
}
```

### Why Use Relayers?

A critical privacy consideration: if you withdraw to a fresh address that has no SOL, how do you pay for transaction fees? Using your original wallet to pay would link the deposit and withdrawal.

Relayers solve this:

```
Without Relayer:
  Your Wallet ──── pays fee ────> Fresh Address
  (Privacy broken: wallets are linked)

With Relayer:
  You ─── proof + recipient ───> Relayer
  Relayer ─── submits tx ───> Solana
  Contract ─── (amount - fee) ───> Fresh Address
  Contract ─── fee ───> Relayer
  (Privacy preserved: no wallet link)
```

### Complete Withdrawal Example

```typescript
interface WithdrawalResult {
  signature: string
  recipient: string
  amount: bigint
  fee: bigint
}

async function withdraw(
  note: Note,
  recipient?: PublicKey,  // Optional: generate fresh if not provided
  maxRelayerFee: bigint = 20_000_000n  // Max 0.02 SOL
): Promise<WithdrawalResult> {
  // Validate note is unspent
  const isSpent = await privacyCash.isNoteSpent(note)
  if (isSpent) {
    throw new Error('Note has already been spent')
  }

  // Generate fresh recipient if not provided
  const recipientKey = recipient || Keypair.generate().publicKey

  // Check current relayer fee
  const relayerInfo = await privacyCash.getRelayerInfo()
  if (relayerInfo.fee > maxRelayerFee) {
    throw new Error(`Relayer fee too high: ${relayerInfo.fee} lamports`)
  }

  try {
    // Build withdrawal transaction
    // This generates the ZK proof internally
    console.log('Generating ZK proof... (this may take a few seconds)')

    const withdrawTx = await privacyCash.withdraw({
      note,
      recipient: recipientKey,
      relayerFee: relayerInfo.fee,
    })

    // Submit via relayer
    const signature = await privacyCash.submitViaRelayer(withdrawTx)

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed')

    if (confirmation.value.err) {
      throw new Error(`Withdrawal failed: ${confirmation.value.err}`)
    }

    // Calculate actual received amount
    const receivedAmount = note.amount - relayerInfo.fee

    return {
      signature,
      recipient: recipientKey.toString(),
      amount: receivedAmount,
      fee: relayerInfo.fee,
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('nullifier')) {
        throw new Error('Note already spent or invalid')
      }
      if (error.message.includes('merkle')) {
        throw new Error('Invalid commitment proof')
      }
    }
    throw error
  }
}
```

## Part 4: Checking Private Balance

Since deposits are private, you cannot query a public ledger for balances. Instead, you track your balance locally using your saved notes.

```typescript
interface PrivateBalance {
  total: bigint
  spendable: bigint
  pending: bigint
  notes: Note[]
}

async function getPrivateBalance(notes: Note[]): Promise<PrivateBalance> {
  // Filter out spent notes
  const noteStatuses = await Promise.all(
    notes.map(async (note) => ({
      note,
      isSpent: await privacyCash.isNoteSpent(note),
    }))
  )

  const unspentNotes = noteStatuses
    .filter(({ isSpent }) => !isSpent)
    .map(({ note }) => note)

  // Calculate totals
  const total = unspentNotes.reduce((sum, note) => sum + note.amount, 0n)

  // Check which notes have sufficient anonymity for safe withdrawal
  const safeNotes = await Promise.all(
    unspentNotes.map(async (note) => {
      const timing = await privacyCash.getOptimalWithdrawalTiming({
        depositTimestamp: note.timestamp,
        targetAnonymitySet: 100,
      })
      return {
        note,
        isSafe: timing.currentAnonymitySet >= 100,
      }
    })
  )

  const spendable = safeNotes
    .filter(({ isSafe }) => isSafe)
    .reduce((sum, { note }) => sum + note.amount, 0n)

  const pending = total - spendable

  return {
    total,
    spendable,
    pending,
    notes: unspentNotes,
  }
}
```

### Balance Display Component

```typescript
function formatLamports(lamports: bigint): string {
  const sol = Number(lamports) / 1e9
  return sol.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

// Usage in React
function PrivateBalanceDisplay({ notes }: { notes: Note[] }) {
  const [balance, setBalance] = useState<PrivateBalance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPrivateBalance(notes)
      .then(setBalance)
      .finally(() => setLoading(false))
  }, [notes])

  if (loading) return <div>Loading private balance...</div>
  if (!balance) return <div>Unable to load balance</div>

  return (
    <div className="private-balance">
      <div className="total">
        <span>Total Balance:</span>
        <span>{formatLamports(balance.total)} SOL</span>
      </div>
      <div className="spendable">
        <span>Spendable:</span>
        <span>{formatLamports(balance.spendable)} SOL</span>
      </div>
      {balance.pending > 0n && (
        <div className="pending">
          <span>Pending (low anonymity):</span>
          <span>{formatLamports(balance.pending)} SOL</span>
        </div>
      )}
      <div className="notes">
        <span>Active notes:</span>
        <span>{balance.notes.length}</span>
      </div>
    </div>
  )
}
```

## Part 5: Compliance Features

Modern privacy protocols must support compliance. PrivacyCash includes selective disclosure features that allow proving transaction history to authorized parties without revealing everything.

### Selective Disclosure

```typescript
interface DisclosureOptions {
  includeAmount: boolean
  includeTimestamp: boolean
  includeDepositAddress: boolean
}

async function createSelectiveDisclosure(
  note: Note,
  auditorPublicKey: PublicKey,
  options: DisclosureOptions
): Promise<SelectiveDisclosure> {
  const disclosure = await privacyCash.createSelectiveDisclosure({
    note,
    discloseTo: auditorPublicKey,
    includeAmount: options.includeAmount,
    includeTimestamp: options.includeTimestamp,
    includeDepositAddress: options.includeDepositAddress,
  })

  console.log('Selective disclosure created')
  console.log(`Disclosed to: ${auditorPublicKey.toString()}`)
  console.log(`Includes amount: ${options.includeAmount}`)
  console.log(`Includes timestamp: ${options.includeTimestamp}`)

  return disclosure
}
```

### Verifying Disclosures (Auditor Side)

```typescript
async function verifyDisclosure(
  disclosure: SelectiveDisclosure,
  auditorKeypair: Keypair
): Promise<DisclosureVerification> {
  const verification = await privacyCash.verifyDisclosure({
    disclosure,
    auditorPrivateKey: auditorKeypair.secretKey,
  })

  if (!verification.isValid) {
    throw new Error('Disclosure verification failed')
  }

  console.log('Disclosure verified successfully')
  console.log(`Amount: ${verification.amount ?? 'not disclosed'}`)
  console.log(`Timestamp: ${verification.timestamp ?? 'not disclosed'}`)
  console.log(`Deposit address: ${verification.depositAddress ?? 'not disclosed'}`)

  return verification
}
```

### AML/KYT Integration Hooks

For applications requiring AML compliance, PrivacyCash provides integration points:

```typescript
interface ComplianceCheckResult {
  score: number
  flags: string[]
  provider: string
  timestamp: number
}

async function checkRecipientCompliance(
  recipientAddress: PublicKey,
  provider: 'chainalysis' | 'elliptic' | 'trm' = 'chainalysis'
): Promise<ComplianceCheckResult> {
  const result = await privacyCash.checkCompliance({
    recipient: recipientAddress,
    provider,
  })

  if (result.score > 70) {
    console.warn(`High-risk address detected (score: ${result.score})`)
    console.warn(`Flags: ${result.flags.join(', ')}`)
  }

  return result
}

// Usage before withdrawal
async function safeWithdraw(
  note: Note,
  recipient: PublicKey,
  complianceThreshold: number = 50
) {
  // Check recipient before withdrawal
  const compliance = await checkRecipientCompliance(recipient)

  if (compliance.score > complianceThreshold) {
    throw new Error(`Recipient failed compliance check (score: ${compliance.score})`)
  }

  // Proceed with withdrawal
  return withdraw(note, recipient)
}
```

## Part 6: React Integration

Let us build a complete React hook that wraps all PrivacyCash functionality for easy integration into your dApp.

### The usePrivacyCash Hook

```typescript
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Keypair } from '@solana/web3.js'
import { PrivacyCash, Note } from '@privacycash/sdk'

// Secure note storage (implement based on your requirements)
import { SecureStorage } from './secure-storage'

interface UsePrivacyCashReturn {
  // State
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  balance: PrivateBalance | null
  notes: Note[]

  // Actions
  deposit: (amountSol: number) => Promise<DepositResult>
  withdraw: (noteId: string, recipient?: PublicKey) => Promise<WithdrawalResult>
  refreshBalance: () => Promise<void>
  clearError: () => void

  // Compliance
  createDisclosure: (
    noteId: string,
    auditor: PublicKey,
    options: DisclosureOptions
  ) => Promise<SelectiveDisclosure>
}

export function usePrivacyCash(): UsePrivacyCashReturn {
  const { connection } = useConnection()
  const wallet = useWallet()

  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<PrivateBalance | null>(null)
  const [notes, setNotes] = useState<Note[]>([])

  // Initialize PrivacyCash client
  const privacyCash = useMemo(() => {
    return new PrivacyCash({
      connection,
      programId: new PublicKey('9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD'),
    })
  }, [connection])

  // Secure storage instance
  const storage = useMemo(() => new SecureStorage(), [])

  // Load notes from storage on mount
  useEffect(() => {
    async function loadNotes() {
      try {
        const savedNotes = await storage.loadAllNotes()
        setNotes(savedNotes)
        setIsInitialized(true)
      } catch (err) {
        setError('Failed to load saved notes')
        setIsInitialized(true)
      }
    }
    loadNotes()
  }, [storage])

  // Refresh balance when notes change
  useEffect(() => {
    if (notes.length > 0) {
      refreshBalance()
    }
  }, [notes])

  const refreshBalance = useCallback(async () => {
    if (notes.length === 0) {
      setBalance({ total: 0n, spendable: 0n, pending: 0n, notes: [] })
      return
    }

    setIsLoading(true)
    try {
      const noteStatuses = await Promise.all(
        notes.map(async (note) => ({
          note,
          isSpent: await privacyCash.isNoteSpent(note),
        }))
      )

      const unspentNotes = noteStatuses
        .filter(({ isSpent }) => !isSpent)
        .map(({ note }) => note)

      const total = unspentNotes.reduce((sum, note) => sum + note.amount, 0n)

      // Check withdrawal safety
      const safeNotes = await Promise.all(
        unspentNotes.map(async (note) => {
          const timing = await privacyCash.getOptimalWithdrawalTiming({
            depositTimestamp: note.timestamp,
            targetAnonymitySet: 100,
          })
          return { note, isSafe: timing.currentAnonymitySet >= 100 }
        })
      )

      const spendable = safeNotes
        .filter(({ isSafe }) => isSafe)
        .reduce((sum, { note }) => sum + note.amount, 0n)

      setBalance({
        total,
        spendable,
        pending: total - spendable,
        notes: unspentNotes,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh balance')
    } finally {
      setIsLoading(false)
    }
  }, [notes, privacyCash])

  const deposit = useCallback(async (amountSol: number): Promise<DepositResult> => {
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const amountLamports = BigInt(Math.floor(amountSol * 1e9))

      // Generate commitment
      const { commitment, note } = await privacyCash.createCommitment({
        amount: amountLamports,
        token: 'SOL',
      })

      // Build deposit transaction
      const depositTx = await privacyCash.deposit({
        commitment,
        amount: amountLamports,
        wallet: wallet.publicKey,
      })

      const { blockhash } = await connection.getLatestBlockhash()
      depositTx.recentBlockhash = blockhash
      depositTx.feePayer = wallet.publicKey

      // Sign and send
      const signedTx = await wallet.signTransaction(depositTx)
      const signature = await connection.sendRawTransaction(signedTx.serialize())
      await connection.confirmTransaction(signature, 'confirmed')

      // Save note securely
      await storage.saveNote(note)
      setNotes(prev => [...prev, note])

      return {
        signature,
        commitment,
        note,
        timestamp: Date.now(),
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deposit failed'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }, [wallet, connection, privacyCash, storage])

  const withdraw = useCallback(async (
    noteId: string,
    recipient?: PublicKey
  ): Promise<WithdrawalResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const note = await storage.loadNote(noteId)
      if (!note) {
        throw new Error('Note not found')
      }

      // Check if spent
      const isSpent = await privacyCash.isNoteSpent(note)
      if (isSpent) {
        throw new Error('Note already spent')
      }

      const recipientKey = recipient || Keypair.generate().publicKey
      const relayerInfo = await privacyCash.getRelayerInfo()

      // Build withdrawal with ZK proof
      const withdrawTx = await privacyCash.withdraw({
        note,
        recipient: recipientKey,
        relayerFee: relayerInfo.fee,
      })

      // Submit via relayer
      const signature = await privacyCash.submitViaRelayer(withdrawTx)
      await connection.confirmTransaction(signature, 'confirmed')

      // Mark note as spent
      await storage.markNoteSpent(noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))

      return {
        signature,
        recipient: recipientKey.toString(),
        amount: note.amount - relayerInfo.fee,
        fee: relayerInfo.fee,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }, [connection, privacyCash, storage])

  const createDisclosure = useCallback(async (
    noteId: string,
    auditor: PublicKey,
    options: DisclosureOptions
  ): Promise<SelectiveDisclosure> => {
    const note = await storage.loadNote(noteId)
    if (!note) {
      throw new Error('Note not found')
    }

    return privacyCash.createSelectiveDisclosure({
      note,
      discloseTo: auditor,
      ...options,
    })
  }, [privacyCash, storage])

  const clearError = useCallback(() => setError(null), [])

  return {
    isInitialized,
    isLoading,
    error,
    balance,
    notes,
    deposit,
    withdraw,
    refreshBalance,
    clearError,
    createDisclosure,
  }
}
```

### Using the Hook in Components

```typescript
function PrivacyDashboard() {
  const {
    isInitialized,
    isLoading,
    error,
    balance,
    deposit,
    withdraw,
    clearError,
  } = usePrivacyCash()

  const [depositAmount, setDepositAmount] = useState('')

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Invalid amount')
      return
    }

    try {
      const result = await deposit(amount)
      alert(`Deposited ${amount} SOL! Save your note.`)
      setDepositAmount('')
    } catch (err) {
      console.error('Deposit failed:', err)
    }
  }

  if (!isInitialized) {
    return <div>Initializing privacy features...</div>
  }

  return (
    <div className="privacy-dashboard">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      <section className="balance-section">
        <h2>Private Balance</h2>
        {balance && (
          <>
            <p>Total: {formatLamports(balance.total)} SOL</p>
            <p>Spendable: {formatLamports(balance.spendable)} SOL</p>
            {balance.pending > 0n && (
              <p className="pending">
                Pending: {formatLamports(balance.pending)} SOL
                <small>(waiting for anonymity set)</small>
              </p>
            )}
          </>
        )}
      </section>

      <section className="deposit-section">
        <h2>Deposit</h2>
        <input
          type="number"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="Amount in SOL"
          disabled={isLoading}
        />
        <button onClick={handleDeposit} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Deposit'}
        </button>
      </section>

      <section className="notes-section">
        <h2>Your Notes ({balance?.notes.length ?? 0})</h2>
        {balance?.notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onWithdraw={() => withdraw(note.id)}
            isLoading={isLoading}
          />
        ))}
      </section>
    </div>
  )
}
```

## Error Handling and Edge Cases

Robust error handling is essential for production applications. Here are the common error scenarios and how to handle them.

### Common Errors

```typescript
import { PrivacyCashError } from '@privacycash/sdk'

async function safeOperation<T>(
  operation: () => Promise<T>,
  errorHandlers: Record<string, (err: Error) => void>
): Promise<T | null> {
  try {
    return await operation()
  } catch (err) {
    if (err instanceof PrivacyCashError) {
      switch (err.code) {
        case 'INSUFFICIENT_FUNDS':
          errorHandlers.funds?.(err)
          break
        case 'NOTE_ALREADY_SPENT':
          errorHandlers.spent?.(err)
          break
        case 'INVALID_PROOF':
          errorHandlers.proof?.(err)
          break
        case 'RELAYER_UNAVAILABLE':
          errorHandlers.relayer?.(err)
          break
        case 'NETWORK_ERROR':
          errorHandlers.network?.(err)
          break
        default:
          errorHandlers.unknown?.(err)
      }
    } else {
      errorHandlers.unknown?.(err as Error)
    }
    return null
  }
}

// Usage
const result = await safeOperation(
  () => deposit(1.0),
  {
    funds: () => alert('Insufficient balance'),
    spent: () => alert('This note was already used'),
    proof: () => alert('Proof generation failed. Please try again.'),
    relayer: () => alert('Relayer unavailable. Try again later.'),
    network: () => alert('Network error. Check your connection.'),
    unknown: (err) => alert(`Unknown error: ${err.message}`),
  }
)
```

### Transaction Timeout Handling

```typescript
async function depositWithRetry(
  amountSol: number,
  maxRetries: number = 3
): Promise<DepositResult> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Deposit attempt ${attempt}/${maxRetries}`)
      return await deposit(amountSol)
    } catch (err) {
      lastError = err as Error

      // Only retry on transient errors
      if (
        lastError.message.includes('blockhash') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('network')
      ) {
        console.log(`Retrying due to: ${lastError.message}`)
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
        continue
      }

      // Non-retryable error
      throw lastError
    }
  }

  throw lastError || new Error('Max retries exceeded')
}
```

### Note Recovery

If a user's local storage is corrupted but they have a backup of their note data:

```typescript
async function recoverNote(
  nullifier: string,
  secret: string,
  amount: bigint,
  leafIndex: number
): Promise<Note | null> {
  const note: Note = {
    id: generateNoteId(nullifier, secret),
    nullifier,
    secret,
    amount,
    leafIndex,
    timestamp: 0,  // Unknown
    token: 'SOL',
  }

  // Verify the note is valid and unspent
  const isSpent = await privacyCash.isNoteSpent(note)

  if (isSpent) {
    console.log('Note has already been spent')
    return null
  }

  // Verify commitment exists in tree
  const isValid = await privacyCash.verifyCommitment(note)

  if (!isValid) {
    console.log('Note commitment not found in Merkle tree')
    return null
  }

  console.log('Note recovered successfully')
  return note
}
```

## Security Best Practices

Integrating PrivacyCash requires careful attention to security. Here are the critical considerations.

### Note Storage

Notes are the keys to your funds. Implement secure storage:

```typescript
// Example secure storage using encryption
import { encrypt, decrypt } from './encryption'

class SecureStorage {
  private encryptionKey: CryptoKey

  async saveNote(note: Note): Promise<void> {
    const serialized = JSON.stringify(note)
    const encrypted = await encrypt(serialized, this.encryptionKey)

    // Store encrypted note
    // Options: IndexedDB, localStorage (encrypted), secure backend
    localStorage.setItem(`note_${note.id}`, encrypted)
  }

  async loadNote(noteId: string): Promise<Note | null> {
    const encrypted = localStorage.getItem(`note_${noteId}`)
    if (!encrypted) return null

    const serialized = await decrypt(encrypted, this.encryptionKey)
    return JSON.parse(serialized)
  }

  async exportNotes(): Promise<string> {
    // For user backup - still encrypted
    const allNotes = await this.loadAllNotes()
    return JSON.stringify(allNotes)
  }
}
```

**Critical Rules:**
1. Never log note contents in production
2. Never send notes to analytics or error reporting
3. Always encrypt notes at rest
4. Provide users with backup/export functionality
5. Consider hardware wallet integration for note signing

### Timing Considerations

Timing attacks can deanonymize users:

```typescript
async function withdrawWithTimingProtection(note: Note, recipient: PublicKey) {
  const timing = await privacyCash.getOptimalWithdrawalTiming({
    depositTimestamp: note.timestamp,
    targetAnonymitySet: 500,
  })

  // Warn users about low anonymity
  if (timing.currentAnonymitySet < 100) {
    const proceed = confirm(
      `Warning: Current anonymity set is only ${timing.currentAnonymitySet}. ` +
      `For better privacy, wait ${timing.minimumWait} hours. Continue anyway?`
    )
    if (!proceed) return null
  }

  // Add random delay to prevent timing correlation
  const randomDelay = Math.random() * 30000  // 0-30 seconds
  await new Promise(resolve => setTimeout(resolve, randomDelay))

  return withdraw(note, recipient)
}
```

### Relayer Selection

Choose relayers carefully:

```typescript
async function selectRelayer(): Promise<RelayerInfo> {
  const relayers = await privacyCash.getAvailableRelayers()

  // Filter by criteria
  const eligible = relayers.filter(r =>
    r.uptime > 0.99 &&           // High availability
    r.fee <= 20_000_000n &&      // Reasonable fee
    r.minedTransactions > 1000   // Proven track record
  )

  if (eligible.length === 0) {
    throw new Error('No eligible relayers available')
  }

  // Randomly select to avoid predictability
  const index = Math.floor(Math.random() * eligible.length)
  return eligible[index]
}
```

## Complete dApp Example

Here is a minimal but complete example putting everything together:

```typescript
// app/privacy/page.tsx
'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { usePrivacyCash } from '@/hooks/usePrivacyCash'
import { useState } from 'react'

export default function PrivacyPage() {
  const wallet = useWallet()
  const {
    isInitialized,
    isLoading,
    error,
    balance,
    notes,
    deposit,
    withdraw,
    refreshBalance,
    clearError,
  } = usePrivacyCash()

  const [depositAmount, setDepositAmount] = useState('')
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [withdrawAddress, setWithdrawAddress] = useState('')

  if (!wallet.connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Connect Wallet to Continue</h1>
        <WalletMultiButton />
      </div>
    )
  }

  if (!isInitialized) {
    return <div className="p-8">Initializing privacy features...</div>
  }

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return

    try {
      const result = await deposit(amount)
      alert(`Success! Transaction: ${result.signature}`)
      setDepositAmount('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleWithdraw = async () => {
    if (!selectedNote) return

    try {
      const recipient = withdrawAddress
        ? new PublicKey(withdrawAddress)
        : undefined

      const result = await withdraw(selectedNote, recipient)
      alert(`Withdrawn to ${result.recipient}`)
      setSelectedNote(null)
      setWithdrawAddress('')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Private Transfers</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={clearError} className="float-right">&times;</button>
        </div>
      )}

      {/* Balance Section */}
      <section className="bg-gray-100 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Private Balance</h2>
        {balance ? (
          <div className="space-y-2">
            <p>Total: <strong>{(Number(balance.total) / 1e9).toFixed(4)} SOL</strong></p>
            <p>Spendable: {(Number(balance.spendable) / 1e9).toFixed(4)} SOL</p>
            {balance.pending > 0n && (
              <p className="text-yellow-600">
                Pending: {(Number(balance.pending) / 1e9).toFixed(4)} SOL
              </p>
            )}
          </div>
        ) : (
          <p>No private balance</p>
        )}
        <button
          onClick={refreshBalance}
          disabled={isLoading}
          className="mt-4 text-blue-600 underline"
        >
          Refresh
        </button>
      </section>

      {/* Deposit Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Deposit</h2>
        <div className="flex gap-4">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount in SOL"
            className="flex-1 p-2 border rounded"
            disabled={isLoading}
          />
          <button
            onClick={handleDeposit}
            disabled={isLoading || !depositAmount}
            className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Deposit'}
          </button>
        </div>
      </section>

      {/* Withdraw Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Withdraw</h2>

        {notes.length === 0 ? (
          <p className="text-gray-500">No notes available for withdrawal</p>
        ) : (
          <>
            <select
              value={selectedNote || ''}
              onChange={(e) => setSelectedNote(e.target.value || null)}
              className="w-full p-2 border rounded mb-4"
            >
              <option value="">Select a note</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {(Number(note.amount) / 1e9).toFixed(4)} SOL
                </option>
              ))}
            </select>

            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="Recipient address (optional - leave empty for new)"
              className="w-full p-2 border rounded mb-4"
            />

            <button
              onClick={handleWithdraw}
              disabled={isLoading || !selectedNote}
              className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </>
        )}
      </section>

      {/* Safety Notice */}
      <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800">Important</h3>
        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
          <li>Your notes are stored locally and encrypted</li>
          <li>Lost notes mean lost funds - no recovery possible</li>
          <li>Wait 24-48 hours between deposit and withdrawal for best privacy</li>
          <li>Withdrawals use relayers to preserve privacy</li>
        </ul>
      </section>
    </div>
  )
}
```

## Next Steps

You now have a complete foundation for integrating PrivacyCash into your Solana dApp. Here are recommended next steps:

**Immediate:**
1. Test on devnet thoroughly before mainnet
2. Implement proper note backup/export for users
3. Add transaction history tracking
4. Build compliance features if required

**Future Enhancements:**
1. Support additional tokens (USDC, USDT)
2. Implement batched operations for efficiency
3. Add notification system for withdrawal timing
4. Build admin dashboard for compliance officers

**Learn More:**
- Read "Understanding Pool Mixing" for deeper cryptographic understanding
- Explore "The State of Privacy on Solana" for alternative approaches
- Check PrivacyCash documentation for advanced features

Privacy is becoming table stakes for Web3 applications. Users expect it, regulators require selective disclosure, and the technology is ready. PrivacyCash provides a solid foundation — how you build on it is up to you.

---

*This is Part 11 of SIP Protocol's Privacy Education Series. For cryptographic privacy using Pedersen commitments and stealth addresses instead of pool mixing, see our SIP SDK documentation.*

**References:**
- [PrivacyCash Documentation](https://docs.privacycash.io)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Understanding Pool Mixing](/blog/understanding-pool-mixing-solana)
- [The State of Privacy on Solana](/blog/solana-privacy-landscape-2026)
