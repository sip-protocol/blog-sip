---
title: 'stealth addresses: one-time addresses without the math'
description: 'how to receive payments without everyone knowing its you. explained simply.'
pubDate: 'Jan 31 2026'
category: 'tutorials'
tags: ['stealth-addresses', 'privacy', 'solana', 'beginners', 'encrypt-trade']
draft: false
author: 'rector'
tldr: 'stealth addresses generate a fresh address for every payment you receive. only you can find and spend the money. no one can link your payments together.'
---

alright so you understand the privacy problem now. everyone can see your transactions. but how do we actually fix it?

one big piece is **stealth addresses**. lemme explain without all the cryptography stuff.

## the problem with normal addresses

you have a solana wallet. lets say its `7abc...xyz`. you share this address to receive payments.

problem: every payment to `7abc...xyz` is now linked to you. your employer pays you there. your friend repays a loan there. you get an airdrop there. all connected. all public.

blockchain analysts see this and go "ah, all these transactions go to the same address, must be the same person". they build a profile on you.

## the stealth address idea

what if every payment you receive went to a DIFFERENT address?

- employer pays you → goes to `8def...123`
- friend repays loan → goes to `9ghi...456`
- airdrop → goes to `2jkl...789`

to everyone watching the blockchain, these look like three completely unrelated addresses. no way to link them.

but heres the magic: **only you can find and spend from all of these addresses**.

## how it works (no math version)

1. you publish a special "meta-address" - think of it like a mailbox number
2. when someone wants to pay you, they use your meta-address to generate a fresh one-time address
3. they send money to that one-time address
4. you (and only you) can detect "hey this payment was meant for me"
5. you (and only you) can spend from that address

the sender doesnt even know the final address until they generate it. its computed on the fly.

## analogy time

imagine you have a PO box, but instead of one box number, you have a magic formula that generates infinite unique box numbers.

- each box number is different
- only you have the master key that opens all of them
- the post office (blockchain) sees mail going to random boxes
- they have no idea theyre all yours

thats basically stealth addresses.

## why this matters

**before stealth addresses:**
```
payment 1 → 0x742d...  (linked to alice)
payment 2 → 0x742d...  (linked to alice)
payment 3 → 0x742d...  (linked to alice)
analyst: "alice received 3 payments totaling X amount"
```

**with stealth addresses:**
```
payment 1 → 0x8a3f...  (who?)
payment 2 → 0x2b7c...  (who?)
payment 3 → 0x9d1e...  (who?)
analyst: "three unrelated addresses received payments. no pattern."
```

same person receiving all three. but nobody can tell.

## the viewing key thing

"but what about taxes? what about audits?"

good question. you can generate a "viewing key" that lets specific people (your accountant, an auditor) see your transactions.

the viewing key is separate from the spending key. so your accountant can see everything but cant steal your money.

its like giving someone read-only access to a spreadsheet. they can look but not edit.

## practical stuff

when you use sip protocol, this happens automatically:
1. you share your meta-address (looks like `sip:solana:0x...`)
2. sender generates stealth address behind the scenes
3. payment goes through
4. you scan for payments using your viewing key
5. money appears in your wallet

you dont have to understand the cryptography. it just works.

## limitations (being honest)

stealth addresses solve recipient privacy. but theres more to full privacy:

- **sender privacy** - still somewhat visible (your address sends the tx)
- **amount privacy** - needs additional tech (pedersen commitments)
- **scanning overhead** - you need to check if payments are yours

sip combines all of these. stealth addresses are one piece of the puzzle.

## tldr

- normal addresses link all your payments together (bad)
- stealth addresses generate fresh address per payment (good)
- only you can detect and spend from your stealth addresses
- viewing keys let auditors see without spending rights
- its automatic when you use privacy-enabled wallets

want the technical deep dive? see our [full stealth address explainer](/blog/stealth-addresses-eip-5564). its got all the math if youre into that.

---

*written while debugging stealth address scanning at 2am. the cryptography is actually beautiful once you get it, but you dont need to get it to use it.*
