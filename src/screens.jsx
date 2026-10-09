import { useEffect, useState } from 'react'
import CarPreview from './components/CarPreview'
import {
  PRODUCTS, SKINS, RARITY, MISSIONS, BRAND_MISSIONS, XP_PER_LEVEL, coinsFor, inrFor, tierFor, nextTier,
} from './data'
import {
  capFor, maxCoinsFor, isLocked, lockProgress, goalTarget, productById, orderStep, ORDER_STEPS,
} from './state'
import { sfx } from './game/audio'

export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
export const num = (n) => Math.round(n).toLocaleString('en-IN')
const pct = (x) => Math.round(x * 100) + '%'

/* ===================== shared bits ===================== */

export function TopBar({ s, go, back, title }) {
  const t = tierFor(s.level)
  return (
    <div className="topbar">
      {back ? (
        <button className="icon-btn" onClick={back} aria-label="Back">←</button>
      ) : (
        <div className="lvl">
          <span className="lvl-badge">{s.level}</span>
          <div>
            <div className="lvl-name">{t.label} Racer</div>
            <div className="xpbar"><i style={{ width: (s.xp / XP_PER_LEVEL) * 100 + '%' }} /></div>
          </div>
        </div>
      )}
      {title && <div className="topbar-title">{title}</div>}
      <button className="coins-pill" onClick={() => go('vault')}>
        <span className="coin-ic" /> {num(s.coins)} <small>≈ {inr(inrFor(s.coins))}</small>
      </button>
    </div>
  )
}

export function Timer({ expires, now }) {
  const sec = Math.max(0, Math.floor((expires - now) / 1000))
  return <span className="timer">{String(Math.floor(sec / 60)).padStart(2, '0')}:{String(sec % 60).padStart(2, '0')}</span>
}

function Bar({ value, color, from }) {
  return (
    <div className="bar">
      {from != null && <i className="bar-prev" style={{ width: Math.min(100, from * 100) + '%' }} />}
      <i style={{ width: Math.min(100, value * 100) + '%', background: color }} />
    </div>
  )
}

function ProductArt({ prod, size = 'md', locked }) {
  return (
    <div className={`p-art ${size}`} style={{ background: prod.gradient }}>
      <span className="p-emoji">{prod.emoji}</span>
      <em className="rarity" style={{ color: RARITY[prod.rarity], borderColor: RARITY[prod.rarity] }}>{prod.rarity}</em>
      {prod.sponsored && <b className="spons">100% COINS</b>}
      {locked && <div className="p-lock">🔒</div>}
    </div>
  )
}

function GoalCard({ s, go, openProduct, compact }) {
  const prod = s.goal && productById(s.goal)
  if (!prod) {
    return <button className="goal empty" onClick={() => go('vault')}>🎯 Pin a real-world reward as your Goal →</button>
  }
  const target = goalTarget(s, prod)
  const p = Math.min(1, s.coins / target)
  const left = Math.max(0, target - s.coins)
  return (
    <button className={'goal' + (compact ? ' compact' : '')} onClick={() => openProduct(prod.id)}>
      <div className="goal-art" style={{ background: prod.gradient }}>{prod.emoji}</div>
      <div className="goal-body">
        <div className="goal-top"><span>GOAL · <b>{prod.name}</b></span><span className="goal-pct">{pct(p)}</span></div>
        <Bar value={p} />
        <div className="goal-sub">
          {left === 0 ? '✅ Max coin discount unlocked. Claim it in the Vault.' : `${num(left)} coins to max discount · ~${Math.max(1, Math.ceil(left / 250))} races`}
        </div>
      </div>
    </button>
  )
}

/* ===================== HOME ===================== */

