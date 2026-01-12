---
title: 'Building with Arcium: Your First MPC Application'
description: 'Complete tutorial for building MPC-based private applications on Solana using Arcium. Learn Arcis framework, encrypted types, and C-SPL tokens.'
pubDate: 'Jan 12 2026'
category: 'tutorials'
tags: ['tutorial', 'arcium', 'mpc', 'solana', 'rust', 'privacy', 'defi']
draft: false
author: 'SIP Protocol Team'
tldr: 'Use Arcis CLI to scaffold MPC projects, define encrypted types with #[derive(Encrypted)], write programs that compute over encrypted data, and integrate with TypeScript client using @arcium/sdk.'
keyTakeaways:
  - 'Arcis framework extends Anchor for MPC-enabled Solana programs'
  - 'Encrypted types (EncryptedU64, etc.) enable computation without decryption'
  - 'MXE clusters process MPC computations in ~3 seconds'
  - 'C-SPL tokens provide confidential balances for any SPL token'
  - 'Access control determines who can decrypt results'
targetAudience: 'Solana developers, Rust programmers, DeFi builders'
prerequisites:
  - 'Rust programming basics'
  - 'Solana/Anchor development experience'
  - 'Understanding of MPC concepts'
relatedPosts:
  - 'mpc-confidential-computing-arcium'
  - 'solana-privacy-landscape-2026'
---

You understand the theory. Multi-Party Computation distributes trust across nodes. No single party sees plaintext data. Encrypted computations produce encrypted results. The MXE cluster orchestrates it all in approximately three seconds.

Now it is time to build something.

This tutorial walks through creating a private vault application on Solana using Arcium's Arcis framework. By the end, you will have a working MPC program that accepts encrypted deposits, performs confidential transfers, and integrates with TypeScript clients.

A note before we begin: Arcium is actively developing its SDK and tooling. Some APIs may evolve, and certain features discussed here reflect the anticipated mainnet release in Q1 2026. We will note where interfaces are subject to change.

## Prerequisites

Before diving in, ensure you have the following:

**Rust and Cargo**

Arcis programs are written in Rust. You need Rust 1.75 or later:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version
# rustc 1.75.0 or later
```

**Solana CLI and Anchor**

Arcis extends Anchor, so you need both:

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Verify
solana --version
anchor --version
```

**Node.js and npm/yarn**

For the TypeScript client:

```bash
node --version  # 18.0.0 or later
npm --version   # 9.0.0 or later
```

**Understanding MPC Concepts**

If you have not read our previous article on MPC and Arcium, we recommend reviewing it first. Key concepts you should understand:

- Secret sharing and threshold security
- MXE clusters and computation rounds
- Encrypted types and homomorphic operations
- The difference between MPC and other privacy approaches

## Arcium Architecture Overview

Before writing code, let us understand how the pieces fit together.

### The MXE Cluster

The Multi-party eXecution Environment is the heart of Arcium. When your program performs encrypted operations, the MXE cluster:

1. Receives encrypted inputs from users
2. Distributes secret shares across nodes
3. Executes MPC rounds to compute the result
4. Returns encrypted output to the Solana program

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR PROGRAM                                                │
│  └─ Calls encrypted operations                              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  MXE CLUSTER                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Node 1  │  │ Node 2  │  │ Node 3  │  │ Node 4  │        │
│  │ Share₁  │  │ Share₂  │  │ Share₃  │  │ Share₄  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       └────────────┴────────────┴────────────┘              │
│                    MPC Rounds (~3s)                          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  SOLANA                                                      │
│  └─ Stores encrypted state on-chain                         │
└─────────────────────────────────────────────────────────────┘
```

### The Arcis Framework

Arcis is to Arcium what Anchor is to Solana. It provides:

- **Encrypted type macros**: `#[derive(Encrypted)]` for defining private data structures
- **MPC operation traits**: Methods like `.add()`, `.sub()`, `.mul()` on encrypted types
- **Program scaffolding**: CLI tools to generate boilerplate
- **Client SDK**: TypeScript library for encryption and interaction

### C-SPL Tokens

Confidential SPL tokens extend the standard SPL token interface with encrypted balances. Any SPL token can be wrapped as a C-SPL token, enabling private transfers while maintaining compatibility with the broader Solana ecosystem.

## Installation and Project Setup

Let us create a new Arcis project.

### Installing the Arcis CLI

```bash
# Install Arcis CLI
cargo install arcis-cli

# Verify installation
arcis --version
# arcis 0.1.0 or later
```

