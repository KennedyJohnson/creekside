# Creekside 🦦🦊🐾

**▶ Play it: https://kennedyjohnson.github.io/creekside/**

A couch co-op pixel puzzle-platformer for two, built on [Emerald Engine](https://github.com/vahan-gev/emeraldengine).
Play as an **otter** and a **red fox**, with **Bear**, a black & white mini aussiedoodle, helping along the way.
Solve puzzles that need all three of you, and help lost woodland friends get home.
Inspired by *It Takes Two* and *Pico Park*.

## How to play
Open the link in **Chrome or Edge**, plug in two PS5 controllers, and press any button on each so the browser detects them.
Controller 1 is the otter, controller 2 is the fox. Pick a chapter with ◀ ▶ and press ✕.
Progress is saved in your browser, so finished chapters unlock the next one.

| | Otter (controller 1 / keyboard) | Fox (controller 2 / keyboard) |
|---|---|---|
| Move | left stick / WASD | left stick / ← → |
| Jump | ✕ / Space (swim up in water) | ✕ / ↑ (double jump) |
| Swipe (beetles, brambles) | ○ / C | ○ / L |
| Special | R2 / G: **Slam** (in mid-air, breaks cracked rock) | R2 / K: **Dash** (crosses wide gaps) |
| Lever / button, or send Bear ahead | □ / F | □ / . |
| Call Bear / tell him to stay | △ / E | △ / , |
| Pet Bear (next to him) / ♥ | L1·R1 / Q | L1·R1 / / |
| Back to checkpoint | Share / R | Share |

## The team
- **Otter**: swims, slams through cracked rock.
- **Fox**: double-jumps and dashes, but can't swim.
- **Bear**: follows whoever called him last, sits and stays on plates, digs through soft dirt, fits through doggy doors, and is scared of water. Loves pets.

## Chapters
1. **Creekside**: pressure plates, the creek lever, stacking to climb a cliff, a boulder you push together, three plates at once, and a key.
   *Help Mama Duck find her duckling.*
2. **Mossy Hollow**: crates, crate-filled thorn pits, Bear digging, brambles, a timed button race, a heavy crate, and the otter's slam.
   *Rescue Hazel the hedgehog's hoglet from a caved-in burrow.*
3. **Windy Ridge**: bounce mushrooms, moving logs, crumbling rocks, a Bear-only doggy door, and the fox's dash.
   *Bring Clover the bunny her carrot.*
4. **Stormy Falls**: buttons you both have to press at the same moment, plus everything else combined, in the rain.
   *Save Olive the owl's owlet and Shelly the turtle's hatchling.*

## Development
Every push to `master` is built and deployed to GitHub Pages automatically by `.github/workflows/pages.yml`.
All art is procedural pixel art in `src/art.js` (ASCII sprite grids). Chapter layouts are in `src/level.js`, and game logic is in `src/main.js`.
