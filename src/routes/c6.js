// Starry Summit
export default ({ follow, swat, cross, bearSit, wait, until, go, hop, use, call, attack, stop, send, gateOpen, P, B, T }) => {
  const has = (art) => B.L.items.some((i) => i.art === art && (i.carrier || i.done));
  const intact = (x0, x1, y) => { for (let x = x0; x <= x1; x++) if (B.special.get(`${x},${y}`).broken) return false; return true; };
  return [
    ["crumbles + switch blocks", () => {
      go({ otter: 12, fox: 13 });
      cross("fox", 16);                 // over the crumbly rocks to the first stone
      use("otter");                      // blue on
      go({ fox: 22 }, 5);
      use("otter");                      // pink on
      go({ fox: 28 }, 5);
      cross("fox", 31);
      use("fox");                        // blue on, for the otter
      until(() => intact(14, 15, 16), 8, "rocks back");
      cross("otter", 16);
      go({ otter: 22 }, 5);
      use("fox");                        // pink on
      go({ otter: 28 }, 5);
      cross("otter", 32);
    }],
    ["three-rider lift", () => {
      follow("fox");
      go({ otter: 37, fox: 39 }, 8); P.fox.facing = 1;
      until(() => P.otter.y < 8 * T, 10, "lift up");
      go({ otter: 42, fox: 43 }, 5);
    }],
    ["sync across the red wall", () => {
      go({ otter: 45, fox: 46 }, 5);
      hop("fox", 47); go({ fox: 52 }, 5); // through the red wall
      B.tap.otter.use = true; B.tap.fox.use = true; B.step(1);
      until(() => gateOpen("Z"), 3, "gate Z");
      go({ otter: 57, fox: 56 }, 6);
    }],
    ["log, island, goat kid", () => {
      const log = B.L.movers[1];
      until(() => log.x <= 58 * T + 1, 20, "log here");
      go({ otter: 59, fox: 58 }, 3, { noJump: true });
      until(() => log.x >= 78 * T - 1, 20, "log across");
      go({ otter: 80 }, 2, { noJump: true }); hop("otter", 82, { up: 2.2 });
      hop("fox", 83, { dj: true }); go({ fox: 84 }, 3);
      until(() => has("GOAT_KID"), 2, "goat kid");
      go({ otter: 85, fox: 84 }, 3);
      hop("fox", 90, { dj: true }); hop("otter", 89);
      follow("fox");
      go({ otter: 94, fox: 93 }, 6);
      until(() => B.friends >= 1, 3, "kid home");
      swat("otter", 0, 8);
      go({ otter: 110, fox: 109 }, 8);
    }],
    ["heavy load lift", () => {
      go({ otter: 111, fox: 111 }, 6);   // drop down behind the heavy crate
      B.hold.otter.right = B.hold.fox.right = true;
      until(() => B.L.blocks[0].x >= 116 * T, 10, "heavy crate on the lift");
      stop("otter", "fox");
      go({ otter: 118, fox: 118 }, 6);   // up and over, onto the lift
      follow("fox"); P.fox.facing = 1;
      until(() => P.fox.y < 8 * T, 12, "lift up");
      go({ otter: 122, fox: 123 }, 6);
      follow("fox");
    }],
    ["icy ridge + updraft", () => {
      cross("fox", 131, [134]); cross("otter", 130, [134]);
      swat("otter", 1, 8);
      cross("fox", 145, [141]); cross("otter", 144, [141]);
      cross("fox", 150, [148]); cross("otter", 149, [148]);
      swat("otter", 2, 8);
      go({ otter: 161, fox: 160 }, 8);
      const ride = (w) => {
        const c = P[w];
        B.hold[w].right = true; B.tap[w].jump = true; B.step(1);
        until(() => { B.hold[w].right = c.x + c.w / 2 < 163 * T + 8; return c.y < 3 * T; }, 5, `${w} up the fan`);
        stop(w); go({ [w]: 168 }, 5);
      };
      ride("fox"); ride("otter");
      follow("fox");
      go({ otter: 197, fox: 197 }, 10);
      until(() => B.won, 3, "win");
    }],
  ];
};