If the crate is not yet published, you may need to install from source:

```bash
git clone https://github.com/arcium-protocol/arcis-cli
cd arcis-cli
cargo install --path .
```

### Creating a New Project

```bash
# Create new Arcis project
arcis new private-vault
cd private-vault
```

This generates the following structure:

```
private-vault/
├── Cargo.toml
├── Anchor.toml
├── programs/
│   └── private-vault/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
├── app/
│   ├── package.json
│   └── src/
│       └── index.ts
└── tests/
    └── private-vault.ts
```

### Configuring Dependencies

Open `programs/private-vault/Cargo.toml` and verify your dependencies:

```toml
[package]
name = "private-vault"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "private_vault"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
arcis = "0.1"
anchor-lang = "0.29"
anchor-spl = "0.29"
```

The `arcis` crate provides the encrypted types, MXE integration, and program macros.

## Tutorial Part 1: Defining Encrypted Types

The foundation of any MPC application is its encrypted data structures. Let us define the types our private vault will use.

### The PrivateBalance Structure

Open `programs/private-vault/src/lib.rs` and replace the contents:

```rust
use anchor_lang::prelude::*;
use arcis::prelude::*;

declare_id!("Vault111111111111111111111111111111111111111");

#[derive(Encrypted, AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PrivateBalance {
    /// Encrypted balance amount
    pub amount: EncryptedU64,
    /// Owner of this balance (public)
    pub owner: Pubkey,
    /// Nonce for replay protection
    pub nonce: u64,
}

#[derive(Encrypted, AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PrivateTransfer {
    /// Sender public key (public)
    pub from: Pubkey,
    /// Recipient public key (public)
    pub to: Pubkey,
    /// Encrypted transfer amount
    pub amount: EncryptedU64,
}
```

Let us examine what is happening here:

**The `#[derive(Encrypted)]` macro** transforms the struct for MPC compatibility. Fields of type `EncryptedU64`, `EncryptedU128`, or other encrypted primitives are serialized in a format the MXE cluster understands.

**Public vs. encrypted fields**: Notice that `owner`, `from`, and `to` are plain `Pubkey` types. Arcium does not hide sender/recipient addresses by default—this is a design choice for compliance. The `amount` is what remains confidential.

**The `nonce` field** prevents replay attacks. Each operation increments the nonce, ensuring old transaction data cannot be resubmitted.

### Encrypted Primitive Types

Arcis provides several encrypted primitive types:

| Type | Description | Operations |
|------|-------------|------------|
| `EncryptedU64` | 64-bit unsigned integer | add, sub, mul, div, cmp |
| `EncryptedU128` | 128-bit unsigned integer | add, sub, mul, div, cmp |
| `EncryptedI64` | 64-bit signed integer | add, sub, mul, div, cmp |
| `EncryptedBool` | Boolean value | and, or, not |
| `EncryptedBytes` | Arbitrary byte array | equality only |

All arithmetic and comparison operations happen in the MPC domain—the MXE cluster computes results without any node seeing plaintext values.

### Account Structures

Now define the Anchor accounts:

```rust
#[account]
pub struct VaultAccount {
    /// The vault's encrypted balance
    pub balance: PrivateBalance,
    /// Bump seed for PDA derivation
    pub bump: u8,
    /// Is the vault initialized?
    pub initialized: bool,
}

#[account]
pub struct VaultConfig {
    /// Authority that can modify vault parameters
    pub authority: Pubkey,
    /// MXE cluster address
    pub mxe_cluster: Pubkey,
    /// Minimum deposit amount (public, for UX)
    pub min_deposit: u64,
    /// Fee basis points (public)
    pub fee_bps: u16,
}

impl VaultAccount {
    pub const SIZE: usize = 8 +  // discriminator
        32 +                      // EncryptedU64 amount
        32 +                      // owner pubkey
        8 +                       // nonce
        1 +                       // bump
        1;                        // initialized
}
```

The `VaultAccount::SIZE` constant is important. Encrypted values have fixed sizes regardless of their plaintext value—an `EncryptedU64` is always 32 bytes (the size of an encryption ciphertext under the MXE scheme).

## Tutorial Part 2: Writing the MPC Program

With types defined, let us implement the vault logic.

### Program Structure

