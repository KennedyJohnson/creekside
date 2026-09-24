// Clockwork Mill
export default ({ bearSit, wait, until, go, hop, use, call, attack, stop, send, gateOpen, P, B, T }) => {
  const has = (art) => B.L.items.some((i) => i.art === art && (i.carrier || i.done));
  return [
    ["timed relay", () => {
      go({ otter: 15, fox: 13 });
      hop("fox", 15);
      hop("fox", 17, { dj: true, up: 3 });
      use("fox"); use("otter");
      until(() => gateOpen("A"), 3, "gate A");
      go({ otter: 31, fox: 32 }, 6);
    }],
    ["lift + heavy plate", () => {
      go({ otter: 33 });
      go({ otter: 37 }, 8, { noJump: true }); // crate onto the plate
      bearSit("otter", 36);
      go({ otter: 42, fox: 41 }, 6);
      until(() => P.otter.y < 10 * T, 8, "lift up");
      until(() => gateOpen("B"), 3, "gate B");
      go({ otter: 56, fox: 54 }, 8);
      attack("otter", 1);
      go({ otter: 60, fox: 59 }, 8);
      call("fox");
      go({ otter: 64, fox: 62 }, 8);
    }],
    ["crate + stack on the lift", () => {
      go({ otter: 75 }, 8);
      go({ otter: 71 }, 8, { noJump: true }); // crate onto the lift
      hop("otter", 70); // onto the crate
      bearSit("fox", 66);
      hop("fox", 70, { dj: true }); // onto the otter as the lift sets off
      until(() => B.L.movers[1].y <= 10 * T, 8, "lift up");
      wait(0.3);
      hop("fox", 73, { dj: true, up: 3 });
      go({ fox: 74 }, 4);
      until(() => has("KEY") && has("HOGLET"), 3, "key + hoglet");
      go({ fox: 76 }, 6);
      call("fox");
      go({ otter: 73 }, 6);
      go({ otter: 79, fox: 78 }, 8);
      until(() => B.friends >= 1, 3, "hoglet home");
    }],
    ["Bear's workshop", () => {
      go({ otter: 84, fox: 85 }, 8);
      go({ fox: 87 });
      until(() => Math.abs(B.bear.x - P.fox.x) < 30 && B.bear.onGround, 6, "Bear close");
      send("fox", 1);
      until(() => gateOpen("F"), 8, "workshop gates");
      hop("fox", 90); hop("otter", 90);
      go({ otter: 97, fox: 98 }, 8);
      call("fox");
    }],
    ["belt + heavy scale", () => {
      go({ otter: 100, fox: 101 }, 8);
      const cross = (w) => { // time the spikes: run when the next ones are down
        B.hold[w].right = true;
        until(() => {
          const c = P[w], gap = [106, 110, 114].map((t) => t * T - (c.x + c.w)).find((g) => g >= 0 && g < 6);
          if (gap !== undefined && c.onGround) B.tap[w].jump = true;
          if (B.enemies.some((e) => e.alive && e.x - (c.x + c.w) < 12 && e.x > c.x && Math.abs(e.y - c.y) < 16)) { c.facing = 1; B.tap[w].attack = true; }
          return c.x > 119 * T;
        }, 10, `${w} across the belt`);
        stop(w);
      };
      cross("fox"); cross("otter");
      go({ otter: 120, fox: 119 }, 6);
      B.hold.otter.right = B.hold.fox.right = true;
      until(() => B.L.blocks.at(-1).x >= 127 * T, 10, "heavy crate onto the scale");
      stop("otter", "fox");
      go({ otter: 124 }); bearSit("otter", 125); go({ fox: 126 });
      until(() => gateOpen("H"), 4, "gate H");
      call("fox");
      go({ otter: 139, fox: 139 }, 10);
      until(() => B.won, 3, "win");
    }],
  ];
};
