// Stormy Falls
export default ({ follow, swat, cross, bearSit, wait, until, go, hop, use, call, attack, stop, send, gateOpen, P, B, T }) => {
  const has = (art) => B.L.items.some((i) => i.art === art && (i.carrier || i.done));
  const bounce = (w, mx, landTx) => {
    const c = P[w];
    B.hold[w].right = true; B.tap[w].jump = true; B.step(1);
    until(() => { B.hold[w].right = c.x < mx * T + 1; return c.vy < -300; }, 3, `${w} bounce`);
    stop(w);
    until(() => c.vy > -60, 2, "apex");
    go({ [w]: landTx }, 4);
  };
  const intact = (x0, x1, y) => { for (let x = x0; x <= x1; x++) if (B.special.get(`${x},${y}`).broken) return false; return true; };
  return [
    ["sync buttons", () => {
      go({ otter: 14, fox: 25 }, 8);
      hop("fox", 27, { dj: true, up: 3.5 });
      go({ fox: 28 });
      B.tap.otter.use = true; B.tap.fox.use = true; B.step(1);
      until(() => gateOpen("S"), 3, "gate S");
      go({ otter: 36, fox: 35 }, 8);
    }],
    ["two plates, one crate", () => {
      go({ otter: 37, fox: 47 }, 8);
      go({ otter: 43 }, 8, { noJump: true });
      bearSit("fox", 46);
      until(() => gateOpen("P"), 4, "gate P");
      go({ otter: 51, fox: 50 }, 8);
      follow("fox");
    }],
    ["crate + brambles", () => {
      go({ otter: 51 });
      go({ otter: 54 }, 8, { noJump: true }); // crate into the thorns
      until(() => B.L.blocks[1].y >= 16 * T - 1, 4, "crate in the gap");
      go({ otter: 55, fox: 54 }); hop("otter", 58);
      attack("otter", 1); hop("fox", 58, { dj: true });
      swat("otter", 0, 12, 60.2);
      go({ otter: 61, fox: 59 });
    }],
    ["log, crumbly rocks, mushroom", () => {
      const log = B.L.movers[0];
      const ride = (w) => {
        until(() => log.x <= 62 * T + 1, 12, "log here");
        go({ [w]: 63 }, 3, { noJump: true });
        until(() => log.x >= 68 * T - 1, 8, "log across");
        cross(w, 77); bounce(w, 78, w === "otter" ? 81 : 82);
      };
      go({ fox: 61 }); ride("otter");
      until(() => intact(71, 77, 16), 8, "rocks back");
      ride("fox");
      follow("fox");
      go({ otter: 101, fox: 100 }, 8);
    }],
    ["heavy crate + dig", () => {
      go({ otter: 109, fox: 110 }, 8);                 // over the heavy crate; Bear catches up
      follow("fox");
      until(() => Math.abs(B.bear.x - P.fox.x) < 34 && B.bear.onGround && B.bear.x > 106 * T, 8, "Bear close");
      send("fox", 1);                                  // dig first...
      until(() => B.L.grid[15][115] === ".", 10, "Bear digs through");
      go({ otter: 102, fox: 102 }, 8);
      B.hold.otter.right = B.hold.fox.right = true;     // ...then the heavy crate onto the plate
      until(() => B.L.blocks.find((k) => k.need === 2).x >= 112 * T, 12, "heavy on the plate");
      stop("otter", "fox");
      bearSit("fox", 110);                             // ...and Bear on it too
      until(() => gateOpen("H"), 4, "gate H");
      go({ otter: 121, fox: 122 }, 8);
      follow("fox");
    }],
    ["timed bridge", () => {
      go({ otter: 125, fox: 124 }, 6);
      attack("otter", 1);
      go({ otter: 123, fox: 127 });
      use("otter");
      until(() => B.L.bridges[0].rise > 0.95, 2, "bridge up");
      go({ otter: 137, fox: 138 }, 5);
    }],
    ["key + sync + bounce", () => {
      go({ otter: 140, fox: 138 });
      hop("fox", 140);
      hop("fox", 142, { dj: true, up: 3 });
      until(() => has("KEY"), 2, "key");
      go({ fox: 144 }, 4); go({ otter: 144 }, 4);
      attack("otter", 1);
      go({ otter: 147, fox: 148 }, 6);
      bounce("fox", 150, 152);
      B.tap.otter.use = true; B.tap.fox.use = true; B.step(1);
      until(() => gateOpen("Z"), 3, "gate Z");
      go({ fox: 155 }, 4);
      go({ otter: 158, fox: 158 }, 6);
    }],
    ["storm drain + den", () => {
      const drain = (w) => { // let the belt carry you, hop each spike, then leap the pit
        const c = P[w];
        B.hold[w].right = true; B.step(20);
        until(() => {
          // in the air, drift just past the spike and no further
          B.hold[w].right = c.x > 174 * T || c.x < 160 * T || (!c.onGround && [163, 168, 173].some((t) => c.x < t * T + 18 && c.x + c.w > t * T - 8));
          const g = [163, 168, 173].map((t) => t * T - (c.x + c.w)).find((g) => g >= 0 && g < 4);
          if (c.onGround && (g !== undefined || (c.x + c.w > 176 * T && c.x < 177 * T))) B.tap[w].jump = true;
          if (B.enemies.some((e) => e.alive && e.x > c.x && e.x - (c.x + c.w) < 12 && Math.abs(e.y - c.y) < 16)) { c.facing = 1; B.tap[w].attack = true; }
          return c.x > 179 * T && c.onGround;
        }, 15, `${w} through the drain`);
        stop(w);
      };
      go({ otter: 159 });
      drain("fox"); drain("otter");
      go({ otter: 185, fox: 182 }, 6);
      B.tap.otter.jump = true; B.step(1);
      until(() => P.otter.vy > 0, 2, "apex"); B.tap.otter.special = true;
      until(() => B.L.grid[16][185] === ".", 3, "rock broken");
      go({ otter: 191, fox: 191 }, 8);
      until(() => B.won, 3, "win");
    }],
  ];
};
