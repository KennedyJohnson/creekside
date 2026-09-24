// Procedural pixel art: sprites are ASCII grids + palettes, baked to data URLs.

export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// frames: array of row-arrays (all same size). Returns horizontal strip.
export function strip(frames, pal) {
  const h = frames[0].length;
  const w = Math.max(...frames.flat().map((r) => r.length));
  const c = canvas(w * frames.length, h);
  const g = c.getContext("2d");
  frames.forEach((rows, f) =>
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (pal[ch]) {
          g.fillStyle = pal[ch];
          g.fillRect(f * w + x, y, 1, 1);
        }
      })
    )
  );
  return { url: c.toDataURL(), w, h, n: frames.length };
}

// ---------- Characters (all face right) ----------
const OTTER_BODY = [
  "..............kkk...",
  ".............kbbbk..",
  "............kbbnbbk.",
  "............kblllllk",
  "..........kkbbllllnk",
  "kk......kkbbbbbllk..",
  "kbkkkkkkbbbbbbbbk...",
  ".kbbbbbbbbbbbbbbk...",
  "..kbbbbbblllgbbbk...",
  "...kkbbbkkkkbbbk....",
];
const OTTER_LEGS = [
  ["....kbk.....kbk.....", "....kk......kk......"],
  ["...kbk.......kbk....", "...kk.........kk...."],
  [".....kbk...kbk......", ".....kk....kk......."],
  ["..kbk.......kbk.....", "...................."],
];
export const OTTER = strip(OTTER_LEGS.map((l) => [...OTTER_BODY, ...l]), {
  k: "#2a1a12", b: "#7b4a2b", l: "#d1a476", n: "#0d0907", g: "#9aa2ab",
});
export const PEBBLE = strip([[".gg", "ggw", ".gg"]], { g: "#8f98a3", w: "#d7dde3" });

const FOX_BODY = [ // red panda (kept as FOX internally)
  "..............w.w...",
  ".............wowow..",
  ".............ooooo..",
  "............owwoow..",
  "............oonowwn.",
  "mo..........oowwwk..",
  "moro......kkoooowk..",
  ".mrom.kkkooooooook..",
  "..mroooooooooooook..",
  "...ooooooooooooook..",
  "....kddddddddddkk...",
];
const FOX_LEGS = [
  [".....kdk....kdk.....", ".....kdk....kdk.....", ".....kk.....kk......"],
  ["....kdk......kdk....", "...kdk........kdk...", "...kk..........kk..."],
  ["......kdk..kdk......", "......kdk..kdk......", "......kk...kk......."],
  ["....kdk....kdk......", "...kdk.......kdk....", "...................."],
];
export const FOX = strip(FOX_LEGS.map((l) => [...FOX_BODY, ...l]), {
  k: "#3a1a0c", o: "#c1440e", w: "#f6ede0", n: "#111", d: "#2a1a14", m: "#7a2a0c", r: "#e6894a",
});

// Bear: black & white mini aussiedoodle
const BEAR_BODY = [
  "............xxx.....",
  "...........xgxxx....",
  "..........xxxxxxx...",
  "..........xgxwexxx..",
  "..........xgwwwwwn..",
  "..x.......xxxwwwp...",
  ".xgx....xxxxxwwx....",
  ".xxxxxxxgxxxxwwx....",
  "..xxgxxxxxxgxwwx....",
  "..xxxxxxxxxxxxxx....",
  "...xxxxxxxxxxxx.....",
];
const BEAR_PAL = {
  x: "#161616", g: "#4a4a4a", w: "#f4f4f0", e: "#8a5a34", n: "#000", p: "#e8738a",
};
export const BEAR = strip(
  [
    [...BEAR_BODY, "...xx.....xx........", "...ww.....ww........"],
    [...BEAR_BODY, "..xx.......xx.......", "..ww........ww......"],
    [...BEAR_BODY, "....xx...xx.........", "....ww...ww........."],
    ["", "", ...BEAR_BODY.slice(0, 9), "..xxxxxxxxxxxwwx....", ".wwwxxxxxxxxwwww...."],
  ],
  BEAR_PAL
);

