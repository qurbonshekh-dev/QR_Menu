import type {
  DeliveryKind,
  DeliveryStatus,
  OrderStatus,
  SessionOrderItem,
} from '@food/domain';
import { toOrderStatus } from '@food/domain';
import { channelName, supabase, currentRestaurantId } from './client';
import type { WaiterOrderItem } from './orders';

/** Заказ на выдачу: сам заказ плюс всё, что вокруг него — адрес, курьер, деньги. */
export interface Delivery {
  id: string;
  orderId: string;
  /** Номер заказа — тот же, что видит кухня. */
  number: number;
  kind: DeliveryKind;
  status: DeliveryStatus;
  /** Статус кухни: менеджер ведёт свой путь, но должен видеть, готово ли блюдо. */
  kitchenStatus: OrderStatus;
  createdAt: string;

  customerName?: string;
  customerPhone: string;
  street?: string;
  house?: string;
  entrance?: string;
  floor?: string;
  flat?: string;
  courierComment?: string;
  leaveAtDoor: boolean;
  callOnArrival: boolean;

  payment: 'online' | 'cash';
  changeFrom?: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  promoCode?: string;
  tip: number;

  /** Сумма блюд без доставки и сборов. */
  itemsTotal: number;
  items: SessionOrderItem[];
}

const SELECT =
  'id, order_id, kind, status, customer_name, customer_phone, street, house, entrance, floor, flat, courier_comment, leave_at_door, call_on_arrival, payment, change_from, delivery_fee, service_fee, discount, promo_code, created_at, orders (number, status, total, tip, order_items (id, title, options, modifiers, quantity, unit_price, status))';

type Row = {
  id: string;
  order_id: string;
  kind: string;
  status: string;
  customer_name: string | null;
  customer_phone: string;
  street: string | null;
  house: string | null;
  entrance: string | null;
  floor: string | null;
  flat: string | null;
  courier_comment: string | null;
  leave_at_door: boolean;
  call_on_arrival: boolean;
  payment: string;
  change_from: number | null;
  delivery_fee: number;
  service_fee: number;
  discount: number;
  promo_code: string | null;
  created_at: string;
  orders: {
    number: number;
    status: string;
    total: number;
    tip: number;
    order_items: {
      id: string;
      title: string;
      options: string | null;
      modifiers: string | null;
      quantity: number;
      unit_price: number;
      status: string;
    }[];
  } | null;
};

function toDelivery(row: Row): Delivery {
  return {
    id: row.id,
    orderId: row.order_id,
    number: row.orders?.number ?? 0,
    kind: row.kind === 'pickup' ? 'pickup' : 'delivery',
    status: (row.status as DeliveryStatus) ?? 'new',
    kitchenStatus: toOrderStatus(row.orders?.status ?? 'queued'),
    createdAt: row.created_at,
    customerName: row.customer_name ?? undefined,
    customerPhone: row.customer_phone,
    street: row.street ?? undefined,
    house: row.house ?? undefined,
    entrance: row.entrance ?? undefined,
    floor: row.floor ?? undefined,
    flat: row.flat ?? undefined,
    courierComment: row.courier_comment ?? undefined,
    leaveAtDoor: row.leave_at_door,
    callOnArrival: row.call_on_arrival,
    payment: row.payment === 'cash' ? 'cash' : 'online',
    changeFrom: row.change_from ?? undefined,
    deliveryFee: Number(row.delivery_fee ?? 0),
    serviceFee: Number(row.service_fee ?? 0),
    discount: Number(row.discount ?? 0),
    promoCode: row.promo_code ?? undefined,
    tip: Number(row.orders?.tip ?? 0),
    itemsTotal: Number(row.orders?.total ?? 0),
    items: (row.orders?.order_items ?? []).map((item) => ({
      key: item.id,
      title: item.title,
      options: item.options ?? undefined,
      modifiers: item.modifiers ?? undefined,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      status: toOrderStatus(item.status),
    })),
  };
}

/** Лента выдачи: свежие сверху. Доставленные и отменённые тоже показываем —
 *  смену закрывают по ним же. */
export async function fetchDeliveries(limit = 60): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select(SELECT)
    .order('created_at', { ascending: false })
    // Позиции внутри заказа — в заданном порядке: иначе состав карточки
    // перетасовывается на каждой смене статуса тарелки.
    .order('title', { referencedTable: 'orders.order_items' })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as Row[]).map(toDelivery);
}

export interface CreateDeliveryInput {
  kind: DeliveryKind;
  customerName?: string;
  customerPhone: string;
  street?: string;
  house?: string;
  entrance?: string;
  floor?: string;
  flat?: string;
  courierComment?: string;
  leaveAtDoor?: boolean;
  callOnArrival?: boolean;
  payment: 'online' | 'cash';
  changeFrom?: number;
  deliveryFee?: number;
  serviceFee?: number;
  discount?: number;
  promoCode?: string;
  comment?: string;
  items: WaiterOrderItem[];
  itemsTotal: number;
}

/**
 * Заказ на доставку заводит менеджер: гость звонит или пишет, а приложения
 * для внешних заказов у нас нет. Создаётся обычный заказ без стола — его
 * увидит кухня — плюс строка доставки со всем, что вокруг.
 */
export async function createDelivery(input: CreateDeliveryInput): Promise<{ number: number }> {
  const restaurantId = await currentRestaurantId();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id: restaurantId,
      table_id: null,
      // Канал спрашивают у самого заказа: кухня по нему подписывает тикет,
      // а гадать по связям — значит держать развилку в трёх местах.
      channel: input.kind,
      serving_mode: 'together',
      comment: input.comment?.trim() || null,
      total: input.itemsTotal,
    })
    .select('id, number')
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
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  );
  if (itemsError) throw itemsError;

  const { error } = await supabase.from('deliveries').insert({
    order_id: order.id,
    kind: input.kind,
    customer_name: input.customerName?.trim() || null,
    customer_phone: input.customerPhone.trim(),
    street: input.street?.trim() || null,
    house: input.house?.trim() || null,
    entrance: input.entrance?.trim() || null,
    floor: input.floor?.trim() || null,
    flat: input.flat?.trim() || null,
    courier_comment: input.courierComment?.trim() || null,
    leave_at_door: input.leaveAtDoor ?? false,
    call_on_arrival: input.callOnArrival ?? false,
    payment: input.payment,
    change_from: input.changeFrom ?? null,
    delivery_fee: input.deliveryFee ?? 0,
    service_fee: input.serviceFee ?? 0,
    discount: input.discount ?? 0,
    promo_code: input.promoCode?.trim() || null,
  });
  if (error) throw error;

  return { number: order.number };
}

/** Менеджер двигает заказ по канбану. Кухню это не трогает: у неё свой путь. */
export async function setDeliveryStatus(id: string, status: DeliveryStatus): Promise<void> {
  const { error } = await supabase
    .from('deliveries')
    .update({
      status,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null,
    })
    .eq('id', id);
  if (error) throw error;
}

export function subscribeDeliveries(onChange: () => void): () => void {
  const channel = supabase
    .channel(channelName('deliveries'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
