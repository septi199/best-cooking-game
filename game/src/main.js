// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play,
// paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURNT, EVENT_OVER, EVENT_READY, EVENT_SERVED, EVENT_TIMEOUT } from './world.js';
import { ACTION_INTERACT, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSfx } from './sfx.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sfx = createSfx();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, world.nearest());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let ticked = false;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    ticked = false;
    announce('Main. Layani pesanan sebelum waktunya habis.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift selesai. Skor ${world.state.score}. Terbaik ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_SERVED) {
      sfx.serve();
      announce(`Hidangan diantar. Skor ${world.state.score}.`);
    }
    if (events & EVENT_READY) sfx.ding();
    if (events & EVENT_BURNT) sfx.error();
    if (events & EVENT_TIMEOUT) {
      sfx.error();
      announce(`Satu pesanan hangus. ${3 - world.state.strikes} kesempatan lagi.`);
    }
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Jeda.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Lanjut main.');
      }
    }
    if (actions & ACTION_INTERACT) {
      sfx.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_PLAY) {
        const served = world.interact();
        if (served) handleEvents(EVENT_SERVED);
      }
    }
    if (screen === SCREEN_PLAY) {
      const move = input.vector();
      while (accumulator >= STEP) {
        const events = world.step(STEP, move.x, move.y);
        handleEvents(events);
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) {
          accumulator = 0;
          break;
        }
      }
      // A low beep when the shift is nearly over.
      if (world.state.shiftLeft < 10 && !ticked && world.state.shiftLeft > 0) {
        ticked = true;
        sfx.tick();
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, screen === SCREEN_PLAY ? world.nearest() : null);
  }

  // Leaving the tab pauses a running game rather than letting orders time out unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Warung Kilat. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
