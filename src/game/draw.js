// Cartoon canvas art shared by the run engine and the character previews

export function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const OUTLINE = '#1e293b'

function blob(ctx, fill, lw) {
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = lw
  ctx.strokeStyle = OUTLINE
  ctx.stroke()
}

/* Runner seen from behind. (x, y) = feet on the ground, h = standing height in px.
   wear = { headphones, sneakers, hoodie, cap } booleans */
export function drawRunner(ctx, x, y, h, wear = {}, { t = 0, run = true, jump = 0, slide = false, boost = false } = {}) {
  const lw = Math.max(1.5, h * 0.025)
  const ph = run ? t * 13 : 0
  const sw = Math.sin(ph)

  // shadow stays on the ground
  ctx.fillStyle = 'rgba(30,41,59,.28)'
  ctx.beginPath()
  ctx.ellipse(x, y, h * 0.26 * (1 - Math.min(jump, 1) * 0.4), h * 0.07, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(x, y - jump * h)
  if (slide) ctx.scale(1.1, 0.55)

  if (boost) {
    ctx.fillStyle = 'rgba(74,222,128,.35)'
    ctx.beginPath()
    ctx.ellipse(0, -h * 0.5, h * 0.42, h * 0.62, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  const shoe = wear.sneakers ? '#22c55e' : '#f8fafc'
  const top = wear.hoodie ? '#ec4899' : '#f97316'
  const legW = h * 0.12
  // legs (alternating lift)
  for (const s of [-1, 1]) {
    const lift = Math.max(0, s * sw) * h * 0.12
    const lx = s * h * 0.075 - legW / 2
    rr(ctx, lx, -h * 0.42 - lift * 0.3, legW, h * 0.38 - lift * 0.4, legW * 0.4)
    blob(ctx, '#1d4ed8', lw)
    rr(ctx, lx - legW * 0.15, -h * 0.08 - lift, legW * 1.3, h * 0.09, h * 0.04)
    blob(ctx, shoe, lw)
    if (wear.sneakers) {
      ctx.fillStyle = 'rgba(134,239,172,.6)'
      ctx.fillRect(lx - legW * 0.15, -h * 0.02 - lift, legW * 1.3, h * 0.025)
    }
  }
  // arms (swing opposite)
  for (const s of [-1, 1]) {
    const a = -s * sw * 0.5
    ctx.save()
    ctx.translate(s * h * 0.16, -h * 0.66)
    ctx.rotate(a + s * 0.18)
    rr(ctx, -h * 0.05, 0, h * 0.1, h * 0.26, h * 0.05)
    blob(ctx, top, lw)
    ctx.beginPath()
    ctx.arc(0, h * 0.28, h * 0.05, 0, Math.PI * 2)
    blob(ctx, '#f1c27d', lw)
    ctx.restore()
  }
  // torso
  rr(ctx, -h * 0.17, -h * 0.74, h * 0.34, h * 0.36, h * 0.09)
  blob(ctx, top, lw)
  if (wear.hoodie) {
    // hood + logo
    ctx.beginPath()
    ctx.ellipse(0, -h * 0.72, h * 0.13, h * 0.07, 0, 0, Math.PI * 2)
    blob(ctx, '#be185d', lw)
    ctx.fillStyle = '#fff'
    ctx.font = `900 ${h * 0.07}px "Lilita One", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('CD', 0, -h * 0.5)
  } else {
    // backpack
    rr(ctx, -h * 0.11, -h * 0.68, h * 0.22, h * 0.22, h * 0.05)
    blob(ctx, '#facc15', lw)
    ctx.fillStyle = OUTLINE
    ctx.fillRect(-h * 0.06, -h * 0.6, h * 0.12, h * 0.02)
  }
  // head (back view: hair)
  ctx.beginPath()
  ctx.arc(0, -h * 0.86, h * 0.14, 0, Math.PI * 2)
  blob(ctx, '#3f2a1d', lw)
  ctx.fillStyle = '#f1c27d'
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(s * h * 0.14, -h * 0.85, h * 0.035, 0, Math.PI * 2)
    ctx.fill()
  }
  if (wear.cap) {
    ctx.beginPath()
    ctx.arc(0, -h * 0.88, h * 0.145, Math.PI, 0)
    ctx.closePath()
    blob(ctx, '#2563eb', lw)
    rr(ctx, -h * 0.06, -h * 0.9, h * 0.12, h * 0.05, h * 0.02)
    blob(ctx, '#93c5fd', lw * 0.7)
  }
  if (wear.headphones) {
    ctx.lineWidth = h * 0.035
    ctx.strokeStyle = '#eab308'
    ctx.beginPath()
    ctx.arc(0, -h * 0.86, h * 0.155, Math.PI * 1.05, Math.PI * 1.95)
    ctx.stroke()
    for (const s of [-1, 1]) {
      rr(ctx, s * h * 0.155 - h * 0.04, -h * 0.9, h * 0.08, h * 0.11, h * 0.03)
      blob(ctx, '#facc15', lw)
    }
  }
  ctx.restore()
}

/* Train: front face at (x, y) bottom-centre, w wide; roof recedes to (x2, y2, w2) */
export function drawTrain(ctx, x, y, w, x2, y2, w2, color, s) {
  const h = w * 1.15
  const h2 = w2 * 1.15
  // roof / side going into the distance
  ctx.fillStyle = shade(color, 0.75)
  ctx.beginPath()
  ctx.moveTo(x - w / 2, y - h)
  ctx.lineTo(x2 - w2 / 2, y2 - h2)
  ctx.lineTo(x2 + w2 / 2, y2 - h2)
  ctx.lineTo(x + w / 2, y - h)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = Math.max(1, 2 * s)
  ctx.stroke()
  // front face
  rr(ctx, x - w / 2, y - h, w, h, w * 0.12)
  ctx.fillStyle = color
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(x - w / 2, y - h * 0.42, w, h * 0.08)
  // windshield
  rr(ctx, x - w * 0.36, y - h * 0.88, w * 0.72, h * 0.32, w * 0.06)
  ctx.fillStyle = '#bae6fd'
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,.6)'
  ctx.fillRect(x - w * 0.3, y - h * 0.84, w * 0.12, h * 0.24)
  // lights
  ctx.fillStyle = '#fde047'
  for (const sd of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(x + sd * w * 0.3, y - h * 0.2, w * 0.07, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.fillStyle = OUTLINE
  ctx.fillRect(x - w * 0.12, y - h * 0.25, w * 0.24, h * 0.1)
}

export function drawHurdle(ctx, x, y, w, s) {
  const h = w * 0.42
  ctx.lineWidth = Math.max(1, 2 * s)
  ctx.strokeStyle = OUTLINE
  ctx.fillStyle = '#64748b'
  ctx.fillRect(x - w * 0.42, y - h, w * 0.06, h)
  ctx.fillRect(x + w * 0.36, y - h, w * 0.06, h)
  ctx.save()
  rr(ctx, x - w / 2, y - h, w, h * 0.5, w * 0.04)
  ctx.clip()
  ctx.fillStyle = '#fff'
  ctx.fillRect(x - w / 2, y - h, w, h)
  ctx.fillStyle = '#ef4444'
  const st = w / 5
  for (let i = -1; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(x - w / 2 + i * st, y - h * 0.5)
    ctx.lineTo(x - w / 2 + i * st + st / 2, y - h * 0.5)
    ctx.lineTo(x - w / 2 + i * st + st, y - h)
    ctx.lineTo(x - w / 2 + i * st + st / 2, y - h)
    ctx.fill()
  }
  ctx.restore()
  rr(ctx, x - w / 2, y - h, w, h * 0.5, w * 0.04)
  ctx.stroke()
}

export function drawOverhead(ctx, x, y, w, s) {
  const h = w * 1.0
  ctx.lineWidth = Math.max(1, 2 * s)
  ctx.strokeStyle = OUTLINE
  ctx.fillStyle = '#475569'
  ctx.fillRect(x - w * 0.48, y - h, w * 0.06, h)
  ctx.fillRect(x + w * 0.42, y - h, w * 0.06, h)
  ctx.save()
  rr(ctx, x - w / 2, y - h, w, h * 0.3, w * 0.04)
  ctx.clip()
  ctx.fillStyle = '#facc15'
  ctx.fillRect(x - w / 2, y - h, w, h * 0.3)
  ctx.fillStyle = OUTLINE
  const st = w / 6
  for (let i = -1; i < 7; i++) {
    ctx.beginPath()
    ctx.moveTo(x - w / 2 + i * st, y - h * 0.7)
    ctx.lineTo(x - w / 2 + i * st + st / 2, y - h * 0.7)
    ctx.lineTo(x - w / 2 + i * st + st, y - h)
    ctx.lineTo(x - w / 2 + i * st + st / 2, y - h)
    ctx.fill()
  }
  ctx.restore()
  rr(ctx, x - w / 2, y - h, w, h * 0.3, w * 0.04)
  ctx.stroke()
}

export function drawCoin(ctx, x, y, r, t, seed) {
  const sw = Math.abs(Math.cos(t * 4 + seed))
  ctx.lineWidth = Math.max(1, r * 0.18)
  ctx.strokeStyle = '#b45309'
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(1, r * sw), r, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  if (sw > 0.4) {
    ctx.fillStyle = '#fde68a'
    ctx.beginPath()
    ctx.ellipse(x - r * 0.15 * sw, y - r * 0.15, r * 0.35 * sw, r * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawCan(ctx, x, y, w, t) {
  const h = w * 1.7
  const b = Math.sin(t * 5) * w * 0.15
  ctx.save()
  ctx.translate(x, y + b)
  ctx.shadowColor = '#4ade80'
  ctx.shadowBlur = w * 0.8
  rr(ctx, -w / 2, -h, w, h, w * 0.2)
  ctx.fillStyle = '#16a34a'
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.lineWidth = Math.max(1, w * 0.08)
  ctx.strokeStyle = OUTLINE
  ctx.stroke()
  ctx.fillStyle = '#d4d4d8'
  ctx.fillRect(-w / 2, -h, w, h * 0.12)
  ctx.fillStyle = '#bef264'
  ctx.fillRect(-w / 2, -h * 0.62, w, h * 0.26)
  if (w > 12) {
    ctx.fillStyle = '#14532d'
    ctx.font = `900 ${w * 0.55}px "Lilita One", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('V', 0, -h * 0.49)
  }
  ctx.restore()
}

export function drawMagnet(ctx, x, y, r, t) {
  ctx.save()
  ctx.translate(x, y + Math.sin(t * 5) * r * 0.15)
  ctx.rotate(Math.sin(t * 3) * 0.2)
  ctx.lineCap = 'butt'
  ctx.strokeStyle = OUTLINE
  ctx.lineWidth = r * 0.62
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.7, Math.PI, 0, true)
  ctx.stroke()
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = r * 0.45
  ctx.stroke()
  ctx.fillStyle = '#e5e7eb'
  ctx.fillRect(-r * 0.93, -r * 0.05, r * 0.46, r * 0.32)
  ctx.fillRect(r * 0.47, -r * 0.05, r * 0.46, r * 0.32)
  ctx.restore()
}

export function drawDoubler(ctx, x, y, r, t) {
  ctx.save()
  ctx.translate(x, y + Math.sin(t * 5) * r * 0.15)
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2 + t
    const rad = i % 2 ? r * 0.55 : r
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad)
  }
  ctx.closePath()
  ctx.fillStyle = '#a855f7'
  ctx.fill()
  ctx.lineWidth = Math.max(1, r * 0.12)
  ctx.strokeStyle = OUTLINE
  ctx.stroke()
  if (r > 8) {
    ctx.fillStyle = '#fff'
    ctx.font = `900 ${r * 0.7}px "Lilita One", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('2x', 0, r * 0.05)
  }
  ctx.restore()
}

export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.floor(((n >> 16) & 255) * k)
  const g = Math.floor(((n >> 8) & 255) * k)
  const b = Math.floor((n & 255) * k)
  return `rgb(${r},${g},${b})`
}
