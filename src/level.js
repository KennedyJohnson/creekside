// Chapters are built in code so the puzzle geometry is easy to tweak.
// Tiles: '#' dirt/grass, 'S' stone, 'W' water, '^' thorns, '.' air,
//        'D' soft dirt (Bear digs), 'C' crumbly rock, 'M' bounce mushroom,
//        'B' brambles (attack to cut), 'X' cracked rock (otter slam). y grows downward.
export const T = 16;

function builder(W, name, sub, theme) {
  const H = 22, GY = 16;
  const grid = Array.from({ length: H }, () => Array(W).fill("."));
  const L = {
    W, H, grid, name, sub, theme,
    plates: [], gates: [], flaps: [], levers: [], bridges: [], movers: [], blocks: [], signs: [],
    checkpoints: [], items: [], npcs: [], enemies: [],
  };
  const b = {
    L, GY,
    fill(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = ch; },
    plate: (tx, ty, ch) => L.plates.push({ x: tx * T, y: ty * T + 12, w: T, h: 4, ch, down: false }),
    lever: (tx, ty, ch) => L.levers.push({ kind: "lever", x: tx * T, y: ty * T, w: T, h: T, ch, on: false }),
    // timed ({timer: s}) or sync ({sync: group}) push-buttons
    button: (tx, ty, ch, o = {}) => L.levers.push({ kind: "button", x: tx * T, y: ty * T, w: T, h: T, ch, on: false, t: 0, arm: 0, ...o }),
    sign: (tx, ty, text) => L.signs.push({ x: tx * T + 8, y: (ty + 1) * T, text }),
    gate(tx, floor, ch, o = {}) {
      if (o.pillar !== false) b.fill(tx, 0, tx, floor - 4, "S");
      L.gates.push({ x: tx * T + 3, y: (floor - 3) * T, w: 10, h: 3 * T, ch, need: o.need || 1, latch: !!o.latch, open: 0, latched: false });
    },
    flap: (tx, ty) => L.flaps.push({ x: tx * T, y: ty * T, w: T, h: T, flap: true }),
    cp: (tx) => L.checkpoints.push({ tx }),
    crate: (tx, ty) => L.blocks.push({ art: "crate", x: tx * T, y: ty * T, w: T, h: T, need: 1 }),
    heavy: (tx, ty) => L.blocks.push({ art: "heavy", x: tx * T, y: (ty - 1) * T, w: 2 * T, h: 2 * T, need: 2 }),
    boulder: (tx, ty) => L.blocks.push({ art: "boulder", x: tx * T, y: (ty - 2) * T, w: 3 * T, h: 3 * T, need: 2 }),
    bridge: (tx0, tx1, ty, ch) => L.bridges.push({ x: tx0 * T, y: ty * T + 8, w: (tx1 - tx0 + 1) * T, h: 8, ch, rise: 0 }),
    mover: (o) => L.movers.push({ h: 8, speed: 35, ch: null, ...o, x: o.x0, y: o.y0, t: 0, dir: 1, pause: 0 }),
    npc(art, tx, ty, name, say, thanks) { const n = { art, tx, ty, name, say, thanks, helped: false }; L.npcs.push(n); return n; },
    item: (art, tx, ty, npc = null) => L.items.push({ art, tx, ty, npc, kind: art === "KEY" ? "key" : "friend" }),
    beetle: (tx, ty) => L.enemies.push({ tx, ty }),
    spawn: (tx) => (L.spawn = tx),
    exit: (tx, floor) => (L.exit = { x: tx * T, y: (floor - 3) * T + 8, w: 3 * T, h: 40 }),
  };
  return b;
}

