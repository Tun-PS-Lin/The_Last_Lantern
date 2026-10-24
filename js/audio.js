// Generative score and sound effects (Web Audio), with drop-in file overrides.
// If audio/music/<bed>.mp3 or audio/sfx/<name>.mp3 exists, it is used instead of the synth.
// Voice lines live in audio/vo/ and are played through HTMLAudio (works on GitHub Pages and file://).

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const SCALES = {
  dmin: [50, 53, 55, 57, 60, 62, 65, 67, 69, 72, 74],
  amin: [57, 60, 62, 64, 67, 69, 72, 74, 76],
  fmaj: [65, 67, 69, 72, 74, 76, 77, 79, 81],
  glass: [84, 86, 88, 91, 93, 95, 96],
  cmaj: [72, 76, 79, 83, 84, 88],
};
// The mother's lullaby (original). [midi, beats]
export const LULLABY = [[57, 1], [62, 1], [64, 1], [65, 2], [64, 1], [62, 1], [60, 2], [62, 1], [64, 2], [57, 3],
  [57, 1], [62, 1], [64, 1], [65, 2], [67, 1], [69, 1], [67, 2], [65, 1], [64, 1], [62, 3]];

const fileCache = new Map();
const HTTP = /^https?:/.test(location.protocol);
// Does an audio file exist? Over http(s) a HEAD request answers quickly and works on iOS;
// from file:// we fall back to letting an <audio> element try.
function probe(url) {
  if (fileCache.has(url)) return fileCache.get(url);
  const p = HTTP
    ? fetch(url, { method: 'HEAD', cache: 'force-cache' }).then(r => (r.ok && !/text\/html/.test(r.headers.get('content-type') || '') ? url : null)).catch(() => null)
    : new Promise(res => {
      const a = new Audio(); a.preload = 'auto';
      const done = ok => { a.oncanplaythrough = a.onerror = null; res(ok ? url : null); };
      a.oncanplaythrough = () => done(true); a.onerror = () => done(false);
      setTimeout(() => done(a.readyState >= 3), 3000);
      a.src = url;
    });
  fileCache.set(url, p); return p;
}
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export class AudioEngine {
  constructor() { this.ready = false; this.muted = false; this.bed = null; this.bedName = null; this.fileBed = null; this.voVolume = 1; }
  init() {
    if (this.ready) return;
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.music = ctx.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 0.8; this.sfxBus.connect(this.master);
    this.reverb = ctx.createConvolver(); this.reverb.buffer = this.impulse(4.2, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.55; this.reverb.connect(wet).connect(this.master);
    this.noiseBuf = this.makeNoise();
    // persistent media elements, unlocked inside this user gesture (needed on iOS)
    this.voEl = new Audio(); this.bedEls = [new Audio(), new Audio()]; this.bedIx = 0;
    for (const el of [this.voEl, ...this.bedEls]) { el.src = SILENT; el.play().catch(() => {}); }
    this.ready = true;
    if (this.muted) this.setMuted(true);
  }
  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume(); }
  setMuted(m) {
    this.muted = m; if (!this.ready) return;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.2);
    if (this.fileBed) this.fileBed.muted = m;
    if (this.voEl) this.voEl.muted = m;
  }
  impulse(sec, decay) {
    const ctx = this.ctx, len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  makeNoise() {
    const ctx = this.ctx, len = ctx.sampleRate * 4, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.5 + last * 3; }
    return b;
  }
  // ── building blocks ──
  noise(dest, { type = 'lowpass', f = 800, q = 0.7, gain = 0.2, lfo = 0, lfoDepth = 0.5 } = {}) {
    const ctx = this.ctx, src = ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(fl).connect(g).connect(dest); src.start();
    const nodes = [src];
    if (lfo) { const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = lfo; og.gain.value = gain * lfoDepth; o.connect(og).connect(g.gain); o.start(); nodes.push(o); }
    return { stop: t => nodes.forEach(n => n.stop(t)), filter: fl, gain: g };
  }
  pad(dest, notes, { type = 'triangle', cutoff = 700, gain = 0.05, detune = 7, lfo = 0.07 } = {}) {
    const ctx = this.ctx, fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cutoff; fl.Q.value = 0.4;
    const g = ctx.createGain(); g.gain.value = gain; fl.connect(g).connect(dest);
    const send = ctx.createGain(); send.gain.value = 0.6; g.connect(send).connect(this.reverb);
    const nodes = [];
    for (const n of notes) for (const d of [-detune, detune]) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(n); o.detune.value = d; o.connect(fl); o.start(); nodes.push(o); }
    const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = lfo; lg.gain.value = cutoff * 0.35; l.connect(lg).connect(fl.frequency); l.start(); nodes.push(l);
    return { stop: t => nodes.forEach(n => n.stop(t)) };
  }
  pluck(dest, midi, { when = 0, vel = 0.12, decay = 2.6, timbre = 'box', send = 0.7 } = {}) {
    const ctx = this.ctx, t = ctx.currentTime + when, f = mtof(midi);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    const parts = timbre === 'glass' ? [[1, 1], [2.76, 0.25], [5.4, 0.08]] : timbre === 'piano' ? [[1, 1], [2, 0.35], [3, 0.12], [4.01, 0.05]] : [[1, 1], [2, 0.3], [3.01, 0.14], [4.2, 0.05]];
    for (const [m, a] of parts) { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * m; const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t); o.stop(t + decay + 0.1); }
    g.connect(dest); const s = ctx.createGain(); s.gain.value = send; g.connect(s).connect(this.reverb);
  }
  hum(dest, midi, { when = 0, dur = 0.5, vel = 0.07 } = {}) {
    const ctx = this.ctx, t = ctx.currentTime + when, f = mtof(midi);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5; vg.gain.value = f * 0.008; vib.connect(vg).connect(o.frequency);
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 480; f1.Q.value = 3;
    const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 1100;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.12); g.gain.setValueAtTime(vel, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    o.connect(f1).connect(f2).connect(g).connect(dest); const s = ctx.createGain(); s.gain.value = 0.5; g.connect(s).connect(this.reverb);
    o.start(t); vib.start(t); o.stop(t + dur + 0.3); vib.stop(t + dur + 0.3);
  }
  sparse(dest, notes, { min = 3, max = 8, vel = 0.08, timbre = 'box', oct = 0, decay = 3 } = {}) {
    let alive = true, timer;
    const go = () => { if (!alive) return; this.pluck(dest, notes[Math.floor(Math.random() * notes.length)] + oct, { vel: vel * (0.6 + Math.random() * 0.4), timbre, decay }); timer = setTimeout(go, (min + Math.random() * (max - min)) * 1000); };
    timer = setTimeout(go, 800 + Math.random() * 2000);
    return { stop: () => { alive = false; clearTimeout(timer); } };
  }
  ticker(dest, { rate = 1, vel = 0.03, f = 3200 } = {}) {
    let alive = true, timer;
    const go = () => { if (!alive) return; this.click(dest, vel * (0.5 + Math.random() * 0.5), f * (0.8 + Math.random() * 0.4)); timer = setTimeout(go, (1 / rate) * 1000 * (0.9 + Math.random() * 0.2)); };
    go(); return { stop: () => { alive = false; clearTimeout(timer); } };
  }
  click(dest, vel, f) {
    const ctx = this.ctx, t = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = 6;
    const g = ctx.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(fl).connect(g).connect(dest); src.start(t, Math.random() * 3); src.stop(t + 0.05);
  }
  random(dest, fn, min, max) {
    let alive = true, timer; const go = () => { if (!alive) return; fn(); timer = setTimeout(go, (min + Math.random() * (max - min)) * 1000); };
    timer = setTimeout(go, min * 500); return { stop: () => { alive = false; clearTimeout(timer); } };
  }
  drip(dest) { this.pluck(dest, 88 + Math.floor(Math.random() * 8), { vel: 0.05, decay: 0.6, timbre: 'glass', send: 1.2 }); }
  chirp(dest) {
    const ctx = this.ctx, t = ctx.currentTime, n = 2 + Math.floor(Math.random() * 4), f = 2600 + Math.random() * 1800;
    for (let i = 0; i < n; i++) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; const s = t + i * 0.07; g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.012, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.05); o.connect(g).connect(dest); o.start(s); o.stop(s + 0.06); }
  }
  frog(dest) {
    const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), am = ctx.createOscillator(), ag = ctx.createGain();
    o.type = 'square'; o.frequency.value = 90 + Math.random() * 60; am.frequency.value = 28; ag.gain.value = 0.5; am.connect(ag).connect(g.gain);
    const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 500;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(fl).connect(g).connect(dest); const s = ctx.createGain(); s.gain.value = 0.5; g.connect(s).connect(this.reverb);
    o.start(t); am.start(t); o.stop(t + 0.4); am.stop(t + 0.4);
  }
  crackle(dest, vel = 0.04) { return this.random(dest, () => this.click(dest, vel * Math.random(), 1200 + Math.random() * 3000), 0.03, 0.25); }
  heartbeat(dest) {
    return this.random(dest, () => { for (const d of [0, 0.22]) { const ctx = this.ctx, t = ctx.currentTime + d, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(d ? 0.05 : 0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(g).connect(dest); o.start(t); o.stop(t + 0.3); } }, 1.5, 1.7);
  }

  // ── music beds ──
  bedRecipe(name, out) {
    const P = [];
    switch (name) {
      case 'title':
        P.push(this.pad(out, [38, 45, 50, 53], { cutoff: 520, gain: 0.05 }), this.noise(out, { type: 'bandpass', f: 420, q: 0.8, gain: 0.05, lfo: 0.06 }),
          this.sparse(out, SCALES.dmin, { min: 2.5, max: 6, vel: 0.07, oct: 12 })); break;
      case 'wexley':
        P.push(this.noise(out, { type: 'highpass', f: 900, gain: 0.07 }), this.noise(out, { type: 'lowpass', f: 400, gain: 0.08, lfo: 0.1, lfoDepth: 0.3 }),
          this.pad(out, [45, 48, 52, 55], { cutoff: 650, gain: 0.04 }), this.sparse(out, SCALES.amin, { min: 4, max: 9, vel: 0.06, timbre: 'piano' })); break;
      case 'memory':
        P.push(this.noise(out, { type: 'lowpass', f: 350, gain: 0.05 }), this.pad(out, [41, 45, 48, 52], { cutoff: 900, gain: 0.045, lfo: 0.15 }),
          this.sparse(out, SCALES.fmaj, { min: 1.6, max: 3.5, vel: 0.06 })); break;
      case 'descent':
        P.push(this.pad(out, [33, 40, 45], { type: 'sawtooth', cutoff: 260, gain: 0.05 }), this.noise(out, { type: 'lowpass', f: 140, gain: 0.25, lfo: 0.2 })); break;
      case 'stair':
        P.push(this.pad(out, [33, 40], { type: 'sawtooth', cutoff: 230, gain: 0.06, lfo: 0.05 }), this.heartbeat(out), this.random(out, () => this.drip(out), 1.5, 5),
          this.noise(out, { type: 'bandpass', f: 300, q: 1, gain: 0.03, lfo: 0.04 })); break;
      case 'vault':
        P.push(this.pad(out, [38, 45, 50], { type: 'sawtooth', cutoff: 300, gain: 0.05 }), this.pad(out, [62, 65, 69], { type: 'sawtooth', cutoff: 900, gain: 0.006, lfo: 0.1 }),
          this.crackle(out, 0.05), this.noise(out, { type: 'lowpass', f: 180, gain: 0.07, lfo: 0.3 })); break;
      case 'strand':
        P.push(this.noise(out, { type: 'lowpass', f: 700, gain: 0.12, lfo: 0.08, lfoDepth: 0.8 }), this.pad(out, [60, 64, 67, 71], { cutoff: 1200, gain: 0.02, type: 'sine' }),
          this.sparse(out, SCALES.glass, { min: 2.5, max: 6, vel: 0.05, timbre: 'glass', decay: 5 }), this.ticker(out, { rate: 1, vel: 0.02 }), this.ticker(out, { rate: 1.37, vel: 0.015, f: 4200 })); break;
      case 'strandDark':
        P.push(this.noise(out, { type: 'lowpass', f: 600, gain: 0.1, lfo: 0.08, lfoDepth: 0.8 }), this.pad(out, [36, 37, 43], { cutoff: 320, gain: 0.05 }),
          this.ticker(out, { rate: 0.7, vel: 0.025 }), this.sparse(out, [84, 85, 91], { min: 5, max: 10, vel: 0.04, timbre: 'glass', decay: 6 })); break;
      case 'fens':
        P.push(this.noise(out, { type: 'lowpass', f: 500, gain: 0.06, lfo: 0.15, lfoDepth: 0.5 }), this.pad(out, [41, 48, 52, 55, 57], { cutoff: 800, gain: 0.035 }),
          this.random(out, () => this.chirp(out), 0.6, 2.5), this.random(out, () => this.frog(out), 2, 6), this.sparse(out, SCALES.fmaj, { min: 4, max: 9, vel: 0.05 })); break;
      case 'fensLamp':
        P.push(this.noise(out, { type: 'lowpass', f: 500, gain: 0.06, lfo: 0.15, lfoDepth: 0.5 }), this.pad(out, [38, 45, 48, 53, 57], { cutoff: 700, gain: 0.035 }),
          this.random(out, () => this.chirp(out), 0.8, 3), this.random(out, () => this.frog(out), 3, 8)); break;
      case 'fensNight':
        P.push(this.noise(out, { type: 'lowpass', f: 380, gain: 0.06, lfo: 0.1 }), this.pad(out, [38, 39, 45], { cutoff: 300, gain: 0.05, type: 'sawtooth' }),
          this.random(out, () => this.chirp(out), 2, 6), this.noise(out, { type: 'bandpass', f: 260, q: 1.2, gain: 0.03, lfo: 0.05 })); break;
      case 'fensMorning':
        P.push(this.noise(out, { type: 'lowpass', f: 700, gain: 0.05, lfo: 0.12 }), this.pad(out, [46, 53, 57, 60, 62], { cutoff: 1100, gain: 0.03, type: 'sine' }),
          this.sparse(out, [70, 72, 74, 77, 79, 81], { min: 3, max: 7, vel: 0.045 }), this.crackle(out, 0.025)); break;
      case 'end':
        P.push(this.pad(out, [38, 45, 50, 53, 57], { cutoff: 700, gain: 0.04 }), this.sparse(out, SCALES.dmin, { min: 2, max: 5, vel: 0.06, oct: 12 })); break;
    }
    return P;
  }
  async setBed(name, fade = 3) {
    if (!this.ready || name === this.bedName) return;
    this.bedName = name;
    const ctx = this.ctx, now = ctx.currentTime;
    // fade out whatever is playing
    if (this.bed) { const b = this.bed; b.out.gain.setTargetAtTime(0, now, fade / 3); setTimeout(() => b.parts.forEach(p => p.stop(ctx.currentTime + 0.05)), fade * 1000 + 400); this.bed = null; }
    if (this.fileBed) { const a = this.fileBed; this.fadeEl(a, 0, fade).then(() => a.pause()); this.fileBed = null; }
    const file = await probe(`audio/music/${name}.mp3`);
    if (name !== this.bedName) return;
    if (file) {
      this.bedIx = 1 - this.bedIx; const el = this.bedEls[this.bedIx];
      el.src = file; el.loop = true; el.volume = 0; el.muted = this.muted; el.play().catch(() => {});
      this.fadeEl(el, 0.8, fade); this.fileBed = el; return;
    }
    const out = ctx.createGain(); out.gain.value = 0; out.connect(this.music);
    out.gain.setTargetAtTime(1, ctx.currentTime, fade / 3);
    this.bed = { out, parts: this.bedRecipe(name, out) };
  }
  fadeEl(a, to, sec) {
    return new Promise(res => { const from = a.volume, t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); a.volume = from + (to - from) * k; k < 1 ? requestAnimationFrame(step) : res(); }; step(); });
  }
  duck(on) { if (!this.ready) return; this.music.gain.setTargetAtTime(on ? 0.3 : 0.55, this.ctx.currentTime, 0.4); if (this.fileBed) this.fadeEl(this.fileBed, on ? 0.4 : 0.8, 0.6); }

  lullaby(kind = 'box', startAt = 0) {
    if (!this.ready) return;
    const beat = kind === 'hum' ? 0.62 : 0.5; let t = startAt;
    for (const [m, b] of LULLABY) {
      if (kind === 'hum') this.hum(this.music, m - 12, { when: t, dur: b * beat * 0.95, vel: 0.06 });
      else this.pluck(this.music, m + 12, { when: t, vel: 0.07, decay: 2.2 });
      t += b * beat;
    }
  }

  // ── sound effects ──
  async sfx(name) {
    if (!this.ready) return;
    const file = await probe(`audio/sfx/${name}.mp3`);
    if (file) { const el = new Audio(file); el.volume = 0.9; el.muted = this.muted; el.play().catch(() => {}); return; }
    const ctx = this.ctx, out = this.sfxBus, t = ctx.currentTime;
    const burst = (dur, { f = 800, type = 'lowpass', q = 0.7, vel = 0.3, attack = 0.005, sweep = null, rev = 0.4, when = 0 } = {}) => {
      const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t + when); fl.Q.value = q;
      if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, t + when + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + when); g.gain.exponentialRampToValueAtTime(vel, t + when + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + when + dur);
      s.connect(fl).connect(g).connect(out); const sg = ctx.createGain(); sg.gain.value = rev; g.connect(sg).connect(this.reverb);
      s.start(t + when, Math.random() * 2); s.stop(t + when + dur + 0.1);
    };
    const tone = (f, dur, { vel = 0.1, type = 'sine', when = 0, to = null, rev = 0.5 } = {}) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t + when); if (to) o.frequency.exponentialRampToValueAtTime(to, t + when + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + when); g.gain.exponentialRampToValueAtTime(vel, t + when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + when + dur);
      o.connect(g).connect(out); const sg = ctx.createGain(); sg.gain.value = rev; g.connect(sg).connect(this.reverb); o.start(t + when); o.stop(t + when + dur + 0.05);
    };
    switch (name) {
      case 'hover': tone(1800, 0.06, { vel: 0.015, rev: 0.2 }); break;
      case 'select': tone(mtof(74), 1.6, { vel: 0.06 }); tone(mtof(81), 1.8, { vel: 0.04, when: 0.06 }); tone(mtof(86), 2, { vel: 0.025, when: 0.12 }); break;
      case 'advance': burst(0.35, { f: 2400, type: 'bandpass', q: 0.6, vel: 0.025, attack: 0.08, sweep: 600, rev: 0.2 }); break;
      case 'thunder': burst(4.5, { f: 900, vel: 0.5, attack: 0.05, sweep: 60, rev: 0.8 }); burst(2.5, { f: 200, vel: 0.4, attack: 0.3, when: 0.4, rev: 0.6 }); break;
      case 'page': burst(0.25, { f: 3500, type: 'highpass', vel: 0.06, attack: 0.03 }); burst(0.3, { f: 2000, type: 'bandpass', vel: 0.05, attack: 0.05, when: 0.18 }); break;
      case 'steps': for (let i = 0; i < 4; i++) burst(0.18, { f: 260, vel: 0.22, attack: 0.004, when: i * 0.62, rev: 0.7 }); break;
      case 'ember': burst(1.6, { f: 300, vel: 0.35, attack: 0.25, sweep: 1500, rev: 0.6 }); for (let i = 0; i < 10; i++) burst(0.05, { f: 3000, type: 'bandpass', q: 3, vel: 0.05, when: 0.4 + Math.random() * 1.5 }); break;
      case 'collapse':
        burst(5, { f: 120, vel: 0.6, attack: 0.6, rev: 0.9 });
        for (let i = 0; i < 18; i++) burst(0.25, { f: 400 + Math.random() * 600, type: 'bandpass', q: 2, vel: 0.12, when: 0.3 + Math.random() * 3 });
        for (let i = 0; i < 3; i++) tone(90 + Math.random() * 60, 1.2, { type: 'sawtooth', vel: 0.03, when: Math.random() * 2, to: 50 });
        break;
      case 'waves': burst(5, { f: 300, vel: 0.2, attack: 2, sweep: 900, rev: 0.6 }); break;
      case 'clicks': for (let i = 0; i < 14; i++) this.click(out, 0.12, 1800 + Math.random() * 1500); for (let i = 0; i < 12; i++) setTimeout(() => this.click(out, 0.1, 2200), i * 90 + 300); break;
      case 'water': burst(1.2, { f: 900, type: 'bandpass', q: 1, vel: 0.06, attack: 0.3 }); break;
      case 'relight': burst(0.8, { f: 200, vel: 0.3, attack: 0.02, sweep: 1200, rev: 0.6 }); [79, 83, 86, 91].forEach((m, i) => tone(mtof(m), 2.5, { vel: 0.03, when: 0.15 + i * 0.07 })); break;
      case 'smash': burst(0.6, { f: 5000, type: 'highpass', vel: 0.35, attack: 0.002 }); [1180, 1730, 2410, 3120].forEach(f => tone(f, 1.4, { vel: 0.04 })); burst(0.3, { f: 300, vel: 0.3 }); break;
      case 'ink': for (let i = 0; i < 9; i++) burst(0.12, { f: 2800 + Math.random() * 1500, type: 'bandpass', q: 2, vel: 0.03, attack: 0.03, when: i * 0.14 + Math.random() * 0.05, rev: 0.1 }); break;
      case 'item': [74, 78, 81, 86].forEach((m, i) => tone(mtof(m), 2.5, { vel: 0.05, when: i * 0.09 })); break;
      case 'chapter': tone(55, 4, { vel: 0.2, to: 41 }); burst(3, { f: 200, vel: 0.12, attack: 1.8, sweep: 2000, rev: 1 }); break;
      case 'name': [88, 91, 95, 100].forEach((m, i) => tone(mtof(m), 3.5, { vel: 0.022, when: i * 0.25 })); break;
      case 'skiff': for (let i = 0; i < 4; i++) { burst(1.1, { f: 500, type: 'bandpass', q: 2, vel: 0.06, attack: 0.4, when: i * 2.2 }); tone(140, 0.6, { type: 'sawtooth', vel: 0.012, when: i * 2.2 + 0.5, to: 110 }); } break;
      case 'rise': burst(1.6, { f: 1200, type: 'highpass', vel: 0.12, attack: 0.1, rev: 0.4 }); break;
      case 'map': burst(0.6, { f: 1800, type: 'bandpass', vel: 0.05, attack: 0.1, rev: 0.3 }); break;
    }
  }

  // ── voice ──
  async voice(name) {
    const url = await probe(`audio/vo/${name}.mp3`);
    if (!url || !this.voEl) return null;
    this.stopVoice();
    const el = this.voEl; el.onended = el.onerror = null;
    el.src = url; el.muted = this.muted; el.volume = this.voVolume;
    const token = {}; this.vo = token;
    this.duck(true);
    const done = new Promise(res => { token.res = res; el.onended = res; el.onerror = res; });
    el.play().catch(() => token.res());
    done.then(() => { if (this.vo === token) { this.vo = null; this.duck(false); } });
    return { done };
  }
  hasVoice(name) { return probe(`audio/vo/${name}.mp3`); }
  stopVoice() { if (this.vo) { const v = this.vo; this.vo = null; this.voEl.pause(); v.res && v.res(); this.duck(false); } }
}
