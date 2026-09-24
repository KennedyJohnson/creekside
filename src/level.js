// Chapters are built in code so the puzzle geometry is easy to tweak.
// Tiles: '#' dirt/grass, 'S' stone, 'W' water, '^' thorns, '.' air,
//        'D' soft dirt (Bear digs), 'C' crumbly rock, 'M' bounce mushroom,
//        'B' brambles (attack to cut), 'X' cracked rock (otter slam),
//        'O' otter-only wall, 'P' red-panda-only wall, 'r'/'u' switch blocks (lever channel K),
//        'F'/'G' fans (lever channel W swaps them), '<'/'>' conveyors, 'T' timed spikes, 'I' ice. y grows downward.
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
    // o.need = weight required (animals 1, crates 1, heavy crate 2); o.w = width in tiles
    plate: (tx, ty, ch, o = {}) => L.plates.push({ x: tx * T, y: ty * T + 12, w: (o.w || 1) * T, h: 4, ch, down: false, need: o.need || 1 }),
    lever: (tx, ty, ch) => L.levers.push({ kind: "lever", x: tx * T, y: ty * T, w: T, h: T, ch, on: false }),
    // timed ({timer: s}) or sync ({sync: group}) push-buttons
    button: (tx, ty, ch, o = {}) => L.levers.push({ kind: "button", x: tx * T, y: ty * T, w: T, h: T, ch, on: false, t: 0, arm: 0, ...o }),
    sign: (tx, ty, text) => L.signs.push({ x: tx * T + 8, y: (ty + 1) * T, text }),
    gate(tx, floor, ch, o = {}) {
      const rows = o.rows || 3;
      if (o.pillar !== false) b.fill(tx, 0, tx, floor - rows - 1, "S");
      L.gates.push({ x: tx * T + 3, y: (floor - rows) * T, w: 10, h: rows * T, ch, need: o.need || 1, latch: !!o.latch, open: 0, latched: false });
    },
    // pulley pair: the heavier platform sinks, the other rises
    pulley(txA, txB, row, range) {
      const id = L.movers.length;
      for (const [tx, side] of [[txA, 1], [txB, -1]])
        b.mover({ x0: tx * T, y0: row * T, x1: tx * T, y1: row * T, w: 3 * T, h: 8, pulley: id, side, range, speed: 45 });
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
    bone: (tx, ty) => L.items.push({ art: "BONE", tx, ty, npc: null, kind: "bone" }),
    beetle: (tx, ty) => L.enemies.push({ tx, ty }),
    spawn: (tx) => (L.spawn = tx),
    exit: (tx, floor) => (L.exit = { x: tx * T, y: (floor - 3) * T + 8, w: 3 * T, h: 40 }),
  };
  return b;
}

