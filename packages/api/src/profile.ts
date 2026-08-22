import type { StaffGoal, StaffShift } from '@food/domain';
import { supabase } from './client';

/**
 * Кабинет сотрудника: расписание смен, заработок и цели. Всё считается от
 * заказов и чаевых, которые уже есть в базе, — отдельного «кошелька» нет,
 * потому что деньги в приложении не двигаются (платёжного шлюза нет).
 */
export interface StaffStats {
  /** Смена по расписанию на сегодня — из неё живёт кнопка «Начать смену». */
  today?: StaffShift;
  /** Ближайшие смены после сегодняшней. */
  upcoming: StaffShift[];
  /** Чаевые за сегодня и за всё время. */
  tipsToday: number;
  tipsTotal: number;
  /** Сумма принятых заказов за всё время — от неё считается ранг. */
  ordersTotal: number;
  ordersToday: number;
  /** Чаевые по дням за последнюю неделю: [{ day: '2026-08-21', amount: 40 }]. */
  tipsByDay: { day: string; amount: number }[];
  goals: StaffGoal[];
}

function toShift(row: {
  id: string;
  starts_at: string;
  ends_at: string;
  started_at: string | null;
  ended_at: string | null;
}): StaffShift {
  return {
    id: row.id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    startedAt: row.started_at ?? undefined,
    endedAt: row.ended_at ?? undefined,
  };
}

export async function fetchStaffStats(staffId: string): Promise<StaffStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = new Date(startOfDay);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [shiftsResult, ordersResult, tipsResult, goalsResult] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, starts_at, ends_at, started_at, ended_at')
      .eq('staff_id', staffId)
      .gte('starts_at', startOfDay.toISOString())
      .order('starts_at')
      .limit(8),
    // Заказы официанта: те, что он принял сам. Ранг — про работу с гостем
    // за столом, и гостевой заказ через QR к ней не относится.
    supabase.from('orders').select('total, tip, placed_at').eq('waiter_id', staffId),
    // Чаевые — по столам официанта, как их считает и главный экран: гость
    // благодарит за обслуживание столика, а не за то, кто нажал «принять».
    // Два разных счёта одного числа расходились: на главной «41 с. за смену»,
    // в кабинете — ноль, и официант не знал, какому верить.
    supabase
      .from('orders')
      .select('tip, placed_at, dining_tables!inner (waiter_id)')
      .eq('dining_tables.waiter_id', staffId),
    supabase.from('staff_goals').select('id, title, target').eq('staff_id', staffId).order('created_at'),
  ]);

  if (shiftsResult.error) throw shiftsResult.error;

  const shifts = (shiftsResult.data ?? []).map(toShift);
  const todayEnd = new Date(startOfDay);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const today = shifts.find((shift) => new Date(shift.startsAt) < todayEnd);

  const orders = ordersResult.data ?? [];
  const tipped = tipsResult.data ?? [];
  const isToday = (iso: string) => new Date(iso) >= startOfDay;

  const tipsByDay = new Map<string, number>();
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekAgo);
    day.setDate(day.getDate() + i);
    tipsByDay.set(day.toISOString().slice(0, 10), 0);
  }
  for (const order of tipped) {
    const day = order.placed_at.slice(0, 10);
    if (tipsByDay.has(day)) tipsByDay.set(day, (tipsByDay.get(day) ?? 0) + Number(order.tip ?? 0));
  }

  return {
    today,
    upcoming: shifts.filter((shift) => shift.id !== today?.id),
    tipsToday: tipped.filter((o) => isToday(o.placed_at)).reduce((sum, o) => sum + Number(o.tip ?? 0), 0),
    tipsTotal: tipped.reduce((sum, o) => sum + Number(o.tip ?? 0), 0),
    ordersToday: orders.filter((o) => isToday(o.placed_at)).length,
    ordersTotal: orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0),
    tipsByDay: [...tipsByDay.entries()].map(([day, amount]) => ({ day, amount })),
    goals: (goalsResult.data ?? []).map((row) => ({ id: row.id, title: row.title, target: Number(row.target) })),
  };
}

/** Смена на сегодня — нужна главному экрану, которому вся статистика ни к чему. */
export async function fetchTodayShift(staffId: string): Promise<StaffShift | null> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const { data, error } = await supabase
    .from('shifts')
    .select('id, starts_at, ends_at, started_at, ended_at')
    .eq('staff_id', staffId)
    .gte('starts_at', startOfDay.toISOString())
    .lt('starts_at', endOfDay.toISOString())
    .order('starts_at')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toShift(data) : null;
}

/** Начало и конец смены — факт, а не расписание: сотрудник мог опоздать. */
export async function startShift(shiftId: string): Promise<void> {
  const { error } = await supabase
    .from('shifts')
    .update({ started_at: new Date().toISOString() })
    .eq('id', shiftId);
  if (error) throw error;
}

export async function endShift(shiftId: string): Promise<void> {
  const { error } = await supabase.from('shifts').update({ ended_at: new Date().toISOString() }).eq('id', shiftId);
  if (error) throw error;
}

export async function addGoal(staffId: string, title: string, target: number): Promise<void> {
  const { error } = await supabase.from('staff_goals').insert({ staff_id: staffId, title, target });
  if (error) throw error;
}

export async function removeGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('staff_goals').delete().eq('id', goalId);
  if (error) throw error;
}