export const HEART = strip(
  [[".rr.rr.", "rrwrrrr", "rrrrrrr", ".rrrrr.", "..rrr..", "...r..."]],
  { r: "#ff5d7a", w: "#ffd0da" }
);

export const KEY = strip(
  [[".yyy.......", "y...y......", "y...yyyyyyy", "y...y...y.y", ".yyy....y.y"]],
  { y: "#ffd23f" }
);

export const PIXEL = strip([["ww", "ww"]], { w: "#fff" });

// ---------- Props ----------
export const PLATE = strip(
  [
    ["................", "..kkkkkkkkkkkk..", ".kyyyyyyyyyyyyk.", "kkkkkkkkkkkkkkkk"],
    ["................", "................", "..kkkkkkkkkkkk..", "kyyyyyyyyyyyyyyk"],
  ],
  { k: "#3b3326", y: "#e8c547" }
);

const LEVER_BASE = ["....kkkkkkkk....", "...kssssssssk...", "..kkkkkkkkkkkk.."];
export const LEVER = strip(
  [
    ["...rr...........", "..rrrr..........", "..rrrr..........", "...kk...........", "....kk..........", ".....kk.........", "......kk........", ".......kk.......", "........kk......", "........kk......", "........kk......", "........kk......", "........kk......", ...LEVER_BASE],
    ["...........gg...", "..........gggg..", "..........gggg..", "...........kk...", "..........kk....", ".........kk.....", "........kk......", "........kk......", "........kk......", "........kk......", "........kk......", "........kk......", "........kk......", ...LEVER_BASE],
  ],
  { k: "#3a3a3a", s: "#8a8f99", r: "#e24a4a", g: "#5fd35f" }
);

function woodCanvas(w, h, seed) {
  const c = canvas(w, h), g = c.getContext("2d"), r = rng(seed);
  g.fillStyle = "#3a2414"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#8a5a33"; g.fillRect(1, 1, w - 2, h - 2);
  g.fillStyle = "#a8743f"; g.fillRect(1, 1, w - 2, 2);
  for (let i = 0; i < w / 3; i++) {
    g.fillStyle = r() < 0.5 ? "#6f4526" : "#9a6a3a";
    g.fillRect(1 + Math.floor(r() * (w - 3)), 3 + Math.floor(r() * (h - 4)), 3, 1);
  }
  return c;
}
export function wood(w, h, seed = 7) {
  return { url: woodCanvas(w, h, seed).toDataURL(), w, h, n: 1 };
}

export function gate(h) {
  const c = canvas(10, h), g = c.getContext("2d");
  g.fillStyle = "#2c2f36"; g.fillRect(0, 0, 10, h);
  for (let x = 1; x < 10; x += 3) { g.fillStyle = "#8d96a3"; g.fillRect(x, 0, 2, h); }
  for (let y = 4; y < h; y += 12) { g.fillStyle = "#5c6470"; g.fillRect(0, y, 10, 2); }
  g.fillStyle = "#e8c547"; g.fillRect(3, h / 2 - 2, 4, 4);
  return { url: c.toDataURL(), w: 10, h, n: 1 };
}

export function boulder(size) {
  const c = canvas(size, size), g = c.getContext("2d"), r = rng(42);
  const R = size / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = x - R + 0.5, dy = y - R + 0.5, d = Math.hypot(dx, dy);
      if (d > R - 0.5) continue;
      let col = "#7d858f";
      if (d > R - 2) col = "#3c4148";
      else if (dx + dy < -R * 0.5) col = "#a3abb5";
      else if (dx + dy > R * 0.6) col = "#5f666f";
      if (r() < 0.06) col = "#6a7179";
      if (dy < -R * 0.55 && r() < 0.5) col = "#5aa845"; // moss cap
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
  return { url: c.toDataURL(), w: size, h: size, n: 1 };
}

