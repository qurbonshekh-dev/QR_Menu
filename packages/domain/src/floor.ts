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

/** Бронь: на кого и на когда записан стол. */
export interface TableReservation {
  id: string;
  /** ISO-время начала брони. */
  startsAt: string;
  guestName?: string;
  guestPhone?: string;
  guests?: number;
}

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
  /** Кто забронировал: имя, телефон, сколько персон. */
  reservation?: TableReservation;
  /** Когда за стол сели — время первого заказа визита. */
  seatedAt?: string;
  /** Сколько гостей за столом по заказу и сколько позиций в счёте. */
  guests?: number;
  items?: number;
  /** Столы, присоединённые к этому: «24 + 25». Счёт у них общий. */
  mergedWith?: { id: string; number: string }[];
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
