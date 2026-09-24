// Tiny Web Audio synth: chiptune sound effects + a gentle generative music loop.
// Browsers only allow audio after a click or key press, so initAudio() is called from those.
let ctx = null, master, sfxBus, musicBus, noiseBuf, muted = false;

export function initAudio() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.22; musicBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  applyVolume();
  if (pendingMusic !== null) playMusic(pendingMusic);
}
export const audioReady = () => !!ctx && ctx.state === "running";
export const vol = { music: 0.6, sfx: 0.8 };
export function applyVolume() {
  if (!ctx) return;
  sfxBus.gain.value = 0.7 * vol.sfx;
  musicBus.gain.value = 0.35 * vol.music;
}
export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.7;
  return muted;
}

function tone(freq, dur, o = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + (o.delay || 0);
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || "square";
  osc.frequency.setValueAtTime(freq, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + o.slide), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.vol ?? 0.2, t + (o.attack || 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(o.bus || sfxBus);
  osc.start(t); osc.stop(t + dur + 0.02);
}
function noise(dur, o = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + (o.delay || 0);
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf;
  f.type = o.filter || "lowpass"; f.frequency.setValueAtTime(o.freq || 1200, t);
  if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + dur);
  g.gain.setValueAtTime(o.vol ?? 0.2, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
}
const arp = (notes, step, o) => notes.forEach((n, i) => tone(n, step * 1.6, { ...o, delay: i * step }));

let lastPlayed = {};
export function sfx(name) {
  if (!ctx || muted) return;
  const now = ctx.currentTime; // de-dupe spammy sounds
  if (lastPlayed[name] && now - lastPlayed[name] < 0.05) return;
  lastPlayed[name] = now;
  const S = SFX[name];
  if (S) S();
}
const SFX = {
  jump: () => tone(330, 0.14, { slide: 330, vol: 0.12 }),
  double: () => tone(520, 0.14, { slide: 420, vol: 0.1, type: "triangle" }),
  bounce: () => tone(200, 0.3, { slide: 700, vol: 0.18, type: "triangle" }),
  swipe: () => noise(0.09, { filter: "highpass", freq: 2500, vol: 0.25 }),
  slam: () => { noise(0.35, { freq: 600, sweep: 80, vol: 0.5 }); tone(110, 0.3, { slide: -70, vol: 0.3, type: "triangle" }); },
  dash: () => { noise(0.2, { filter: "bandpass", freq: 900, sweep: 3000, vol: 0.25 }); tone(300, 0.15, { slide: 500, vol: 0.06 }); },
  splash: () => noise(0.4, { freq: 1800, sweep: 300, vol: 0.3 }),
  hurt: () => tone(400, 0.3, { slide: -300, vol: 0.15 }),
  pop: () => { tone(700, 0.08, { slide: -400, vol: 0.15 }); noise(0.08, { filter: "highpass", freq: 1500, vol: 0.12 }); },
  plate: () => tone(520, 0.07, { vol: 0.1, type: "triangle" }),
  lever: () => { tone(300, 0.06, { vol: 0.12 }); tone(450, 0.08, { vol: 0.12, delay: 0.06 }); },
  tick: () => tone(1100, 0.03, { vol: 0.06, type: "triangle" }),
  gate: () => noise(0.5, { freq: 300, vol: 0.25 }),
  bridge: () => arp([262, 330, 392], 0.07, { type: "triangle", vol: 0.12 }),
  sync: () => arp([523, 659, 784, 1047], 0.08, { type: "triangle", vol: 0.14 }),
  fail: () => { tone(300, 0.15, { vol: 0.1 }); tone(240, 0.2, { vol: 0.1, delay: 0.14 }); },
  thud: () => { noise(0.3, { freq: 400, sweep: 60, vol: 0.45 }); tone(80, 0.25, { slide: -30, vol: 0.3, type: "triangle" }); },
  crumble: () => noise(0.25, { freq: 900, sweep: 200, vol: 0.18 }),
  dig: () => noise(0.12, { filter: "bandpass", freq: 700, vol: 0.2 }),
  crack: () => { noise(0.4, { filter: "highpass", freq: 800, vol: 0.35 }); noise(0.3, { freq: 300, vol: 0.3, delay: 0.05 }); },
  pickup: () => arp([660, 880], 0.06, { type: "square", vol: 0.08 }),
  friend: () => arp([523, 659, 784, 659, 1047], 0.1, { type: "triangle", vol: 0.14 }),
  woof: () => { tone(260, 0.09, { slide: -80, vol: 0.18, type: "sawtooth" }); tone(240, 0.12, { slide: -90, vol: 0.16, type: "sawtooth", delay: 0.13 }); },
  arf: () => tone(520, 0.08, { slide: -150, vol: 0.14, type: "sawtooth" }),
  pet: () => arp([784, 988, 1175], 0.06, { type: "sine", vol: 0.1 }),
  heart: () => tone(880, 0.12, { slide: 200, vol: 0.07, type: "sine" }),
  crunch: () => { noise(0.07, { filter: "bandpass", freq: 1500, vol: 0.3 }); noise(0.07, { filter: "bandpass", freq: 1200, vol: 0.3, delay: 0.12 }); noise(0.07, { filter: "bandpass", freq: 1400, vol: 0.3, delay: 0.24 }); },
  whimper: () => tone(900, 0.35, { slide: -300, vol: 0.06, type: "sine" }),
  win: () => arp([523, 659, 784, 1047, 784, 1047, 1319], 0.12, { type: "triangle", vol: 0.16 }),
  select: () => tone(660, 0.05, { vol: 0.08, type: "triangle" }),
};

// ---------- Music: a soft looping chiptune per chapter ----------
const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SONGS = [
  { bpm: 96, root: 60, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], scale: [0, 2, 4, 7, 9], lead: "triangle" },   // sunny creek
  { bpm: 88, root: 57, chords: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [7, 10, 14]], scale: [0, 3, 5, 7, 10], lead: "triangle" }, // mossy
  { bpm: 104, root: 62, chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], scale: [0, 2, 4, 7, 9], lead: "square" },  // windy
  { bpm: 84, root: 55, chords: [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 11, 14]], scale: [0, 3, 5, 7, 10], lead: "triangle" }, // storm
];
let pendingMusic = null, timer = null;
export function playMusic(i) {
  pendingMusic = i;
  if (!ctx) return;
  if (timer) clearInterval(timer);
  const song = SONGS[i % SONGS.length];
  const step = 60 / song.bpm / 2; // eighth notes
  let next = ctx.currentTime + 0.1, n = 0, seed = 7 + i * 13;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // a fixed 4-bar melody per song so it feels like a tune, not noise
  const melody = Array.from({ length: 32 }, (_, k) => (k % 4 === 3 && rnd() < 0.5 ? null : song.scale[Math.floor(rnd() * song.scale.length)] + (rnd() < 0.3 ? 12 : 0)));
  timer = setInterval(() => {
    while (next < ctx.currentTime + 0.25) {
      const bar = Math.floor(n / 8) % 4, beat = n % 8, ch = song.chords[bar];
      const o = { bus: musicBus, delay: next - ctx.currentTime };
      if (beat % 4 === 0) tone(N(song.root - 24 + ch[0]), step * 3.5, { ...o, type: "triangle", vol: 0.5 });
      tone(N(song.root - 12 + ch[beat % 3]), step * 0.9, { ...o, type: "square", vol: 0.07 });
      const m = melody[n % 32];
      if (m !== null && beat % 2 === 0) tone(N(song.root + m), step * 1.8, { ...o, type: song.lead, vol: song.lead === "square" ? 0.08 : 0.18, attack: 0.02 });
      if (beat % 2 === 1) noise(0.04, { ...o, filter: "highpass", freq: 6000, vol: 0.08 });
      next += step; n++;
    }
  }, 50);
}
