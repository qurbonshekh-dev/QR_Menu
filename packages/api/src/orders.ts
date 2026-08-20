import type { ServingMode, SplitState } from '@food/domain';
import { supabase, currentRestaurantId } from './client';

export interface PlacedOrderItem {
  /** Слаг блюда — тот же, что в меню (`d-13`). */
  dishSlug: string;
  /** Название и цена копируются в заказ: переименуют блюдо — старый счёт и
   *  тикет на кухне не должны измениться задним числом. */
  title: string;
  options?: string;
  comment?: string;
  quantity: number;
  unitPrice: number;
}

export interface PlaceOrderInput {
  tableNumber: string;
  items: PlacedOrderItem[];
  total: number;
  servingMode: ServingMode;
  comment?: string;
  split?: SplitState | null;
}

export interface PlacedOrder {
  id: string;
  number: number;
  placedAt: string;
}

/** Оформление заказа. Стол ищем по номеру со стикера — гость знает только его. */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const restaurantId = await currentRestaurantId();

  const { data: table, error: tableError } = await supabase
    .from('dining_tables')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('number', input.tableNumber)
    .single();
  if (tableError) throw tableError;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id: restaurantId,
      table_id: table.id,
      serving_mode: input.servingMode,
      comment: input.comment?.trim() || null,
      total: input.total,
      split: input.split ? JSON.parse(JSON.stringify(input.split)) : null,
    })
    .select('id, number, placed_at')
    .single();
  if (orderError) throw orderError;

  const slugs = [...new Set(input.items.map((item) => item.dishSlug))];
  const { data: dishes } = await supabase.from('dishes').select('id, slug').in('slug', slugs);
  const dishIdBySlug = new Map((dishes ?? []).map((dish) => [dish.slug, dish.id]));

  const { error: itemsError } = await supabase.from('order_items').insert(
    input.items.map((item) => ({
      order_id: order.id,
      dish_id: dishIdBySlug.get(item.dishSlug) ?? null,
      title: item.title,
      options: item.options ?? null,
      comment: item.comment ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  );
  if (itemsError) throw itemsError;

  return { id: order.id, number: order.number, placedAt: order.placed_at };
}

export interface TableOrder {
  id: string;
  number: number;
  status: string;
  servingMode: ServingMode;
  comment?: string;
  total: number;
  tip: number;
  placedAt: string;
  items: { key: string; title: string; options?: string; quantity: number; unitPrice: number }[];
}

/** Заказы стола — из них живут «Мои заказы» и счёт. Оплаченные (`served`)
 *  тоже возвращаем: гость платит в конце визита, а не после каждого блюда. */
export async function fetchTableOrders(tableNumber: string): Promise<TableOrder[]> {
  const restaurantId = await currentRestaurantId();
  const { data: table } = await supabase
    .from('dining_tables')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('number', tableNumber)
    .single();
  if (!table) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('id, number, status, serving_mode, comment, total, tip, placed_at, order_items (id, title, options, quantity, unit_price)')
    .eq('table_id', table.id)
    .neq('status', 'cancelled')
    .order('placed_at');
  if (error) throw error;

  return (data ?? []).map((order) => ({
    id: order.id,
    number: order.number,
    status: order.status,
    servingMode: order.serving_mode === 'together' ? 'together' : 'ready',
    comment: order.comment ?? undefined,
    total: order.total,
    tip: order.tip,
    placedAt: order.placed_at,
    items: (order.order_items ?? []).map((item) => ({
      key: item.id,
      title: item.title,
      options: item.options ?? undefined,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
  }));
}

/** Чаевые кладём на последний заказ стола: счёт гость закрывает один раз. */
export async function setTableTip(tableNumber: string, tip: number): Promise<void> {
  const orders = await fetchTableOrders(tableNumber);
  const last = orders.at(-1);
  if (!last) return;
  const { error } = await supabase.from('orders').update({ tip }).eq('id', last.id);
  if (error) throw error;
}

/** Вызов официанта. Стол при этом не трогаем: «зовут» — это событие, а не статус. */
export async function callWaiter(tableNumber: string, reasons: string[]): Promise<void> {
  const restaurantId = await currentRestaurantId();
  const { data: table } = await supabase
    .from('dining_tables')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('number', tableNumber)
    .single();
  if (!table) return;
  const { error } = await supabase.from('waiter_calls').insert({ table_id: table.id, reasons });
  if (error) throw error;
}

export interface WaiterOrderItem {
  dishSlug: string;
  title: string;
  options?: string;
  /** Снимок модификаторов: «без лука · + сыр чеддер». */
  modifiers?: string;
  comment?: string;
  quantity: number;
  /** Цена порции с добавками — та, что попадёт в счёт. */
  unitPrice: number;
  /** Индекс гостя (0-based), null — общее блюдо. */
  guest: number | null;
  /** Курс подачи в минутах; undefined — по готовности. */
  serveAfterMinutes?: number;
}

export interface PlaceWaiterOrderInput {
  tableId: string;
  waiterId: string;
  guests: number;
  servingMode: ServingMode;
  comment?: string;
  items: WaiterOrderItem[];
  total: number;
}

/**
 * Заказ, принятый официантом за столом. Отличается от гостевого тремя вещами:
 * известен официант, известно число гостей и у каждой позиции есть свой гость
 * и время подачи. Стол ищем по id, а не по номеру: официант выбрал его в зале,
 * а не прочитал со стикера.
 */
export async function placeWaiterOrder(input: PlaceWaiterOrderInput): Promise<PlacedOrder> {
  const restaurantId = await currentRestaurantId();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id: restaurantId,
      table_id: input.tableId,
      waiter_id: input.waiterId,
      guests: input.guests,
      serving_mode: input.servingMode,
      comment: input.comment?.trim() || null,
      total: input.total,
    })
    .select('id, number, placed_at')
    .single();
  if (orderError) throw orderError;

  const slugs = [...new Set(input.items.map((item) => item.dishSlug))];
  const { data: dishes } = await supabase.from('dishes').select('id, slug').in('slug', slugs);
  const dishIdBySlug = new Map((dishes ?? []).map((dish) => [dish.slug, dish.id]));

  const { error: itemsError } = await supabase.from('order_items').insert(
    input.items.map((item) => ({
      order_id: order.id,
      dish_id: dishIdBySlug.get(item.dishSlug) ?? null,
      title: item.title,
      options: item.options ?? null,
      modifiers: item.modifiers ?? null,
      comment: item.comment ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      guest_index: item.guest,
      serve_after_minutes: item.serveAfterMinutes ?? null,
    })),
  );
  if (itemsError) throw itemsError;

  return { id: order.id, number: order.number, placedAt: order.placed_at };
}
