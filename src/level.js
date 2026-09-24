// Chapter 1: Creekside. Built in code so the puzzle geometry is easy to tweak.
// Tiles: '#' dirt/grass, 'S' stone, 'W' water, '^' thorns, '.' air. y grows downward.
export const T = 16;

export function buildLevel() {
  const W = 160, H = 22, GY = 16; // GY = first solid row of base ground
  const grid = Array.from({ length: H }, () => Array(W).fill("."));
  const fill = (x0, y0, x1, y1, ch) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = ch;
  };
  const L = {
    W, H, grid,
    plates: [], gates: [], levers: [], bridges: [], elevators: [], boulders: [], signs: [],
    checkpoints: [], keys: [],
  };
  const plate = (tx, ty, ch) => L.plates.push({ x: tx * T, y: ty * T + 12, w: T, h: 4, ch, down: false });
  const lever = (tx, ty, ch) => L.levers.push({ x: tx * T, y: ty * T, w: T, h: T, ch, on: false });
  const sign = (tx, ty, text) => L.signs.push({ x: tx * T + 8, y: (ty + 1) * T, text });
  const pillarGate = (tx, ch, need = 1, latch = false) => {
    fill(tx, 0, tx, GY - 4, "S");
    L.gates.push({ x: tx * T + 3, y: (GY - 3) * T, w: 10, h: 3 * T, ch, need, latch, open: 0, latched: false });
  };
  const cp = (tx) => L.checkpoints.push({ tx });

  // 1 · Meadow start
  fill(0, GY, 41, H - 1, "#");
  fill(10, GY - 2, 12, GY - 1, "#");
  L.spawn = { otter: [3, GY - 1], fox: [5, GY - 1], bear: [7, GY - 1] };
  sign(2, GY - 1, "Move with the left stick · ✕ jumps. Fox can double-jump in mid-air!");
  sign(14, GY - 1, "△ calls Bear to you. Press △ again next to him and he'll sit and stay.");
  cp(1);

  // 2 · Twin gates
  cp(20);
  plate(23, GY - 1, "A");
  pillarGate(28, "A");
  plate(32, GY - 1, "A");
  sign(21, GY - 1, "A pressure plate holds the gate open — but only while someone stands on it.");
  plate(35, GY - 1, "B");
  pillarGate(38, "B");
  sign(34, GY - 1, "Only one plate here... and three of you. Who's a good boy?");

  // 3 · The creek
  fill(42, GY, 63, H - 1, "#");
  fill(45, GY, 60, H - 2, "W");
  lever(52, H - 2, "C");
  L.bridges.push({ x: 45 * T, y: (GY - 1) * T + 8, w: 16 * T, h: 8, ch: "C", rise: 0 });
  cp(42);
  sign(43, GY - 1, "Foxes can't swim, but otters love it. Something is glinting at the bottom... (□ uses levers)");

  // 4 · The cliff (stacking + elevator)
  fill(64, GY, 69, H - 1, "#");
  fill(67, GY, 69, GY, "."); // slot the elevator sits in
  L.elevators.push({ x: 67 * T, y: GY * T, w: 3 * T, h: T, y0: GY * T, y1: 11 * T, ch: "D", dy: 0 });
  fill(70, 11, 114, H - 1, "#");
  lever(73, 10, "D");
  cp(64);
  sign(65, GY - 1, "Too high for anyone alone. Maybe the fox could hop off the otter's head?");

  // 5 · Boulder tunnel
  fill(92, 0, 106, 7, "S");
  L.boulders.push({ x: 95 * T, y: 8 * T, w: 3 * T, h: 3 * T, vx: 0, vy: 0, pushers: {}, settled: false });
  fill(101, 11, 103, 13, ".");
  fill(101, 13, 103, 13, "^");
  cp(74);
  sign(89, 10, "A mossy boulder blocks the tunnel. It's far too heavy for one... push together!");

  // 6 · Bear's meadow: three plates, a shared key, the den
  fill(115, 12, 116, 15, "#");
  fill(117, 14, 118, 15, "#");
  fill(115, GY, W - 1, H - 1, "#");
  cp(119);
  sign(120, GY - 1, "Three plates. Three friends. The gate stays open once all three are pressed.");
  plate(123, GY - 1, "E");
  fill(128, 12, 131, GY - 1, "#");
  plate(129, 11, "E");
  plate(135, GY - 1, "E");
  pillarGate(141, "E", 3, true);
  cp(143);
  fill(148, 11, 148, GY - 1, "S");
  L.keys.push({ x: 148 * T + 2, y: 10 * T + 6, w: 11, h: 5, carrier: null, hx: 148 * T + 2, hy: 10 * T + 6 });
  sign(145, GY - 1, "The den is locked. The key is up on that pillar — carry it to the door together!");
  L.exit = { x: 153 * T, y: (GY - 3) * T + 8, w: 3 * T, h: 40 };

  return L;
}
