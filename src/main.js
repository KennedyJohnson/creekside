import {
  Emerald, Scene, SceneManager, Color, GameObject, Texture, Vector2, Vector3, InputManager,
} from "emeraldengine";
import * as ART from "./art.js";
import { LEVELS, T } from "./level.js";

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
const TILE_ART = { D: ART.DIRT, C: ART.CRUMBLE, M: ART.MUSHROOM, B: ART.BRAMBLE, X: ART.CRACKED };
const special = new Map();
for (let ty = 0; ty < L.H; ty++)
  for (let tx = 0; tx < L.W; tx++) {
    const ch = L.grid[ty][tx];
    if (!TILE_ART[ch]) continue;
    const s = sprite(TILE_ART[ch], -9);
    s.place(tx * T + 8, ty * T + 8);
    special.set(`${tx},${ty}`, { ch, tx, ty, s, t: 0, broken: false, back: 0 });
  }

const tileAt = (tx, ty) => (ty < 0 || ty >= L.H ? "." : tx < 0 || tx >= L.W ? "#" : L.grid[ty][tx]);
const solidTile = (tx, ty) => {
  const c = tileAt(tx, ty);
  if (c === "C") return !special.get(`${tx},${ty}`).broken;
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
const denS = sprite(ART.den(), -6);
denS.place(L.exit.x + L.exit.w / 2, L.exit.y + L.exit.h - 20);

// ---------- Input ----------
const input = new InputManager();
const bind = (who, keys) => { for (const [act, list] of Object.entries(keys)) input.mapAction(`${who}.${act}`, list); };
bind("otter", {
  left: ["a", "KeyA", "pad:0:dpadLeft"], right: ["d", "KeyD", "pad:0:dpadRight"],
  up: ["w", "KeyW", "pad:0:dpadUp"], down: ["s", "KeyS", "pad:0:dpadDown"],
  jump: [" ", "Space", "pad:0:south"], use: ["f", "KeyF", "pad:0:west"],
  attack: ["c", "KeyC", "pad:0:east"], special: ["g", "KeyG", "pad:0:r2", "pad:0:l2"],
  call: ["e", "KeyE", "pad:0:north"], love: ["q", "KeyQ", "pad:0:r1", "pad:0:l1"],
  reset: ["r", "KeyR", "pad:0:share"], start: ["Enter", "pad:0:south", "pad:0:options"],
});
bind("fox", {
  left: ["ArrowLeft", "pad:1:dpadLeft"], right: ["ArrowRight", "pad:1:dpadRight"],
  up: ["pad:1:dpadUp"], down: ["ArrowDown", "pad:1:dpadDown"],
  jump: ["ArrowUp", "pad:1:south"], use: [".", "Period", "pad:1:west"],
  attack: ["l", "KeyL", "pad:1:east"], special: ["k", "KeyK", "pad:1:r2", "pad:1:l2"],
  call: [",", "Comma", "pad:1:north"], love: ["/", "Slash", "pad:1:r1", "pad:1:l1"],
  reset: ["pad:1:share"], start: ["pad:1:south", "pad:1:options"],
});
let edgeOff = false;
const pressed = (who, a) => !edgeOff && input.justPressed(`${who}.${a}`);
const held = (who, a) => input.isDown(`${who}.${a}`);
function stick(who, pad) {
  let x = (held(who, "right") ? 1 : 0) - (held(who, "left") ? 1 : 0);
  let y = (held(who, "down") ? 1 : 0) - (held(who, "up") ? 1 : 0);
  if (input.isGamepadConnected?.(pad)) {
    const s = input.getGamepadStick("left", pad);
    if (Math.abs(s.x) > Math.abs(x)) x = s.x;
    if (Math.abs(s.y) > Math.abs(y)) y = s.y;
  }
  return { x, y };
}

// ---------- HUD (DOM overlay) ----------
const $ = (id) => document.getElementById(id);
const hintEl = $("hint"), toastEl = $("toast"), bubbleEl = $("bubble"), hudEl = $("hud"), timerEl = $("timer");
let toastT = 0, bubbleT = 0;
function toast(msg, t = 2.5) { toastEl.textContent = msg; toastEl.classList.add("show"); toastT = t; }
function bubble(msg) { bubbleEl.textContent = msg; bubbleEl.classList.add("show"); bubbleT = 1.6; }
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

// ---------- Characters ----------
function makeChar(kind, art, w, h, pad, z) {
  return { kind, art, s: sprite(art, z), w, h, pad, x: 0, y: 0, vx: 0, vy: 0, onGround: false, ground: null,
    facing: 1, air: 0, inWater: false, anim: 0, dead: 0, lastDx: 0, lastDy: 0, isChar: true,
    atk: 0, atkCd: 0, dash: 0, dashCd: 0, canDash: true, slam: false, swipe: sprite(ART.SWIPE, 6) };
}
const otter = makeChar("otter", ART.OTTER, 14, 11, 0, 3);
const fox = makeChar("fox", ART.FOX, 12, 13, 1, 2);
const bear = makeChar("bear", ART.BEAR, 14, 12, -1, 1);
Object.assign(bear, { mode: "follow", target: otter, stuck: 0, dig: 0, sendJumps: 0, blockT: 0, petT: 0 });
const players = [otter, fox];
const SPEC = {
  otter: { speed: 80, jump: 268, air: 0 },
  fox: { speed: 88, jump: 268, air: 1, air2: 262 },
  bear: { speed: 95, jump: 290 },
};

let cpIdx = 0;
function spawnAt(c, tx) { c.x = tx * T + 1; c.y = groundY(tx) - c.h; c.vx = c.vy = 0; c.ground = null; c.dash = 0; c.slam = false; }
function respawn(c) {
  const tx = L.checkpoints[cpIdx].tx + (c === otter ? 0 : c === fox ? 2 : 4);
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
      if (!solidTile(tx, ty)) continue;
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
      c.onGround = true; c.ground = hy === "tile" ? null : hy; c.air = 0; c.canDash = true;
      if (c.slam) slamImpact(c);
      if (hy === "tile") landedOnTiles(c);
    }
  } else c.ground = null;
  c.lastDx = c.x - px;
  return hx;
}

