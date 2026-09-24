// Playtest bot: open game.html#c=N&go&bot, then run `await __play()` in the console.
// Each chapter has a scripted route that uses only normal controls (no warping), so a
// level change that makes a puzzle unsolvable shows up as a failed step.
import { T } from "./level.js";

const B = window.__bot;
// keep a short trail of positions so a failed step shows how it went wrong
const trail = [];
const step0 = B.step.bind(B);
let fr = 0, dSeen = 0;
const recent = [];
B.step = (n = 1) => { for (let i = 0; i < n; i++) { step0(1);
  recent.push([B.otter, B.fox].map((c) => `${(c.x / 16).toFixed(1)},${(c.y / 16).toFixed(1)}`).join(' ')); if (recent.length > 40) recent.shift();
  if (B.deaths > dSeen) { dSeen = B.deaths; log.push(`death in "${stepName}": ${recent.filter((_, k) => k % 5 === 0).join(' | ')}`); } if (fr++ % 15 === 0) { trail.push([B.otter, B.fox, B.bear].map((c) => `${(c.x / 16).toFixed(1)},${(c.y / 16).toFixed(1)}`).join(' ')); if (trail.length > 60) trail.shift(); } } };
const P = { otter: B.otter, fox: B.fox };
const log = [];
let stepName = "";

const wait = (sec) => B.step(Math.max(1, Math.round(sec * 60)));
const until = (pred, sec, what) => {
  for (let i = 0; i < sec * 60; i++) { if (pred()) return; B.step(1); }
  throw new Error(`timed out waiting for ${what}`);
};
const tap = (w, act) => { B.tap[w][act] = true; B.step(1); };
const stop = (...ws) => ws.forEach((w) => { B.hold[w].left = B.hold[w].right = false; });
const steer = (w, px) => {
  const c = P[w], dx = px - c.x;
  B.hold[w].right = dx > 1; B.hold[w].left = dx < -1;
  return Math.abs(dx) <= 1.5;
};
// x of a character standing centred on tile tx
const X = (w, tx) => tx * T + (T - P[w].w) / 2;
const tileOf = (w) => Math.floor((P[w].x + P[w].w / 2) / T);

