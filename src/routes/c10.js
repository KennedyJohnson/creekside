// Thunder Peak
export default ({ follow, cross, bearSit, wait, until, go, hop, use, call, stop, gateOpen, P, B, T }) => {
  const has = (art) => B.L.items.some((i) => i.art === art && (i.carrier || i.done));
  const ride = (w, colTx, landTx) => { // hop into a fan column, float up, drift onto a ledge
    const c = P[w];
    B.hold[w].right = true; B.tap[w].jump = true; B.step(1);
    until(() => { B.hold[w].right = c.x + c.w / 2 < colTx * T + 8; B.hold[w].left = false; return c.y < 8 * T; }, 5, `${w} up the fan`);
    stop(w);
    go({ [w]: landTx }, 5);
  };
  return [
    ["pool + perch buttons", () => {
      go({ otter: 8, fox: 9 });
      hop("fox", 16, { dj: true });
      go({ fox: 19 });
      B.hold.otter.down = true;
      go({ otter: 12 }, 8);
      until(() => P.otter.y > 18.5 * T, 5, "otter at the bottom button");
      B.hold.fox.right = true; B.tap.fox.jump = true; B.step(1);
      until(() => { B.hold.fox.right = P.fox.x < 21 * T + 2; return P.fox.vy < -300; }, 3, "bounce");
      stop("fox");
      until(() => P.fox.y < 9 * T, 3, "rise");
      go({ fox: 23 }, 4);
      B.tap.otter.use = true; B.tap.fox.use = true; B.step(1);
      until(() => gateOpen("Z"), 3, "gate Z");
      go({ otter: 14 }, 6);
      B.hold.otter.down = false; B.hold.otter.up = true;
      until(() => P.otter.y < 16 * T + 1, 5, "surface");
      B.hold.otter.up = false;
      hop("otter", 15);
      go({ otter: 31, fox: 32 }, 8);
    }],
    ["the great scale", () => {
      go({ otter: 38, fox: 39 }, 6);
      go({ otter: 45, fox: 46 }, 8);
      bearSit("otter", 43);
      go({ fox: 47 });
      hop("fox", 52, { dj: true });     // over A, onto B: B sinks
      until(() => B.L.movers[1].y > 18 * T, 5, "B sinks");
      go({ otter: 47 });
      B.hold.otter.right = true; B.step(20); stop("otter"); // drop into the pit beside B
      until(() => P.otter.onGround, 3, "otter lands");
      go({ otter: 52 }, 4);
      go({ fox: 53 }); use("fox");       // release the heavy crate onto A
      until(() => Math.abs(B.L.movers[0].y - 13 * T) < 1 && Math.abs(B.L.movers[1].y - 13 * T) < 1, 6, "scale balanced");
      go({ otter: 51 }); P.otter.facing = 1;
      follow("otter");                      // here, Bear! (he steps onto A and tips the scale)
      until(() => B.L.movers[1].y <= 7 * T + 1, 6, "B up");
      go({ otter: 57, fox: 58 }, 6);
      follow("fox");
      go({ otter: 68, fox: 69 }, 8);
    }],
    ["fans", () => {
      go({ otter: 75, fox: 73 }, 8);
      ride("otter", 79, 82); go({ otter: 83 });
      until(() => has("KEY") && has("GOAT_KID"), 3, "key + kid");
      use("fox");                                   // blue fans on
      ride("otter", 85, 88);
      go({ otter: 89 }); use("otter");              // gray fans back on
      go({ fox: 75 });
      ride("fox", 79, 82);
      use("otter");                                 // blue fans again
      ride("fox", 85, 88);
      follow("fox");
      go({ otter: 95, fox: 94 }, 6);
      cross("otter", 103); go({ fox: 104 }, 6);
      go({ otter: 106 }, 6);
      until(() => B.friends >= 1, 3, "kid home");
      go({ otter: 110, fox: 109 }, 6);
    }],
    ["everyone on the last scale", () => {
      go({ otter: 113, fox: 112 }, 8);
      hop("fox", 115, { dj: true, up: 4.1 });
      go({ fox: 119 }, 8, { noJump: true });
      until(() => B.L.blocks.at(-1).y >= 15 * T - 1, 3, "crate down");
      go({ fox: 121 }, 8, { noJump: true }); // keep shoving it onto the plate
      go({ otter: 120 }, 8);
      bearSit("fox", 119);
      until(() => gateOpen("E"), 4, "gate E");
      follow("fox");
      go({ otter: 141, fox: 141 }, 10);
      until(() => B.won, 3, "win");
    }],
  ];
};
