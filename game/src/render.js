// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred, the margin filled
// with the backdrop colour. Flat vector art, no images: every ingredient, dish
// and station is drawn from canvas shapes, so the game loads nothing at all.

import {
  BINS, BIN_IDS, FIELD, FONT, HUD_BAR, INGREDIENTS, ISLAND, KITCHEN,
  PALETTE, PREP, RECIPES, STATIONS, STATE, TOP_BAR,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(context, x, y, w, h, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + w, y, x + w, y + h, radius);
  context.arcTo(x + w, y + h, x, y + h, radius);
  context.arcTo(x, y + h, x, y, radius);
  context.arcTo(x, y, x + w, y, radius);
  context.closePath();
}

function circle(context, x, y, radius) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, weight) {
    const key = `${weight || ''}${size}`;
    if (!fonts.has(key)) fonts.set(key, `${weight ? `${weight} ` : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function bar(x, y, w, h, fraction, color, back) {
    context.fillStyle = back;
    context.fillRect(x, y, w, h);
    context.fillStyle = color;
    context.fillRect(x, y, Math.max(0, Math.min(1, fraction)) * w, h);
  }

  function ring(x, y, radius, fraction, color, width) {
    context.beginPath();
    context.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.max(0, Math.min(1, fraction)) * Math.PI * 2);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.stroke();
  }

  // -- ingredient glyphs -----------------------------------------------------
  // Each ingredient is one unmistakable shape in its own colour, drawn the same
  // way on the bins, the stations, the plate and the order cards.

  function drawIngredient(id, cx, cy, size, stateName) {
    const color = INGREDIENTS[id].color;
    const dark = INGREDIENTS[id].dark;
    const r = size / 2;
    context.save();
    context.translate(cx, cy);
    if (id === 'nasi') {
      context.fillStyle = '#e8e2d0';
      context.beginPath();
      context.arc(0, r * 0.25, r * 0.85, 0, Math.PI);
      context.fill();
      context.fillStyle = stateName === STATE.COOKED ? '#fff6da' : '#f5f0e1';
      context.beginPath();
      context.arc(0, r * 0.1, r * 0.62, Math.PI, 0);
      context.fill();
      context.fillStyle = '#cbbf9a';
      for (let i = -1; i <= 1; i += 1) {
        circle(context, i * r * 0.3, -r * 0.25, r * 0.09);
      }
    } else if (id === 'mie') {
      context.strokeStyle = color;
      context.lineWidth = r * 0.28;
      context.beginPath();
      context.arc(0, 0, r * 0.55, 0.3, Math.PI * 1.9);
      context.stroke();
      context.beginPath();
      context.arc(0, 0, r * 0.25, 1.2, Math.PI * 2.4);
      context.stroke();
      context.strokeStyle = dark;
      context.lineWidth = r * 0.1;
      context.beginPath();
      context.moveTo(-r * 0.5, -r * 0.6);
      context.lineTo(r * 0.5, r * 0.6);
      context.stroke();
    } else if (id === 'ayam') {
      context.fillStyle = stateName === STATE.COOKED ? '#c96a28' : color;
      circle(context, -r * 0.1, -r * 0.05, r * 0.62);
      context.strokeStyle = '#f6ead6';
      context.lineWidth = r * 0.22;
      context.beginPath();
      context.moveTo(r * 0.45, r * 0.35);
      context.lineTo(r * 0.8, r * 0.7);
      context.stroke();
      context.fillStyle = '#f6ead6';
      circle(context, r * 0.82, r * 0.72, r * 0.16);
      circle(context, r * 0.62, r * 0.86, r * 0.16);
    } else if (id === 'telur') {
      context.fillStyle = '#fdfdfd';
      context.beginPath();
      context.ellipse(0, 0, r * 0.85, r * 0.62, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = stateName === STATE.COOKED ? '#f2a93b' : '#f2c94c';
      circle(context, 0, 0, r * 0.34);
    } else if (id === 'sayur') {
      context.fillStyle = color;
      for (const [ox, oy, rot] of [[-0.35, 0.1, -0.5], [0.3, 0.15, 0.5], [0, -0.35, 0]]) {
        context.save();
        context.translate(ox * r, oy * r);
        context.rotate(rot);
        context.beginPath();
        context.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      context.fillStyle = dark;
      circle(context, 0, r * 0.45, r * 0.14);
    } else if (id === 'teh') {
      context.fillStyle = 'rgba(255,255,255,0.85)';
      roundRect(context, -r * 0.45, -r * 0.7, r * 0.9, r * 1.4, r * 0.18);
      context.fill();
      context.fillStyle = stateName === STATE.COOKED ? '#b5771f' : color;
      roundRect(context, -r * 0.32, -r * 0.1, r * 0.64, r * 0.66, r * 0.12);
      context.fill();
      context.strokeStyle = '#e8e2d0';
      context.lineWidth = r * 0.08;
      context.beginPath();
      context.moveTo(r * 0.2, -r * 0.7);
      context.lineTo(r * 0.45, -r * 1.05);
      context.stroke();
    } else if (id === 'es') {
      context.fillStyle = color;
      context.save();
      context.rotate(0.3);
      context.fillRect(-r * 0.55, -r * 0.55, r * 0.8, r * 0.8);
      context.restore();
      context.fillStyle = '#bfe9f5';
      context.save();
      context.rotate(-0.25);
      context.fillRect(-r * 0.1, -r * 0.05, r * 0.7, r * 0.7);
      context.restore();
    }
    if (stateName === STATE.CHOPPED) {
      context.strokeStyle = 'rgba(43,33,24,0.55)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-r * 0.6, 0);
      context.lineTo(r * 0.6, 0);
      context.moveTo(0, -r * 0.6);
      context.lineTo(0, r * 0.6);
      context.stroke();
    }
    if (stateName === STATE.BURNT) {
      context.fillStyle = 'rgba(20,12,6,0.55)';
      circle(context, 0, 0, r * 0.9);
      context.strokeStyle = '#8b93a3';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-r * 0.4, -r * 0.7);
      context.quadraticCurveTo(-r * 0.6, -r * 1.1, -r * 0.3, -r * 1.25);
      context.moveTo(r * 0.3, -r * 0.7);
      context.quadraticCurveTo(r * 0.55, -r * 1.05, r * 0.25, -r * 1.2);
      context.stroke();
    }
    context.restore();
  }

  // -- kitchen ---------------------------------------------------------------

  function drawKitchen() {
    context.fillStyle = PALETTE.floor;
    context.fillRect(KITCHEN.x, KITCHEN.y, KITCHEN.w, KITCHEN.h);
    context.fillStyle = PALETTE.tile;
    const tile = 64;
    for (let ty = KITCHEN.y; ty < KITCHEN.y + KITCHEN.h; ty += tile) {
      for (let tx = ((ty / tile) % 2 === 0 ? 0 : tile / 2); tx < KITCHEN.w; tx += tile) {
        context.fillRect(KITCHEN.x + tx, ty, tile / 2, tile / 2);
      }
    }
    context.fillStyle = PALETTE.wall;
    context.fillRect(0, 116, FIELD.width, 12);
    context.fillRect(0, 640, FIELD.width, 8);
  }

  function drawIsland() {
    context.fillStyle = PALETTE.counterTop;
    roundRect(context, ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h, 12);
    context.fill();
    context.fillStyle = PALETTE.counter;
    roundRect(context, ISLAND.x + 6, ISLAND.y + 6, ISLAND.w - 12, ISLAND.h - 12, 8);
    context.fill();
    // Props: bowls, bottles and a cutting board, so the counter reads as a kitchen.
    drawIngredient('nasi', ISLAND.x + 52, ISLAND.y + 42, 44);
    drawIngredient('sayur', ISLAND.x + 130, ISLAND.y + 42, 40);
    context.fillStyle = '#c65b4e';
    roundRect(context, ISLAND.x + 190, ISLAND.y + 18, 22, 46, 6);
    context.fill();
    context.fillStyle = '#58b368';
    roundRect(context, ISLAND.x + 224, ISLAND.y + 18, 22, 46, 6);
    context.fill();
    context.fillStyle = '#d9c9a8';
    roundRect(context, ISLAND.x + 258, ISLAND.y + 26, 48, 30, 4);
    context.fill();
  }

  function drawBins() {
    for (let index = 0; index < BIN_IDS.length; index += 1) {
      const id = BIN_IDS[index];
      const x = BINS.x;
      const y = BINS.y + index * (BINS.h + BINS.gap);
      context.fillStyle = PALETTE.counterTop;
      roundRect(context, x, y, BINS.w, BINS.h, 10);
      context.fill();
      context.fillStyle = PALETTE.card;
      roundRect(context, x + 6, y + 6, BINS.w - 12, BINS.h - 12, 7);
      context.fill();
      drawIngredient(id, x + 34, y + BINS.h / 2, 40);
      text(INGREDIENTS[id].name, x + 62, y + 26, 20, PALETTE.text, 'left', 'bold');
      text('ambil', x + 62, y + 48, 15, PALETTE.muted, 'left');
    }
  }

  function drawStationBase(rect, label, near) {
    context.fillStyle = near ? '#f2c94c' : PALETTE.counterTop;
    roundRect(context, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 12);
    context.fill();
    context.fillStyle = PALETTE.counter;
    roundRect(context, rect.x, rect.y, rect.w, rect.h, 10);
    context.fill();
    text(label, rect.x + rect.w / 2, rect.y + 28, 22, PALETTE.textLight, 'center', 'bold');
  }

  function drawPotong(state, near) {
    const rect = STATIONS.potong;
    drawStationBase(rect, 'POTONG', near);
    context.fillStyle = '#d9c9a8';
    roundRect(context, rect.x + 30, rect.y + 44, rect.w - 60, 62, 6);
    context.fill();
    const slot = state.potong;
    if (slot.item) {
      drawIngredient(slot.item.id, rect.x + rect.w / 2, rect.y + 75, 52, slot.progress >= 1 ? STATE.CHOPPED : slot.item.state);
      if (slot.progress < 1) ring(rect.x + rect.w / 2, rect.y + 75, 36, slot.progress, '#58b368', 7);
      else text('SIAP!', rect.x + rect.w / 2, rect.y + 126, 20, '#58b368', 'center', 'bold');
    } else {
      text('taruh bahan di sini', rect.x + rect.w / 2, rect.y + 78, 17, '#e8dcc8', 'center');
      text('dipotong otomatis', rect.x + rect.w / 2, rect.y + 104, 15, '#cbb894', 'center');
    }
  }

  function drawKompor(state, near) {
    const rect = STATIONS.kompor;
    drawStationBase(rect, 'KOMPOR', near);
    for (let burner = 0; burner < 2; burner += 1) {
      const cx = rect.x + 60 + burner * 120;
      const cy = rect.y + 78;
      context.fillStyle = '#3a3f47';
      circle(context, cx, cy, 42);
      context.fillStyle = '#24282e';
      circle(context, cx, cy, 34);
      const slot = state.kompor[burner];
      if (slot.item) {
        const burnt = slot.progress >= 1 + PREP.burnAfter / PREP.cook;
        drawIngredient(slot.item.id, cx, cy, 56, burnt ? STATE.BURNT : slot.progress >= 1 ? STATE.COOKED : slot.item.state);
        if (slot.progress < 1) ring(cx, cy, 48, slot.progress, '#e8833a', 7);
        else if (burnt) text('GOSONG!', cx, cy + 62, 16, '#ff8a7a', 'center', 'bold');
        else text('MATANG', cx, cy + 62, 16, '#58b368', 'center', 'bold');
      }
    }
  }

  function drawSaji(state, near) {
    const rect = STATIONS.saji;
    drawStationBase(rect, 'SAJI', near);
    const parts = state.saji.parts;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + 78;
    context.fillStyle = '#fdfdfd';
    context.beginPath();
    context.ellipse(cx, cy, 78, 40, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#d8d2c0';
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(cx, cy, 62, 30, 0, 0, Math.PI * 2);
    context.stroke();
    for (let i = 0; i < parts.length; i += 1) {
      drawIngredient(parts[i].id, cx - (parts.length - 1) * 26 + i * 52, cy - 4, 40, parts[i].state);
    }
    const match = parts.length > 0 && state.orders.some((order) => {
      const want = [...RECIPES[order.recipe].parts].sort().join(',');
      return parts.map((part) => part.id).sort().join(',') === want;
    });
    if (match) {
      context.strokeStyle = '#f2c94c';
      context.lineWidth = 5;
      context.beginPath();
      context.ellipse(cx, cy, 88, 48, 0, 0, Math.PI * 2);
      context.stroke();
      text('SIAP DIANTAR!', cx, rect.y + 126, 20, '#f2c94c', 'center', 'bold');
    } else if (parts.length > 0) {
      text(`${parts.length} bahan di piring`, cx, rect.y + 126, 16, '#e8dcc8', 'center');
    } else {
      text('rakit hidangan di sini', cx, rect.y + 126, 16, '#e8dcc8', 'center');
    }
  }

  function drawAntar(state, near) {
    const rect = STATIONS.antar;
    drawStationBase(rect, 'ANTAR', near);
    context.fillStyle = '#fdfdfd';
    roundRect(context, rect.x + 24, rect.y + 44, rect.w - 48, 44, 8);
    context.fill();
    context.fillStyle = '#d94f3d';
    circle(context, rect.x + rect.w / 2, rect.y + 66, 12);
    context.fillStyle = '#fff7e8';
    circle(context, rect.x + rect.w / 2, rect.y + 66, 5);
    text('serahkan hidangan', rect.x + rect.w / 2, rect.y + 104, 15, '#e8dcc8', 'center');
  }

  function drawSampah(state, near) {
    const rect = STATIONS.sampah;
    drawStationBase(rect, 'SAMPAH', near);
    context.fillStyle = '#3a3f47';
    roundRect(context, rect.x + rect.w / 2 - 34, rect.y + 46, 68, 52, 8);
    context.fill();
    context.fillStyle = '#24282e';
    roundRect(context, rect.x + rect.w / 2 - 40, rect.y + 40, 80, 12, 6);
    context.fill();
    text('buang bahan / piring', rect.x + rect.w / 2, rect.y + 116, 15, '#e8dcc8', 'center');
  }

  function drawPlayer(state) {
    const player = state.player;
    const x = player.x;
    const y = player.y;
    context.fillStyle = 'rgba(0,0,0,0.25)';
    context.beginPath();
    context.ellipse(x, y + 24, 24, 8, 0, 0, Math.PI * 2);
    context.fill();
    // Body: apron over a shirt, facing left or right.
    context.fillStyle = PALETTE.apron;
    circle(context, x, y + 8, 20);
    context.fillStyle = PALETTE.chef;
    circle(context, x, y - 8, 15);
    // Chef hat.
    context.fillStyle = PALETTE.chefHat;
    roundRect(context, x - 16, y - 34, 32, 16, 7);
    context.fill();
    circle(context, x - 10, y - 32, 8);
    circle(context, x + 10, y - 32, 8);
    // Eyes look the way the cook faces.
    context.fillStyle = '#2b2118';
    circle(context, x + player.face * 5 - 4, y - 10, 2.2);
    circle(context, x + player.face * 5 + 4, y - 10, 2.2);
    // What the cook holds rides in a bubble above the hat.
    if (state.holding) {
      context.fillStyle = '#fff7e8';
      circle(context, x + 26, y - 44, 22);
      context.strokeStyle = '#d8c49a';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(x + 26, y - 44, 22, 0, Math.PI * 2);
      context.stroke();
      if (state.holding.kind === 'plate') {
        for (let i = 0; i < state.holding.parts.length; i += 1) {
          drawIngredient(state.holding.parts[i].id, x + 26 - (state.holding.parts.length - 1) * 11 + i * 22, y - 44, 18, state.holding.parts[i].state);
        }
      } else {
        drawIngredient(state.holding.id, x + 26, y - 44, 30, state.holding.state);
      }
    }
  }

  // -- order board and HUD ----------------------------------------------------

  function drawOrders(state) {
    context.fillStyle = PALETTE.board;
    context.fillRect(TOP_BAR.x, TOP_BAR.y, TOP_BAR.w, TOP_BAR.h);
    text('PESANAN', 24, 34, 22, '#f2c94c', 'left', 'bold');
    text('layani sebelum waktunya habis', 24, 58, 15, '#cbb894', 'left');
    text(`Level ${state.level}`, 24, 84, 17, '#fff7e8', 'left', 'bold');
    for (let slot = 0; slot < 3; slot += 1) {
      const x = 250 + slot * 340;
      const y = 10;
      const order = state.orders[slot];
      context.fillStyle = order ? PALETTE.card : 'rgba(255,247,232,0.12)';
      roundRect(context, x, y, 320, 96, 10);
      context.fill();
      if (!order) {
        context.strokeStyle = 'rgba(255,247,232,0.4)';
        context.setLineDash([6, 6]);
        context.lineWidth = 2;
        roundRect(context, x, y, 320, 96, 10);
        context.stroke();
        context.setLineDash([]);
        text('menunggu pesanan…', x + 160, y + 54, 17, '#cbb894', 'center');
        continue;
      }
      const recipe = RECIPES[order.recipe];
      const urgent = order.left < 6;
      context.fillStyle = recipe.color;
      roundRect(context, x + 10, y + 10, 10, 76, 5);
      context.fill();
      text(recipe.name, x + 34, y + 30, 22, PALETTE.text, 'left', 'bold');
      for (let i = 0; i < recipe.parts.length; i += 1) {
        drawIngredient(recipe.parts[i], x + 52 + i * 44, y + 58, 34);
      }
      text(`Rp${recipe.price}rb`, x + 300, y + 30, 18, PALETTE.text, 'right', 'bold');
      bar(x + 34, y + 82, 266, 8, order.left / order.total, urgent ? '#d94f3d' : '#58b368', '#e8dcc8');
      if (urgent) text(`${Math.ceil(order.left)} dtk!`, x + 300, y + 62, 18, '#d94f3d', 'right', 'bold');
      else text(`${Math.ceil(order.left)} dtk`, x + 300, y + 62, 17, PALETTE.muted, 'right');
    }
  }

  function drawHud(state) {
    context.fillStyle = PALETTE.panel;
    context.fillRect(HUD_BAR.x, HUD_BAR.y, HUD_BAR.w, HUD_BAR.h);
    context.fillStyle = PALETTE.panelEdge;
    context.fillRect(HUD_BAR.x, HUD_BAR.y, HUD_BAR.w, 2);
    text(`Skor ${state.score}`, 24, HUD_BAR.y + 34, 26, '#fff7e8', 'left', 'bold');
    text(`Koin Rp${state.coins}rb`, 200, HUD_BAR.y + 34, 22, '#f2c94c', 'left', 'bold');
    if (state.combo > 1) text(`Kombo x${state.combo}`, 380, HUD_BAR.y + 34, 20, '#58b368', 'left', 'bold');
    const shiftUrgent = state.shiftLeft < 30;
    text('Shift', 640, HUD_BAR.y + 26, 16, '#cbb894', 'center');
    text(
      `${Math.floor(state.shiftLeft / 60)}:${String(Math.floor(state.shiftLeft % 60)).padStart(2, '0')}`,
      640, HUD_BAR.y + 54, 28, shiftUrgent ? '#ff8a7a' : '#fff7e8', 'center', 'bold',
    );
    text('Gagal', 800, HUD_BAR.y + 26, 16, '#cbb894', 'center');
    for (let i = 0; i < 3; i += 1) {
      context.fillStyle = i < state.strikes ? '#d94f3d' : '#4a3520';
      circle(context, 780 + i * 30, HUD_BAR.y + 46, 10);
    }
    const held = state.holding;
    const heldText = !held
      ? 'Tangan kosong'
      : held.kind === 'plate'
        ? `Piring: ${RECIPES[held.recipe].name} — SIAP!`
        : `${INGREDIENTS[held.id].name} (${held.state === 'raw' ? 'mentah' : held.state === 'chopped' ? 'potong' : held.state === 'cooked' ? 'matang' : 'gosong'})`;
    text(heldText, 920, HUD_BAR.y + 34, 20, '#fff7e8', 'left', 'bold');
    if (state.message) text(state.message, 920, HUD_BAR.y + 58, 16, '#f2c94c', 'left');
  }

  // -- panels -----------------------------------------------------------------

  function drawPanel(title, lines, prompt, accent) {
    const width = 640;
    const height = 150 + lines.length * 34 + 70;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(0,0,0,0.45)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(context, x, y, width, height, 14);
    context.fill();
    context.strokeStyle = accent || '#f2c94c';
    context.lineWidth = 3;
    roundRect(context, x, y, width, height, 14);
    context.stroke();
    text(title, FIELD.width / 2, y + 72, 46, '#fff7e8', 'center', 'bold');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + 122 + index * 34, 21, '#e8dcc8', 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 34, 22, '#f2c94c', 'center', 'bold');
  }

  /** Paint one frame: the kitchen, then the HUD or a panel for the screen. */
  function draw(state, screen, best, near) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawKitchen();
    drawIsland();
    drawBins();
    const nearId = near ? (near.kind === 'bin' ? `bin:${near.id}` : near.id) : null;
    drawPotong(state, nearId === 'potong');
    drawKompor(state, nearId === 'kompor');
    drawSaji(state, nearId === 'saji');
    drawAntar(state, nearId === 'antar');
    drawSampah(state, nearId === 'sampah');
    drawPlayer(state);
    drawOrders(state);
    drawHud(state);
    if (near) {
      const label = near.kind === 'bin'
        ? `Ambil ${INGREDIENTS[near.id].name} — Spasi`
        : `${STATIONS[near.id].hint} — Spasi`;
      // A dark pill under the cook, so the hint never covers a station's label.
      context.font = `bold 17px ${FONT}`;
      const pillW = context.measureText(label).width + 24;
      const pillX = Math.max(8, Math.min(FIELD.width - pillW - 8, state.player.x - pillW / 2));
      const pillY = state.player.y + 52;
      context.fillStyle = 'rgba(23,19,16,0.88)';
      roundRect(context, pillX, pillY, pillW, 30, 15);
      context.fill();
      text(label, pillX + pillW / 2, pillY + 21, 17, '#f2c94c', 'center', 'bold');
    }
    if (screen === SCREEN_TITLE) {
      drawPanel('WARUNG KILAT', [
        'Masak pesanan secepat kilat: ambil bahan, potong, masak,',
        'rakit di piring, lalu antar sebelum pelanggan kehabisan sabar.',
        `Skor terbaik: ${best}`,
        '',
        'Gerak: WASD / panah.  Pakai stasiun: Spasi / klik.',
      ], 'Tekan Spasi atau klik untuk mulai');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('Jeda', ['Pesanan menunggu — kompor tetap menyala di kepalamu.'], 'Tekan P untuk lanjut');
    } else if (screen === SCREEN_OVER) {
      drawPanel('Shift Selesai!', [
        `Skor akhir: ${state.score}   •   Koin: Rp${state.coins}rb`,
        `Skor terbaik: ${best}`,
        state.strikes >= 3 ? 'Tiga pesanan hangus — pelanggan kabur semua.' : 'Waktu shift habis. Dapur tutup!',
      ], 'Tekan Spasi untuk main lagi');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, drawIngredient };
}
