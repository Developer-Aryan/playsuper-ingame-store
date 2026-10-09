# Nitro Rush × PlaySuper: commerce that lives inside the game

**▶ Play it:** https://playsuper-ingame-store.vercel.app

This is a playable prototype for the PlaySuper Product Associate assignment. It's a synthwave lane-racer with a game economy built around it. Players combine coins they earned by racing with real money to buy **real-world products**. Each product also unlocks something exclusive in the game.

> On desktop, a panel next to the phone explains the product reasoning behind each screen. On mobile, tap 💡 to see the same notes.

## The thesis
Most "in-game stores" are e-commerce catalogues pasted into a game. Players arrive at a game wanting to **play**, not to shop, so in this prototype commerce is part of the **reward layer**:

| Traditional e-commerce | Nitro Rush |
|---|---|
| The shopper arrives already wanting to buy | **Gameplay creates the intent**: a pinned Goal product, a Drop after a personal best, brand missions |
| Discounts are a marketing cost | Discounts are **earned currency**, and how much coins can cover grows with your skill level |
| Brands buy banners | Brands are **part of the gameplay**: VoltUp cans *are* the nitro power-up, and collecting them unlocks a real VoltUp pack |
| Wishlist | **Goal**: a progress bar on your garage that every race fills |
| Anyone can buy anything | **Legendary** items are earned (Level 12, 3,000 m run) |
| Purchase ends the journey | Purchase **loops back into the game**: an exclusive car skin is equipped instantly, and delivery becomes a Quest |

## What's in the prototype
- **The game:** 3-lane perspective racer drawn on canvas.
  - Steer with ←/→ or swipe. Grab 3 VoltUp cans to charge nitro, then hit Space or swipe up.
  - Nitro smashes through traffic.
  - Late dodges score near-miss combos.
  - Power-ups: coin magnet and shield.
  - Speed ramps up over the run. Audio is synthesised, with no asset files.
- **Meta loop:** XP and levels, personal best, daily missions, garage skins bought with coins (the coin sink), and progress saved across sessions.
- **Reward Vault (the store):**
  - Your coins are shown as ₹ value.
  - Coin cap by tier: Rookie 25%, Pro 40%, Legend 60%.
  - Pinned Goal and brand missions.
  - Recommendations based on how you play.
  - Locked Legendaries.
- **Product page:** a slider to split the price between coins and cash, a "Set as Goal" option, and a live preview of the exclusive skin.
- **Checkout:** one screen, UPI first. Coins are held and only deducted after payment succeeds.
- **Post-purchase:** the skin is unlocked and equipped, and a delivery Quest tracks the order live and pays +100 coins when it arrives.
- **Never mid-race:** no store, offers or prices during a race or in the pause menu.

## Economy assumptions
- 10 coins = ₹1. A 1-minute race earns about 250 coins.
- Coins are **earned only, never bought**. That keeps "buy coins to buy products" loops out of the economy.
- PlaySuper and partner brands fund the share of the price covered by coins, as a cost of acquiring customers. Brand missions are charged per completion.
- No loot boxes and no random rewards involving real money.

## Built with
Vite + React. The race engine is hand-written on HTML canvas with WebAudio sound and has no game library. Deployed on Vercel.

## AI / vibe-coding tools
- **Claude Code (Anthropic):** product reasoning, game engine, UI, testing and deployment

## Run locally
```bash
npm install
npm run dev
```
