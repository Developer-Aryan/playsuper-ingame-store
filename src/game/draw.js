// Shared canvas drawing helpers (used by the race engine and the garage preview)

export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function skinColor(c, t) {
  return c === 'rgb' ? `hsl(${(t * 90) % 360},90%,58%)` : c
}

// Rear view of the player's car. (x, y) = bottom-centre, w = width in px
export function drawCar(ctx, x, y, w, skin, { tilt = 0, t = 0, boost = false, brake = false } = {}) {
  const h = w * 0.42
  const body = skinColor(skin.body, t)
  const accent = skinColor(skin.accent, t + 1.5)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(tilt * 0.1)

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.45)'
  ctx.beginPath()
  ctx.ellipse(0, -h * 0.02, w * 0.58, h * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()

  // nitro flames
  if (boost) {
    for (const s of [-1, 1]) {
      const fl = h * (0.7 + Math.random() * 0.6)
      const g = ctx.createLinearGradient(0, -h * 0.15, 0, -h * 0.15 + fl)
      g.addColorStop(0, '#fff')
      g.addColorStop(0.3, '#7dd3fc')
      g.addColorStop(0.7, 'rgba(124,58,237,.7)')
      g.addColorStop(1, 'rgba(124,58,237,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(s * w * 0.22 - w * 0.06, -h * 0.15)
      ctx.lineTo(s * w * 0.22 + w * 0.06, -h * 0.15)
      ctx.lineTo(s * w * 0.22, -h * 0.15 + fl)
      ctx.closePath()
      ctx.fill()
    }
  }

  // wheels
  ctx.fillStyle = '#0b0b12'
  rr(ctx, -w * 0.5, -h * 0.42, w * 0.17, h * 0.42, 4)
  ctx.fill()
  rr(ctx, w * 0.33, -h * 0.42, w * 0.17, h * 0.42, 4)
  ctx.fill()

  // cabin
  ctx.fillStyle = skin.glass || '#1e1b4b'
  ctx.beginPath()
  ctx.moveTo(-w * 0.3, -h * 0.82)
  ctx.lineTo(-w * 0.2, -h * 1.32)
  ctx.lineTo(w * 0.2, -h * 1.32)
  ctx.lineTo(w * 0.3, -h * 0.82)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  ctx.beginPath()
  ctx.moveTo(-w * 0.17, -h * 1.27)
  ctx.lineTo(-w * 0.02, -h * 1.27)
  ctx.lineTo(-w * 0.12, -h * 0.9)
  ctx.lineTo(-w * 0.24, -h * 0.9)
  ctx.closePath()
  ctx.fill()

  // body
  const bg = ctx.createLinearGradient(0, -h, 0, 0)
  bg.addColorStop(0, body)
  bg.addColorStop(1, shade(body))
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.moveTo(-w * 0.47, -h * 0.12)
  ctx.lineTo(-w * 0.44, -h * 0.8)
  ctx.quadraticCurveTo(0, -h * 0.95, w * 0.44, -h * 0.8)
  ctx.lineTo(w * 0.47, -h * 0.12)
  ctx.quadraticCurveTo(0, h * 0.02, -w * 0.47, -h * 0.12)
  ctx.closePath()
  ctx.fill()

  // racing stripe
  ctx.fillStyle = accent
  ctx.fillRect(-w * 0.05, -h * 0.9, w * 0.1, h * 0.78)

  // spoiler
  ctx.fillStyle = accent
  rr(ctx, -w * 0.52, -h * 1.0, w * 1.04, h * 0.1, 3)
  ctx.fill()
  ctx.fillStyle = shade(body)
  ctx.fillRect(-w * 0.32, -h * 0.92, w * 0.05, h * 0.14)
  ctx.fillRect(w * 0.27, -h * 0.92, w * 0.05, h * 0.14)

  // tail lights
  ctx.shadowColor = '#ff2d55'
  ctx.shadowBlur = brake ? 22 : 12
  ctx.fillStyle = brake ? '#ff6b81' : '#ff2d55'
  rr(ctx, -w * 0.42, -h * 0.6, w * 0.26, h * 0.13, 3)
  ctx.fill()
  rr(ctx, w * 0.16, -h * 0.6, w * 0.26, h * 0.13, 3)
  ctx.fill()
  ctx.shadowBlur = 0

  // plate + exhausts
  ctx.fillStyle = '#e5e7eb'
  rr(ctx, -w * 0.1, -h * 0.4, w * 0.2, h * 0.14, 2)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.font = `bold ${Math.max(6, h * 0.1)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('NITRO', 0, -h * 0.33)
  ctx.fillStyle = '#9ca3af'
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(s * w * 0.22, -h * 0.17, w * 0.035, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function shade(c) {
  if (c.startsWith('hsl')) return c.replace('58%)', '32%)')
  const n = parseInt(c.slice(1), 16)
  const r = Math.floor(((n >> 16) & 255) * 0.55)
  const g = Math.floor(((n >> 8) & 255) * 0.55)
  const b = Math.floor((n & 255) * 0.55)
  return `rgb(${r},${g},${b})`
}

// Traffic car seen from behind
export function drawTraffic(ctx, x, y, w, color, t) {
  const h = w * 0.62
  ctx.fillStyle = 'rgba(0,0,0,.4)'
  ctx.beginPath()
  ctx.ellipse(x, y, w * 0.55, h * 0.12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0b0b12'
  ctx.fillRect(x - w * 0.48, y - h * 0.28, w * 0.14, h * 0.28)
  ctx.fillRect(x + w * 0.34, y - h * 0.28, w * 0.14, h * 0.28)
  ctx.fillStyle = color
  rr(ctx, x - w * 0.46, y - h * 0.82, w * 0.92, h * 0.72, w * 0.08)
  ctx.fill()
  ctx.fillStyle = 'rgba(15,15,35,.85)'
  rr(ctx, x - w * 0.33, y - h * 1.12, w * 0.66, h * 0.36, w * 0.06)
  ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,.25)'
  ctx.fillRect(x - w * 0.46, y - h * 0.3, w * 0.92, h * 0.2)
  const blink = Math.sin(t * 8) > 0
  ctx.fillStyle = blink ? '#ff4d6d' : '#c81e3a'
  ctx.fillRect(x - w * 0.42, y - h * 0.62, w * 0.2, h * 0.12)
  ctx.fillRect(x + w * 0.22, y - h * 0.62, w * 0.2, h * 0.12)
}

export function drawBarrier(ctx, x, y, w, t) {
  const h = w * 0.34
  ctx.fillStyle = '#222'
  ctx.fillRect(x - w * 0.42, y - h * 0.3, w * 0.06, h * 0.3)
  ctx.fillRect(x + w * 0.36, y - h * 0.3, w * 0.06, h * 0.3)
  ctx.save()
  rr(ctx, x - w / 2, y - h, w, h * 0.7, 3)
  ctx.clip()
  ctx.fillStyle = '#fff'
  ctx.fillRect(x - w / 2, y - h, w, h * 0.7)
  ctx.fillStyle = '#f97316'
  const step = w / 6
  for (let i = -1; i < 7; i++) {
    ctx.beginPath()
    ctx.moveTo(x - w / 2 + i * step, y - h * 0.3)
    ctx.lineTo(x - w / 2 + i * step + step / 2, y - h * 0.3)
    ctx.lineTo(x - w / 2 + i * step + step, y - h)
    ctx.lineTo(x - w / 2 + i * step + step / 2, y - h)
    ctx.fill()
  }
  ctx.restore()
  const on = Math.sin(t * 10) > 0
  ctx.fillStyle = on ? '#fde047' : '#854d0e'
  ctx.shadowColor = '#fde047'
  ctx.shadowBlur = on ? 14 : 0
  ctx.beginPath()
  ctx.arc(x - w * 0.36, y - h * 1.1, w * 0.05, 0, Math.PI * 2)
  ctx.arc(x + w * 0.36, y - h * 1.1, w * 0.05, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

export function drawCoin(ctx, x, y, r, t, seed) {
  const sw = Math.abs(Math.cos(t * 5 + seed))
  ctx.shadowColor = '#fbbf24'
  ctx.shadowBlur = r * 1.2
  ctx.fillStyle = '#f59e0b'
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(1, r * sw), r, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#fde68a'
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(0.5, r * 0.62 * sw), r * 0.62, 0, 0, Math.PI * 2)
  ctx.fill()
}

export function drawCan(ctx, x, y, w, t) {
  const h = w * 1.75
  const pulse = 0.6 + Math.sin(t * 6) * 0.4
  ctx.shadowColor = '#4ade80'
  ctx.shadowBlur = w * pulse
  ctx.fillStyle = '#16a34a'
  rr(ctx, x - w / 2, y - h, w, h, w * 0.18)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#d1d5db'
  ctx.fillRect(x - w / 2, y - h, w, h * 0.1)
  ctx.fillStyle = '#bef264'
  ctx.fillRect(x - w / 2, y - h * 0.62, w, h * 0.24)
  if (w > 10) {
    ctx.fillStyle = '#052e16'
    ctx.font = `900 ${w * 0.5}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('V', x, y - h * 0.5)
  }
}

export function drawMagnet(ctx, x, y, r, t) {
  ctx.save()
  ctx.translate(x, y - r)
  ctx.rotate(Math.sin(t * 4) * 0.2)
  ctx.shadowColor = '#f43f5e'
  ctx.shadowBlur = r
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = r * 0.45
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.7, Math.PI, 0, true)
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#e5e7eb'
  ctx.fillRect(-r * 0.92, -r * 0.05, r * 0.45, r * 0.35)
  ctx.fillRect(r * 0.47, -r * 0.05, r * 0.45, r * 0.35)
  ctx.restore()
}

export function drawShield(ctx, x, y, r, t) {
  ctx.save()
  ctx.translate(x, y - r)
  ctx.shadowColor = '#22d3ee'
  ctx.shadowBlur = r
  ctx.strokeStyle = '#67e8f9'
  ctx.lineWidth = Math.max(1, r * 0.15)
  ctx.fillStyle = 'rgba(34,211,238,.25)'
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + t
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}