export function den() {
  const c = canvas(48, 40), g = c.getContext("2d");
  g.fillStyle = "#4a3320";
  g.beginPath(); g.arc(24, 40, 24, Math.PI, 0); g.fill();
  g.fillStyle = "#5aa845"; g.fillRect(0, 36, 48, 4);
  g.fillStyle = "#1a1008";
  g.beginPath(); g.arc(24, 40, 12, Math.PI, 0); g.fill();
  g.fillStyle = "#ff8fa3";
  [[10, 22], [36, 20], [24, 17]].forEach(([x, y]) => g.fillRect(x, y, 3, 3));
  return { url: c.toDataURL(), w: 48, h: 40, n: 1 };
}

// ---------- Level baking ----------
const SOLID = "#S";
export function bakeLevel(level) {
  const { W, H, grid, signs } = level;
  const T = 16;
  const c = canvas(W * T, H * T), g = c.getContext("2d");
  const r = rng(1234);
  const at = (x, y) => (y < 0 || y >= H || x < 0 || x >= W ? "." : grid[y][x]);
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };

  // background trees (behind terrain)
  for (let x = 2; x < W; x += 5 + Math.floor(r() * 5)) {
    let y = 0;
    while (y < H && !"#SDCMBXW^".includes(at(x, y))) y++;
    if (y >= H || at(x, y - 1) !== "." || r() < 0.3) continue;
    const base = y * T, tx = x * T + 8, th = 30 + Math.floor(r() * 20);
    g.fillStyle = "#4b3322"; g.fillRect(tx - 2, base - th, 4, th);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = ["#2f6b3a", "#3b7f45", "#4a9451", "#2a5e34"][i];
      g.beginPath();
      g.arc(tx + (r() - 0.5) * 14, base - th - 4 + (r() - 0.5) * 10, 10 + r() * 5, 0, 7);
      g.fill();
    }
  }

  for (let ty = 0; ty < H; ty++)
    for (let tx = 0; tx < W; tx++) {
      const ch = at(tx, ty), ox = tx * T, oy = ty * T;
      const topOpen = !SOLID.includes(at(tx, ty - 1)) && at(tx, ty - 1) !== "W";
      let covered = false;
      for (let y = ty - 1; y >= 0 && !covered; y--) covered = SOLID.includes(at(tx, y));
      if (covered && ch !== "#" && ch !== "S" && ch !== "W") { // cave backdrop under rock
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(ox + x, oy + y, r() < 0.08 ? "#2a1d14" : "#3a2a1e");
      }
      if (ch === "#") {
        for (let y = 0; y < T; y++)
          for (let x = 0; x < T; x++) {
            const n = r();
            px(ox + x, oy + y, n < 0.08 ? "#5a3d26" : n < 0.14 ? "#7d5838" : "#6b4a2f");
          }
        if (topOpen) {
          for (let x = 0; x < T; x++) {
            const d = 3 + Math.floor(r() * 3);
            for (let y = 0; y < d; y++) px(ox + x, oy + y, y === 0 ? "#7cc95a" : y === d - 1 ? "#3f8a36" : "#5aa845");
          }
          const roll = r();
          const nearWater = at(tx - 1, ty) === "W" || at(tx + 1, ty) === "W" || at(tx - 1, ty + 1) === "W" || at(tx + 1, ty + 1) === "W";
          if (nearWater && roll < 0.8) { // cattails
            for (let i = 0; i < 3; i++) {
              const cx = ox + 3 + i * 4 + Math.floor(r() * 2), h = 8 + Math.floor(r() * 6);
              g.fillStyle = "#4f8a3a"; g.fillRect(cx, oy - h, 1, h);
              g.fillStyle = "#6b4226"; g.fillRect(cx - 1, oy - h + 1, 3, 4);
            }
          } else if (roll < 0.1) { // bush
            for (let i = 0; i < 4; i++) {
              g.fillStyle = ["#3b7f45", "#4a9451", "#5aa845", "#2f6b3a"][i];
              g.beginPath(); g.arc(ox + 4 + i * 3, oy - 3 - (i % 2) * 2, 4 + (i % 2), 0, 7); g.fill();
            }
            if (r() < 0.5) { g.fillStyle = "#e24a4a"; g.fillRect(ox + 6, oy - 6, 1, 1); g.fillRect(ox + 10, oy - 4, 1, 1); }
          } else if (roll < 0.17) { // rock
            g.fillStyle = "#6f7680"; g.fillRect(ox + 4, oy - 3, 8, 3); g.fillRect(ox + 5, oy - 4, 6, 1);
            g.fillStyle = "#9aa2ab"; g.fillRect(ox + 5, oy - 4, 3, 1);
          } else if (roll < 0.23) { // fern
            g.fillStyle = "#3f8a36";
            for (let i = 0; i < 5; i++) { g.fillRect(ox + 8 + (i - 2) * 2, oy - 3 - Math.abs(2 - i) * -1 - 3, 1, 5 - Math.abs(2 - i)); }
            g.fillStyle = "#5aa845"; g.fillRect(ox + 6, oy - 6, 5, 1);
          } else if (roll < 0.27) { // tiny mushrooms
            for (const dx of [4, 9]) {
              g.fillStyle = "#efe3cc"; g.fillRect(ox + dx + 1, oy - 3, 1, 3);
              g.fillStyle = r() < 0.5 ? "#c0392b" : "#a86b3c"; g.fillRect(ox + dx, oy - 5, 3, 2);
            }
          } else if (roll < 0.29) { // stump
            g.fillStyle = "#5a3a22"; g.fillRect(ox + 4, oy - 6, 8, 6);
            g.fillStyle = "#c79a64"; g.fillRect(ox + 4, oy - 7, 8, 2);
            g.fillStyle = "#8a5a33"; g.fillRect(ox + 6, oy - 7, 4, 1);
          } else if (roll < 0.62) { // flowers & tufts
            const fx = ox + 2 + Math.floor(r() * 12);
            const col = ["#ff8fa3", "#ffe066", "#ffffff", "#b38cff"][Math.floor(r() * 4)];
            px(fx, oy - 1, "#3f8a36"); px(fx, oy - 2, "#3f8a36"); px(fx, oy - 3, col);
            px(fx - 1, oy - 3, col); px(fx + 1, oy - 3, col); px(fx, oy - 4, col);
          } else if (r() < 0.5) {
            const fx = ox + Math.floor(r() * 14);
            px(fx, oy - 1, "#5aa845"); px(fx + 1, oy - 2, "#5aa845"); px(fx + 2, oy - 1, "#5aa845");
          }
        }
      } else if (ch === "S") {
        for (let y = 0; y < T; y++)
          for (let x = 0; x < T; x++) {
            const n = r();
            px(ox + x, oy + y, n < 0.1 ? "#4a515b" : n < 0.16 ? "#737c88" : "#5d6570");
          }
        g.fillStyle = "#454b54"; g.fillRect(ox, oy + 15, T, 1); g.fillRect(ox + 15, oy, 1, T);
        if (topOpen) { g.fillStyle = "#4a9451"; g.fillRect(ox, oy, T, 2); }
      } else if (ch === "W") {
        for (let y = 0; y < T; y++)
          for (let x = 0; x < T; x++) px(ox + x, oy + y, r() < 0.1 ? "#243a30" : "#2d4a3e");
      } else if (ch === "^") {
        for (let i = 0; i < 4; i++) {
          const sx = ox + i * 4;
          g.fillStyle = "#6b2d5c";
          g.beginPath(); g.moveTo(sx, oy + 16); g.lineTo(sx + 2, oy + 6); g.lineTo(sx + 4, oy + 16); g.fill();
          px(sx + 2, oy + 6, "#e24a7a");
        }
      }
    }

  // hanging vines & roots under overhangs (second pass so cave backdrops don't cover them)
  for (let ty = 0; ty < H - 1; ty++)
    for (let tx = 0; tx < W; tx++) {
      if (!SOLID.includes(at(tx, ty)) || at(tx, ty + 1) !== "." || r() > 0.35) continue;
      const vx = tx * T + 2 + Math.floor(r() * 12), len = 4 + Math.floor(r() * 12);
      for (let i = 0; i < len; i++) px(vx + (i % 5 === 4 ? 1 : 0), (ty + 1) * T + i, i === len - 1 ? "#7cc95a" : "#3f8a36");
      if (r() < 0.4) px(vx + 1, (ty + 1) * T + len - 3, "#ff8fa3");
    }

  signs.forEach((s) => {
    const x = s.x - 6, y = s.y;
    g.fillStyle = "#4b3322"; g.fillRect(x + 5, y - 6, 2, 6);
    g.fillStyle = "#3a2414"; g.fillRect(x, y - 16, 12, 10);
    g.fillStyle = "#b8864f"; g.fillRect(x + 1, y - 15, 10, 8);
    g.fillStyle = "#6f4526"; g.fillRect(x + 3, y - 13, 6, 1); g.fillRect(x + 3, y - 10, 5, 1);
  });

  // water overlay (separate texture, drawn in front of characters)
  const wc = canvas(W * T, H * T), wg = wc.getContext("2d");
  for (let ty = 0; ty < H; ty++)
    for (let tx = 0; tx < W; tx++) {
      if (at(tx, ty) !== "W") continue;
      const surface = at(tx, ty - 1) !== "W";
      wg.fillStyle = "rgba(40,120,190,0.55)"; wg.fillRect(tx * T, ty * T, T, T);
      if (surface) {
        wg.fillStyle = "rgba(200,240,255,0.9)"; wg.fillRect(tx * T, ty * T, T, 1);
        wg.fillStyle = "rgba(120,200,240,0.6)"; wg.fillRect(tx * T, ty * T + 1, T, 2);
        if (r() < 0.25) { wg.fillStyle = "#3f9a4a"; wg.fillRect(tx * T + 4, ty * T - 1, 7, 2); } // lily pad
      }
    }
  return { terrain: c.toDataURL(), water: wc.toDataURL(), w: W * T, h: H * T };
}