```rust
#[program]
mod private_vault {
    use super::*;

    /// Initialize a new vault for a user
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let mxe = &ctx.accounts.mxe;

        // Create encrypted zero balance
        let zero_amount = mxe.encrypt_u64(0)?;

        vault.balance = PrivateBalance {
            amount: zero_amount,
            owner: ctx.accounts.owner.key(),
            nonce: 0,
        };
        vault.bump = ctx.bumps.vault;
        vault.initialized = true;

        msg!("Vault initialized for {}", ctx.accounts.owner.key());
        Ok(())
    }

    /// Deposit funds into the vault
    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let mxe = &ctx.accounts.mxe;

        // Verify ownership
        require!(
            vault.balance.owner == ctx.accounts.owner.key(),
            VaultError::Unauthorized
        );

        // Encrypt the deposit amount
        let encrypted_amount = mxe.encrypt_u64(amount)?;

        // MPC addition: new_balance = old_balance + deposit
        // This happens in the MXE cluster
        vault.balance.amount = vault.balance.amount.add(&encrypted_amount)?;
        vault.balance.nonce += 1;

        // Transfer SOL to vault PDA
        let transfer_ix = anchor_lang::system_program::Transfer {
            from: ctx.accounts.owner.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                transfer_ix,
            ),
            amount,
        )?;

        msg!("Deposited {} lamports to vault", amount);
        Ok(())
    }

    /// Transfer between vaults (amounts hidden)
    pub fn transfer(
        ctx: Context<Transfer>,
        encrypted_amount: EncryptedU64,
    ) -> Result<()> {
        let from_vault = &mut ctx.accounts.from_vault;
        let to_vault = &mut ctx.accounts.to_vault;
        let mxe = &ctx.accounts.mxe;

        // Verify sender ownership
        require!(
            from_vault.balance.owner == ctx.accounts.sender.key(),
            VaultError::Unauthorized
        );

        // MPC comparison: verify sender has sufficient balance
        // Returns encrypted boolean, then we verify it
        let has_balance = from_vault.balance.amount.gte(&encrypted_amount)?;
        require!(
            mxe.verify_true(&has_balance)?,
            VaultError::InsufficientBalance
        );

        // MPC subtraction: sender_balance -= amount
        from_vault.balance.amount = from_vault.balance.amount.sub(&encrypted_amount)?;
        from_vault.balance.nonce += 1;

        // MPC addition: recipient_balance += amount
        to_vault.balance.amount = to_vault.balance.amount.add(&encrypted_amount)?;
        to_vault.balance.nonce += 1;

        msg!("Transfer completed");
        Ok(())
    }

    /// Withdraw funds from vault
    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let mxe = &ctx.accounts.mxe;

        // Verify ownership
        require!(
            vault.balance.owner == ctx.accounts.owner.key(),
            VaultError::Unauthorized
        );

        // Encrypt withdrawal amount
        let encrypted_amount = mxe.encrypt_u64(amount)?;

        // Verify sufficient balance
        let has_balance = vault.balance.amount.gte(&encrypted_amount)?;
        require!(
            mxe.verify_true(&has_balance)?,
            VaultError::InsufficientBalance
        );

        // MPC subtraction
        vault.balance.amount = vault.balance.amount.sub(&encrypted_amount)?;
        vault.balance.nonce += 1;

        // Transfer SOL from vault PDA to owner
        let vault_seeds = &[
            b"vault",
            ctx.accounts.owner.key().as_ref(),
            &[vault.bump],
        ];
        let signer_seeds = &[&vault_seeds[..]];

        let transfer_ix = anchor_lang::system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.owner.to_account_info(),
        };
        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                transfer_ix,
                signer_seeds,
            ),
            amount,
        )?;

        msg!("Withdrew {} lamports from vault", amount);
        Ok(())
    }
}
```

### Understanding the MPC Operations

Let us break down what happens during a transfer:

**1. Encryption at the boundary**

When `deposit` receives a plaintext `amount`, it encrypts immediately:

```rust
let encrypted_amount = mxe.encrypt_u64(amount)?;
```

This calls the MXE cluster's encryption service. The result is threshold-encrypted—no single MXE node can decrypt it.

**2. Computation over ciphertexts**

The addition and subtraction happen on encrypted values:

```rust
vault.balance.amount = vault.balance.amount.add(&encrypted_amount)?;
```

Behind the scenes, this triggers MPC rounds in the cluster. Each node operates on its share, and the result is a new encrypted value representing the sum.

**3. Comparison verification**

For balance checks, we compute an encrypted comparison:

```rust
let has_balance = from_vault.balance.amount.gte(&encrypted_amount)?;
```

This returns an `EncryptedBool`. To verify it, we call:

```rust
mxe.verify_true(&has_balance)?
```

This is a threshold decryption of a single boolean value—safe because it only reveals whether the condition holds, not the actual balances.

### Account Contexts

Define the account contexts for each instruction:

```rust
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + VaultAccount::SIZE,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// The MXE cluster account for encryption operations
    /// CHECK: Verified by Arcis
    pub mxe: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Verified by Arcis
    pub mxe: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub from_vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub to_vault: Account<'info, VaultAccount>,

    pub sender: Signer<'info>,

    /// CHECK: Verified by Arcis
    pub mxe: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Verified by Arcis
    pub mxe: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
```

### Error Definitions

```rust
#[error_code]
pub enum VaultError {
    #[msg("Unauthorized access to vault")]
    Unauthorized,

    #[msg("Insufficient balance for operation")]
    InsufficientBalance,

    #[msg("Vault already initialized")]
    AlreadyInitialized,

    #[msg("Invalid encrypted value")]
    InvalidEncryption,

    #[msg("MXE cluster unavailable")]
    MxeUnavailable,
}
```

## Tutorial Part 3: Client Integration

The Rust program handles on-chain logic. Now let us build the TypeScript client that encrypts data and submits transactions.

### Setting Up the Client

Navigate to the `app` directory and install dependencies:

```bash
cd app
npm install @arcium/sdk @solana/web3.js @coral-xyz/anchor
```

### The ArciumClient

Create `src/client.ts`:

```typescript
import { ArciumClient, EncryptedU64 } from '@arcium/sdk'
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js'
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor'
import { PrivateVault } from '../target/types/private_vault'

export class VaultClient {
  private arcium: ArciumClient
  private program: Program<PrivateVault>
  private connection: Connection

  constructor(
    connection: Connection,
    wallet: Keypair,
    programId: PublicKey,
    mxeCluster: string = 'https://mxe.arcium.network'
  ) {
    this.connection = connection

    // Initialize Arcium client for encryption
    this.arcium = new ArciumClient({
      network: 'devnet',
      mxeCluster,
    })

    // Initialize Anchor program
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: async (tx) => {
          tx.sign(wallet)
          return tx
        },
        signAllTransactions: async (txs) => {
          txs.forEach(tx => tx.sign(wallet))
          return txs
        },
      },
      { commitment: 'confirmed' }
    )

    // Load IDL and create program instance
    // In production, import the generated IDL
    this.program = new Program(
      require('../target/idl/private_vault.json'),
      programId,
      provider
    )
  }

  /**
   * Get the vault PDA for a given owner
   */
  getVaultAddress(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), owner.toBuffer()],
      this.program.programId
    )
  }

  /**
   * Initialize a new vault
   */
  async initializeVault(owner: Keypair): Promise<string> {
    const [vaultPda] = this.getVaultAddress(owner.publicKey)

    const tx = await this.program.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        owner: owner.publicKey,
        mxe: this.arcium.mxeAccount,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc()

    console.log('Vault initialized:', tx)
    return tx
  }

  /**
   * Deposit SOL into the vault
   * Amount is encrypted before submission
   */
  async deposit(owner: Keypair, amount: bigint): Promise<string> {
    const [vaultPda] = this.getVaultAddress(owner.publicKey)

    // For deposit, amount is public (it matches the SOL transfer)
    // The encryption happens on-chain
    const tx = await this.program.methods
      .deposit(amount)
      .accounts({
        vault: vaultPda,
        owner: owner.publicKey,
        mxe: this.arcium.mxeAccount,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc()

    console.log('Deposit completed:', tx)
    return tx
  }

  /**
   * Transfer between vaults with hidden amount
   */
  async transfer(
    sender: Keypair,
    recipientVault: PublicKey,
    amount: bigint
  ): Promise<string> {
    const [senderVault] = this.getVaultAddress(sender.publicKey)

    // Encrypt amount client-side
    // This uses threshold encryption under the MXE cluster's keys
    const encryptedAmount = await this.arcium.encrypt(amount)

    const tx = await this.program.methods
      .transfer(encryptedAmount)
      .accounts({
        fromVault: senderVault,
        toVault: recipientVault,
        sender: sender.publicKey,
        mxe: this.arcium.mxeAccount,
      })
      .signers([sender])
      .rpc()

    console.log('Transfer completed:', tx)
    return tx
  }

  /**
   * Withdraw SOL from the vault
   */
  async withdraw(owner: Keypair, amount: bigint): Promise<string> {
    const [vaultPda] = this.getVaultAddress(owner.publicKey)

    const tx = await this.program.methods
      .withdraw(amount)
      .accounts({
        vault: vaultPda,
        owner: owner.publicKey,
        mxe: this.arcium.mxeAccount,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc()

    console.log('Withdrawal completed:', tx)
    return tx
  }
}
```

