// Windy Ridge
export default ({ follow, cross, bearSit, wait, until, go, hop, use, call, attack, stop, send, gateOpen, P, B, T }) => {
  const has = (art) => B.L.items.some((i) => i.art === art && (i.carrier || i.done));
  const bounce = (w, mx, landTx) => { // walk onto a mushroom and ride the bounce up onto a ledge
    const c = P[w];
    B.hold[w].right = true; B.tap[w].jump = true; B.step(1);
    until(() => { B.hold[w].right = c.x < mx * T + 1; return c.vy < -300; }, 3, `${w} bounce`);
    stop(w);
    until(() => c.vy > -60, 2, "apex");
    go({ [w]: landTx }, 4);
  };
  const log = () => B.L.movers[0];
  return [
    ["mushroom", () => {
      go({ otter: 15, fox: 14 });
      bounce("otter", 17, 20);
      go({ fox: 15 }); bounce("fox", 17, 21);
    }],
    ["moving log", () => {
      go({ otter: 27, fox: 26 }, 6); attack("otter", 1);
      go({ otter: 40, fox: 39 }, 6);
      until(() => log().x <= 41 * T + 1, 10, "log at our side");
      go({ otter: 42, fox: 41 }, 3);
      until(() => log().x >= 54 * T - 1, 10, "log across");
      go({ otter: 58, fox: 57 }, 4);
    }],
    ["crumbly rocks + ball", () => {
      go({ otter: 60, fox: 62 }, 6);
      cross("fox", 77);
      until(() => has("BALL"), 1, "ball");
      until(() => [...Array(12)].every((_, i) => !B.special.get(`${64 + i},10`).broken), 8, "rocks grown back");
      B.hold.fox.left = true;
      until(() => P.fox.x < 63 * T && P.fox.onGround, 6, "back across"); stop("fox");
      until(() => B.friends >= 1, 2, "Rigby's ball");
      wait(1); until(() => [...Array(12)].every((_, i) => !B.special.get(`${64 + i},10`).broken), 8, "rocks grown back");
      cross("otter", 77);
      wait(1); until(() => [...Array(12)].every((_, i) => !B.special.get(`${64 + i},10`).broken), 8, "rocks grown back");
      cross("fox", 78);
    }],
    ["doggy door", () => {
      go({ otter: 79, fox: 79 });
      hop("fox", 83); hop("otter", 82); // over the hole; Bear hops it too
      if (B.bear.mode !== "follow" || B.bear.target !== P.fox) follow("fox");
      until(() => Math.abs(B.bear.x - P.fox.x) < 34 && B.bear.onGround && B.bear.x > 81 * T, 8, "Bear close");
      send("fox", 1);
      until(() => gateOpen("F"), 8, "gate F");
      go({ otter: 81, fox: 81 }, 6);   // drop down the hole into the tunnel (mind the mushroom)
      go({ otter: 96, fox: 95 }, 8);
      attack("otter", 1);
      go({ otter: 101, fox: 100 }, 8);
      follow("fox");
    }],
    ["dash + lever bridge", () => {
      go({ fox: 105, otter: 103 }, 6);
      hop("fox", 113, { dj: true, dash: true });
      go({ fox: 114 }); use("fox");
      until(() => B.L.bridges[0].rise > 0.95, 3, "bridge");
      go({ otter: 116, fox: 117 }, 8);
    }],
    ["carrot ledge", () => {
      go({ otter: 118, fox: 116 });
      hop("fox", 118);
      hop("fox", 120, { dj: true, up: 3.2 });
      until(() => has("CARROT"), 2, "carrot");
      go({ fox: 123 }, 6);
    }],
    ["bobbing log", () => {
      go({ otter: 125, fox: 124 }, 6);
      until(() => B.L.movers[1].y >= 16 * T - 1, 10, "log down");
      go({ otter: 127, fox: 127 }, 3);
      until(() => B.L.movers[1].y <= 8 * T + 1, 10, "log up");
      go({ otter: 131, fox: 130 }, 4);
      attack("otter", 1); wait(0.3);
      go({ otter: 141, fox: 140 }, 6);
      cross("fox", 152); go({ fox: 156 }); // (and lead Bear off the rocks)
      const intact = (x0, x1, y) => { for (let x = x0; x <= x1; x++) if (B.special.get(`${x},${y}`).broken) return false; return true; };
      wait(1); until(() => intact(142, 150, 8), 8, "rocks grown back");
      cross("otter", 151);
      go({ fox: 155 }, 6);
      until(() => B.friends >= 2, 2, "carrot delivered");
    }],
    ["updrafts", () => {
      go({ otter: 166, fox: 169 }, 10);
      const ride = (w, colTx, landTx) => {
        const c = P[w];
        B.hold[w].right = true; B.tap[w].jump = true; B.step(1);
        until(() => { B.hold[w].right = c.x + c.w / 2 < colTx * T + 8; return c.y < 10 * T; }, 5, `${w} up the fan`);
        stop(w); go({ [w]: landTx }, 5);
      };
      ride("fox", 171, 179);             // gray fans up to the ledge
      use("otter");                       // blue fans on
      go({ otter: 169 });
      ride("fox", 187, 190);
      use("fox");                         // gray again for the otter
      ride("otter", 171, 179);
      use("fox");                         // blue again
      ride("otter", 187, 191);
      follow("fox");
      go({ otter: 204, fox: 204 }, 8);
      until(() => B.won, 3, "win");
    }],
  ];
};
