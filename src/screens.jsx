import { useEffect, useState } from 'react'
import RunnerPreview from './components/RunnerPreview'
import { PRODUCTS, CHALLENGES, OUTFITS, COIN_CAP, inrFor } from './data'
import { capCoins, usableCoins, productById, orderStep, ORDER_STEPS, wearOf } from './state'
import { sfx } from './game/audio'

export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
export const num = (n) => Math.round(n).toLocaleString('en-IN')

/* ---------------- shared ---------------- */

export function Coins({ n, big }) {
  return <span className={'coins' + (big ? ' big' : '')}><span className="coin" />{num(n)}</span>
}

function Header({ s, go, back, title }) {
  return (
    <div className="header">
      {back ? <button className="round-btn" onClick={back} aria-label="Back">‹</button> : <div className="logo-sm">CITY<span>DASH</span></div>}
      {title && <h1 className="h-title">{title}</h1>}
      <button className="wallet" onClick={() => go('shop')}>
        <Coins n={s.coins} />
        <small>= {inr(inrFor(s.coins))} off</small>
      </button>
    </div>
  )
}

function Bar({ value, color, from }) {
  return (
    <div className="bar">
      {from != null && <i className="ghost" style={{ width: Math.min(100, from * 100) + '%' }} />}
      <i style={{ width: Math.min(100, value * 100) + '%', background: color }} />
    </div>
  )
}

function Art({ item, size = 'md' }) {
  return <div className={'art ' + size} style={{ background: item.bg || item.color }}><span>{item.emoji}</span></div>
}

export function HowItWorks({ onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="panel how" onClick={(e) => e.stopPropagation()}>
        <h2>How it works</h2>
        <p className="how-sub">The coins you collect in City Dash are worth real money off real products.</p>
        <ol className="steps3">
          <li><span className="si">🏃</span><div><b>Run and collect coins</b><small>Every coin you pick up goes into your wallet.</small></div></li>
          <li><span className="si">🪙</span><div><b>Coins = money off</b><small><b>10 coins = ₹1.</b> Coins can pay for up to <b>half</b> the price of any product in the Shop.</small></div></li>
          <li><span className="si">📦</span><div><b>Pay the rest, get it delivered</b><small>Pay the remaining amount by UPI or card. You also get a matching item for your runner: buy headphones and your runner wears them.</small></div></li>
          <li><span className="si">🎁</span><div><b>Brand challenges = free stuff</b><small>Some brands pay the full price. Finish their in-game challenge and the product is free.</small></div></li>
        </ol>
        <div className="how-who"><b>Who pays for the discount?</b> Brands do, because they want to reach players. PlaySuper connects the game with those brands.</div>
        <button className="btn btn-green wide" onClick={onClose}>Got it. Let's run!</button>
      </div>
    </div>
  )
}

/* ---------------- HOME ---------------- */

export function Home({ s, go, openProduct, play, showHow }) {
  const prod = s.saving && productById(s.saving)
  const cap = prod && capCoins(prod)
  const pct = prod ? Math.min(1, s.coins / cap) : 0
  const left = prod ? Math.max(0, cap - s.coins) : 0
  const claimable = CHALLENGES.filter((c) => s.challenges[c.id]?.done && !s.challenges[c.id]?.claimed).length
  const active = s.orders.filter((o) => !o.done).length
  return (
    <div className="home">
      <Header s={s} go={go} />
      <div className="stage-card">
        <div className="clouds" />
        <RunnerPreview wear={wearOf(s)} height={190} />
        <div className="stage-meta">
          <span>🏆 Best: {num(s.best)} m</span>
          {s.wardrobe.length > 0 && <span>Wearing: {s.wardrobe.map((w) => OUTFITS[w].emoji).join(' ')}</span>}
        </div>
      </div>

      <button className="btn btn-green play" onClick={play}>PLAY</button>

      {prod && (
        <button className="panel saving" onClick={() => openProduct(prod.id)}>
          <div className="saving-top">
            <Art item={prod} size="sm" />
            <div className="saving-body">
              <small>SAVING FOR</small>
              <b>{prod.name}</b>
              <Bar value={pct} />
            </div>
          </div>
          <div className="saving-text">
            Your {num(s.coins)} coins = <b>{inr(inrFor(s.coins))} off</b>.{' '}
            {left > 0 ? <>Collect {num(left)} more for the max <b>{inr(prod.price * COIN_CAP)} off</b> (50%).</> : <b>Max discount reached!</b>}
          </div>
        </button>
      )}

      <div className="tiles">
        <button className="tile blue" onClick={() => go('shop')}><span>🛍️</span><b>Shop</b><small>Real products</small></button>
        <button className="tile orange" onClick={() => go('challenges')}>
          <span>🎁</span><b>Challenges</b><small>Free stuff</small>{claimable > 0 && <i className="badge">{claimable}</i>}
        </button>
        <button className="tile purple" onClick={() => go('orders')}>
          <span>📦</span><b>Orders</b><small>Track delivery</small>{active > 0 && <i className="badge">{active}</i>}
        </button>
      </div>
      <button className="link-btn" onClick={showHow}>❓ How do coins and the Shop work?</button>
    </div>
  )
}

