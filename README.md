# The Velvet Vault — a midnight museum heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/tanglangbc/velvet-vault/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/tanglangbc/velvet-vault/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A complete, original top-down stealth game that runs offline in a desktop
browser from static files. One thief, three patrolling guards with vision
cones, three sweeping security cameras, $7,300 of loot — and one diamond,
the Star of Meridian, behind a vault sensor.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server). No network, no build step.

- **Move:** WASD / arrow keys, or click anywhere to walk there
- **Sneak:** hold Shift — slower, but guards notice you half as fast
- **Grab / vent:** E near loot to steal it, E near a vent to crawl through
- **Smoke pellet:** 1 — a 5-second cloud guards and cameras can't see through
- **EMP pulse:** 2 — kills all cameras for 6 seconds, but adds 8% alarm
- **Pause:** P · **Restart:** R

Steal **$4,000** of loot, then slip out the green EXIT before the alarm
hits 100%. Three strikes — three times caught — and the crew is busted.

## The museum

- **Entrance hall** — where you come in (and where you get out)
- **Gallery A** — old masters, guarded by Marco
- **Gallery B** — gold and jade, guarded by Ivy
- **The Vault** — the Star of Meridian ($3,000), guarded by Brutus;
  lifting it trips the vault sensor (+20% alarm)

Every room has two doors in and out, and a vent crawl-space links the
entrance hall straight to the vault — for thieves who plan ahead.

## Files

- `game/index.html` — the page; `game/src/main.js` — state, loop, input
- `game/src/world.js` — the museum floor, walls, loot, geometry helpers
- `game/src/thief.js` — movement, sneaking, tools, looting
- `game/src/guards.js` — patrols, vision cones, suspicion, chases
- `game/src/cameras.js` — sweeping security cameras
- `game/src/render.js` — all drawing: floor, cones, crew, HUD, screens
- `game/src/audio.js` — tiny WebAudio synth (no sound files)
- `main.ts` — the entry program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with `vendor/makefun-game.ts`
- `screenshots/` — real renders of the game's own code in a browser

## Entry

- Competition: [best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559)
- License: MIT — see LICENSE
- Referral: https://make.fun/r/NVRADX
