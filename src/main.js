import {
  Emerald, Scene, SceneManager, Color, GameObject, Texture, Vector2, Vector3, InputManager,
} from "emeraldengine";
import * as ART from "./art.js";
import { LEVELS, T } from "./level.js";
import { initAudio, sfx, playMusic, toggleMute, vol, applyVolume } from "./audio.js";

// ---------- Chapter selection (#c=2&go skips the title) ----------
const hp = new URLSearchParams(location.hash.slice(1));
const chapter = Math.min(LEVELS.length - 1, Math.max(0, (parseInt(hp.get("c")) || 1) - 1));
let unlocked = 1;
try { unlocked = Math.max(1, +localStorage.getItem("creekside.unlocked") || 1); } catch {}
const L = LEVELS[chapter]();
const TH = L.theme;

// ---------- Engine setup ----------
const canvasEl = document.getElementById("game");
const emerald = new Emerald(canvasEl, { antialias: false });
const scene = new Scene();
SceneManager.setScene(scene);
emerald.setBackgroundColor(new Color(...TH.bg));
if (TH.rain) document.body.classList.add("rain");

let Z = 3, viewW = 400, viewH = 240;
function fit() {
  Z = Math.max(2, Math.floor(window.innerHeight / (13 * T)));
  viewW = window.innerWidth / Z;
  viewH = window.innerHeight / Z;
  emerald.resize?.(window.innerWidth, window.innerHeight);
  emerald.camera.setZoom(Z);
}
window.addEventListener("resize", fit);

// Sprite helper: art-space (y down) → engine world (y up); 1 unit = 1 art pixel.
function sprite(art, z) {
  const go = new GameObject("s", new Vector3(0, 0, z), 0, new Vector2(art.w / 2, art.h / 2));
  const tex = new Texture(art.url, art.w, art.h, art.n, art.n, 1000, false, true, false);
  go.addComponent(tex);
  scene.add(go);
  const s = {
    go, tex, art,
    place(cx, cy) { go.transform.position.x = Math.round(cx); go.transform.position.y = -Math.round(cy); },
    frame(i) { if (s._f !== i) { s._f = i; tex.setFrame(i); } },
    flip(b) { tex.setFlipX(b); },
    hide() { go.transform.position.x = -1e5; },
  };
  return s;
}

// ---------- Level ----------
const LW = L.W * T, LH = L.H * T;
const baked = ART.bakeLevel(L);
const sky = sprite(ART.skyLayer(TH.sky), -60);
const far = sprite(ART.hillsLayer(3400, 220, 1, TH.far, 60, 110, false), -50);
const mid = sprite(ART.hillsLayer(3400, 200, 2, TH.mid, 40, 80, true), -40);
sprite({ url: baked.terrain, w: baked.w, h: baked.h, n: 1 }, -10).place(LW / 2, LH / 2);
sprite({ url: baked.water, w: baked.w, h: baked.h, n: 1 }, 5).place(LW / 2, LH / 2);

// Mechanic tiles are individual sprites so they can break / crumble / be dug.
const TILE_ART = { D: ART.DIRT, C: ART.CRUMBLE, M: ART.MUSHROOM, B: ART.BRAMBLE, X: ART.CRACKED, O: ART.OTTER_WALL, P: ART.PANDA_WALL, r: ART.TOGGLE_A, u: ART.TOGGLE_B };
const special = new Map();
for (let ty = 0; ty < L.H; ty++)
  for (let tx = 0; tx < L.W; tx++) {
    const ch = L.grid[ty][tx];
    if (!TILE_ART[ch]) continue;
    const s = sprite(TILE_ART[ch], -9);
    s.place(tx * T + 8, ty * T + 8);
    special.set(`${tx},${ty}`, { ch, tx, ty, s, t: 0, broken: false, back: 0, solid: ch !== "u" });
    if (ch === "u") s.tex.setColor(new Color(255, 255, 255, 60));
  }

const tileAt = (tx, ty) => (tx < 0 || tx >= L.W ? "#" : ty < 0 || ty >= L.H ? "." : L.grid[ty][tx]);
// b (optional) = the body asking: colour walls only block the other animal
const solidTile = (tx, ty, b) => {
  const c = tileAt(tx, ty);
  if (c === "C") return !special.get(`${tx},${ty}`).broken;
  if (c === "r" || c === "u") return special.get(`${tx},${ty}`).solid;
  if (c === "O") return !b || b.kind !== "otter";
  if (c === "P") return !b || b.kind !== "fox";
  return c === "#" || c === "S" || c === "D" || c === "M" || c === "B" || c === "X";
};
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const groundY = (tx) => { let y = 0; while (y < L.H && !solidTile(tx, y)) y++; return y * T; };

const TILE_COLORS = { D: [176, 122, 74], B: [120, 60, 100], X: [150, 150, 160], C: [199, 176, 138] };
// Brambles and soft dirt clear their whole connected column at once.
function destroyTile(tx, ty) {
  const sp = special.get(`${tx},${ty}`);
  if (!sp || L.grid[ty][tx] === ".") return;
  const ch = L.grid[ty][tx];
  L.grid[ty][tx] = ".";
  sp.s.hide();
  burst(tx * T + 8, ty * T + 8, 8, TILE_COLORS[sp.ch] || [200, 200, 200], 50);
  if (ch === "B" || ch === "D") for (const dy of [-1, 1]) if (tileAt(tx, ty + dy) === ch) destroyTile(tx, ty + dy);
}

L.plates.forEach((p) => (p.s = sprite(ART.PLATE, -5)));
const BTN_ART = { timer: ART.button("#e24a4a"), sync: ART.button("#4aa3e2") };
L.levers.forEach((l) => (l.s = sprite(l.kind === "lever" ? ART.LEVER : l.sync ? BTN_ART.sync : BTN_ART.timer, -5)));
L.gates.forEach((g) => (g.s = sprite(ART.gate(g.h), -12)));
L.flaps.forEach((f) => sprite(ART.FLAP, -5).place(f.x + 8, f.y + 8));
L.bridges.forEach((b) => (b.s = sprite(ART.wood(b.w, b.h, 3), -4)));
L.movers.forEach((m) => (m.s = sprite(ART.wood(m.w, m.h, 9), -4)));
L.blocks.forEach((b) => {
  b.vy = 0; b.pushers = {}; b.lastDx = b.lastDy = 0;
  b.s = sprite(b.art === "boulder" ? ART.boulder(b.w) : ART.crate(b.w, b.h, b.art === "heavy"), -3);
});
L.npcs.forEach((n) => {
  n.s = sprite(ART[n.art], -2);
  n.x = n.tx * T + 8; n.y = (n.ty + 1) * T;
  n.zone = { x: n.x - 24, y: n.y - 30, w: 48, h: 34 };
});
L.items.forEach((it) => {
  const a = ART[it.art];
  it.s = sprite(a, 4);
  it.w = a.w; it.h = a.h;
  it.hx = it.x = it.tx * T + (T - a.w) / 2;
  it.hy = it.y = (it.ty + 1) * T - a.h;
  it.carrier = null; it.done = false;
});
const enemies = L.enemies.map((e) => ({ x: e.tx * T + 2, y: (e.ty + 1) * T - 7, w: 12, h: 7, vy: 0, dir: -1, alive: true, anim: 0, s: sprite(ART.BEETLE, 1) }));
const flags = L.checkpoints.slice(1).map((c) => { const f = sprite(ART.FLAG, -6); f.place(c.tx * T + 4, groundY(c.tx) - 6); return f; });
const denS = sprite(ART.den(), -6);
denS.place(L.exit.x + L.exit.w / 2, L.exit.y + L.exit.h - 20);

