[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/sintaameliaa-mee/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/sintaameliaa-mee/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# Velvet Vault — The Meridian Gallery Heist

A complete, original top-down stealth heist game for the make.fun
best-heist-game-20261122-0559 bounty. Played with keyboard and mouse in a
desktop browser, from static files, with no network request.

You are Rook, a thief in a midnight coat. Cross three rooms of the Meridian
Gallery of Curiosities, lift the Crimson Star Sapphire, and reach the exit —
past patrolling guards with vision cones, sweeping security cameras, and an
alarm meter that fills whenever you are seen.

## How to play

- **WASD / arrows** — move. **Shift** sprints (loud — guards hear it).
  **C** crouches (slow, harder to spot).
- **Click** — toss a coin; nearby guards walk over to investigate.
- **Space** — drop a smoke puff; nobody can see through it.
- **E** — grab loot beside you. The sapphire opens the exit.
- **P** pause · **M** mute · **R** retry the room.

Being seen fills the alarm meter; hiding drains it. At 100% the alarm trips
and every guard hunts the last place you were seen. If a guard reaches you,
you are caught — but the room resets and the plan goes on.

## Layout

- `game/` — the game: `index.html`, `css/style.css`, and one job per file
  under `js/` (`main`, `levels`, `thief`, `guards`, `cameras`, `alarm`,
  `render`, `hud`, `input`, `audio`, `geometry`). No dependencies, no
  build step, no network.
- `screenshots/` — renders of the game's own code in a browser.
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the kit's `buildDossier`.
- `vendor/makefun-game.ts` — the kit's copy, unchanged.

## Run it locally

Serve `game/` with any static server and open `index.html` in desktop
Chrome. To build the hand-in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`?scene=cover|loot|alarm|win` starts the game in a state a real playthrough
reaches, for taking screenshots of the game itself.
