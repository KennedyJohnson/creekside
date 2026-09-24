// Sunken Grotto
export default ({ bearSit, wait, until, go, hop, use, call, attack, stop, gateOpen, P, B, T }) => {
  const swimUp = () => { // surface and hop out
    B.hold.otter.up = true;
    for (let i = 0; i < 40 && P.otter.inWater; i++) { B.tap.otter.jump = true; B.step(6); }
    B.hold.otter.up = false;
  };
  const has = (art) => B.L.items.some((i) => i.art === art && (i.carrier || i.done));
  return [
    ["swim under the gate", () => {
      go({ otter: 8, fox: 9 });
      B.hold.otter.down = true;
      go({ otter: 13 }, 8);
      until(() => has("BABY_TURTLE"), 4, "baby turtle");
      go({ otter: 24 }, 10);
      B.hold.otter.down = false;
      B.hold.otter.up = true;
      until(() => P.otter.y < 16 * T + 1, 5, "surface");
      B.hold.otter.up = false;
      hop("otter", 26);
      go({ otter: 29 }, 8, { noJump: true }); // push the crate onto the plate, up against the post
      until(() => gateOpen("A") && B.L.bridges[0].rise > 0.95, 4, "gate A + bridge");
      go({ fox: 29 }, 12);
      go({ otter: 35, fox: 36 }, 8);
      until(() => B.friends >= 1, 2, "turtle thanked");
    }],
    ["pulley", () => {
      bearSit("otter", 37); // keep Bear off the scales for now
      go({ otter: 40, fox: 38 }, 8);
      hop("otter", 45);
      until(() => B.L.movers[1].y > 19 * T, 4, "otter's side sinks");
      go({ fox: 41 });
      hop("fox", 42, { dj: true, up: 3.9 });
      go({ fox: 42 }); P.fox.facing = -1;
      call("fox");
      until(() => B.bear.ground === B.L.movers[0], 6, "Bear onto the fox's side");
      until(() => B.otter.y < 12 * T, 8, "otter lifted");
      go({ otter: 50 });
    }],
    ["pulley: fox up", () => {
      call("fox"); // Bear: stay on the sunk side so the otter's side stays up
      if (B.bear.mode !== "stay") throw new Error("Bear didn't sit");
      hop("fox", 41, { dj: true, up: 4.0 });
      go({ fox: 41 });
      hop("fox", 44, { dj: true, noSettle: true });
      hop("fox", 48, { dj: true });
      call("fox");
      go({ otter: 56, fox: 55 }, 8);
    }],
    ["switch floor", () => {
      go({ otter: 60, fox: 61 }, 8);
      B.hold.otter.down = true;
      go({ otter: 79 }, 10);
      until(() => P.otter.y > 19 * T, 5, "otter at the lever");
      go({ fox: 66 }, 6);
      const leap = (tx, dj) => {
        B.hold.fox.right = true; B.tap.fox.jump = true; B.step(1);
        let flipped = false, djd = false;
        until(() => {
          if (!flipped && P.fox.x > tx * T - 40) { B.tap.otter.use = true; flipped = true; }
          if (dj && !djd && P.fox.vy > -20) { B.tap.fox.jump = true; djd = true; }
          return P.fox.onGround && P.fox.x > tx * T;
        }, 4, `fox leap to ${tx}`);
        stop("fox");
      };
      leap(68); go({ fox: 77 }, 6);
      leap(79); go({ fox: 82 }, 6);
      leap(84, true); go({ fox: 94 }, 8);
      go({ otter: 91 }, 8);
      until(() => has("KEY"), 4, "key");
      B.hold.otter.down = false;
      go({ otter: 80 }, 8);
      B.hold.otter.up = true;
      until(() => !P.otter.inWater || P.otter.y < 16 * T + 2, 5, "otter to the surface");
      B.tap.otter.jump = true; B.hold.otter.right = true;
      until(() => P.otter.onGround && P.otter.x > 83 * T, 4, "otter onto the blue blocks");
      B.hold.otter.up = false; stop("otter");
      go({ otter: 97, fox: 98 }, 10);
    }],
    ["slam the cracked floor", () => {
      attack("fox", 1);
      go({ otter: 104, fox: 101 }, 8);
      B.tap.otter.jump = true; B.step(1);
      until(() => P.otter.vy > 0, 2, "apex"); B.tap.otter.special = true;
      until(() => B.L.plates.find((p) => p.ch === "C").down, 4, "crate on the plate");
      if (P.otter.y > 17.5 * T) hop("otter", 104, { noSettle: true }); // up onto the crate...
      hop("otter", 102, { up: 2.2 }); // ...and out
      go({ otter: 103 }); hop("otter", 107);
      go({ fox: 103 }); hop("fox", 108);
      go({ otter: 116, fox: 117 }, 8);
    }],
    ["everyone on the scale", () => {
      go({ fox: 117 });
      hop("fox", 119, { dj: true, up: 4.1 });
      go({ fox: 123 }, 8, { noJump: false }); // shove the crate off the shelf
      until(() => B.L.blocks.at(-1).y >= 15 * T - 1, 3, "crate down");
      go({ fox: 119 }, 8);
      go({ otter: 121 }, 8);
      go({ otter: 126 }, 8, { noJump: true });
      go({ fox: 123 }, 8, { noJump: true });
      bearSit("fox", 124);
      until(() => gateOpen("E"), 4, "gate E");
    }],
    ["exit", () => {
      call("fox");
      go({ otter: 141, fox: 141 }, 10);
      until(() => B.won, 3, "win");
    }],
  ];
};
