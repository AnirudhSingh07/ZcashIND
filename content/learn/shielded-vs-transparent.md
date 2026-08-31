---
title: "Shielded vs transparent"
hindi: "शील्डेड बनाम ट्रांसपेरेंट"
description: "Who can see a payment — and how unified addresses keep you private."
order: 3
---

::lead The single most important thing to understand about Zcash: some payments are visible to everyone, and some are visible only to you and the person you paid.

## Who can see a payment?

| | Transparent | Shielded |
|---|---|---|
| Sender address | Public | Hidden |
| Receiver address | Public | Hidden |
| Amount | Public | Hidden |
| Valid & un-forgeable | Yes | Yes |

Both kinds are real Zcash. The difference is what the rest of the world can see. A **shielded** payment is verified by the network using a zero-knowledge proof — the math confirms it's legitimate without exposing the details.

## Unified Addresses (UA)

Older wallets made you juggle separate address types. Modern wallets give you one **Unified Address** that:

- can receive from anyone,
- prefers the **shielded** pool automatically,
- future-proofs you across network upgrades.

When someone asks for your Zcash address, you just share your UA. The wallet handles the rest.

## A simple rule of thumb

- **Want privacy?** Keep funds in the shielded pool and send shielded-to-shielded. This is the default in Zashi and Zingo.
- **Interacting with an exchange or a transparent-only service?** That step may be transparent. Move back to shielded afterwards.

## Why this matters for you

If you're a freelancer receiving cross-border payments, a student, or a merchant, shielded payments mean your balance and your counterparties aren't broadcast to the whole world. That's covered in [Why privacy matters in India](/learn/privacy-in-india).

For the cryptographic details, see [ZecHub](https://zechub.wiki/).

Next: [Choose a wallet →](/learn/wallets)
