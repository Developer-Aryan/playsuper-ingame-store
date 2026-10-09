import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PRODUCTS, RARITY_COLOR, PM_NOTES, coinsFor, inrFor, tierFor, nextTier,
} from './data'

const MATCH_SECONDS = 8
const BASE_REWARD = 120
const COIN_PICKUP = 15
const AVG_MATCH_COINS = 250
const DROP_MINUTES = 10

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
const num = (n) => Math.round(n).toLocaleString('en-IN')

const START = {
  coins: 4200,
  level: 12,
  xp: 55,
  streak: 1,
  goal: 'buds',
  bonuses: [],
  orders: [],
  drop: null, // { productId, expires }
}

export default function App() {
  const [p, setP] = useState(START)
  const [screen, setScreen] = useState('home')
  const [productId, setProductId] = useState(null)
  const [coinsToUse, setCoinsToUse] = useState(0)
  const [lastMatch, setLastMatch] = useState(null)
  const [toast, setToast] = useState(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const dropActive = p.drop && p.drop.expires > now
  const product = PRODUCTS.find((x) => x.id === productId)

  const capFor = (prod) => {
    if (prod.sponsored) return 1
    const base = tierFor(p.level).cap
    return dropActive && p.drop.productId === prod.id ? Math.min(base + 0.1, 1) : base
  }
  const maxCoinsFor = (prod) => Math.min(p.coins, coinsFor(prod.price * capFor(prod)))
  const isLocked = (prod) =>
    prod.lock && ((prod.lock.type === 'level' && p.level < prod.lock.value) ||
      (prod.lock.type === 'streak' && p.streak < prod.lock.value))

  const go = (s) => { setScreen(s); setNotesOpen(false) }
  const openProduct = (id) => {
    const prod = PRODUCTS.find((x) => x.id === id)
    setProductId(id)
    setCoinsToUse(maxCoinsFor(prod))
    go('product')
  }

  const finishMatch = (picked) => {
    const earned = BASE_REWARD + picked * COIN_PICKUP
    const won = picked >= 4
    setP((prev) => {
      let xp = prev.xp + (won ? 45 : 20)
      let level = prev.level
      let leveled = false
      if (xp >= 100) { xp -= 100; level += 1; leveled = true }
      const dropProduct = prev.goal || 'buds'
      setLastMatch({ earned, won, picked, leveled, level, dropProduct })
      return {
        ...prev,
        coins: prev.coins + earned,
        xp,
        level,
        streak: won ? prev.streak + 1 : 0,
        drop: won ? { productId: dropProduct, expires: Date.now() + DROP_MINUTES * 60000 } : prev.drop,
      }
    })
    go('result')
  }

  const placeOrder = (method) => {
    const cash = product.price - inrFor(coinsToUse)
    setP((prev) => ({
      ...prev,
      coins: prev.coins - coinsToUse,
      goal: prev.goal === product.id ? null : prev.goal,
      bonuses: [...prev.bonuses, product.bonus],
      orders: [{ id: 'PS' + Math.floor(Math.random() * 90000 + 10000), product, coins: coinsToUse, cash, method, step: product.delivery === 'Instant' ? 3 : 1, at: new Date() }, ...prev.orders],
    }))
    go('success')
  }

  return (
    <div className="stage">
      <aside className="side intro">
        <div className="brand">PlaySuper <span>× Nitro Rush</span></div>
        <h1>In-Game Commerce Store</h1>
        <p>A clickable prototype of a store that lives <b>inside</b> a mobile racing game — where players combine earned coins with real money to buy real products.</p>
        <ol className="howto">
          <li>Check your <b>Goal</b> on the home screen</li>
          <li>Hit <b>Race</b> and tap coins for 8 sec</li>
          <li>Catch the post-win <b>Drop</b></li>
          <li>Slide coins ↔ cash and check out</li>
        </ol>
        <button className="ghost" onClick={() => { setP(START); go('home') }}>↺ Reset demo</button>
      </aside>

      <div className="phone">
        <div className="notch" />
        <div className="screen">
          {screen === 'home' && (
            <Home p={p} dropActive={dropActive} now={now} go={go} openProduct={openProduct} />
          )}
          {screen === 'match' && <Match onEnd={finishMatch} />}
          {screen === 'result' && lastMatch && (
            <Result m={lastMatch} p={p} now={now} dropActive={dropActive} go={go} openProduct={openProduct} maxCoinsFor={maxCoinsFor} />
          )}
          {screen === 'store' && (
            <Store p={p} go={go} openProduct={openProduct} isLocked={isLocked} maxCoinsFor={maxCoinsFor} dropActive={dropActive} now={now} />
          )}
          {screen === 'product' && product && (
            <Product
              p={p} prod={product} go={go} locked={isLocked(product)} cap={capFor(product)}
              maxCoins={maxCoinsFor(product)} coinsToUse={coinsToUse} setCoinsToUse={setCoinsToUse}
              dropActive={dropActive && p.drop.productId === product.id} now={now}
              setGoal={(id) => { setP((x) => ({ ...x, goal: id })); setToast('🎯 Goal set — it’s now on your home screen') }}
            />
          )}
          {screen === 'checkout' && product && (
            <Checkout prod={product} coins={coinsToUse} go={go} onPay={placeOrder} />
          )}
          {screen === 'success' && <Success order={p.orders[0]} go={go} />}
          {screen === 'orders' && <Orders p={p} go={go} />}

          {toast && <div className="toast">{toast}</div>}
          <button className="notes-fab" onClick={() => setNotesOpen((v) => !v)} title="Why is it designed this way?">💡</button>
          {notesOpen && (
            <div className="notes-sheet" onClick={() => setNotesOpen(false)}>
              <div className="notes-card" onClick={(e) => e.stopPropagation()}>
                <h4>💡 Product thinking — this screen</h4>
                <ul>{(PM_NOTES[screen] || []).map((n) => <li key={n}>{n}</li>)}</ul>
                <button className="btn small" onClick={() => setNotesOpen(false)}>Got it</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="side notes">
        <div className="eyebrow">Why this screen works this way</div>
        <ul>{(PM_NOTES[screen] || []).map((n) => <li key={n}>{n}</li>)}</ul>
      </aside>
    </div>
  )
}

/* ---------------- shared ---------------- */

function Hud({ p, go, back }) {
  const t = tierFor(p.level)
  return (
    <div className="hud">
      {back ? <button className="icon-btn" onClick={back}>←</button> : (
        <div className="lvl"><span className="lvl-badge">{p.level}</span>
          <div><div className="lvl-name">{t.label} Racer</div><div className="xpbar"><i style={{ width: p.xp + '%' }} /></div></div>
        </div>
      )}
      <div className="coins-pill" onClick={() => go && go('store')}>🪙 {num(p.coins)} <small>≈ {inr(inrFor(p.coins))}</small></div>
    </div>
  )
}

function Timer({ expires, now }) {
  const s = Math.max(0, Math.floor((expires - now) / 1000))
  return <span className="timer">⏱ {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</span>
}

function GoalBar({ p, onClick }) {
  const prod = PRODUCTS.find((x) => x.id === p.goal)
  if (!prod) return (
    <div className="goal empty" onClick={onClick}>🎯 No goal yet — pick a real-world reward to race for →</div>
  )
  const target = coinsFor(prod.price * (prod.sponsored ? 1 : tierFor(p.level).cap))
  const pct = Math.min(100, (p.coins / target) * 100)
  const left = Math.max(0, target - p.coins)
  return (
    <div className="goal" onClick={onClick}>
      <div className="goal-icon" style={{ background: prod.gradient }}>{prod.emoji}</div>
      <div className="goal-body">
        <div className="goal-top"><b>Goal: {prod.name}</b><span>{Math.floor(pct)}%</span></div>
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
        <div className="goal-sub">{left === 0 ? '✅ Max coin discount unlocked — claim it!' : `${num(left)} coins to max discount · ~${Math.ceil(left / AVG_MATCH_COINS)} races`}</div>
      </div>
    </div>
  )
}

/* ---------------- screens ---------------- */

function Home({ p, dropActive, now, go, openProduct }) {
  const dropProd = dropActive && PRODUCTS.find((x) => x.id === p.drop.productId)
  return (
    <div className="home">
      <Hud p={p} go={go} />
      <GoalBar p={p} onClick={() => (p.goal ? openProduct(p.goal) : go('store'))} />
      <div className="scene">
        <div className="title-logo">NITRO<span>RUSH</span></div>
        <div className="road"><div className="lanes" /></div>
        <div className="car">🏎️</div>
        {p.bonuses.length > 0 && <div className="equipped">{p.bonuses.map((b, i) => <span key={i} title={b.name}>{b.emoji}</span>)}</div>}
      </div>
      {dropProd && (
        <div className="drop-banner" onClick={() => openProduct(dropProd.id)}>
          <span>🔥 Win Drop: extra 10% coin power on {dropProd.name}</span><Timer expires={p.drop.expires} now={now} />
        </div>
      )}
      <button className="btn play" onClick={() => go('match')}>RACE ▶<small>Earn ~{AVG_MATCH_COINS} 🪙</small></button>
      <div className="dock">
        <button onClick={() => go('store')}><span>🛍️</span>Store{dropActive && <i className="dot" />}</button>
        <button onClick={() => go('orders')}><span>📦</span>Quests{p.orders.length > 0 && <i className="count">{p.orders.length}</i>}</button>
        <button onClick={() => go('home')}><span>🏁</span>Streak {p.streak}</button>
      </div>
    </div>
  )
}

function Match({ onEnd }) {
  const [time, setTime] = useState(MATCH_SECONDS)
  const [coins, setCoins] = useState([])
  const [picked, setPicked] = useState(0)
  const pickedRef = useRef(0)
  const idRef = useRef(0)

  useEffect(() => {
    const spawn = setInterval(() => {
      const id = ++idRef.current
      setCoins((c) => [...c.slice(-6), { id, x: 10 + Math.random() * 75, y: 15 + Math.random() * 60 }])
    }, 420)
    const tick = setInterval(() => setTime((t) => t - 1), 1000)
    return () => { clearInterval(spawn); clearInterval(tick) }
  }, [])

  useEffect(() => { if (time <= 0) onEnd(pickedRef.current) }, [time, onEnd])

  const grab = (id) => {
    setCoins((c) => c.filter((x) => x.id !== id))
    pickedRef.current += 1
    setPicked(pickedRef.current)
  }

  return (
    <div className="match">
      <div className="match-hud"><span>⏱ {Math.max(time, 0)}s</span><span>🪙 +{picked * COIN_PICKUP}</span></div>
      <div className="track">
        <div className="lanes fast" />
        <div className="car racing">🏎️</div>
        {coins.map((c) => (
          <button key={c.id} className="coin" style={{ left: c.x + '%', top: c.y + '%' }} onPointerDown={() => grab(c.id)}>🪙</button>
        ))}
      </div>
      <p className="match-tip">Tap the coins! No ads, no store, no pop-ups during a race.</p>
    </div>
  )
}

function Result({ m, p, now, dropActive, go, openProduct, maxCoinsFor }) {
  const prod = PRODUCTS.find((x) => x.id === m.dropProduct)
  const coinsCanUse = maxCoinsFor(prod)
  return (
    <div className="result">
      <div className={'result-head ' + (m.won ? 'win' : 'lose')}>
        <div className="big">{m.won ? '🏆 1st Place!' : '😤 4th Place'}</div>
        <div className="earned">+{num(m.earned)} 🪙 <small>({m.picked} pickups)</small></div>
        {m.leveled && <div className="levelup">⬆ Level {m.level}! {nextTier(m.level - 1)?.minLevel === m.level ? 'Coin cap upgraded!' : ''}</div>}
        <div className="worth">Your wallet: {num(p.coins)} 🪙 = <b>{inr(inrFor(p.coins))}</b> of real stuff</div>
      </div>

      {m.won && dropActive ? (
        <div className="drop-card" style={{ '--g': prod.gradient }}>
          <div className="drop-ribbon">WIN DROP · <Timer expires={p.drop.expires} now={now} /></div>
          <div className="drop-main">
            <div className="drop-emoji">{prod.emoji}</div>
            <div>
              <div className="drop-name">{prod.name}</div>
              <div className="drop-price"><s>{inr(prod.price)}</s> <b>{inr(prod.price - inrFor(coinsCanUse))}</b> + {num(coinsCanUse)} 🪙</div>
              <div className="drop-sub">+10% extra coin power for winning · comes with {prod.bonus.emoji} {prod.bonus.name}</div>
            </div>
          </div>
          <button className="btn" onClick={() => openProduct(prod.id)}>Claim Drop</button>
        </div>
      ) : (
        <div className="drop-card muted">
          <div className="drop-sub">Win a race to unlock a time-limited Win Drop with extra coin power.</div>
        </div>
      )}

      <div className="row">
        <button className="btn ghost-btn" onClick={() => go('home')}>Home</button>
        <button className="btn" onClick={() => go('match')}>Race again ▶</button>
      </div>
    </div>
  )
}

function Store({ p, go, openProduct, isLocked, maxCoinsFor, dropActive, now }) {
  const [tab, setTab] = useState('foryou')
  const t = tierFor(p.level)
  const nt = nextTier(p.level)
  const list = useMemo(() => {
    if (tab === 'sponsored') return PRODUCTS.filter((x) => x.sponsored)
    if (tab === 'unlock') return PRODUCTS.filter((x) => x.lock)
    return PRODUCTS.filter((x) => !x.lock)
  }, [tab])

  return (
    <div className="store">
      <Hud p={p} go={go} back={() => go('home')} />
      <div className="store-head">
        <h2>Rewards Store</h2>
        <div className="tier-card">
          <div><b>{t.label} tier</b> · coins cover up to <b>{t.cap * 100}%</b> of any item</div>
          {nt && <small>Reach Lv {nt.minLevel} → {nt.cap * 100}% coin cap</small>}
        </div>
      </div>
      {dropActive && (
        <div className="drop-banner" onClick={() => openProduct(p.drop.productId)}>
          <span>🔥 Your Win Drop is live</span><Timer expires={p.drop.expires} now={now} />
        </div>
      )}
      <div className="tabs">
        {[['foryou', 'For You'], ['sponsored', '100% Coins'], ['unlock', 'Unlockables']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="grid">
        {list.map((prod) => {
          const locked = isLocked(prod)
          const c = maxCoinsFor(prod)
          return (
            <div key={prod.id} className={'card' + (locked ? ' locked' : '')} onClick={() => openProduct(prod.id)}>
              <div className="card-img" style={{ background: prod.gradient }}>
                <span>{prod.emoji}</span>
                <em style={{ color: RARITY_COLOR[prod.rarity] }}>{prod.rarity}</em>
                {locked && <div className="lock">🔒<small>{prod.lock.text}</small></div>}
                {prod.sponsored && <div className="spons">Sponsored</div>}
              </div>
              <div className="card-body">
                <div className="card-name">{prod.name}</div>
                <div className="card-why">{prod.reason}</div>
                <div className="card-price">
                  {prod.price - inrFor(c) === 0 ? <b>FREE</b> : <b>{inr(prod.price - inrFor(c))}</b>}
                  <span> + {num(c)}🪙</span>
                </div>
                <s className="mrp">{inr(prod.price)}</s>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Product({ p, prod, go, locked, cap, maxCoins, coinsToUse, setCoinsToUse, dropActive, now, setGoal }) {
  const capCoins = coinsFor(prod.price * cap)
  const cash = prod.price - inrFor(coinsToUse)
  const short = capCoins - p.coins
  const isGoal = p.goal === prod.id
  const lockProgress = locked && (prod.lock.type === 'level' ? `Level ${p.level}/${prod.lock.value}` : `Streak ${p.streak}/${prod.lock.value}`)

  return (
    <div className="product">
      <Hud p={p} go={go} back={() => go('store')} />
      <div className="hero" style={{ background: prod.gradient }}>
        <span>{prod.emoji}</span>
        <em style={{ color: RARITY_COLOR[prod.rarity] }}>{prod.rarity}</em>
        {dropActive && <div className="hero-drop">🔥 Win Drop +10% · <Timer expires={p.drop.expires} now={now} /></div>}
      </div>
      <div className="pd">
        <div className="pd-brand">{prod.brand}</div>
        <h2>{prod.name}</h2>
        <div className="pd-tag">{prod.tag} · 🚚 {prod.delivery}</div>
        <div className="bonus">🎁 Free in-game bonus: <b>{prod.bonus.emoji} {prod.bonus.name}</b></div>

        {locked ? (
          <div className="locked-box">
            <div className="lock-big">🔒 {prod.lock.text} to unlock</div>
            <div className="bar"><i style={{ width: (prod.lock.type === 'level' ? (p.level / prod.lock.value) : (p.streak / prod.lock.value)) * 100 + '%' }} /></div>
            <small>{lockProgress} — exclusives are earned, not just bought.</small>
            <button className="btn" onClick={() => go('match')}>Race to unlock ▶</button>
          </div>
        ) : (
          <>
            <div className="mixer">
              <div className="mixer-top"><span>Pay with coins</span><b>{num(coinsToUse)} 🪙 = {inr(inrFor(coinsToUse))}</b></div>
              <input type="range" min={0} max={maxCoins} step={10} value={coinsToUse} onChange={(e) => setCoinsToUse(+e.target.value)} />
              <div className="mixer-legend">
                <span>0</span>
                <span>Cap: {Math.round(cap * 100)}% ({num(capCoins)} 🪙){prod.sponsored && ' · brand-sponsored'}</span>
              </div>
              <div className="split">
                <div><small>Coins</small><b>{inr(inrFor(coinsToUse))}</b></div>
                <div className="plus">+</div>
                <div><small>You pay</small><b>{inr(cash)}</b></div>
                <div className="save">Save {Math.round((inrFor(coinsToUse) / prod.price) * 100)}%</div>
              </div>
              {short > 0 && (
                <div className="short">You’re <b>{num(short)} coins</b> short of the max discount — about <b>{Math.ceil(short / AVG_MATCH_COINS)} races</b>.</div>
              )}
            </div>
            <div className="row">
              {short > 0 && !isGoal && <button className="btn ghost-btn" onClick={() => setGoal(prod.id)}>🎯 Set as Goal</button>}
              {isGoal && short > 0 && <button className="btn ghost-btn" onClick={() => go('match')}>🎯 Race for it</button>}
              <button className="btn" onClick={() => go('checkout')}>{cash === 0 ? 'Claim with coins' : `Buy · ${inr(cash)}`}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Checkout({ prod, coins, go, onPay }) {
  const [method, setMethod] = useState('UPI')
  const [paying, setPaying] = useState(false)
  const cash = prod.price - inrFor(coins)
  const digital = prod.delivery === 'Instant'
  const pay = () => { setPaying(true); setTimeout(() => onPay(cash === 0 ? 'Coins' : method), 1300) }

  return (
    <div className="checkout">
      <div className="hud"><button className="icon-btn" onClick={() => go('product')}>←</button><b>Checkout</b><span /></div>
      <div className="co-item">
        <div className="goal-icon" style={{ background: prod.gradient }}>{prod.emoji}</div>
        <div><b>{prod.name}</b><small>+ {prod.bonus.emoji} {prod.bonus.name} (in-game)</small></div>
      </div>
      <div className="co-box">
        <div className="co-line"><span>Item price</span><span>{inr(prod.price)}</span></div>
        <div className="co-line green"><span>Coins ({num(coins)} 🪙)</span><span>−{inr(inrFor(coins))}</span></div>
        <div className="co-line"><span>Delivery</span><span className="green">FREE</span></div>
        <div className="co-line total"><span>To pay</span><span>{inr(cash)}</span></div>
      </div>
      <div className="co-box">
        <div className="co-label">{digital ? 'Deliver to' : 'Ship to'} <a>Change</a></div>
        {digital ? <div>📧 Voucher sent in-app + to aryan@email.com</div> : <div>🏠 Aryan · Flat 402, DLF Phase 3, Gurugram 122002</div>}
      </div>
      {cash > 0 && (
        <div className="co-box">
          <div className="co-label">Pay with</div>
          {['UPI', 'Card', 'Wallet'].map((m) => (
            <label key={m} className={'pay-opt' + (method === m ? ' on' : '')}>
              <input type="radio" checked={method === m} onChange={() => setMethod(m)} />
              {m === 'UPI' ? '⚡ UPI (GPay / PhonePe)' : m === 'Card' ? '💳 Credit / Debit card' : '👛 Wallet'}
            </label>
          ))}
        </div>
      )}
      <p className="fine">Coins are deducted only after payment succeeds. Free returns in 7 days — coins are refunded to your wallet.</p>
      <button className="btn wide" disabled={paying} onClick={pay}>
        {paying ? 'Processing…' : cash === 0 ? `Claim for ${num(coins)} 🪙` : `Pay ${inr(cash)} via ${method}`}
      </button>
    </div>
  )
}

function Success({ order, go }) {
  return (
    <div className="success">
      <div className="confetti">{Array.from({ length: 24 }).map((_, i) => <i key={i} style={{ left: (i * 4.2) + '%', animationDelay: (i % 6) * 0.12 + 's' }} />)}</div>
      <div className="big-emoji">{order.product.emoji}</div>
      <h2>Order placed!</h2>
      <p>{order.product.name} is on its way · #{order.id}</p>
      <div className="unlocked">
        <small>IN-GAME REWARD UNLOCKED</small>
        <div>{order.product.bonus.emoji} {order.product.bonus.name}</div>
        <span>Equipped on your car ✓</span>
      </div>
      <div className="row">
        <button className="btn ghost-btn" onClick={() => go('orders')}>Track quest</button>
        <button className="btn" onClick={() => go('home')}>Back to racing ▶</button>
      </div>
    </div>
  )
}

const STEPS = ['Ordered', 'Packed', 'Shipped', 'Delivered']

function Orders({ p, go }) {
  return (
    <div className="orders">
      <Hud p={p} go={go} back={() => go('home')} />
      <h2>Delivery Quests</h2>
      {p.orders.length === 0 && <div className="empty-state">No quests yet. Buy something from the store and track it here like a mission.</div>}
      {p.orders.map((o) => (
        <div className="quest" key={o.id}>
          <div className="quest-top">
            <div className="goal-icon" style={{ background: o.product.gradient }}>{o.product.emoji}</div>
            <div><b>{o.product.name}</b><small>#{o.id} · {num(o.coins)} 🪙 + {inr(o.cash)} ({o.method})</small></div>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => <div key={s} className={i <= o.step ? 'done' : ''}><i />{s}</div>)}
          </div>
          <small className="quest-reward">Quest reward on delivery: +200 🪙 for rating the product</small>
        </div>
      ))}
    </div>
  )
}
