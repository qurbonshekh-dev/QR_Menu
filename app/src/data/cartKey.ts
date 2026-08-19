import type { DishSelections } from './types';

/**
 * Составной ключ строки корзины. Без выборов — просто dishId (как раньше).
 * С выборами — dishId + отсортированные пары group:option, чтобы разные
 * размеры/тесто одной пиццы образовывали разные строки корзины.
 */
export function cartKey(dishId: string, selections?: DishSelections): string {
  if (!selections || Object.keys(selections).length === 0) return dishId;
  const parts = Object.entries(selections)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, option]) => `${group}:${option}`);
  return `${dishId}|${parts.join(',')}`;
}