// ------------------------------------------------------------------ Chapter 1
function creekside() {
  const b = builder(160, "Chapter 1 · Creekside", "Learn the ropes: plates, levers, stacking, pushing together.",
    { sky: ["#6fb7e8", "#bfe6f5", "#fbe7c6"], far: ["#9cc6d8", "#b5d8e6"], mid: ["#6fa66a", "#86bb78", "#4f8a55"], bg: [160, 214, 238], leaves: "#8fcf6a", butterflies: true, birds: true });
  const { fill, GY } = b;
  fill(0, GY, 41, 21, "#");
  fill(10, GY - 2, 12, GY - 1, "#");
  b.spawn(3); b.cp(1);
  b.sign(2, 15, "Move with the left stick · ✕ jumps. The red panda can double-jump in mid-air!");
  b.sign(8, 15, "Bramble beetles pinch! Swipe them with ○. Otter: R2 in mid-air to SLAM. Red panda: R2 to DASH.");
  b.beetle(17, 15);
  b.bone(11, 13);
  b.sign(14, 15, "△ calls Bear. △ again next to him = sit & stay. L1/R1 next to him = pets. Bear LOVES bones: carry any you find to him!");

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
  b.sign(43, 15, "Red pandas can't swim, but otters love it. Something is glinting at the bottom... (□ uses levers)");
  const duck = b.npc("MAMA_DUCK", 62, 15, "Mama Duck", "Quack! My duckling paddled off and got stuck at the bottom of the creek!", "Quack quack! Thank you, thank you!");
  b.item("DUCKLING", 57, 20, duck);

  fill(64, GY, 69, 21, "#");
  fill(67, GY, 69, GY, ".");
  b.mover({ x0: 67 * T, y0: GY * T, x1: 67 * T, y1: 11 * T, w: 3 * T, h: T, ch: "D", speed: 40 });
  fill(70, 11, 114, 21, "#");
  b.lever(73, 10, "D");
  b.cp(64);
  b.sign(65, 15, "Too high for anyone alone. Maybe the red panda could hop off the otter's head?");

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
  fill(128, 12, 131, 12, "S");
  b.plate(129, 11, "E");
  b.plate(135, 15, "E");
  b.gate(141, GY, "E", { need: 3, latch: true });
  b.cp(143);
  fill(147, 11, 149, 11, "S");
  b.item("KEY", 148, 10);
  b.sign(145, 15, "The den is locked. The key is on that high ledge. Stack up to reach it, then carry it to the door together!");
  b.exit(153, GY);
  return b.L;
}

// ------------------------------------------------------------------ Chapter 2
function mossyHollow() {
  const b = builder(195, "Chapter 2 · Mossy Hollow", "Crates, digging, brambles, and a race against the clock.",
    { sky: ["#5fa8a0", "#bfe3d0", "#e8f0c8"], far: ["#7fb0a0", "#98c4b2"], mid: ["#3f7a4a", "#548f5a", "#2c5e38"], bg: [150, 205, 190], fireflies: true, butterflies: true, leaves: "#6fae5a" });
  const { fill, GY } = b;
  fill(0, GY, 194, 21, "#");
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
  b.button(53, 15, "T", { timer: 4 });
  fill(59, 14, 60, 15, "#");
  b.beetle(63, 15);
  b.gate(68, GY, "T");
  b.sign(54, 15, "Timed button (□)! The gate only stays open a few seconds. Ready... set... GO!");

  b.cp(70);
  b.heavy(74, 15);
  fill(84, 12, 97, 15, "#");
  b.sign(71, 15, "A heavy crate. Push it together up against the ledge, then climb.");

  b.cp(86);
  fill(104, 14, 112, 15, "#"); fill(106, 15, 111, 15, "."); fill(104, 15, 105, 15, "D"); fill(112, 15, 112, 15, "D");
  const hazel = b.npc("HEDGEHOG", 100, 15, "Hazel", "My little hoglet wandered into the old burrow and the entrance caved in! Could your dog dig?", "My baby! Oh thank you, thank you!");
  b.item("HOGLET", 110, 15, hazel);
  b.bone(107, 15);

  b.cp(114);
  fill(122, 14, 128, 15, "#"); fill(124, 15, 127, 15, "."); fill(122, 15, 123, 15, "D");
  b.plate(127, 15, "B");
  b.gate(132, GY, "B");
  b.sign(119, 15, "This gate's plate is sealed inside that mound. Send Bear in!");
  b.beetle(137, 15); b.beetle(141, 15);

  b.cp(143);
  // conveyor gauntlet: the belt drags you back while spikes pop up and down
  fill(147, 16, 158, 16, "<");
  fill(150, 15, 150, 15, "T"); fill(153, 15, 153, 15, "T"); fill(156, 15, 156, 15, "T");
  b.sign(145, 15, "A conveyor belt that pulls you backward, and spikes that pop up and down. Time it!");
  b.beetle(162, 15);
  b.cp(160);
  b.heavy(163, 15);
  b.plate(170, 15, "H", { need: 2, w: 2 });
  fill(172, 15, 172, 15, "S");
  b.gate(175, GY, "H");
  b.sign(161, 15, "A heavy plate (red) needs lots of weight. What's the heaviest thing around?");
  b.cp(177);
  fill(180, 16, 184, 16, "X");
  fill(180, 17, 188, 19, ".");
  b.exit(186, 20);
  b.sign(178, 15, "Home is down in the hollow, under this cracked rock. Otter: jump, then R2 to SLAM!");
  return b.L;
}

