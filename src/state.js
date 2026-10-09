import { useEffect, useState } from 'react'
import { PRODUCTS, CHALLENGES, COIN_CAP, coinsFor } from './data'

const KEY = 'city-dash-v3'

export const INITIAL = {
  coins: 4000,
  best: 0,
  runs: 0,
  wardrobe: [], // outfit ids your runner owns (from real purchases)
  saving: 'headphones', // product you're saving coins for
  challenges: {}, // id -> { progress, done, claimed }
  orders: [],
  seenHow: false,
}

export function usePersistentState() {
  const [s, setS] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL
    } catch {
      return INITIAL
    }
  })
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage unavailable */ }
  }, [s])
  return [s, setS]
}

export const productById = (id) => PRODUCTS.find((p) => p.id === id)
export const challengeById = (id) => CHALLENGES.find((c) => c.id === id)

// Most coins you're allowed to use on a product (50% of its price)
export const capCoins = (prod) => coinsFor(prod.price * COIN_CAP)
// Coins you'll actually use = what you have, up to the cap
export const usableCoins = (s, prod) => Math.min(s.coins, capCoins(prod))

export const wearOf = (s) => Object.fromEntries(s.wardrobe.map((w) => [w, true]))

export function applyRun(s, r) {
  const next = { ...s, challenges: { ...s.challenges } }
  next.coins = s.coins + r.coins
  next.runs = s.runs + 1
  const newBest = r.meters > s.best
  if (newBest) next.best = r.meters

  const challengeUpdates = []
  for (const c of CHALLENGES) {
    const prev = s.challenges[c.id] || { progress: 0, done: false, claimed: false }
    if (prev.done) continue
    const progress = Math.min(c.target, c.kind === 'best' ? Math.max(prev.progress, r[c.stat]) : prev.progress + r[c.stat])
    const done = progress >= c.target
    next.challenges[c.id] = { ...prev, progress, done }
    if (progress !== prev.progress) challengeUpdates.push({ c, before: prev.progress, after: progress, justDone: done })
  }

  const prod = s.saving && productById(s.saving)
  const saving = prod && {
    prod,
    before: Math.min(1, s.coins / capCoins(prod)),
    after: Math.min(1, next.coins / capCoins(prod)),
  }

  return [next, { r, newBest, prevBest: s.best, coinsAfter: next.coins, saving, challengeUpdates }]
}

export const ORDER_STEPS = ['Ordered', 'Packed', 'Shipped', 'Delivered']
export const orderStep = (o, now) => (o.digital ? 3 : Math.min(3, Math.floor((now - o.at) / 20000)))