export function Home({ s, go, openProduct, startRace, now }) {
  const skin = SKINS[s.skin]
  const dropActive = s.drop && s.drop.expires > now
  const openMissions = [...MISSIONS, ...BRAND_MISSIONS].filter((m) => !s.missions[m.id]?.done).length
  const activeOrders = s.orders.filter((o) => !o.rated).length
  return (
    <div className="home">
      <TopBar s={s} go={go} />
      <div className="logo">NITRO<span>RUSH</span></div>
      <div className="showroom" onClick={() => go('garage')}>
        <div className="sun" />
        <CarPreview skin={skin} height={170} />
        <div className="showroom-meta">
          <span>{skin.name}</span>
          <span>🏁 Best {num(s.best)} m</span>
        </div>
      </div>

      <GoalCard s={s} go={go} openProduct={openProduct} />

      {dropActive && (
        <button className="drop-strip" onClick={() => openProduct(s.drop.productId)}>
          <span>🔥 <b>{s.drop.reason}</b> drop: +10% coin power on {productById(s.drop.productId).name}</span>
          <Timer expires={s.drop.expires} now={now} />
        </button>
      )}

      <button className="btn race-btn" onClick={startRace}>
        RACE
        <small>{s.coinBoostRuns > 0 ? `🎬 2× coins active · ${s.coinBoostRuns} races left` : 'Earn coins · beat your best'}</small>
      </button>

      <nav className="dock">
        <button onClick={() => go('garage')}><span>🏎️</span>Garage</button>
        <button onClick={() => go('missions')}><span>🎯</span>Missions{openMissions > 0 && <i className="count">{openMissions}</i>}</button>
        <button onClick={() => go('vault')} className="dock-vault"><span>💎</span>Vault{dropActive && <i className="dot" />}</button>
        <button onClick={() => go('quests')}><span>📦</span>Quests{activeOrders > 0 && <i className="count">{activeOrders}</i>}</button>
      </nav>
    </div>
  )
}

/* ===================== RESULTS ===================== */

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const f = (now) => {
      const k = Math.min(1, (now - t0) / ms)
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(f)
    }
    raf = requestAnimationFrame(f)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function Results({ s, rep, go, openProduct, startRace, now }) {
  const { r } = rep
  const meters = useCountUp(r.meters)
  const earned = useCountUp(rep.pickupCoins + rep.missionCoins, 1100)
  const [goalW, setGoalW] = useState(rep.goal ? rep.goal.before : 0)
  useEffect(() => {
    if (rep.newBest || rep.completed.length) sfx.win()
    const t = setTimeout(() => rep.goal && setGoalW(rep.goal.after), 400)
    return () => clearTimeout(t)
  }, [rep])
  const drop = rep.drop && s.drop && s.drop.expires > now ? rep.drop : null
  const dropProd = drop && productById(drop.productId)

  return (
    <div className="results">
      <div className={'res-head' + (rep.newBest ? ' best' : '')}>
        <div className="res-label">{rep.newBest ? '🏆 NEW PERSONAL BEST' : '💥 WRECKED'}</div>
        <div className="res-meters">{num(meters)}<small> m</small></div>
        {!rep.newBest && <div className="res-sub">Best: {num(rep.prevBest)} m · {num(Math.max(0, rep.prevBest - r.meters))} m short</div>}
        <div className="res-stats">
          <div><b>{r.near}</b><small>near misses</small></div>
          <div><b>{r.smashes}</b><small>smashes</small></div>
          <div><b>×{r.maxCombo || 0}</b><small>best combo</small></div>
          <div><b>{r.cans}</b><small>VoltUp cans</small></div>
        </div>
      </div>

      <div className="res-earn">
        <div className="earn-row">
          <span>Coins earned</span>
          <b className="gold">+{num(earned)} 🪙</b>
        </div>
        <div className="earn-break">
          {r.coins} pickups{rep.boosted && ' × 2 (CineMax boost)'}{rep.missionCoins > 0 && ` + ${rep.missionCoins} mission rewards`}
        </div>
        <div className="earn-row xp">
          <span>Lv {rep.level} · +{rep.xpGain} XP</span>
          <span className="muted">{rep.xp}/{XP_PER_LEVEL}</span>
        </div>
        <Bar value={rep.xp / XP_PER_LEVEL} color="linear-gradient(90deg,#7c3aed,#d946ef)" />
        {rep.leveled && <div className="lvl-up">⬆ LEVEL {rep.level}!</div>}
        {rep.tierUp && (
          <div className="tier-up">
            <b>{rep.tierUp.label.toUpperCase()} TIER UNLOCKED</b>
            Coins can now cover <b>{pct(rep.tierUp.cap)}</b> of any real reward (was {pct(tierFor(rep.level - 1).cap)}).
          </div>
        )}
      </div>

      {rep.unlockedNow.map((id) => {
        const p = productById(id)
        return (
          <button key={id} className="unlock-card" onClick={() => openProduct(id)}>
            <ProductArt prod={p} size="sm" />
            <div>
              <small>REAL REWARD UNLOCKED · {p.brand}</small>
              <b>{p.name}</b>
              <span>Claim it 100% with coins →</span>
            </div>
          </button>
        )
      })}

      {rep.completed.filter((m) => m.reward).length > 0 && (
        <div className="res-missions">
          {rep.completed.filter((m) => m.reward).map((m) => (
            <div key={m.id}>✅ {m.title} <b>+{m.reward} 🪙</b></div>
          ))}
        </div>
      )}

      {rep.goal && (
        <button className="res-goal" onClick={() => openProduct(rep.goal.prod.id)}>
          <div className="goal-top">
            <span>{rep.goal.prod.emoji} {rep.goal.prod.name}</span>
            <b className="green">+{Math.max(0, Math.round((rep.goal.after - rep.goal.before) * 100))}% closer</b>
          </div>
          <Bar value={goalW} from={rep.goal.before} />
          <div className="goal-sub">Your wallet: {num(s.coins)} 🪙 = <b>{inr(inrFor(s.coins))}</b> towards real stuff</div>
        </button>
      )}

      {dropProd && (
        <div className="drop-card" style={{ '--g': dropProd.gradient }}>
          <div className="drop-ribbon">🔥 EARNED DROP · {drop.reason.toUpperCase()} · <Timer expires={drop.expires} now={now} /></div>
          <div className="drop-main">
            <ProductArt prod={dropProd} size="sm" />
            <div>
              <b>{dropProd.name}</b>
              <div className="drop-price">
                <span className="gold">{inr(dropProd.price - inrFor(maxCoinsFor(s, dropProd, now)))}</span>
                <span> + {num(maxCoinsFor(s, dropProd, now))} 🪙</span> <s>{inr(dropProd.price)}</s>
              </div>
              <small>+10% extra coin power for beating your best</small>
            </div>
          </div>
          <button className="btn" onClick={() => openProduct(dropProd.id)}>View drop</button>
        </div>
      )}

      <div className="row">
        <button className="btn ghost-btn" onClick={() => go('home')}>Garage</button>
        <button className="btn" onClick={startRace}>Race again ▶</button>
      </div>
    </div>
  )
}