// ------------------------------------------------------------------ Chapter 1
function creekside() {
  const b = builder(160, "Chapter 1 · Creekside", "Learn the ropes: plates, levers, stacking, pushing together.",
    { sky: ["#6fb7e8", "#bfe6f5", "#fbe7c6"], far: ["#9cc6d8", "#b5d8e6"], mid: ["#6fa66a", "#86bb78", "#4f8a55"], bg: [160, 214, 238] });
  const { fill, GY } = b;
  fill(0, GY, 41, 21, "#");
  fill(10, GY - 2, 12, GY - 1, "#");
  b.spawn(3); b.cp(1);
  b.sign(2, 15, "Move with the left stick · ✕ jumps. Fox can double-jump in mid-air!");
  b.sign(8, 15, "Bramble beetles pinch! Swipe them with ○. Otter: R2 in mid-air to SLAM. Fox: R2 to DASH.");
  b.beetle(17, 15);
  b.sign(14, 15, "△ calls Bear. △ again next to him = sit & stay. L1/R1 next to him = pets (he loves pets).");

  b.cp(20);
  b.plate(23, 15, "A"); b.gate(28, GY, "A"); b.plate(32, 15, "A");
  b.sign(21, 15, "A pressure plate holds the gate open, but only while someone stands on it.");
  b.plate(35, 15, "B"); b.gate(38, GY, "B");
  b.sign(34, 15, "Only one plate here... and three of you. Who's a good boy?");

  fill(42, GY, 63, 21, "#");
  fill(45, GY, 60, 20, "W");
  b.lever(52, 20, "C");
  b.bridge(45, 60, 15, "C");
  b.cp(42);
  b.sign(43, 15, "Foxes can't swim, but otters love it. Something is glinting at the bottom... (□ uses levers)");
  const duck = b.npc("MAMA_DUCK", 62, 15, "Mama Duck", "Quack! My duckling paddled off and got stuck at the bottom of the creek!", "Quack quack! Thank you, thank you!");
  b.item("DUCKLING", 57, 20, duck);

  fill(64, GY, 69, 21, "#");
  fill(67, GY, 69, GY, ".");
  b.mover({ x0: 67 * T, y0: GY * T, x1: 67 * T, y1: 11 * T, w: 3 * T, h: T, ch: "D", speed: 40 });
  fill(70, 11, 114, 21, "#");
  b.lever(73, 10, "D");
  b.cp(64);
  b.sign(65, 15, "Too high for anyone alone. Maybe the fox could hop off the otter's head?");

  fill(92, 0, 106, 7, "S");
  b.boulder(95, 10);
  fill(101, 11, 103, 13, ".");
  fill(101, 13, 103, 13, "^");
  b.cp(74);
  b.sign(89, 10, "A mossy boulder blocks the tunnel. Far too heavy for one... push together!");

  fill(115, 12, 116, 15, "#"); fill(117, 14, 118, 15, "#");
  fill(115, GY, 159, 21, "#");
  b.cp(119);
  b.sign(120, 15, "Three plates. Three friends. The gate stays open once all three are pressed.");
  b.plate(123, 15, "E");
  fill(128, 12, 131, 15, "#");
  b.plate(129, 11, "E");
  b.plate(135, 15, "E");
  b.gate(141, GY, "E", { need: 3, latch: true });
  b.cp(143);
  fill(148, 11, 148, 15, "S");
  b.item("KEY", 148, 10);
  b.sign(145, 15, "The den is locked. The key is up on that pillar. Carry it to the door together!");
  b.exit(153, GY);
  return b.L;
}

// ------------------------------------------------------------------ Chapter 2
function mossyHollow() {
  const b = builder(160, "Chapter 2 · Mossy Hollow", "Crates, digging, brambles, and a race against the clock.",
    { sky: ["#5fa8a0", "#bfe3d0", "#e8f0c8"], far: ["#7fb0a0", "#98c4b2"], mid: ["#3f7a4a", "#548f5a", "#2c5e38"], bg: [150, 205, 190] });
  const { fill, GY } = b;
  fill(0, GY, 159, 21, "#");
  b.spawn(3); b.cp(1);
  b.sign(2, 15, "Mossy Hollow! New: crates you can push, and Bear can dig.");
  b.beetle(9, 15);

  fill(18, 0, 19, 12, "S"); fill(18, 13, 19, 15, "D");
  b.sign(14, 15, "Soft dirt! Stand next to Bear and press □ to send him ahead. He'll dig right through.");

  b.cp(21);
  b.crate(25, 15);
  b.plate(29, 15, "A"); b.plate(31, 15, "A");
  b.gate(34, GY, "A", { need: 2 });
  b.sign(22, 15, "This gate needs BOTH plates pressed... and you both need to get through.");

  b.cp(36);
  b.crate(38, 15); b.crate(40, 15);
  fill(44, 16, 47, 16, "^");
  b.sign(37, 15, "Thorns! Too far for the otter to jump. Fill the gap with crates.");

  fill(49, 0, 49, 12, "S"); fill(49, 13, 49, 15, "B");
  b.sign(48, 15, "Brambles block the way. Swipe them with ○!");

  b.cp(51);
  b.button(53, 15, "T", { timer: 4.5 });
  fill(59, 14, 60, 15, "#");
  b.beetle(63, 15);
  b.gate(68, GY, "T");
  b.sign(54, 15, "Timed button (□)! The gate only stays open a few seconds. Ready... set... GO!");

  b.cp(70);
  b.heavy(74, 15);
  fill(84, 12, 97, 15, "#");
  b.sign(71, 15, "A heavy crate. Push it together up against the ledge, then climb.");

  b.cp(86);
  fill(104, 12, 112, 15, "#"); fill(106, 15, 111, 15, "."); fill(104, 15, 105, 15, "D");
  const hazel = b.npc("HEDGEHOG", 100, 15, "Hazel", "My little hoglet wandered into the old burrow and the entrance caved in! Could your dog dig?", "My baby! Oh thank you, thank you!");
  b.item("HOGLET", 110, 15, hazel);

  b.cp(114);
  fill(122, 12, 128, 15, "#"); fill(124, 15, 127, 15, "."); fill(122, 15, 123, 15, "D");
  b.plate(127, 15, "B");
  b.gate(132, GY, "B");
  b.sign(119, 15, "This gate's plate is sealed inside that mound. Send Bear in!");
  b.beetle(137, 15); b.beetle(141, 15);

  b.cp(143);
  fill(146, 16, 150, 16, "X");
  fill(146, 17, 154, 19, ".");
  b.exit(152, 20);
  b.sign(144, 15, "Home is down in the hollow, under this cracked rock. Otter: jump, then R2 to SLAM!");
  return b.L;
}

