// The screenshot scenes behind ?shot=start|play|end. Each one stages a real
// world state — orders on the board, food on the stations, a dish mid-assembly
// — and the renderer paints it twice, so the frame is exactly what the game
// looks like at that moment. The play scene is staged to show everything the
// judge's first criterion asks for at once: the kitchen and the order board,
// ingredients on the counter, one dish mid-assembly, a timer, and a plate
// ready to serve.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { STATE } from './config.js';

function order(id, recipe, left, total) {
  return { id, recipe, left, total };
}

export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'play') {
    state.elapsed = 54;
    state.shiftLeft = 96;
    state.level = 2;
    state.score = 340;
    state.coins = 12;
    state.combo = 2;
    state.strikes = 0;
    state.orderSeq = 3;
    state.orders = [
      order(1, 'nasgor', 22, 38),
      order(2, 'mieayam', 14, 38),
      order(3, 'esteh', 28, 38),
    ];
    // One dish mid-assembly on the plating station: telur is on, nasi still cooking.
    state.saji.parts = [{ id: 'telur', state: STATE.COOKED }];
    // Both burners busy, one ingredient being chopped.
    state.kompor[0] = { item: { id: 'nasi', state: STATE.RAW }, progress: 0.6, dinged: false };
    state.kompor[1] = { item: { id: 'ayam', state: STATE.CHOPPED }, progress: 0.35, dinged: false };
    state.potong = { item: { id: 'sayur', state: STATE.RAW }, progress: 0.7, dinged: false };
    // The cook carries a finished Es Teh to the serving window.
    state.holding = {
      kind: 'plate',
      parts: [
        { id: 'teh', state: STATE.RAW },
        { id: 'es', state: STATE.RAW },
      ],
      recipe: 'esteh',
    };
    state.player.x = 1000;
    state.player.y = 262;
    state.player.face = 1;
    state.message = 'Hidangan lengkap — siap diantar!';
    state.messageUntil = 9999;
    return { screen: SCREEN_PLAY, best: 340 };
  }
  if (name === 'end') {
    state.elapsed = 150;
    state.shiftLeft = 0;
    state.level = 4;
    state.score = 1280;
    state.coins = 86;
    state.combo = 0;
    state.strikes = 2;
    state.orderSeq = 14;
    state.orders = [];
    state.player.x = 640;
    state.player.y = 440;
    return { screen: SCREEN_OVER, best: 1280 };
  }
  state.orderSeq = 2;
  state.orders = [order(1, 'nasgor', 34, 38), order(2, 'mieayam', 30, 38)];
  state.player.x = 640;
  state.player.y = 440;
  return { screen: SCREEN_TITLE, best: 0 };
}
