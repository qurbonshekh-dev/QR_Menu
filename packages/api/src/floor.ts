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
      .select('id, number, seats, status, reserved_at')
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
    tables: (tablesResult.data ?? [])
      .slice()
      .sort((a, b) => Number(a.number) - Number(b.number))
      .map((row) => ({
        id: row.id,
        number: row.number,
        status: toStatus(row.status),
        seats: row.seats,
        alerts: alertsByTable.get(row.id) ?? 0,
        reservedAt: row.reserved_at
          ? new Date(row.reserved_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          : undefined,
      })),
  };
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

/** Официант подошёл к столу — закрываем открытые вызовы. */
export async function resolveWaiterCalls(tableId: string): Promise<void> {
  const { error } = await supabase
    .from('waiter_calls')
    .update({ resolved_at: new Date().toISOString() })
    .eq('table_id', tableId)
    .is('resolved_at', null);
  if (error) throw error;
}
