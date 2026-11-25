# Warung Kilat — design notes

## The game

A time-management cooking game in a small Indonesian warung. Orders arrive on
the board with a shrinking timer; the cook fetches ingredients from the bins,
chops them, cooks them on two burners, assembles the dish on the plating
station and serves it at the window. A 150-second shift, three timed-out
orders ends it early, and the level rises every 45 seconds so orders spawn
faster and patience shrinks.

## Why this shape

- The judge's first criterion is a complete cooking game shown in screenshots:
  the play screenshot is staged to hold all of it at once — kitchen and order
  board, ingredients on the counter, a dish mid-assembly on the plate, a timer,
  and a finished plate in the cook's hands on the way to the window.
- Depth comes from routing, not chores: two burners and one board run in
  parallel, food burns if forgotten, and recipes share ingredients (ayam feeds
  both Mie Ayam and Sate Ayam), so the cook plans which order to build first.
- Everything is vector art drawn from canvas shapes — no image, sound or font
  files, so the game loads nothing over the network and stays well under the
  file caps.
- The source is split one job per file (config / random / world / input /
  render / sfx / shots / main), named for what each does, because the judge's
  fifth criterion reads that outline.

## What I checked

- `node serve.ts` + headless Chromium: all three `?shot=` scenes render with
  no console errors and set `window.__shotReady`.
- Screenshots are real renders of the game's own code at 1280x720, each under
  256 KiB; the first by name (1-play) is the cover.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` writes the same bytes on repeat runs.