// ------------------------------------------------------------------ Chapter 3
function windyRidge() {
  const b = builder(182, "Chapter 3 · Windy Ridge", "Bouncy mushrooms, moving logs, crumbly rocks and a doggy door.",
    { sky: ["#f08a5d", "#f9c38b", "#fde9c9"], far: ["#c98a9a", "#dca2ac"], mid: ["#8a6a7a", "#a07f8a", "#6a4f5f"], bg: [245, 190, 150] });
  const { fill, GY } = b;
  fill(0, GY, 30, 21, "#");
  b.spawn(3); b.cp(1);
  b.sign(2, 15, "Windy Ridge! It only gets trickier from here.");
  fill(16, 15, 16, 15, "M");
  fill(18, 10, 40, 21, "#");
  b.sign(10, 15, "A bouncy mushroom! Hop on it to launch way up.");

  b.cp(20);
  b.beetle(28, 9);
  fill(41, 20, 56, 21, "#"); fill(41, 19, 56, 19, "^");
  b.mover({ x0: 41 * T, y0: 10 * T, x1: 54 * T, y1: 10 * T, w: 3 * T, speed: 35 });
  fill(57, 10, 100, 21, "#");
  b.sign(38, 9, "Ride the moving log across. Careful!");

  b.cp(58);
  fill(64, 10, 75, 18, "."); fill(64, 19, 75, 19, "^"); fill(64, 10, 75, 10, "C");
  b.sign(60, 9, "Crumbly rocks fall a moment after you step on them. Keep moving!");

  b.cp(77);
  fill(80, 13, 100, 15, "."); fill(80, 10, 81, 12, ".");
  fill(84, 0, 100, 9, "S"); fill(84, 9, 88, 9, ".");
  b.flap(84, 9);
  b.plate(88, 9, "F");
  b.gate(92, GY, "F", { pillar: false });
  b.beetle(97, 15);
  b.sign(78, 9, "A doggy door! Only Bear fits. Stand next to him and press □ to send him through.");

  fill(101, GY, 181, 21, "#");
  b.cp(102);
  fill(106, 16, 112, 19, "."); fill(106, 19, 112, 19, "^");
  b.lever(114, 15, "G");
  b.bridge(106, 112, 15, "G");
  b.sign(103, 15, "Way too far to jump... unless you're a fox. Fox: jump, then R2 in mid-air to DASH!");

  b.cp(116);
  fill(120, 11, 120, 15, "S");
  b.sign(118, 15, "Something orange is stuck on top of that tall rock. Stack up!");
  b.mover({ x0: 126 * T, y0: 15 * T + 8, x1: 126 * T, y1: 8 * T, w: 3 * T, speed: 30 });
  fill(129, 8, 141, 15, "#");
  b.sign(124, 15, "This log goes up and down on its own. Time your jump!");
  b.beetle(135, 7);
  fill(142, 8, 150, 8, "C"); fill(142, 15, 150, 15, "^");
  fill(151, 8, 158, 15, "#");
  const clover = b.npc("BUNNY", 155, 7, "Clover", "Ohh, I'm SO hungry... I dropped my carrot on that tall rock way back there!", "*munch munch* You two are the best!");
  b.item("CARROT", 120, 10, clover);
  fill(159, 11, 160, 15, "#"); fill(161, 13, 162, 15, "#");
  b.cp(164);
  b.exit(172, GY);
  return b.L;
}

