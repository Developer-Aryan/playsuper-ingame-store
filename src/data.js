/* ============ Economy (assumptions documented in README) ============ */
export const COIN_TO_INR = 0.1 // 10 coins = ₹1
export const coinsFor = (inr) => Math.round(inr / COIN_TO_INR)
export const inrFor = (coins) => coins * COIN_TO_INR
export const XP_PER_LEVEL = 400
export const DROP_MINUTES = 15
export const DROP_BOOST = 0.1

// Coin cap = max share of an item's price payable in coins. Grows with player level.
export const CAP_TIERS = [
  { minLevel: 1, cap: 0.25, label: 'Rookie' },
  { minLevel: 10, cap: 0.4, label: 'Pro' },
  { minLevel: 20, cap: 0.6, label: 'Legend' },
]
export const tierFor = (level) => [...CAP_TIERS].reverse().find((t) => level >= t.minLevel)
export const nextTier = (level) => CAP_TIERS.find((t) => t.minLevel > level)

/* ============ Car skins (the in-game coin sink) ============ */
export const SKINS = {
  classic: { name: 'Crimson Classic', body: '#e11d48', accent: '#f8fafc', glass: '#1e1b4b', trail: null, price: 0 },
  cyan: { name: 'Neon Cyan', body: '#06b6d4', accent: '#0f172a', glass: '#082f49', trail: '#67e8f9', price: 1500 },
  toxic: { name: 'Toxic Lime', body: '#84cc16', accent: '#1a2e05', glass: '#1a2e05', trail: '#bef264', price: 2500 },
  sunset: { name: 'Sunset Drift', body: '#f97316', accent: '#fde047', glass: '#431407', trail: '#fdba74', price: 3500 },
  gold: { name: 'Gold Rush', body: '#facc15', accent: '#111827', glass: '#1c1917', trail: '#fde047', exclusive: 'buds' },
  glacier: { name: 'Glacier', body: '#e0f2fe', accent: '#38bdf8', glass: '#0c4a6e', trail: '#bae6fd', exclusive: 'fan' },
  blaze: { name: 'Blaze', body: '#ef4444', accent: '#fbbf24', glass: '#450a0a', trail: '#f97316', exclusive: 'triggers' },
  rgb: { name: 'RGB Overdrive', body: 'rgb', accent: 'rgb', glass: '#020617', trail: 'rgb', exclusive: 'mouse' },
  volt: { name: 'VoltUp Racer', body: '#16a34a', accent: '#bef264', glass: '#052e16', trail: '#4ade80', exclusive: 'drink' },
  phantom: { name: 'Phantom', body: '#1f1235', accent: '#d946ef', glass: '#000000', trail: '#d946ef', exclusive: 'hoodie' },
  champion: { name: 'Champion', body: '#f8fafc', accent: '#f59e0b', glass: '#1e293b', trail: '#fbbf24', exclusive: 'keyboard' },
}

