import { useEffect, useRef } from 'react'
import { drawCar } from '../game/draw'

// Animated car-on-a-platform preview used in the garage, home and reward screens
export default function CarPreview({ skin, height = 160, platform = true, dim = false }) {
  const ref = useRef(null)
  const skinRef = useRef(skin)
  skinRef.current = skin

  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    let raf
    let t = 0
    let last = performance.now()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const fit = () => {
      const w = c.clientWidth
      c.width = w * dpr
      c.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    const frame = (now) => {
      t += (now - last) / 1000
      last = now
      const W = c.clientWidth
      const H = height
      ctx.clearRect(0, 0, W, H)
      const cw = Math.min(W * 0.62, H * 1.35)
      const by = H * 0.82
      if (platform) {
        const g = ctx.createRadialGradient(W / 2, by, 4, W / 2, by, cw * 0.8)
        g.addColorStop(0, 'rgba(217,70,239,.55)')
        g.addColorStop(1, 'rgba(217,70,239,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(W / 2, by, cw * 0.85, cw * 0.17, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(34,211,238,.7)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(W / 2, by, cw * 0.7, cw * 0.13, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = dim ? 0.35 : 1
      drawCar(ctx, W / 2, by - 2 + Math.sin(t * 2.4) * 2, cw, skinRef.current, { tilt: Math.sin(t * 0.9) * 0.25, t })
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', fit)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit) }
  }, [height, platform, dim])

  return <canvas ref={ref} style={{ width: '100%', height, display: 'block' }} />
}
