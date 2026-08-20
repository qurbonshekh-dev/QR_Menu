/**
 * Зал ресторана: столы и их состояние. Общий словарь для приложений персонала —
 * официанта, кухни и админки. Гостевое меню столами не оперирует: гость знает
 * только свой стол из QR-ссылки.
 */

/**
 * Статус стола — четыре значения из макета статусных плашек. Вызов официанта
 * статусом не является: это событие, оно живёт в `alerts` и светится бейджем,
 * иначе «занят + зовёт» пришлось бы выражать пятым цветом.
 */
export type TableStatus = 'free' | 'busy' | 'awaiting' | 'reserved';

export interface FloorTable {
  id: string;
  /** Номер, который видит гость на QR-наклейке. */
  number: string;
  status: TableStatus;
  /** Посадочных мест — официант выбирает стол под компанию. */
  seats: number;
  /** Сколько событий требуют внимания: вызов официанта, готовый заказ, просьба счёта. */
  alerts: number;
  /** Время брони в формате «19:30» — только у status='reserved'. */
  reservedAt?: string;
}

const STATUS_LABELS: Record<TableStatus, string> = {
  free: 'Свободен',
  busy: 'Занят',
  awaiting: 'Ждут подачу',
  reserved: 'Забронирован',
};

export function tableStatusLabel(status: TableStatus): string {
  return STATUS_LABELS[status];
}
