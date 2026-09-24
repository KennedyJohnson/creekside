import {
  Emerald, Scene, SceneManager, Color, GameObject, Texture, Vector2, Vector3, InputManager,
} from "emeraldengine";
import * as ART from "./art.js";
import { buildLevel, T } from "./level.js";

// ---------- Engine setup ----------
const canvasEl = document.getElementById("game");
const emerald = new Emerald(canvasEl, { antialias: false });
const scene = new Scene();
SceneManager.setScene(scene);
emerald.setBackgroundColor(new Color(160, 214, 238));

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
const L = buildLevel();
const LW = L.W * T, LH = L.H * T;
const baked = ART.bakeLevel(L);
const sky = sprite(ART.skyLayer(), -60);
const far = sprite(ART.hillsLayer(3200, 220, 1, ["#9cc6d8", "#b5d8e6"], 60, 110, false), -50);
const mid = sprite(ART.hillsLayer(3200, 200, 2, ["#6fa66a", "#86bb78", "#4f8a55"], 40, 80, true), -40);
const terrain = sprite({ url: baked.terrain, w: baked.w, h: baked.h, n: 1 }, -10);
terrain.place(LW / 2, LH / 2);
const water = sprite({ url: baked.water, w: baked.w, h: baked.h, n: 1 }, 5);
water.place(LW / 2, LH / 2);

const tileAt = (tx, ty) => (ty < 0 || ty >= L.H ? "." : tx < 0 || tx >= L.W ? "#" : L.grid[ty][tx]);
const solidTile = (tx, ty) => { const c = tileAt(tx, ty); return c === "#" || c === "S"; };
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const groundY = (tx) => { let y = 0; while (y < L.H && !solidTile(tx, y)) y++; return y * T; };

L.plates.forEach((p) => (p.s = sprite(ART.PLATE, -5)));
L.levers.forEach((l) => (l.s = sprite(ART.LEVER, -5)));
L.gates.forEach((g) => (g.s = sprite(ART.gate(g.h), -12)));
L.bridges.forEach((b) => (b.s = sprite(ART.wood(b.w, b.h, 3), -4)));
L.elevators.forEach((e) => (e.s = sprite(ART.wood(e.w, e.h, 9), -4)));
L.boulders.forEach((b) => (b.s = sprite(ART.boulder(b.w), -3)));
L.keys.forEach((k) => (k.s = sprite(ART.KEY, 4)));
const denS = sprite(ART.den(), -6);
denS.place(L.exit.x + L.exit.w / 2, L.exit.y + L.exit.h - 20);

