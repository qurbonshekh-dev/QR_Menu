// Единственная точка доступа к данным зала. Экраны не знают, откуда столы —
// сейчас это локальный мок, дальше сюда подставляется Supabase без правок UI.
// Тот же шов, что menuRepository в гостевом приложении.
import type { FloorTable, Shift, StaffMember } from '@food/domain';

const waiter: StaffMember = { id: 's-1', name: 'Фаррух Каримов', role: 'waiter' };

const shift: Shift = { startsAt: '12:00', endsAt: '16:00', active: false };

const tables: FloorTable[] = [
  { id: 't-21', number: '21', status: 'attention', seats: 2, alerts: 1 },
  { id: 't-24', number: '24', status: 'free', seats: 4, alerts: 0 },
  { id: 't-25', number: '25', status: 'free', seats: 2, alerts: 0 },
  { id: 't-26', number: '26', status: 'busy', seats: 6, alerts: 0 },
  { id: 't-27', number: '27', status: 'reserved', seats: 4, alerts: 0, reservedAt: '19:30' },
  { id: 't-28', number: '28', status: 'attention', seats: 4, alerts: 2 },
];

/** Чаевые смены — пока мок. Реальные придут вместе с платежами (фаза 4 ТЗ). */
const tips = 340;

/** Имитация сетевой задержки, чтобы экран сразу умел показывать загрузку. */
function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface FloorSnapshot {
  waiter: StaffMember;
  shift: Shift;
  tables: FloorTable[];
  tips: number;
}

export function getFloor(): Promise<FloorSnapshot> {
  return delay({ waiter, shift, tables, tips });
}

/** Инициалы для аватара: фотографий сотрудников в моке нет. */
export function initials(member: StaffMember): string {
  return member.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
