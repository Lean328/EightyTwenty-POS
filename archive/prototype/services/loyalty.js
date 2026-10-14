// Coffee card rules — mirrors the app: any coffee or hot drink, any size; the 10th is free.
export const STAMPS_PER_REWARD = 9;
export const ELIGIBLE_CATS = ['coffee'];
export const REWARD_LABEL = 'Free coffee (10th coffee)';

export const isEligible = (item) => item && ELIGIBLE_CATS.includes(item.cat);

/** Stamps to award for an order: one per eligible line unit. */
export function stampsFor(lines, menuById) {
  return lines.reduce((n, l) => n + (isEligible(menuById[l.itemId]) ? l.qty : 0), 0);
}

/** Apply stamps; roll over into rewards. Pure. */
export function addStamps(c, n) {
  let stamps = c.stamps + n, rewards = c.rewards;
  while (stamps >= STAMPS_PER_REWARD) { stamps -= STAMPS_PER_REWARD; rewards += 1; }
  return { ...c, stamps, rewards };
}

/** Value of a reward against a cart: cheapest eligible line unit price. */
export function rewardValue(lines, menuById) {
  const prices = lines.filter(l => isEligible(menuById[l.itemId])).map(l => l.price);
  return prices.length ? Math.min(...prices) : 0;
}
