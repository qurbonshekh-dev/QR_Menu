/**
 * Кухня: тикет — это заказ, каким его видит повар. Данные денормализованы
 * (названия блюд лежат в самом тикете), потому что кухонный экран не должен
 * ходить в каталог меню: он показывает то, что уже заказано.
 */
import type { ServingMode } from './types';

/** Состояние тарелки на кухне. `served` на доску не попадает — она уже у гостя. */
export type TicketItemStatus = 'queued' | 'cooking' | 'ready' | 'served';

export interface KitchenTicketItem {
  id: string;
  title: string;
  quantity: number;
  /** Своё состояние у каждой тарелки: одно готовое блюдо из четырёх не делает
   *  готовым весь тикет. */
  status: TicketItemStatus;
  /** Выбор гостя: «25 см · Тонкое». */
  options?: string;
  /** Пожелание по конкретной позиции — печатается заметнее остального. */
  comment?: string;
  /** Что убрать и что добавить: «− салат айсберг · + бекон». Для повара это
   *  такая же инструкция, как комментарий, — не мелкий шрифт. */
  modifiers?: string;
  /** Курс подачи в минутах; undefined — по готовности. Кухня по нему решает,
   *  что ставить на плиту первым. */
  serveAfterMinutes?: number;
}

/** Тикет живёт три состояния: в очереди → готовится → готов (снят с экрана). */
export type TicketStatus = 'queued' | 'cooking' | 'ready';

export interface KitchenTicket {
  /** Номер заказа — тот же, что видит гость. */
  id: string;
  /** Откуда заказ: «Стол 12» или «Доставка». Повар готовит одинаково, но
   *  собирает по-разному — навынос нужна упаковка. */
  place: string;
  /** ISO-время поступления: от него считается возраст тикета. */
  placedAt: string;
  servingMode: ServingMode;
  /** Комментарий кухне из корзины гостя. */
  comment?: string;
  items: KitchenTicketItem[];
  status: TicketStatus;
  /** Когда блюдо отметили готовым — от этого момента считается остывание. */
  readyAt?: string;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  queued: 'Новый',
  cooking: 'Готовится',
  ready: 'Готово',
};

export function ticketStatusLabel(status: TicketStatus): string {
  return STATUS_LABELS[status];
}

/**
 * Возраст тикета — главный механизм KDS: повар не считает минуты, он видит цвет.
 * Пороги в минутах вынесены в аргумент: у мангала и у бара они разные.
 */
export type TicketAge = 'ontime' | 'caution' | 'late';

export interface AgeThresholds {
  caution: number;
  late: number;
}

export const DEFAULT_AGE_THRESHOLDS: AgeThresholds = { caution: 8, late: 15 };

/** Готовое блюдо стынет быстрее, чем ждёт неготовое, поэтому в колонке «Готово»
 *  пороги втрое короче: пять минут на раздаче — это уже холодная тарелка. */
export const READY_AGE_THRESHOLDS: AgeThresholds = { caution: 3, late: 6 };

export function ticketAge(
  placedAt: string,
  now: number,
  thresholds: AgeThresholds = DEFAULT_AGE_THRESHOLDS,
): TicketAge {
  const minutes = (now - new Date(placedAt).getTime()) / 60000;
  if (minutes >= thresholds.late) return 'late';
  if (minutes >= thresholds.caution) return 'caution';
  return 'ontime';
}

/** Время на экране кухни — «12:04», без часов: тикет старше часа это ЧП, а не формат. */
export function formatElapsed(placedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(placedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/**
 * All-day count — сколько одинаковых позиций ещё предстоит приготовить. Готовые
 * тикеты сюда не входят: повар смотрит на список, чтобы готовить партией, а не
 * чтобы вспоминать сделанное.
 */
export function allDayCount(tickets: KitchenTicket[]): { title: string; quantity: number }[] {
  const totals = new Map<string, number>();
  for (const ticket of tickets) {
    for (const item of ticket.items) {
      totals.set(item.title, (totals.get(item.title) ?? 0) + item.quantity);
    }
  }
  return [...totals.entries()]
    .map(([title, quantity]) => ({ title, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.title.localeCompare(b.title));
}
