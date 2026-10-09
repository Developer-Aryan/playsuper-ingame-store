import { sfx } from './audio'
import { drawCar, drawTraffic, drawBarrier, drawCoin, drawCan, drawMagnet, drawShield, rr, skinColor } from './draw'

const CAM_D = 140 // camera depth
const DRAW_Z = 1800 // how far ahead we render / spawn
const METER = 20 // world units per metre
const TRAFFIC = ['#3b82f6', '#f59e0b', '#10b981', '#e5e7eb', '#a855f7', '#0ea5e9', '#f43f5e']
const BILLBOARDS = [
  { brand: 'VoltUp', line: 'GRAB THE CANS = NITRO', bg: '#16a34a', fg: '#ecfccb' },
  { brand: 'SoundBox', line: 'HEAR EVERY OVERTAKE', bg: '#7c3aed', fg: '#f5f3ff' },
  { brand: 'PlaySuper', line: 'REAL REWARDS IN THE VAULT', bg: '#facc15', fg: '#1c1917' },
  { brand: 'CineMax', line: 'BLOCKBUSTER RUN: 2,500 M', bg: '#ea580c', fg: '#fff7ed' },
  { brand: 'ChillTech', line: 'STAY COOL AT 300 KM/H', bg: '#0891b2', fg: '#ecfeff' },
]