// ------------------------------------------------------------------ Chapter 3
function windyRidge() {
  const b = builder(212, "Chapter 3 · Windy Ridge", "Bouncy mushrooms, moving logs, crumbly rocks and a doggy door.",
    { sky: ["#f08a5d", "#f9c38b", "#fde9c9"], far: ["#c98a9a", "#dca2ac"], mid: ["#8a6a7a", "#a07f8a", "#6a4f5f"], bg: [245, 190, 150], leaves: "#e8963c", wind: 1, birds: true });
  const { fill, GY } = b;
  fill(0, GY, 30, 21, "#");
  b.spawn(3); b.cp(1);
  b.sign(2, 15, "Windy Ridge! It only gets trickier from here.");
  fill(17, 15, 17, 15, "M");
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
  b.sign(58, 9, "Crumbly rocks fall a moment after you step on them. Keep moving!");
  const rigby = b.npc("RIGBY", 62, 9, "Rigby", "Arf! I'm Rigby! My tennis ball bounced out onto the crumbly rocks... my legs are too short to reach it!", "ARF ARF! My ball!! You're my new best friends! *zoomies*");
  b.item("BALL", 70, 9, rigby);

  b.cp(77);
  fill(80, 13, 100, 15, "."); fill(80, 10, 81, 12, ".");
  fill(84, 0, 100, 9, "S"); fill(84, 9, 88, 9, ".");
  fill(80, 15, 80, 15, "M");
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
  b.sign(103, 15, "Way too far to jump... unless you're a red panda. Red panda: jump, then R2 in mid-air to DASH!");

  b.cp(116);
  fill(119, 11, 121, 11, "S");
  b.sign(118, 15, "Something orange is stuck on that high ledge. Stack up!");
  fill(126, 16, 128, 16, ".");
  b.mover({ x0: 126 * T, y0: 16 * T, x1: 126 * T, y1: 8 * T, w: 3 * T, speed: 30 });
  fill(129, 8, 141, 15, "#");
  b.sign(124, 15, "This log goes up and down on its own. Time your jump!");
  b.beetle(135, 7);
  b.bone(140, 7);
  fill(142, 8, 150, 8, "C"); fill(142, 15, 150, 15, "^");
  fill(151, 8, 158, 15, "#");
  const clover = b.npc("BUNNY", 155, 7, "Clover", "Ohh, I'm SO hungry... I dropped my carrot on that tall rock way back there!", "*munch munch* You two are the best!");
  b.item("CARROT", 120, 10, clover);
  fill(159, 11, 160, 15, "#"); fill(161, 13, 162, 15, "#");
  b.cp(164);
  // updraft canyon: two sets of fans; a lever on each side swaps which set blows
  fill(170, 16, 189, 21, ".");
  b.lever(166, 15, "W");
  fill(171, 17, 171, 21, "#"); fill(171, 16, 171, 16, "F");
  fill(175, 17, 175, 21, "#"); fill(175, 16, 175, 16, "F");
  fill(178, 12, 180, 12, "S");
  fill(183, 17, 183, 21, "#"); fill(183, 16, 183, 16, "G");
  fill(187, 17, 187, 21, "#"); fill(187, 16, 187, 16, "G");
  fill(190, 13, 211, 21, "#");
  fill(168, 16, 169, 16, "#");
  b.lever(192, 12, "W");
  b.sign(165, 15, "Updrafts! Ride the gray fans to the ledge, then have your partner flip the lever for the blue ones.");
  b.cp(193);
  b.exit(203, 13);
  return b.L;
}