/* ---------------- RESULTS ---------------- */

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

export function Results({ rep, go, openProduct, play }) {
  const { r } = rep
  const coins = useCountUp(r.coins)
  const [w, setW] = useState(rep.saving ? rep.saving.before : 0)
  useEffect(() => {
    if (rep.newBest) sfx.win()
    const t = setTimeout(() => rep.saving && setW(rep.saving.after), 350)
    return () => clearTimeout(t)
  }, [rep])
  return (
    <div className="results">
      <div className={'panel res-head' + (rep.newBest ? ' best' : '')}>
        <div className="res-tag">{rep.newBest ? '🏆 NEW BEST!' : 'RUN OVER'}</div>
        <div className="res-dist">{num(r.meters)} m</div>
        <div className="res-coins">+{coins} <span className="coin" /> collected</div>
      </div>

      <div className="panel wallet-card">
        <small>YOUR WALLET</small>
        <div className="wc-row"><Coins n={rep.coinsAfter} big /><span className="eq">=</span><b className="green">{inr(inrFor(rep.coinsAfter))} off</b></div>
        <div className="wc-note">real products in the Shop</div>
        {rep.saving && (
          <button className="wc-saving" onClick={() => openProduct(rep.saving.prod.id)}>
            <div className="wc-top"><span>{rep.saving.prod.emoji} {rep.saving.prod.name}</span><b className="green">+{Math.round((rep.saving.after - rep.saving.before) * 100)}%</b></div>
            <Bar value={w} from={rep.saving.before} />
          </button>
        )}
      </div>

      {rep.challengeUpdates.map(({ c, after, justDone }) => (
        <button key={c.id} className={'panel ch-update' + (justDone ? ' done' : '')} onClick={() => go('challenges')}>
          <div className="chu-top"><span>{c.emoji} {c.brand}: {c.title}</span><b>{num(after)}/{num(c.target)}</b></div>
          <Bar value={after / c.target} color={c.color} />
          {justDone && <div className="chu-done">🎉 Challenge complete! Claim your free {c.reward}.</div>}
        </button>
      ))}

      <div className="row">
        <button className="btn btn-blue" onClick={() => go('shop')}>Shop</button>
        <button className="btn btn-green" onClick={play}>Play again</button>
      </div>
      <button className="link-btn" onClick={() => go('home')}>Home</button>
    </div>
  )
}

/* ---------------- SHOP ---------------- */

function ChallengeCard({ s, c, claim, compact }) {
  const st = s.challenges[c.id] || { progress: 0 }
  return (
    <div className={'panel ch-card' + (compact ? ' compact' : '')} style={{ '--c': c.color }}>
      <div className="ch-head">
        <Art item={c} size="sm" />
        <div>
          <small>{c.brand} pays 100%</small>
          <b>{c.reward}</b>
          <span className="worth">Worth {inr(c.worth)} · <b>FREE</b></span>
        </div>
      </div>
      <div className="ch-task">Challenge: <b>{c.title}</b></div>
      <Bar value={st.progress / c.target} color={c.color} />
      <div className="ch-foot">
        <small>{num(st.progress)} / {num(c.target)}</small>
        {st.claimed ? <span className="pill">✓ Claimed</span> : st.done ? <button className="btn btn-green sm" onClick={() => claim(c)}>Claim free</button> : <small className="muted">{c.hint}</small>}
      </div>
    </div>
  )
}

