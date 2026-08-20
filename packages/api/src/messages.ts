import { supabase } from './client';

/**
 * Запросы гостей из зала — «Принесите вилку», «Помочь с заказом». В базе это
 * `waiter_calls`: событие, а не статус стола, поэтому у него своя лента.
 */
export interface WaiterCall {
  id: string;
  tableId: string;
  tableNumber: string;
  /** Поводы приходят готовым текстом от гостя — переводить нечего. */
  reasons: string[];
  createdAt: string;
  /** Когда официант отметил «Выполнено». Нет — запрос ещё висит. */
  resolvedAt?: string;
}

/** Лента запросов: свежие сверху. Выполненные показываем тоже — официант
 *  должен видеть, что просьбу уже закрыли, а не гадать, померещилось ли ему. */
export async function fetchWaiterCalls(limit = 40): Promise<WaiterCall[]> {
  const { data, error } = await supabase
    .from('waiter_calls')
    .select('id, table_id, reasons, created_at, resolved_at, dining_tables (number)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    tableId: row.table_id,
    tableNumber: row.dining_tables?.number ?? '—',
    reasons: row.reasons ?? [],
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
  }));
}

export async function resolveWaiterCall(id: string): Promise<void> {
  const { error } = await supabase
    .from('waiter_calls')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Новый запрос должен появляться сам: официант не обновляет экран, он несёт
 *  тарелки. Таблица уже опубликована в supabase_realtime — см. CLAUDE.md. */
export function subscribeWaiterCalls(onChange: () => void): () => void {
  const channel = supabase
    .channel('waiter-calls')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls' }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