// ---------- Parallax layers ----------
export function skyLayer(cols = ["#6fb7e8", "#bfe6f5", "#fbe7c6"]) {
  const c = canvas(1, 64), g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 64);
  grd.addColorStop(0, cols[0]); grd.addColorStop(0.7, cols[1]); grd.addColorStop(1, cols[2]);
  g.fillStyle = grd; g.fillRect(0, 0, 1, 64);
  return { url: c.toDataURL(), w: 1, h: 64, n: 1 };
}

export function hillsLayer(w, h, seed, colors, amp, base, trees) {
  const c = canvas(w, h), g = c.getContext("2d"), r = rng(seed);
  const p = [r() * 9, r() * 9, r() * 9];
  if (seed === 1) { // clouds on the far layer
    for (let i = 0; i < 26; i++) {
      const cx = r() * w, cy = 10 + r() * 50;
      g.fillStyle = "rgba(255,255,255,0.85)";
      for (let j = 0; j < 5; j++) g.fillRect(Math.round(cx + j * 6 - 12), Math.round(cy - (j % 2) * 3), 14, 6);
    }
  }
  for (let x = 0; x < w; x++) {
    const hh = base + amp * (Math.sin(x * 0.004 + p[0]) * 0.6 + Math.sin(x * 0.013 + p[1]) * 0.3 + Math.sin(x * 0.041 + p[2]) * 0.1);
    const top = Math.round(h - hh);
    g.fillStyle = colors[0]; g.fillRect(x, top, 1, h - top);
    g.fillStyle = colors[1]; g.fillRect(x, top, 1, 2);
    if (trees && r() < 0.05) {
      const th = 10 + Math.floor(r() * 14);
      g.fillStyle = colors[2];
      for (let i = 0; i < th; i++) {
        const half = Math.floor((i / th) * 5);
        g.fillRect(x - half, top - th + i, half * 2 + 1, 1);
      }
    }
  }
  return { url: c.toDataURL(), w, h, n: 1 };
}