// ---------- Input ----------
const input = new InputManager();
const MENU_KEYS = {
  mUp: ["ArrowUp", "w", "KeyW", "dpadUp"], mDown: ["ArrowDown", "s", "KeyS", "dpadDown"],
  mLeft: ["ArrowLeft", "a", "KeyA", "dpadLeft"], mRight: ["ArrowRight", "d", "KeyD", "dpadRight"],
  mOk: ["Enter", " ", "Space", "south"], mBack: ["east"],
};
const KEYS = {
  otter: { // keyboard layout "A" (WASD) + controller 1
    left: ["a", "KeyA", "dpadLeft"], right: ["d", "KeyD", "dpadRight"], up: ["w", "KeyW", "dpadUp"], down: ["s", "KeyS", "dpadDown"],
    jump: [" ", "Space", "south"], use: ["f", "KeyF", "west"], attack: ["c", "KeyC", "east"], special: ["g", "KeyG", "r2", "l2"],
    call: ["e", "KeyE", "north"], love: ["q", "KeyQ", "r1", "l1"], reset: ["r", "KeyR", "share"], start: ["Enter", "south", "options"], pause: ["options"],
    ...MENU_KEYS,
  },
  fox: {
    left: ["ArrowLeft", "dpadLeft"], right: ["ArrowRight", "dpadRight"], up: ["dpadUp"], down: ["ArrowDown", "dpadDown"],
    jump: ["ArrowUp", "south"], use: [".", "Period", "west"], attack: ["l", "KeyL", "east"], special: ["k", "KeyK", "r2", "l2"],
    call: [",", "Comma", "north"], love: ["/", "Slash", "r1", "l1"], reset: ["share"], start: ["south", "options"], pause: ["options"],
    ...MENU_KEYS,
  },
};
const PAD_NAMES = new Set(["dpadLeft", "dpadRight", "dpadUp", "dpadDown", "south", "west", "east", "north", "r1", "l1", "r2", "l2", "share", "options"]);
// Controllers are assigned in connection order, so a pad that Chrome reports as
// index 1/2/3 (e.g. after a reconnect) still becomes player 1 or 2.
// swapPlayers (chosen on the "who's who" screen) trades controllers AND keyboard layouts.
const padFor = { otter: 0, fox: 1 };
let padKey = null, swapPlayers = false;
try { swapPlayers = localStorage.getItem("creekside.swap") === "1"; } catch {}
function bindPads(force) {
  const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean).map((g) => g.index).sort((a, b) => a - b);
  const key = pads.join(",") + (swapPlayers ? "s" : "");
  if (key === padKey && !force) return;
  padKey = key;
  const p1 = pads[0] ?? 0, p2 = pads[1] ?? (pads[0] === 1 ? 0 : 1);
  padFor.otter = swapPlayers ? p2 : p1; padFor.fox = swapPlayers ? p1 : p2;
  for (const who of ["otter", "fox"]) {
    const layout = KEYS[swapPlayers ? (who === "otter" ? "fox" : "otter") : who];
    for (const [act, list] of Object.entries(layout)) {
      const pads = list.filter((t) => PAD_NAMES.has(t)).map((t) => `pad:${padFor[who]}:${t}`);
      const keys = list.filter((t) => !PAD_NAMES.has(t));
      input.mapAction(`${who}.${act}`, [...keys, ...pads]);
    }
  }
}
function setSwap(v) {
  swapPlayers = v;
  try { localStorage.setItem("creekside.swap", v ? "1" : "0"); } catch {}
  bindPads(true);
}
bindPads();
window.addEventListener("gamepadconnected", bindPads);
window.addEventListener("gamepaddisconnected", bindPads);
let edgeOff = false;
const pressed = (who, a) => !edgeOff && input.justPressed(`${who}.${a}`);
const held = (who, a) => input.isDown(`${who}.${a}`);
function stick(who) {
  const pad = padFor[who];
  let x = (held(who, "right") ? 1 : 0) - (held(who, "left") ? 1 : 0);
  let y = (held(who, "down") ? 1 : 0) - (held(who, "up") ? 1 : 0);
  if (input.isGamepadConnected?.(pad)) {
    const s = input.getGamepadStick("left", pad);
    if (Math.abs(s.x) > Math.abs(x)) x = s.x;
    if (Math.abs(s.y) > Math.abs(y)) y = s.y;
  }
  return { x, y };
}

// ---------- Settings (saved in the browser) ----------
const settings = { music: 0.6, sfx: 0.8, shake: true, hints: true, bubbles: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem("creekside.settings") || "{}")); } catch {}
const saveSettings = () => { try { localStorage.setItem("creekside.settings", JSON.stringify(settings)); } catch {} };
function syncAudio() { vol.music = settings.music; vol.sfx = settings.sfx; applyVolume(); }
syncAudio();

// ---------- Audio (needs a click or key press to start) ----------
const unlockAudio = () => { initAudio(); syncAudio(); };
window.addEventListener("keydown", (e) => {
  unlockAudio();
  if (e.key === "m" || e.key === "M") toast(toggleMute() ? "🔇 Sound off (M)" : "🔊 Sound on (M)", 1.5);
});
window.addEventListener("pointerdown", unlockAudio);
playMusic(chapter);

// ---------- HUD (DOM overlay) ----------
const $ = (id) => document.getElementById(id);
const hintEl = $("hint"), toastEl = $("toast"), bubbleEl = $("bubble"), nBubbleEl = $("nbubble"), hudEl = $("hud"), timerEl = $("timer");
let toastT = 0, bubbleT = 0;
function toast(msg, t = 2.5) { toastEl.textContent = msg; toastEl.classList.add("show"); toastT = t; }
function bubble(msg) { if (!settings.bubbles) return; bubbleEl.textContent = msg; bubbleEl.classList.add("show"); bubbleT = 1.6; }
let nBubbleT = 0, nBubbleNpc = null;
function npcBubble(n, msg) { if (!settings.bubbles) return; nBubbleEl.textContent = msg; nBubbleEl.classList.add("show"); nBubbleT = 1.6; nBubbleNpc = n; }
const NAME = { otter: "otter", fox: "red panda" };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- Particles, hearts ----------
const parts = Array.from({ length: 120 }, () => ({ s: sprite(ART.PIXEL, 6), life: 0 }));
function burst(x, y, n, rgb, spread = 60, g = 200) {
  for (let i = 0, k = 0; i < parts.length && k < n; i++) {
    const p = parts[i];
    if (p.life > 0) continue;
    Object.assign(p, { x, y, vx: (Math.random() - 0.5) * spread * 2, vy: -Math.random() * spread, life: 0.5 + Math.random() * 0.5, g });
    p.s.tex.setColor(new Color(...rgb));
    k++;
  }
}
const hearts = Array.from({ length: 16 }, () => ({ s: sprite(ART.HEART, 7), life: 0 }));
function heart(x, y) {
  const h = hearts.find((h) => h.life <= 0);
  if (h) Object.assign(h, { x, y, vx: (Math.random() - 0.5) * 20, life: 1.4 });
}
let shakeT = 0;