function landedOnTiles(c) {
  for (const fx of [0.1, 0.9]) {
    const sp = special.get(`${Math.floor((c.x + c.w * fx) / T)},${Math.floor((c.y + c.h + 1) / T)}`);
    if (sp && sp.ch === "C" && !sp.broken && sp.t === 0) sp.t = 0.001;
  }
  if (c.isChar && tileUnder(c, 0.5) === "M") { // bounce mushroom
    c.vy = -430; c.onGround = false; c.air = 0;
    burst(c.x + c.w / 2, c.y + c.h, 8, [255, 120, 130], 40);
  }
}

function slamImpact(c) {
  c.slam = false;
  shakeT = 0.25;
  burst(c.x + c.w / 2, c.y + c.h, 16, [220, 200, 170], 90);
  const ty = Math.floor((c.y + c.h + 1) / T);
  let broke = false;
  for (const tx0 of [Math.floor((c.x + 2) / T), Math.floor((c.x + c.w - 2) / T)]) {
    if (tileAt(tx0, ty) !== "X") continue;
    for (let tx = tx0; tileAt(tx, ty) === "X"; tx--) destroyTile(tx, ty);
    for (let tx = tx0 + 1; tileAt(tx, ty) === "X"; tx++) destroyTile(tx, ty);
    broke = true;
  }
  if (broke) toast("CRACK! The rock shatters!", 1.5);
  enemies.forEach((e) => { if (e.alive && Math.abs(e.x - c.x) < 34 && Math.abs(e.y - c.y) < 20) killEnemy(e); });
}

function killEnemy(e) {
  e.alive = false; e.s.hide();
  burst(e.x + 6, e.y + 3, 10, [215, 120, 170], 50);
}

