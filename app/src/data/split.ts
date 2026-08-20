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
  const totals = new Array<number>(guests).fill(0);

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