// ---------- Input ----------
const input = new InputManager();
const bind = (who, pad, keys) => {
  for (const [act, list] of Object.entries(keys)) input.mapAction(`${who}.${act}`, list);
};
bind("otter", 0, {
  left: ["a", "KeyA", "pad:0:dpadLeft"], right: ["d", "KeyD", "pad:0:dpadRight"],
  up: ["w", "KeyW", "pad:0:dpadUp"], down: ["s", "KeyS", "pad:0:dpadDown"],
  jump: [" ", "Space", "pad:0:south"], use: ["f", "KeyF", "pad:0:west"],
  call: ["e", "KeyE", "pad:0:north"], love: ["q", "KeyQ", "pad:0:r1", "pad:0:l1"],
  reset: ["r", "KeyR", "pad:0:share"], start: ["Enter", "pad:0:south", "pad:0:options"],
});
bind("fox", 1, {
  left: ["ArrowLeft", "pad:1:dpadLeft"], right: ["ArrowRight", "pad:1:dpadRight"],
  up: ["pad:1:dpadUp"], down: ["ArrowDown", "pad:1:dpadDown"],
  jump: ["ArrowUp", "pad:1:south"], use: [".", "Period", "pad:1:west"],
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
const hintEl = $("hint"), toastEl = $("toast"), bubbleEl = $("bubble");
let toastT = 0, bubbleT = 0;
function toast(msg, t = 2.5) { toastEl.textContent = msg; toastEl.classList.add("show"); toastT = t; }
function bubble(msg) { bubbleEl.textContent = msg; bubbleEl.classList.add("show"); bubbleT = 1.4; }

// ---------- Particles & hearts ----------
const parts = Array.from({ length: 90 }, () => ({ s: sprite(ART.PIXEL, 6), life: 0 }));
function burst(x, y, n, rgb, spread = 60, g = 200) {
  for (let i = 0, k = 0; i < parts.length && k < n; i++) {
    const p = parts[i];
    if (p.life > 0) continue;
    Object.assign(p, { x, y, vx: (Math.random() - 0.5) * spread * 2, vy: -Math.random() * spread, life: 0.5 + Math.random() * 0.5, g });
    p.s.tex.setColor(new Color(...rgb));
    k++;
  }
}
const hearts = Array.from({ length: 12 }, () => ({ s: sprite(ART.HEART, 7), life: 0 }));
function heart(x, y) {
  const h = hearts.find((h) => h.life <= 0);
  if (h) Object.assign(h, { x, y, vx: (Math.random() - 0.5) * 20, life: 1.4 });
}

// ---------- Characters ----------
function makeChar(kind, art, w, h, pad, z) {
  return { kind, art, s: sprite(art, z), w, h, pad, x: 0, y: 0, vx: 0, vy: 0, onGround: false, ground: null,
    facing: 1, air: 0, inWater: false, anim: 0, dead: 0, lastDx: 0, lastDy: 0 };
}
const otter = makeChar("otter", ART.OTTER, 14, 11, 0, 3);
const fox = makeChar("fox", ART.FOX, 12, 13, 1, 2);
const bear = makeChar("bear", ART.BEAR, 14, 12, -1, 1);
Object.assign(bear, { mode: "follow", target: otter, stuck: 0 });
const players = [otter, fox];
const SPEC = {
  otter: { speed: 80, jump: 268, air: 0 },
  fox: { speed: 88, jump: 268, air: 1, air2: 262 },
  bear: { speed: 95, jump: 290 },
};

let cpIdx = 0;
function spawnAt(c, tx) { c.x = tx * T + 1; c.y = groundY(tx) - c.h; c.vx = c.vy = 0; c.ground = null; }
function respawn(c) {
  const tx = L.checkpoints[cpIdx].tx + (c === otter ? 0 : c === fox ? 2 : 4);
  burst(c.x + c.w / 2, c.y + c.h / 2, 14, [255, 255, 255]);
  spawnAt(c, tx);
  c.dead = 0.8;
  L.keys.forEach((k) => { if (k.carrier === c) k.carrier = null; });
}
spawnAt(otter, L.spawn.otter[0]); spawnAt(fox, L.spawn.fox[0]); spawnAt(bear, L.spawn.bear[0]);

// ---------- Puzzle state ----------
function channel(ch) {
  return L.plates.filter((p) => p.ch === ch && p.down).length + L.levers.filter((l) => l.ch === ch && l.on).length;
}
function dynSolids() {
  const out = [];
  L.gates.forEach((g) => g.open < 0.5 && out.push(g));
  L.bridges.forEach((b) => b.rise > 0.9 && out.push(b));
  L.elevators.forEach((e) => out.push(e));
  L.boulders.forEach((b) => out.push(b));
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

function inWaterAt(b) {
  return tileAt(Math.floor((b.x + b.w / 2) / T), Math.floor((b.y + b.h * 0.6) / T)) === "W";
}
function onThorns(b) {
  return tileAt(Math.floor((b.x + b.w / 2) / T), Math.floor((b.y + b.h - 2) / T)) === "^";
}

function physicsStep(c, dt, wantX, rects) {
  const G = c.inWater ? 120 : 900;
  c.vy = Math.min(c.vy + G * dt, c.inWater ? 90 : 420);
  const px = c.x;
  // carried by whatever we stand on
  if (c.ground && c.ground.lastDx !== undefined) {
    move(c, c.ground.lastDx, "x", rects);
    move(c, c.ground.lastDy, "y", rects);
  }
  const hx = move(c, wantX * dt, "x", rects);
  const prevBottom = c.y + c.h;
  const yRects = c === bear ? rects
    : rects.concat(players.filter((o) => o !== c && c.vy > 0 && prevBottom <= o.y + 1 && o.dead <= 0));
  c.onGround = false;
  const hy = move(c, c.vy * dt, "y", yRects);
  if (hy) {
    if (c.vy > 0) { c.onGround = true; c.ground = hy === "tile" ? null : hy; c.air = 0; }
    c.vy = 0;
  } else c.ground = null;
  c.lastDx = c.x - px;
  return hx;
}

function updatePlayer(c, dt, rects) {
  const spec = SPEC[c.kind];
  if (c.dead > 0) c.dead -= dt;
  const st = stick(c.kind, c.pad);
  const py = c.y;
  c.inWater = inWaterAt(c);
  if (c.inWater && c.kind === "fox") {
    burst(c.x + 6, c.y, 12, [120, 200, 255]);
    toast("Splash! Foxes can't swim — maybe there's another way across?");
    return respawn(c);
  }
  if (onThorns(c) || c.y > LH + 40) { toast("Ouch!", 1.2); return respawn(c); }

  let wantX = st.x * spec.speed;
  // Couch co-op leash: can't walk off-screen away from your partner
  const other = c === otter ? fox : otter;
  const maxSep = viewW - 40;
  if (Math.abs(c.x + wantX * dt - other.x) > maxSep && Math.sign(wantX) === Math.sign(c.x - other.x)) wantX = 0;
  if (st.x) c.facing = Math.sign(st.x);

  if (c.inWater) { // otter swimming
    c.vy += st.y * 500 * dt;
    c.vy *= 0.94;
    const atSurface = tileAt(Math.floor((c.x + c.w / 2) / T), Math.floor((c.y - 2) / T)) !== "W";
    if (pressed(c.kind, "jump")) c.vy = atSurface ? -spec.jump : c.vy - 90;
    if (Math.random() < 0.05) burst(c.x + c.w / 2, c.y, 1, [220, 240, 255], 10, -40);
  } else if (pressed(c.kind, "jump")) {
    if (c.onGround) { c.vy = -spec.jump; c.onGround = false; c.ground = null; }
    else if (spec.air && c.air < spec.air) { c.vy = -spec.air2; c.air++; burst(c.x + c.w / 2, c.y + c.h, 6, [255, 240, 220], 30); }
  }
  const hit = physicsStep(c, dt, wantX, rects);
  if (hit && hit.pushers) hit.pushers[c.kind] = Math.sign(wantX);
  c.lastDy = c.y - py;

  // interactions
  if (pressed(c.kind, "use")) {
    const lv = L.levers.find((l) => overlaps(c, l));
    if (lv) { lv.on = !lv.on; burst(lv.x + 8, lv.y + 4, 8, [255, 230, 120], 40); }
  }
  if (pressed(c.kind, "call")) callBear(c);
  if (pressed(c.kind, "love")) {
    heart(c.x + c.w / 2, c.y - 4);
    if (Math.abs(c.x - other.x) < 20 && Math.abs(c.y - other.y) < 16) { heart(other.x + other.w / 2, other.y - 8); heart((c.x + other.x) / 2, c.y - 14); }
  }
  if (pressed(c.kind, "reset")) respawn(c);

  // animation
  c.anim += Math.abs(c.lastDx) * 0.12;
  const f = c.inWater ? 3 : !c.onGround ? 3 : Math.abs(wantX) > 5 ? 1 + (Math.floor(c.anim) % 2) : 0;
  c.s.frame(f);
  c.s.flip(c.facing < 0);
  const blink = c.dead > 0 && Math.floor(c.dead * 12) % 2;
  if (blink) c.s.hide(); else c.s.place(c.x + c.w / 2, c.y + c.h - c.art.h / 2 + (c.inWater ? 2 : 0));
}

// ---------- Bear AI ----------
function callBear(c) {
  const near = Math.abs(bear.x - c.x) < 40 && Math.abs(bear.y - c.y) < 24;
  if (bear.mode === "follow" && bear.target === c && near) {
    bear.mode = "stay"; bubble("*sits*  Good boy, Bear!");
  } else {
    bear.mode = "follow"; bear.target = c; bubble("Woof! 🐾");
  }
}
function updateBear(dt, rects) {
  const b = bear, t = b.target;
  let wantX = 0;
  if (b.mode === "follow") {
    const dx = t.x - t.facing * 18 - b.x;
    const dist = Math.hypot(t.x - b.x, t.y - b.y);
    if (Math.abs(dx) > 10) wantX = Math.sign(dx) * SPEC.bear.speed * Math.min(1, Math.abs(dx) / 30);
    // don't walk into water or off a cliff
    const ahead = Math.floor((b.x + b.w / 2 + Math.sign(wantX) * 12) / T), feet = Math.floor((b.y + b.h + 2) / T);
    let drop = 0; while (drop < 5 && !solidTile(ahead, feet + drop) && tileAt(ahead, feet + drop) !== "W") drop++;
    if (wantX && (tileAt(ahead, feet) === "W" || drop >= 5)) wantX = 0;
    b.stuck = dist > 70 ? b.stuck + dt : 0;
    if (dist > 260 || b.stuck > 2.5) { // "poof" — Bear catches up
      burst(b.x + 7, b.y + 6, 12, [240, 240, 240]);
      if (t.inWater || !t.onGround) spawnAt(b, L.checkpoints[cpIdx].tx + 4);
      else { b.x = t.x; b.y = t.y + t.h - b.h; b.vx = b.vy = 0; }
      b.stuck = 0;
      burst(b.x + 7, b.y + 6, 12, [240, 240, 240]);
      if (Math.random() < 0.5) bubble("Woof!");
    }
  }
  const hit = physicsStep(b, dt, wantX, rects);
  if (b.onGround && ((hit && wantX) || (b.mode === "follow" && t.y < b.y - 20 && Math.abs(t.x - b.x) < 30 && t.onGround))) b.vy = -SPEC.bear.jump;
  if (onThorns(b) || b.y > LH + 40 || inWaterAt(b)) spawnAt(b, L.checkpoints[cpIdx].tx + 4);
  if (wantX) b.facing = Math.sign(wantX);
  b.anim += Math.abs(b.lastDx) * 0.15;
  b.s.frame(b.mode === "stay" ? 3 : wantX ? 1 + (Math.floor(b.anim) % 2) : 0);
  b.s.flip(b.facing < 0);
  b.s.place(b.x + b.w / 2, b.y + b.h - b.art.h / 2);
}

// ---------- World objects ----------
function updateWorld(dt, rects) {
  const bodies = [otter, fox, bear, ...L.boulders];
  L.plates.forEach((p) => {
    const zone = { x: p.x + 2, y: p.y - 4, w: p.w - 4, h: 8 };
    const was = p.down;
    p.down = bodies.some((b) => overlaps(b, zone));
    if (p.down && !was) burst(p.x + 8, p.y, 4, [255, 230, 120], 25);
    p.s.frame(p.down ? 1 : 0);
    p.s.place(p.x + 8, p.y + 2);
  });
  L.levers.forEach((l) => { l.s.frame(l.on ? 1 : 0); l.s.place(l.x + 8, l.y + 8); });
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
    if (target && br.rise === 0) toast("A log bridge floats up to the surface!");
    br.rise += Math.sign(target - br.rise) * Math.min(Math.abs(target - br.rise), dt * 1.5);
    br.s.place(br.x + br.w / 2, br.y + br.h / 2 + (1 - br.rise) * 20);
  });
  L.elevators.forEach((e) => {
    const ty = channel(e.ch) > 0 ? e.y1 : e.y0;
    const py = e.y;
    e.y += Math.sign(ty - e.y) * Math.min(Math.abs(ty - e.y), 40 * dt);
    e.lastDx = 0; e.lastDy = e.y - py;
    e.s.place(e.x + e.w / 2, e.y + e.h / 2);
  });
  L.boulders.forEach((b) => {
    const dirs = Object.values(b.pushers).filter(Boolean);
    const together = dirs.length === 2 && dirs[0] === dirs[1];
    if (dirs.length === 1 && !b.settled && Math.random() < 0.02) toast("Hnnng! It's too heavy for one — push together!", 1.5);
    const px = b.x, py = b.y;
    b.vy = Math.min(b.vy + 900 * dt, 400);
    if (!b.settled) {
      const others = rects.filter((r) => r !== b);
      if (together) move(b, dirs[0] * 32 * dt, "x", others);
      // fall only when the middle column has nothing underneath: snap to tile grid
      const cx = Math.floor((b.x + b.w / 2) / T), below = Math.floor((b.y + b.h + 1) / T);
      if (!solidTile(cx, below)) {
        let c0 = cx; while (!solidTile(c0 - 1, below)) c0--;
        b.x = c0 * T;
      }
      if (move(b, b.vy * dt, "y", others)) {
        if (b.vy > 200) { toast("THUD! The boulder filled the pit. Teamwork!"); burst(b.x + 24, b.y + 48, 20, [140, 120, 90], 80); }
        b.vy = 0;
      }
      if (b.y > 11 * T) b.settled = true;
    }
    b.lastDx = b.x - px; b.lastDy = b.y - py;
    b.pushers = {};
    b.s.place(b.x + b.w / 2, b.y + b.h / 2);
  });
  L.keys.forEach((k) => {
    if (!k.carrier) {
      const p = players.find((p) => p.dead <= 0 && overlaps(p, k));
      if (p) { k.carrier = p; toast(`The ${p.kind} grabbed the key! 🔑`); }
    }
    if (k.carrier) {
      k.x += (k.carrier.x + k.carrier.w / 2 - 5 - k.x) * Math.min(1, dt * 10);
      k.y += (k.carrier.y - 9 - k.y) * Math.min(1, dt * 10);
    }
    k.s.place(k.x + 5, k.y + 2 + (k.carrier ? 0 : Math.sin(performance.now() / 300) * 2));
  });
}

// ---------- Camera ----------
let camX = 0, camY = 0;
function updateCamera(dt, snap) {
  const tx = Math.min(Math.max((otter.x + fox.x) / 2 + 7, viewW / 2), LW - viewW / 2);
  const ty = Math.min(Math.max((otter.y + fox.y) / 2 - 30, viewH / 2), LH - viewH / 2);
  const k = snap ? 1 : Math.min(1, dt * 4);
  camX += (tx - camX) * k; camY += (ty - camY) * k;
  emerald.camera.transform.position.x = -camX;
  emerald.camera.transform.position.y = camY;
  sky.go.transform.scale.x = viewW / 2 + 4; sky.go.transform.scale.y = viewH / 2 + 4;
  sky.place(camX, camY);
  far.place(LW / 2 + (camX - LW / 2) * 0.8, camY * 0.85 + 10);
  mid.place(LW / 2 + (camX - LW / 2) * 0.55, camY * 0.6 + 70);
}
const toScreen = (x, y) => [window.innerWidth / 2 + (x - camX) * Z, window.innerHeight / 2 + (y - camY) * Z];

// ---------- Game flow ----------
let state = "title", winT = 0;
const titleEl = $("title"), winEl = $("win");
function updatePads() {
  const pad = (i, el, name) => { el.textContent = `${name}: ${input.isGamepadConnected?.(i) ? "🎮 controller " + (i + 1) : "⌨ keyboard"}`; };
  pad(0, $("p1"), "Otter"); pad(1, $("p2"), "Fox");
}

function frame(dt) {
  dt = Math.min(dt, 1 / 20);
  if (state === "title") {
    updatePads();
    if (pressed("otter", "start") || pressed("fox", "start")) {
      state = "play"; titleEl.classList.add("hidden");
    }
  } else if (state === "play" || state === "win") {
    const steps = Math.ceil(dt / (1 / 120)), h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const rects = dynSolids();
      // edge-triggered input must only fire on the first substep
      edgeOff = i > 0;
      players.forEach((p) => updatePlayer(p, h, rects));
      updateBear(h, rects);
      updateWorld(h, rects);
    }
    edgeOff = false;
    // checkpoints: advance when both players have passed
    const nxt = L.checkpoints[cpIdx + 1];
    if (nxt && otter.x > nxt.tx * T && fox.x > nxt.tx * T) cpIdx++;
    // win: both at the den with the key
    const k = L.keys[0];
    if (state === "play" && overlaps(otter, L.exit) && overlaps(fox, L.exit) && k.carrier) {
      state = "win"; winEl.classList.remove("hidden"); winT = 0;
    }
    if (state === "win") {
      winT += dt;
      if (Math.random() < dt * 6) heart(L.exit.x + Math.random() * 48, L.exit.y);
      if (winT > 1.5 && (pressed("otter", "start") || pressed("fox", "start"))) location.reload();
    }
    // hint signs
    const sign = L.signs.find((s) => players.some((p) => Math.abs(p.x - s.x) < 40 && Math.abs(p.y - s.y) < 40));
    hintEl.textContent = sign ? sign.text : "";
    hintEl.classList.toggle("show", !!sign);
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
updateCamera(0, true);
emerald.run((dt) => {
  frame(dt);
  emerald.drawScene(scene, dt);
  input.update();
});
window.__game = { otter, fox, bear, L, get state() { return state; } };
