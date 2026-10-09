import { useEffect, useRef, useState } from 'react'
import { Engine } from '../game/engine'
import { sfx } from '../game/audio'

export default function Race({ skin, onEnd, onQuit, firstRun, coinBoost }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  const [hud, setHud] = useState({ state: 'countdown', meters: 0, coins: 0, nitro: 0.34, boost: 0, magnet: 0, shield: false, combo: 0, kmh: 0 })
  const [muted, setMuted] = useState(sfx.isMuted())

  useEffect(() => {
    sfx.unlock()
    const eng = new Engine(canvasRef.current, { skin, onHud: setHud, onEnd: (r) => endRef.current(r) })
    engineRef.current = eng
    if (import.meta.env.DEV) window.__engine = eng
    const onVis = () => document.hidden && eng.setPaused(true)
    document.addEventListener('visibilitychange', onVis)
    return () => { document.removeEventListener('visibilitychange', onVis); eng.destroy() }
  }, [skin])

  const paused = hud.state === 'paused'
  const ready = hud.nitro >= 1 && hud.boost <= 0

  return (
    <div className="race">
      <canvas ref={canvasRef} className="race-canvas" />
      <div className="race-hud">
        <div className="rh-left">
          <div className="rh-dist">{hud.meters.toLocaleString('en-IN')}<small>m</small></div>
          <div className="rh-speed">{hud.kmh} km/h</div>
        </div>
        {hud.combo > 1 && <div className="rh-combo">COMBO ×{hud.combo}</div>}
        <div className="rh-right">
          <div className="rh-coins">🪙 {hud.coins}{coinBoost && <em>2×</em>}</div>
          <button className="rh-pause" onClick={() => engineRef.current?.setPaused(true)} aria-label="Pause">❚❚</button>
        </div>
      </div>

      <div className="rh-powerups">
        {hud.shield && <span className="pu shield">🛡️</span>}
        {hud.magnet > 0 && <span className="pu magnet">🧲 {Math.ceil(hud.magnet)}s</span>}
      </div>

      <button
        className={'nitro-btn' + (ready ? ' ready' : '') + (hud.boost > 0 ? ' active' : '')}
        onPointerDown={(e) => { e.stopPropagation(); engineRef.current?.fireNitro() }}
      >
        <div className="nitro-fill" style={{ height: (hud.boost > 0 ? (hud.boost / 3.2) : hud.nitro) * 100 + '%' }} />
        <span>{hud.boost > 0 ? 'BOOST' : ready ? 'NITRO' : 'NITRO'}</span>
        <small>{ready ? 'SPACE / ↑' : `${Math.round(hud.nitro * 3)}/3 cans`}</small>
      </button>

      {hud.state === 'countdown' && (
        <div className="race-tip">
          {firstRun ? (
            <>
              <b>HOW TO DRIVE</b>
              <div><kbd>←</kbd><kbd>→</kbd> or swipe / tap sides to switch lanes</div>
              <div>Grab 3 <span className="g">VoltUp cans</span> → <kbd>Space</kbd> / swipe up for <b>NITRO</b></div>
              <div>Brush past cars for <span className="p">near-miss combos</span>. Nitro smashes through traffic.</div>
            </>
          ) : (
            <div><kbd>←</kbd><kbd>→</kbd> steer · <kbd>Space</kbd> nitro · <kbd>P</kbd> pause</div>
          )}
        </div>
      )}

      {paused && (
        <div className="pause">
          <div className="pause-card">
            <h2>PAUSED</h2>
            <p>{hud.meters.toLocaleString('en-IN')} m · 🪙 {hud.coins}</p>
            <button className="btn" onClick={() => engineRef.current?.setPaused(false)}>Resume ▶</button>
            <button className="btn ghost-btn" onClick={() => { sfx.setMuted(!muted); setMuted(!muted) }}>{muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
            <button className="btn ghost-btn" onClick={() => { const r = engineRef.current?.results(); engineRef.current?.destroy(); onQuit(r) }}>End run</button>
            <small className="pause-note">No store in the pause menu either. Mid-run is for playing.</small>
          </div>
        </div>
      )}
    </div>
  )
}