### Using the Client

Create `src/index.ts`:

```typescript
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { VaultClient } from './client'

async function main() {
  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')

  // Load or generate keypairs
  const alice = Keypair.generate()
  const bob = Keypair.generate()

  // Airdrop for testing
  console.log('Requesting airdrops...')
  await connection.requestAirdrop(alice.publicKey, 2 * LAMPORTS_PER_SOL)
  await connection.requestAirdrop(bob.publicKey, 2 * LAMPORTS_PER_SOL)

  // Wait for confirmation
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Program ID (replace with your deployed program)
  const programId = new PublicKey('Vault111111111111111111111111111111111111111')

  // Initialize clients
  const aliceClient = new VaultClient(connection, alice, programId)
  const bobClient = new VaultClient(connection, bob, programId)

  // Initialize vaults
  console.log('\n--- Initializing Vaults ---')
  await aliceClient.initializeVault(alice)
  await bobClient.initializeVault(bob)

  // Alice deposits 1 SOL
  console.log('\n--- Alice Deposits 1 SOL ---')
  await aliceClient.deposit(alice, BigInt(1 * LAMPORTS_PER_SOL))

  // Alice transfers 0.3 SOL to Bob (amount hidden on-chain)
  console.log('\n--- Alice Transfers 0.3 SOL to Bob ---')
  const [bobVault] = bobClient.getVaultAddress(bob.publicKey)
  await aliceClient.transfer(alice, bobVault, BigInt(0.3 * LAMPORTS_PER_SOL))

  // Bob withdraws 0.2 SOL
  console.log('\n--- Bob Withdraws 0.2 SOL ---')
  await bobClient.withdraw(bob, BigInt(0.2 * LAMPORTS_PER_SOL))

  console.log('\nAll operations completed successfully!')
}

main().catch(console.error)
```

## Tutorial Part 4: Decryption with Access Control

Not all encrypted data must remain hidden forever. Arcium provides decryption mechanisms for authorized parties.

### Owner Decryption

The vault owner can always decrypt their own balance:

```typescript
import { ArciumClient } from '@arcium/sdk'

async function getMyBalance(
  client: ArciumClient,
  vaultAccount: VaultAccount,
  ownerKeypair: Keypair
): Promise<bigint> {
  // Sign a message to prove ownership
  const message = Buffer.from('decrypt-balance-request')
  const signature = ownerKeypair.sign(message)

  // Request decryption from MXE cluster
  const decryptedBalance = await client.decrypt(
    vaultAccount.balance.amount,
    {
      signature: Buffer.from(signature).toString('hex'),
      publicKey: ownerKeypair.publicKey.toBase58(),
    }
  )

  return decryptedBalance
}
```

The MXE cluster verifies the signature matches the vault owner before performing threshold decryption.

### Auditor Access with Attestation

For compliance scenarios, owners can grant viewing access to auditors:

```typescript
async function grantAuditorAccess(
  client: ArciumClient,
  vaultOwner: Keypair,
  auditorPubkey: PublicKey,
  scope: 'balance' | 'history' | 'all'
): Promise<string> {
  // Create access grant
  const grant = await client.createAccessGrant({
    owner: vaultOwner.publicKey,
    grantee: auditorPubkey,
    scope,
    expiration: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  })

  // Sign the grant
  const signature = vaultOwner.sign(grant.message)

  // Register with MXE cluster
  const attestation = await client.registerGrant({
    grant,
    signature,
  })

  return attestation.id
}

async function auditorDecrypt(
  client: ArciumClient,
  encryptedBalance: EncryptedU64,
  attestationId: string,
  auditorKeypair: Keypair
): Promise<bigint> {
  const decrypted = await client.decrypt(
    encryptedBalance,
    {
      attestation: attestationId,
      signature: auditorKeypair.sign(Buffer.from('audit-request')),
      publicKey: auditorKeypair.publicKey.toBase58(),
    }
  )

  return decrypted
}
```

This pattern enables regulatory compliance without compromising privacy from the general public.

### Time-Locked Decryption

Some applications require data to become public after a certain period:

