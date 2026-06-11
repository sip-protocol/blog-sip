---
title: 'Crowds vs. Disguises: The Two Ways to Be Private On-Chain'
description: 'Mixers hide you in a crowd; shielded transfers give you a disguise. Four axes of on-chain privacy, what each model protects, and the honest gaps.'
pubDate: 'Jun 11 2026'
category: 'thought-leadership'
tags: ['privacy', 'mixers', 'stealth-addresses', 'pedersen-commitments', 'timing-correlation', 'anonymity-set', 'comparison']
draft: false
author: 'SIP Protocol Team'
tldr: 'Mixer pools hide you in a crowd — privacy scales with volume. Shielded transfers hide you with cryptography — identity and amounts stay private at any volume, but timing needs a crowd or jitter. True of any young shielded system, ours included. Choose by threat model.'
keyTakeaways:
  - 'On-chain privacy has four axes: identity, amount, graph, and timing — every system protects only a subset'
  - 'Mixer pools break the transaction graph with a shared pool + ZK notes; strength = anonymity set = volume'
  - 'Shielded transfers break identity and amount links cryptographically — guarantees hold at zero volume'
  - 'A shielded transfer per se carries no crowd: timing correlation is real at low volume — SIP included'
  - 'Apps should jitter, split, and round amounts regardless of which privacy backend they use'
  - 'Hybrid routing (crowd + disguise) is legitimate engineering — and where the stack is converging'
targetAudience: 'DeFi builders, LPs, and crypto users choosing privacy tooling'
prerequisites:
  - 'Basic understanding of blockchain transactions'
relatedPosts:
  - 'sip-vs-privacycash'
  - 'understanding-pool-mixing-solana'
  - 'pedersen-commitments-explained'
  - 'stealth-addresses-for-humans'
---

There's a particular kind of trader on Solana who has learned to dread being good at their job: the profitable liquidity provider.

Picture one. She's developed real edge on Solana DLMM pools — which pairs, which bin ranges, when to reposition. Her positions print. And because every transaction on Solana is public, her edge has become a broadcast. Copy-trade feeds index profitable wallets and republish their entries to subscribers in near real time. Within seconds of every position she opens, mirrored capital crowds into her bins, dilutes her fee capture, and front-runs her exits.

Here's the detail most people miss: **the bots never knew who she was.** They didn't need her name, her Twitter, or her KYC file. They followed *where money moved*. Her wallet address was identity enough.

When she goes looking for "privacy," she'll find two very different families of tools, each confidently claiming to fix her problem. They don't do the same thing. Most explanations won't tell her that — so this one will.

## Privacy is four different problems

"Private" sounds like one property. On-chain, it's at least four, and an observer attacks each one separately:

| Axis | The question an observer asks | Example attack |
|------|-------------------------------|----------------|
| **Identity** | *Who* is behind this address? | Address reuse links your activity into a profile |
| **Amount** | *How much* moved? | Matching 1,234.56 in → 1,234.56 out |
| **Graph** | *Where* did funds come from and go? | Following the money hop by hop |
| **Timing** | *When* did related things happen? | Deposit at 10:00, withdrawal at 10:01 — probably you |

Every privacy system protects a *subset* of these axes. No deployed system today fully protects all four at once. The two main families — call them **crowds** and **disguises** — pick different subsets, which is exactly why comparing them as "better vs. worse" misses the point.

## Crowds: how mixer pools work

The mixer model (Tornado Cash pioneered it; several Solana protocols run variants today) is a shared pool with a clever exit:

1. Many users deposit into one pool. Funds mingle.
2. Each deposit records a cryptographic note — a commitment in a Merkle tree.
3. To withdraw, you present a zero-knowledge proof that says *"I own one of the deposits in this tree"* — without revealing **which one**.
4. A relayer submits the withdrawal to a fresh address, so even the gas payer doesn't link back to you.

The deposit↔withdraw link is cryptographically severed. That's a genuine break of the **graph** axis, and it's the mixer's superpower.

But notice where the privacy actually comes from: **the crowd.** Your withdrawal could be any of the deposits sitting in the pool — so your protection equals the size and activity of that pool, the *anonymity set*. Ten thousand active deposits: strong. Forty, mostly dormant: you're exposed.

That dependency produces the model's well-known costs:

- **Borrowed anonymity.** Your privacy is rented from other people's volume. Quiet pool, weak privacy — nothing you can do about it.
- **Taint.** The pool mixes everyone's funds, including funds you'd rather not be mixed with. Exchanges and compliance desks treat mixer-sourced deposits with suspicion, and you cannot prove your specific coins are clean — the pool's whole design prevents exactly that.
- **No selective disclosure.** There is no mechanism to show an auditor your flow without breaking your own privacy entirely.
- **Fee floors.** Flat relayer fees or fixed pool denominations make small amounts uneconomical, forcing minimum deposit sizes.

![Mixer pools versus shielded transfers compared across privacy axes](/images/crowds-vs-disguises/crowd-vs-disguise.svg)

## Disguises: how shielded transfers work

The shielded model (the family SIP belongs to) takes a different bet: instead of hiding you in a crowd, it makes the observable data **cryptographically meaningless**. Three pieces do the work:

**Stealth addresses — a new mailbox for every package.** You publish one *meta-address*. Anyone who pays you derives, from it plus a random ephemeral key, a brand-new one-time address that only your private key can detect and claim. A hundred payments to you land on a hundred unconnected addresses. There is nothing to reuse, nothing to profile, and the unlinkability holds even if you're the only user on the network — it's math, not crowd cover.

