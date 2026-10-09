// Economy assumptions — see NOTES.md
export const COIN_TO_INR = 0.1 // 10 coins = ₹1
export const coinsFor = (inr) => Math.round(inr / COIN_TO_INR)
export const inrFor = (coins) => coins * COIN_TO_INR

// Coin cap grows with player level: loyalty is rewarded, margins are protected
export const CAP_TIERS = [
  { minLevel: 1, cap: 0.25, label: 'Rookie' },
  { minLevel: 10, cap: 0.4, label: 'Pro' },
  { minLevel: 20, cap: 0.6, label: 'Legend' },
]
export const tierFor = (level) => [...CAP_TIERS].reverse().find((t) => level >= t.minLevel)
export const nextTier = (level) => CAP_TIERS.find((t) => t.minLevel > level)

export const PRODUCTS = [
  {
    id: 'buds',
    name: 'Wireless Earbuds Pro',
    brand: 'SoundBox',
    emoji: '🎧',
    price: 1499,
    rarity: 'Epic',
    tag: 'Low-latency game mode',
    reason: 'You play 40+ min with sound on',
    bonus: { name: 'Golden Exhaust Trail', emoji: '✨' },
    delivery: '3–4 days',
    gradient: 'linear-gradient(135deg,#7c3aed,#db2777)',
  },
  {
    id: 'fan',
    name: 'Phone Cooler Fan',
    brand: 'ChillTech',
    emoji: '❄️',
    price: 799,
    rarity: 'Rare',
    tag: 'No more thermal throttling',
    reason: 'Your sessions often run 30+ min',
    bonus: { name: 'Frost Wheels', emoji: '🛞' },
    delivery: '2–3 days',
    gradient: 'linear-gradient(135deg,#0ea5e9,#22d3ee)',
  },
  {
    id: 'movie',
    name: 'Movie Ticket Voucher',
    brand: 'CineMax',
    emoji: '🎬',
    price: 250,
    rarity: 'Common',
    tag: 'Instant digital delivery',
    reason: 'Brand-sponsored — pay fully in coins',
    sponsored: true,
    bonus: { name: '2x Coins for 1 hour', emoji: '⚡' },
    delivery: 'Instant',
    gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
  },
  {
    id: 'drink',
    name: 'Energy Drink (6-pack)',
    brand: 'VoltUp',
    emoji: '🥤',
    price: 360,
    rarity: 'Common',
    tag: 'Brand-sponsored drop',
    reason: 'Sponsored by VoltUp — up to 100% coins',
    sponsored: true,
    bonus: { name: 'Volt Nitro Boost x3', emoji: '🔋' },
    delivery: '1–2 days',
    gradient: 'linear-gradient(135deg,#22c55e,#84cc16)',
  },
  {
    id: 'mouse',
    name: 'RGB Gaming Mouse',
    brand: 'ClickForge',
    emoji: '🖱️',
    price: 999,
    rarity: 'Rare',
    tag: '7200 DPI, 6 buttons',
    reason: 'Popular with Pro-tier racers',
    bonus: { name: 'Neon Underglow', emoji: '💡' },
    delivery: '3–5 days',
    gradient: 'linear-gradient(135deg,#6366f1,#06b6d4)',
  },
  {
    id: 'hoodie',
    name: 'Nitro Rush Official Hoodie',
    brand: 'Nitro Rush',
    emoji: '🧥',
    price: 1299,
    rarity: 'Legendary',
    tag: 'Limited merch — 500 made',
    reason: 'Only for players who reach Level 15',
    lock: { type: 'level', value: 15, text: 'Reach Level 15' },
    bonus: { name: 'Matching in-game Racer Suit', emoji: '🏎️' },
    delivery: '5–7 days',
    gradient: 'linear-gradient(135deg,#111827,#f43f5e)',
  },
  {
    id: 'keyboard',
    name: 'Mechanical Keyboard',
    brand: 'KeyRush',
    emoji: '⌨️',
    price: 2999,
    rarity: 'Legendary',
    tag: 'Hot-swappable switches',
    reason: 'Unlocks after a 3-win streak',
    lock: { type: 'streak', value: 3, text: 'Win 3 matches in a row' },
    bonus: { name: 'Champion Title Badge', emoji: '🏆' },
    delivery: '4–6 days',
    gradient: 'linear-gradient(135deg,#a855f7,#facc15)',
  },
]

export const RARITY_COLOR = {
  Common: '#94a3b8',
  Rare: '#38bdf8',
  Epic: '#c084fc',
  Legendary: '#fbbf24',
}

// Per-screen product-thinking annotations (toggle with the 💡 button)
export const PM_NOTES = {
  home: [
    'The store is never a pop-up mid-game. Entry points live where players already look: the HUD goal bar and the post-match screen.',
    'A pinned "Goal" product turns shopping into a progression system — every match visibly moves you toward something real.',
  ],
  match: ['Commerce is completely absent during gameplay. Respecting the core loop protects retention, which is the store’s real fuel.'],
  result: [
    'Highest-intent moment = right after a win (dopamine + fresh coins). This is where a time-boxed, personalised Drop appears.',
    'Drops show what the coins just earned are worth in ₹ — making currency feel tangible is the hook.',
  ],
  store: [
    'Merchandising is driven by play behaviour (session length, level, streaks), not browse history.',
    'Rarity tiers + locked items reuse familiar game grammar, so the store feels like part of the game, not an ad.',
    'Brand-sponsored items can be bought 100% with coins — brands pay for the acquisition, players get "free" stuff.',
  ],
  product: [
    'Hybrid slider: players choose the coin/cash mix. A cap (tied to player level) protects margins and the in-game economy from coin farming.',
    'Can’t afford it yet? "Set as Goal" converts a lost sale into a reason to keep playing (retention ↔ commerce flywheel).',
    'Every real purchase ships with an in-game bonus — the physical and digital rewards reinforce each other.',
  ],
  checkout: [
    'Low-friction checkout: saved address + UPI, one screen. Players are in "play mode" — every extra step loses them.',
    'Coins are only deducted after payment succeeds, so a failed payment never costs the player their earned currency.',
  ],
  success: [
    'Purchase closes the loop back into the game: bonus item is equipped instantly, and the delivery becomes a trackable "quest".',
  ],
  orders: ['Order tracking framed as a quest log keeps post-purchase anxiety low and gives a reason to reopen the game.'],
}