// ---------- Ambient eye candy ----------
const ambient = [];
function pool(art, n, z, init) { for (let i = 0; i < n; i++) ambient.push({ s: sprite(art, z), life: 0, kind: init }); }
if (TH.leaves) pool(ART.LEAF, 18, 6, "leaf");
if (TH.butterflies) pool(ART.BUTTERFLY, 6, 2, "butterfly");
if (TH.fireflies) pool(ART.PIXEL, 26, 6, "firefly");
if (TH.birds) pool(ART.BIRD, 4, -45, "bird");
if (TH.stars) pool(ART.PIXEL, 40, -58, "star");
pool(ART.PIXEL, 14, 6, "sparkle");
const clouds = TH.rain ? [] : [0, 1, 2, 3, 4].map((i) => ({ s: sprite(ART.cloud(i + 3), -55), x: Math.random() * LW, y: 20 + Math.random() * 90, v: 3 + Math.random() * 5 }));
const waterTops = [];
for (let ty = 1; ty < L.H; ty++) for (let tx = 0; tx < L.W; tx++) if (L.grid[ty][tx] === "W" && L.grid[ty - 1][tx] !== "W") waterTops.push([tx, ty]);
const tint = (s, rgb) => s.tex.setColor(new Color(...rgb));
let flashT = 0;
function spawnAmbient(a) {
  const left = camX - viewW / 2, top = camY - viewH / 2;
  a.t = 0; a.ph = Math.random() * 6.28;
  if (a.kind === "leaf") {
    Object.assign(a, { x: left + Math.random() * viewW * 1.2, y: top - 10, vx: -(10 + Math.random() * 15) * (TH.wind ? 3 : 1), vy: 12 + Math.random() * 10, life: 12 });
    const base = TH.leaves.match(/\w\w/g).map((h) => parseInt(h, 16));
    tint(a.s, base.map((c) => Math.min(255, c + Math.floor((Math.random() - 0.5) * 60))));
  } else if (a.kind === "butterfly") {
    Object.assign(a, { x: left + Math.random() * viewW, y: top + viewH * (0.3 + Math.random() * 0.4), vx: (Math.random() - 0.5) * 30, vy: 0, life: 10 });
    tint(a.s, [[255, 170, 200], [255, 230, 110], [170, 210, 255], [255, 255, 255]][Math.floor(Math.random() * 4)]);
  } else if (a.kind === "firefly") {
    Object.assign(a, { x: left + Math.random() * viewW, y: top + viewH * (0.35 + Math.random() * 0.6), vx: 0, vy: 0, life: 5 + Math.random() * 5 });
    tint(a.s, [255, 240, 140]);
  } else if (a.kind === "bird") {
    const dir = Math.random() < 0.5 ? 1 : -1;
    Object.assign(a, { x: dir > 0 ? left - 20 : left + viewW + 20, y: top + 15 + Math.random() * 50, vx: dir * (35 + Math.random() * 20), vy: 0, life: 14 });
    a.s.flip(dir < 0);
  } else if (a.kind === "star") {
    Object.assign(a, { ox: Math.random() * viewW, oy: Math.random() * viewH * 0.55, life: 1e9 });
    tint(a.s, [255, 250, 220]);
  } else if (a.kind === "sparkle") {
    const vis = waterTops.filter(([tx]) => tx * T > left && tx * T < left + viewW);
    if (!vis.length) { a.life = 0.5; a.x = -1e5; return; }
    const [tx, ty] = vis[Math.floor(Math.random() * vis.length)];
    Object.assign(a, { x: tx * T + Math.random() * T, y: ty * T + 1 + Math.random() * 3, vx: 0, vy: 0, life: 0.4 + Math.random() * 0.5 });
    tint(a.s, [255, 255, 255]);
  }
}
function updateAmbient(dt) {
  ambient.forEach((a) => {
    a.life -= dt; a.t = (a.t || 0) + dt;
    if (a.life <= 0) {
      if (a.kind === "bird" && Math.random() > dt * 0.25) { a.s.hide(); return; }
      if (a.kind === "sparkle" && Math.random() > dt * 3) { a.s.hide(); return; }
      spawnAmbient(a);
    }
    if (a.kind === "leaf") { a.x += (a.vx + Math.sin(a.t * 2 + a.ph) * 12) * dt; a.y += a.vy * dt; a.s.frame(Math.floor(a.t * 3 + a.ph) % 2); }
    else if (a.kind === "butterfly") { a.x += (a.vx + Math.sin(a.t * 1.3 + a.ph) * 18) * dt; a.y += Math.sin(a.t * 2.1 + a.ph) * 14 * dt; a.s.frame(Math.floor(a.t * 8) % 2); a.s.flip(a.vx < 0); }
    else if (a.kind === "firefly") {
      a.x += Math.sin(a.t * 0.7 + a.ph) * 8 * dt; a.y += Math.cos(a.t * 0.9 + a.ph) * 6 * dt;
      const glow = 0.5 + 0.5 * Math.sin(a.t * 3 + a.ph);
      a.s.tex.setColor(new Color(255, 240, 140, Math.round(60 + 195 * glow)));
    } else if (a.kind === "bird") { a.x += a.vx * dt; a.y += Math.sin(a.t * 2) * 4 * dt; a.s.frame(Math.floor(a.t * 5) % 2); }
    else if (a.kind === "star") {
      a.x = camX - viewW / 2 + a.ox; a.y = camY - viewH / 2 + a.oy;
      a.s.tex.setColor(new Color(255, 250, 220, Math.round(140 + 115 * Math.sin(a.t * 1.5 + a.ph))));
    } else if (a.kind === "sparkle") a.s.tex.setColor(new Color(255, 255, 255, Math.round(255 * Math.min(1, a.life * 3))));
    a.s.place(a.x, a.y);
  });
  clouds.forEach((c) => {
    c.x += c.v * dt;
    if (c.x > LW + 100) c.x = -100;
    const span = viewW + 160, rel = (((c.x - camX * 0.15) % span) + span) % span;
    c.s.place(camX - viewW / 2 - 80 + rel, camY - viewH / 2 + c.y * 0.6 + 10);
  });
  if (TH.lightning) {
    if (flashT <= 0 && Math.random() < dt * 0.05) { flashT = 0.35; setTimeout(() => sfx("thud"), 400); }
    if (flashT > 0) flashT -= dt;
    document.body.classList.toggle("flash", flashT > 0.2 || (flashT > 0 && flashT < 0.1));
  }
}

// ---------- Characters ----------
function makeChar(kind, art, w, h, pad, z) {
  return { kind, art, s: sprite(art, z), w, h, pad, x: 0, y: 0, vx: 0, vy: 0, onGround: false, ground: null,
    facing: 1, air: 0, inWater: false, anim: 0, dead: 0, lastDx: 0, lastDy: 0, isChar: true,
    atk: 0, atkCd: 0, dash: 0, dashCd: 0, canDash: true, slam: false, swipe: sprite(ART.SWIPE, 6) };
}
const otter = makeChar("otter", ART.OTTER, 14, 11, 0, 3);
otter.pebble = sprite(ART.PEBBLE, 4); otter.idle = 0; // otters keep a favourite pebble and juggle it
let pebbleHolder = null; // set after both animals exist
let pawsT = 0;
const fox = makeChar("fox", ART.FOX, 12, 13, 1, 2);
const bear = makeChar("bear", ART.BEAR, 14, 12, -1, 1);
Object.assign(bear, { mode: "follow", target: otter, stuck: 0, dig: 0, sendJumps: 0, blockT: 0, petT: 0 });
const players = [otter, fox];
pebbleHolder = otter;
fox.idle = 0;
const SPEC = {
  otter: { speed: 80, jump: 268, air: 0 },
  fox: { speed: 88, jump: 268, air: 1, air2: 262 },
  bear: { speed: 95, jump: 290 },
};

let cpIdx = 0;
function spawnAt(c, tx) { c.x = tx * T + 1; c.y = groundY(tx) - c.h; c.vx = c.vy = 0; c.ground = null; c.dash = 0; c.slam = false; }
function respawn(c) {
  const tx = L.checkpoints[cpIdx].tx + (c === otter ? 0 : c === fox ? 1 : 2);
  burst(c.x + c.w / 2, c.y + c.h / 2, 14, [255, 255, 255]);
  spawnAt(c, tx);
  c.dead = 0.8;
  L.items.forEach((it) => { if (it.carrier === c) { it.carrier = null; it.x = it.hx; it.y = it.hy; } });
}
spawnAt(otter, L.spawn); spawnAt(fox, L.spawn + 2); spawnAt(bear, L.spawn + 4);

// ---------- Puzzle state ----------
function channel(ch) {
  return L.plates.filter((p) => p.ch === ch && p.down).length + L.levers.filter((l) => l.ch === ch && l.on).length;
}
function dynSolids() {
  const out = [];
  L.gates.forEach((g) => g.open < 0.5 && out.push(g));
  L.flaps.forEach((f) => out.push(f));
  L.bridges.forEach((b) => b.rise > 0.9 && out.push(b));
  L.movers.forEach((m) => out.push(m));
  L.blocks.forEach((b) => out.push(b));
  return out;
}

// Move one axis, resolve against tiles + rects. Returns what we hit (or null).
function move(b, d, axis, rects) {
  if (!d) return null;
  if (axis === "x") b.x += d; else b.y += d;
  let hit = null;
  const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.001) / T);
  const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.001) / T);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      if (!solidTile(tx, ty, b)) continue;
      if (axis === "x") b.x = d > 0 ? Math.min(b.x, tx * T - b.w) : Math.max(b.x, (tx + 1) * T);
      else b.y = d > 0 ? Math.min(b.y, ty * T - b.h) : Math.max(b.y, (ty + 1) * T);
      hit = "tile";
    }
  for (const r of rects) {
    if (r === b || !overlaps(b, r)) continue;
    if (axis === "x") b.x = d > 0 ? r.x - b.w : r.x + r.w;
    else b.y = d > 0 ? r.y - b.h : r.y + r.h;
    hit = r;
  }
  return hit;
}

const tileUnder = (c, fx) => tileAt(Math.floor((c.x + c.w * fx) / T), Math.floor((c.y + c.h + 1) / T));
function inWaterAt(b) { return tileAt(Math.floor((b.x + b.w / 2) / T), Math.floor((b.y + b.h * 0.6) / T)) === "W"; }
function onThorns(b) { return tileAt(Math.floor((b.x + b.w / 2) / T), Math.floor((b.y + b.h - 2) / T)) === "^"; }

function physicsStep(c, dt, wantX, rects) {
  if (c.dash > 0) { c.dash -= dt; c.vy = 0; wantX = c.facing * 220; }
  else {
    const G = c.inWater ? 120 : 900;
    c.vy = Math.min(c.vy + G * dt, c.inWater ? 90 : c.slam ? 560 : 420);
  }
  const px = c.x;
  if (c.ground && c.ground.lastDx !== undefined) {
    move(c, c.ground.lastDx, "x", rects);
    move(c, c.ground.lastDy, "y", rects);
  }
  const hx = move(c, wantX * dt, "x", rects);
  const prevBottom = c.y + c.h;
  const yRects = c === bear ? rects
    : rects.concat(players.filter((o) => o !== c && c.vy > 0 && prevBottom <= o.y + 1 && o.dead <= 0));
  c.onGround = false;
  const vyWas = c.vy;
  const hy = move(c, c.vy * dt, "y", yRects);
  if (hy) {
    c.vy = 0;
    if (vyWas > 0) {
      if (c.isChar && vyWas > 180 && !c.onGround) burst(c.x + c.w / 2, c.y + c.h, 4, [230, 215, 190], 25, 60);
      c.onGround = true; c.ground = hy === "tile" ? null : hy; c.air = 0; c.canDash = true;
      if (c.slam) slamImpact(c);
      if (hy === "tile") landedOnTiles(c);
    }
  } else c.ground = null;
  c.x = Math.min(Math.max(c.x, 0), LW - c.w); // never leave the level sideways
  c.lastDx = c.x - px;
  return hx;
}