// ------------------------------------------------------------------ Chapter 4
function stormyFalls() {
  const b = builder(205, "Chapter 4 · Stormy Falls", "Everything you've learned, all at once. Stay close.",
    { sky: ["#2e3a4a", "#56687a", "#8394a3"], far: ["#3e4c5a", "#4e5e6c"], mid: ["#2f4a3a", "#3c5a48", "#22382c"], bg: [60, 74, 90], rain: true, fireflies: true, lightning: true });
  const { fill, GY } = b;
  fill(0, GY, 204, 21, "#");
  b.spawn(3); b.cp(1);
  b.sign(4, 15, "Stormy Falls. Everything you've learned, all at once. You've got this, you two ♥");

  b.button(14, 15, "S", { sync: "S" });
  fill(26, 12, 29, 12, "S");
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
  b.beetle(127, 15);
  b.button(126, 15, "Q", { timer: 4 });
  fill(128, 16, 135, 19, "W");
  b.bridge(128, 135, 15, "Q");
  const shelly = b.npc("TURTLE", 138, 15, "Shelly", "My hatchling sank to the bottom of the pond! I'm much too slow to reach...", "Oh, my little one! Bless you both.");
  b.item("BABY_TURTLE", 133, 19, shelly);
  b.sign(125, 15, "The button raises the bridge for a moment. Otters can swim down for the hatchling.");

  fill(141, 11, 143, 11, "S");
  b.item("KEY", 142, 10);
  fill(145, 0, 145, 12, "S"); fill(145, 13, 145, 15, "B");
  b.button(147, 15, "Z", { sync: "Z" });
  fill(150, 15, 150, 15, "M");
  fill(152, 10, 153, 10, "S");
  b.button(152, 9, "Z", { sync: "Z" });
  b.bone(153, 9);
  b.bone(75, 11);
  b.gate(156, GY, "Z", { latch: true });
  b.sign(144, 15, "Grab the key. Then one of you bounces up to the high button, and you press together!");

  b.cp(158);
  // storm drain: a belt shoving you toward thorns while spikes pop in a wave
  fill(160, 16, 176, 16, ">");
  fill(177, 16, 178, 18, "."); fill(177, 18, 178, 18, "^");
  fill(163, 15, 163, 15, "T"); fill(168, 15, 168, 15, "T"); fill(173, 15, 173, 15, "T");
  b.beetle(174, 15);
  b.sign(159, 15, "The storm drain! The belt shoves you toward a thorn pit. Dodge the spikes, then leap!");
  b.cp(181);
  fill(184, 16, 188, 16, "X");
  fill(184, 17, 192, 19, ".");
  b.exit(190, 20);
  b.sign(182, 15, "The den is under the cracked rock. Otter, SLAM! (Don't forget the key.)");
  return b.L;
}

export const LEVELS = [creekside, mossyHollow, windyRidge, stormyFalls];