/* ============ Real-world rewards ============ */
export const PRODUCTS = [
  {
    id: 'buds', name: 'Wireless Earbuds Pro', brand: 'SoundBox', emoji: '🎧', price: 1499, rarity: 'Epic',
    tag: '40 ms low-latency game mode', why: 'You race with sound on, 25+ min a day', skin: 'gold',
    delivery: '3–4 days', gradient: 'linear-gradient(135deg,#7c3aed,#db2777)',
  },
  {
    id: 'fan', name: 'Phone Cooler Fan', brand: 'ChillTech', emoji: '❄️', price: 799, rarity: 'Rare',
    tag: 'Stops thermal throttling mid-race', why: 'Your sessions run long — keep FPS high', skin: 'glacier',
    delivery: '2–3 days', gradient: 'linear-gradient(135deg,#0284c7,#22d3ee)',
  },
  {
    id: 'mouse', name: 'RGB Gaming Mouse', brand: 'ClickForge', emoji: '🖱️', price: 999, rarity: 'Rare',
    tag: '7200 DPI · 6 programmable buttons', why: 'Top pick among Pro-tier racers', skin: 'rgb',
    delivery: '3–5 days', gradient: 'linear-gradient(135deg,#4f46e5,#06b6d4)',
  },
  {
    id: 'triggers', name: 'Mobile Gaming Triggers', brand: 'GripPro', emoji: '🎮', price: 449, rarity: 'Rare',
    tag: 'Clip-on shoulder triggers', why: 'Built for swipe-heavy racers like you', skin: 'blaze',
    delivery: '2–3 days', gradient: 'linear-gradient(135deg,#dc2626,#f59e0b)',
  },
  {
    id: 'drink', name: 'VoltUp Energy 6-Pack', brand: 'VoltUp', emoji: '🥤', price: 360, rarity: 'Common',
    tag: 'Sponsored — fully payable with coins', why: 'Unlocked by the VoltUp brand mission', skin: 'volt',
    sponsored: true, lock: { type: 'mission', id: 'b_volt', text: 'Complete VoltUp mission' },
    delivery: '1–2 days', gradient: 'linear-gradient(135deg,#15803d,#84cc16)',
  },
  {
    id: 'movie', name: 'Movie Night Voucher', brand: 'CineMax', emoji: '🎬', price: 250, rarity: 'Common',
    tag: 'Instant digital delivery', why: 'Unlocked by the CineMax brand mission', skin: null, perk: '2× coins for your next 3 races',
    sponsored: true, lock: { type: 'mission', id: 'b_cine', text: 'Complete CineMax mission' },
    delivery: 'Instant', gradient: 'linear-gradient(135deg,#ea580c,#dc2626)',
  },
  {
    id: 'hoodie', name: 'Nitro Rush Official Hoodie', brand: 'Nitro Rush', emoji: '🧥', price: 1299, rarity: 'Legendary',
    tag: 'Limited merch — only 500 made', why: 'Only Level 12+ racers can claim it', skin: 'phantom',
    lock: { type: 'level', value: 12, text: 'Reach Level 12' },
    delivery: '5–7 days', gradient: 'linear-gradient(135deg,#1f1235,#d946ef)',
  },
  {
    id: 'keyboard', name: 'Mechanical Keyboard', brand: 'KeyRush', emoji: '⌨️', price: 2999, rarity: 'Legendary',
    tag: 'Hot-swappable switches', why: 'Earned by elite drivers only', skin: 'champion',
    lock: { type: 'best', value: 3000, text: 'Drive 3,000 m in one run' },
    delivery: '4–6 days', gradient: 'linear-gradient(135deg,#a855f7,#f59e0b)',
  },
]

export const RARITY = {
  Common: '#94a3b8',
  Rare: '#38bdf8',
  Epic: '#c084fc',
  Legendary: '#fbbf24',
}

/* ============ Missions ============ */
// type: 'run' = best value in a single run; 'total' = cumulative across runs
export const MISSIONS = [
  { id: 'm_coins', title: 'Coin Collector', desc: 'Collect 120 coins in one run', stat: 'coins', target: 120, type: 'run', reward: 250 },
  { id: 'm_near', title: 'Daredevil', desc: 'Pull off 6 near misses in one run', stat: 'near', target: 6, type: 'run', reward: 300 },
  { id: 'm_smash', title: 'Wrecking Ball', desc: 'Smash 2 cars with nitro in one run', stat: 'smashes', target: 2, type: 'run', reward: 300 },
  { id: 'm_dist', title: 'Marathon', desc: 'Drive 1,500 m in one run', stat: 'meters', target: 1500, type: 'run', reward: 400 },
]

export const BRAND_MISSIONS = [
  {
    id: 'b_volt', brand: 'VoltUp', color: '#16a34a', title: 'Charge Up', desc: 'Collect 10 VoltUp cans on the track',
    stat: 'cans', target: 10, type: 'total', unlocks: 'drink', rewardText: 'Real VoltUp 6-pack — free with coins',
  },
  {
    id: 'b_cine', brand: 'CineMax', color: '#ea580c', title: 'Blockbuster Run', desc: 'Drive 2,000 m in a single run',
    stat: 'meters', target: 2000, type: 'run', unlocks: 'movie', rewardText: 'Real movie ticket — free with coins',
  },
]

