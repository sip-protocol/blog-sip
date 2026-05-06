---
title: 'Sipher Vault: Devnet Beta is Open'
description: 'Solana privacy primitive in public devnet beta — break sender-to-stealth-recipient correlation via authority-signed CPI to sip_privacy.'
pubDate: 'May 6 2026'
category: 'announcements'
tags: ['sipher', 'vault', 'solana', 'privacy', 'devnet', 'beta', 'cpi', 'stealth-addresses']
draft: false
author: 'SIP Protocol Team'
tldr: 'Sipher Vault devnet beta is open. It closes the sender-side privacy gap stealth addresses alone cannot fix — authority-signed CPI to sip_privacy breaks the on-chain link between sender wallet and stealth recipient.'
keyTakeaways:
  - 'Sipher Vault interposes an authority between sender and stealth recipient, eliminating on-chain TX correlation'
  - 'withdraw_private fires a CPI to sip_privacy.create_transfer_announcement — recipient discovery via viewing key, no out-of-band signaling'
  - '9 instructions across three signer roles: deploy bootstrap, user actions, authority operations'
  - 'Mainnet ships only after hybrid time-plus-metrics gate criteria are satisfied — criteria are public and tracked'
targetAudience: 'Developers evaluating Solana privacy infrastructure, testers from the Solana community'
prerequisites:
  - 'Familiarity with Solana program model (PDAs, CPI, ATAs)'
  - 'Basic understanding of stealth addresses and viewing keys'
relatedPosts:
  - 'sip-roadmap-2026-explained'
  - 'stealth-addresses-eip-5564'
  - 'viewing-keys-compliance'
---

Sipher Vault is now open for public testing on Solana devnet.

This post covers what the vault does, why it exists as a distinct primitive from the underlying stealth address and commitment scheme, how the deposit-to-claim flow works at the instruction level, and the exact criteria that gate the subsequent mainnet deployment.

---

## What Is Sipher Vault?

Sipher Vault is a Solana Anchor program that acts as a privacy primitive for token transfers to stealth recipients. A user deposits SPL tokens into the vault, and an authority — operating a separate keypair from the sender — issues the outbound transfer to the stealth recipient ATA. The authority then fires a cross-program invocation into `sip_privacy` to create an on-chain transfer record, which the recipient discovers via viewing key without any out-of-band signaling.

The program ID is `S1Phr5rmDfkZTyLXzH5qUHeiqZS3Uf517SQzRbU4kHB`. That same ID will be the mainnet program ID — there is no address migration between clusters.

---

## Why a Vault for Privacy?

The question worth addressing first: stealth addresses already hide the recipient. Pedersen commitments hide the amount. Viewing keys give recipients the ability to discover funds cryptographically. What is missing?

The sender side.

When a wallet sends tokens directly to a stealth address — even a correctly derived, one-time stealth address — the originating transaction is fully visible on-chain. The sender's account, the timing, and the amount all appear in the TX history. Anyone watching that wallet can observe that funds left it and infer the recipient from the ATA that received them, regardless of how opaque that ATA's derivation looks to an outside observer. This is a correlation attack at the TX graph level: if you know the sender's wallet and you see a transfer to an address with no prior activity, you can fingerprint the stealth address as theirs.

The vault closes that gap. By interposing an authority between sender and recipient:

- The sender's transaction goes *into* the vault, not to the recipient
- The authority's transaction goes *from* the vault to the stealth recipient
- The on-chain trace shows: sender → vault; vault → stealth ATA
- There is no direct sender → recipient edge in the TX graph

Couple this with `sip_privacy.create_transfer_announcement` — the CPI the vault fires on `withdraw_private` — and the recipient can scan for their funds using their viewing key without the sender having to tell them anything. The `transfer_record` PDA created in `sip_privacy` (program `S1PMFspo4W6BYKHWkHNF7kZ3fnqibEXg3LQjxepS9at`, deployed mainnet March 7 2026) is the discovery mechanism.

This is what "complete" sender-side privacy means on Solana.

---

## Architecture

![Sipher Vault architecture flow](/images/sipher-vault/architecture-diagram.svg)

The flow, step by step:

**1. Deposit.** The user calls `vault.deposit(amount)`. The vault creates a `DepositRecord` PDA seeded from `[b"deposit", user_pubkey, mint, nonce]`. The PDA stores the deposited amount, the collected fee (computed at `fee_bps = 10` of amount), and the deposit timestamp. Tokens move from the user's ATA to the vault's ATA for that mint.

**2. Authority-signed withdrawal.** The authority — a separate keypair from the sender — calls `vault.withdraw_private`. This instruction:
- Verifies the `DepositRecord` is not yet claimed
- Computes the net amount after fee deduction
- Transfers tokens from the vault ATA to the stealth recipient's ATA (using `CreateIdempotent` + `TransferChecked`)
- Fires a CPI to `sip_privacy.create_transfer_announcement`, which creates a `transfer_record` PDA in the `sip_privacy` program state

**3. Recipient discovery.** The recipient scans using their viewing key. The `transfer_record` PDA on `sip_privacy` is the on-chain signal. No out-of-band communication is required between sender and recipient.

**4. Claim.** Once the recipient identifies the stealth ATA containing their funds, they call `claim` on `sip_privacy` to sweep the balance into their regular wallet.

The `DepositRecord` and `VaultConfig` PDAs live on the vault program. The `transfer_record` PDA lives on `sip_privacy`. The authority is the bridge between them.

> **Key property:** The sender's wallet and the recipient's viewing key are never directly linked on-chain. The authority signs the outbound transfer, so the on-chain TX graph shows only vault → stealth ATA, not sender → stealth ATA.

---

## The 9 Instructions

The vault has 9 instructions across three signer roles: deploy-time bootstrap (called once per cluster), user actions, and authority operations.

| Instruction | Signer | Description |
|---|---|---|
| `initialize` | Deploy authority | Creates the `VaultConfig` PDA: fee bps, refund timeout, authority pubkey. Called once at program deployment. |
| `create_vault_token` | Authority | Initializes a vault-side ATA for a given mint before any deposits of that token can be accepted. |
| `create_fee_token` | Authority | Initializes the fee-collection ATA for a given mint. |
| `deposit` | User | User deposits SPL tokens; creates a `DepositRecord` PDA holding deposit metadata, fee, and timestamp. |
| `withdraw_private` | Authority | Transfers to stealth recipient ATA and CPIs into `sip_privacy.create_transfer_announcement` to create the on-chain transfer record. Emits `VaultWithdrawEvent`. |
| `refund` | User | User reclaims their deposit after the 24-hour refund timeout has elapsed. Available if the authority has not yet issued `withdraw_private`. |
| `authority_refund` | Authority | Authority refunds a deposit on the user's behalf. The 24-hour timeout applies equally — it is not bypassed for the authority. |
| `collect_fee` | Authority | Authority collects accumulated fees from the fee ATA. |
| `set_paused` | Authority | Pauses or unpauses the program. When paused, `deposit` returns `ProgramPaused (0x1770)`. Emits `VaultPausedEvent { authority, paused, timestamp }` for off-chain monitoring. |

The `set_paused` instruction, combined with SENTINEL — the LLM-backed security analyst that monitors vault state — gives the authority a tested emergency lever. The pause mechanism was exercised during Phase 3 rehearsal: deposit-during-pause correctly reverts with `ProgramPaused 0x1770` at `lib.rs:92`, and the vault returned to live state in under 20 seconds.

---

## Try It on Devnet

Testing the vault requires devnet SOL and an SPL token. Here is the minimal path:

**1. Get devnet SOL.**
Use the Solana CLI airdrop (`solana airdrop 2 --url devnet`) or the faucet at https://faucet.solana.com.

**2. Open Sipher.**
Navigate to https://sipher.sip-protocol.org. An amber banner at the top of the page confirms you are on the devnet configuration. If no banner is visible, the environment variable `SIPHER_NETWORK` may be misconfigured — file an issue.

**3. Connect your wallet.**
Phantom, Backpack, and Solflare are supported via wallet-standard. The vault is cluster-aware and will reject mainnet wallet configurations.

**4. Deposit a small wSOL amount.**
Use a round amount for simplicity. The vault will compute the fee (10 bps) and create your `DepositRecord` PDA. Note the deposit signature — it is useful if you need to file a bug report.

**5. Generate or specify a stealth recipient address.**
If testing the full flow solo, derive a stealth recipient address from a second keypair's viewing and spending keys using the SIP SDK. If testing only the deposit path, the authority will supply the recipient.