// ------------------------------------------------------------------ Chapter 5
function lanternCaves() {
  const b = builder(200, "Chapter 5 · Lantern Caves", "Color walls, weighted pulleys and switch blocks. Think before you leap!",
    { sky: ["#1b1426", "#2e2140", "#3d2b4d"], far: ["#2a2036", "#352842"], mid: ["#3a2c46", "#46354f", "#2a2036"], bg: [30, 22, 40], fireflies: true, dark: true });
  const { fill, GY } = b;
  fill(0, GY, 199, 21, "#");
  fill(0, 0, 199, 2, "S");
  b.spawn(3); b.cp(1);
  b.sign(2, 15, "Lantern Caves! Glowing walls only let ONE of you through: brown = otter, red = red panda.");

  // color walls: each of you holds a plate for the other
  fill(12, 14, 13, 14, "#"); // floating step: walk under it to the gate
  fill(14, 3, 14, 13, "P");
  b.gate(14, GY, "A", { pillar: false, rows: 2 });
  b.plate(18, 15, "A");
  fill(22, 14, 23, 14, "#");
  fill(24, 3, 24, 13, "O");
  b.gate(24, GY, "B", { pillar: false, rows: 2 });
  b.plate(28, 15, "B");
  b.sign(8, 15, "Red panda: hop on the step and walk through the red wall. Then hold the plate for the otter!");

  // pulley: the heavier side sinks
  b.cp(29);
  b.crate(33, 15);
  fill(36, 16, 41, 21, ".");
  b.pulley(36, 39, 16, 6 * T);
  fill(42, 10, 60, 21, "#");
  b.sign(31, 15, "A pulley! The heavier platform sinks and the other one rises. Crates and Bear count as weight too.");
  b.bone(57, 9);

  // switch blocks: flip the lever to swap which blocks are solid
  b.cp(44);
  b.lever(59, 9, "K");
  fill(61, 16, 80, 21, ".");
  fill(61, 10, 66, 10, "r"); fill(67, 10, 67, 10, "S"); fill(68, 10, 72, 10, "u"); fill(73, 10, 73, 10, "S"); fill(74, 10, 80, 10, "r");
  fill(81, 10, 95, 21, "#");
  b.lever(82, 9, "K");
  b.sign(56, 9, "Switch blocks! The lever swaps pink and blue. Wait on the stone steps and call out when to flip it.");

  // two-seat lift
  b.cp(83);
  fill(103, 16, 105, 16, ".");
  b.mover({ x0: 103 * T, y0: 16 * T, x1: 103 * T, y1: 6 * T, w: 3 * T, riders: 2, speed: 35 });
  fill(106, 6, 125, 15, "#");
  b.sign(99, 15, "This lift only rises with two riders aboard.");
  b.beetle(112, 5);
  const luna = b.npc("BAT", 130, 14, "Luna", "Eee! My pup fluttered up onto the high rocks and is too scared to fly down!", "Eee-eee! Thank you, sweet friends!");
  b.item("BAT_PUP", 118, 5, luna);

  // otter-only pocket with the key, then a synced color-wall gate
  b.cp(127);
  // otter-only shelf room above a low tunnel everyone can walk through
  fill(134, 3, 134, 13, "O"); fill(139, 3, 139, 13, "S"); fill(134, 14, 139, 14, "S");
  b.item("KEY", 137, 13);
  b.bone(136, 13);
  fill(132, 14, 133, 14, "#");
  fill(143, 14, 144, 14, "#");
  fill(145, 3, 145, 13, "P");
  b.gate(145, GY, "Z", { pillar: false, rows: 2, latch: true });
  b.button(141, 15, "Z", { sync: "Z" });
  b.button(148, 15, "Z", { sync: "Z" });
  b.sign(132, 15, "The key is behind an otter wall. Then: one button on each side of the red wall, pressed together!");
  b.cp(150);
  // ice cave: slippery floor over thorn slots, then a two-crate heavy plate
  fill(152, 16, 175, 16, "I");
  fill(157, 16, 157, 16, "^"); fill(163, 16, 164, 16, "^"); fill(170, 16, 170, 16, "^");
  b.sign(151, 15, "Ice! You'll slide. Hop the thorn slots, and don't overshoot.");
  b.beetle(167, 15);
  b.cp(177);
  b.crate(178, 15); b.crate(180, 15);
  b.plate(186, 15, "Q", { need: 2, w: 2 });
  fill(188, 15, 188, 15, "S");
  b.gate(191, GY, "Q");
  b.sign(179, 15, "A heavy plate (red). Two crates side by side should do it... push them together!");
  b.exit(195, GY);
  return b.L;
}