function landedOnTiles(c) {
  for (const fx of [0.1, 0.9]) {
    const sp = special.get(`${Math.floor((c.x + c.w * fx) / T)},${Math.floor((c.y + c.h + 1) / T)}`);
    if (sp && sp.ch === "C" && !sp.broken && sp.t === 0) sp.t = 0.001;
  }
  if (c.isChar && tileUnder(c, 0.5) === "M") { // bounce mushroom
    c.vy = -430; c.onGround = false; c.air = 0; sfx("bounce");
    burst(c.x + c.w / 2, c.y + c.h, 8, [255, 120, 130], 40);
  }
}

function slamImpact(c) {
  c.slam = false;
  shakeT = 0.25;
  sfx("slam");
  burst(c.x + c.w / 2, c.y + c.h, 16, [220, 200, 170], 90);
  const ty = Math.floor((c.y + c.h + 1) / T);
  let broke = false;
  for (const tx0 of [Math.floor((c.x + 2) / T), Math.floor((c.x + c.w - 2) / T)]) {
    if (tileAt(tx0, ty) !== "X") continue;
    for (let tx = tx0; tileAt(tx, ty) === "X"; tx--) destroyTile(tx, ty);
    for (let tx = tx0 + 1; tileAt(tx, ty) === "X"; tx++) destroyTile(tx, ty);
    broke = true;
  }
  if (broke) { toast("CRACK! The rock shatters!", 1.5); sfx("crack"); }
  enemies.forEach((e) => { if (e.alive && Math.abs(e.x - c.x) < 34 && Math.abs(e.y - c.y) < 20) killEnemy(e); });
}

function killEnemy(e) {
  e.alive = false; e.s.hide(); sfx("pop");
  burst(e.x + 6, e.y + 3, 10, [215, 120, 170], 50);
}

function updatePlayer(c, dt, rects) {
  const spec = SPEC[c.kind];
  if (c.dead > 0) c.dead -= dt;
  const st = stick(c.kind);
  const py = c.y;
  c.inWater = inWaterAt(c);
  if (c.inWater && c.kind === "fox") {
    burst(c.x + 6, c.y, 12, [120, 200, 255]);
    toast("Splash! Red pandas can't swim. Maybe there's another way across?"); sfx("splash");
    return respawn(c);
  }
  if (onThorns(c) || c.y > LH + 40) { toast("Ouch!", 1.2); sfx("hurt"); return respawn(c); }

  let wantX = st.x * spec.speed;
  const other = c === otter ? fox : otter;
  const maxSep = viewW - 40; // couch co-op leash: stay on the same screen
  if (Math.abs(c.x + wantX * dt - other.x) > maxSep && Math.sign(wantX) === Math.sign(c.x - other.x)) wantX = 0;
  if (st.x && c.dash <= 0) c.facing = Math.sign(st.x);
  c.atk -= dt; c.atkCd -= dt; c.dashCd -= dt;

  if (c.inWater) {
    c.slam = false; c.dash = 0;
    c.vy += st.y * 500 * dt;
    c.vy *= 0.94;
    const atSurface = tileAt(Math.floor((c.x + c.w / 2) / T), Math.floor((c.y - 2) / T)) !== "W";
    if (pressed(c.kind, "jump")) { c.vy = atSurface ? -spec.jump : c.vy - 90; sfx(atSurface ? "jump" : "splash"); }
    if (Math.random() < 0.05) burst(c.x + c.w / 2, c.y, 1, [220, 240, 255], 10, -40);
  } else if (pressed(c.kind, "jump")) {
    if (c.onGround) { c.vy = -spec.jump; c.onGround = false; c.ground = null; sfx("jump"); }
    else if (spec.air && c.air < spec.air) { c.vy = -spec.air2; c.air++; sfx("double"); burst(c.x + c.w / 2, c.y + c.h, 6, [255, 240, 220], 30); }
  }

  // special abilities: otter ground-pound, fox air-dash
  if (pressed(c.kind, "special") && !c.inWater) {
    if (c.kind === "otter") {
      if (!c.onGround && !c.slam) { c.slam = true; c.vy = 520; }
      else if (c.onGround) toast("Jump first, then R2 in mid-air to slam!", 1.5);
    } else if (c.canDash && c.dashCd <= 0) {
      c.dash = 0.22; c.dashCd = 0.45; c.canDash = c.onGround; sfx("dash");
      burst(c.x + c.w / 2, c.y + c.h / 2, 8, [255, 170, 110], 30, 0);
    }
  }
  if (c.dash > 0 && Math.random() < 0.6) burst(c.x + c.w / 2 - c.facing * 6, c.y + c.h / 2, 1, [255, 150, 90], 5, 0);

  // attack: swipe in front, cuts brambles and bonks beetles
  if (pressed(c.kind, "attack") && c.atkCd <= 0) {
    c.atk = 0.15; c.atkCd = 0.3; sfx("swipe");
    const hb = { x: c.facing > 0 ? c.x + c.w - 2 : c.x - 14, y: c.y - 3, w: 16, h: c.h + 6 };
    enemies.forEach((e) => e.alive && overlaps(hb, e) && killEnemy(e));
    for (let ty = Math.floor(hb.y / T); ty <= Math.floor((hb.y + hb.h) / T); ty++)
      for (let tx = Math.floor(hb.x / T); tx <= Math.floor((hb.x + hb.w) / T); tx++)
        if (tileAt(tx, ty) === "B") destroyTile(tx, ty);
  }

  const hit = physicsStep(c, dt, wantX, rects);
  if (hit && hit.pushers) hit.pushers[c.kind] = Math.sign(wantX);
  c.lastDy = c.y - py;

  // interactions
  if (pressed(c.kind, "use")) {
    const lv = L.levers.find((l) => overlaps(c, l));
    if (lv) useLever(lv);
    else if (Math.abs(bear.x - c.x) < 36 && Math.abs(bear.y - c.y) < 24) {
      Object.assign(bear, { mode: "send", sendDir: c.facing, sendJumps: 0, blockT: 0 });
      bubble(pick(["Go, Bear! 🐾", "Go get it, buddy!", "Woof! *zooms*"])); sfx("woof");
    }
  }
  if (pressed(c.kind, "call")) callBear(c);
  if (pressed(c.kind, "love")) {
    const partnerClose = Math.abs(c.x - other.x) < 26 && Math.abs(c.y - other.y) < 16 && other.dead <= 0;
    if (Math.abs(bear.x - c.x) < 28 && Math.abs(bear.y - c.y) < 20 && !partnerClose) petBear(c);
    else if (partnerClose) cuddle(c, other);
    else if (c.onGround && !c.roll) { // roll over!
      c.roll = 0.7; c.vy = -120; sfx("pet");
      heart(c.x + c.w / 2, c.y - 6);
      if (c.kind === "fox") bubble(pick(["*happy red panda roll*", "*flops over adorably*", "*tumbles* ♥"]));
    }
    else {
      heart(c.x + c.w / 2, c.y - 4); sfx("heart");
      if (Math.abs(c.x - other.x) < 20 && Math.abs(c.y - other.y) < 16) { heart(other.x + other.w / 2, other.y - 8); heart((c.x + other.x) / 2, c.y - 14); }
    }
  }
  if (pressed(c.kind, "reset")) respawn(c);

  // animation
  c.anim += Math.abs(c.lastDx) * 0.12;
  const f = c.inWater ? 3 : !c.onGround ? 3 : Math.abs(wantX) > 5 ? 1 + (Math.floor(c.anim) % 2) : 0;
  c.s.frame(f);
  c.s.flip(c.facing < 0);
  const blink = c.dead > 0 && Math.floor(c.dead * 12) % 2;
  if (blink) c.s.hide(); else c.s.place(c.x + c.w / 2, c.y + c.h - c.art.h / 2 + (c.inWater ? 2 : 0));
  // roll-over spin
  if (c.roll > 0) { c.roll -= dt; c.s.go.transform.rotation = -c.facing * (1 - Math.max(0, c.roll) / 0.7) * Math.PI * 2; }
  else if (c.roll !== undefined) { c.s.go.transform.rotation = 0; c.roll = 0; }
  // whoever holds the pebble juggles it when idle (and carries it on their back otherwise)
  const still = c.onGround && !c.inWater && Math.abs(wantX) < 5 && c.dead <= 0;
  c.idle = still ? c.idle + dt : 0;
  if (pebbleHolder === c) {
    if (c.idle > 2.5) {
      const ph = (c.idle * 2.2) % 1, h = Math.sin(ph * Math.PI) * 10;
      if (ph < c.lastPh) sfx("tick");
      c.lastPh = ph;
      otter.pebble.place(c.x + c.w / 2 + c.facing * 4, c.y - 2 - h);
    } else if (c.kind === "fox") otter.pebble.place(c.x + c.w / 2 - c.facing * 2, c.y - 1);
    else otter.pebble.hide();
  }
  if (c.atk > 0) { c.swipe.flip(c.facing < 0); c.swipe.place(c.x + c.w / 2 + c.facing * 12, c.y + c.h / 2 - 1); }
  else c.swipe.hide();
}

