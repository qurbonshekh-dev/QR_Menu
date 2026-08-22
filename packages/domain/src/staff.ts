/** Сотрудник и его смена. Общее для приложений официанта, кухни и админки. */

export type StaffRole = 'waiter' | 'cook' | 'manager' | 'cashier' | 'admin';

/** Подпись роли на экране. Один словарь на все приложения: иначе «Кассир»
 *  и «Касса» разъедутся по админке и по кассе. */
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  waiter: 'Официант',
  cook: 'Повар',
  manager: 'Менеджер',
  cashier: 'Кассир',
  admin: 'Администратор',
};

/** Кому открыта касса. Менеджер и администратор заходят туда же, где кассир:
 *  подменить его в обед — обычное дело, заводить ради этого вторую роль не за чем. */
export function canUsePos(role: StaffRole): boolean {
  return role === 'cashier' || role === 'manager' || role === 'admin';
}

/** Кому можно то, что стоит денег: скидка выше порога, отмена чека, изъятие
 *  наличных. Кассиру — нет: он у стойки, и просьба гостя «сделайте скидку»
 *  адресована не ему. */
export function canApproveMoney(role: StaffRole): boolean {
  return role === 'manager' || role === 'admin';
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
}

export interface Shift {
  /** «12:00» — начало по расписанию. */
  startsAt: string;
  /** «16:00» — конец по расписанию. */
  endsAt: string;
  /** Смена уже начата сотрудником. */
  active: boolean;
}

/** Подпись смены под именем: «Смена 12:00–16:00». Тире — не дефис. */
export function formatShift(shift: Shift): string {
  return `Смена ${shift.startsAt}–${shift.endsAt}`;
}

/** Смена из расписания: план и факт. */
export interface StaffShift {
  id: string;
  /** ISO-время начала и конца по расписанию. */
  startsAt: string;
  endsAt: string;
  /** Когда сотрудник нажал «Начать смену». Нет — ещё не начал. */
  startedAt?: string;
  endedAt?: string;
}

/** Финансовая цель официанта: «Накопить на студию». */
export interface StaffGoal {
  id: string;
  title: string;
  /** Сколько нужно, в сомони. */
  target: number;
}

/**
 * Ранги из ТЗ: чем больше принято заказов, тем выше доля. Пороги считаны
 * от душанбинского чека (150–200 с. на двоих): «Умелый» — это примерно
 * два десятка столов, а не два года стажа.
 */
export interface Rank {
  name: string;
  /** Доля сотрудника в процентах — то, что показано в ТЗ как «Новичок 3%». */
  share: number;
  /** С какой суммы принятых заказов начинается ранг. */
  from: number;
}

export const RANKS: Rank[] = [
  { name: 'Новичок', share: 3, from: 0 },
  { name: 'Умелый', share: 6, from: 3_000 },
  { name: 'Мастер', share: 9, from: 12_000 },
  { name: 'Легенда', share: 12, from: 30_000 },
];

export interface RankProgress {
  current: Rank;
  /** Следующий ранг или undefined — дальше некуда. */
  next?: Rank;
  /** Доля пути до следующего ранга, 0..1. У последнего — 1. */
  progress: number;
}

export function rankOf(ordersTotal: number): RankProgress {
  const index = RANKS.reduce((found, rank, i) => (ordersTotal >= rank.from ? i : found), 0);
  const current = RANKS[index];
  const next = RANKS[index + 1];
  if (!next) return { current, progress: 1 };
  const span = next.from - current.from;
  return { current, next, progress: span > 0 ? Math.min(1, (ordersTotal - current.from) / span) : 1 };
}

/** «12:00» из ISO-времени — расписание показывается временем, а не датой. */
export function shiftTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** «Пт, 22 августа» — подпись дня в графике смен. */
export function shiftDay(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' });
}
