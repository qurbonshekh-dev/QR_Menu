import type { ServiceItem, SplitState } from '@food/domain';
import { pendingAssignments, serviceItemStatus, takeGuestBySlug } from '@food/domain';
import { supabase } from './client';

export interface TableService {
  items: ServiceItem[];
  /** Сколько гостей делят счёт — из раскладки, сделанной гостем в корзине. */
  guests: number;
  /** Сумма заказов стола за сегодня, без чаевых. */
  total: number;
}

const EMPTY: TableService = { items: [], guests: 1, total: 0 };

/**
 * Состав заказа стола. Берём только сегодняшние заказы: вчерашний визит за тем
 * же столом к текущим гостям отношения не имеет, а признака «визит» в базе нет.
 */
export async function fetchTableService(tableId: string): Promise<TableService> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('orders')
    // Строка select — литерал: склейка через + схлопывает типы встроенных выборок.
    .select('id, number, status, total, split, guests, placed_at, order_items (id, title, options, comment, modifiers, quantity, unit_price, guest_index, serve_after_minutes, status, dishes (slug))')
    .eq('table_id', tableId)
    // Закрытый счёт — это прошлый визит: за столом уже другие гости.
    .not('status', 'in', '(cancelled,paid)')
    .gte('placed_at', startOfDay.toISOString())
    .order('placed_at');
  if (error) throw error;
  if (!data?.length) return EMPTY;

  const items: ServiceItem[] = [];
  let guests = 1;
  let total = 0;

  for (const order of data) {
    const split = (order.split ?? null) as SplitState | null;
    // Число гостей знает либо официант (спросил, садясь за стол), либо раскладка
    // счёта гостя. Берём большее: за столом мог появиться ещё один стул.
    if (order.guests) guests = Math.max(guests, order.guests);
    if (split?.guests) guests = Math.max(guests, split.guests);
    total += Number(order.total ?? 0);

    const assignments = pendingAssignments(split);

    for (const item of order.order_items ?? []) {
      items.push({
        id: item.id,
        orderNumber: order.number,
        title: item.title,
        quantity: item.quantity,
        options: item.options ?? undefined,
        comment: item.comment ?? undefined,
        modifiers: item.modifiers ?? undefined,
        serveAfterMinutes: item.serve_after_minutes ?? undefined,
        unitPrice: item.unit_price,
        // Статус берём с самой позиции; статус заказа остаётся запасным для строк,
        // заведённых до того, как он переехал на тарелку.
        status: serviceItemStatus(item.status ?? order.status),
        // Заказ, принятый официантом, знает гостя точно — он проставлен в позиции.
        // Догадка по слагу остаётся только для гостевых заказов с раскладкой счёта.
        guest: item.guest_index ?? takeGuestBySlug(assignments, item.dishes?.slug),
      });
    }
  }

  return { items, guests, total };
}

/** Официант отдал одну тарелку. Статус заказа пересчитает триггер: заказ
 *  «подан», когда подана последняя позиция, а не первая. */
export async function serveOrderItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('order_items').update({ status: 'served' }).eq('id', itemId);
  if (error) throw error;
}
