import type { ServiceItem, SplitState } from '@food/domain';
import { serviceItemStatus } from '@food/domain';
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
    .select('id, number, status, total, split, placed_at, order_items (id, title, options, comment, quantity, unit_price, dishes (slug))')
    .eq('table_id', tableId)
    .neq('status', 'cancelled')
    .gte('placed_at', startOfDay.toISOString())
    .order('placed_at');
  if (error) throw error;
  if (!data?.length) return EMPTY;

  const items: ServiceItem[] = [];
  let guests = 1;
  let total = 0;

  for (const order of data) {
    const split = (order.split ?? null) as SplitState | null;
    if (split?.guests) guests = Math.max(guests, split.guests);
    total += Number(order.total ?? 0);

    const status = serviceItemStatus(order.status);
    const assignments = pendingAssignments(split);

    for (const item of order.order_items ?? []) {
      items.push({
        id: item.id,
        orderNumber: order.number,
        title: item.title,
        quantity: item.quantity,
        options: item.options ?? undefined,
        comment: item.comment ?? undefined,
        unitPrice: item.unit_price,
        status,
        guest: takeGuest(assignments, item.dishes?.slug),
      });
    }
  }

  return { items, guests, total };
}

/**
 * Раскладка гостя приходит ключами строк корзины (`d-13|g-size:o-25`), а в
 * `order_items` этого ключа нет — есть блюдо и текст выбора. Поэтому позицию
 * сопоставляем по слагу блюда и «съедаем» ключ, чтобы вторая такая же позиция
 * досталась следующему гостю. Два разных размера одной пиццы у разных гостей
 * могут поменяться местами — это лучше, чем не показать гостей вовсе.
 * Точным сопоставление станет, когда ключ строки поедет в `order_items`.
 */
function pendingAssignments(split: SplitState | null): [string, number][] {
  if (!split || split.mode !== 'items') return [];
  return Object.entries(split.assignments);
}

function takeGuest(pending: [string, number][], slug: string | undefined): number | undefined {
  if (!slug) return undefined;
  const index = pending.findIndex(([key]) => key === slug || key.startsWith(`${slug}|`));
  if (index < 0) return undefined;
  const [, guest] = pending[index];
  pending.splice(index, 1);
  return guest;
}