```typescript
async function createTimeLocked(
  client: ArciumClient,
  value: bigint,
  unlockTime: number // Unix timestamp
): Promise<EncryptedU64> {
  const encrypted = await client.encrypt(value, {
    timelock: unlockTime,
  })

  return encrypted
}

// After unlockTime, anyone can decrypt
async function decryptAfterTimelock(
  client: ArciumClient,
  encrypted: EncryptedU64
): Promise<bigint | null> {
  try {
    const decrypted = await client.decryptTimelock(encrypted)
    return decrypted
  } catch (err) {
    if (err.code === 'TIMELOCK_NOT_EXPIRED') {
      console.log('Cannot decrypt yet - timelock still active')
      return null
    }
    throw err
  }
}
```

## Tutorial Part 5: C-SPL Token Integration

Let us extend our vault to support confidential SPL tokens.

### Creating a Confidential Token

```typescript
import { ArciumClient, CSplClient } from '@arcium/sdk'
import { getMint } from '@solana/spl-token'

async function createConfidentialToken(
  arcium: ArciumClient,
  tokenMint: PublicKey,
  payer: Keypair
): Promise<CSplClient> {
  // Fetch mint info
  const mintInfo = await getMint(connection, tokenMint)

  // Create C-SPL wrapper
  const cSplToken = await arcium.createConfidentialToken({
    mint: tokenMint,
    decimals: mintInfo.decimals,
    payer: payer.publicKey,
  })

  console.log('C-SPL token created:', cSplToken.address.toBase58())
  return cSplToken
}
```

### Confidential Token Transfers

```typescript
async function confidentialTransfer(
  cSplToken: CSplClient,
  arcium: ArciumClient,
  from: Keypair,
  to: PublicKey,
  amount: bigint
): Promise<string> {
  // Encrypt the transfer amount
  const encryptedAmount = await arcium.encrypt(amount)

  // Build the confidential transfer
  const tx = await cSplToken.transfer({
    from: from.publicKey,
    to,
    encryptedAmount,
    payer: from.publicKey,
  })

  // Sign and send
  tx.sign(from)
  const signature = await connection.sendTransaction(tx)

  console.log('Confidential transfer:', signature)
  return signature
}
```

### Confidential Balance Queries

```typescript
async function getConfidentialBalance(
  cSplToken: CSplClient,
  arcium: ArciumClient,
  owner: Keypair
): Promise<bigint> {
  // Fetch encrypted balance from chain
  const encryptedBalance = await cSplToken.getBalance(owner.publicKey)

  // Decrypt with owner proof
  const balance = await arcium.decrypt(encryptedBalance, {
    signature: owner.sign(Buffer.from('balance-query')),
    publicKey: owner.publicKey.toBase58(),
  })

  return balance
}
```

### Integrating C-SPL with Our Vault

Extend the Rust program to handle C-SPL tokens:

```rust
use anchor_spl::token::{Token, TokenAccount};
use arcis::cspl::{ConfidentialMint, ConfidentialTokenAccount};

#[derive(Accounts)]
pub struct DepositCspl<'info> {
    #[account(mut)]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub user_cspl_account: Account<'info, ConfidentialTokenAccount>,

    #[account(mut)]
    pub vault_cspl_account: Account<'info, ConfidentialTokenAccount>,

    pub cspl_mint: Account<'info, ConfidentialMint>,

    pub owner: Signer<'info>,

    /// CHECK: Verified by Arcis
    pub mxe: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn deposit_cspl(
    ctx: Context<DepositCspl>,
    encrypted_amount: EncryptedU64,
) -> Result<()> {
    let mxe = &ctx.accounts.mxe;

    // Verify sender has balance
    let has_balance = ctx.accounts.user_cspl_account
        .encrypted_balance
        .gte(&encrypted_amount)?;
    require!(mxe.verify_true(&has_balance)?, VaultError::InsufficientBalance);

    // MPC transfer between confidential accounts
    ctx.accounts.user_cspl_account.encrypted_balance =
        ctx.accounts.user_cspl_account.encrypted_balance.sub(&encrypted_amount)?;
    ctx.accounts.vault_cspl_account.encrypted_balance =
        ctx.accounts.vault_cspl_account.encrypted_balance.add(&encrypted_amount)?;

    msg!("C-SPL deposit completed");
    Ok(())
}
```

## Testing Your MPC Application

Thorough testing is essential for MPC applications. The distributed nature adds complexity.

### Unit Tests with Mock MXE

For fast iteration, use a mock MXE that runs locally:

