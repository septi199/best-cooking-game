# Warung Kilat — game masak cepat

[![Bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?ref=xaqxgz17)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/septi199/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?ref=xaqxgz17)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/septi199/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?ref=xaqxgz17)

**Warung Kilat** is a complete, original 2D cooking game that plays offline in a
desktop browser from static files — no network, no build step, keyboard and
mouse. Entry for [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137?ref=xaqxgz17)
on make.fun.

## How it plays

You are the cook of a small Indonesian warung. Orders land on the board with a
timer: grab ingredients from the bins on the left wall, chop them on the
cutting board, cook them on the two-burner stove (don't let them burn!), assemble
the dish on the plating station, and serve it at the window before the
customer's patience runs out. Serve fast for tips, chain serves for combos, and
survive the 150-second shift — three timed-out orders and the shift ends early.

- 4 recipes: Nasi Goreng, Mie Ayam, Sate Ayam, Es Teh Manis
- 7 ingredients, each with its own prep chain (chop, cook, or serve direct)
- 2 stove burners + 1 chopping board, so you plan a route through the kitchen
- Difficulty ramps: orders spawn faster and patience shrinks as the level rises
- WebAudio beeps for chopping, serving and mistakes — no sound files

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Move with WASD or arrow keys, use a station with Space / Enter / E, or click a
station when you stand close to it. Pause with P or Esc.

## Layout

- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json` with the vendored make.fun library
- `game/` — the playable game as static files (`index.html` + `src/*.js`)
- `screenshots/` — 3 real renders of the game's own code (cover first)
- `shots.json` — the screenshot scenes and their URLs
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `serve.ts` — a tiny static server for local play-testing