function useLever(lv) {
  if (lv.kind === "lever") lv.on = !lv.on;
  else if (lv.timer) { lv.on = true; lv.t = lv.timer; }
  else if (lv.sync && !lv.on) lv.arm = 0.6;
  burst(lv.x + 8, lv.y + 8, 8, [255, 230, 120], 40);
  sfx("lever");
}

// ---------- Otter & red panda cuddles ----------
function cuddle(c, other) {
  c.facing = Math.sign(other.x - c.x) || 1; other.facing = -c.facing;
  c.vy = -90; other.vy = -90; sfx("pet");
  for (let i = 0; i < 4; i++) heart((c.x + other.x) / 2 + 7 + (Math.random() - 0.5) * 16, c.y - 6 - i * 3);
  if (pebbleHolder === c) { // gift the favourite pebble
    pebbleHolder = other;
    toast(c.kind === "otter" ? "The otter gave the red panda their favorite pebble! 🥹" : "The red panda gave the pebble back to the otter ♥", 2.5);
  } else toast(pick(["*nuzzle nuzzle* ♥", "*boop!*", "*cozy cuddle*", "*nose kiss* ♥"]), 1.5);
}

// ---------- Bear ----------
function callBear(c) {
  const near = Math.abs(bear.x - c.x) < 40 && Math.abs(bear.y - c.y) < 24;
  if (bear.mode === "follow" && bear.target === c && near) {
    bear.mode = "stay"; bubble("*sits*  Good boy, Bear!"); sfx("pet");
  } else {
    bear.mode = "follow"; bear.target = c; bubble("Woof! 🐾"); sfx("woof");
  }
}
function petBear(c) {
  bear.petT = 1.3; bear.facing = Math.sign(c.x - bear.x) || 1;
  for (let i = 0; i < 3; i++) heart(bear.x + 7 + (i - 1) * 6, bear.y - 4 - i * 3);
  sfx("pet");
  bubble(pick(["*happy tail wags*", "*leans into pets*", "*rolls over for belly rubs*", "Bear loves you! ♥", "*doodle zoomies*"]));
}
function bearToSafety(msg) {
  sfx("whimper");
  burst(bear.x + 7, bear.y + 6, 12, [120, 200, 255]);
  spawnAt(bear, L.checkpoints[cpIdx].tx + 2);
  bear.mode = "follow";
  if (msg) bubble(msg);
}
function updateBear(dt, rects) {
  const b = bear, t = b.target;
  rects = rects.filter((r) => !r.flap); // only Bear fits through doggy doors
  let wantX = 0;
  b.petT -= dt;
  if (b.petT > 0) wantX = 0;
  else if (b.mode === "follow") {
    const dx = t.x - t.facing * 18 - b.x;
    const dist = Math.hypot(t.x - b.x, t.y - b.y);
    if (Math.abs(dx) > 10) wantX = Math.sign(dx) * SPEC.bear.speed * Math.min(1, Math.abs(dx) / 30);
    b.stuck = dist > 70 ? b.stuck + dt : 0;
    if (dist > 260 || b.stuck > 2.5) { // Bear catches up (but never into water)
      burst(b.x + 7, b.y + 6, 12, [240, 240, 240]);
      if (t.inWater || !t.onGround || inWaterAt(t)) spawnAt(b, L.checkpoints[cpIdx].tx + 2);
      else { b.x = t.x; b.y = t.y + t.h - b.h; b.vx = b.vy = 0; }
      b.stuck = 0;
      burst(b.x + 7, b.y + 6, 12, [240, 240, 240]);
    }
  } else if (b.mode === "send") wantX = b.sendDir * SPEC.bear.speed;

  // Bear is scared of water and won't walk off big drops
  if (wantX && b.onGround) {
    const ahead = Math.floor((b.x + b.w / 2 + Math.sign(wantX) * 12) / T), feet = Math.floor((b.y + b.h + 2) / T);
    let drop = 0; while (drop < 6 && !solidTile(ahead, feet + drop) && tileAt(ahead, feet + drop) !== "W") drop++;
    const wet = tileAt(ahead, feet + drop) === "W";
    if (wet || drop >= 6) {
      if (wet && Math.random() < 0.004) bubble(pick(["*whimpers* Bear doesn't like water...", "Bear won't go in the water!"]));
      wantX = 0;
      if (b.mode === "send") { b.mode = "stay"; bubble(wet ? "*refuses to go near the water*" : "*sits at the edge*"); }
    }
  }

  const hit = physicsStep(b, dt, wantX, rects);
  if (wantX && hit) {
    // dig through soft dirt in front of him
    const fx = Math.floor((wantX > 0 ? b.x + b.w + 1 : b.x - 1) / T);
    const dirt = [Math.floor(b.y / T), Math.floor((b.y + b.h - 1) / T)].filter((ty) => tileAt(fx, ty) === "D");
    if (dirt.length) {
      b.dig += dt;
      if (Math.random() < 0.3) burst(b.x + b.w / 2 + Math.sign(wantX) * 8, b.y + 8, 1, [176, 122, 74], 40);
      if (Math.random() < 0.02) sfx("dig");
      if (b.dig > 0.4) { dirt.forEach((ty) => destroyTile(fx, ty)); b.dig = 0; if (Math.random() < 0.5) bubble("*dig dig dig*"); }
    } else if (b.onGround) {
      if (b.mode === "follow") b.vy = -SPEC.bear.jump;
      else if (b.mode === "send") {
        if (b.sendJumps < 1) { b.vy = -SPEC.bear.jump; b.sendJumps++; }
        else if ((b.blockT += dt) > 0.25) { b.mode = "stay"; bubble("*sits* Woof!"); }
      }
    }
  }
  if (b.mode === "follow" && b.onGround && t.y < b.y - 20 && Math.abs(t.x - b.x) < 30 && t.onGround) b.vy = -SPEC.bear.jump;
  if (inWaterAt(b)) bearToSafety("Yelp! Bear hates water! 💦");
  else if (onThorns(b) || b.y > LH + 40) bearToSafety("Yip!");
  if (wantX) b.facing = Math.sign(wantX);
  b.anim += Math.abs(b.lastDx) * 0.15;
  const f = b.petT > 0 ? (Math.floor(b.petT * 8) % 2 ? 3 : 0) : b.mode === "stay" ? 3 : wantX ? 1 + (Math.floor(b.anim) % 2) : 0;
  b.s.frame(f);
  b.s.flip(b.facing < 0);
  b.s.place(b.x + b.w / 2, b.y + b.h - b.art.h / 2);
}

// ---------- Enemies ----------
function updateEnemies(dt, rects) {
  enemies.forEach((e) => {
    if (!e.alive) return;
    e.vy = Math.min(e.vy + 900 * dt, 400);
    const hx = move(e, e.dir * 22 * dt, "x", rects);
    if (move(e, e.vy * dt, "y", rects)) e.vy = 0;
    const ahead = Math.floor((e.x + (e.dir > 0 ? e.w + 1 : -1)) / T), below = Math.floor((e.y + e.h + 2) / T);
    if (hx || !solidTile(ahead, below)) e.dir *= -1;
    if (e.y > LH) e.alive = false;
    for (const p of players) {
      if (p.dead > 0 || !overlaps(p, e)) continue;
      if (p.dash > 0 || (p.vy > 60 && p.y + p.h - e.y < 6)) { killEnemy(e); p.vy = -180; }
      else { toast("Pinched by a bramble beetle! Swipe them with ○.", 2); sfx("hurt"); respawn(p); }
    }
    e.anim += dt * 6;
    e.s.frame(Math.floor(e.anim) % 2);
    e.s.flip(e.dir > 0);
    e.s.place(e.x + e.w / 2, e.y + e.h - 3.5);
  });
}

