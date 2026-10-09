# Creekside 🦦🦊🐾

**▶ Play it: https://kennedyjohnson.github.io/creekside/**

A couch co-op pixel puzzle-platformer for two, built on [Emerald Engine](https://github.com/vahan-gev/emeraldengine).
Play as an **otter** and a **red panda**, with **Bear**, a black & white mini aussiedoodle, helping along the way.
Solve puzzles that need all three of you, and help lost woodland friends get home.
Inspired by *It Takes Two* and *Pico Park*.

## How to play
Open the link in any modern browser. No controllers needed: the keyboard works for everyone.

- **Two players, one keyboard:** the otter uses **WASD + Space**, the red panda uses **arrow keys + .** (period), so two people can share one keyboard.
- **Two PS5 controllers:** plug them in and press any button on each so the browser detects them. Controller 1 is the otter, controller 2 is the red panda.
- **One player:** on the **Who's who?** screen press ▲ ▼ to pick one player. Then **Tab** switches between the otter and the red panda. The character you are not playing waits where they stand, and the HUD shows which one is active. Solo mode is keyboard-only for now (controllers still work for the active character, but there is no controller button to switch).

On the **Who's who?** screen, press ◀ ▶ to choose which player is the otter and which is the red panda (you can swap later from the pause menu). Press ✕ or Enter to continue, then pick a chapter with ◀ ▶ and press ✕ or Enter. Press Options or Esc to pause and adjust music, sound and other settings.

**Saved in your browser:** finished chapters unlock the next one, and the chapter select shows a ✓ on each finished chapter with your best time and friends/bones found. Reopening the game continues from your furthest unlocked chapter. Your chapter select, saved best runs and one-player setting stay in this browser only.

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
| Switch character (one player only) | Tab | Tab |

## The team
- **Otter**: swims, slams through cracked rock, and juggles a favorite pebble when idle.
- **Red panda**: double-jumps and dashes, but can't swim.
- **Together**: stand close and press L1/R1 to cuddle (the otter can gift their pebble!), stand still side by side to hold paws, or press it alone to roll over.
- **Bear**: follows whoever called him last, sits and stays on plates, digs through soft dirt, fits through doggy doors, is scared of water, and LOVES bones (find them and bring them to him). Loves pets.

## Mechanics
Pressure plates (red ones need extra weight), levers, timed and synced buttons, crates you can push in a row, heavy crates for two, pulleys, lifts that need riders, color walls only one animal can pass, switch blocks, fans that blow you upward, conveyor belts, spikes on a rhythm, ice, crumbling rocks, bounce mushrooms, brambles, cracked rock, and Bear's digging and doggy doors.

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
6. **Starry Summit**: an all-aboard lift, synced buttons, a floating island, and a lift that only rises under a heavy load.
   *Return Pippa the goat's kid.*
7. **Sunken Grotto**: flooded gates, a pulley you balance with a falling crate, a switch floor over deep water, and a scale that needs everyone.
   *Help Pearl the turtle find her baby.*
8. **Clockwork Mill**: a timed relay, lifts held by plates, a key on a very high ledge, Bear's workshop, and a belt gauntlet.
   *Get Cogsworth's hoglet down from the lift ledge.*
9. **Frozen Lake**: ice, a crate caged on switch blocks, a crumbling snow bridge with a gate halfway, and a heavy crate to stack on.
   *Rescue Mo the owl's owlet.*
10. **Thunder Peak**: the finale: pool-and-perch buttons, the great scale, updrafts, and one last scale for everyone.
   *Return Pip the goat's kid, then meet Rigby at the very top.*

Hint signs name new mechanics but don't give away solutions. If a puzzle goes wrong (a crate stuck in a pit, say), Options → Back to checkpoint resets that puzzle and calls Bear back. Stranded up ahead? Options → Warp brings whoever is ahead back to their partner (never forward, so it can't skip a puzzle). Anything you're carrying past a checkpoint (like a key) comes back to that checkpoint if you fall.

## Playtest bot
Every chapter has a scripted route in `src/routes/` that plays it with normal controls only (no warping). Run `npm run dev`, open `game.html#c=3&go&bot`, and in the console run `await __play()` for one chapter, or `__playAll()` and later `__playAllResults()` for all ten.

## Sound
Chiptune music and sound effects are synthesized live with the Web Audio API. Click or press a key once on the start screen to turn sound on for the whole session (browsers require one click or key press); M mutes.

## Development
Every push to `master` is built and deployed to GitHub Pages automatically by `.github/workflows/pages.yml`.
All art is procedural pixel art in `src/art.js` (ASCII sprite grids). Chapter layouts are in `src/level.js`, and game logic is in `src/main.js`.

## Tools used

- JavaScript
- WebGL (Emerald)
- Gamepad API
- Vite
