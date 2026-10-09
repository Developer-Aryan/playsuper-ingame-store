import { useEffect, useRef } from 'react'
import { drawRunner } from '../game/draw'

// Small animated character preview (shows the outfits the runner is wearing)
export default function RunnerPreview({ wear, height = 160, running = false }) {
  const ref = useRef(null)
  const wearRef = useRef(wear)
  useEffect(() => { wearRef.current = wear }, [wear])

  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf
    let t = 0
    let last = performance.now()
    const fit = () => {
      c.width = c.clientWidth * dpr
      c.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    const frame = (now) => {
      t += (now - last) / 1000
      last = now
      const W = c.clientWidth
      ctx.clearRect(0, 0, W, height)
      const bounce = running ? 0 : Math.abs(Math.sin(t * 2.2)) * 0.04
      drawRunner(ctx, W / 2, height * 0.94, height * 0.8, wearRef.current, { t, run: running, jump: bounce })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', fit)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit) }
  }, [height, running])

  return <canvas ref={ref} style={{ width: '100%', height, display: 'block' }} />
}
