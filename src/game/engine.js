import { sfx } from './audio'
import { drawRunner, drawTrain, drawHurdle, drawOverhead, drawCoin, drawCan, drawMagnet, drawDoubler, rr, shade } from './draw'

const CAM_D = 150 // camera depth
const DRAW_Z = 2000 // render / spawn distance
const METER = 20 // world units per metre
const TRAIN_LEN = 240
const TRAIN_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']
const BUILDING_COLORS = ['#fca5a5', '#fdba74', '#fde68a', '#a7f3d0', '#a5b4fc', '#f9a8d4', '#93c5fd', '#c4b5fd']
const POSTERS = [
  { brand: 'VoltUp', line: 'GRAB A CAN = SPEED BOOST', bg: '#16a34a', fg: '#ecfccb' },
  { brand: 'SoundBox', line: 'HEADPHONES IN THE SHOP', bg: '#7c3aed', fg: '#f5f3ff' },
  { brand: 'CineMax', line: 'RUN 1,500 M = FREE MOVIE', bg: '#ea580c', fg: '#fff7ed' },
]

const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x) }

export class Engine {
  constructor(canvas, { wear, onHud, onEnd }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.wear = wear
    this.onHud = onHud
    this.onEnd = onEnd
    this.clouds = Array.from({ length: 6 }, () => ({ x: Math.random(), y: rand(0.04, 0.22), s: rand(0.6, 1.3), v: rand(0.004, 0.012) }))

    this.loop = this.loop.bind(this)
    this.resize = this.resize.bind(this)
    this.onKey = this.onKey.bind(this)
    this.onDown = this.onDown.bind(this)
    this.onUp = this.onUp.bind(this)
    window.addEventListener('resize', this.resize)
    window.addEventListener('keydown', this.onKey)
    canvas.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointerup', this.onUp)

    this.resize()
    this.reset()
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.onKey)
    this.canvas.removeEventListener('pointerdown', this.onDown)
    window.removeEventListener('pointerup', this.onUp)
  }

  resize() {
    const r = this.canvas.parentElement.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = r.width * dpr
    this.canvas.height = r.height * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.W = r.width
    this.H = r.height
    this.HZ = this.H * 0.33
    this.BOT = this.H * 0.86
    this.laneW = this.W * 0.3
    this.trackHalf = this.laneW * 1.5
  }

  reset() {
    this.t = 0
    this.runT = 0
    this.countdown = 3
    this.lastBeep = 4
    this.speed = 0
    this.dist = 0
    this.camX = 0
    this.p = { lane: 0, x: 0, y: 0, vy: 0, slide: 0, boost: 0, magnet: 0, doubler: 0 }
    this.ents = []
    this.parts = []
    this.floats = []
    this.spawnAt = 900
    this.lastFree = 0
    this.stats = { coins: 0, cans: 0, jumps: 0, slides: 0 }
    this.state = 'countdown'
    this.shake = 0
    this.flash = 0
    this.crashT = 0
    this.hudT = 0
  }

  setPaused(v) {
    if (this.state === 'over' || this.state === 'crashed') return
    if (v && this.state !== 'paused') { this.prevState = this.state; this.state = 'paused' }
    if (!v && this.state === 'paused') { this.state = this.prevState; this.last = performance.now() }
    this.emitHud()
  }

  /* ---------- input ---------- */
  onKey(e) {
    const k = e.key
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault()
    if (e.repeat) return
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.steer(-1)
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') this.steer(1)
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') this.jump()
    else if (k === 'ArrowDown' || k === 's' || k === 'S') this.slide()
    else if (k === 'p' || k === 'P' || k === 'Escape') this.setPaused(this.state !== 'paused')
  }
  onDown(e) {
    sfx.unlock()
    this.touch = { x: e.clientX, y: e.clientY }
  }
  onUp(e) {
    if (!this.touch) return
    const dx = e.clientX - this.touch.x
    const dy = e.clientY - this.touch.y
    this.touch = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return
    if (Math.abs(dx) > Math.abs(dy)) this.steer(Math.sign(dx))
    else if (dy < 0) this.jump()
    else this.slide()
  }
  steer(d) {
    if (this.state !== 'running') return
    const nl = clamp(this.p.lane + d, -1, 1)
    if (nl !== this.p.lane) { this.p.lane = nl; sfx.swish() }
  }
  jump() {
    if (this.state !== 'running' || this.p.y > 0.02) return
    this.p.vy = 3.7
    this.p.slide = 0
    this.stats.jumps++
    sfx.jump()
  }
  slide() {
    if (this.state !== 'running') return
    if (this.p.y > 0.02) this.p.vy = -6 // fast drop
    this.p.slide = 0.65
    this.stats.slides++
    sfx.swish()
  }

  /* ---------- projection ---------- */
  proj(z) {
    const s = CAM_D / (CAM_D + Math.max(z, -CAM_D * 0.7))
    return { s, y: this.HZ + (this.BOT - this.HZ) * s }
  }
  sx(worldX, s) { return this.W / 2 + (worldX - this.camX) * s }

  /* ---------- loop ---------- */
  loop(now) {
    const dt = Math.min(0.033, (now - this.last) / 1000)
    this.last = now
    if (this.state !== 'paused' && this.state !== 'over') this.update(dt)
    this.draw()
    this.raf = requestAnimationFrame(this.loop)
  }

  update(dt) {
    this.t += dt
    const p = this.p
    this.shake = Math.max(0, this.shake - dt * 2)
    this.flash = Math.max(0, this.flash - dt * 2.5)
    for (const c of this.clouds) c.x = (c.x + c.v * dt + 1.2) % 1.2

    if (this.state === 'countdown') {
      this.countdown -= dt
      const n = Math.ceil(this.countdown)
      if (n < this.lastBeep && n >= 1 && n <= 3) { this.lastBeep = n; sfx.beep(false) }
      if (this.countdown <= 0) { this.state = 'running'; sfx.beep(true) }
      this.updateParts(dt)
      return
    }

    if (this.state === 'crashed') {
      this.crashT += dt
      dt *= 0.25
      this.speed *= 0.9
      if (this.crashT > 1.2) { this.state = 'over'; this.onEnd(this.results()) }
    } else {
      this.runT += dt
      const base = Math.min(950, 430 + this.runT * 7)
      this.speed = base * (p.boost > 0 ? 1.45 : 1)
      p.boost = Math.max(0, p.boost - dt)
      p.magnet = Math.max(0, p.magnet - dt)
      p.doubler = Math.max(0, p.doubler - dt)
      p.slide = Math.max(0, p.slide - dt)
    }

    // vertical movement (jump), in units of runner height
    if (p.y > 0 || p.vy > 0) {
      p.vy -= 11 * dt
      p.y = Math.max(0, p.y + p.vy * dt)
      if (p.y === 0) p.vy = 0
    }

    const dz = this.speed * dt
    this.dist += dz
    p.x += (p.lane - p.x) * Math.min(1, dt * 15)
    this.camX = p.x * this.laneW * 0.5

    while (this.spawnAt - this.dist < DRAW_Z) {
      this.spawnRow(this.spawnAt - this.dist)
      this.spawnAt += this.gap()
    }

    for (const e of this.ents) {
      e.z -= dz
      if (e.hit) continue
      if ((p.magnet > 0 || p.boost > 0) && e.type === 'coin' && e.z < 420 && e.z > -10) {
        e.lane += (p.x - e.lane) * Math.min(1, dt * 10)
        e.h += (p.y + 0.3 - e.h) * Math.min(1, dt * 10)
      }
      if (this.state === 'running') this.check(e)
    }
    this.ents = this.ents.filter((e) => !e.hit && e.z + (e.len || 0) > -CAM_D * 0.6)

    if (this.state === 'running' && Math.random() < (p.boost > 0 ? 0.9 : 0.15) && p.y < 0.05) {
      const px = this.sx(p.x * this.laneW, 1)
      this.parts.push({ x: px + rand(-8, 8), y: this.BOT, vx: rand(-30, 30), vy: rand(20, 80), life: 0.4, max: 0.4, c: p.boost > 0 ? '#86efac' : 'rgba(148,163,184,.6)', r: rand(2, 4) })
    }
    this.updateParts(dt)

    this.hudT += dt
    if (this.hudT > 0.1) { this.hudT = 0; this.emitHud() }
  }

  updateParts(dt) {
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 0) * dt; q.life -= dt }
    this.parts = this.parts.filter((q) => q.life > 0)
    for (const f of this.floats) f.life -= dt
    this.floats = this.floats.filter((f) => f.life > 0)
  }

  gap() {
    const d = Math.min(1, this.runT / 80)
    return rand(380, 440) - d * 100
  }

  spawnRow(z) {
    const d = Math.min(1, this.runT / 80)
    const free = clamp(this.lastFree + Math.round(rand(-1.4, 1.4)), -1, 1)
    this.lastFree = free
    const others = [-1, 0, 1].filter((l) => l !== free)

    if (Math.random() < 0.12) {
      // breather: a long coin line
      for (let i = 0; i < 9; i++) this.ents.push({ type: 'coin', lane: free, z: z + i * 30, h: 0.3, seed: i })
      return
    }

    for (const l of others) {
      const r = Math.random()
      if (r < 0.15 - d * 0.1) continue // sometimes leave it open
      if (r < 0.62) this.ents.push({ type: 'train', lane: l, z, len: TRAIN_LEN, color: TRAIN_COLORS[Math.floor(Math.random() * TRAIN_COLORS.length)] })
      else if (r < 0.82) {
        this.ents.push({ type: 'hurdle', lane: l, z })
        if (Math.random() < 0.5) for (let i = 0; i < 5; i++) this.ents.push({ type: 'coin', lane: l, z: z - 60 + i * 30, h: 0.3 + Math.sin((i / 4) * Math.PI) * 0.5, seed: i })
      } else this.ents.push({ type: 'overhead', lane: l, z })
    }
    // the free lane sometimes gets a hurdle/bar too (jump or slide still passable)
    if (Math.random() < 0.25 + d * 0.25) this.ents.push({ type: Math.random() < 0.5 ? 'hurdle' : 'overhead', lane: free, z: z + 150 })
    else if (Math.random() < 0.6) for (let i = 0; i < 6; i++) this.ents.push({ type: 'coin', lane: free, z: z - 40 + i * 30, h: 0.3, seed: i })

    const pr = Math.random()
    const pz = z + 260
    if (pr < 0.13) this.ents.push({ type: 'can', lane: free, z: pz })
    else if (pr < 0.17) this.ents.push({ type: 'magnet', lane: free, z: pz })
    else if (pr < 0.21) this.ents.push({ type: 'doubler', lane: free, z: pz })
  }

  check(e) {
    const p = this.p
    const inLane = Math.abs(e.lane - p.x) < 0.45
    if (!inLane) return
    if (e.type === 'train') {
      if (e.z < 12 && e.z + e.len > -8) this.hitObstacle(e)
      return
    }
    if (e.z > 14 || e.z < -12) return
    if (e.type === 'hurdle') { if (p.y < 0.32) this.hitObstacle(e); return }
    if (e.type === 'overhead') { if (p.slide <= 0) this.hitObstacle(e); return }
    if (e.type === 'coin') {
      if (Math.abs(p.y + 0.3 - e.h) > 0.5 && p.magnet <= 0) return
      e.hit = true
      const v = p.doubler > 0 ? 4 : 2 // each pickup = 2 coins (4 with doubler)
      this.stats.coins += v
      this.sparkle('#fbbf24', 5)
      sfx.coin()
      return
    }
    if (p.y > 0.6) return
    e.hit = true
    if (e.type === 'can') {
      this.stats.cans++
      p.boost = 3
      this.sparkle('#4ade80', 16)
      this.float(`VoltUp boost! (${this.stats.cans} cans)`, '#16a34a')
      sfx.power()
    } else if (e.type === 'magnet') {
      p.magnet = 9
      this.float('Coin magnet!', '#ef4444')
      sfx.power()
    } else if (e.type === 'doubler') {
      p.doubler = 10
      this.float('2x coins!', '#9333ea')
      sfx.power()
    }
  }

  hitObstacle(e) {
    if (this.p.boost > 0) {
      // VoltUp boost = invincible: smash through
      e.hit = true
      this.sparkle(e.color || '#f97316', e.type === 'train' ? 22 : 14)
      this.shake = e.type === 'train' ? 0.5 : 0.3
      sfx.smash()
      return
    }
    this.state = 'crashed'
    this.crashT = 0
    this.shake = 1
    this.flash = 1
    this.sparkle('#fbbf24', 30)
    this.sparkle('#94a3b8', 20)
    sfx.crash()
    this.emitHud()
  }

  sparkle(c, n) {
    const x = this.sx(this.p.x * this.laneW, 1)
    const y = this.BOT - this.laneW * 0.5 - this.p.y * this.laneW
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = rand(60, 260)
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 500, life: rand(0.35, 0.7), max: 0.7, c, r: rand(2, 4.5) })
    }
  }

  // one small, short message near the TOP — never over the track
  float(text, color) {
    this.floats = [{ text, color, life: 1.4 }]
  }

  meters() { return Math.floor(this.dist / METER) }

  emitHud() {
    const p = this.p
    this.onHud?.({ state: this.state, meters: this.meters(), coins: this.stats.coins, boost: p.boost, magnet: p.magnet, doubler: p.doubler, cans: this.stats.cans })
  }

  results() {
    const s = this.stats
    return { meters: this.meters(), coins: s.coins, cans: s.cans, time: Math.round(this.runT) }
  }

  /* ---------- render ---------- */
  draw() {
    const { ctx, W, H } = this
    ctx.save()
    if (this.shake > 0) ctx.translate(rand(-1, 1) * this.shake * 8, rand(-1, 1) * this.shake * 8)
    this.drawSky()
    this.drawGround()
    this.drawSprites()
    this.drawParticles()
    ctx.restore()
    this.drawFloat()
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.75})`; ctx.fillRect(0, 0, W, H) }
    if (this.state === 'countdown') this.drawCountdown()
  }

  drawSky() {
    const { ctx, W, HZ } = this
    const g = ctx.createLinearGradient(0, 0, 0, HZ)
    g.addColorStop(0, '#38bdf8')
    g.addColorStop(1, '#bae6fd')
    ctx.fillStyle = g
    ctx.fillRect(-20, -20, W + 40, HZ + 22)
    ctx.fillStyle = '#fef08a'
    ctx.shadowColor = '#fde047'
    ctx.shadowBlur = 30
    ctx.beginPath()
    ctx.arc(W * 0.78, HZ * 0.3, W * 0.07, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,.95)'
    for (const c of this.clouds) {
      const x = c.x * W * 1.2 - W * 0.1
      const y = c.y * this.H
      const r = W * 0.05 * c.s
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.arc(x + r * 0.9, y - r * 0.4, r * 0.9, 0, Math.PI * 2)
      ctx.arc(x + r * 1.8, y, r * 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawGround() {
    const { ctx, W, H, HZ, laneW, trackHalf } = this
    ctx.fillStyle = '#a3a3a3'
    ctx.fillRect(-20, HZ, W + 40, H - HZ + 20)
    const sb = (H - HZ) / (this.BOT - HZ)
    const vx = W / 2
    // gravel track bed
    ctx.fillStyle = '#c4a484'
    ctx.beginPath()
    ctx.moveTo(vx, HZ)
    ctx.lineTo(this.sx(trackHalf * 1.05, sb), H)
    ctx.lineTo(this.sx(-trackHalf * 1.05, sb), H)
    ctx.closePath()
    ctx.fill()
    // sleepers (wooden ties)
    const step = 46
    const off = this.dist % step
    ctx.fillStyle = '#8b5e34'
    for (let z = -off - step; z < DRAW_Z; z += step) {
      const a = this.proj(z)
      const b = this.proj(z + 14)
      for (const l of [-1, 0, 1]) {
        const c = l * laneW
        const hw = laneW * 0.4
        ctx.beginPath()
        ctx.moveTo(this.sx(c - hw, a.s), a.y)
        ctx.lineTo(this.sx(c + hw, a.s), a.y)
        ctx.lineTo(this.sx(c + hw, b.s), b.y)
        ctx.lineTo(this.sx(c - hw, b.s), b.y)
        ctx.fill()
      }
    }
    // steel rails
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 3
    for (const l of [-1, 0, 1]) {
      for (const r of [-0.26, 0.26]) {
        ctx.beginPath()
        ctx.moveTo(vx, HZ)
        ctx.lineTo(this.sx((l + r) * laneW, sb), H)
        ctx.stroke()
      }
    }
    // sidewalks
    ctx.fillStyle = '#d6d3d1'
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(vx, HZ)
      ctx.lineTo(this.sx(s * trackHalf * 1.05, sb), H)
      ctx.lineTo(this.sx(s * trackHalf * 1.6, sb), H)
      ctx.closePath()
      ctx.fill()
    }
  }

  drawSprites() {
    const list = []
    const bs = 230
    const startIdx = Math.floor(this.dist / bs)
    for (let i = startIdx; i < startIdx + Math.ceil(DRAW_Z / bs) + 1; i++) {
      const z = i * bs - this.dist
      if (z < -CAM_D * 0.5) continue
      list.push({ kind: 'bld', z, side: -1, i }, { kind: 'bld', z, side: 1, i: i + 999 })
    }
    for (const e of this.ents) if (e.z < DRAW_Z) list.push({ kind: 'ent', z: e.z, e })
    list.sort((a, b) => b.z - a.z)
    let drawn = false
    for (const it of list) {
      if (!drawn && it.z < 0) { this.drawPlayer(); drawn = true }
      this.drawSprite(it)
    }
    if (!drawn) this.drawPlayer()
  }

  drawSprite(it) {
    const { ctx } = this
    const { s, y } = this.proj(it.z)
    const fade = Math.min(1, (DRAW_Z - it.z) / 400)
    ctx.globalAlpha = fade
    if (it.kind === 'bld') this.drawBuilding(it, s, y)
    else {
      const e = it.e
      const x = this.sx(e.lane * this.laneW, s)
      const lw = this.laneW * s
      const rh = this.laneW * 0.95 * s // runner height at this depth
      if (e.type === 'train') {
        const far = this.proj(it.z + e.len)
        drawTrain(ctx, x, y, lw * 0.86, this.sx(e.lane * this.laneW, far.s), far.y, this.laneW * far.s * 0.86, e.color, s)
      } else if (e.type === 'hurdle') drawHurdle(ctx, x, y, lw * 0.82, s)
      else if (e.type === 'overhead') drawOverhead(ctx, x, y, lw * 0.9, s)
      else if (e.type === 'coin') drawCoin(ctx, x, y - e.h * rh, lw * 0.11, this.t, e.seed)
      else if (e.type === 'can') drawCan(ctx, x, y - rh * 0.15, lw * 0.17, this.t)
      else if (e.type === 'magnet') drawMagnet(ctx, x, y - rh * 0.45, lw * 0.16, this.t)
      else if (e.type === 'doubler') drawDoubler(ctx, x, y - rh * 0.45, lw * 0.17, this.t)
    }
    ctx.globalAlpha = 1
  }

  drawBuilding(it, s, y) {
    const { ctx } = this
    const h0 = hash(it.i)
    const depth = 180
    const far = this.proj(it.z + depth)
    const inner = it.side * this.trackHalf * 1.65
    const width = 260
    const outer = inner + it.side * width
    const bh = 260 + h0 * 420
    const color = BUILDING_COLORS[Math.floor(h0 * BUILDING_COLORS.length)]
    // side wall facing the track
    ctx.fillStyle = shade(color, 0.82)
    ctx.beginPath()
    ctx.moveTo(this.sx(inner, s), y)
    ctx.lineTo(this.sx(inner, s), y - bh * s)
    ctx.lineTo(this.sx(inner, far.s), far.y - bh * far.s)
    ctx.lineTo(this.sx(inner, far.s), far.y)
    ctx.closePath()
    ctx.fill()
    // front face
    const x1 = this.sx(Math.min(inner, outer), s)
    const x2 = this.sx(Math.max(inner, outer), s)
    ctx.fillStyle = color
    ctx.fillRect(x1, y - bh * s, x2 - x1, bh * s)
    ctx.strokeStyle = 'rgba(30,41,59,.35)'
    ctx.lineWidth = 1
    ctx.strokeRect(x1, y - bh * s, x2 - x1, bh * s)
    // windows
    if (s > 0.08) {
      ctx.fillStyle = 'rgba(255,255,255,.75)'
      const cols = 3
      const rows = Math.floor(bh / 80)
      const ww = (x2 - x1) / (cols * 2 + 1)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillRect(x1 + ww * (1 + c * 2), y - bh * s + (20 + r * 80) * s, ww, 40 * s)
        }
      }
    }
    // brand poster on some buildings
    if (h0 > 0.72 && s > 0.06) {
      const po = POSTERS[Math.floor(hash(it.i + 7) * POSTERS.length)]
      const pw = (x2 - x1) * 0.86
      const ph = 70 * s
      const px = x1 + (x2 - x1) * 0.07
      const py = y - 150 * s
      ctx.fillStyle = po.bg
      rr(ctx, px, py, pw, ph, 6 * s)
      ctx.fill()
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = Math.max(1, 2 * s)
      ctx.stroke()
      if (s > 0.15) {
        ctx.fillStyle = po.fg
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `900 ${26 * s}px "Lilita One", sans-serif`
        ctx.fillText(po.brand, px + pw / 2, py + ph * 0.38)
        ctx.font = `800 ${11 * s}px Nunito, sans-serif`
        ctx.fillText(po.line, px + pw / 2, py + ph * 0.75)
      }
    }
  }

  drawPlayer() {
    const p = this.p
    if (this.state === 'crashed' && Math.floor(this.crashT * 12) % 2) return
    const x = this.sx(p.x * this.laneW, 1)
    drawRunner(this.ctx, x, this.BOT, this.laneW * 0.95, this.wear, {
      t: this.t, run: this.state !== 'countdown' && this.state !== 'crashed', jump: p.y, slide: p.slide > 0, boost: p.boost > 0,
    })
    if (p.magnet > 0) {
      this.ctx.strokeStyle = `rgba(239,68,68,${0.35 + 0.25 * Math.sin(this.t * 10)})`
      this.ctx.lineWidth = 3
      this.ctx.beginPath()
      this.ctx.arc(x, this.BOT - this.laneW * 0.45 - p.y * this.laneW, this.laneW * (0.6 + (this.t * 2 % 1) * 0.3), 0, Math.PI * 2)
      this.ctx.stroke()
    }
  }

  drawParticles() {
    const { ctx } = this
    for (const q of this.parts) {
      ctx.globalAlpha = Math.max(0, q.life / q.max)
      ctx.fillStyle = q.c
      ctx.beginPath()
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  drawFloat() {
    const f = this.floats[0]
    if (!f) return
    const { ctx, W } = this
    const y = this.H * 0.135
    ctx.globalAlpha = Math.min(1, f.life * 3)
    ctx.font = '900 15px "Lilita One", sans-serif'
    const tw = ctx.measureText(f.text).width + 26
    ctx.fillStyle = '#fff'
    rr(ctx, W / 2 - tw / 2, y - 15, tw, 30, 15)
    ctx.fill()
    ctx.strokeStyle = f.color
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.fillStyle = f.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(f.text, W / 2, y + 1)
    ctx.globalAlpha = 1
  }

  drawCountdown() {
    const { ctx, W } = this
    const n = Math.ceil(this.countdown)
    const frac = this.countdown - Math.floor(this.countdown)
    const label = n >= 1 && n <= 3 ? String(n) : 'GO!'
    ctx.save()
    ctx.translate(W / 2, this.H * 0.26)
    ctx.scale(1 + frac * 0.4, 1 + frac * 0.4)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '900 70px "Lilita One", sans-serif'
    ctx.lineWidth = 10
    ctx.strokeStyle = '#1e293b'
    ctx.strokeText(label, 0, 0)
    ctx.fillStyle = '#facc15'
    ctx.fillText(label, 0, 0)
    ctx.restore()
  }
}