// ------------------------------------------------------------------ Chapter 6
function starrySummit() {
  const b = builder(205, "Chapter 6 · Starry Summit", "The final climb. Every trick you know, together, under the stars.",
    { sky: ["#0e1a3a", "#2b3f73", "#6a6fa8"], far: ["#2b3658", "#39466b"], mid: ["#1f2f4a", "#2a3d5c", "#16233a"], bg: [20, 30, 60], fireflies: true, stars: true });
  const { fill, GY } = b;
  fill(0, GY, 204, 21, "#");
  b.spawn(3); b.cp(1);
  b.sign(2, 15, "Starry Summit. The last climb! Stick together.");

  // crumble + switch-block bridge over the void
  fill(12, 16, 31, 21, ".");
  fill(12, 16, 15, 16, "C"); fill(16, 16, 16, 16, "S"); fill(17, 16, 21, 16, "u"); fill(22, 16, 22, 16, "S");
  fill(23, 16, 27, 16, "r"); fill(28, 16, 28, 16, "S"); fill(29, 16, 31, 16, "C");
  b.lever(10, 15, "K"); b.lever(33, 15, "K");
  b.sign(7, 15, "Crumbly rocks AND switch blocks. One crosses while the other works the lever, then swap!");

  // everyone aboard
  b.cp(33);
  fill(37, 16, 39, 16, ".");
  b.mover({ x0: 37 * T, y0: 16 * T, x1: 37 * T, y1: 8 * T, w: 3 * T, riders: 3, speed: 30 });
  fill(40, 8, 57, 21, "#");
  b.sign(35, 15, "Everyone aboard! This lift needs all three of you. Tell Bear to stay on it (△ twice).");

  // synced buttons across a red-panda wall
  b.cp(41);
  fill(47, 6, 48, 6, "#");
  fill(49, 0, 49, 5, "P");
  b.gate(49, 8, "Z", { pillar: false, rows: 2, latch: true });
  b.button(45, 7, "Z", { sync: "Z" });
  b.button(52, 7, "Z", { sync: "Z" });
  b.sign(43, 7, "Red panda through the red wall, otter stays here. Press your buttons at the same time!");

  // moving log, floating island, goat kid
  fill(58, 16, 88, 21, ".");
  b.mover({ x0: 58 * T, y0: 8 * T, x1: 78 * T, y1: 8 * T, w: 3 * T, speed: 40 });
  fill(82, 6, 85, 6, "S");
  b.bone(83, 5);
  fill(89, 8, 110, 21, "#");
  const pippa = b.npc("GOAT", 94, 7, "Pippa", "Maaa! My little one climbed onto that floating rock and won't come down!", "Maaa-aa! You brought her back! Bless you!");
  b.item("GOAT_KID", 84, 5, pippa);
  b.beetle(100, 7);

  // final pulley: heavy crate + Bear outweigh both of you
  b.cp(91);
  b.heavy(113, 15);
  fill(116, 16, 121, 21, ".");
  b.pulley(116, 119, 16, 8 * T);
  fill(122, 8, 165, 21, "#");
  b.sign(111, 15, "The summit! Push the heavy crate onto the left platform, add Bear... then hop on the right one together.");

  b.cp(124);
  b.bone(126, 7);
  // icy ridge with timed spikes and beetles, then a fan up to the peak
  fill(128, 8, 158, 8, "I");
  fill(134, 7, 134, 7, "T"); fill(141, 7, 141, 7, "T"); fill(148, 7, 148, 7, "T");
  b.beetle(138, 7); b.beetle(152, 7);
  b.sign(127, 7, "The icy ridge! Slippery, spiky, and the beetles don't slip at all.");
  fill(163, 7, 163, 7, "F");
  fill(166, 4, 204, 21, "#");
  b.sign(161, 7, "One last updraft, up to the peak!");
  b.cp(168);
  b.npc("RIGBY", 190, 3, "Rigby", "ARF! You made it to the top! Bear told me ALL about you two!", "ARF! You made it to the top! Bear told me ALL about you two!");
  b.exit(196, 4);
  return b.L;
}

LEVELS.push(lanternCaves, starrySummit);
