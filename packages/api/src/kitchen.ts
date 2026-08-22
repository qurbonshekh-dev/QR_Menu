import type { KitchenTicket, TicketItemStatus, TicketStatus } from '@food/domain';
import { channelName, supabase, currentRestaurantId } from './client';

/** На доске живут только незакрытые заказы: выданные уходят с экрана. */
const BOARD_STATUSES = ['queued', 'cooking', 'ready'];

function toTicketStatus(value: string): TicketStatus {
  return value === 'cooking' || value === 'ready' ? value : 'queued';
}

function toItemStatus(value: string): TicketItemStatus {
  return value === 'cooking' || value === 'ready' || value === 'served' ? value : 'queued';
}

export async function fetchTickets(): Promise<KitchenTicket[]> {
  const restaurantId = await currentRestaurantId();
  const { data, error } = await supabase
    .from('orders')
    // Строка select должна быть литералом: supabase-js выводит типы встроенных
    // выборок из неё самой, а склейка через + превращает её в обычный string.
    .select('id, number, status, serving_mode, comment, placed_at, ready_at, dining_tables (number), deliveries (kind), order_items (id, title, options, comment, modifiers, serve_after_minutes, quantity, status)')
    .eq('restaurant_id', restaurantId)
    .in('status', BOARD_STATUSES)
    .order('placed_at')
    // Порядок позиций задаём явно: иначе отмеченная готовой строка уезжает
    // на другое место тикета, и повар теряет её под пальцем.
    .order('title', { referencedTable: 'order_items' });
  if (error) throw error;

  return (data ?? []).map((order) => ({
    id: String(order.number),
    // Заказ без стола — это выдача: доставка или самовывоз.
    place: order.dining_tables?.number
      ? `Стол ${order.dining_tables.number}`
      : order.deliveries?.kind === 'pickup'
        ? 'Самовывоз'
        : 'Доставка',
    placedAt: order.placed_at,
    readyAt: order.ready_at ?? undefined,
    servingMode: order.serving_mode === 'together' ? 'together' : 'ready',
    comment: order.comment ?? undefined,
    status: toTicketStatus(order.status),
    // Поданное с тикета убираем: при дозаказе в тот же заказ повар должен
    // видеть, что осталось приготовить, а не историю визита.
    items: (order.order_items ?? [])
      .filter((item) => item.status !== 'served')
      .map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        options: item.options ?? undefined,
        comment: item.comment ?? undefined,
        modifiers: item.modifiers ?? undefined,
        serveAfterMinutes: item.serve_after_minutes ?? undefined,
        status: toItemStatus(item.status),
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
    .channel(channelName('kitchen'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, push)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, push)
    .subscribe();

  return () => {
    disposed = true;
    void supabase.removeChannel(channel);
  };
}

/**
 * Повар двигает весь тикет: меняем статус его позиций, а статус заказа
 * пересчитает триггер. Двигать сам заказ нельзя — иначе у одного факта
 * появятся два источника, и они разойдутся на первой же полуготовой тарелке.
 */
export async function setTicketStatus(ticketNumber: string, status: TicketStatus | 'served'): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('number', Number(ticketNumber))
    .single();
  if (orderError) throw orderError;

  // Поданное не трогаем: в тикете таких строк уже нет, а в заказе они есть —
  // без этого условия «Готово» по дозаказу откатывало бы съеденное блюдо
  // обратно в «нужно подать», зажигая столу «Ждут подачу» на пустом месте.
  const query = supabase.from('order_items').update({ status }).eq('order_id', order.id);
  const { error } = status === 'served' ? await query : await query.neq('status', 'served');
  if (error) throw error;
}

/** Одна тарелка готова. Остальные позиции тикета не трогаем — в этом весь смысл. */
export async function setTicketItemStatus(itemId: string, status: TicketItemStatus): Promise<void> {
  const { error } = await supabase.from('order_items').update({ status }).eq('id', itemId);
  if (error) throw error;
}
