/* ================= The whole economy in 3 rules =================
   1. You earn coins by playing.             (~250 coins per 1-min run)
   2. 10 coins = ₹1 off a real product.      (coins can pay up to 50% of the price)
   3. Pay the rest in cash → product is delivered + your runner gets a matching item in-game.
   Brand challenges: some brands pay 100% — finish their challenge and the product is free.
*/
export const COIN_TO_INR = 0.1
export const COIN_CAP = 0.5
export const coinsFor = (inr) => Math.round(inr / COIN_TO_INR)
export const inrFor = (coins) => coins * COIN_TO_INR

// In-game items your runner wears. You get them free when you buy the matching real product.
export const OUTFITS = {
  headphones: { name: 'Gold Headphones', emoji: '🎧' },
  sneakers: { name: 'Neon Sneakers', emoji: '👟' },
  hoodie: { name: 'City Dash Hoodie', emoji: '🧥' },
  cap: { name: 'Street Cap', emoji: '🧢' },
}

export const PRODUCTS = [
  {
    id: 'headphones', name: 'Wireless Headphones', brand: 'SoundBox', emoji: '🎧', price: 1499,
    blurb: '30-hour battery · low-latency gaming mode', outfit: 'headphones',
    bg: 'linear-gradient(160deg,#a78bfa,#7c3aed)', delivery: '3–4 days',
  },
  {
    id: 'sneakers', name: 'Running Sneakers', brand: 'Stride', emoji: '👟', price: 2499,
    blurb: 'Lightweight, breathable, all-day comfort', outfit: 'sneakers',
    bg: 'linear-gradient(160deg,#34d399,#059669)', delivery: '4–5 days',
  },
  {
    id: 'hoodie', name: 'Official City Dash Hoodie', brand: 'City Dash', emoji: '🧥', price: 1299,
    blurb: 'Official game merch · limited edition', outfit: 'hoodie',
    bg: 'linear-gradient(160deg,#f472b6,#db2777)', delivery: '5–7 days',
  },
  {
    id: 'cap', name: 'Snapback Cap', brand: 'UrbanCo', emoji: '🧢', price: 599,
    blurb: 'Adjustable fit · embroidered logo', outfit: 'cap',
    bg: 'linear-gradient(160deg,#60a5fa,#2563eb)', delivery: '2–3 days',
  },
]

// Brand challenges: the brand pays the full price; you earn it by playing
export const CHALLENGES = [
  {
    id: 'volt', brand: 'VoltUp', title: 'Collect 10 VoltUp cans', stat: 'cans', target: 10, kind: 'total',
    reward: 'VoltUp Energy Drink 6-pack', worth: 360, emoji: '🥤', color: '#16a34a',
    hint: 'Green VoltUp cans appear on the track. Each one also gives you a speed boost.',
  },
  {
    id: 'cine', brand: 'CineMax', title: 'Run 1,500 m in one run', stat: 'meters', target: 1500, kind: 'best',
    reward: 'Movie ticket voucher', worth: 250, emoji: '🎬', color: '#ea580c',
    hint: 'Survive long enough in a single run.',
  },
]

/* Product thinking, shown beside each screen */
export const NOTES = {
  home: {
    title: 'The game is the product. The store is a feature inside it.',
    points: [
      'The studio\'s game stays the hero. PlaySuper adds a store that makes coins worth real money: 10 coins = ₹1.',
      '"Saving for" pins a real product to the home screen. Every run visibly gets you closer, which gives players a reason to come back.',
      'The store is one tap away but never interrupts play.',
    ],
  },
  race: {
    title: 'Nothing is sold while you play',
    points: [
      'No pop-ups or offers during a run. If the game gets worse, players leave, and then the store has no one to sell to.',
      'Brands appear as part of the game instead. A VoltUp can is a speed boost, and collecting them completes VoltUp\'s challenge.',
    ],
  },
  results: {
    title: 'Show what the coins are worth right after a run',
    points: [
      'After a run, players have just earned coins and feel good. That\'s the moment to say "your coins = ₹264 off real products".',
      'Progress toward the saved product and brand challenges updates right away, so the link between playing and rewards is obvious.',
    ],
  },
  shop: {
    title: 'A simple rule: coins pay up to half',
    points: [
      'Coins can cover up to 50% of any product. The cap protects brand margins and stops people farming coins for free stuff.',
      'Every price is shown three ways: full price, how much your coins take off, and what you actually pay.',
      'Brand challenges are fully paid by the brand. Brands get engaged players, and players get free real products.',
    ],
  },
  product: {
    title: 'Real purchase, matching in-game reward',
    points: [
      'Buy real headphones and your runner wears gold headphones in the game. The bonus is easy to understand, and other players can see it.',
      'Can\'t afford it yet? "Save for this" turns a lost sale into a goal that keeps you playing.',
    ],
  },
  checkout: {
    title: 'Fast checkout, no risk to coins',
    points: [
      'One screen with a saved address and UPI first. The player wants to get back to the game.',
      'Coins are only deducted after payment succeeds, so a failed payment never costs the player coins they earned.',
    ],
  },
  success: {
    title: 'The purchase pays off in the game immediately',
    points: [
      'The matching item is put on your runner instantly, so your next run already looks different.',
      'Delivery is tracked in Orders inside the game, so the player comes back to check on it.',
    ],
  },
  challenges: {
    title: 'Brand challenges replace banner ads',
    points: [
      'Instead of ads, brands sponsor goals: "collect 10 VoltUp cans" earns a real 6-pack.',
      'Brands pay per completed challenge, so PlaySuper earns from engagement rather than impressions.',
    ],
  },
  orders: {
    title: 'Track your order inside the game',
    points: [
      'Delivery status lives inside the game, so checking on an order also brings the player back to play.',
    ],
  },
}
