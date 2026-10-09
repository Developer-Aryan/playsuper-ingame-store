import { useEffect, useState } from 'react'
import {
  MISSIONS, BRAND_MISSIONS, PRODUCTS, XP_PER_LEVEL, DROP_MINUTES, DROP_BOOST, coinsFor, tierFor,
} from './data'

const KEY = 'nitro-rush-v2'

export const INITIAL = {
  coins: 2600,
  level: 9,
  xp: 260,
  best: 1100,
  runs: 0,
  skins: ['classic'],
  skin: 'classic',
  goal: 'buds',
  missions: {}, // id -> { progress, done }
  unlocked: [], // product ids unlocked through brand missions
  orders: [],
  drop: null, // { productId, expires, reason }
  coinBoostRuns: 0,
  muted: false,
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

export function capFor(s, prod, now = Date.now()) {
  if (prod.sponsored) return 1
  const base = tierFor(s.level).cap
  const dropOn = s.drop && s.drop.expires > now && s.drop.productId === prod.id
  return Math.min(1, base + (dropOn ? DROP_BOOST : 0))
}

export function maxCoinsFor(s, prod, now) {
  return Math.min(s.coins, coinsFor(prod.price * capFor(s, prod, now)))
}

export function isLocked(s, prod) {
  const l = prod.lock
  if (!l) return false
  if (l.type === 'mission') return !s.unlocked.includes(prod.id)
  if (l.type === 'level') return s.level < l.value
  if (l.type === 'best') return s.best < l.value
  return false
}

export function lockProgress(s, prod) {
  const l = prod.lock
  if (l.type === 'level') return { cur: s.level, max: l.value, label: `Level ${s.level} / ${l.value}` }
  if (l.type === 'best') return { cur: s.best, max: l.value, label: `Best ${s.best.toLocaleString('en-IN')} m / ${l.value.toLocaleString('en-IN')} m` }
  const m = BRAND_MISSIONS.find((x) => x.id === l.id)
  const p = s.missions[m.id]?.progress || 0
  return { cur: p, max: m.target, label: `${m.desc} — ${p.toLocaleString('en-IN')} / ${m.target.toLocaleString('en-IN')}` }
}

export function goalTarget(s, prod) {
  return coinsFor(prod.price * (prod.sponsored ? 1 : tierFor(s.level).cap))
}

// Apply a finished run to the player state; returns [nextState, report]
export function applyRun(s, r) {
  const next = { ...s, missions: { ...s.missions }, unlocked: [...s.unlocked] }
  const boosted = s.coinBoostRuns > 0
  const pickupCoins = r.coins * (boosted ? 2 : 1)
  if (boosted) next.coinBoostRuns = s.coinBoostRuns - 1

  // missions
  const completed = []
  const unlockedNow = []
  let missionCoins = 0
  for (const m of [...MISSIONS, ...BRAND_MISSIONS]) {
    const prev = s.missions[m.id] || { progress: 0, done: false }
    if (prev.done) continue
    const progress = m.type === 'run' ? Math.max(prev.progress, r[m.stat]) : prev.progress + r[m.stat]
    const done = progress >= m.target
    next.missions[m.id] = { progress: Math.min(progress, m.target), done }
    if (done) {
      completed.push(m)
      if (m.reward) missionCoins += m.reward
      if (m.unlocks) { next.unlocked.push(m.unlocks); unlockedNow.push(m.unlocks) }
    }
  }

  // xp & level
  const xpGain = Math.floor(r.meters / 5) + r.near * 10 + r.smashes * 15
  let xp = s.xp + xpGain
  let level = s.level
  while (xp >= XP_PER_LEVEL) { xp -= XP_PER_LEVEL; level++ }
  const tierBefore = tierFor(s.level)
  const tierAfter = tierFor(level)

  next.coins = s.coins + pickupCoins + missionCoins
  next.xp = xp
  next.level = level
  next.runs = s.runs + 1

  const newBest = r.meters > s.best
  if (newBest) next.best = r.meters

  let drop = null
  if (newBest) {
    drop = { productId: s.goal || 'buds', expires: Date.now() + DROP_MINUTES * 60000, reason: 'New personal best' }
    next.drop = drop
  }

  const goalProd = s.goal && productById(s.goal)
  const goal = goalProd && {
    prod: goalProd,
    before: Math.min(1, s.coins / goalTarget(next, goalProd)),
    after: Math.min(1, next.coins / goalTarget(next, goalProd)),
  }

  return [next, {
    r, pickupCoins, boosted, missionCoins, xpGain, xp, level,
    leveled: level > s.level, tierUp: tierAfter !== tierBefore ? tierAfter : null,
    completed, unlockedNow, newBest, prevBest: s.best, drop, goal,
  }]
}

export const ORDER_STEPS = ['Ordered', 'Packed', 'Shipped', 'Delivered']
export function orderStep(o, now) {
  if (o.digital) return 3
  return Math.min(3, Math.floor((now - o.at) / 20000))
}