const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export class Engine {
  constructor(canvas, { skin, onHud, onEnd }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.skin = skin
    this.onHud = onHud
    this.onEnd = onEnd
    this.mountains = [this.genRidge(0.11, 9), this.genRidge(0.07, 15)]
    this.stars = Array.from({ length: 60 }, () => [Math.random(), Math.random() * 0.8, Math.random()])

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
    sfx.engineStop()
  }

  genRidge(amp, n) {
    const pts = []
    for (let i = 0; i <= n; i++) pts.push([i / n, rand(0.3, 1) * amp])
    pts[n][1] = pts[0][1]
    return pts
  }

  resize() {
    const r = this.canvas.parentElement.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = r.width * dpr
    this.canvas.height = r.height * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.W = r.width
    this.H = r.height
    this.HZ = this.H * 0.36
    this.BOT = this.H * 0.85
    this.laneW = this.W * 0.3
    this.roadHalf = this.laneW * 1.62
  }

  reset() {
    this.t = 0
    this.runT = 0
    this.countdown = 3
    this.lastBeep = 4
    this.speed = 0
    this.dist = 0
    this.p = { lane: 0, x: 0, nitro: 0.34, boost: 0, shield: false, magnet: 0, inv: 0, switchT: -9 }
    this.ents = []
    this.parts = []
    this.floats = []
    this.spawnAt = 900
    this.lastFree = 0
    this.stats = { coins: 0, near: 0, nitros: 0, cans: 0, smashes: 0, combo: 0, maxCombo: 0, bonus: 0 }
    this.comboT = 0
    this.state = 'countdown'
    this.shake = 0
    this.flash = 0
    this.crashT = 0
    this.hudT = 0
    this.camX = 0
  }

  setPaused(v) {
    if (this.state === 'over' || this.state === 'crashed') return
    if (v && this.state !== 'paused') { this.prevState = this.state; this.state = 'paused'; sfx.engineStop() }
    if (!v && this.state === 'paused') { this.state = this.prevState; if (this.state === 'running') sfx.engineStart(); this.last = performance.now() }
    this.emitHud()
  }

  /* ---------- input ---------- */
  onKey(e) {
    const k = e.key
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(k)) e.preventDefault()
    if (e.repeat) return
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.steer(-1)
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') this.steer(1)
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') this.fireNitro()
    else if (k === 'p' || k === 'P' || k === 'Escape') this.setPaused(this.state !== 'paused')
  }
  onDown(e) {
    sfx.unlock()
    this.touch = { x: e.clientX, y: e.clientY, t: performance.now() }
  }
  onUp(e) {
    if (!this.touch) return
    const dx = e.clientX - this.touch.x
    const dy = e.clientY - this.touch.y
    this.touch = null
    if (Math.abs(dx) > 25 && Math.abs(dx) > Math.abs(dy)) this.steer(Math.sign(dx))
    else if (dy < -25) this.fireNitro()
    else {
      const r = this.canvas.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        this.steer(e.clientX - r.left < r.width / 2 ? -1 : 1)
      }
    }
  }
  steer(d) {
    if (this.state !== 'running') return
    const nl = clamp(this.p.lane + d, -1, 1)
    if (nl !== this.p.lane) { this.p.lane = nl; this.p.switchT = this.runT; sfx.swish() }
  }
  fireNitro() {
    if (this.state !== 'running' || this.p.nitro < 1 || this.p.boost > 0) return
    this.p.boost = 3.2
    this.p.nitro = 0
    this.stats.nitros++
    this.shake = 0.35
    this.float('NITRO!', '#7dd3fc', 1.4)
    sfx.nitro()
  }

  /* ---------- projection ---------- */
  proj(z) {
    const s = CAM_D / (CAM_D + Math.max(z, -CAM_D * 0.7))
    return { s, y: this.HZ + (this.BOT - this.HZ) * s }
  }
  sx(worldX, s) {
    return this.W / 2 + (worldX - this.camX) * s
  }

  /* ---------- loop ---------- */
  loop(now) {
    let dt = Math.min(0.033, (now - this.last) / 1000)
    this.last = now
    if (this.state !== 'paused' && this.state !== 'over') this.update(dt)
    this.draw()
    this.raf = requestAnimationFrame(this.loop)
  }

  update(dt) {
    this.t += dt
    const p = this.p
    this.shake = Math.max(0, this.shake - dt * 1.8)
    this.flash = Math.max(0, this.flash - dt * 2)

    if (this.state === 'countdown') {
      this.countdown -= dt
      const n = Math.ceil(this.countdown)
      if (n < this.lastBeep && n >= 1 && n <= 3) { this.lastBeep = n; sfx.beep(false) }
      this.speed = 60
      this.dist += this.speed * dt
      if (this.countdown <= 0) { this.state = 'running'; sfx.beep(true); sfx.engineStart() }
      this.updateParts(dt)
      this.camX = p.x * this.laneW * 0.55
      return
    }

    if (this.state === 'crashed') {
      this.crashT += dt
      dt *= 0.3
      this.speed *= 0.95
      if (this.crashT > 1.3) {
        this.state = 'over'
        sfx.engineStop()
        this.onEnd(this.results())
      }
    } else {
      this.runT += dt
      const base = Math.min(760, 340 + this.runT * 7)
      this.speed = base * (p.boost > 0 ? 1.7 : 1)
      p.boost = Math.max(0, p.boost - dt)
      p.magnet = Math.max(0, p.magnet - dt)
      p.inv = Math.max(0, p.inv - dt)
      this.comboT -= dt
      if (this.comboT <= 0) this.stats.combo = 0
      sfx.engineSet(this.speed)
    }

    const dz = this.speed * dt
    this.dist += dz
    p.x += (p.lane - p.x) * Math.min(1, dt * 16)
    this.camX = p.x * this.laneW * 0.55

    while (this.spawnAt - this.dist < DRAW_Z) {
      this.spawnRow(this.spawnAt - this.dist)
      this.spawnAt += this.gap()
    }

    for (const e of this.ents) {
      const prevZ = e.z
      e.z -= dz
      if (e.hit) continue
      if (p.magnet > 0 && e.type === 'coin' && e.z < 380) e.lane += (p.x - e.lane) * Math.min(1, dt * 9)
      if (this.state === 'running' && e.z < 18 && e.z > -14 && Math.abs(e.lane - p.x) < 0.5) this.collide(e)
      if (this.state === 'running' && !e.hit && (e.type === 'car' || e.type === 'barrier') && prevZ >= 0 && e.z < 0) {
        const d = Math.abs(e.lane - p.x)
        // only a late dodge counts: you switched lanes within the last 0.45s
        if (d >= 0.5 && d < 1.3 && this.runT - p.switchT < 0.45) this.nearMiss()
      }
    }
    this.ents = this.ents.filter((e) => !e.hit && e.z > -CAM_D * 0.6)

    // exhaust / trail particles
    if (this.state === 'running') {
      const px = this.sx(p.x * this.laneW, 1)
      const trail = this.skin.trail
      const n = p.boost > 0 ? 4 : 1
      for (let i = 0; i < n; i++) {
        this.parts.push({
          x: px + rand(-this.laneW * 0.25, this.laneW * 0.25), y: this.BOT - 4,
          vx: rand(-20, 20), vy: rand(60, 160), life: 0.5, max: 0.5,
          c: p.boost > 0 ? (Math.random() < 0.5 ? '#7dd3fc' : '#c4b5fd') : trail ? skinColor(trail, this.t) : 'rgba(200,200,220,.5)',
          r: rand(2, p.boost > 0 ? 5 : 3),
        })
      }
    }
    this.updateParts(dt)

    this.hudT += dt
    if (this.hudT > 0.1) { this.hudT = 0; this.emitHud() }
  }

  updateParts(dt) {
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 0) * dt; q.life -= dt }
    this.parts = this.parts.filter((q) => q.life > 0)
    for (const f of this.floats) { f.y -= 50 * dt; f.life -= dt }
    this.floats = this.floats.filter((f) => f.life > 0)
  }

  gap() {
    const d = Math.min(1, this.runT / 75)
    return rand(300, 360) - d * 110
  }

  spawnRow(z) {
    const d = Math.min(1, this.runT / 75)
    const free = clamp(this.lastFree + Math.round(rand(-1.4, 1.4)), -1, 1)
    this.lastFree = free
    const r = Math.random()

    if (r < 0.13) {
      // coin wave — zig-zag across lanes
      let lane = free
      for (let i = 0; i < 8; i++) {
        this.ents.push({ type: 'coin', lane, z: z + i * 32, seed: Math.random() * 6 })
        if (i % 3 === 2) lane = clamp(lane + (Math.random() < 0.5 ? -1 : 1), -1, 1)
      }
      this.lastFree = lane
      return
    }

    const blocked = [-1, 0, 1].filter((l) => l !== free)
    const count = Math.random() < 0.3 + d * 0.45 ? 2 : 1
    const pick = count === 2 ? blocked : [blocked[Math.floor(Math.random() * 2)]]
    for (const l of pick) {
      if (Math.random() < 0.72) this.ents.push({ type: 'car', lane: l, z: z + rand(-15, 15), color: TRAFFIC[Math.floor(Math.random() * TRAFFIC.length)] })
      else this.ents.push({ type: 'barrier', lane: l, z })
    }
    if (Math.random() < 0.45) {
      for (let i = 0; i < 5; i++) this.ents.push({ type: 'coin', lane: free, z: z - 70 + i * 30, seed: i })
    }
    const pr = Math.random()
    if (pr < 0.16) this.ents.push({ type: 'can', lane: free, z: z + 110 })
    else if (pr < 0.2) this.ents.push({ type: 'magnet', lane: free, z: z + 110 })
    else if (pr < 0.24) this.ents.push({ type: 'shield', lane: free, z: z + 110 })
  }

  collide(e) {
    const p = this.p
    const px = this.sx(p.x * this.laneW, 1)
    const py = this.BOT - this.laneW * 0.3
    if (e.type === 'coin') {
      e.hit = true
      this.stats.coins++
      this.burst(px, py, '#fbbf24', 6, 140)
      sfx.coin()
      return
    }
    if (e.type === 'can') {
      e.hit = true
      p.nitro = Math.min(1, p.nitro + 0.34)
      this.stats.cans++
      this.burst(px, py, '#4ade80', 14, 200)
      this.float(p.nitro >= 1 ? 'NITRO READY!' : '+VOLTUP CAN', '#4ade80')
      sfx.power()
      return
    }
    if (e.type === 'magnet') { e.hit = true; p.magnet = 8; this.float('COIN MAGNET', '#f87171'); sfx.power(); return }
    if (e.type === 'shield') { e.hit = true; p.shield = true; this.float('SHIELD UP', '#67e8f9'); sfx.power(); return }

    // car / barrier
    if (p.boost > 0) {
      e.hit = true
      this.stats.smashes++
      this.stats.bonus += 50
      this.burst(px, py - 20, e.color || '#f97316', 26, 380)
      this.shake = 0.5
      this.float('SMASH +50', '#fde047')
      sfx.smash()
    } else if (p.inv > 0) {
      // ghosting after a shield break
    } else if (p.shield) {
      e.hit = true
      p.shield = false
      p.inv = 1.2
      this.burst(px, py, '#67e8f9', 24, 300)
      this.shake = 0.6
      this.float('SHIELD SAVED YOU', '#67e8f9')
      sfx.shield()
    } else {
      this.state = 'crashed'
      this.crashT = 0
      this.shake = 1.2
      this.flash = 1
      this.burst(px, py, '#f97316', 50, 520)
      this.burst(px, py, '#fde047', 30, 360)
      this.burst(px, py, '#6b7280', 30, 200)
      sfx.crash()
      sfx.engineStop()
      this.emitHud()
    }
  }

  nearMiss() {
    const s = this.stats
    s.near++
    s.combo++
    s.maxCombo = Math.max(s.maxCombo, s.combo)
    s.bonus += 20 * s.combo
    this.comboT = 2.4
    this.p.nitro = Math.min(1, this.p.nitro + 0.1)
    this.float(s.combo > 1 ? `NEAR MISS x${s.combo}` : 'NEAR MISS', '#f0abfc')
    sfx.near()
  }

  burst(x, y, c, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const v = rand(sp * 0.3, sp)
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.3, g: 500, life: rand(0.4, 0.9), max: 0.9, c, r: rand(2, 5) })
    }
  }

  float(text, color, size = 1) {
    this.floats.push({ text, color, x: this.W / 2, y: this.H * 0.55, life: 1.1, size })
  }

  meters() { return Math.floor(this.dist / METER) }

  emitHud() {
    const p = this.p
    this.onHud?.({
      state: this.state, meters: this.meters(), coins: this.stats.coins, nitro: p.nitro, boost: p.boost,
      magnet: p.magnet, shield: p.shield, combo: this.stats.combo, kmh: Math.round(this.speed * 0.42),
    })
  }

  results() {
    const s = this.stats
    const meters = this.meters()
    return { meters, coins: s.coins, near: s.near, nitros: s.nitros, cans: s.cans, smashes: s.smashes, maxCombo: s.maxCombo, score: meters + s.bonus, time: Math.round(this.runT) }
  }

  /* ---------- render ---------- */
  draw() {
    const { ctx, W, H } = this
    ctx.save()
    if (this.shake > 0) ctx.translate(rand(-1, 1) * this.shake * 10, rand(-1, 1) * this.shake * 10)
    this.drawSky()
    this.drawGround()
    this.drawRoad()
    this.drawSprites()
    this.drawParticles()
    this.drawFloats()
    ctx.restore()

    if (this.p.boost > 0) this.drawSpeedLines()
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.7})`
      ctx.fillRect(0, 0, W, H)
    }
    if (this.state === 'countdown') this.drawCountdown()
  }

  drawSky() {
    const { ctx, W, HZ } = this
    if (!this.skyG || this.skyH !== HZ) {
      this.skyH = HZ
      this.skyG = ctx.createLinearGradient(0, 0, 0, HZ)
      this.skyG.addColorStop(0, '#0a0118')
      this.skyG.addColorStop(0.55, '#2e0b4f')
      this.skyG.addColorStop(1, '#a3195b')
    }
    ctx.fillStyle = this.skyG
    ctx.fillRect(-20, -20, W + 40, HZ + 20)
    // stars
    for (const [x, y, b] of this.stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(this.t + b * 9))})`
      ctx.fillRect(x * W, y * HZ * 0.7, 1.5, 1.5)
    }
    // sun
    const cx = W / 2 - (this.camX || 0) * 0.05
    const r = W * 0.24
    const cy = HZ - r * 0.25
    const sg = ctx.createLinearGradient(0, cy - r, 0, cy + r)
    sg.addColorStop(0, '#fde047')
    sg.addColorStop(0.5, '#fb923c')
    sg.addColorStop(1, '#ec4899')
    ctx.save()
    ctx.shadowColor = '#f472b6'
    ctx.shadowBlur = 40
    ctx.fillStyle = sg
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = this.skyG
    for (let i = 0; i < 6; i++) {
      const y = cy + r * 0.1 + i * r * 0.16
      ctx.fillRect(cx - r - 2, y, r * 2 + 4, 2 + i * 1.4)
    }
    // mountains
    const cols = [['#1b0b33', '#f0f'], ['#12062a', '#7c3aed']]
    this.mountains.forEach((m, li) => {
      const off = (-(this.camX || 0) * (0.06 + li * 0.04)) % W
      ctx.fillStyle = cols[li][0]
      ctx.strokeStyle = cols[li][1]
      ctx.lineWidth = 1.2
      for (const k of [-1, 0, 1]) {
        ctx.beginPath()
        ctx.moveTo(off + k * W, HZ)
        for (const [px, ph] of m) ctx.lineTo(off + k * W + px * W, HZ - ph * this.H)
        ctx.lineTo(off + (k + 1) * W, HZ)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 0.5
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    })
  }

  drawGround() {
    const { ctx, W, H, HZ } = this
    const g = ctx.createLinearGradient(0, HZ, 0, H)
    g.addColorStop(0, '#1a0633')
    g.addColorStop(1, '#07010f')
    ctx.fillStyle = g
    ctx.fillRect(-20, HZ, W + 40, H - HZ + 20)
    // synthwave grid
    ctx.strokeStyle = 'rgba(217,70,239,.35)'
    ctx.lineWidth = 1
    const step = 90
    const off = this.dist % step
    for (let z = -off; z < DRAW_Z; z += step) {
      const { s, y } = this.proj(z)
      ctx.globalAlpha = Math.min(1, s * 3)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    const sb = (H - HZ) / (this.BOT - this.HZ)
    for (let i = -10; i <= 10; i++) {
      const wx = i * this.laneW * 1.3
      ctx.beginPath()
      ctx.moveTo(W / 2, HZ)
      ctx.lineTo(this.sx(wx, sb), H)
      ctx.stroke()
    }
  }

  drawRoad() {
    const { ctx, W, H, HZ, roadHalf, laneW } = this
    const sb = (H - HZ) / (this.BOT - this.HZ)
    const L = this.sx(-roadHalf, sb)
    const R = this.sx(roadHalf, sb)
    const vx = W / 2
    const rg = ctx.createLinearGradient(0, HZ, 0, H)
    rg.addColorStop(0, '#120a24')
    rg.addColorStop(1, '#231a3d')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.moveTo(vx, HZ)
    ctx.lineTo(R, H)
    ctx.lineTo(L, H)
    ctx.closePath()
    ctx.fill()

    // rumble strips + lane dashes
    const step = 70
    const off = this.dist % step
    for (let z = -off - step; z < DRAW_Z; z += step) {
      const a = this.proj(z)
      const b = this.proj(z + step / 2)
      const band = Math.floor((this.dist + z) / step) % 2 === 0
      for (const side of [-1, 1]) {
        ctx.fillStyle = band ? '#f472b6' : '#e0e7ff'
        const x1 = this.sx(side * roadHalf, a.s)
        const x2 = this.sx(side * roadHalf * 1.07, a.s)
        const x3 = this.sx(side * roadHalf * 1.07, b.s)
        const x4 = this.sx(side * roadHalf, b.s)
        ctx.beginPath()
        ctx.moveTo(x1, a.y); ctx.lineTo(x2, a.y); ctx.lineTo(x3, b.y); ctx.lineTo(x4, b.y)
        ctx.fill()
      }
      ctx.fillStyle = 'rgba(255,255,255,.75)'
      for (const lx of [-laneW / 2, laneW / 2]) {
        const w1 = 5 * a.s
        const w2 = 5 * b.s
        ctx.beginPath()
        ctx.moveTo(this.sx(lx, a.s) - w1, a.y); ctx.lineTo(this.sx(lx, a.s) + w1, a.y)
        ctx.lineTo(this.sx(lx, b.s) + w2, b.y); ctx.lineTo(this.sx(lx, b.s) - w2, b.y)
        ctx.fill()
      }
    }
    // neon edges
    ctx.save()
    ctx.shadowColor = '#22d3ee'
    ctx.shadowBlur = 12
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(vx, HZ); ctx.lineTo(this.sx(-roadHalf * 1.07, sb), H)
    ctx.moveTo(vx, HZ); ctx.lineTo(this.sx(roadHalf * 1.07, sb), H)
    ctx.stroke()
    ctx.restore()
  }

  drawSprites() {
    const list = []
    // roadside lamps
    const ls = 200
    for (let z = -(this.dist % ls); z < DRAW_Z; z += ls) {
      list.push({ kind: 'lamp', z, side: -1 }, { kind: 'lamp', z, side: 1 })
    }
    // billboards
    const bs = 1300
    for (let z = -(this.dist % bs) + 600; z < DRAW_Z; z += bs) {
      const idx = Math.floor((this.dist + z) / bs)
      list.push({ kind: 'board', z, side: idx % 2 ? 1 : -1, b: BILLBOARDS[((idx % BILLBOARDS.length) + BILLBOARDS.length) % BILLBOARDS.length] })
    }
    for (const e of this.ents) if (e.z < DRAW_Z) list.push({ kind: 'ent', z: e.z, e })
    list.sort((a, b) => b.z - a.z)

    let playerDrawn = false
    for (const it of list) {
      if (!playerDrawn && it.z < 0) { this.drawPlayer(); playerDrawn = true }
      this.drawSprite(it)
    }
    if (!playerDrawn) this.drawPlayer()
  }

  drawSprite(it) {
    const { ctx } = this
    const { s, y } = this.proj(it.z)
    const fade = Math.min(1, (DRAW_Z - it.z) / 300)
    ctx.globalAlpha = fade
    if (it.kind === 'lamp') {
      const x = this.sx(it.side * this.roadHalf * 1.2, s)
      const h = 230 * s
      ctx.strokeStyle = '#4c1d95'
      ctx.lineWidth = Math.max(1, 5 * s)
      ctx.beginPath()
      ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.lineTo(x - it.side * 40 * s, y - h)
      ctx.stroke()
      ctx.fillStyle = '#e0f2fe'
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 18 * s + 4
      ctx.beginPath()
      ctx.arc(x - it.side * 40 * s, y - h, Math.max(1, 7 * s), 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    } else if (it.kind === 'board') {
      if (it.z < 140) { ctx.globalAlpha = 1; return }
      ctx.globalAlpha = fade * Math.min(1, (it.z - 140) / 160)
      const x = this.sx(it.side * this.roadHalf * 2.25, s)
      const bw = 330 * s
      const bh = 130 * s
      const top = y - 300 * s
      ctx.fillStyle = '#1f1235'
      ctx.fillRect(x - bw * 0.3, top + bh, 8 * s, 300 * s - bh)
      ctx.fillRect(x + bw * 0.3, top + bh, 8 * s, 300 * s - bh)
      ctx.fillStyle = it.b.bg
      ctx.shadowColor = it.b.bg
      ctx.shadowBlur = 20 * s
      rr(ctx, x - bw / 2, top, bw, bh, 6 * s)
      ctx.fill()
      ctx.shadowBlur = 0
      if (s > 0.12) {
        ctx.fillStyle = it.b.fg
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `900 ${50 * s}px "Russo One", sans-serif`
        ctx.fillText(it.b.brand, x, top + bh * 0.4)
        ctx.font = `700 ${19 * s}px Outfit, sans-serif`
        ctx.fillText(it.b.line, x, top + bh * 0.78)
      }
    } else {
      const e = it.e
      const x = this.sx(e.lane * this.laneW, s)
      const lw = this.laneW * s
      if (e.type === 'car') drawTraffic(ctx, x, y, lw * 0.7, e.color, this.t)
      else if (e.type === 'barrier') drawBarrier(ctx, x, y, lw * 0.82, this.t)
      else if (e.type === 'coin') drawCoin(ctx, x, y - lw * 0.22 - Math.sin(this.t * 4 + e.seed) * lw * 0.03, lw * 0.12, this.t, e.seed)
      else if (e.type === 'can') drawCan(ctx, x, y - lw * 0.08, lw * 0.16, this.t)
      else if (e.type === 'magnet') drawMagnet(ctx, x, y - lw * 0.15, lw * 0.16, this.t)
      else if (e.type === 'shield') drawShield(ctx, x, y - lw * 0.15, lw * 0.16, this.t)
    }
    ctx.globalAlpha = 1
  }

  drawPlayer() {
    if (this.state === 'crashed' && this.crashT > 0.15) return
    const { ctx, p } = this
    const x = this.sx(p.x * this.laneW, 1)
    const w = this.laneW * 0.88
    const bounce = Math.sin(this.t * 30) * (this.speed > 100 ? 0.8 : 0)
    if (p.inv > 0 && Math.floor(this.t * 20) % 2) return
    drawCar(ctx, x, this.BOT + bounce, w, this.skin, { tilt: p.lane - p.x, t: this.t, boost: p.boost > 0 })
    if (p.shield) {
      ctx.save()
      ctx.strokeStyle = 'rgba(103,232,249,.9)'
      ctx.fillStyle = 'rgba(34,211,238,.12)'
      ctx.lineWidth = 2
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 16
      ctx.beginPath()
      ctx.ellipse(x, this.BOT - w * 0.25, w * 0.7, w * 0.45, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
    if (p.magnet > 0) {
      ctx.strokeStyle = `rgba(248,113,113,${0.3 + 0.3 * Math.sin(this.t * 10)})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, this.BOT - w * 0.25, w * (0.8 + (this.t * 2 % 1) * 0.4), 0, Math.PI * 2)
      ctx.stroke()
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

  drawFloats() {
    const { ctx } = this
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const f of this.floats) {
      ctx.globalAlpha = Math.min(1, f.life * 2)
      ctx.font = `900 ${22 * f.size}px "Russo One", sans-serif`
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(0,0,0,.6)'
      ctx.strokeText(f.text, f.x, f.y)
      ctx.fillStyle = f.color
      ctx.fillText(f.text, f.x, f.y)
    }
    ctx.globalAlpha = 1
  }

  drawSpeedLines() {
    const { ctx, W } = this
    ctx.strokeStyle = 'rgba(255,255,255,.35)'
    ctx.lineWidth = 2
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2
      const r1 = rand(W * 0.35, W * 0.6)
      const r2 = r1 + rand(30, 90)
      const cx = W / 2
      const cy = this.HZ
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 1.4)
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 1.4)
      ctx.stroke()
    }
  }

  drawCountdown() {
    const { ctx, W, H } = this
    const n = Math.ceil(this.countdown)
    const frac = this.countdown - Math.floor(this.countdown)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.save()
    ctx.translate(W / 2, H * 0.48)
    const sc = 1 + frac * 0.6
    ctx.scale(sc, sc)
    ctx.font = '900 84px "Russo One", sans-serif'
    ctx.lineWidth = 8
    ctx.strokeStyle = 'rgba(0,0,0,.6)'
    const label = n >= 1 && n <= 3 ? String(n) : 'GO!'
    ctx.strokeText(label, 0, 0)
    ctx.fillStyle = n >= 1 && n <= 3 ? '#fde047' : '#4ade80'
    ctx.fillText(label, 0, 0)
    ctx.restore()
  }
}
