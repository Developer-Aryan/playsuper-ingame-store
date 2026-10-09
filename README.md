# PlaySuper × Nitro Rush: In-Game Commerce Store

**Live prototype:** https://playsuper-ingame-store.vercel.app

This is a clickable prototype of a store that lives inside a mobile racing game ("Nitro Rush"). Players pay for real-world products with a mix of in-game coins they earned by playing and real money.

> Click the 💡 button on mobile, or read the right-hand panel on desktop. Every screen explains why it was designed the way it was.

## Demo flow (2 minutes)
1. **Home:** your pinned **Goal** (Wireless Earbuds) shows how far you are from the maximum coin discount.
2. **Race:** an 8-second mini-game where you tap coins. No store or ads appear during gameplay.
3. **Post-win result:** a personalised **Win Drop** appears. It runs for 10 minutes and lets coins cover an extra 10% of the price.
4. **Product page:** use the slider to split the price between coins and cash. Coins can only cover part of the price (the **coin cap**), and the cap grows with your player level. If you're short on coins, you can **Set as Goal**.
5. **Checkout:** one screen with a saved address and UPI. Coins are deducted only after payment succeeds.
6. **Success:** the in-game bonus item is equipped on your car straight away, and the delivery becomes a **Quest** you can track.
7. **Store tabs:** *For You* (picked from how you play), *100% Coins* (sponsored by brands), *Unlockables* (gated by level or win streak).

## Core question: how is in-game commerce different from e-commerce?
| Traditional e-commerce | This in-game store |
|---|---|
| The user arrives with intent to buy | Intent is **created by gameplay**. The best moment to show the store is right after a win. |
| Discounts are a marketing cost | Discounts are **earned currency**. Coins carry real ₹ value, which makes play feel more rewarding. |
| Wishlist is passive | **Goal** turns a wishlist into a progression system: products give players a reason to keep playing. |
| Anyone can buy anything | **Unlockables and rarity** use the game's own language. Some merch has to be earned. |
| Purchase ends the journey | Purchase **feeds back into the game**: a bonus cosmetic, plus delivery tracked as a quest. |
| Pricing is fixed | A **coin/cash mix with a level-based cap** protects margins and the in-game economy. |

## Key assumptions
- Mid-core Indian mobile gamers aged 16–28, comfortable paying with UPI.
- 10 coins = ₹1. A typical race earns about 250 coins (≈ ₹25).
- Coin cap is 25% at Rookie (Lv 1–9), 40% at Pro (Lv 10–19) and 60% at Legend (Lv 20+). Brand-sponsored items allow up to 100%.
- PlaySuper and partner brands fund the coin-covered part of the price as a cost of acquiring customers. The game earns a commission and gets better retention.
- No loot boxes or randomised paid rewards. Paying real money for random outcomes is a regulatory and trust risk.

## Tech
Vite + React, with no backend. All state is held in memory (use **Reset demo** to start over). Deployed on Vercel.

## AI / vibe-coding tools used
- **Claude Code** for planning, product reasoning, code generation and deployment
- **Vercel** for hosting

## Run locally
```bash
npm install
npm run dev
```
