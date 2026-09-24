// Creekside
export default ({ follow, bearSit, wait, until, go, hop, use, call, attack, bearStay, send, gateOpen, P, B, T, tileOf }) => [
  ["beetle + bone", () => {
    go({ otter: 9, fox: 8 });
    hop("otter", 11); // bone on the step
    go({ otter: 15, fox: 13 });
    attack("otter", 1); until(() => !B.enemies[0].alive || P.otter.x > 17 * T, 3, "beetle");
    if (B.enemies[0].alive) { go({ otter: 16 }); attack("otter", 1); }
    go({ otter: 20, fox: 18 });
  }],
  ["plates A", () => {
    go({ otter: 23, fox: 21 });
    until(() => gateOpen("A"), 3, "gate A");
    go({ fox: 32 });
    go({ otter: 30 });
  }],
  ["plate B with Bear", () => {
    go({ otter: 34, fox: 33 });
    bearSit("otter", 35);
    go({ otter: 36 }); wait(0.5);
    until(() => gateOpen("B"), 4, "gate B");
    go({ otter: 40, fox: 39 }); follow("fox");
  }],
  ["creek lever + duckling", () => {
    go({ otter: 44, fox: 43 });
    go({ otter: 52 }, 10); // swim down
    until(() => P.otter.y > 19 * T, 6, "otter to the bottom");
    use("otter");
    until(() => B.L.bridges[0].rise > 0.95, 3, "bridge");
    go({ fox: 61 }, 10);
    go({ otter: 57 }, 8);
    until(() => B.L.items.some((i) => i.art === "DUCKLING" && i.carrier), 5, "duckling");
    go({ otter: 52 }, 8); use("otter"); // lower the bridge again so the otter can climb out
    go({ otter: 60 }, 8);
  }],
  ["otter up out of the creek", () => {
    B.hold.otter.up = true;
    for (let i = 0; i < 30 && P.otter.inWater; i++) { B.tap.otter.jump = true; B.step(8); }
    B.hold.otter.up = false;
    go({ otter: 61 }, 6);
    until(() => B.friends >= 1, 3, "duck thanked");
  }],
  ["lift", () => {
    go({ otter: 64, fox: 66 });
    go({ otter: 66, fox: 64 });
    hop("fox", 66);
    wait(0.2);
    hop("fox", 71, { dj: true });
    go({ otter: 68 });
    go({ fox: 73 }); use("fox");
    until(() => P.otter.y < 11 * T, 5, "lift up");
    go({ otter: 72 });
  }],
  ["boulder", () => {
    go({ otter: 91, fox: 92 }, 15);
    B.hold.otter.right = B.hold.fox.right = true;
    until(() => B.L.blocks[0].y > 11 * T - 4, 12, "boulder into the pit");
    B.hold.otter.right = B.hold.fox.right = false;
    go({ otter: 105, fox: 107 }, 10);
  }],
  ["three plates", () => {
    go({ otter: 116, fox: 117 }, 10);
    hop("otter", 117); hop("fox", 118);
    go({ otter: 121, fox: 122 });
    bearSit("otter", 123);
    go({ otter: 128, fox: 126 });
    hop("fox", 129, { dj: true, up: 2.5 });
    go({ otter: 135 });
    until(() => gateOpen("E"), 4, "gate E");
  }],
  ["key + exit", () => {
    follow("fox");
    go({ otter: 146, fox: 144 }, 10);
    hop("fox", 146);
    wait(0.3);
    hop("fox", 148, { dj: true, up: 3.2 });
    until(() => B.L.items.some((i) => i.kind === "key" && i.carrier), 3, "key");
    go({ fox: 150 }); go({ otter: 154, fox: 155 }, 10);
    until(() => B.won, 3, "win");
  }],
];