```typescript
// tests/private-vault.ts
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PrivateVault } from '../target/types/private_vault'
import { MockMxe } from '@arcium/sdk/testing'

describe('private-vault', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.PrivateVault as Program<PrivateVault>
  let mockMxe: MockMxe

  before(async () => {
    // Initialize mock MXE for testing
    mockMxe = await MockMxe.create()
  })

  it('initializes vault', async () => {
    const owner = anchor.web3.Keypair.generate()

    // Airdrop
    await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    )

    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), owner.publicKey.toBuffer()],
      program.programId
    )

    await program.methods
      .initializeVault()
      .accounts({
        vault: vaultPda,
        owner: owner.publicKey,
        mxe: mockMxe.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc()

    const vault = await program.account.vaultAccount.fetch(vaultPda)
    expect(vault.initialized).to.be.true
    expect(vault.balance.owner.toBase58()).to.equal(owner.publicKey.toBase58())
  })

  it('deposits and transfers with hidden amounts', async () => {
    const alice = anchor.web3.Keypair.generate()
    const bob = anchor.web3.Keypair.generate()

    // Setup accounts...

    // Deposit
    await program.methods
      .deposit(new anchor.BN(1_000_000_000))
      .accounts({
        vault: aliceVault,
        owner: alice.publicKey,
        mxe: mockMxe.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([alice])
      .rpc()

    // Transfer (encrypted amount)
    const encryptedAmount = await mockMxe.encrypt(300_000_000n)

    await program.methods
      .transfer(encryptedAmount)
      .accounts({
        fromVault: aliceVault,
        toVault: bobVault,
        sender: alice.publicKey,
        mxe: mockMxe.address,
      })
      .signers([alice])
      .rpc()

    // Verify with decryption
    const aliceBalance = await mockMxe.decryptBalance(aliceVault)
    const bobBalance = await mockMxe.decryptBalance(bobVault)

    expect(aliceBalance).to.equal(700_000_000n)
    expect(bobBalance).to.equal(300_000_000n)
  })

  it('rejects transfer with insufficient balance', async () => {
    // Attempt to transfer more than balance
    const tooMuch = await mockMxe.encrypt(10_000_000_000n)

    try {
      await program.methods
        .transfer(tooMuch)
        .accounts({
          fromVault: aliceVault,
          toVault: bobVault,
          sender: alice.publicKey,
          mxe: mockMxe.address,
        })
        .signers([alice])
        .rpc()

      expect.fail('Should have thrown')
    } catch (err) {
      expect(err.message).to.include('InsufficientBalance')
    }
  })
})
```

### Integration Tests with Devnet MXE

For realistic testing, use the devnet MXE cluster:

```typescript
import { ArciumClient } from '@arcium/sdk'

describe('private-vault integration', () => {
  let arcium: ArciumClient

  before(async () => {
    arcium = new ArciumClient({
      network: 'devnet',
      mxeCluster: 'https://mxe-devnet.arcium.network',
    })
  })

  it('completes full flow with real MXE', async () => {
    // These tests take ~3 seconds per MPC operation
    // Set appropriate timeout
    this.timeout(60000)

    // ... test implementation
  })
})
```

Run tests:

```bash
# Unit tests with mock
anchor test

# Integration tests with devnet
ARCIUM_NETWORK=devnet anchor test --skip-local-validator
```

## Deployment to Devnet

### Build and Deploy the Program

```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Note the program ID
Program Id: <your-program-id>
```

### Update Program ID

Update `declare_id!()` in your Rust code and `Anchor.toml`:

```toml
[programs.devnet]
private_vault = "<your-program-id>"
```

### Initialize MXE Connection

```typescript
import { ArciumClient } from '@arcium/sdk'

const arcium = new ArciumClient({
  network: 'devnet',
  mxeCluster: 'https://mxe-devnet.arcium.network',
})

// Verify connection
const status = await arcium.getClusterStatus()
console.log('MXE cluster status:', status)
// { nodes: 4, threshold: 3, latency: '2.8s' }
```

## Best Practices and Security Considerations

### Never Trust Client-Provided Encrypted Values Blindly

When a client sends an encrypted value, you cannot verify its contents without decryption. Implement additional checks:

