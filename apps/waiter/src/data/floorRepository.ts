// Данные зала приходят из общего слоя @food/api (Supabase). Шов оставлен
// нарочно: экраны официанта не должны знать, откуда именно приходит зал.
import type { StaffMember } from '@food/domain';

export {
  fetchFloor,
  subscribeFloor,
  resolveWaiterCalls,
  setTableStatus,
  fetchTableService,
  reserveTable,
  cancelReservation,
  serveReadyOrders,
  closeTableBill,
  serveOrderItem,
  moveTableOrders,
  mergeTables,
  unmergeTable,
} from '@food/api';
export type { FloorSnapshot, TableService } from '@food/api';

/** Инициалы для аватара: фотографий сотрудников в моке нет. */
export function initials(member: StaffMember): string {
  return member.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
