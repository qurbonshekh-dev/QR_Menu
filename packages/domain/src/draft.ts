/**
 * Черновик заказа, который официант набирает за столом. От гостевой корзины
 * отличается тремя вещами, и все три из ТЗ: у позиции есть гость, есть время
 * подачи и есть модификаторы («без лука», «+ сыр»). Поэтому это отдельный тип,
 * а не `CartItem` с необязательными полями — гостю такие поля нечем заполнять.
 */
import type { DishExtra } from './types';

export interface DraftLine {
  /** Ключ строки: одно блюдо с разными модификаторами или для разных гостей —
   *  разные строки. Считается `draftLineKey`. */
  key: string;
  /** Слаг блюда — тот же, что в меню. */
  dishId: string;
  title: string;
  /** Цена блюда с учётом выбранного размера, без добавок. */
  basePrice: number;
  quantity: number;
  /** Индекс гостя (0-based) или null — общее блюдо на стол. */
  guest: number | null;
  /** Выбор опций текстом: «25 см · Тонкое». */
  options?: string;
  /** Убранные ингредиенты — только те, что были в составе блюда. */
  removed: string[];
  extras: DishExtra[];
  comment?: string;
  /** Курс подачи: через сколько минут нести. undefined — по готовности. */
  serveAfterMinutes?: number;
}

/** Ключ строки. Гость входит в ключ намеренно: два одинаковых бургера разным
 *  гостям — две строки, иначе их не развести ни по подаче, ни по счёту. */
export function draftLineKey(
  dishId: string,
  options: string | undefined,
  removed: string[],
  extras: DishExtra[],
  guest: number | null,
): string {
  const parts = [
    dishId,
    options ?? '',
    [...removed].sort().join('+'),
    extras.map((extra) => extra.id).sort().join('+'),
    guest === null ? 'all' : String(guest),
  ];
  return parts.join('|');
}

/** Цена одной порции: размер плюс добавки. */
export function draftLinePrice(line: DraftLine): number {
  return line.basePrice + line.extras.reduce((sum, extra) => sum + extra.price, 0);
}

export function draftLineTotal(line: DraftLine): number {
  return draftLinePrice(line) * line.quantity;
}

export function draftTotal(lines: DraftLine[]): number {
  return lines.reduce((sum, line) => sum + draftLineTotal(line), 0);
}

/** Модификаторы одной строкой для кухни и для счёта: «без лука · + сыр чеддер». */
export function describeModifiers(line: DraftLine): string | null {
  const parts = [
    ...line.removed.map((name) => `без ${name.toLowerCase()}`),
    ...line.extras.map((extra) => `+ ${extra.name.toLowerCase()}`),
  ];
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Курсы подачи из ТЗ. Пресеты, а не свободный ввод: официант выбирает их стоя
 * у стола, а точную минуту всё равно никто не выдержит. Ручной ввод остаётся
 * возможен — это просто число минут.
 */
export const SERVE_PRESETS: { minutes?: number; label: string }[] = [
  { minutes: undefined, label: 'По готовности' },
  { minutes: 10, label: 'Через 5–10 минут' },
  { minutes: 20, label: 'Через 10–20 минут' },
  { minutes: 30, label: 'Через 20–30 минут' },
];

export function serveLabel(minutes?: number): string {
  if (minutes === undefined) return 'Подать по готовности';
  return `В течение ${minutes} минут`;
}

/** Сколько гостей упомянуто в черновике — для заголовков «Гость №2». */
export function draftGuestLines(lines: DraftLine[], guest: number | null): DraftLine[] {
  return lines.filter((line) => line.guest === guest);
}