/* ===================== VAULT ===================== */

function PriceLine({ s, prod, now }) {
  const c = maxCoinsFor(s, prod, now)
  const cap = coinsFor(prod.price * capFor(s, prod, now))
  const cash = prod.price - inrFor(c)
  return (
    <div className="price">
      <div>
        {cash <= 0 ? <b className="gold">FREE</b> : <b className="gold">{inr(cash)}</b>}
        <span className="muted"> + {num(c)} 🪙</span>
      </div>
      <s>{inr(prod.price)}</s>
      {c < cap && <small className="best-hint">Best: {inr(prod.price - inrFor(cap))} with {num(cap)} 🪙</small>}
    </div>
  )
}

export function Vault({ s, go, openProduct, now }) {
  const t = tierFor(s.level)
  const nt = nextTier(s.level)
  const dropActive = s.drop && s.drop.expires > now
  const open = PRODUCTS.filter((p) => !p.lock)
  const legendary = PRODUCTS.filter((p) => p.lock && p.lock.type !== 'mission')

  return (
    <div className="vault">
      <TopBar s={s} go={go} back={() => go('home')} title="Reward Vault" />
      <div className="vault-hero">
        <div className="vh-label">YOUR COINS ARE WORTH</div>
        <div className="vh-value">{inr(inrFor(s.coins))}</div>
        <div className="vh-sub">in real-world rewards · 10 🪙 = ₹1</div>
        <div className="tier">
          <div className="tier-row"><b>{t.label} tier</b><span>coins cover up to <b>{pct(t.cap)}</b></span></div>
          {nt && (
            <>
              <Bar value={(s.level - t.minLevel + s.xp / XP_PER_LEVEL) / (nt.minLevel - t.minLevel)} color="linear-gradient(90deg,#7c3aed,#22d3ee)" />
              <small>Reach Lv {nt.minLevel} → {nt.label} tier: {pct(nt.cap)} coin power</small>
            </>
          )}
        </div>
      </div>

      {dropActive && (
        <button className="drop-strip" onClick={() => openProduct(s.drop.productId)}>
          <span>🔥 <b>{s.drop.reason}</b> drop is live</span><Timer expires={s.drop.expires} now={now} />
        </button>
      )}

      <GoalCard s={s} go={go} openProduct={openProduct} />

      <h3 className="sec">Brand missions <small>Play to unlock, pay with coins</small></h3>
      <div className="brand-row">
        {BRAND_MISSIONS.map((m) => {
          const prod = productById(m.unlocks)
          const prog = s.missions[m.id]?.progress || 0
          const done = s.unlocked.includes(prod.id)
          return (
            <button key={m.id} className="brand-card" style={{ '--bc': m.color }} onClick={() => (done ? openProduct(prod.id) : go('missions'))}>
              <div className="bc-head"><b>{m.brand}</b><span>{done ? 'UNLOCKED' : 'MISSION'}</span></div>
              <div className="bc-emoji">{prod.emoji}</div>
              <div className="bc-title">{prod.name}</div>
              {done ? <div className="bc-cta">Claim free with coins →</div> : (
                <>
                  <small>{m.desc}</small>
                  <Bar value={prog / m.target} color={m.color} />
                  <small className="muted">{num(prog)} / {num(m.target)}</small>
                </>
              )}
            </button>
          )
        })}
      </div>

      <h3 className="sec">Real rewards <small>Picked for how you play</small></h3>
      <div className="grid">
        {open.map((p) => (
          <button key={p.id} className="card" onClick={() => openProduct(p.id)}>
            <ProductArt prod={p} />
            <div className="card-body">
              <div className="card-name">{p.name}</div>
              <div className="card-why">{p.why}</div>
              <PriceLine s={s} prod={p} now={now} />
              {p.skin && <div className="card-skin">+ {SKINS[p.skin].name} skin</div>}
            </div>
          </button>
        ))}
      </div>

      <h3 className="sec">Legendary <small>Earned, not just bought</small></h3>
      <div className="grid">
        {legendary.map((p) => {
          const locked = isLocked(s, p)
          const lp = lockProgress(s, p)
          return (
            <button key={p.id} className={'card' + (locked ? ' locked' : '')} onClick={() => openProduct(p.id)}>
              <ProductArt prod={p} locked={locked} />
              <div className="card-body">
                <div className="card-name">{p.name}</div>
                {locked ? (
                  <>
                    <div className="card-why">🔒 {p.lock.text}</div>
                    <Bar value={lp.cur / lp.max} color="#fbbf24" />
                  </>
                ) : <PriceLine s={s} prod={p} now={now} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ===================== PRODUCT ===================== */

export function Product({ s, prod, go, back, now, coinsToUse, setCoinsToUse, setGoal, startRace }) {
  const locked = isLocked(s, prod)
  const cap = capFor(s, prod, now)
  const capCoins = coinsFor(prod.price * cap)
  const maxC = maxCoinsFor(s, prod, now)
  const use = Math.min(coinsToUse, maxC)
  const cash = Math.max(0, prod.price - inrFor(use))
  const short = capCoins - s.coins
  const isGoal = s.goal === prod.id
  const dropOn = s.drop && s.drop.expires > now && s.drop.productId === prod.id
  const lp = locked && lockProgress(s, prod)
  const skin = prod.skin && SKINS[prod.skin]

  return (
    <div className="product">
      <TopBar s={s} go={go} back={back} />
      <ProductArt prod={prod} size="lg" locked={locked} />
      {dropOn && <div className="pd-drop">🔥 {s.drop.reason} drop: +10% coin power · <Timer expires={s.drop.expires} now={now} /></div>}

      <div className="pd-brand">{prod.brand}</div>
      <h2 className="pd-name">{prod.name}</h2>
      <div className="pd-tag">{prod.tag} · 🚚 {prod.delivery}</div>

      {skin ? (
        <div className="pd-skin">
          <CarPreview skin={skin} height={92} platform={false} />
          <div>
            <small>EXCLUSIVE IN-GAME UNLOCK</small>
            <b>{skin.name} skin</b>
            <span>Only available with this reward</span>
          </div>
        </div>
      ) : prod.perk && (
        <div className="pd-skin perk"><div className="perk-ic">⚡</div><div><small>IN-GAME BONUS</small><b>{prod.perk}</b></div></div>
      )}

      {locked ? (
        <div className="locked-box">
          <b>🔒 {prod.lock.text} to unlock</b>
          <Bar value={lp.cur / lp.max} color="#fbbf24" />
          <small>{lp.label}</small>
          <button className="btn" onClick={() => (prod.lock.type === 'mission' ? go('missions') : startRace())}>
            {prod.lock.type === 'mission' ? 'View mission' : 'Race to unlock ▶'}
          </button>
        </div>
      ) : (
        <>
          <div className="mixer">
            <div className="mixer-top"><span>Pay with coins</span><b className="gold">{num(use)} 🪙 = {inr(inrFor(use))}</b></div>
            <input type="range" min={0} max={maxC} step={1} value={use} onChange={(e) => setCoinsToUse(+e.target.value)} />
            <div className="mixer-legend">
              <span>All cash</span>
              <span>Coin cap {pct(cap)}{prod.sponsored ? ' · brand-sponsored' : dropOn ? ' · drop boost' : ` · ${tierFor(s.level).label} tier`}</span>
            </div>
            <div className="split">
              <div><small>Coins</small><b>{inr(inrFor(use))}</b></div>
              <div className="plus">+</div>
              <div><small>You pay</small><b>{inr(cash)}</b></div>
              <div className="save">−{Math.round((inrFor(use) / prod.price) * 100)}%</div>
            </div>
            {short > 0 && (
              <div className="short">
                {num(short)} more coins unlocks the full {pct(cap)} discount, about <b>{Math.ceil(short / 250)} races</b>.
              </div>
            )}
          </div>
          <div className="row">
            {short > 0 && !isGoal && <button className="btn ghost-btn" onClick={() => setGoal(prod.id)}>🎯 Set as Goal</button>}
            {short > 0 && isGoal && <button className="btn ghost-btn" onClick={startRace}>🎯 Race for it</button>}
            <button className="btn" onClick={() => { setCoinsToUse(use); go('checkout') }}>
              {cash === 0 ? 'Claim with coins' : `Buy · ${inr(cash)}`}
            </button>
          </div>
          <p className="fine center">MRP {inr(prod.price)} · GST incl. · Free delivery · 7-day returns, coins refunded</p>
        </>
      )}
    </div>
  )
}

/* ===================== CHECKOUT ===================== */

export function Checkout({ s, prod, coins, go, onPay }) {
  const [method, setMethod] = useState('UPI')
  const [paying, setPaying] = useState(false)
  const cash = Math.max(0, prod.price - inrFor(coins))
  const digital = prod.delivery === 'Instant'
  const pay = () => {
    setPaying(true)
    setTimeout(() => onPay(cash === 0 ? 'Coins' : method), 1400)
  }
  return (
    <div className="checkout">
      <TopBar s={s} go={go} back={() => go('product')} title="Checkout" />
      <div className="co-item">
        <ProductArt prod={prod} size="sm" />
        <div>
          <b>{prod.name}</b>
          <small className="green">+ {prod.skin ? `${SKINS[prod.skin].name} skin` : prod.perk} (in-game)</small>
        </div>
      </div>
      <div className="co-box">
        <div className="co-line"><span>Item price</span><span>{inr(prod.price)}</span></div>
        <div className="co-line green"><span>Coins ({num(coins)} 🪙)</span><span>−{inr(inrFor(coins))}</span></div>
        <div className="co-line"><span>Delivery</span><span className="green">FREE</span></div>
        <div className="co-line total"><span>To pay</span><span>{inr(cash)}</span></div>
      </div>
      <div className="co-box">
        <div className="co-label">{digital ? 'Deliver to' : 'Ship to'} <span className="link">Change</span></div>
        {digital ? <div>📱 Voucher code in-app + SMS</div> : <div>🏠 Home · Sector 29, Gurugram 122001</div>}
      </div>
      {cash > 0 && (
        <div className="co-box">
          <div className="co-label">Pay with</div>
          {[['UPI', '⚡ UPI · GPay / PhonePe / Paytm'], ['Card', '💳 Credit / Debit card'], ['PayLater', '🕒 Pay later']].map(([k, l]) => (
            <label key={k} className={'pay-opt' + (method === k ? ' on' : '')}>
              <input type="radio" checked={method === k} onChange={() => setMethod(k)} /> {l}
            </label>
          ))}
        </div>
      )}
      <p className="fine">🔒 Your {num(coins)} coins are held, not spent. They're deducted only after payment succeeds.</p>
      <button className="btn wide" disabled={paying} onClick={pay}>
        {paying ? <span className="spinner" /> : cash === 0 ? `Claim for ${num(coins)} 🪙` : `Pay ${inr(cash)} via ${method}`}
      </button>
      <p className="fine center">Prototype: no real payment is made</p>
    </div>
  )
}

/* ===================== SUCCESS ===================== */

export function Success({ order, go, startRace }) {
  const prod = productById(order.productId)
  const skin = prod.skin && SKINS[prod.skin]
  useEffect(() => { sfx.win() }, [])
  return (
    <div className="success">
      <div className="confetti">{Array.from({ length: 30 }).map((_, i) => <i key={i} style={{ left: (i * 3.4) + '%', animationDelay: (i % 7) * 0.1 + 's' }} />)}</div>
      <div className="ok-badge">✓</div>
      <h2>Order placed!</h2>
      <p className="muted">{prod.name} · #{order.id}<br />{prod.delivery === 'Instant' ? 'Your voucher is ready in Quests' : `Arrives in ${prod.delivery}`}</p>
      {skin ? (
        <div className="reveal">
          <small>EXCLUSIVE SKIN UNLOCKED & EQUIPPED</small>
          <CarPreview skin={skin} height={150} />
          <b>{skin.name}</b>
        </div>
      ) : (
        <div className="reveal"><small>BONUS ACTIVATED</small><div className="perk-big">⚡ {prod.perk}</div></div>
      )}
      <div className="row">
        <button className="btn ghost-btn" onClick={() => go('quests')}>Track quest</button>
        <button className="btn" onClick={startRace}>Race with it ▶</button>
      </div>
    </div>
  )
}

/* ===================== GARAGE ===================== */

export function Garage({ s, go, setS, openProduct, toast }) {
  const [sel, setSel] = useState(s.skin)
  const skin = SKINS[sel]
  const owned = s.skins.includes(sel)
  const exclusiveProd = skin.exclusive && productById(skin.exclusive)
  const buy = () => {
    if (s.coins < skin.price) return toast(`Need ${num(skin.price - s.coins)} more coins`)
    setS((x) => ({ ...x, coins: x.coins - skin.price, skins: [...x.skins, sel], skin: sel }))
    sfx.cash()
    toast(`${skin.name} unlocked & equipped`)
  }
  return (
    <div className="garage">
      <TopBar s={s} go={go} back={() => go('home')} title="Garage" />
      <div className="showroom big">
        <div className="sun" />
        <CarPreview skin={skin} height={190} />
      </div>
      <div className="g-name">{skin.name}</div>
      <div className="g-action">
        {owned ? (
          s.skin === sel ? <button className="btn ghost-btn wide" disabled>✓ Equipped</button>
            : <button className="btn wide" onClick={() => { setS((x) => ({ ...x, skin: sel })); toast(`${skin.name} equipped`) }}>Equip</button>
        ) : exclusiveProd ? (
          <button className="btn wide excl" onClick={() => openProduct(exclusiveProd.id)}>
            🔒 Exclusive: comes with {exclusiveProd.name} →
          </button>
        ) : (
          <button className="btn wide" onClick={buy}>Unlock for {num(skin.price)} 🪙</button>
        )}
      </div>
      <div className="skins">
        {Object.entries(SKINS).map(([id, k]) => {
          const own = s.skins.includes(id)
          return (
            <button key={id} className={'skin' + (sel === id ? ' sel' : '') + (own ? '' : ' notown')} onClick={() => setSel(id)}>
              <div className="sw" style={{ background: k.body === 'rgb' ? 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' : `linear-gradient(135deg, ${k.body}, ${k.accent})` }} />
              <small>{k.name}</small>
              <em>{own ? (s.skin === id ? 'EQUIPPED' : 'OWNED') : k.exclusive ? '💎 REAL REWARD' : `${num(k.price)} 🪙`}</em>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ===================== MISSIONS ===================== */

export function Missions({ s, go, openProduct }) {
  return (
    <div className="missions">
      <TopBar s={s} go={go} back={() => go('home')} title="Missions" />
      <h3 className="sec">Brand missions <small>Sponsored · real rewards</small></h3>
      {BRAND_MISSIONS.map((m) => {
        const st = s.missions[m.id] || { progress: 0 }
        const prod = productById(m.unlocks)
        const done = s.unlocked.includes(prod.id)
        return (
          <div key={m.id} className="mission brand" style={{ '--bc': m.color }}>
            <div className="m-brand">{m.brand} presents</div>
            <div className="m-row">
              <div className="m-ic">{prod.emoji}</div>
              <div className="m-body">
                <b>{m.title}</b>
                <small>{m.desc}</small>
                <Bar value={st.progress / m.target} color={m.color} />
                <small className="muted">{num(st.progress)} / {num(m.target)}{m.type === 'run' ? ' (best single run)' : ''}</small>
              </div>
            </div>
            <div className="m-reward">
              🎁 {m.rewardText}
              {done && <button className="btn small" onClick={() => openProduct(prod.id)}>Claim</button>}
            </div>
          </div>
        )
      })}
      <h3 className="sec">Daily missions <small>Coins for skill</small></h3>
      {MISSIONS.map((m) => {
        const st = s.missions[m.id] || { progress: 0, done: false }
        return (
          <div key={m.id} className={'mission' + (st.done ? ' done' : '')}>
            <div className="m-row">
              <div className="m-ic">{st.done ? '✅' : '🎯'}</div>
              <div className="m-body">
                <b>{m.title}</b>
                <small>{m.desc}</small>
                <Bar value={st.progress / m.target} />
              </div>
              <div className="m-coins">+{m.reward}<small>🪙</small></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ===================== QUESTS (orders) ===================== */

export function Quests({ s, go, setS, now, toast }) {
  const rate = (id) => {
    setS((x) => ({ ...x, coins: x.coins + 100, orders: x.orders.map((o) => (o.id === id ? { ...o, rated: true } : o)) }))
    sfx.cash()
    toast('+100 coins: thanks for rating!')
  }
  return (
    <div className="quests">
      <TopBar s={s} go={go} back={() => go('home')} title="Delivery Quests" />
      {s.orders.length === 0 && (
        <div className="empty">
          <div>📦</div>
          No active quests yet. Claim a real reward from the Vault and track it here like a mission.
          <button className="btn small" onClick={() => go('vault')}>Open Vault</button>
        </div>
      )}
      {s.orders.map((o) => {
        const prod = productById(o.productId)
        const step = orderStep(o, now)
        return (
          <div className="quest" key={o.id}>
            <div className="q-top">
              <ProductArt prod={prod} size="xs" />
              <div>
                <b>{prod.name}</b>
                <small className="muted">#{o.id} · {num(o.coins)} 🪙 + {inr(o.cash)} · {o.method}</small>
              </div>
            </div>
            <div className="steps">
              {ORDER_STEPS.map((x, i) => <div key={x} className={i <= step ? 'on' : ''}><i />{x}</div>)}
            </div>
            {o.digital && <div className="voucher">🎟️ Code: <b>CINE-{o.id.slice(-4)}-NR</b></div>}
            {step === 3 ? (
              o.rated ? <small className="green">✓ Quest complete · reward claimed</small>
                : <button className="btn small" onClick={() => rate(o.id)}>Confirm delivery & rate · +100 🪙</button>
            ) : <small className="muted">Quest reward on delivery: +100 🪙 (updates live, ~20s per step in this demo)</small>}
          </div>
        )
      })}
    </div>
  )
}

export const useNow = () => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