export function Shop({ s, go, openProduct, claim, showHow }) {
  return (
    <div className="shop">
      <Header s={s} go={go} back={() => go('home')} title="Shop" />
      <div className="panel rules">
        <div className="rules-title">Spend your game coins on real products</div>
        <div className="rule-chips">
          <span>🪙 10 coins = ₹1</span>
          <span>✂️ Coins pay up to 50%</span>
          <span>🎁 Free in-game item</span>
        </div>
        <button className="link-btn sm" onClick={showHow}>How does this work?</button>
      </div>

      <h3 className="sec">Free from brands <small>finish the challenge, the brand pays</small></h3>
      {CHALLENGES.map((c) => <ChallengeCard key={c.id} s={s} c={c} claim={claim} compact />)}

      <h3 className="sec">Real products <small>coins + cash</small></h3>
      <div className="grid">
        {PRODUCTS.map((p) => {
          const use = usableCoins(s, p)
          const owned = s.wardrobe.includes(p.outfit)
          return (
            <button key={p.id} className="panel card" onClick={() => openProduct(p.id)}>
              <Art item={p} />
              <div className="card-b">
                <div className="card-name">{p.name}</div>
                <s className="mrp">{inr(p.price)}</s>
                <div className="card-pay">{inr(p.price - inrFor(use))}</div>
                {use > 0 && <span className="save-chip">−{inr(inrFor(use))} with coins</span>}
                <div className="card-bonus">{owned ? '✓ bought' : `+ free ${OUTFITS[p.outfit].emoji} in game`}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- PRODUCT ---------------- */

export function Product({ s, prod, go, back, setSaving, buy }) {
  const use = usableCoins(s, prod)
  const cap = capCoins(prod)
  const pay = prod.price - inrFor(use)
  const outfit = OUTFITS[prod.outfit]
  const preview = { ...wearOf(s), [prod.outfit]: true }
  const isSaving = s.saving === prod.id
  return (
    <div className="product">
      <Header s={s} go={go} back={back} />
      <Art item={prod} size="lg" />
      <div className="pd-brand">{prod.brand}</div>
      <h2 className="pd-name">{prod.name}</h2>
      <p className="pd-blurb">{prod.blurb} · 🚚 {prod.delivery}</p>

      <div className="panel breakdown">
        <div className="bd-line"><span>Price</span><span>{inr(prod.price)}</span></div>
        <div className="bd-line green"><span>Your coins ({num(use)} <span className="coin" />)</span><span>−{inr(inrFor(use))}</span></div>
        <div className="bd-line total"><span>You pay</span><span>{inr(pay)}</span></div>
        <div className="bd-note">
          {s.coins < cap
            ? <>Coins can cover up to <b>{inr(prod.price * COIN_CAP)}</b> on this item ({num(cap)} coins). You have {num(s.coins)}. Keep running to save more!</>
            : <>You're using the max: coins cover 50% of the price.</>}
        </div>
      </div>

      <div className="panel bonus">
        <div className="bonus-preview"><RunnerPreview wear={preview} height={110} /></div>
        <div>
          <small>FREE IN-GAME BONUS</small>
          <b>{outfit.emoji} {outfit.name}</b>
          <span>Your runner wears it in every run.</span>
        </div>
      </div>

      <div className="row">
        {!isSaving && s.coins < cap && <button className="btn btn-white" onClick={() => setSaving(prod.id)}>🎯 Save for this</button>}
        <button className="btn btn-green" onClick={() => buy({ item: prod, coins: use, pay })}>Buy for {inr(pay)}</button>
      </div>
      {isSaving && s.coins < cap && <p className="fine center">🎯 You're saving for this. Progress shows on your home screen.</p>}
    </div>
  )
}

/* ---------------- CHECKOUT ---------------- */

export function Checkout({ s, order, go, back, onPay }) {
  const [method, setMethod] = useState('UPI')
  const [paying, setPaying] = useState(false)
  const { item, coins, pay, sponsor } = order
  const digital = item.delivery === 'Instant'
  const submit = () => { setPaying(true); setTimeout(() => onPay(pay === 0 ? (sponsor ? `Paid by ${sponsor}` : 'Coins') : method), 1300) }
  return (
    <div className="checkout">
      <Header s={s} go={go} back={back} title="Checkout" />
      <div className="panel co-item">
        <Art item={item} size="sm" />
        <div><b>{item.name}</b>{item.outfit && <small className="green">+ free {OUTFITS[item.outfit].name} (in game)</small>}</div>
      </div>
      <div className="panel co-box">
        <div className="bd-line"><span>Price</span><span>{inr(item.price ?? item.worth)}</span></div>
        {sponsor ? (
          <div className="bd-line green"><span>Paid by {sponsor} (challenge reward)</span><span>−{inr(item.worth)}</span></div>
        ) : (
          <div className="bd-line green"><span>Coins ({num(coins)})</span><span>−{inr(inrFor(coins))}</span></div>
        )}
        <div className="bd-line"><span>Delivery</span><span className="green">FREE</span></div>
        <div className="bd-line total"><span>To pay</span><span>{inr(pay)}</span></div>
      </div>
      <div className="panel co-box">
        <div className="co-label">{digital ? 'Send to' : 'Deliver to'}</div>
        <div>{digital ? '📱 Your phone (SMS + in-game)' : '🏠 Home · Sector 29, Gurugram 122001'}</div>
      </div>
      {pay > 0 && (
        <div className="panel co-box">
          <div className="co-label">Pay with</div>
          {[['UPI', '⚡ UPI (GPay / PhonePe / Paytm)'], ['Card', '💳 Debit / Credit card']].map(([k, l]) => (
            <label key={k} className={'pay-opt' + (method === k ? ' on' : '')}>
              <input type="radio" checked={method === k} onChange={() => setMethod(k)} /> {l}
            </label>
          ))}
        </div>
      )}
      {coins > 0 && <p className="fine">🔒 Your coins are only used once the payment succeeds.</p>}
      <button className="btn btn-green wide" disabled={paying} onClick={submit}>
        {paying ? 'Processing…' : pay === 0 ? 'Claim for free' : `Pay ${inr(pay)}`}
      </button>
      <p className="fine center">Prototype: no real payment happens.</p>
    </div>
  )
}

/* ---------------- SUCCESS ---------------- */

export function Success({ s, order, go, play }) {
  const outfit = order.item.outfit && OUTFITS[order.item.outfit]
  useEffect(() => { sfx.win() }, [])
  return (
    <div className="success">
      <div className="confetti">{Array.from({ length: 28 }).map((_, i) => <i key={i} style={{ left: i * 3.6 + '%', animationDelay: (i % 7) * 0.1 + 's' }} />)}</div>
      <div className="ok">✓</div>
      <h2>Order placed!</h2>
      <p className="muted">{order.item.name}<br />{order.item.delivery === 'Instant' ? 'Your voucher code is in Orders.' : `Arrives in ${order.item.delivery}.`}</p>
      {outfit && (
        <div className="panel unlocked">
          <small>NEW IN-GAME ITEM</small>
          <RunnerPreview wear={wearOf(s)} height={150} />
          <b>Your runner is now wearing {outfit.name} {outfit.emoji}</b>
        </div>
      )}
      <div className="row">
        <button className="btn btn-white" onClick={() => go('orders')}>Track order</button>
        <button className="btn btn-green" onClick={play}>Play now</button>
      </div>
    </div>
  )
}

/* ---------------- CHALLENGES ---------------- */

export function Challenges({ s, go, claim }) {
  return (
    <div className="challenges">
      <Header s={s} go={go} back={() => go('home')} title="Challenges" />
      <div className="panel explain">Brands pay the <b>full price</b> of these products. Complete the challenge while you play and claim the product for free.</div>
      {CHALLENGES.map((c) => <ChallengeCard key={c.id} s={s} c={c} claim={claim} />)}
    </div>
  )
}

/* ---------------- ORDERS ---------------- */

export function Orders({ s, go, now }) {
  return (
    <div className="orders">
      <Header s={s} go={go} back={() => go('home')} title="Orders" />
      {s.orders.length === 0 && (
        <div className="panel empty"><span>📦</span>No orders yet. Products you buy with coins show up here.<button className="btn btn-blue sm" onClick={() => go('shop')}>Go to Shop</button></div>
      )}
      {s.orders.map((o) => {
        const step = orderStep(o, now)
        return (
          <div className="panel order" key={o.id}>
            <div className="o-top">
              <Art item={o.item} size="xs" />
              <div><b>{o.item.name}</b><small className="muted">#{o.id} · {o.coins > 0 ? `${num(o.coins)} coins + ` : ''}{inr(o.pay)} · {o.method}</small></div>
            </div>
            <div className="track">
              {ORDER_STEPS.map((x, i) => <div key={x} className={i <= step ? 'on' : ''}><i />{x}</div>)}
            </div>
            {o.digital && <div className="voucher">🎟️ Code: <b>CINE-{o.id.slice(-4)}-CD</b></div>}
            {!o.digital && step < 3 && <small className="muted">Demo: status moves forward every ~20 seconds.</small>}
          </div>
        )
      })}
    </div>
  )
}