// walk one or more animals to tiles at the same time: go({otter: 12, fox: 14})
// (walkers hop over anything they bump into, like a player would)
function go(targets, sec = 20, o = {}) {
  const ws = Object.keys(targets), stuck = {};
  until(() => {
    let done = true;
    for (const w of ws) {
      const c = P[w];
      if (!steer(w, X(w, targets[w]))) {
        done = false;
        stuck[w] = c.onGround && Math.abs(c.lastDx) < 0.05 ? (stuck[w] || 0) + 1 : 0;
        // hop over crates in the way instead of shoving them (noJump = push them)
        const dir = B.hold[w].right ? 1 : -1;
        if (!o.noJump && c.onGround && B.L.blocks.some((k) => { const gap = dir > 0 ? k.x - (c.x + c.w) : c.x - (k.x + k.w); return gap > -2 && gap < 10 && k.y < c.y + c.h - 2 && k.y + k.h > c.y + 2; })) stuck[w] = 99;
        if (stuck[w] > 6 && !o.noJump) { B.tap[w].jump = true; stuck[w] = 0; stuck[w + "j"] = true; }
        if (c.onGround && !B.tap[w].jump) stuck[w + "j"] = false;
        if (w === "fox" && stuck.foxj && !c.onGround && c.vy > -30 && c.air === 0) B.tap[w].jump = true;
      } else stop(w);
    }
    return done && ws.every((w) => P[w].onGround);
  }, sec, `walk ${JSON.stringify(targets)}`);
  stop(...ws);
}
// jump toward tile tx; opts: dj (double jump at apex, red panda), djAt (vy threshold),
// dash (dash after the double jump), hold (keep walking this many sec before jumping)
function hop(w, tx, o = {}) {
  const c = P[w], px = X(w, tx);
  if (o.run) { until(() => { steer(w, px); return Math.abs(c.x - px) < Math.abs(o.run); }, 5, "run-up"); }
  B.hold[w].right = !o.up && px > c.x; B.hold[w].left = !o.up && px < c.x;
  tap(w, "jump");
  let dj = false, dashed = false, t = 0, djT = 0;
  // o.up: rise straight up until this high above the take-off point (clears ledge lips)
  const y0 = c.y;
  until(() => {
    t++;
    const rising = o.up && y0 - c.y < o.up * T && c.vy < 0;
    const arrived = rising ? (stop(w), false) : steer(w, px);
    if (o.dj && !dj && c.vy > (o.djAt ?? -20)) { dj = true; djT = t; B.tap[w].jump = true; }
    if (o.dash && dj && t - djT > 8 && !dashed && c.vy > (o.dashAt ?? -40)) { dashed = true; c.facing = Math.sign(px - c.x) || c.facing; B.tap[w].special = true; }
    if (o.slam && c.vy > 0 && arrived && !c.slam) B.tap[w].special = true;
    return t > 4 && c.onGround;
  }, 5, `${w} hop to ${tx}`);
  if (!o.noSettle) go({ [w]: tx }, 4);
}
const ride = (w, pred, sec, what) => { stop(w); until(pred, sec, what); };
const use = (w) => tap(w, "use");
const call = (w) => tap(w, "call");
const attack = (w, dir) => { P[w].facing = dir; tap(w, "attack"); wait(0.35); };
const bear = () => B.bear;
const bearTile = () => Math.floor((B.bear.x + 7) / T);
// Bear: follow w, then sit once he has caught up next to them
function bearStay(w, sec = 8) {
  if (B.bear.mode !== "follow" || B.bear.target !== P[w]) call(w);
  until(() => Math.abs(B.bear.x - P[w].x) < 30 && Math.abs(B.bear.y - P[w].y) < 20 && B.bear.onGround, sec, "Bear to catch up");
  wait(0.4);
  call(w);
  if (B.bear.mode !== "stay") throw new Error("Bear didn't sit");
}
// Bear heels 18px behind whoever he follows: stand just right of tx (facing right) so he sits on tx
function bearSit(w, tx, sec = 10) {
  const c = P[w], px = tx * T + 23;
  if (B.bear.mode !== "follow" || B.bear.target !== c) call(w);
  if (c.x > px - 2) until(() => { steer(w, px - 12); return c.x < px - 10; }, 5, "back up");
  let blocked = 0;
  until(() => { steer(w, px); blocked = Math.abs(c.lastDx) < 0.01 ? blocked + 1 : 0; return Math.abs(c.x - px) < 1.5 || blocked > 5; }, 5, "stand for Bear");
  stop(w); c.facing = 1;
  until(() => B.bear.x > tx * T - 11 && B.bear.x < tx * T + 15 && B.bear.onGround && Math.abs(B.bear.lastDx) < 0.01, sec, `Bear to heel at ${tx}`);
  call(w);
  if (B.bear.mode !== "stay") throw new Error("Bear didn't sit");
}
function send(w, dir) { P[w].facing = dir; stop(w); wait(0.05); P[w].facing = dir; use(w); }
// run right to tile tx, hopping each hazard tile in jumpTiles and swiping beetles on the way
function cross(w, tx, jumpTiles = [], sec = 12) {
  const c = P[w];
  B.hold[w].right = true;
  until(() => {
    if (c.onGround && jumpTiles.some((t) => { const g = t * T - (c.x + c.w); return g >= 0 && g < 7; })) B.tap[w].jump = true;
    if (B.enemies.some((e) => e.alive && e.x > c.x && e.x - (c.x + c.w) < 12 && Math.abs(e.y - c.y) < 16)) { c.facing = 1; B.tap[w].attack = true; }
    return c.x >= X(w, tx) && c.onGround;
  }, sec, `${w} run to ${tx}`);
  stop(w);
}
// hunt down beetle #i: walk up to it and swipe
function swat(w, i, sec = 8, maxTx = 9999) {
  const c = P[w], e = B.enemies[i];
  until(() => {
    if (!e.alive) return true;
    const dx = e.x + e.w / 2 - (c.x + c.w / 2);
    if (Math.abs(dx) < 20 && Math.abs(e.y - c.y) < 16) { stop(w); c.facing = Math.sign(dx) || 1; B.tap[w].attack = true; }
    else { B.hold[w].right = dx > 0 && c.x < maxTx * T; B.hold[w].left = dx < 0; }
    return false;
  }, sec, `${w} swats beetle ${i}`);
  stop(w);
}
// make sure Bear is following w (a call next to a following Bear would make him sit instead)
function follow(w) { if (B.bear.mode !== "follow" || B.bear.target !== P[w]) call(w); }
const gateOpen = (ch) => B.L.gates.filter((g) => g.ch === ch).every((g) => g.open > 0.9);
const onTile = (w, tx) => tileOf(w) === tx;
const H = { follow, swat, cross, bearSit, wait, until, tap, stop, go, hop, ride, use, call, attack, bearStay, send, gateOpen, onTile, tileOf, bearTile, X, B, P, T };

function run(steps) {
  const t0 = performance.now();
  for (const [name, fn] of steps) {
    stepName = name; trail.length = 0;
    const d0 = B.deaths;
    try { fn(H); } catch (e) {
      const pos = (c) => `${(c.x / T).toFixed(1)},${(c.y / T).toFixed(1)}`;
      return { ok: false, step: name, err: e.message, otter: pos(B.otter), fox: pos(B.fox), bear: pos(B.bear), deaths: B.deaths, log, trail: trail.join(' | ') };
    }
    if (B.deaths > d0) log.push(`${name}: ${B.deaths - d0} death(s)`);
  }
  return { ok: B.won, won: B.won, deaths: B.deaths, friends: B.friends, bones: B.bones, ms: Math.round(performance.now() - t0), log };
}

// ------------------------------------------------------------------ routes
const ROUTES = {};
export { ROUTES, H };
window.__H = H;
window.__play = async (upto) => {
  const c = (parseInt(new URLSearchParams(location.hash.slice(1)).get("c")) || 1);
  const mod = await import(`./routes/c${c}.js`);
  const steps = mod.default(H);
  return run(upto ? steps.slice(0, upto) : steps);
};
// __playAll(): play every chapter in turn (reloading between them); read __playAllResults() when done
window.__playAll = () => {
  sessionStorage.setItem("botAll", JSON.stringify({ c: 1, res: {} }));
  location.hash = "c=1&go&bot"; location.reload();
};
window.__playAllResults = () => JSON.parse(sessionStorage.getItem("botAll") || "null");
const all = window.__playAllResults();
if (all && !all.done) setTimeout(async () => {
  const r = await window.__play();
  all.res[all.c] = { ok: r.ok, deaths: r.deaths, friends: r.friends, bones: r.bones, step: r.step, err: r.err };
  const n = (await import("./level.js")).LEVELS.length;
  if (all.c >= n) all.done = true; else all.c++;
  sessionStorage.setItem("botAll", JSON.stringify(all));
  if (!all.done) { location.hash = `c=${all.c}&go&bot`; location.reload(); }
}, 300);
