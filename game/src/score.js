// Scoring and plate-matching for Warung Kilat: pure functions over the world's
// state, kept apart from the simulation so the rules can be read — and tested —
// without running the game. Nothing here changes state; the world applies what
// these return.

import { RECIPES, SCORE } from './config.js';

/**
 * The recipe a plate of parts matches, or null when it matches no open order.
 * A plate matches when it holds exactly the recipe's parts, each in its ready
 * state — extra parts, missing parts or a wrong part all fail the match.
 */
export function plateRecipeId(parts, orders) {
  const have = parts.map((part) => part.id).sort().join(',');
  for (const order of orders) {
    const want = [...RECIPES[order.recipe].parts].sort().join(',');
    if (have === want) return order.recipe;
  }
  return null;
}

/**
 * Points for serving one order: a flat base, a tip of up to SCORE.tipMax
 * scaled by the time left on the order, and a bonus per order already served
 * in a row without a time-out. `combo` is the run's combo before this serve.
 */
export function scoreServe(order, combo) {
  const tip = Math.round(SCORE.tipMax * (order.left / order.total));
  const comboBonus = SCORE.comboEach * combo;
  return { points: SCORE.base + tip + comboBonus, tip, comboBonus };
}
