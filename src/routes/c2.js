// Mossy Hollow
export default ({ follow, cross, bearSit, wait, until, go, hop, use, call, attack, stop, send, gateOpen, P, B, T }) => {
  const has = (art) => B.L.items.some((i) => i.art === art && (i.carrier || i.done));
  const sendBear = (w, dir) => {
    if (B.bear.target !== P[w]) call(w);
    until(() => Math.abs(B.bear.x - P[w].x) < 34 && Math.abs(B.bear.y - P[w].y) < 20 && B.bear.onGround, 6, "Bear close");
    send(w, dir);
  };
  return [
    ["beetle + dig", () => {
      go({ otter: 7, fox: 6 });
      attack("otter", 1);
      go({ otter: 16, fox: 15 }, 8);
      sendBear("otter", 1);
      until(() => B.L.grid[15][19] === ".", 6, "Bear digs through");
      follow("otter");
      go({ otter: 22, fox: 21 }, 8);
    }],
    ["two plates, one crate", () => {
      go({ otter: 24 });
      go({ otter: 28 }, 8, { noJump: true }); // crate onto the first plate
      bearSit("otter", 31);
      until(() => gateOpen("A"), 4, "gate A");
      go({ otter: 36, fox: 35 }, 8);
      follow("fox");
    }],
    ["thorn gap", () => {
      go({ otter: 37 });
      go({ otter: 44 }, 8, { noJump: true }); // shove both crates into the thorns
      until(() => B.L.blocks.filter((k) => k.y >= 16 * T - 1).length >= 2, 6, "crates in the gap");
      go({ otter: 45, fox: 44 }, 8); hop("otter", 48); hop("fox", 48);
    }],
    ["brambles", () => {
      go({ otter: 48 }); attack("otter", 1);
      go({ otter: 51, fox: 52 }, 8);
    }],
    ["timed gate", () => {
      go({ otter: 53, fox: 54 });
      use("otter");
      go({ otter: 70, fox: 71 }, 6);
    }],
    ["heavy crate climb", () => {
      go({ otter: 72, fox: 72 });
      B.hold.otter.right = B.hold.fox.right = true;
      until(() => B.L.blocks.find((k) => k.need === 2).x >= 82 * T - 1, 10, "heavy crate to the ledge");
      stop("otter", "fox");
      hop("fox", 83);                       // red panda on the heavy crate: a step for the otter
      hop("otter", 82); hop("otter", 83);  // otter onto the red panda
      hop("otter", 85, { up: 2 });
      hop("fox", 86, { dj: true });
      follow("fox");
      go({ otter: 96, fox: 97 }, 8);
    }],
    ["burrow + hoglet", () => {
      go({ otter: 102, fox: 101 }, 8);
      sendBear("otter", 1);
      until(() => B.L.grid[15][105] === ".", 6, "burrow open");
      go({ otter: 111 }, 8);
      until(() => has("HOGLET"), 3, "hoglet");
      go({ otter: 101 }, 8);
      until(() => B.friends >= 1, 3, "hoglet home");
      follow("otter");
      go({ otter: 116, fox: 115 }, 8);
    }],
    ["crate on the dirt pillar", () => {
      go({ otter: 119, fox: 118 });
      sendBear("otter", 1);
      until(() => gateOpen("B"), 8, "gate B");
      follow("otter");
      go({ otter: 134, fox: 133 }, 8);
      cross("otter", 142); go({ fox: 141 }, 8);
      cross("otter", 144); go({ fox: 143 });
    }],
    ["belt", () => {
      cross("fox", 159, [150, 153, 156]);
      cross("otter", 159, [150, 153, 156]);
      cross("fox", 161); go({ otter: 160 });
    }],
    ["heavy plate", () => {
      go({ otter: 161, fox: 162 });
      B.hold.otter.right = B.hold.fox.right = true;
      until(() => B.L.blocks.find((k) => k.need === 2 && k.x > 160 * T).x >= 170 * T - 1, 10, "heavy on the plate");
      stop("otter", "fox");
      bearSit("otter", 168);
      until(() => gateOpen("H"), 4, "gate H");
      go({ otter: 170, fox: 171 }, 8); // over the crate
      go({ otter: 179, fox: 178 }, 8);
      follow("fox");
    }],
    ["slam + home", () => {
      go({ otter: 181, fox: 178 });
      B.tap.otter.jump = true; B.step(1);
      until(() => P.otter.vy > 0, 2, "apex"); B.tap.otter.special = true;
      until(() => B.L.grid[16][181] === ".", 3, "rock broken");
      go({ otter: 187, fox: 187 }, 8);
      until(() => B.won, 3, "win");
    }],
  ];
};