/* ============ Product thinking, shown beside every screen ============ */
export const NOTES = {
  home: {
    title: 'The garage is the hub, not a storefront',
    points: [
      'The store sits next to Garage and Missions, because players already treat those as part of the game. It never covers the screen.',
      'A pinned Goal turns a real product into a progress bar. Every race visibly moves you closer, so shopping becomes progression.',
      'Coins have two uses: cosmetic skins or real-world rewards. That trade-off makes the currency feel valuable.',
    ],
  },
  race: {
    title: 'Zero commerce during gameplay',
    points: [
      'No pop-ups, prices or offers while you race. The store depends on retention, so it can\'t be allowed to damage the core loop.',
      'Brands show up natively instead: VoltUp cans are the nitro power-up and billboards line the track. This is sponsorship players actually enjoy.',
      'Every VoltUp can you grab counts toward a brand mission that unlocks a real VoltUp pack. Brand engagement comes from gameplay itself.',
    ],
  },
  results: {
    title: 'The highest-intent moment',
    points: [
      'Right after a run you\'ve earned coins and feel good about it. This is where real-world progress gets shown ("+4% closer to your earbuds").',
      'Offers are earned, not pushed. A Drop appears only after a personal best or a completed mission, so it feels like a reward rather than an ad.',
      'Showing "your wallet = ₹X of real stuff" makes a virtual currency feel tangible.',
    ],
  },
  vault: {
    title: 'A store that speaks the game\'s language',
    points: [
      'Rarity tiers, locked Legendaries and mission unlocks reuse mechanics players already understand, so the store feels like part of the game.',
      'Merchandising is driven by how you play (session length, sound on, skill level), not by browse history.',
      'Sponsored items can be bought 100% with coins. Brands pay to acquire customers and players get real rewards for playing.',
    ],
  },
  product: {
    title: 'Hybrid pricing that protects the economy',
    points: [
      'The slider lets players choose their own mix of coins and cash. A coin cap tied to player level protects margins and stops coin farming.',
      'Short on coins? "Set as Goal" turns a lost sale into a reason to keep playing, so retention and commerce feed each other.',
      'Every real purchase includes an exclusive car skin you can\'t get any other way. The physical and digital rewards reinforce each other.',
    ],
  },
  checkout: {
    title: 'Checkout for players in play mode',
    points: [
      'One screen with a saved address and UPI first. Every extra step loses a player who just wants to get back to racing.',
      'Coins are held, then deducted only after payment succeeds. A failed payment never costs the player coins they earned.',
    ],
  },
  success: {
    title: 'Close the loop back into the game',
    points: [
      'The exclusive skin is equipped instantly, so the purchase pays off in your very next race.',
      'Delivery becomes a Quest you can track, with a coin reward on arrival. That gives the player a reason to come back.',
    ],
  },
  garage: {
    title: 'In-game coin sinks keep coins valuable',
    points: [
      'Skins bought with coins compete with real rewards for the same coins. Without that tension, coins would inflate and lose their meaning.',
      'Exclusive skins (Gold Rush, Phantom and others) can only be unlocked by buying the real product. They signal status inside the game.',
    ],
  },
  missions: {
    title: 'Brand missions: sponsorship as gameplay',
    points: [
      'Brands sponsor goals players already want, like "collect 10 VoltUp cans", rather than banner impressions. The reward is the brand\'s real product.',
      'Brands pay per mission completed (cost per engagement), and that budget funds the coin discount.',
    ],
  },
  quests: {
    title: 'Post-purchase as a quest log',
    points: [
      'Delivery tracking framed as a quest makes the wait part of the game and keeps post-purchase anxiety low.',
      'Confirming delivery and rating the product pays coins. That feeds review data back to the brand and brings the player back.',
    ],
  },
}
