// Coffee card rules — mirrors the app: any coffee or hot drink, any size; the stamp after `per` is free.
import type { Customer, MenuItem, OrderLine } from './types';

export const DEFAULT_STAMPS_PER_REWARD = 9;
const ELIGIBLE_CATS = ['coffee'];

export const isEligible = (item: Pick<MenuItem, 'cat'> | undefined): boolean => !!item && ELIGIBLE_CATS.includes(item.cat);

/** Stamps to award for an order: one per eligible line unit. */
export function stampsFor(lines: Pick<OrderLine, 'itemId' | 'qty'>[], menuById: Record<string, MenuItem>): number {
  return lines.reduce((n, l) => n + (isEligible(menuById[l.itemId]) ? l.qty : 0), 0);
}

/** Apply stamps and roll over into rewards. Pure. */
export function addStamps<C extends Pick<Customer, 'stamps' | 'rewards'>>(c: C, n: number, per = DEFAULT_STAMPS_PER_REWARD): C {
  let stamps = c.stamps + n,
    rewards = c.rewards;
  while (stamps >= per) {
    stamps -= per;
    rewards += 1;
  }
  return { ...c, stamps, rewards };
}

/** Value of a reward against a cart: the cheapest eligible line unit price. */
export function rewardValue(lines: Pick<OrderLine, 'itemId' | 'price'>[], menuById: Record<string, MenuItem>): number {
  const prices = lines.filter((l) => isEligible(menuById[l.itemId])).map((l) => l.price);
  return prices.length ? Math.min(...prices) : 0;
}
