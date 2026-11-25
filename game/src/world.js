// The kitchen's state and rules: orders, stations, the cook's hands, timers and
// scoring. No drawing here — render.js paints what this module holds.

import {
  BINS, BIN_IDS, FIELD, FLOOR, INGREDIENTS, ISLAND, LEVEL, MAX_ORDERS,
  PATIENCE, PLAYER, PREP, RECIPE_IDS, RECIPES, SHIFT_SECONDS,
  SPAWN, STATIONS, STATE, STEP, STRIKES_MAX, readyState, needsStation,
} from './config.js';
import { pick } from './random.js';
import { plateRecipeId, scoreServe } from './score.js';

export const EVENT_SERVED = 1;
export const EVENT_TIMEOUT = 2;
export const EVENT_OVER = 4;
export const EVENT_READY = 8;
export const EVENT_BURNT = 16;

function binRect(id) {
  const index = BIN_IDS.indexOf(id);
  return {
    x: BINS.x,
    y: BINS.y + index * (BINS.h + BINS.gap),
    w: BINS.w,
    h: BINS.h,
  };
}

function stationRect(id) {
  const s = STATIONS[id];
  return { x: s.x, y: s.y, w: s.w, h: s.h };
}

/** Distance from a point to the edge of a rectangle (0 when inside it). */
function edgeDistance(px, py, rect) {
  const dx = Math.max(rect.x - px, 0, px - (rect.x + rect.w));
  const dy = Math.max(rect.y - py, 0, py - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createWorld(random) {
  const state = {
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 0,
    strikes: 0,
    level: 1,
    orders: [],
    nextOrderIn: 2,
    orderSeq: 0,
    player: { x: FIELD.width / 2, y: 440, face: -1 },
    holding: null,
    potong: { item: null, progress: 0, dinged: false },
    kompor: [
      { item: null, progress: 0, dinged: false },
      { item: null, progress: 0, dinged: false },
    ],
    saji: { parts: [] },
    message: '',
    messageUntil: 0,
  };

  function say(text) {
    state.message = text;
    state.messageUntil = state.elapsed + 2.2;
  }

  function spawnInterval() {
    return Math.max(SPAWN.min, SPAWN.base * Math.pow(SPAWN.perLevel, state.level - 1));
  }

  function patience() {
    return Math.max(PATIENCE.min, PATIENCE.base * Math.pow(PATIENCE.perLevel, state.level - 1));
  }

  function spawnOrder() {
    const recipe = pick(random, RECIPE_IDS);
    const total = patience();
    state.orderSeq += 1;
    state.orders.push({ id: state.orderSeq, recipe, left: total, total });
  }

  function nearest() {
    const { x, y } = state.player;
    let best = null;
    let bestDist = Infinity;
    for (const id of BIN_IDS) {
      const dist = edgeDistance(x, y, binRect(id));
      if (dist < bestDist) {
        bestDist = dist;
        best = { kind: 'bin', id };
      }
    }
    for (const id of Object.keys(STATIONS)) {
      if (id === 'bahan') continue;
      const dist = edgeDistance(x, y, stationRect(id));
      if (dist < bestDist) {
        bestDist = dist;
        best = { kind: 'station', id };
      }
    }
    return bestDist <= 92 ? best : null;
  }

  function takeIngredient(id) {
    if (state.holding) {
      say('Tangan penuh — taruh dulu.');
      return;
    }
    state.holding = { kind: 'ing', id, state: STATE.RAW };
  }

  function usePotong() {
    const slot = state.potong;
    if (slot.item && slot.progress >= 1) {
      if (state.holding) {
        say('Tangan penuh.');
        return;
      }
      state.holding = { kind: 'ing', id: slot.item.id, state: STATE.CHOPPED };
      slot.item = null;
      slot.progress = 0;
      slot.dinged = false;
      return;
    }
    if (slot.item) {
      say('Masih dipotong, tunggu sebentar.');
      return;
    }
    const held = state.holding;
    if (!held || held.kind !== 'ing' || needsStation(held.id, held.state) !== 'potong') {
      say('Butuh bahan mentah yang bisa dipotong.');
      return;
    }
    slot.item = { id: held.id, state: held.state };
    slot.progress = 0;
    slot.dinged = false;
    state.holding = null;
  }

  function useKompor() {
    const held = state.holding;
    if (held && held.kind === 'ing') {
      if (needsStation(held.id, held.state) !== 'kompor') {
        say('Bahan ini tidak perlu dimasak.');
        return;
      }
      const free = state.kompor.find((burner) => burner.item === null);
      if (!free) {
        say('Kompor penuh — tunggu satu selesai.');
        return;
      }
      free.item = { id: held.id, state: held.state };
      free.progress = 0;
      free.dinged = false;
      state.holding = null;
      return;
    }
    if (held) {
      say('Tangan penuh.');
      return;
    }
    const done = state.kompor.find((burner) => burner.item && burner.progress >= 1);
    if (!done) {
      say('Belum ada yang matang di kompor.');
      return;
    }
    const burnt = done.progress >= 1 + PREP.burnAfter / PREP.cook;
    state.holding = { kind: 'ing', id: done.item.id, state: burnt ? STATE.BURNT : STATE.COOKED };
    done.item = null;
    done.progress = 0;
    done.dinged = false;
  }

  function useSaji() {
    const held = state.holding;
    const plate = state.saji.parts;
    const match = plateRecipeId(plate, state.orders);
    if (!held && match) {
      state.holding = { kind: 'plate', parts: plate.splice(0), recipe: match };
      say('Piring siap — antar ke jendela!');
      return;
    }
    if (!held) {
      if (plate.length > 0) {
        state.holding = { kind: 'ing', id: plate[plate.length - 1].id, state: plate[plate.length - 1].state };
        plate.pop();
      } else {
        say('Piring masih kosong.');
      }
      return;
    }
    if (held.kind !== 'ing') {
      say('Tanganmu memegang piring.');
      return;
    }
    if (held.state !== readyState(held.id)) {
      say(`${INGREDIENTS[held.id].name} belum siap — ${needsStation(held.id, held.state) === 'potong' ? 'potong dulu.' : 'masak dulu.'}`);
      return;
    }
    const wanted = new Set();
    for (const order of state.orders) for (const part of RECIPES[order.recipe].parts) wanted.add(part);
    if (!wanted.has(held.id)) {
      say('Tidak ada pesanan yang butuh itu.');
      return;
    }
    if (plate.some((part) => part.id === held.id)) {
      say('Sudah ada di piring.');
      return;
    }
    plate.push({ id: held.id, state: held.state });
    state.holding = null;
    if (plateRecipeId(plate, state.orders)) say('Hidangan lengkap — siap diantar!');
  }

  function useAntar() {
    const held = state.holding;
    if (!held) {
      say('Bawa dulu piring yang sudah lengkap.');
      return null;
    }
    if (held.kind !== 'plate') {
      say('Yang diantar itu hidangan, bukan bahan.');
      return null;
    }
    const order = state.orders.find((item) => item.recipe === held.recipe);
    if (!order) {
      say('Pesanan itu sudah tidak ada.');
      return null;
    }
    const served = scoreServe(order, state.combo);
    state.score += served.points;
    state.coins += RECIPES[order.recipe].price;
    state.combo += 1;
    state.orders = state.orders.filter((item) => item.id !== order.id);
    state.holding = null;
    return { served: RECIPES[order.recipe].name, points: served.points };
  }

  function useSampah() {
    if (state.holding) {
      state.holding = null;
      say('Dibuang.');
      return;
    }
    if (state.saji.parts.length > 0) {
      state.saji.parts = [];
      say('Piring dikosongkan.');
      return;
    }
    say('Tidak ada yang dibuang.');
  }

  function interact() {
    const target = nearest();
    if (!target) {
      say('Dekati stasiun dulu.');
      return null;
    }
    if (target.kind === 'bin') {
      takeIngredient(target.id);
      return null;
    }
    if (target.id === 'potong') usePotong();
    else if (target.id === 'kompor') useKompor();
    else if (target.id === 'saji') useSaji();
    else if (target.id === 'antar') return useAntar();
    else if (target.id === 'sampah') useSampah();
    return null;
  }

  /** Move the cook, pushing them out of stations, the island and the walls. */
  function move(dx, dy, dt) {
    const player = state.player;
    const nextX = clamp(player.x + dx * PLAYER.speed * dt, FLOOR.x + PLAYER.radius, FLOOR.x + FLOOR.w - PLAYER.radius);
    const nextY = clamp(player.y + dy * PLAYER.speed * dt, FLOOR.y + PLAYER.radius, FLOOR.y + FLOOR.h - PLAYER.radius);
    const solids = [
      { x: ISLAND.x, y: ISLAND.y, w: ISLAND.w, h: ISLAND.h },
      ...Object.keys(STATIONS).filter((id) => id !== 'bahan').map(stationRect),
      ...BIN_IDS.map(binRect),
    ];
    let x = nextX;
    let y = nextY;
    for (const rect of solids) {
      const inside =
        x > rect.x - PLAYER.radius && x < rect.x + rect.w + PLAYER.radius &&
        y > rect.y - PLAYER.radius && y < rect.y + rect.h + PLAYER.radius;
      if (!inside) continue;
      const pushLeft = x - (rect.x - PLAYER.radius);
      const pushRight = rect.x + rect.w + PLAYER.radius - x;
      const pushUp = y - (rect.y - PLAYER.radius);
      const pushDown = rect.y + rect.h + PLAYER.radius - y;
      const smallest = Math.min(pushLeft, pushRight, pushUp, pushDown);
      if (smallest === pushLeft) x = rect.x - PLAYER.radius;
      else if (smallest === pushRight) x = rect.x + rect.w + PLAYER.radius;
      else if (smallest === pushUp) y = rect.y - PLAYER.radius;
      else y = rect.y + rect.h + PLAYER.radius;
    }
    if (dx !== 0) player.face = dx > 0 ? 1 : -1;
    player.x = x;
    player.y = y;
  }

  function step(dt, mx, my) {
    let events = 0;
    state.elapsed += dt;
    state.shiftLeft = Math.max(0, state.shiftLeft - dt);
    state.level = Math.min(LEVEL.max, Math.floor(state.elapsed / LEVEL.seconds) + 1);

    if (mx !== 0 || my !== 0) move(mx, my, dt);

    state.nextOrderIn -= dt;
    if (state.nextOrderIn <= 0 && state.orders.length < MAX_ORDERS) {
      spawnOrder();
      state.nextOrderIn = spawnInterval();
    }

    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.left -= dt;
      if (order.left <= 0) {
        state.orders.splice(index, 1);
        state.strikes += 1;
        state.combo = 0;
        events |= EVENT_TIMEOUT;
        say(`Pesanan ${RECIPES[order.recipe].name} hangus!`);
        if (state.strikes >= STRIKES_MAX) events |= EVENT_OVER;
      }
    }

    const slot = state.potong;
    if (slot.item && slot.progress < 1) {
      slot.progress += dt / PREP.chop;
      if (slot.progress >= 1 && !slot.dinged) {
        slot.dinged = true;
        events |= EVENT_READY;
      }
    }
    for (const burner of state.kompor) {
      if (!burner.item || burner.progress >= 1 + PREP.burnAfter / PREP.cook) continue;
      burner.progress += dt / PREP.cook;
      if (burner.progress >= 1 && !burner.dinged) {
        burner.dinged = true;
        events |= EVENT_READY;
      }
      if (burner.progress >= 1 + PREP.burnAfter / PREP.cook) {
        events |= EVENT_BURNT;
        say('Ada yang gosong di kompor!');
      }
    }

    if (state.shiftLeft <= 0) events |= EVENT_OVER;
    if (state.message && state.elapsed > state.messageUntil) state.message = '';
    return events;
  }

  function reset() {
    const fresh = createWorld(random).state;
    for (const key of Object.keys(state)) {
      if (key === 'player') state.player = fresh.player;
      else state[key] = fresh[key];
    }
  }

  return { state, step, interact, reset, nearest, plateRecipeId: (parts) => plateRecipeId(parts, state.orders) };
}
