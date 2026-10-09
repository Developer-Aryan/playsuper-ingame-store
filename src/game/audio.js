// Tiny WebAudio synth — no asset files needed
let ac = null
let master = null
let muted = false
let engineOsc = null
let engineGain = null

function ctx() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ac = new AC()
    master = ac.createGain()
    master.gain.value = muted ? 0 : 0.5
    master.connect(ac.destination)
  }
  if (ac.state === 'suspended') ac.resume()
  return ac
}

function tone(freq, dur, { type = 'sine', vol = 0.2, slide = 0, delay = 0 } = {}) {
  const a = ctx()
  if (!a || muted) return
  const t0 = a.currentTime + delay
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur)
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(master)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

function noise(dur, { vol = 0.3, freq = 1200, delay = 0 } = {}) {
  const a = ctx()
  if (!a || muted) return
  const t0 = a.currentTime + delay
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = freq
  const g = a.createGain()
  g.gain.value = vol
  src.connect(f).connect(g).connect(master)
  src.start(t0)
}

export const sfx = {
  unlock() { ctx() },
  setMuted(m) {
    muted = m
    if (master) master.gain.value = m ? 0 : 0.5
  },
  isMuted: () => muted,
  coin() { tone(1046, 0.06, { type: 'square', vol: 0.06 }); tone(1568, 0.09, { type: 'square', vol: 0.05, delay: 0.045 }) },
  jump() { tone(330, 0.18, { type: 'square', vol: 0.07, slide: 500 }) },
  swish() { noise(0.08, { vol: 0.08, freq: 3000 }) },
  near() { tone(660, 0.12, { type: 'triangle', vol: 0.12, slide: 500 }) },
  power() { tone(440, 0.25, { type: 'sawtooth', vol: 0.08, slide: 900 }) },
  nitro() { noise(0.6, { vol: 0.25, freq: 900 }); tone(110, 0.6, { type: 'sawtooth', vol: 0.1, slide: 300 }) },
  smash() { noise(0.25, { vol: 0.35, freq: 2500 }); tone(180, 0.2, { type: 'square', vol: 0.1, slide: -120 }) },
  shield() { tone(880, 0.3, { type: 'sine', vol: 0.15, slide: -600 }) },
  crash() { noise(0.9, { vol: 0.6, freq: 700 }); tone(120, 0.7, { type: 'sawtooth', vol: 0.15, slide: -90 }) },
  beep(hi) { tone(hi ? 988 : 494, hi ? 0.35 : 0.15, { type: 'square', vol: 0.08 }) },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.12, delay: i * 0.09 })) },
  cash() { tone(1318, 0.08, { type: 'square', vol: 0.06 }); tone(1760, 0.2, { type: 'square', vol: 0.06, delay: 0.08 }) },
  engineStart() {
    const a = ctx()
    if (!a || engineOsc) return
    engineOsc = a.createOscillator()
    engineOsc.type = 'sawtooth'
    const f = a.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 400
    engineGain = a.createGain()
    engineGain.gain.value = muted ? 0 : 0.035
    engineOsc.connect(f).connect(engineGain).connect(master)
    engineOsc.start()
  },
  engineSet(speed) {
    if (!engineOsc) return
    engineOsc.frequency.setTargetAtTime(40 + speed * 0.09, ac.currentTime, 0.1)
    engineGain.gain.setTargetAtTime(muted ? 0 : 0.035, ac.currentTime, 0.1)
  },
  engineStop() {
    if (!engineOsc) return
    try { engineOsc.stop() } catch { /* already stopped */ }
    engineOsc = null
  },
}
