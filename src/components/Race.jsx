import { useEffect, useRef, useState } from 'react'
import { Engine } from '../game/engine'
import { sfx } from '../game/audio'

export default function Race({ wear, onEnd, firstRun }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const endRef = useRef(onEnd)
  useEffect(() => { endRef.current = onEnd }, [onEnd])
  const [hud, setHud] = useState({ state: 'countdown', meters: 0, coins: 0, boost: 0, magnet: 0, doubler: 0, cans: 0 })
  const [muted, setMuted] = useState(sfx.isMuted())

  useEffect(() => {
    sfx.unlock()
    const eng = new Engine(canvasRef.current, { wear, onHud: setHud, onEnd: (r) => endRef.current(r) })
    engineRef.current = eng
    if (import.meta.env.DEV) window.__engine = eng
    const onVis = () => document.hidden && eng.setPaused(true)
    document.addEventListener('visibilitychange', onVis)
    return () => { document.removeEventListener('visibilitychange', onVis); eng.destroy() }
  }, [wear])

  const paused = hud.state === 'paused'

  return (
    <div className="race">
      <canvas ref={canvasRef} className="race-canvas" />

      <div className="hud">
        <div className="hud-score">
          <small>DISTANCE</small>
          <b>{hud.meters.toLocaleString('en-IN')} m</b>
        </div>
        <div className="hud-right">
          <div className="hud-coins"><span className="coin" />{hud.coins}</div>
          <button className="hud-pause" onClick={() => engineRef.current?.setPaused(true)} aria-label="Pause">II</button>
        </div>
      </div>

      <div className="hud-powers">
        {hud.boost > 0 && <span className="pw green">⚡ Boost</span>}
        {hud.magnet > 0 && <span className="pw red">🧲 {Math.ceil(hud.magnet)}s</span>}
        {hud.doubler > 0 && <span className="pw purple">2x {Math.ceil(hud.doubler)}s</span>}
      </div>

      {hud.state === 'countdown' && (
        <div className="how-to">
          <div><kbd>←</kbd><kbd>→</kbd> or swipe sideways: <b>dodge trains</b></div>
          <div><kbd>↑</kbd> or swipe up: <b>jump</b> red barriers · <kbd>↓</kbd> or swipe down: <b>slide</b> under yellow bars</div>
          {firstRun && <div className="how-tip">🪙 Every coin you collect = money off real products in the Shop</div>}
        </div>
      )}

      {paused && (
        <div className="pause">
          <div className="panel pause-card">
            <h2>Paused</h2>
            <p>{hud.meters.toLocaleString('en-IN')} m · {hud.coins} coins</p>
            <button className="btn btn-green" onClick={() => engineRef.current?.setPaused(false)}>Resume</button>
            <button className="btn btn-white" onClick={() => { sfx.setMuted(!muted); setMuted(!muted) }}>{muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
            <button className="btn btn-white" onClick={() => { const r = engineRef.current?.results(); engineRef.current?.destroy(); onEnd(r) }}>End run</button>
          </div>
        </div>
      )}
    </div>
  )
}
