/** Сотрудник и его смена. Общее для приложений официанта, кухни и админки. */

export type StaffRole = 'waiter' | 'cook' | 'manager';

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