// ------------------------------------------------------------------ Chapter 4
function stormyFalls() {
  const b = builder(175, "Chapter 4 · Stormy Falls", "Everything you've learned, all at once. Stay close.",
    { sky: ["#2e3a4a", "#56687a", "#8394a3"], far: ["#3e4c5a", "#4e5e6c"], mid: ["#2f4a3a", "#3c5a48", "#22382c"], bg: [60, 74, 90], rain: true });
  const { fill, GY } = b;
  fill(0, GY, 174, 21, "#");
  b.spawn(3); b.cp(1);
  b.sign(4, 15, "Stormy Falls. Everything you've learned, all at once. You've got this, you two ♥");

  b.button(14, 15, "S", { sync: "S" });
  fill(26, 12, 29, 15, "#");
  b.button(28, 11, "S", { sync: "S" });
  b.gate(33, GY, "S", { latch: true });
  b.sign(10, 15, "Two buttons, far apart. Press them at the SAME time! Count down together: 3... 2... 1...");

  b.cp(35);
  b.crate(38, 15);
  b.plate(44, 15, "P"); b.plate(46, 15, "P");
  b.gate(49, GY, "P", { need: 2 });
  b.sign(36, 15, "Two plates, one crate... and one very good boy.");

  b.cp(51);
  b.crate(52, 15);
  fill(55, 16, 57, 16, "^");
  fill(59, 0, 59, 12, "S"); fill(59, 13, 59, 15, "B");
  b.sign(58, 15, "Brambles, then a log, crumbly rocks and a mushroom. Go go go!");
  b.beetle(61, 15);
  fill(62, 16, 79, 18, "."); fill(62, 19, 79, 19, "^");
  b.mover({ x0: 62 * T, y0: 16 * T, x1: 68 * T, y1: 16 * T, w: 3 * T, speed: 40 });
  fill(71, 16, 77, 16, "C");
  fill(74, 12, 75, 12, "S");
  fill(78, 17, 78, 18, "#"); fill(78, 16, 78, 16, "M");
  fill(80, 11, 100, 21, "#");
  const olive = b.npc("OWL", 84, 10, "Olive", "Hoo! My owlet is stranded on the little perch over the thorns!", "Hoo-hoo! My baby! Thank you both!");
  b.item("OWLET", 74, 11, olive);

  b.cp(82);
  b.cp(102);
  b.heavy(104, 15);
  fill(114, 0, 115, 12, "S"); fill(114, 13, 115, 15, "D");
  b.plate(112, 15, "H"); b.plate(113, 15, "H");
  b.gate(120, GY, "H", { need: 2 });
  b.sign(102, 15, "Heavy crate, sealed tunnel, locked gate. You'll need all three of you.");

  b.cp(122);
  b.beetle(124, 15);
  b.button(126, 15, "Q", { timer: 4 });
  fill(128, 16, 135, 19, "W");
  b.bridge(128, 135, 15, "Q");
  const shelly = b.npc("TURTLE", 138, 15, "Shelly", "My hatchling sank to the bottom of the pond! I'm much too slow to reach...", "Oh, my little one! Bless you both.");
  b.item("BABY_TURTLE", 133, 19, shelly);
  b.sign(125, 15, "The button raises the bridge for a moment. Otters can swim down for the hatchling.");

  fill(142, 11, 142, 15, "S");
  b.item("KEY", 142, 10);
  fill(145, 0, 145, 12, "S"); fill(145, 13, 145, 15, "B");
  b.button(147, 15, "Z", { sync: "Z" });
  fill(150, 15, 150, 15, "M");
  fill(152, 10, 153, 10, "S");
  b.button(152, 9, "Z", { sync: "Z" });
  b.gate(156, GY, "Z", { latch: true });
  b.sign(144, 15, "Grab the key. Then one of you bounces up to the high button, and you press together!");

  b.cp(158);
  fill(162, 16, 166, 16, "X");
  fill(162, 17, 170, 19, ".");
  b.exit(168, 20);
  b.sign(160, 15, "The den is under the cracked rock. Otter, SLAM! (Don't forget the key.)");
  return b.L;
}

export const LEVELS = [creekside, mossyHollow, windyRidge, stormyFalls];
