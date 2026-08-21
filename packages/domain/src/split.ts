import type { SplitState } from './types';

/** Одна строка корзины для раскладки: ключ и её полная стоимость. */
export interface SplitLine {
  key: string;
  total: number;
}

/**
 * Раскладка счёта по гостям. Работает целиком на клиенте: делить нечего, кроме
 * уже известных сумм, поэтому бэкенд здесь не нужен — результат гость просто
 * показывает официанту.
 *
 * `equal` — всё поровну. `items` — назначенные позиции идут своему гостю,
 * неназначенные считаются общими и делятся поровну.
 *
 * Остаток от деления не выбрасываем: раскидываем по 1 сомони на первых гостей,
 * иначе сумма долей не сходится с итогом счёта.
 */
export function splitTotals(lines: SplitLine[], split: SplitState): number[] {
  const guests = Math.max(1, split.guests);
  const totals: number[] = Array.from({ length: guests }, () => 0);

  const shared: number[] = [];
  for (const line of lines) {
    const guest = split.mode === 'items' ? split.assignments[line.key] : undefined;
    if (guest !== undefined && guest >= 0 && guest < guests) {
      totals[guest] += line.total;
    } else {
      shared.push(line.total);
    }
  }

  const sharedTotal = shared.reduce((sum, value) => sum + value, 0);
  const base = Math.floor(sharedTotal / guests);
  let remainder = sharedTotal - base * guests;
  for (let i = 0; i < guests; i += 1) {
    totals[i] += base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  }

  return totals;
}

/** Сколько позиций ещё не закреплено ни за кем — подпись «делим на всех». */
export function countShared(lines: SplitLine[], split: SplitState): number {
  if (split.mode !== 'items') return lines.length;
  return lines.filter((line) => split.assignments[line.key] === undefined).length;
}

/**
 * Раскладка хранится ключами строк корзины (`d-13|g-size:o-25`), а в позициях
 * заказа этого ключа нет — есть блюдо и текст выбора. Поэтому сопоставляем по
 * слагу блюда: список ключей «съедается» по одному, чтобы вторая такая же
 * позиция досталась следующему гостю. Два разных размера одной пиццы у разных
 * гостей могут поменяться местами — это лучше, чем не показать гостей вовсе.
 * Точным сопоставление станет, когда ключ строки поедет в `order_items`.
 */
export function pendingAssignments(split: SplitState | null | undefined): [string, number][] {
  if (!split || split.mode !== 'items') return [];
  return Object.entries(split.assignments);
}

/** Берёт гостя для позиции и вычёркивает использованный ключ из списка. */
export function takeGuestBySlug(pending: [string, number][], slug: string | undefined): number | undefined {
  if (!slug) return undefined;
  const index = pending.findIndex(([key]) => key === slug || key.startsWith(`${slug}|`));
  if (index < 0) return undefined;
  const [, guest] = pending[index];
  pending.splice(index, 1);
  return guest;
}

/** Позиция заказа глазами раскладки: своя цена и блюдо, по которому ищется гость. */
export interface SplitPricedItem {
  key: string;
  slug?: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Строки раскладки для позиций уже оформленного заказа. Ключи префиксуем
 * номером заказа: одинаковые строки из разных заказов иначе схлопнулись бы
 * в одну. Гостя ищем по слагу — см. `takeGuestBySlug`.
 */
export function orderSplitLines(
  items: SplitPricedItem[],
  split: SplitState | null | undefined,
  prefix = '',
): { lines: SplitLine[]; assignments: Record<string, number> } {
  const pending = pendingAssignments(split);
  const lines: SplitLine[] = [];
  const assignments: Record<string, number> = {};
  const guests = split?.guests ?? 0;

  for (const item of items) {
    const key = `${prefix}${item.key}`;
    lines.push({ key, total: item.unitPrice * item.quantity });
    const guest = takeGuestBySlug(pending, item.slug);
    if (guest !== undefined && guest < guests) assignments[key] = guest;
  }

  return { lines, assignments };
}
