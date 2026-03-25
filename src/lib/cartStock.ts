import type { IMetal } from '@/types';

/** Max units allowed in cart when inventory is tracked; otherwise effectively unlimited. */
export function getMaxCartQuantityForItem(
  item: Pick<IMetal, 'stockQuantity'>
): number {
  if (
    typeof item.stockQuantity === 'number' &&
    Number.isFinite(item.stockQuantity) &&
    item.stockQuantity >= 0
  ) {
    return Math.floor(item.stockQuantity);
  }
  return Number.MAX_SAFE_INTEGER;
}

export function itemHasStockLimit(item: Pick<IMetal, 'stockQuantity'>): boolean {
  return getMaxCartQuantityForItem(item) < Number.MAX_SAFE_INTEGER;
}
