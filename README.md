# Creekside 🦦🦊🐾

A couch co-op pixel puzzle-platformer for two, built on [Emerald Engine](https://github.com/vahan-gev/emeraldengine).
Play as an **otter** and a **red fox** (plus **Bear**, a black & white mini aussiedoodle) and solve puzzles that need both of you.
Inspired by *It Takes Two* and *Pico Park*.

## Run
```
npm install
npm run dev
```
Open the URL it prints (Chrome/Edge). Plug in two PS5 controllers and press any button on each so the browser detects them: controller 1 is the otter, controller 2 is the fox.

| | Otter (pad 1 / keyboard) | Fox (pad 2 / keyboard) |
|---|---|---|
| Move | left stick / WASD | left stick / ← → |
| Jump | ✕ / Space (swim up in water) | ✕ / ↑ (double jump) |
| Lever | □ / F | □ / . |
| Call Bear / make him stay | △ / E | △ / , |
| ♥ | L1·R1 / Q | L1·R1 / / |
| Back to checkpoint | Share / R | Share |

## Chapter 1: Creekside
1. **Twin gates**: hold a pressure plate so your partner can get through, then swap.
2. **Bear's plate**: one plate and three of you. Tell Bear to *stay* on it.
3. **The creek**: foxes can't swim. The otter dives for a lever that raises a log bridge.
4. **The cliff**: too high for anyone alone. The fox jumps off the otter's head, then pulls a lever to lift the elevator.
5. **The boulder**: it only moves when you both push at once, and it fills the thorn pit.
6. **Bear's meadow**: three plates (one only the fox can reach), then a shared key on a tall pillar to carry to the den.

## Ideas for next chapters
- Tether rope between the two (Pico Park): swing, and pull your partner up
- Seesaw / weight puzzles (otter heavier than fox)
- Fox-only small tunnels, otter-only currents
- Bear fetches sticks to a switch; Bear digs in soft dirt
- Moving-screen chase section; shared-screen "both must press at the same time" doors
- Real sound effects and music

Art is all procedural pixel art in `src/art.js` (ASCII sprite grids). Level layout is in `src/level.js`.
