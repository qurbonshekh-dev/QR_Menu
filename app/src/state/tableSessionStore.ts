import { createContext, useContext } from 'react';

export interface TableSessionValue {
  /** Номер стола — из URL/QR (?table=), без persistence: нет параметра — дефолт. */
  tableNumber: string;
  /** ID ресторана из URL — прокидывается на будущее (мультиресторанный бэкенд),
   *  сейчас ни на что не влияет: меню всегда берётся из единственного мока. */
  restaurantId: string | null;
  /** Ручная смена стола с главной — гость пересел, а QR остался на прежнем столе. */
  setTableNumber: (next: string) => void;
}

export const TableSessionContext = createContext<TableSessionValue | null>(null);

export function useTableSession(): TableSessionValue {
  const value = useContext(TableSessionContext);
  if (!value) {
    throw new Error('useTableSession must be used inside <TableSessionProvider>');
  }
  return value;
}
