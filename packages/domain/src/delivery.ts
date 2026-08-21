/**
 * Выдача: доставка курьером и самовывоз. Заказ у них общий с залом — те же
 * позиции и та же кухня, — а отличается всё, что вокруг: адрес, контакты,
 * деньги сверх блюд и путь по статусам, который ведёт менеджер, а не повар.
 */

export type DeliveryKind = 'delivery' | 'pickup';

/** Канбан из ТЗ. `cooking` здесь — это отметка менеджера «отдал на кухню»,
 *  а не статус тикета: кухня живёт своими `orders.status`. */
export type DeliveryStatus = 'new' | 'accepted' | 'cooking' | 'on_way' | 'delivered' | 'cancelled';

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  new: 'Новый',
  accepted: 'Принят',
  cooking: 'На готовке',
  on_way: 'На доставке',
  delivered: 'Доставлено',
  cancelled: 'Отменён',
};

/** У самовывоза «на доставке» не бывает — гость идёт сам. */
const PICKUP_LABELS: Partial<Record<DeliveryStatus, string>> = {
  on_way: 'Ждёт гостя',
  delivered: 'Выдано',
};

export function deliveryStatusLabel(status: DeliveryStatus, kind: DeliveryKind = 'delivery'): string {
  return (kind === 'pickup' ? PICKUP_LABELS[status] : undefined) ?? STATUS_LABELS[status];
}

/** Порядок канбана. Отменённый заказ стоит особняком: это не шаг пути. */
export const DELIVERY_FLOW: DeliveryStatus[] = ['new', 'accepted', 'cooking', 'on_way', 'delivered'];

/** Следующий шаг по пути или null, если дальше некуда. */
export function nextDeliveryStatus(status: DeliveryStatus): DeliveryStatus | null {
  const index = DELIVERY_FLOW.indexOf(status);
  if (index < 0 || index === DELIVERY_FLOW.length - 1) return null;
  return DELIVERY_FLOW[index + 1];
}

export interface DeliveryMoney {
  /** Блюда — сумма заказа. */
  items: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  tip: number;
}

/** Итог к оплате. Скидка вычитается последней, чтобы её было видно строкой,
 *  а не растворённой в цене блюд. */
export function deliveryTotal(money: DeliveryMoney): number {
  return Math.max(
    0,
    money.items + money.deliveryFee + money.serviceFee + money.tip - money.discount,
  );
}

/** Адрес одной строкой: «ул. Солнечная, 15, подъезд 2, этаж 4, кв. 12». */
export function formatAddress(parts: {
  street?: string;
  house?: string;
  entrance?: string;
  floor?: string;
  flat?: string;
}): string {
  const head = [parts.street, parts.house].filter(Boolean).join(', ');
  const tail = [
    parts.entrance ? `подъезд ${parts.entrance}` : null,
    parts.floor ? `этаж ${parts.floor}` : null,
    parts.flat ? `кв. ${parts.flat}` : null,
  ].filter(Boolean);
  return [head, ...tail].filter(Boolean).join(', ');
}
