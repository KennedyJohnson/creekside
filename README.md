# Creekside 🦦🦊🐾

**▶ Play it: https://kennedyjohnson.github.io/creekside/**

A couch co-op pixel puzzle-platformer for two, built on [Emerald Engine](https://github.com/vahan-gev/emeraldengine).
Play as an **otter** and a **red panda**, with **Bear**, a black & white mini aussiedoodle, helping along the way.
Solve puzzles that need all three of you, and help lost woodland friends get home.
Inspired by *It Takes Two* and *Pico Park*.

## How to play
Open the link in **Chrome or Edge**, plug in two PS5 controllers, and press any button on each so the browser detects them.
On the **Who's who?** screen, press ◀ ▶ to choose which player is the otter and which is the red panda (you can swap later from the pause menu). Press Options (or Esc) to pause and adjust music, sound and other settings. Pick a chapter with ◀ ▶ and press ✕.
Progress is saved in your browser, so finished chapters unlock the next one.

| | Otter (controller 1 / keyboard) | Red panda (controller 2 / keyboard) |
|---|---|---|
| Move | left stick / WASD | left stick / ← → |
| Jump | ✕ / Space (swim up in water) | ✕ / ↑ (double jump) |
| Swipe (beetles, brambles) | ○ / C | ○ / L |
| Special | R2 / G: **Slam** (in mid-air, breaks cracked rock) | R2 / K: **Dash** (crosses wide gaps) |
| Lever / button, or send Bear ahead | □ / F | □ / . |
| Call Bear / tell him to stay | △ / E | △ / , |
| Pet Bear · cuddle your partner · roll over | L1·R1 / Q | L1·R1 / / |
| Pause (volume, restart chapter, back to checkpoint, swap players, unlock all) | Options / Esc | Options / Esc |
| Back to checkpoint | Share / R | Share |

## The team
- **Otter**: swims, slams through cracked rock, and juggles a favorite pebble when idle.
- **Red panda**: double-jumps and dashes, but can't swim.
- **Together**: stand close and press L1/R1 to cuddle (the otter can gift their pebble!), stand still side by side to hold paws, or press it alone to roll over.
- **Bear**: follows whoever called him last, sits and stays on plates, digs through soft dirt, fits through doggy doors, is scared of water, and LOVES bones (find them and bring them to him). Loves pets.

## Chapters
1. **Creekside**: pressure plates, the creek lever, stacking to climb a cliff, a boulder you push together, three plates at once, and a key.
   *Help Mama Duck find her duckling.*
2. **Mossy Hollow**: crates, crate-filled thorn pits, Bear digging, brambles, a timed button race, a heavy crate, and the otter's slam.
   *Rescue Hazel the hedgehog's hoglet from a caved-in burrow.*
3. **Windy Ridge**: bounce mushrooms, moving logs, crumbling rocks, a Bear-only doggy door, and the red panda's dash.
   *Bring Clover the bunny her carrot, and fetch Rigby the corgi's tennis ball.*
4. **Stormy Falls**: buttons you both have to press at the same moment, plus everything else combined, in the rain.
   *Save Olive the owl's owlet and Shelly the turtle's hatchling.*
5. **Lantern Caves**: color walls only one of you can pass, weighted pulleys, switch blocks, a two-rider lift.
   *Bring Luna the bat's pup home.*
6. **Starry Summit**: the finale: an all-aboard lift, synced buttons, a floating island, and a pulley you only win by piling on weight.
   *Return Pippa the goat's kid, then meet Rigby at the top.*

## Sound
Chiptune music and sound effects are synthesized live with the Web Audio API. Click or press a key once to enable sound (browsers require it); M mutes.

## Development
Every push to `master` is built and deployed to GitHub Pages automatically by `.github/workflows/pages.yml`.
All art is procedural pixel art in `src/art.js` (ASCII sprite grids). Chapter layouts are in `src/level.js`, and game logic is in `src/main.js`.
