// Tiny WebAudio synth — no files, just oscillators + noise + envelopes.
// Each fn returns nothing; we fire-and-forget tiny sounds for game feel.

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  // Some browsers start the context suspended — try to resume on first use.
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

let _master: GainNode | null = null;
function master(): GainNode {
  if (!_master) {
    const c = ctx();
    _master = c.createGain();
    _master.gain.value = 0.6;
    _master.connect(c.destination);
  }
  return _master;
}

export function setMuted(muted: boolean) {
  master().gain.linearRampToValueAtTime(muted ? 0 : 0.6, ctx().currentTime + 0.05);
}

// ---- Building blocks ----------------------------------------------------

function envelope(node: GainNode, t0: number, attack: number, decay: number, peak = 1) {
  node.gain.setValueAtTime(0, t0);
  node.gain.linearRampToValueAtTime(peak, t0 + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

function noiseBuffer(seconds: number): AudioBuffer {
  const c = ctx();
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// ---- Specific sounds ----------------------------------------------------

/** Short bright "tick" — when you pick something up. */
export function sfxPickup() {
  const c = ctx();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(880, t);
  o.frequency.exponentialRampToValueAtTime(1320, t + 0.06);
  envelope(g, t, 0.005, 0.08, 0.35);
  o.connect(g).connect(master());
  o.start(t);
  o.stop(t + 0.12);
}

/** Soft thud — item lands on table. */
export function sfxThud(strength = 1) {
  const c = ctx();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
  envelope(g, t, 0.004, 0.16, Math.min(0.9, 0.35 + strength * 0.4));
  o.connect(g).connect(master());
  o.start(t);
  o.stop(t + 0.2);
}

/** Glassy clink — solid into the jar. */
export function sfxDropInJar() {
  const c = ctx();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(620, t);
  o.frequency.exponentialRampToValueAtTime(740, t + 0.04);
  envelope(g, t, 0.002, 0.18, 0.4);
  const o2 = c.createOscillator();
  const g2 = c.createGain();
  o2.type = "sine";
  o2.frequency.setValueAtTime(1240, t);
  envelope(g2, t, 0.002, 0.1, 0.18);
  o.connect(g).connect(master());
  o2.connect(g2).connect(master());
  o.start(t); o2.start(t);
  o.stop(t + 0.25); o2.stop(t + 0.15);
}

/** Continuous water "trickle" — used while pouring. Returns a stop fn. */
export function sfxStartPour(): () => void {
  const c = ctx();
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(2);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 700;
  filter.Q.value = 1.4;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.18, t + 0.1);
  src.connect(filter).connect(g).connect(master());
  src.start(t);
  return () => {
    const tt = ctx().currentTime;
    g.gain.cancelScheduledValues(tt);
    g.gain.setValueAtTime(g.gain.value, tt);
    g.gain.linearRampToValueAtTime(0, tt + 0.08);
    src.stop(tt + 0.12);
  };
}

/** Single bubble pop — fire occasionally while reactions bubble. */
export function sfxBubble() {
  const c = ctx();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  const start = 400 + Math.random() * 300;
  o.frequency.setValueAtTime(start, t);
  o.frequency.exponentialRampToValueAtTime(start * 1.6, t + 0.07);
  envelope(g, t, 0.001, 0.08, 0.18);
  o.connect(g).connect(master());
  o.start(t); o.stop(t + 0.1);
}

/** Burner ignition + sustained gas hiss. Returns stop fn. */
export function sfxStartBurner(): () => void {
  const c = ctx();
  const t = c.currentTime;
  // Ignition click
  const click = c.createOscillator();
  const cg = c.createGain();
  click.type = "square";
  click.frequency.setValueAtTime(1200, t);
  click.frequency.exponentialRampToValueAtTime(180, t + 0.05);
  envelope(cg, t, 0.001, 0.06, 0.35);
  click.connect(cg).connect(master());
  click.start(t); click.stop(t + 0.1);

  // Sustained hiss
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(3);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1500;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.08, t + 0.25);
  src.connect(filter).connect(g).connect(master());
  src.start(t + 0.06);
  return () => {
    const tt = ctx().currentTime;
    g.gain.cancelScheduledValues(tt);
    g.gain.setValueAtTime(g.gain.value, tt);
    g.gain.linearRampToValueAtTime(0, tt + 0.18);
    src.stop(tt + 0.25);
  };
}

/** Big explosion — low boom + bright crack + long noise tail. */
export function sfxBoom() {
  const c = ctx();
  const t = c.currentTime;
  // Low boom (sub)
  const sub = c.createOscillator();
  const subG = c.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(80, t);
  sub.frequency.exponentialRampToValueAtTime(30, t + 0.6);
  envelope(subG, t, 0.005, 0.7, 0.9);
  sub.connect(subG).connect(master());
  sub.start(t); sub.stop(t + 0.9);

  // Crack (fast noise burst with hi pass)
  const crack = c.createBufferSource();
  crack.buffer = noiseBuffer(0.4);
  const crackFilter = c.createBiquadFilter();
  crackFilter.type = "highpass";
  crackFilter.frequency.value = 1200;
  const crackG = c.createGain();
  envelope(crackG, t, 0.002, 0.18, 0.6);
  crack.connect(crackFilter).connect(crackG).connect(master());
  crack.start(t); crack.stop(t + 0.3);

  // Rumble tail (low filtered noise)
  const rumble = c.createBufferSource();
  rumble.buffer = noiseBuffer(1.4);
  const rumbleFilter = c.createBiquadFilter();
  rumbleFilter.type = "lowpass";
  rumbleFilter.frequency.value = 350;
  const rumbleG = c.createGain();
  envelope(rumbleG, t, 0.05, 1.4, 0.45);
  rumble.connect(rumbleFilter).connect(rumbleG).connect(master());
  rumble.start(t + 0.04); rumble.stop(t + 1.6);
}

/** Glass shatter — used together with boom on jar explosion. */
export function sfxShatter() {
  const c = ctx();
  const t = c.currentTime;
  for (let i = 0; i < 6; i++) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    const f = 1200 + Math.random() * 1800;
    o.frequency.setValueAtTime(f, t + i * 0.012);
    o.frequency.exponentialRampToValueAtTime(f * 0.5, t + i * 0.012 + 0.18);
    envelope(g, t + i * 0.012, 0.001, 0.18, 0.18);
    o.connect(g).connect(master());
    o.start(t + i * 0.012); o.stop(t + i * 0.012 + 0.25);
  }
}