function updatePlayer(c, dt, rects) {
  const spec = SPEC[c.kind];
  if (c.dead > 0) c.dead -= dt;
  const st = stick(c.kind, c.pad);
  const py = c.y;
  c.inWater = inWaterAt(c);
  if (c.inWater && c.kind === "fox") {
    burst(c.x + 6, c.y, 12, [120, 200, 255]);
    toast("Splash! Foxes can't swim. Maybe there's another way across?");
    return respawn(c);
  }
  if (onThorns(c) || c.y > LH + 40) { toast("Ouch!", 1.2); return respawn(c); }

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
    if (pressed(c.kind, "jump")) c.vy = atSurface ? -spec.jump : c.vy - 90;
    if (Math.random() < 0.05) burst(c.x + c.w / 2, c.y, 1, [220, 240, 255], 10, -40);
  } else if (pressed(c.kind, "jump")) {
    if (c.onGround) { c.vy = -spec.jump; c.onGround = false; c.ground = null; }
    else if (spec.air && c.air < spec.air) { c.vy = -spec.air2; c.air++; burst(c.x + c.w / 2, c.y + c.h, 6, [255, 240, 220], 30); }
  }

  // special abilities: otter ground-pound, fox air-dash
  if (pressed(c.kind, "special") && !c.inWater) {
    if (c.kind === "otter") {
      if (!c.onGround && !c.slam) { c.slam = true; c.vy = 520; }
      else if (c.onGround) toast("Jump first, then R2 in mid-air to slam!", 1.5);
    } else if (c.canDash && c.dashCd <= 0) {
      c.dash = 0.22; c.dashCd = 0.45; c.canDash = c.onGround;
      burst(c.x + c.w / 2, c.y + c.h / 2, 8, [255, 170, 110], 30, 0);
    }
  }
  if (c.dash > 0 && Math.random() < 0.6) burst(c.x + c.w / 2 - c.facing * 6, c.y + c.h / 2, 1, [255, 150, 90], 5, 0);

  // attack: swipe in front, cuts brambles and bonks beetles
  if (pressed(c.kind, "attack") && c.atkCd <= 0) {
    c.atk = 0.15; c.atkCd = 0.3;
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
      bubble(pick(["Go, Bear! 🐾", "Go get it, buddy!", "Woof! *zooms*"]));
    }
  }
  if (pressed(c.kind, "call")) callBear(c);
  if (pressed(c.kind, "love")) {
    if (Math.abs(bear.x - c.x) < 28 && Math.abs(bear.y - c.y) < 20) petBear(c);
    else {
      heart(c.x + c.w / 2, c.y - 4);
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
  if (c.atk > 0) { c.swipe.flip(c.facing < 0); c.swipe.place(c.x + c.w / 2 + c.facing * 12, c.y + c.h / 2 - 1); }
  else c.swipe.hide();
}

function useLever(lv) {
  if (lv.kind === "lever") lv.on = !lv.on;
  else if (lv.timer) { lv.on = true; lv.t = lv.timer; }
  else if (lv.sync && !lv.on) lv.arm = 0.6;
  burst(lv.x + 8, lv.y + 8, 8, [255, 230, 120], 40);
}

// ---------- Bear ----------
function callBear(c) {
  const near = Math.abs(bear.x - c.x) < 40 && Math.abs(bear.y - c.y) < 24;
  if (bear.mode === "follow" && bear.target === c && near) {
    bear.mode = "stay"; bubble("*sits*  Good boy, Bear!");
  } else {
    bear.mode = "follow"; bear.target = c; bubble("Woof! 🐾");
  }
}
function petBear(c) {
  bear.petT = 1.3; bear.facing = Math.sign(c.x - bear.x) || 1;
  for (let i = 0; i < 3; i++) heart(bear.x + 7 + (i - 1) * 6, bear.y - 4 - i * 3);
  bubble(pick(["*happy tail wags*", "*leans into pets*", "*rolls over for belly rubs*", "Bear loves you! ♥", "*doodle zoomies*"]));
}
function bearToSafety(msg) {
  burst(bear.x + 7, bear.y + 6, 12, [120, 200, 255]);
  spawnAt(bear, L.checkpoints[cpIdx].tx + 4);
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
      if (t.inWater || !t.onGround || inWaterAt(t)) spawnAt(b, L.checkpoints[cpIdx].tx + 4);
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
      else { toast("Pinched by a bramble beetle! Swipe them with ○.", 2); respawn(p); }
    }
    e.anim += dt * 6;
    e.s.frame(Math.floor(e.anim) % 2);
    e.s.flip(e.dir > 0);
    e.s.place(e.x + e.w / 2, e.y + e.h - 3.5);
  });
}

