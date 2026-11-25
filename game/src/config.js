// Warung Kilat — every tuning number, colour, recipe and station in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Length of one shift, in seconds. When it hits zero the shift ends. */
export const SHIFT_SECONDS = 150;

/** Failed orders (timed out) that end the shift early. */
export const STRIKES_MAX = 3;

/** Orders on the board at once, at most. */
export const MAX_ORDERS = 3;

export const PLAYER = {
  radius: 22,
  speed: 340,
};

/** How close the cook must be to a station to use it (from its edge, in pixels). */
export const REACH = 92;

/** Seconds between order spawns at level 1; multiplied down as the level rises. */
export const SPAWN = { base: 12, perLevel: 0.9, min: 7 };

/** Order patience in seconds at level 1; multiplied down as the level rises. */
export const PATIENCE = { base: 38, perLevel: 0.94, min: 22 };

/** Seconds of chopping, cooking and the grace period before food burns. */
export const PREP = { chop: 1.2, cook: 3.0, burnAfter: 3.0 };

/** Seconds of play per level; level stops growing at the cap. */
export const LEVEL = { seconds: 45, max: 5 };

/** Points for a served order, plus a tip of up to TIP_MAX by time left. */
export const SCORE = { base: 100, tipMax: 50, comboEach: 10 };

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'warung-kilat.best';

// ---------------------------------------------------------------------------
// Ingredients. Each one knows which stations it must visit, in order:
//   raw -> chop? -> cook? -> ready to plate. "direct" needs no prep at all.
// ---------------------------------------------------------------------------

export const INGREDIENTS = {
  nasi: { name: 'Nasi', color: '#f5f0e1', dark: '#cbbf9a', prep: ['cook'], price: 6 },
  mie: { name: 'Mie', color: '#f2c94c', dark: '#b98a1d', prep: ['cook'], price: 7 },
  ayam: { name: 'Ayam', color: '#e8833a', dark: '#9c4a12', prep: ['chop', 'cook'], price: 9 },
  telur: { name: 'Telur', color: '#fdfdfd', dark: '#d8d2c0', prep: ['cook'], price: 5 },
  sayur: { name: 'Sayur', color: '#58b368', dark: '#2c6e38', prep: ['chop'], price: 4 },
  teh: { name: 'Teh', color: '#c98a2e', dark: '#7a4d12', prep: ['direct'], price: 4 },
  es: { name: 'Es', color: '#7fd4e8', dark: '#3d8fa8', prep: ['direct'], price: 3 },
};

/** The state an ingredient is in. "burnt" can only be thrown away. */
export const STATE = { RAW: 'raw', CHOPPED: 'chopped', COOKED: 'cooked', BURNT: 'burnt' };

/** What a prepared ingredient must look like before it may go on a plate. */
export function readyState(id) {
  const prep = INGREDIENTS[id].prep;
  if (prep.includes('cook')) return STATE.COOKED;
  if (prep.includes('chop')) return STATE.CHOPPED;
  return STATE.RAW;
}

/** True when the ingredient still needs the named station. */
export function needsStation(id, state) {
  if (state === STATE.BURNT) return null;
  const prep = INGREDIENTS[id].prep;
  if (prep.includes('chop') && state === STATE.RAW) return 'potong';
  if (prep.includes('cook') && state !== STATE.COOKED) return 'kompor';
  return null;
}

// ---------------------------------------------------------------------------
// Recipes: the dishes on the menu. `parts` lists ingredient ids; a plate is
// complete when it holds exactly those, each in its ready state.
// ---------------------------------------------------------------------------

export const RECIPES = {
  nasgor: {
    name: 'Nasi Goreng',
    parts: ['nasi', 'telur'],
    price: 15,
    color: '#e8833a',
  },
  mieayam: {
    name: 'Mie Ayam',
    parts: ['mie', 'ayam', 'sayur'],
    price: 20,
    color: '#f2c94c',
  },
  sate: {
    name: 'Sate Ayam',
    parts: ['ayam', 'sayur'],
    price: 18,
    color: '#c65b4e',
  },
  esteh: {
    name: 'Es Teh Manis',
    parts: ['teh', 'es'],
    price: 8,
    color: '#7fd4e8',
  },
};

export const RECIPE_IDS = ['nasgor', 'mieayam', 'sate', 'esteh'];

// ---------------------------------------------------------------------------
// Stations. Each is a rectangle on the kitchen floor with a label and a job.
// The ingredient bins run down the left wall; the work stations sit along the
// bottom; the serving window and the trash sit on the right and top-left.
// ---------------------------------------------------------------------------

export const STATIONS = {
  bahan: { label: 'BAHAN', hint: 'Ambil bahan' },
  potong: { label: 'POTONG', hint: 'Potong bahan', x: 300, y: 480, w: 220, h: 140 },
  kompor: { label: 'KOMPOR', hint: 'Masak bahan', x: 760, y: 480, w: 240, h: 140 },
  saji: { label: 'SAJI', hint: 'Rakit di piring', x: 540, y: 480, w: 200, h: 140 },
  antar: { label: 'ANTAR', hint: 'Antar pesanan', x: 1040, y: 130, w: 200, h: 110 },
  sampah: { label: 'SAMPAH', hint: 'Buang', x: 1040, y: 500, w: 200, h: 120 },
};

/** The ingredient bins down the left wall, one per ingredient, in menu order. */
export const BIN_IDS = ['nasi', 'mie', 'ayam', 'telur', 'sayur', 'teh', 'es'];
export const BINS = { x: 40, y: 130, w: 200, h: 62, gap: 8 };

/** The centre island counter with its props (an obstacle, never a station). */
export const ISLAND = { x: 480, y: 280, w: 320, h: 80 };

/** The floor the cook may walk on: the whole field minus the top bar. */
export const FLOOR = { x: 24, y: 232, w: 1232, h: 408 };

/** The screen's three bands: the order board on top, the kitchen floor, the HUD bar. */
export const TOP_BAR = { x: 0, y: 0, w: 1280, h: 116 };
export const KITCHEN = { x: 0, y: 116, w: 1280, h: 532 };
export const HUD_BAR = { x: 0, y: 648, w: 1280, h: 72 };

export const PALETTE = {
  backdrop: '#171310',
  floor: '#c98f4e',
  floorDark: '#b57a3e',
  tile: '#d9a55f',
  wall: '#7a4a2b',
  counter: '#8a5a33',
  counterTop: '#a06a3d',
  steel: '#c9ced6',
  steelDark: '#8f959e',
  board: '#2b2118',
  card: '#fff7e8',
  cardEdge: '#d8c49a',
  text: '#2b2118',
  textLight: '#fff7e8',
  muted: '#8b7a63',
  red: '#d94f3d',
  green: '#58b368',
  gold: '#f2c94c',
  blue: '#4f9fd8',
  panel: '#241a12',
  panelEdge: '#4a3520',
  chef: '#f6ead6',
  chefHat: '#ffffff',
  apron: '#3e6fb0',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