// ---------- World objects ----------
// weight standing on a platform: animals count 1, crates by size (riders=true: animals only)
function weightOn(m, ridersOnly) {
  let w = [otter, fox, bear].filter((c) => c.ground === m && c.dead <= 0).length;
  if (!ridersOnly) {
    const strip = { x: m.x, y: m.y - 3, w: m.w, h: 4 };
    L.blocks.forEach((b) => { if (overlaps(b, strip)) w += b.need; });
  }
  return w;
}
let friends = 0, bones = 0, syncFailT = 0;
function updateWorld(dt, rects) {
  const bodies = [otter, fox, bear, ...L.blocks];
  L.plates.forEach((p) => {
    const zone = { x: p.x + 2, y: p.y - 4, w: p.w - 4, h: 8 };
    const was = p.down;
    p.down = bodies.some((b) => overlaps(b, zone));
    if (p.down && !was) { burst(p.x + 8, p.y, 4, [255, 230, 120], 25); sfx("plate"); }
    p.s.frame(p.down ? 1 : 0);
    p.s.place(p.x + 8, p.y + 2);
  });
  const groups = {};
  L.levers.forEach((l) => {
    if (l.timer && l.on && (l.t -= dt) <= 0) l.on = false;
    if (l.sync) { l.arm -= dt; (groups[l.sync] ||= []).push(l); }
    l.s.frame(l.on || l.arm > 0 ? 1 : 0);
    l.s.place(l.x + 8, l.y + 8);
  });
  Object.values(groups).forEach((g) => {
    if (g[0].on) return;
    if (g.every((l) => l.arm > 0)) { g.forEach((l) => (l.on = true)); toast("Perfect sync! 🎉"); sfx("sync"); }
    else if (g.some((l) => l.arm > 0 && l.arm <= dt * 1.5) && syncFailT <= 0) {
      toast("Not quite together! Count down out loud: 3... 2... 1... press!", 2.5); syncFailT = 1; sfx("fail");
    }
  });
  syncFailT -= dt;
  const timed = L.levers.find((l) => l.timer && l.on);
  if (timed && Math.ceil(timed.t) !== Math.ceil(timed.t + dt)) sfx("tick");
  timerEl.textContent = timed ? `⏱ ${Math.ceil(timed.t)}` : "";
  timerEl.classList.toggle("show", !!timed);

  L.gates.forEach((g) => {
    const on = channel(g.ch) >= g.need;
    if (on && g.latch && !g.latched) { g.latched = true; toast("The big gate rumbles open! 🎉"); }
    if ((on || g.latched) !== !!g.wasOn) { g.wasOn = on || g.latched; sfx("gate"); }
    const blocked = bodies.some((b) => b !== g && overlaps(b, g));
    const target = on || g.latched || (g.open > 0.5 && blocked) ? 1 : 0;
    g.open += Math.sign(target - g.open) * Math.min(Math.abs(target - g.open), dt * 3);
    g.s.place(g.x + 5, g.y + g.h / 2 - g.open * g.h);
  });
  L.bridges.forEach((br) => {
    const target = channel(br.ch) > 0 ? 1 : 0;
    if (target && br.rise === 0) { toast("A log bridge floats up!"); sfx("bridge"); }
    br.rise += Math.sign(target - br.rise) * Math.min(Math.abs(target - br.rise), dt * (target ? 1.5 : 0.8));
    if (br.rise <= 0) br.s.hide(); else br.s.place(br.x + br.w / 2, br.y + br.h / 2 + (1 - br.rise) * 20);
  });
  L.movers.forEach((m) => {
    const px = m.x, py = m.y;
    let tx, ty;
    if (m.pulley !== undefined) {
      const pair = L.movers.filter((o) => o.pulley === m.pulley);
      const wA = weightOn(pair[0]), wB = weightOn(pair[1]);
      tx = m.x0; ty = m.y0 + m.side * Math.sign(wA - wB) * m.range;
    } else if (m.riders) {
      const n = weightOn(m, true), up = n >= m.riders;
      tx = m.x0; ty = up ? m.y1 : m.y0;
      if (n > 0 && !up && m.y === m.y0 && toastT <= 0) toast(`Lift: ${n}/${m.riders} aboard`, 1);
    } else if (m.ch) { const on = channel(m.ch) > 0; tx = on ? m.x1 : m.x0; ty = on ? m.y1 : m.y0; }
    else {
      tx = m.dir > 0 ? m.x1 : m.x0; ty = m.dir > 0 ? m.y1 : m.y0;
      if (m.x === tx && m.y === ty && (m.pause += dt) > 0.7) { m.pause = 0; m.dir *= -1; }
    }
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), step = Math.min(d, m.speed * dt);
    if (d > 0) { m.x += (dx / d) * step; m.y += (dy / d) * step; }
    m.lastDx = m.x - px; m.lastDy = m.y - py;
    m.s.place(m.x + m.w / 2, m.y + m.h / 2);
  });
  L.blocks.forEach((b) => {
    const dirs = Object.values(b.pushers).filter(Boolean);
    const dir = dirs.filter((d) => d === 1).length >= b.need ? 1 : dirs.filter((d) => d === -1).length >= b.need ? -1 : 0;
    if (dirs.length && !dir && b.need > 1 && toastT <= 0) toast("Hnnng! Too heavy for one. Push together!", 1.5);
    const px = b.x, py = b.y;
    const others = rects.filter((r) => r !== b);
    b.vy = Math.min(b.vy + 900 * dt, 400);
    if (dir) move(b, dir * (b.need > 1 ? 32 : 50) * dt, "x", others);
    // tip into gaps: when nothing supports the middle, snap into the gap below
    const filled = (col, row) => solidTile(col, row) || others.some((r) => overlaps({ x: col * T + 4, y: row * T + 4, w: 8, h: 8 }, r));
    const cx = Math.floor((b.x + b.w / 2) / T), below = Math.floor((b.y + b.h + 1) / T);
    if (!filled(cx, below)) { let c0 = cx; while (!filled(c0 - 1, below) && cx - c0 < 4) c0--; b.x = c0 * T; }
    if (move(b, b.vy * dt, "y", others)) {
      if (b.vy > 200) { shakeT = 0.2; sfx("thud"); burst(b.x + b.w / 2, b.y + b.h, 14, [140, 120, 90], 70); if (b.need > 1) toast("THUD! Teamwork!", 1.5); }
      b.vy = 0;
    }
    b.lastDx = b.x - px; b.lastDy = b.y - py;
    b.pushers = {};
    b.s.place(b.x + b.w / 2, b.y + b.h / 2);
  });
  const kOn = channel("K") % 2 === 1;
  special.forEach((sp) => {
    if (sp.ch === "r" || sp.ch === "u") {
      const want = sp.ch === "r" ? !kOn : kOn;
      if (want !== sp.solid) {
        const r = { x: sp.tx * T, y: sp.ty * T, w: T, h: T };
        if (!want || ![otter, fox, bear, ...L.blocks].some((c) => overlaps(c, r))) {
          sp.solid = want;
          sp.s.tex.setColor(new Color(255, 255, 255, want ? 255 : 60));
        }
      }
      return;
    }
    if (sp.ch !== "C") return;
    if (sp.t > 0 && !sp.broken) {
      sp.t += dt;
      sp.s.place(sp.tx * T + 8 + (Math.random() - 0.5) * 2, sp.ty * T + 8);
      if (sp.t > 0.55) { sfx("crumble"); sp.broken = true; sp.s.hide(); sp.back = 3; burst(sp.tx * T + 8, sp.ty * T + 8, 6, [199, 176, 138], 30); }
    } else if (sp.broken && (sp.back -= dt) <= 0) {
      const r = { x: sp.tx * T, y: sp.ty * T, w: T, h: T };
      if (![otter, fox, bear].some((c) => overlaps(c, r))) { sp.broken = false; sp.t = 0; sp.s.place(sp.tx * T + 8, sp.ty * T + 8); }
    }
  });
  const carried = {};
  L.items.forEach((it) => {
    if (it.done) {
      if (it.kind === "bone") return;
      const n = it.npc;
      it.s.place(n.x + 12, n.y - it.h / 2 - Math.abs(Math.sin(performance.now() / 250)) * 3);
      return;
    }
    if (!it.carrier) {
      const p = players.find((p) => p.dead <= 0 && overlaps(p, it));
      if (p) {
        it.carrier = p; sfx("pickup");
        toast(it.kind === "key" ? `The ${NAME[p.kind]} grabbed the key! 🔑`
          : it.kind === "bone" ? "A bone! Bear's tail is already wagging... bring it to him!"
          : it.art === "BALL" || it.art === "CARROT" ? `The ${NAME[p.kind]} picked it up. Bring it back!`
          : `The ${NAME[p.kind]} is carrying the little one. Take them home!`);
      }
    }
    if (it.carrier) {
      const c = it.carrier, k = (carried[c.kind] = (carried[c.kind] || 0) + 1) - 1;
      it.x += (c.x + c.w / 2 - it.w / 2 - it.x) * Math.min(1, dt * 10);
      it.y += (c.y - it.h - 1 - k * 8 - it.y) * Math.min(1, dt * 10);
      if (it.kind === "bone" && Math.abs(c.x - bear.x) < 24 && Math.abs(c.y - bear.y) < 20) {
        it.done = true; it.carrier = null; it.s.hide(); bones++;
        bear.petT = 2.2; sfx("crunch"); setTimeout(() => sfx("woof"), 700);
        bubble(pick(["*CRUNCH CRUNCH* Best. Day. Ever!", "A BONE!! *happiest boy*", "*chomps happily* ♥"]));
        for (let i = 0; i < 6; i++) heart(bear.x + 7 + (Math.random() - 0.5) * 16, bear.y - 6 - i * 2);
        return;
      }
      if (it.npc && overlaps(c, it.npc.zone)) {
        it.done = true; it.carrier = null; it.npc.helped = true; friends++; sfx("friend");
        if (it.npc.art === "RIGBY") npcBubble(it.npc, "ARF ARF ARF!! 🎾");
        toast(`${it.npc.name}: "${it.npc.thanks}"`, 3.5);
        for (let i = 0; i < 5; i++) heart(it.npc.x + (Math.random() - 0.5) * 20, it.npc.y - 16);
      }
    }
    it.s.place(it.x + it.w / 2, it.y + it.h / 2 + (it.carrier ? 0 : Math.sin(performance.now() / 300) * 1.5));
  });
  L.npcs.forEach((n) => {
    const near = players.reduce((a, p) => (Math.abs(p.x - n.x) < Math.abs(a.x - n.x) ? p : a));
    const close = players.some((p) => Math.abs(p.x - n.x) < 56 && Math.abs(p.y - n.y) < 48);
    if (n.art === "RIGBY" && close !== !!n.close) { // Rigby barks hello and goodbye
      sfx("arf"); setTimeout(() => sfx("arf"), 160);
      npcBubble(n, close ? pick(["Arf! Arf! Hi friends!", "ARF! New friends!!", "Arf arf! 🐾"]) : pick(["Arf! Aww, bye!", "Arf... come back soon!", "Arf arf! Bye bye!"]));
    }
    n.close = close;
    if (n.s.art.n > 1) n.s.frame(n.helped || close ? Math.floor(performance.now() / 180) % 2 : 0);
    n.s.flip(near.x < n.x);
    n.s.place(n.x, n.y - n.s.art.h / 2 - (n.helped ? Math.abs(Math.sin(performance.now() / 200)) * 2 : 0));
  });
}