// ---------- Friends (NPCs) & carriables ----------
const K = "#2a1a12";
export const MAMA_DUCK = strip([[
  "........kkk...", ".......kgggk..", ".......kgekkyy", ".......kgggkyy", "........kbk...",
  "k......kbbk...", "kbk...kbbbbk..", "kbbkkkbbbbbk..", ".kbbbbbbwbbk..", "..kbbbbbbbk...",
  "...kkkkkkk....", ".....y..y.....",
]], { k: K, g: "#2f7d4a", e: "#111", y: "#f2a531", b: "#9a6b43", w: "#e9dcc4" });
export const DUCKLING = strip([[
  "..kk....", ".kyyk...", ".kyekoo.", "kyyyyk..", "kyyyyk..", ".kyyk...", "..o.o...",
]], { k: "#7a5a12", y: "#ffe066", e: "#111", o: "#f2a531" });
export const HEDGEHOG = strip([[
  "....s.s.s.....", "..sssssssss...", ".ssdsdsssdff..", "sssssdsssfefn.", "ssdssssssffff.",
  "sssssdssffff..", ".sssssfffff...", "..kfk....kfk..",
]], { s: "#6b4a2f", d: "#4a3320", f: "#e3c49a", e: "#111", n: "#111", k: "#3a2414" });
export const HOGLET = strip([[
  ".s.s....", "sssdff..", "ssdfefn.", "ssssff..", ".f..f...",
]], { s: "#7d5838", d: "#4a3320", f: "#eed3ad", e: "#111", n: "#111" });
export const BUNNY = strip([[
  "......ww....", "......wpw...", ".......wpw..", ".......www..", "......wwwww.", "......wwewwn",
  ".....wwwwww.", "..wwwwwwww..", ".wwwwwwwww..", "wwwwwwwwww..", "wwwwwwwwww..", ".wwwwwwww...",
  "..ww...ww...",
]], { w: "#e7e3dc", p: "#f2a3b5", e: "#222", n: "#e8738a" });
export const CARROT = strip([[
  ".g.g..", "..gg..", ".oooo.", ".oooo.", "..ooo.", "..oo..", "..oo..", "...o..",
]], { g: "#4caf50", o: "#f28c28" });
export const OWL = strip([[
  ".k........k.", ".bb......bb.", ".bbbbbbbbbb.", "bbwwbbbbwwbb", "bwnnwbbwnnwb", "bbwwbyybwwbb",
  "bbbbbyybbbbb", "bbttttttttbb", "bttbttttbttb", "bbttttttttbb", ".bbttttttbb.", "..bbbbbbbb..",
  "...y....y...",
]], { k: "#3a2414", b: "#7a5230", w: "#f5e6c8", n: "#111", y: "#f2b631", t: "#d8bf94" });
export const OWLET = strip([[
  ".b....b.", ".bbbbbb.", "bwnbbnwb", "bbbyybbb", "btttttbb", "bttttttb", ".bbbbbb.", "..y..y..",
]], { b: "#a58868", w: "#f5e6c8", n: "#111", y: "#f2b631", t: "#efe2cc" });
export const TURTLE = strip([[
  "......gggggg......", "....ggdggggdgg....", "...gdggggggggdg.ss", "..ggggdggggdgggses",
  "..gggggggggggggsss", "..ssssssssssssss..", "...ss........ss...",
]], { g: "#3f8a36", d: "#2a5e24", s: "#a3c46b", e: "#111" });
export const BABY_TURTLE = strip([[
  "...gggg...", "..gdggdgss", ".ggggggses", ".ssssssss.", "..s....s..",
]], { g: "#4caf50", d: "#2a5e24", s: "#b8d67c", e: "#111" });

