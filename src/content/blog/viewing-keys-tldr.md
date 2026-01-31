---
title: 'viewing keys: how to be private AND compliant'
description: 'privacy doesnt mean hiding from everyone forever. viewing keys let you choose who sees what.'
pubDate: 'Jan 31 2026'
category: 'tutorials'
tags: ['viewing-keys', 'compliance', 'privacy', 'beginners', 'encrypt-trade']
draft: false
author: 'rector'
tldr: 'viewing keys give read-only access to your transactions. share with your accountant for taxes, auditor for compliance, nobody else. private by default, transparent when needed.'
---

biggest objection to blockchain privacy i hear: "but what about compliance? what about taxes? what about regulations?"

fair question. heres the answer: **viewing keys**.

## the false choice

people think privacy means choosing between:
- **option A:** everything public, everyone can see
- **option B:** everything hidden, no one can verify anything

this is a false choice. traditional finance doesnt work this way.

your bank account is private by default. random people cant see your transactions. but your accountant can see them (for taxes). regulators can subpoena them (with legal process). auditors can verify them (with your permission).

thats the model we want. private by default, selectively transparent.

## what are viewing keys

a viewing key is like a read-only password to your transaction history.

you have two types of keys:
- **spending key** - controls your money, signs transactions, never share this
- **viewing key** - can see transactions but cant move money, shareable

sharing your viewing key is like giving someone access to your bank statements pdf. they can look. they cant withdraw.

## why this matters for compliance

lets say youre a business using crypto:

**without viewing keys:**
- your transactions are either public (competitors see everything) or private (cant prove compliance)
- regulators suspicious because you cant show them anything
- accountants cant do their job

**with viewing keys:**
- transactions private by default (competitors see nothing)
- give viewing key to your compliance team → they monitor everything
- give viewing key to auditor → they verify for tax season
- give viewing key to regulator → they see what they need, nothing more

you control the access. you decide who sees what.

## scoped viewing keys

it gets better. you can create viewing keys with limits:

**time-bounded:**
```
"this key only shows transactions from 2025"
```
give this to your tax accountant. they see 2025 for taxes. they dont see 2024 or 2026.

**transaction-specific:**
```
"this key only shows transaction abc123"
```
proving a specific payment happened without revealing your whole history.

**purpose-specific:**
```
"this key shows amounts but not counterparties"
```
useful for aggregate reporting without exposing your vendors/customers.

## how institutions use this

real scenario: crypto hedge fund

- **traders** have spending keys → execute trades
- **compliance team** has viewing key → monitors all activity, cant execute
- **external auditor** has time-scoped key → sees Q4 only for audit
- **regulators** get keys only when legally required

everyone who needs access has it. no one has more than they need. funds are safe because only traders have spending keys.

this is exactly how tradfi works. were just doing it on blockchain.

## the "criminal" argument

"but criminals will use this to hide money"

few things:

1. cash is still way better for crime (no blockchain trail at all)
2. exchanges still do KYC - you cant get in/out of crypto anonymously at scale
3. viewing keys mean regulators CAN see when needed
4. the privacy is from random people, not from legal authorities with proper process

compare to tornado cash which had no disclosure mechanism. that got sanctioned because there was literally no way to provide compliance.

viewing keys are the opposite. built for compliance from day one.

## practical example

you want to file taxes on your crypto gains:

**old way:**
- export entire transaction history (public anyway)
- give accountant everything
- hope they dont leak it

**viewing key way:**
```
1. generate viewing key scoped to tax year
2. encrypt it to your accountants public key
3. send to accountant
4. they decrypt, see only what they need
5. key expires after tax season
```

accountant gets exactly what they need. nothing more. and if the key leaks, it only shows one years data, and its read-only anyway.

## tldr

- viewing keys = read-only access to transactions
- private by default, transparent when YOU decide
- scope by time, transaction, or purpose
- this is how tradfi works, we're bringing it to crypto
- built for compliance, not for hiding crime

for the full technical implementation, check the [detailed viewing keys post](/blog/viewing-keys-compliance). but honestly, you dont need to understand the cryptography. just know that its possible to be private AND compliant.

---

*written after explaining this to like 10 different compliance officers. they all had the same concerns. they all got it once viewing keys clicked.*
