# City Dash: a mobile game with a real-products shop inside

**▶ Play it:** https://playsuper-ingame-store.vercel.app

This is a prototype for the PlaySuper Product Associate assignment: *build a store inside a mobile game where players combine in-game currency and real money to buy real-world products.*

## What's the product?
**The game is the product.** City Dash is an endless runner in the style of Subway Surfers. The shop is a feature inside the game, powered by PlaySuper. Players earn coins by playing, and those coins work as **money off real products**. Brands fund the discounts because they want to reach gamers.

## The loop (the whole logic)
1. 🏃 **Run** and collect coins. Dodge trains, jump red barriers and slide under yellow bars.
2. 🪙 **10 coins = ₹1 off.** Coins can pay for up to **50%** of any product's price.
3. 📦 **Pay the rest** by UPI or card, and the product is delivered.
4. 🎧 Your runner gets a **matching in-game item**: buy real headphones and your runner wears gold headphones in every run.

**Brand challenges** are the bonus: some brands pay **100%** of the price. Complete their challenge in the game and the product is free.
- VoltUp: collect 10 VoltUp cans on the track. Each can is also a speed boost.
- CineMax: run 1,500 m in a single run.

## Why it's different from an e-commerce store
| E-commerce | City Dash shop |
|---|---|
| The shopper arrives already wanting to buy | Players arrive to **play**, so the shop never interrupts a run |
| Discounts are coupons | Discounts are **earned by playing** (coins = ₹) |
| Wishlist | **"Saving for"**: a progress bar on the home screen that every run fills |
| Brands buy banner ads | Brands **sponsor challenges** that are part of the gameplay (VoltUp cans = speed boost) |
| The purchase ends the journey | The purchase **shows up in the game** (matching outfit), and delivery is tracked in-game |

## Controls
←/→ to dodge, ↑ or Space to jump, ↓ to slide, P to pause. On a phone, swipe.

## Built with
Vite + React. The runner engine is hand-written on HTML canvas, the sound is synthesised with WebAudio, and there are no asset files. Deployed on Vercel.

## AI / vibe-coding tools
- **Claude Code (Anthropic):** product reasoning, game engine, UI, browser playtesting and deployment

## Run locally
```bash
npm install
npm run dev
```