**6. Authority issues withdraw_private.**
This step is currently authority-operated (not self-service). The authority will process devnet withdrawals during the beta period. On mainnet, this operation is automated.

**7. Recipient scans and claims.**
The recipient uses their viewing key to scan for the `transfer_record` PDA in `sip_privacy`, then calls `claim`.

If any step fails — TX reverts, UX confusion, wallet handshake issues, or unexpected behavior — file an issue at https://github.com/sip-protocol/sipher/issues. Include the transaction signature. That TX signature is the fastest path to root cause.

---

## Gate Criteria for Mainnet

Mainnet deployment is conditioned on passing a hybrid time-plus-metrics gate. These criteria are not aspirational targets — they are the inputs to an automated gate-check script. We are publishing them here as a public commitment to what "ready" means.

The gate requires all of the following:

- **Time soak:** At least 3 days have elapsed since public devnet launch
- **Deposit coverage:** At least 5 successful deposits from at least 3 distinct non-team wallets
- **Withdrawal coverage:** At least 3 successful `withdraw_private` calls from at least 2 distinct non-team wallets
- **Refund coverage:** At least 1 successful `authority_refund` — the Phase 3 SENTINEL refund evidence already satisfies this criterion. The refund TX `4YHpsgZpXhvYd9EsCRBjfkhUDgGGitAM3R4gu9EqivtKwMRtamkMN2BUumdZTPbaRt3sQb4mp8QW2YFVZJ2EnYDz` ([Solscan devnet](https://solscan.io/tx/4YHpsgZpXhvYd9EsCRBjfkhUDgGGitAM3R4gu9EqivtKwMRtamkMN2BUumdZTPbaRt3sQb4mp8QW2YFVZJ2EnYDz?cluster=devnet)) confirms the SENTINEL-gated authority refund path works end-to-end. The Phase 3 evidence is committed at `docs/sentinel/evidence/devnet-refund-2026-05-05.json`.
- **Zero unexplained reverts:** Any revert that cannot be classified as user error within one hour of a human reviewing the failed TX invalidates the gate
- **Zero authority interventions:** No `set_paused`, no manual fee adjustments, no cleanup transactions from the authority side

SENTINEL — documented at https://docs.sip-protocol.org/sipher/sentinel/overview/ — monitors vault state and classifies anomalies in real time. Its advisory mode is live on the current VPS deployment. The gate-check script queries SENTINEL's classification log as part of the "zero unexplained reverts" check.

If the gate has not been passed by Day 7, we run a bug-fix sweep, then reassess. The assessment options are: extend the soak, lower specific numeric thresholds with justification, ship mainnet anyway with disclosed gaps, or defer mainnet to the following sprint. No option is off the table — quality gates exist to surface real information, not to enforce arbitrary ceremony.

---

## What Is Identical Between Devnet and Mainnet

Everything that matters cryptographically and operationally:

- The program binary — same compiled artifact, same instruction logic
- The 24-hour refund timeout enforcement
- The `fee_bps = 10` computation
- The CPI to `sip_privacy.create_transfer_announcement`
- The event emission (`VaultWithdrawEvent`, `VaultPausedEvent`)
- The vanity program ID: `S1Phr5rmDfkZTyLXzH5qUHeiqZS3Uf517SQzRbU4kHB` on both clusters

What changes on mainnet: real tokens, a production-tier RPC endpoint, and the BetaBanner disappears from the Sipher UI. The `SIPHER_NETWORK` environment variable flips from `devnet` to `mainnet` on the VPS, and `docker compose up -d sipher` propagates the change. That is the full mainnet deployment operation, after the gate-check script returns green.

---

## What Comes Next

After the devnet gate passes, we ship mainnet. The announcement will include the beta period TX data as evidence — actual deposit counts, withdrawal counts, distinct wallet participation, and the zero-revert record.

Beyond mainnet, M19 addresses claim linkability — a known gap in the current design where a recipient who repeatedly claims from the same stealth address accumulates a fingerprint. M19 is a separate engineering track, not a blocker for the vault mainnet launch. It is tracked independently.

---

**Try it:** https://sipher.sip-protocol.org

**Technical docs (SENTINEL):** https://docs.sip-protocol.org/sipher/sentinel/overview/

**File a bug:** https://github.com/sip-protocol/sipher/issues
