/**
 * Статус заказа глазами гостя. Тот же набор, что в базе, но словами, которые
 * что-то значат за столом: «ready» для гостя — это не «готов», а «уже несут».
 */
export type OrderStatus = 'queued' | 'cooking' | 'ready' | 'served' | 'paid' | 'cancelled';

const GUEST_LABELS: Record<OrderStatus, string> = {
  queued: 'В очереди',
  cooking: 'Готовится',
  ready: 'Уже несут',
  served: 'Подано',
  paid: 'Счёт закрыт',
  cancelled: 'Отменён',
};

export function orderStatusLabel(status: OrderStatus): string {
  return GUEST_LABELS[status] ?? GUEST_LABELS.queued;
}

/** Путь заказа, который гость видит полоской прогресса. `paid` и `cancelled`
 *  в него не входят: это конец истории, а не её шаг. */
export const ORDER_STEPS: OrderStatus[] = ['queued', 'cooking', 'ready', 'served'];

/** Номер шага (0..3). Неизвестный статус считаем началом пути, а не концом:
 *  обещать гостю больше, чем произошло, нельзя. */
export function orderStatusStep(status: OrderStatus): number {
  const index = ORDER_STEPS.indexOf(status);
  if (index >= 0) return index;
  return status === 'paid' ? ORDER_STEPS.length - 1 : 0;
}

export function toOrderStatus(value: string): OrderStatus {
  return (Object.keys(GUEST_LABELS) as OrderStatus[]).includes(value as OrderStatus)
    ? (value as OrderStatus)
    : 'queued';
}
