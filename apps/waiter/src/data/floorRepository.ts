// Данные зала приходят из общего слоя @food/api (Supabase). Здесь остаётся
// только то, чего в базе пока нет: расписание смены. Появится таблица shifts —
// уедет и это.
import type { Shift, StaffMember } from '@food/domain';

export { fetchFloor, subscribeFloor, resolveWaiterCalls, setTableStatus, fetchTableService } from '@food/api';
export type { FloorSnapshot, TableService } from '@food/api';

/** Смена жёстко задана: таблицы расписаний в базе ещё нет. */
export const currentShift: Shift = { startsAt: '12:00', endsAt: '16:00', active: false };

/** Инициалы для аватара: фотографий сотрудников в моке нет. */
export function initials(member: StaffMember): string {
  return member.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