```rust
// Bad: Accept any encrypted amount
pub fn bad_transfer(ctx: Context<Transfer>, amount: EncryptedU64) -> Result<()> {
    // Attacker could send malformed ciphertext
}

// Better: Verify the encryption is well-formed
pub fn better_transfer(ctx: Context<Transfer>, amount: EncryptedU64) -> Result<()> {
    // Verify ciphertext validity
    require!(
        ctx.accounts.mxe.verify_ciphertext(&amount)?,
        VaultError::InvalidEncryption
    );
    // Now proceed...
}
```

### Handle MXE Unavailability

The MXE cluster could be temporarily unavailable. Design for graceful degradation:

```rust
pub fn safe_deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let mxe = &ctx.accounts.mxe;

    // Check MXE is responsive
    match mxe.encrypt_u64(amount) {
        Ok(encrypted) => {
            // Proceed with MPC operation
        }
        Err(ArcisError::MxeUnavailable) => {
            // Log and return user-friendly error
            msg!("MXE cluster temporarily unavailable");
            return Err(VaultError::MxeUnavailable.into());
        }
        Err(e) => return Err(e.into()),
    }

    Ok(())
}
```

### Audit Encrypted State Transitions

Maintain logs for debugging and compliance:

```rust
// Emit events for state changes
#[event]
pub struct TransferEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub timestamp: i64,
    // Note: amount is NOT included (it's encrypted)
    pub nonce: u64,
}

pub fn transfer(ctx: Context<Transfer>, encrypted_amount: EncryptedU64) -> Result<()> {
    // ... perform transfer ...

    emit!(TransferEvent {
        from: ctx.accounts.from_vault.key(),
        to: ctx.accounts.to_vault.key(),
        timestamp: Clock::get()?.unix_timestamp,
        nonce: ctx.accounts.from_vault.balance.nonce,
    });

    Ok(())
}
```

### Minimize Decryption Surface

Every decryption is a potential privacy leak. Design to minimize decryption:

```rust
// Bad: Decrypt to check balance
pub fn bad_balance_check(ctx: Context<Check>) -> Result<bool> {
    let balance = ctx.accounts.mxe.decrypt(&ctx.accounts.vault.balance.amount)?;
    Ok(balance > 0) // Leaked the actual balance!
}

// Better: Compare encrypted values
pub fn better_balance_check(ctx: Context<Check>) -> Result<()> {
    let zero = ctx.accounts.mxe.encrypt_u64(0)?;
    let is_positive = ctx.accounts.vault.balance.amount.gt(&zero)?;
    // Only reveals boolean, not the value
    require!(ctx.accounts.mxe.verify_true(&is_positive)?, VaultError::ZeroBalance);
    Ok(())
}
```

## Next Steps

You now have a working MPC application on Solana. Here is where to go next:

**Explore Advanced Features**

- Conditional transfers (if balance > X, then transfer Y)
- Encrypted auctions with sealed bids
- Private voting with token-weighted power
- Confidential lending with collateral verification

**Study the Arcium Documentation**

The official docs at docs.arcium.com cover advanced topics:

- Custom MPC circuits
- Cross-program MPC invocations
- Mainnet deployment requirements
- MXE operator requirements

**Join the Community**

- Arcium Discord for developer support
- The Solana Privacy Hack (January 2026) for building with other teams
- SIP Protocol for complementary privacy primitives

**Consider Hybrid Approaches**

MPC excels at computation over encrypted data. Other techniques excel at other properties:

- Stealth addresses for recipient privacy
- Pedersen commitments for amount hiding without MPC overhead
- ZK proofs for succinct verification

A comprehensive privacy solution often combines multiple approaches.

## Conclusion

Multi-Party Computation enables a class of privacy applications impossible with other techniques. When you need to compute over data without revealing it—swaps, auctions, lending, voting—MPC is the tool.

Arcium brings this to Solana with production-grade infrastructure. The Arcis framework makes it accessible to Anchor developers, while the MXE cluster handles the distributed computation.

The vault we built demonstrates the core patterns:

1. Define encrypted types with `#[derive(Encrypted)]`
2. Encrypt at system boundaries
3. Compute over ciphertexts using `.add()`, `.sub()`, `.gte()`
4. Verify conditions without decrypting values
5. Decrypt only when necessary, with access control

Privacy is not a feature you bolt on at the end. It requires designing for confidentiality from the start. With tools like Arcium, that design is now within reach for Solana developers.

The code in this tutorial is available on GitHub. The APIs will evolve as Arcium approaches mainnet, but the concepts remain constant. Build something private.

---

*This is Part 12 of our Privacy Education Series. See also: "MPC and Confidential Computing: How Arcium Enables Private DeFi" for the theoretical foundation.*