// ---------- World objects ----------
let friends = 0, syncFailT = 0;
function updateWorld(dt, rects) {
  const bodies = [otter, fox, bear, ...L.blocks];
  L.plates.forEach((p) => {
    const zone = { x: p.x + 2, y: p.y - 4, w: p.w - 4, h: 8 };
    const was = p.down;
    p.down = bodies.some((b) => overlaps(b, zone));
    if (p.down && !was) burst(p.x + 8, p.y, 4, [255, 230, 120], 25);
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
    if (g.every((l) => l.arm > 0)) { g.forEach((l) => (l.on = true)); toast("Perfect sync! 🎉"); }
    else if (g.some((l) => l.arm > 0 && l.arm <= dt * 1.5) && syncFailT <= 0) {
      toast("Not quite together! Count down out loud: 3... 2... 1... press!", 2.5); syncFailT = 1;
    }
  });
  syncFailT -= dt;
  const timed = L.levers.find((l) => l.timer && l.on);
  timerEl.textContent = timed ? `⏱ ${Math.ceil(timed.t)}` : "";
  timerEl.classList.toggle("show", !!timed);

  L.gates.forEach((g) => {
    const on = channel(g.ch) >= g.need;
    if (on && g.latch && !g.latched) { g.latched = true; toast("The big gate rumbles open! 🎉"); }
    const blocked = bodies.some((b) => b !== g && overlaps(b, g));
    const target = on || g.latched || (g.open > 0.5 && blocked) ? 1 : 0;
    g.open += Math.sign(target - g.open) * Math.min(Math.abs(target - g.open), dt * 3);
    g.s.place(g.x + 5, g.y + g.h / 2 - g.open * g.h);
  });
  L.bridges.forEach((br) => {
    const target = channel(br.ch) > 0 ? 1 : 0;
    if (target && br.rise === 0) toast("A log bridge floats up!");
    br.rise += Math.sign(target - br.rise) * Math.min(Math.abs(target - br.rise), dt * (target ? 1.5 : 0.8));
    br.s.place(br.x + br.w / 2, br.y + br.h / 2 + (1 - br.rise) * 20);
  });
  L.movers.forEach((m) => {
    const px = m.x, py = m.y;
    let tx, ty;
    if (m.ch) { const on = channel(m.ch) > 0; tx = on ? m.x1 : m.x0; ty = on ? m.y1 : m.y0; }
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
    if (dirs.length && !dir && b.need > 1 && Math.random() < 0.02) toast("Hnnng! Too heavy for one. Push together!", 1.5);
    const px = b.x, py = b.y;
    const others = rects.filter((r) => r !== b);
    b.vy = Math.min(b.vy + 900 * dt, 400);
    if (dir) move(b, dir * (b.need > 1 ? 32 : 50) * dt, "x", others);
    // tip into gaps: when nothing supports the middle, snap into the gap below
    const filled = (col, row) => solidTile(col, row) || others.some((r) => overlaps({ x: col * T + 4, y: row * T + 4, w: 8, h: 8 }, r));
    const cx = Math.floor((b.x + b.w / 2) / T), below = Math.floor((b.y + b.h + 1) / T);
    if (!filled(cx, below)) { let c0 = cx; while (!filled(c0 - 1, below) && cx - c0 < 4) c0--; b.x = c0 * T; }
    if (move(b, b.vy * dt, "y", others)) {
      if (b.vy > 200) { shakeT = 0.2; burst(b.x + b.w / 2, b.y + b.h, 14, [140, 120, 90], 70); if (b.need > 1) toast("THUD! Teamwork!", 1.5); }
      b.vy = 0;
    }
    b.lastDx = b.x - px; b.lastDy = b.y - py;
    b.pushers = {};
    b.s.place(b.x + b.w / 2, b.y + b.h / 2);
  });
  special.forEach((sp) => {
    if (sp.ch !== "C") return;
    if (sp.t > 0 && !sp.broken) {
      sp.t += dt;
      sp.s.place(sp.tx * T + 8 + (Math.random() - 0.5) * 2, sp.ty * T + 8);
      if (sp.t > 0.55) { sp.broken = true; sp.s.hide(); sp.back = 3; burst(sp.tx * T + 8, sp.ty * T + 8, 6, [199, 176, 138], 30); }
    } else if (sp.broken && (sp.back -= dt) <= 0) {
      const r = { x: sp.tx * T, y: sp.ty * T, w: T, h: T };
      if (![otter, fox, bear].some((c) => overlaps(c, r))) { sp.broken = false; sp.t = 0; sp.s.place(sp.tx * T + 8, sp.ty * T + 8); }
    }
  });
  const carried = {};
  L.items.forEach((it) => {
    if (it.done) {
      const n = it.npc;
      it.s.place(n.x + 12, n.y - it.h / 2 - Math.abs(Math.sin(performance.now() / 250)) * 3);
      return;
    }
    if (!it.carrier) {
      const p = players.find((p) => p.dead <= 0 && overlaps(p, it));
      if (p) { it.carrier = p; toast(it.kind === "key" ? `The ${p.kind} grabbed the key! 🔑` : `The ${p.kind} is carrying the little one. Take them home!`); }
    }
    if (it.carrier) {
      const c = it.carrier, k = (carried[c.kind] = (carried[c.kind] || 0) + 1) - 1;
      it.x += (c.x + c.w / 2 - it.w / 2 - it.x) * Math.min(1, dt * 10);
      it.y += (c.y - it.h - 1 - k * 8 - it.y) * Math.min(1, dt * 10);
      if (it.npc && overlaps(c, it.npc.zone)) {
        it.done = true; it.carrier = null; it.npc.helped = true; friends++;
        toast(`${it.npc.name}: "${it.npc.thanks}"`, 3.5);
        for (let i = 0; i < 5; i++) heart(it.npc.x + (Math.random() - 0.5) * 20, it.npc.y - 16);
      }
    }
    it.s.place(it.x + it.w / 2, it.y + it.h / 2 + (it.carrier ? 0 : Math.sin(performance.now() / 300) * 1.5));
  });
  L.npcs.forEach((n) => {
    const near = players.reduce((a, p) => (Math.abs(p.x - n.x) < Math.abs(a.x - n.x) ? p : a));
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
  const sh = shakeT > 0 ? ((shakeT -= dt), 3) : 0;
  emerald.camera.transform.position.x = -camX + (Math.random() - 0.5) * sh;
  emerald.camera.transform.position.y = camY + (Math.random() - 0.5) * sh;
  sky.go.transform.scale.x = viewW / 2 + 4; sky.go.transform.scale.y = viewH / 2 + 4;
  sky.place(camX, camY);
  far.place(LW / 2 + (camX - LW / 2) * 0.8, camY * 0.85 + 10);
  mid.place(LW / 2 + (camX - LW / 2) * 0.55, camY * 0.6 + 70);
}
const toScreen = (x, y) => [window.innerWidth / 2 + (x - camX) * Z, window.innerHeight / 2 + (y - camY) * Z];

// ---------- Game flow ----------
let state = hp.has("go") ? "play" : "title", winT = 0, sel = chapter;
const titleEl = $("title"), winEl = $("win"), chapEl = $("chapters");
const CH_NAMES = ["Creekside", "Mossy Hollow", "Windy Ridge", "Stormy Falls"];
if (state === "play") { titleEl.classList.add("hidden"); toast(L.sub, 4); }
const gotoChapter = (i) => { location.hash = `c=${i + 1}&go`; location.reload(); };
function drawChapters() {
  const html = CH_NAMES.map((name, i) => {
    const lock = i + 1 > unlocked;
    return `<span class="${i === sel ? "sel" : ""} ${lock ? "lock" : ""}">${lock ? "🔒" : i + 1 + "."} ${name}</span>`;
  }).join("");
  if (chapEl.innerHTML !== html) chapEl.innerHTML = html;
}
function updatePads() {
  const pad = (i, el, name) => { el.textContent = `${name}: ${input.isGamepadConnected?.(i) ? "🎮 controller " + (i + 1) : "⌨ keyboard"}`; };
  pad(0, $("p1"), "Otter"); pad(1, $("p2"), "Fox");
}
const totalFriends = L.items.filter((i) => i.npc).length;

function frame(dt) {
  dt = Math.min(dt, 1 / 20);
  if (state === "title") {
    updatePads();
    for (const w of ["otter", "fox"]) {
      if (pressed(w, "left")) sel = Math.max(0, sel - 1);
      if (pressed(w, "right")) sel = Math.min(unlocked - 1, sel + 1);
    }
    drawChapters();
    if (pressed("otter", "start") || pressed("fox", "start")) {
      if (sel !== chapter) return gotoChapter(sel);
      state = "play"; titleEl.classList.add("hidden"); toast(L.sub, 4);
    }
  } else {
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
    const nxt = L.checkpoints[cpIdx + 1];
    if (nxt && otter.x > nxt.tx * T && fox.x > nxt.tx * T) cpIdx++;
    const keysOk = L.items.every((it) => it.kind !== "key" || it.carrier);
    if (state === "play" && overlaps(otter, L.exit) && overlaps(fox, L.exit)) {
      if (!keysOk) { if (toastT <= 0) toast("The den is locked. Bring the key!", 1.5); }
      else {
        state = "win"; winT = 0; winEl.classList.remove("hidden");
        try { localStorage.setItem("creekside.unlocked", String(Math.max(unlocked, chapter + 2))); } catch {}
        const last = chapter === LEVELS.length - 1;
        $("winTitle").textContent = last ? "The End ♥" : `${CH_NAMES[chapter]} complete!`;
        $("winSub").textContent = `Friends helped: ${friends}/${totalFriends}` + (last ? " · Bear is SO proud of you two." : "");
        $("winNext").textContent = last ? "Press ✕ to play again from the start" : "Press ✕ for the next chapter";
      }
    }
    if (state === "win") {
      winT += dt;
      if (Math.random() < dt * 6) heart(L.exit.x + Math.random() * 48, L.exit.y);
      if (winT > 1.2 && (pressed("otter", "start") || pressed("fox", "start")))
        gotoChapter(chapter === LEVELS.length - 1 ? 0 : chapter + 1);
    }
    const nearTo = (x, y) => players.some((p) => Math.abs(p.x - x) < 40 && Math.abs(p.y - y) < 40);
    const npc = L.npcs.find((n) => nearTo(n.x, n.y));
    const sign = L.signs.find((s) => nearTo(s.x, s.y));
    const text = npc ? `${npc.name}: "${npc.helped ? npc.thanks : npc.say}"` : sign ? sign.text : "";
    hintEl.textContent = text;
    hintEl.classList.toggle("show", !!text);
    hudEl.textContent = `${L.name}   ·   Friends ${friends}/${totalFriends}` + (L.items.some((i) => i.kind === "key" && i.carrier) ? "   ·   🔑" : "");
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
  const [bx, by] = toScreen(bear.x + 7, bear.y - 6);
  bubbleEl.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -100%)`;
  updateCamera(dt, false);
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
window.__game = { otter, fox, bear, L, enemies, special, get state() { return state; }, get friends() { return friends; } };
