import type { FloorTable, StaffMember, TableStatus } from '@food/domain';
import { channelName, supabase, currentRestaurantId } from './client';

const STATUSES: TableStatus[] = ['free', 'busy', 'awaiting', 'reserved'];

function toStatus(value: string): TableStatus {
  return (STATUSES as string[]).includes(value) ? (value as TableStatus) : 'free';
}

export interface FloorSnapshot {
  waiter: StaffMember;
  tables: FloorTable[];
  /** Чаевые за сегодня — сумма по заказам смены. */
  tips: number;
}

/**
 * Зал глазами конкретного официанта: «Мои столы» из ТЗ — это столы, закреплённые
 * за вошедшим сотрудником, а чаевые за смену — чаевые с его столов. Пока
 * официант брался в базе первым попавшимся, оба числа были общими по ресторану.
 */
export async function fetchFloor(waiter: StaffMember): Promise<FloorSnapshot> {
  const restaurantId = await currentRestaurantId();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [tablesResult, callsResult, tipsResult] = await Promise.all([
    supabase
      .from('dining_tables')
      .select('id, number, seats, status, reserved_at, merged_into')
      .eq('restaurant_id', restaurantId)
      .eq('waiter_id', waiter.id)
      .order('number'),
    // Открытые вызовы — это и есть счётчик событий на плитке стола.
    supabase.from('waiter_calls').select('table_id').is('resolved_at', null),
    // Чаевые считаем по столам официанта: !inner превращает вложенную выборку
    // в join, иначе фильтр по чужой таблице просто не применится.
    supabase
      .from('orders')
      .select('tip, dining_tables!inner (waiter_id)')
      .eq('dining_tables.waiter_id', waiter.id)
      .gte('placed_at', startOfDay.toISOString()),
  ]);

  if (tablesResult.error) throw tablesResult.error;

  const alertsByTable = new Map<string, number>();
  for (const call of callsResult.data ?? []) {
    alertsByTable.set(call.table_id, (alertsByTable.get(call.table_id) ?? 0) + 1);
  }

  const tips = (tipsResult.data ?? []).reduce((sum, order) => sum + Number(order.tip ?? 0), 0);

  return {
    tips,
    waiter,
    // Присоединённый стол в ленте отдельной плиткой не стоит: он часть другого,
    // и счёт у них один. Его номер показывается на карточке главного стола.
    tables: (tablesResult.data ?? [])
      .filter((row) => !row.merged_into)
      .slice()
      .sort((a, b) => Number(a.number) - Number(b.number))
      .map((row) => ({
        id: row.id,
        number: row.number,
        status: toStatus(row.status),
        seats: seatsOf(row, tablesResult.data ?? []),
        alerts: alertsByTable.get(row.id) ?? 0,
        reservedAt: row.reserved_at
          ? new Date(row.reserved_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          : undefined,
        mergedWith: (tablesResult.data ?? [])
          .filter((other) => other.merged_into === row.id)
          .map((other) => ({ id: other.id, number: other.number })),
      })),
  };
}

/** Объединённый стол вмещает столько же, сколько все его половины вместе:
 *  официант сажает компанию за оба. */
function seatsOf(row: { id: string; seats: number }, all: { merged_into: string | null; seats: number }[]): number {
  return all
    .filter((other) => other.merged_into === row.id)
    .reduce((sum, other) => sum + other.seats, row.seats);
}

/** Один стол по id — экраны приёма заказа открываются по ссылке и обязаны
 *  показать номер стола, не дожидаясь загрузки всего зала. */
export async function fetchTable(tableId: string): Promise<FloorTable | null> {
  const { data, error } = await supabase
    .from('dining_tables')
    .select('id, number, seats, status, reserved_at')
    .eq('id', tableId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    number: data.number,
    status: toStatus(data.status),
    seats: data.seats,
    alerts: 0,
    reservedAt: data.reserved_at
      ? new Date(data.reserved_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : undefined,
  };
}

/** Realtime по столам: официант видит, как кухня зажигает «Ждут подачу»,
 *  не трогая экран. Вызовы официанта приходят отдельным каналом. */
export function subscribeFloor(onChange: () => void): () => void {
  const channel = supabase
    .channel(channelName('floor'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dining_tables' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls' }, onChange)
    // Заказы тоже слушаем: статус стола меняет триггер, а событие по столу
    // приходит не всегда — заказ надёжнее как сигнал «что-то произошло».
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[floor] realtime:', status);
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function setTableStatus(tableId: string, status: TableStatus): Promise<void> {
  const { error } = await supabase.from('dining_tables').update({ status }).eq('id', tableId);
  if (error) throw error;
}

/**
 * Бронь стола. Отдельной таблицы под неё пока нет: имя и телефон гостя из ТЗ
 * хранить негде, поэтому запоминаем только время — оно и есть то, ради чего
 * бронь ставят. Появится `reservations` — переедет сюда же, экран не изменится.
 */
export async function reserveTable(tableId: string, at: Date): Promise<void> {
  const { error } = await supabase
    .from('dining_tables')
    .update({ status: 'reserved', reserved_at: at.toISOString() })
    .eq('id', tableId);
  if (error) throw error;
}

/** Снять бронь — стол снова свободен. */
export async function cancelReservation(tableId: string): Promise<void> {
  const { error } = await supabase
    .from('dining_tables')
    .update({ status: 'free', reserved_at: null })
    .eq('id', tableId);
  if (error) throw error;
}

/**
 * Официант отдал готовые блюда. Двигаем сами заказы, а не статус стола:
 * «Занят» вернёт триггер `orders_sync_table_status`, и делать это руками
 * значило бы завести вторую правду о том, что происходит за столом.
 */
export async function serveReadyOrders(tableId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'served' })
    .eq('table_id', tableId)
    .eq('status', 'ready');
  if (error) throw error;
}

/**
 * Счёт закрыт, гости ушли. Двигаем заказы в `paid`, а стол освобождает триггер —
 * и только когда закрыт весь счёт, а не один заказ из трёх. Отменённые не трогаем:
 * они и так не в счёте.
 */
export async function closeTableBill(tableId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('table_id', tableId)
    .in('status', ['queued', 'cooking', 'ready', 'served']);
  if (error) throw error;
}

/** Гости пересели за другой стол — заказы переезжают вместе с ними. */
export async function moveTableOrders(fromTableId: string, toTableId: string): Promise<void> {
  const { error } = await supabase.rpc('move_table_orders', { from_table: fromTableId, to_table: toTableId });
  if (error) throw error;
}

/** Столы сдвинули вместе: счёт становится общим, второй уходит из ленты зала. */
export async function mergeTables(primaryTableId: string, secondaryTableId: string): Promise<void> {
  const { error } = await supabase.rpc('merge_tables', {
    primary_table: primaryTableId,
    secondary_table: secondaryTableId,
  });
  if (error) throw error;
}

export async function unmergeTable(secondaryTableId: string): Promise<void> {
  const { error } = await supabase.rpc('unmerge_table', { secondary_table: secondaryTableId });
  if (error) throw error;
}

/** Официант подошёл к столу — закрываем открытые вызовы. */
export async function resolveWaiterCalls(tableId: string): Promise<void> {
  const { error } = await supabase
    .from('waiter_calls')
    .update({ resolved_at: new Date().toISOString() })
    .eq('table_id', tableId)
    .is('resolved_at', null);
  if (error) throw error;
}
