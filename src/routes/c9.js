// Frozen Lake
export default ({ cross, bearSit, wait, until, go, hop, use, call, stop, gateOpen, P, B, T }) => {
  const has = (art) => B.L.items.some((i) => i.art === art && (i.carrier || i.done));
  return [
    ["frozen lake", () => {
      go({ otter: 5, fox: 6 });
      for (const tx of [15, 22, 30]) { cross("fox", tx, [12, 18, 25]); cross("otter", tx - 1, [12, 18, 25]); }
    }],
    ["caged crate", () => {
      go({ otter: 36, fox: 31 });
      B.hold.fox.right = true; B.tap.fox.jump = true; B.step(1); // onto the mushroom: boing
      until(() => { B.hold.fox.right = P.fox.x < 32 * T + 2; return P.fox.vy < -300; }, 3, "bounce");
      stop("fox");
      until(() => P.fox.y < 9 * T, 3, "rise");
      go({ fox: 34 }, 4);
      use("fox");                    // drop the crate...
      until(() => B.L.plates.find((p) => p.ch === "A").down, 4, "crate on the plate");
      use("fox");                    // ...and reopen the blue door
      until(() => gateOpen("A"), 3, "gate A");
      go({ fox: 37 }, 6);
      go({ otter: 49, fox: 48 }, 10);
    }],
    ["snow bridge", () => {
      go({ otter: 48, fox: 53 });
      use("otter");
      cross("fox", 69);
      go({ otter: 53 });
      use("fox");
      cross("otter", 68);
      go({ otter: 81, fox: 83 }, 6);
    }],
    ["heavy crate stack", () => {
      call("fox");
      go({ otter: 84, fox: 85 });
      B.hold.otter.right = B.hold.fox.right = true;
      until(() => B.L.blocks[1].x >= 95 * T, 12, "heavy crate under the perch");
      stop("otter", "fox");
      go({ otter: 93, fox: 92 });
      hop("otter", 96);
      hop("fox", 95, { dj: true });
      hop("fox", 96);
      hop("fox", 98, { dj: true, up: 3 }); go({ fox: 99 });
      until(() => has("KEY") && has("OWLET"), 3, "key + owlet");
      go({ fox: 100 }); go({ fox: 75 }, 12);
      until(() => B.friends >= 1, 3, "owlet home");
      go({ otter: 99, fox: 92 }, 10);
    }],
    ["exit", () => {
      go({ fox: 101 }, 8);
      cross("fox", 108);
      go({ otter: 107 }, 8);
      go({ otter: 116, fox: 116 }, 8);
      until(() => B.won, 3, "win");
    }],
  ];
};
