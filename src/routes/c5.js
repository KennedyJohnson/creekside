// Lantern Caves
export default ({ follow, swat, cross, bearSit, wait, until, go, hop, use, call, attack, stop, send, gateOpen, P, B, T }) => {
  const has = (art) => B.L.items.some((i) => i.art === art && (i.carrier || i.done));
  const K = () => B.channel("K") % 2 === 1;
  return [
    ["color walls", () => {
      go({ otter: 9, fox: 11 });
      hop("fox", 12); go({ fox: 18 }, 6);           // through the red wall, onto the plate
      until(() => gateOpen("A"), 3, "gate A");
      go({ otter: 21 }, 6);
      hop("otter", 22); go({ otter: 28 }, 6);       // through the brown wall, onto the plate
      until(() => gateOpen("B"), 3, "gate B");
      go({ fox: 30 }, 6);
      go({ otter: 33, fox: 34 }, 6);
    }],
    ["pulley", () => {
      bearSit("otter", 31);
      go({ otter: 35, fox: 34 });
      hop("otter", 38);                              // over A onto B: B sinks, A rises
      until(() => B.L.movers[1].y > 18 * T, 4, "B down");
      go({ fox: 35 });
      hop("fox", 36, { dj: true, up: 3 });           // onto A: the scale balances
      go({ fox: 36 }); P.fox.facing = -1;
      follow("fox");                                 // Bear steps onto A and tips it
      until(() => P.otter.y < 13.5 * T, 8, "otter lifted");
      go({ otter: 44 }, 4);
      follow("otter");
      hop("fox", 35, { dj: true, up: 3 });
      go({ fox: 35 }); hop("fox", 41, { dj: true });
      go({ otter: 50, fox: 49 }, 6);
      go({ otter: 57, fox: 56 }, 6);
    }],
    ["switch blocks", () => {
      go({ otter: 59, fox: 60 }, 6);
      go({ fox: 67 }, 6);                            // along the pink blocks to the first stone
      use("otter");                                  // blue on
      until(() => K(), 1, "K");
      go({ fox: 73 }, 6);
      use("otter");                                  // pink on
      go({ otter: 67 }, 6);                          // (stay within one screen of each other)
      go({ fox: 82 }, 6);
      use("fox");                                    // blue on
      go({ otter: 73 }, 6);
      use("fox");                                    // pink on
      go({ otter: 84, fox: 83 }, 6);
    }],
    ["two-seat lift", () => {
      follow("fox");
      go({ otter: 104, fox: 103 }, 8);
      until(() => P.otter.y < 7 * T, 8, "lift up");
      go({ otter: 108, fox: 107 }, 4);
      swat("otter", 0, 8);
      go({ otter: 118 }, 6);
      until(() => has("BAT_PUP"), 2, "bat pup");
      go({ otter: 125, fox: 124 }, 6);
      go({ otter: 130, fox: 128 }, 6);
      until(() => B.friends >= 1, 3, "pup home");
    }],
    ["key + sync across the red wall", () => {
      follow("fox");
      go({ otter: 131, fox: 130 }, 6);
      hop("otter", 132); go({ otter: 137 }, 6);     // through the brown wall to the key
      until(() => has("KEY"), 2, "key");
      go({ otter: 131 }, 6);                        // back out and down, then under the room
      go({ otter: 141 }, 6);
      go({ fox: 142 }); hop("fox", 143); go({ fox: 148 }, 6); // through the red wall
      B.tap.otter.use = true; B.tap.fox.use = true; B.step(1);
      until(() => gateOpen("Z"), 3, "gate Z");
      go({ otter: 151, fox: 151 }, 6);
    }],
    ["ice", () => {
      for (const tx of [160, 167, 176]) { cross("fox", tx, [157, 163, 170]); cross("otter", tx - 1, [157, 163, 170]); }
    }],
    ["two crates, heavy plate", () => {
      go({ otter: 177 }, 6);
      go({ otter: 185 }, 10, { noJump: true });
      until(() => gateOpen("Q"), 4, "gate Q");
      follow("fox");
      go({ otter: 196, fox: 196 }, 8);
      until(() => B.won, 3, "win");
    }],
  ];
};