// ---------- Camera ----------
let camX = 0, camY = 0;
function updateCamera(dt, snap) {
  const tx = Math.min(Math.max((otter.x + fox.x) / 2 + 7, viewW / 2), LW - viewW / 2);
  const ty = Math.min(Math.max((otter.y + fox.y) / 2 - 30, viewH / 2), LH - viewH / 2);
  const k = snap ? 1 : Math.min(1, dt * 4);
  camX += (tx - camX) * k; camY += (ty - camY) * k;
  const sh = shakeT > 0 ? ((shakeT -= dt), settings.shake ? 3 : 0) : 0;
  emerald.camera.transform.position.x = -camX + (Math.random() - 0.5) * sh;
  emerald.camera.transform.position.y = camY + (Math.random() - 0.5) * sh;
  sky.go.transform.scale.x = viewW / 2 + 4; sky.go.transform.scale.y = viewH / 2 + 4;
  sky.place(camX, camY);
  far.place(LW / 2 + (camX - LW / 2) * 0.8, camY * 0.85 + 10);
  mid.place(LW / 2 + (camX - LW / 2) * 0.55, camY * 0.6 + 70);
}
const toScreen = (x, y) => [window.innerWidth / 2 + (x - camX) * Z, window.innerHeight / 2 + (y - camY) * Z];

// ---------- Game flow ----------
let state = hp.has("go") ? "play" : "splash", winT = 0, sel = chapter;
const titleEl = $("title"), winEl = $("win"), chapEl = $("chapters");
const CH_NAMES = ["Creekside", "Mossy Hollow", "Windy Ridge", "Stormy Falls", "Lantern Caves", "Starry Summit"];
const splashEl = $("splash"), pauseEl = $("pause"), whoEl = $("who");
function drawWho() {
  const p1 = swapPlayers ? "fox" : "otter", p2 = swapPlayers ? "otter" : "fox";
  const label = (who) => (who === "otter" ? "Otter" : "Red panda");
  const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean).length;
  $("whoP1").textContent = label(p1); $("whoP2").textContent = label(p2);
  $("whoC1").textContent = pads >= 1 ? "🎮 Controller 1" : "⌨ WASD + Space";
  $("whoC2").textContent = pads >= 2 ? "🎮 Controller 2" : "⌨ Arrow keys";
  $("whoImg1").replaceChildren(spriteCanvas(p1 === "otter" ? "OTTER" : "FOX"));
  $("whoImg2").replaceChildren(spriteCanvas(p2 === "otter" ? "OTTER" : "FOX", true));
}
function spriteCanvas(k, flip) {
  const a = ART[k], c = document.createElement("canvas");
  c.width = a.w; c.height = a.h; c.className = "pal"; c.style.width = a.w * 7 + "px";
  const img = new Image();
  img.onload = () => { const g = c.getContext("2d"); if (flip) { g.translate(a.w, 0); g.scale(-1, 1); } g.drawImage(img, 0, 0, a.w, a.h, 0, 0, a.w, a.h); };
  img.src = a.url;
  return c;
}
if (state === "play") { titleEl.classList.add("hidden"); splashEl.classList.add("hidden"); toast(L.sub, 4); }
else titleEl.classList.add("hidden");
// splash art: the gang, drawn from the same pixel sprites
[["OTTER", 0], ["FOX", 0], ["BEAR", 0], ["RIGBY", 0]].forEach(([k, f]) => {
  const a = ART[k], c = document.createElement("canvas");
  c.width = a.w; c.height = a.h;
  const img = new Image();
  img.onload = () => c.getContext("2d").drawImage(img, f * a.w, 0, a.w, a.h, 0, 0, a.w, a.h);
  img.src = a.url;
  c.className = "pal"; c.style.width = a.w * 5 + "px";
  $("gang").appendChild(c);
});

// ---------- Pause menu ----------
const MENU = [
  { label: "Resume", act: () => setPause(false) },
  { label: "Music volume", key: "music", slider: true },
  { label: "Sound effects", key: "sfx", slider: true },
  { label: "Screen shake", key: "shake" },
  { label: "Hint signs", key: "hints" },
  { label: "Speech bubbles", key: "bubbles" },
  { label: "Back to checkpoint (both)", act: () => { respawn(otter); respawn(fox); setPause(false); } },
  { label: "Restart chapter", act: () => gotoChapter(chapter) },
  { label: "Unlock all chapters", act: () => { try { localStorage.setItem("creekside.unlocked", "6"); } catch {} unlocked = 6; toast("All chapters unlocked! Pick any from Chapter select.", 2.5); setPause(false); } },
  { label: "Swap who plays who", act: () => { setSwap(!swapPlayers); toast(`Player 1 is now the ${swapPlayers ? "red panda" : "otter"}!`, 2); setPause(false); } },
  { label: "Chapter select", act: () => { location.hash = ""; location.reload(); } },
];
let menuSel = 0, prevState = "play", playTime = 0;
window.addEventListener("gamepaddisconnected", () => { if (state === "play") { setPause(true); toast("A controller disconnected. Reconnect it and press Options.", 4); } });
function setPause(on) {
  if (on) { prevState = state; state = "pause"; menuSel = 0; drawMenu(); }
  else state = prevState;
  pauseEl.classList.toggle("hidden", !on);
}
function drawMenu() {
  $("menu").innerHTML = MENU.map((m, i) => {
    let v = "";
    if (m.slider) v = `<span class="bar">${"▮".repeat(Math.round(settings[m.key] * 10))}${"▯".repeat(10 - Math.round(settings[m.key] * 10))}</span>`;
    else if (m.key) v = `<span>${settings[m.key] ? "ON" : "OFF"}</span>`;
    return `<div class="${i === menuSel ? "sel" : ""}" data-i="${i}"><span>${m.label}</span>${v}</div>`;
  }).join("");
}
function menuInput(i, dir) {
  const m = MENU[i];
  if (m.slider) settings[m.key] = Math.min(1, Math.max(0, Math.round((settings[m.key] + dir * 0.1) * 10) / 10));
  else if (m.key) settings[m.key] = !settings[m.key];
  else if (dir === 0) return m.act();
  saveSettings(); syncAudio(); drawMenu(); sfx("select");
}
$("menu").addEventListener("click", (e) => {
  const row = e.target.closest("[data-i]");
  if (row) { menuSel = +row.dataset.i; menuInput(menuSel, MENU[menuSel].slider ? 1 : 0); }
});
window.addEventListener("keydown", (e) => {
  if ((e.key === "Escape" || e.key === "p" || e.key === "P") && (state === "play" || state === "pause")) setPause(state !== "pause");
});
const gotoChapter = (i) => { location.hash = `c=${i + 1}&go`; location.reload(); };
function drawChapters() {
  const html = CH_NAMES.map((name, i) => {
    const lock = i + 1 > unlocked;
    return `<span class="${i === sel ? "sel" : ""} ${lock ? "lock" : ""}">${lock ? "🔒" : i + 1 + "."} ${name}</span>`;
  }).join("");
  if (chapEl.innerHTML !== html) chapEl.innerHTML = html;
}
function updatePads() {
  const pad = (i, el, name) => { el.textContent = `${name}: ${input.isGamepadConnected?.(i) ? "🎮 controller connected" : "⌨ keyboard (press a button on a controller)"}`; };
  bindPads(); pad(padFor.otter, $("p1"), "Otter"); pad(padFor.fox, $("p2"), "Red panda");
}
const totalFriends = L.items.filter((i) => i.npc).length, totalBones = L.items.filter((i) => i.kind === "bone").length;

