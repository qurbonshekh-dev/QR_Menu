import type { DishExtra, DishSelections } from './types';

/**
 * Составной ключ строки корзины. Без выборов и модификаторов — просто dishId.
 * Иначе dishId + отсортированные пары group:option и список модификаторов:
 * пицца 25 см и 21 см — разные строки, бургер «без лука» и обычный — тоже.
 */
export function cartKey(dishId: string, selections?: DishSelections, removed?: string[], extras?: DishExtra[]): string {
  const parts: string[] = [];

  if (selections && Object.keys(selections).length > 0) {
    parts.push(
      Object.entries(selections)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, option]) => `${group}:${option}`)
        .join(','),
    );
  }
  if (removed?.length) parts.push(`-${[...removed].sort().join('+')}`);
  if (extras?.length) parts.push(`+${extras.map((extra) => extra.id).sort().join('+')}`);

  return parts.length ? `${dishId}|${parts.join('|')}` : dishId;
}

/** Модификаторы строкой для кухни и счёта: «− лук · + бекон». Знаками, а не
 *  словами: склонять названия из базы нечем (см. describeModifiers у официанта). */
export function describeCartModifiers(removed?: string[], extras?: DishExtra[]): string | null {
  const parts = [
    ...(removed ?? []).map((name) => `− ${name.toLowerCase()}`),
    ...(extras ?? []).map((extra) => `+ ${extra.name.toLowerCase()}`),
  ];
  return parts.length ? parts.join(' · ') : null;
}

/** Надбавка добавок к цене порции. */
export function extrasPrice(extras?: DishExtra[]): number {
  return (extras ?? []).reduce((sum, extra) => sum + extra.price, 0);
}