**Pedersen commitments — a tamper-proof sealed envelope.** Amounts are published as commitments: `C = amount·G + blinding·H`. The envelope *hides* (the amount never appears in the announcement), *binds* (you can't quietly change the contents after sealing), and — the genuinely magical part — commitments are *homomorphic*: envelopes can be added without opening them, so totals verify while individual amounts stay sealed. Two commitments to the identical amount look completely unrelated, which is why amount-matching attacks that work on pools get nothing here.

**Viewing keys — the official envelope opener.** Because the envelope has a designated opener, you get something a mixer structurally cannot offer: *selective disclosure*. Hand a viewing key to your auditor, your accountant, or an exchange's compliance desk, and they can verify your flows — read-only, no spending power, and nothing revealed to the rest of the world. Privacy that can prove itself clean.

![Stealth addresses, Pedersen commitments, and timing correlation explained with analogies](/images/crowds-vs-disguises/three-shielded-concepts.svg)

Identity axis: broken cryptographically. Amount axis: sealed cryptographically at the announcement layer. Both at any volume, from day one.

So what's the catch?

## The honest part: timing

Here is the sentence most privacy marketing won't print: **a shielded transfer, by itself, carries no crowd.**

A disguise is a different kind of protection than a crowd, and the difference shows up on the timing axis. Picture a CCTV operator watching an empty street at 3 AM. One person enters building A at 03:00; one person exits building B at 03:05. The operator doesn't need to see a face to draw the obvious conclusion. A perfect disguise did nothing, because *being the only event in the window* was the identifying signal.

On-chain, the same logic: if a shielded deposit happens and, one minute later, a shielded claim happens — and those are the only two shielded events that hour — an observer doesn't need to break any cryptography to connect them. The timing anonymity set of a shielded system is the set of *concurrent shielded transactions*. A mixer gets its crowd from pooled deposits; a shielded system gets its crowd from traffic.

And every young shielded system starts with thin traffic. **SIP is no exception.** Our identity and amount guarantees don't depend on adoption; our timing privacy does. We'd rather say that plainly than have you discover it in a chain-analysis report.

The good news: timing is the most application-fixable axis there is. Whatever privacy backend you use — pool, shielded, or both — the playbook is the same:

- **Jitter.** Randomize the delay between related operations. Minutes to hours, never a fixed offset.
- **Split.** Break one logical transfer into several, at different times.
- **Round.** Use unremarkable amounts; don't move 1,234.56789 twice.
- **Headroom.** Leave a random unspent residual behind so input and output amounts never sum cleanly — amount correlation needs neat arithmetic to work.

If you're building on a shielded system, treat these as mandatory at low volume — and good hygiene forever. As traffic grows, the ambient crowd thickens and timing attacks degrade on their own; jitter just stops being load-bearing.

## Neither model dominates — pick axes per threat

Go back to our LP. Her adversary is a copy-trade bot: it lives on the **graph** and **timing** axes, and it doesn't care about her legal name. Her playbook is fresh addresses for every position, no direct wallet-to-wallet links, and aggressive jitter on funding flows. A crowd serves her; so does a disguise with disciplined timing hygiene. What she should never do is move funds main-wallet → position-wallet in one clean, instant, exact-amount hop — no tool survives that.

Now picture a fund that must answer to auditors, or anyone whose off-ramp is a regulated exchange. Their binding constraint is the **compliance** dimension: they need privacy from the public *and* provability to specific parties. A mixer is actively dangerous for them — it taints their funds and can't generate evidence of innocence. Viewing keys are the entire game.

Different threats, different axes, different right answers. Which is why the developing pattern across serious applications is **hybrid routing**: a crowd where the graph break matters most, a disguise where identity, amounts, and auditability matter most, and timing discipline everywhere. That's not indecision — it's engineering.

## Where this converges

The two models aren't rivals forever; they compose. A pooled vault whose withdrawals are authorized by ZK notes (the crowd) paying out to stealth addresses with committed amounts and viewing-key disclosure (the disguise) covers all four axes plus compliance in one stack. The building blocks already exist in public: ZK funding-proof circuits, on-chain verifiers with gasless relayer exits on EVM testnets, and the stealth-plus-commitment layer already running in production. Composing them on high-throughput chains is the obvious next chapter for this space — and the direction we're building toward.

## Choosing honestly

If you take one thing from this post: stop asking "which privacy tool is best?" and start asking **"which axes does my threat model need, and which axes does this tool actually cover?"**

And demand the second answer from vendors. A pool should tell you its live anonymity set. A shielded system should tell you its concurrency and what it expects your app to do about timing. Anyone who claims all four axes, at any volume, with no homework left for you — is selling something.

Privacy infrastructure earns trust the same way the rest of cryptography did: by being precise about what it does *not* protect.

## Related reading

- [SIP vs Pool Mixing: The Cryptographic Difference](/blog/sip-vs-privacycash) — the deeper technical comparison
- [Understanding Pool Mixing on Solana](/blog/understanding-pool-mixing-solana) — the crowd model in detail
- [Pedersen Commitments Explained](/blog/pedersen-commitments-explained) — the sealed envelope, with math
- [Stealth Addresses for Humans](/blog/stealth-addresses-for-humans) — the mailbox, gently