let frameN = 0;
function frame(dt) {
  frameN++;
  dt = Math.min(dt, 1 / 20);
  const anyStart = pressed("otter", "start") || pressed("fox", "start");
  if (state === "splash") {
    updatePads();
    if (anyStart || pressed("otter", "jump") || pressed("fox", "jump")) {
      state = "who"; splashEl.classList.add("hidden"); whoEl.classList.remove("hidden"); drawWho(); sfx("pet");
    }
  } else if (state === "who") {
    updatePads();
    if (["otter", "fox"].some((w) => pressed(w, "mLeft") || pressed(w, "mRight"))) { setSwap(!swapPlayers); drawWho(); sfx("select"); }
    if (anyStart) { state = "title"; whoEl.classList.add("hidden"); titleEl.classList.remove("hidden"); sfx("pet"); }
  } else if (state === "pause") {
    const any = (act) => ["otter", "fox"].some((w) => pressed(w, act));
    if (any("mUp")) { menuSel = (menuSel + MENU.length - 1) % MENU.length; drawMenu(); sfx("select"); }
    if (any("mDown")) { menuSel = (menuSel + 1) % MENU.length; drawMenu(); sfx("select"); }
    if (any("mLeft")) menuInput(menuSel, -1);
    if (any("mRight")) menuInput(menuSel, 1);
    if (any("mOk")) menuInput(menuSel, 0);
    else if (any("mBack") || any("pause")) setPause(false);
  } else if (state === "title") {
    updatePads();
    const any = (act) => ["otter", "fox"].some((w) => pressed(w, act));
    if (any("mLeft")) { sel = Math.max(0, sel - 1); sfx("select"); }
    if (any("mRight")) { sel = Math.min(unlocked - 1, sel + 1); sfx("select"); }
    drawChapters();
    if (anyStart) {
      if (sel !== chapter) return gotoChapter(sel);
      state = "play"; titleEl.classList.add("hidden"); toast(L.sub, 4);
    }
  } else {
    if (pressed("otter", "pause") || pressed("fox", "pause")) { setPause(true); return; }
    const steps = Math.ceil(dt / (1 / 120)), h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const rects = dynSolids();
      edgeOff = i > 0; // edge-triggered input only on the first substep
      players.forEach((p) => updatePlayer(p, h, rects));
      updateBear(h, rects);
      updateEnemies(h, rects);
      updateWorld(h, rects);
    }
    edgeOff = false;
    const together = otter.idle > 1 && fox.idle > 1 && Math.abs(otter.x - fox.x) < 22 && Math.abs(otter.y - fox.y) < 10;
    pawsT = together ? pawsT + dt : 0;
    if (pawsT > 2) { pawsT = 0.6; heart((otter.x + fox.x) / 2 + 7, otter.y - 8); if (Math.random() < 0.3) toast("*holding paws* ♥", 1.2); }
    const nxt = L.checkpoints[cpIdx + 1];
    if (nxt && otter.x > nxt.tx * T && fox.x > nxt.tx * T) {
      cpIdx++; flags[cpIdx - 1]?.frame(1); sfx("pickup");
      if (toastT <= 0) toast("Checkpoint! ⛳", 1.2);
    }
    if (state === "play") playTime += dt;
    const keysOk = L.items.every((it) => it.kind !== "key" || it.carrier);
    if (state === "play" && overlaps(otter, L.exit) && overlaps(fox, L.exit)) {
      if (!keysOk) { if (toastT <= 0) toast("The den is locked. Bring the key!", 1.5); }
      else {
        state = "win"; winT = 0; winEl.classList.remove("hidden");
        try { localStorage.setItem("creekside.unlocked", String(Math.max(unlocked, chapter + 2))); } catch {}
        const last = chapter === LEVELS.length - 1;
        $("winTitle").textContent = last ? "The End ♥" : `${CH_NAMES[chapter]} complete!`;
        sfx("win");
        const mm = Math.floor(playTime / 60), ss = String(Math.floor(playTime % 60)).padStart(2, "0");
        $("winSub").textContent = `Time ${mm}:${ss} · Friends helped: ${friends}/${totalFriends} · Bones for Bear: ${bones}/${totalBones}` + (last ? " · You did it together. Bear, Rigby and all your new friends are SO proud of you two ♥" : "");
        $("winNext").textContent = last ? "Press ✕ to play again from the start" : "Press ✕ for the next chapter";
      }
    }
    if (state === "win") {
      winT += dt;
      if (Math.random() < dt * 6) heart(L.exit.x + Math.random() * 48, L.exit.y);
      if (winT > 1.2 && anyStart)
        gotoChapter(chapter === LEVELS.length - 1 ? 0 : chapter + 1);
    }
    const nearTo = (x, y) => players.some((p) => Math.abs(p.x - x) < 40 && Math.abs(p.y - y) < 40);
    const npc = L.npcs.find((n) => nearTo(n.x, n.y));
    const sign = L.signs.find((s) => nearTo(s.x, s.y));
    const text = !settings.hints ? "" : npc ? `${npc.name}: "${npc.helped ? npc.thanks : npc.say}"` : sign ? sign.text : "";
    hintEl.textContent = text;
    hintEl.classList.toggle("show", !!text);
    hudEl.textContent = `⏸ Options/Esc   ·   ${L.name}   ·   Friends ${friends}/${totalFriends}   ·   🦴 ${bones}/${totalBones}` + (L.items.some((i) => i.kind === "key" && i.carrier) ? "   ·   🔑" : "");
  }

  parts.forEach((p) => {
    if (p.life <= 0) return;
    p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life <= 0) p.s.hide(); else p.s.place(p.x, p.y);
  });
  hearts.forEach((h) => {
    if (h.life <= 0) return;
    h.life -= dt; h.y -= 18 * dt; h.x += h.vx * dt;
    if (h.life <= 0) h.s.hide(); else h.s.place(h.x, h.y);
  });
  if ((toastT -= dt) <= 0) toastEl.classList.remove("show");
  if ((bubbleT -= dt) <= 0) bubbleEl.classList.remove("show");
  if ((nBubbleT -= dt) <= 0) nBubbleEl.classList.remove("show");
  if (nBubbleNpc) {
    const [nx, ny] = toScreen(nBubbleNpc.x, nBubbleNpc.y - nBubbleNpc.s.art.h - 4);
    nBubbleEl.style.transform = `translate(${nx}px, ${ny}px) translate(-50%, -100%)`;
  }
  const [bx, by] = toScreen(bear.x + 7, bear.y - 6);
  bubbleEl.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -100%)`;
  updateCamera(dt, false);
  updateAmbient(dt);
}

fit();
parts.forEach((p) => p.s.hide());
hearts.forEach((h) => h.s.hide());
players.forEach((p) => p.swipe.hide());
updateCamera(0, true);
emerald.run((dt) => {
  frame(dt);
  emerald.drawScene(scene, dt);
  input.update();
});
window.__game = { otter, fox, bear, L, enemies, special, input, frames: () => frameN, get state() { return state; }, get friends() { return friends; } };
