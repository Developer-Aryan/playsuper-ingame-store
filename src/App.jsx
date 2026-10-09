import { useCallback, useEffect, useMemo, useState } from 'react'
import Race from './components/Race'
import { NOTES } from './data'
import { usePersistentState, applyRun, productById, wearOf, INITIAL } from './state'
import { Home, Results, Shop, Product, Checkout, Success, Challenges, Orders, HowItWorks } from './screens'

const DOC_URL = 'https://claude.ai/code/artifact/53476a39-69ce-4b78-a1a3-b8be6b7a4635'
const REPO_URL = 'https://github.com/Developer-Aryan/playsuper-ingame-store'

function useNow() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

export default function App() {
  const [s, setS] = usePersistentState()
  const [screen, setScreen] = useState('home')
  const [backTo, setBackTo] = useState('shop')
  const [productId, setProductId] = useState(null)
  const [order, setOrder] = useState(null) // pending checkout
  const [report, setReport] = useState(null)
  const [runId, setRunId] = useState(0)
  const [how, setHow] = useState(!s.seenHow)
  const [toast, setToast] = useState(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const now = useNow()
  const wear = useMemo(() => wearOf(s), [s.wardrobe]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2300)
    return () => clearTimeout(t)
  }, [toast])

  const go = useCallback((sc) => { setScreen(sc); setNotesOpen(false) }, [])
  const closeHow = () => { setHow(false); setS((x) => ({ ...x, seenHow: true })) }
  const play = () => { setRunId((n) => n + 1); go('run') }
  const openProduct = (id) => { if (screen !== 'product') setBackTo(screen); setProductId(id); go('product') }

  const finishRun = (r) => {
    if (!r) return go('home')
    const [next, rep] = applyRun(s, r)
    setS(next)
    setReport(rep)
    go('results')
  }

  const buy = (o) => { setOrder(o); go('checkout') }
  const claim = (c) => {
    setOrder({ item: { id: c.id, name: c.reward, emoji: c.emoji, bg: c.color, price: c.worth, worth: c.worth, delivery: c.id === 'cine' ? 'Instant' : '1–2 days', challenge: c.id }, coins: 0, pay: 0, sponsor: c.brand })
    go('checkout')
  }

  const placeOrder = (method) => {
    const { item, coins, pay } = order
    const o = { id: 'CD' + Math.floor(Math.random() * 900000 + 100000), item, coins, pay, method, at: Date.now(), digital: item.delivery === 'Instant' }
    setS((x) => ({
      ...x,
      coins: x.coins - coins,
      wardrobe: item.outfit && !x.wardrobe.includes(item.outfit) ? [...x.wardrobe, item.outfit] : x.wardrobe,
      saving: x.saving === item.id ? null : x.saving,
      challenges: item.challenge ? { ...x.challenges, [item.challenge]: { ...x.challenges[item.challenge], claimed: true } } : x.challenges,
      orders: [o, ...x.orders],
    }))
    go('success')
  }

  const reset = () => { setS(INITIAL); setReport(null); setHow(true); go('home') }
  const prod = productId && productById(productId)
  const note = NOTES[screen === 'run' ? 'race' : screen] || NOTES.home
  const common = { s, go, openProduct, play, now }

  return (
    <div className="page">
      <aside className="side left">
        <div className="tagline">PlaySuper · Product Associate assignment</div>
        <h1>City Dash</h1>
        <p className="lede">A mobile endless-runner game with a <b>real-products shop built in</b>.</p>
        <div className="card-side">
          <div className="cs-title">What's the product?</div>
          <p><b>The game is the product.</b> The shop is a feature inside it, powered by PlaySuper. Players earn coins by playing, and those coins work as <b>money off real products</b>. Brands fund the discounts because they want to reach gamers.</p>
        </div>
        <div className="card-side">
          <div className="cs-title">The loop</div>
          <ol className="loop">
            <li>🏃 <b>Run</b> and collect coins</li>
            <li>🪙 <b>10 coins = ₹1</b> off, covering up to 50% of the price</li>
            <li>📦 Pay the rest and <b>get it delivered</b></li>
            <li>🎧 Your runner gets a <b>matching in-game item</b></li>
          </ol>
        </div>
        <div className="card-side">
          <div className="cs-title">Controls</div>
          <div className="keys"><kbd>←</kbd><kbd>→</kbd> dodge · <kbd>↑</kbd> jump · <kbd>↓</kbd> slide · <kbd>P</kbd> pause</div>
          <small>On a phone: swipe.</small>
        </div>
        <div className="links">
          <a href={DOC_URL} target="_blank" rel="noreferrer">📄 Product note</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">💻 Code</a>
          <button onClick={reset}>↺ Reset demo</button>
        </div>
      </aside>

      <div className={'phone' + (screen === 'run' ? ' running' : '')}>
        <div className="notch" />
        <div className="screen">
          {screen === 'run' ? (
            <Race key={runId} wear={wear} onEnd={finishRun} firstRun={s.runs === 0} />
          ) : (
            <div className="scroller" key={screen + (productId || '')}>
              {screen === 'home' && <Home {...common} showHow={() => setHow(true)} />}
              {screen === 'results' && report && <Results {...common} rep={report} />}
              {screen === 'shop' && <Shop {...common} claim={claim} showHow={() => setHow(true)} />}
              {screen === 'product' && prod && (
                <Product {...common} prod={prod} back={() => go(backTo)} buy={buy}
                  setSaving={(id) => { setS((x) => ({ ...x, saving: id })); setToast('🎯 Saving for this. Check your home screen!') }} />
              )}
              {screen === 'checkout' && order && <Checkout {...common} order={order} back={() => go(order.sponsor ? 'challenges' : 'product')} onPay={placeOrder} />}
              {screen === 'success' && s.orders[0] && <Success {...common} order={s.orders[0]} />}
              {screen === 'challenges' && <Challenges {...common} claim={claim} />}
              {screen === 'orders' && <Orders {...common} />}
            </div>
          )}

          {how && screen !== 'run' && <HowItWorks onClose={closeHow} />}
          {toast && <div className="toast">{toast}</div>}
          {screen !== 'run' && <button className="notes-fab" onClick={() => setNotesOpen(true)} aria-label="Why it works this way">💡</button>}
          {notesOpen && (
            <div className="modal" onClick={() => setNotesOpen(false)}>
              <div className="panel notes-card" onClick={(e) => e.stopPropagation()}>
                <small className="eyebrow">PRODUCT THINKING</small>
                <h3>{note.title}</h3>
                <ul>{note.points.map((n) => <li key={n}>{n}</li>)}</ul>
                <button className="btn btn-blue wide" onClick={() => setNotesOpen(false)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="side right">
        <div className="eyebrow">Why this screen works this way</div>
        <h2>{note.title}</h2>
        <ul className="notes">{note.points.map((n) => <li key={n}>{n}</li>)}</ul>
      </aside>
    </div>
  )
}
