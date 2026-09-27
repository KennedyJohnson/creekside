# Creekside (repo: KennedyJohnson/creekside; local folder otter-fox-coop)

Couch co-op pixel puzzle-platformer (otter + red panda + Bear the dog) on the `emeraldengine` npm package, built with Vite. Deployed to GitHub Pages by `.github/workflows/pages.yml` (Node 22, `npm ci && npm run build`). No data, nothing goes stale.

- `index.html` / `game.html` entry points; `src/main.js` (game loop, characters, mechanics), `src/level.js`, `src/art.js` (pixel art), `src/audio.js`, `src/routes/c1..c10.js` (chapter levels), `src/playtest.js` (playtest bot - see README "Playtest bot").
- `npm run dev` / `npm run build`. Default branch is `master`.