// ---------- Mechanic props ----------
export function crate(w, h, heavy) {
  const c = canvas(w, h), g = c.getContext("2d");
  g.fillStyle = heavy ? "#2b2f36" : "#4a2e17"; g.fillRect(0, 0, w, h);
  g.fillStyle = heavy ? "#6b5436" : "#b07a42"; g.fillRect(1, 1, w - 2, h - 2);
  g.fillStyle = heavy ? "#4d3c26" : "#8a5a2e";
  for (let i = 0; i < Math.max(w, h); i++) { g.fillRect(i * w / h, i, 2, 1); g.fillRect(w - 2 - i * w / h, i, 2, 1); }
  g.fillStyle = heavy ? "#2b2f36" : "#4a2e17";
  g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
  if (heavy) { g.fillStyle = "#9aa3ad"; [[1, 1], [w - 5, 1], [1, h - 5], [w - 5, h - 5]].forEach(([x, y]) => g.fillRect(x, y, 4, 4)); }
  return { url: c.toDataURL(), w, h, n: 1 };
}
function tileArt(fn) { const c = canvas(16, 16), g = c.getContext("2d"); fn(g, rng(99)); return { url: c.toDataURL(), w: 16, h: 16, n: 1 }; }
export const DIRT = tileArt((g, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const n = r(); g.fillStyle = n < 0.1 ? "#5e3a1c" : n < 0.2 ? "#b07a4a" : "#8e5f36"; g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = "#c9a07a"; [[3, 4], [10, 9], [6, 12]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
  g.fillStyle = "#6e4526"; g.fillRect(0, 0, 16, 1);
});
export const CRUMBLE = tileArt((g, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const n = r(); g.fillStyle = n < 0.12 ? "#a0896a" : "#c7b08a"; g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = "#6e5a40";
  [[3, 0], [4, 1], [4, 2], [5, 3], [11, 5], [10, 6], [10, 7], [9, 8], [9, 9], [2, 10], [3, 11], [13, 12]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  g.fillRect(0, 15, 16, 1);
});
export const MUSHROOM = tileArt((g) => {
  g.fillStyle = "#f3e7d3"; g.fillRect(5, 8, 6, 8);
  g.fillStyle = "#d62f3a"; g.beginPath(); g.ellipse(8, 8, 8, 7, 0, Math.PI, 0); g.fill(); g.fillRect(0, 7, 16, 2);
  g.fillStyle = "#fff"; [[3, 4], [8, 2], [12, 5]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
});
export const FLAP = tileArt((g) => {
  g.fillStyle = "#3a2414"; g.fillRect(0, 0, 16, 16);
  g.fillStyle = "#b07a42"; g.fillRect(2, 2, 12, 14);
  g.fillStyle = "#3a2414"; g.fillRect(6, 7, 4, 3); g.fillRect(5, 5, 1, 1); g.fillRect(7, 4, 1, 1); g.fillRect(9, 4, 1, 1); g.fillRect(11, 5, 1, 1);
});
export function button(col) {
  return strip(
    [
      ["................", "................", "................", "................", "................", "................",
       "................", "................", "................", "................", "....cccccccc....", "...cccccccccc...",
       "...cddddddddc...", "..kkkkkkkkkkkk..", ".kssssssssssssk.", "kkkkkkkkkkkkkkkk"],
      ["................", "................", "................", "................", "................", "................",
       "................", "................", "................", "................", "................", "................",
       "....cccccccc....", "..kkkkkkkkkkkk..", ".kssssssssssssk.", "kkkkkkkkkkkkkkkk"],
    ],
    { c: col, d: "#00000055", k: "#3a3a3a", s: "#8a8f99" }
  );
}

export const BEETLE = strip(
  [
    ["....kkkk....", "..kkppppkk..", ".kpppwpppkk.", "kpppppppppkm", "kpppppppppk.", ".kkkkkkkkkk.", "..k.k..k.k.."],
    ["....kkkk....", "..kkppppkk..", ".kpppwpppkk.", "kpppppppppkm", "kpppppppppk.", ".kkkkkkkkkk.", ".k.k....k.k."],
  ],
  { k: "#2a0f1f", p: "#8b2f5c", w: "#d77aa8", m: "#2a0f1f" }
);
export const SWIPE = strip([[
  "......wwww....", "........www...", ".........ww...", "..........ww..", "..........ww..",
  "..........ww..", ".........ww...", "........www...", "......wwww....",
]], { w: "#ffffff" });
export const BRAMBLE = tileArt((g, r) => {
  g.fillStyle = "#3d2a1e"; g.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 7; i++) {
    g.fillStyle = r() < 0.5 ? "#5a3a5c" : "#6b2d5c";
    const y = Math.floor(r() * 14); g.fillRect(0, y, 16, 2);
  }
  g.fillStyle = "#e24a7a"; for (let i = 0; i < 8; i++) g.fillRect(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1);
  g.fillStyle = "#4a9451"; [[2, 3], [11, 7], [6, 12]].forEach(([x, y]) => g.fillRect(x, y, 3, 2));
});
export const CRACKED = tileArt((g, r) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const n = r(); g.fillStyle = n < 0.1 ? "#6a717b" : "#8a929c"; g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = "#2b2f36";
  [[7, 0], [7, 1], [8, 2], [8, 3], [7, 4], [6, 5], [6, 6], [7, 7], [8, 8], [9, 8], [10, 9], [5, 7], [4, 8], [3, 9], [8, 10], [8, 11], [7, 12], [7, 13], [8, 14], [8, 15]]
    .forEach(([x, y]) => g.fillRect(x, y, 1, 1));
});

// Rigby: tri-color corgi (black saddle, tan face & ears, white blaze/chest/paws)
export const RIGBY = strip(
  [
    [
      "............k...k...", "...........krk.krk..", "...........krrkrrk..", "...........krwrrrk..",
      "..........krrwwerk..", "..........krwwwwwn..", "..kk......krrwwwk...", ".krk..kkkkkxwwwk....",
      ".krxkkxxxxxxxwwk....", "..kxxxxxxxxxxwwk....", "..kwrxxxxxxxxwk.....", "..kwwwwwwwwwwwk.....",
      "...kwk.....kwk......", "...kk......kk.......",
    ],
    [
      "............k...k...", "...........krk.krk..", "...........krrkrrk..", "...........krwrrrk..",
      "..........krrwwerk..", "..........krwwwwwn..", "..........krrwwwpk..", "......kkkkkxwwwk....",
      "..kkkkxxxxxxxwwk....", ".krxxxxxxxxxxwwk....", "..kwrxxxxxxxxwk.....", "..kwwwwwwwwwwwk.....",
      "...kwk.....kwk......", "...kk......kk.......",
    ],
  ],
  { k: "#1a1410", r: "#c8743a", x: "#1e1a18", w: "#f5f1ea", e: "#111", n: "#111", p: "#e8738a" }
);
export const BALL = strip([[".gggg.", "gggggg", "wggggg", "gwwggg", "ggggwg", ".gggg."]], { g: "#c9e33b", w: "#f5f7e0" });
export const BONE = strip([["kk......kk", "kwwkkkkkwk", "kwwwwwwwwk", "kwkkkkkwwk", "kk......kk"]], { k: "#8a7a5c", w: "#f6efdc" });

// ---------- Ambient eye candy ----------
export const LEAF = strip([[".o.", "ooo", ".o."], ["o..", ".o.", "..o"]], { o: "#ffffff" });
export const BUTTERFLY = strip([["p.p", "pkp", ".k."], [".p.", "pkp", ".k."]], { p: "#ffffff", k: "#2a1a12" });
export const BIRD = strip([["k.....k", ".k...k.", "..kkk.."], [".......", "kkkkkkk", "..k.k.."]], { k: "#2a2a35" });
export function cloud(seed) {
  const r = rng(seed), c = canvas(64, 24), g = c.getContext("2d");
  for (let i = 0; i < 7; i++) {
    g.fillStyle = i < 5 ? "rgba(255,255,255,0.85)" : "rgba(235,242,250,0.9)";
    const x = 10 + r() * 40, y = 8 + r() * 8, rr = 6 + r() * 6;
    g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
  }
  g.fillStyle = "rgba(255,255,255,0.85)"; g.fillRect(6, 14, 52, 6);
  return { url: c.toDataURL(), w: 64, h: 24, n: 1 };
}
