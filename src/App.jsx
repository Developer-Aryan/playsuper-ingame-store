import { useCallback, useEffect, useState } from 'react'
import Race from './components/Race'
import { NOTES, SKINS } from './data'
import { usePersistentState, applyRun, productById, maxCoinsFor, INITIAL } from './state'
import { sfx } from './game/audio'
import {
  Home, Results, Vault, Product, Checkout, Success, Garage, Missions, Quests, useNow, inr, num,
} from './screens'

const DOC_URL = 'https://claude.ai/code/artifact/53476a39-69ce-4b78-a1a3-b8be6b7a4635'
const REPO_URL = 'https://github.com/Developer-Aryan/playsuper-ingame-store'

export default function App() {
  const [s, setS] = usePersistentState()
  const [screen, setScreen] = useState('home')
  const [prevScreen, setPrevScreen] = useState('vault')
  const [productId, setProductId] = useState(null)
  const [coinsToUse, setCoinsToUse] = useState(0)
  const [report, setReport] = useState(null)
  const [runId, setRunId] = useState(0)
  const [toastMsg, setToastMsg] = useState(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const now = useNow()

  useEffect(() => { sfx.setMuted(s.muted) }, [s.muted])
  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 2400)
    return () => clearTimeout(t)
  }, [toastMsg])

  const go = useCallback((sc) => { setScreen(sc); setNotesOpen(false) }, [])
  const toast = (m) => setToastMsg(m)

  const openProduct = (id) => {
    const prod = productById(id)
    setPrevScreen(screen === 'product' ? prevScreen : screen)
    setProductId(id)
    setCoinsToUse(maxCoinsFor(s, prod, Date.now()))
    go('product')
  }

  const startRace = () => { setRunId((n) => n + 1); go('race') }

  const finishRun = (r) => {
    if (!r) { go('home'); return }
    const [next, rep] = applyRun(s, r)
    setS(next)
    setReport(rep)
    go('results')
  }

  const placeOrder = (method) => {
    const prod = productById(productId)
    const cash = Math.max(0, prod.price - coinsToUse * 0.1)
    const order = {
      id: 'NR' + Math.floor(Math.random() * 900000 + 100000),
      productId, coins: coinsToUse, cash, method, at: Date.now(), digital: prod.delivery === 'Instant', rated: false,
    }
    setS((x) => ({
      ...x,
      coins: x.coins - coinsToUse,
      goal: x.goal === productId ? null : x.goal,
      skins: prod.skin && !x.skins.includes(prod.skin) ? [...x.skins, prod.skin] : x.skins,
      skin: prod.skin || x.skin,
      coinBoostRuns: prod.perk ? x.coinBoostRuns + 3 : x.coinBoostRuns,
      drop: x.drop && x.drop.productId === productId ? null : x.drop,
      orders: [order, ...x.orders],
    }))
    go('success')
  }

  const reset = () => { setS(INITIAL); setReport(null); go('home'); toast('Demo reset') }
  const prod = productId && productById(productId)
  const note = NOTES[screen === 'race' ? 'race' : screen] || NOTES.home
  const common = { s, go, openProduct, startRace, now }

  return (
    <div className="stage">
      <aside className="side left">
        <div className="brandmark">PlaySuper <span>× Nitro Rush</span></div>
        <h1>Commerce that lives <em>inside</em> the game.</h1>
        <p className="lede">
          A playable prototype. Race to earn coins, complete brand missions, and spend your coins plus cash on
          real-world rewards, each one with an exclusive in-game unlock.
        </p>
        <div className="controls">
          <div className="ctl-title">Controls</div>
          <div><kbd>←</kbd><kbd>→</kbd><span>switch lanes (or swipe / tap sides)</span></div>
          <div><kbd>Space</kbd><kbd>↑</kbd><span>fire nitro (3 VoltUp cans)</span></div>
          <div><kbd>P</kbd><span>pause</span></div>
        </div>
        <div className="tryit">
          <div className="ctl-title">Try this path</div>
          <ol>
            <li>Race and beat <b>{num(s.best)} m</b> to earn a Drop</li>
            <li>Reach <b>Level 10</b> to upgrade coin power</li>
            <li>Collect VoltUp cans to unlock a <b>real</b> pack</li>
            <li>Buy your Goal and race with its exclusive skin</li>
          </ol>
        </div>
        <div className="links">
          <a href={DOC_URL} target="_blank" rel="noreferrer">📄 Product note</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">⌥ Source</a>
          <button onClick={reset}>↺ Reset demo</button>
        </div>
      </aside>

      <div className={'phone' + (screen === 'race' ? ' racing' : '')}>
        <div className="notch" />
        <div className="screen">
          {screen === 'race' ? (
            <Race key={runId} skin={SKINS[s.skin]} onEnd={finishRun} onQuit={finishRun} firstRun={s.runs === 0} coinBoost={s.coinBoostRuns > 0} />
          ) : (
            <div className="scroller" key={screen + (productId || '')}>
              {screen === 'home' && <Home {...common} />}
              {screen === 'results' && report && <Results {...common} rep={report} />}
              {screen === 'vault' && <Vault {...common} />}
              {screen === 'product' && prod && (
                <Product
                  {...common} prod={prod} back={() => go(prevScreen)} coinsToUse={coinsToUse} setCoinsToUse={setCoinsToUse}
                  setGoal={(id) => { setS((x) => ({ ...x, goal: id })); toast('🎯 Goal pinned to your garage') }}
                />
              )}
              {screen === 'checkout' && prod && <Checkout s={s} prod={prod} coins={coinsToUse} go={go} onPay={placeOrder} />}
              {screen === 'success' && s.orders[0] && <Success order={s.orders[0]} go={go} startRace={startRace} />}
              {screen === 'garage' && <Garage {...common} setS={setS} toast={toast} />}
              {screen === 'missions' && <Missions {...common} />}
              {screen === 'quests' && <Quests {...common} setS={setS} toast={toast} />}
            </div>
          )}

          {toastMsg && <div className="toast">{toastMsg}</div>}
          {screen !== 'race' && (
            <button className="notes-fab" onClick={() => setNotesOpen((v) => !v)} aria-label="Product thinking">💡</button>
          )}
          {notesOpen && (
            <div className="sheet" onClick={() => setNotesOpen(false)}>
              <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
                <div className="eyebrow">PRODUCT THINKING</div>
                <h4>{note.title}</h4>
                <ul>{note.points.map((n) => <li key={n}>{n}</li>)}</ul>
                <div className="sheet-links">
                  <a href={DOC_URL} target="_blank" rel="noreferrer">Full product note</a>
                  <button onClick={reset}>Reset demo</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="side right">
        <div className="eyebrow">Why this screen works this way</div>
        <h2>{note.title}</h2>
        <ul className="note-list">{note.points.map((n) => <li key={n}>{n}</li>)}</ul>
        <div className="econ">
          <div className="eyebrow">Economy at a glance</div>
          <div className="econ-grid">
            <div><b>10 🪙 = ₹1</b><small>coin value</small></div>
            <div><b>25 → 40 → 60%</b><small>coin cap by tier</small></div>
            <div><b>~250 🪙</b><small>per 1-min race</small></div>
            <div><b>{inr(s.coins * 0.1)}</b><small>your wallet now</small></div>
          </div>
        </div>
      </aside>
    </div>
  )
}
