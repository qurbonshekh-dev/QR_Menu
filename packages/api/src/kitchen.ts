import type { KitchenTicket, TicketStatus } from '@food/domain';
import { supabase, currentRestaurantId } from './client';

/** На доске живут только незакрытые заказы: выданные уходят с экрана. */
const BOARD_STATUSES = ['queued', 'cooking', 'ready'];

function toTicketStatus(value: string): TicketStatus {
  return value === 'cooking' || value === 'ready' ? value : 'queued';
}

export async function fetchTickets(): Promise<KitchenTicket[]> {
  const restaurantId = await currentRestaurantId();
  const { data, error } = await supabase
    .from('orders')
    // Строка select должна быть литералом: supabase-js выводит типы встроенных
    // выборок из неё самой, а склейка через + превращает её в обычный string.
    .select('id, number, status, serving_mode, comment, placed_at, ready_at, dining_tables (number), order_items (id, title, options, comment, quantity)')
    .eq('restaurant_id', restaurantId)
    .in('status', BOARD_STATUSES)
    .order('placed_at');
  if (error) throw error;

  return (data ?? []).map((order) => ({
    id: String(order.number),
    table: order.dining_tables?.number ?? '—',
    placedAt: order.placed_at,
    readyAt: order.ready_at ?? undefined,
    servingMode: order.serving_mode === 'together' ? 'together' : 'ready',
    comment: order.comment ?? undefined,
    status: toTicketStatus(order.status),
    items: (order.order_items ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      options: item.options ?? undefined,
      comment: item.comment ?? undefined,
    })),
  }));
}

/**
 * Подписка на ленту заказов. Форма та же, что была у локального мока, поэтому
 * экран кухни менять не пришлось: сначала текущая очередь, дальше — обновления.
 */
export function subscribeTickets(onChange: (tickets: KitchenTicket[]) => void): () => void {
  let disposed = false;

  const push = () => {
    void fetchTickets().then((tickets) => {
      if (!disposed) onChange(tickets);
    });
  };

  push();

  const channel = supabase
    .channel('kitchen')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, push)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, push)
    .subscribe();

  return () => {
    disposed = true;
    void supabase.removeChannel(channel);
  };
}

/** Повар двигает тикет по доске. `ready_at` и статус стола проставит триггер в базе. */
export async function setTicketStatus(ticketNumber: string, status: TicketStatus | 'served'): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('number', Number(ticketNumber));
  if (error) throw error;
}
