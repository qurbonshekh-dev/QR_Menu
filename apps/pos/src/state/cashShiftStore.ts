import { createContext, useContext } from 'react';
import type { CashShift, ShiftSummary } from '@food/api';

export interface CashShiftValue {
  shift: CashShift | null;
  summary: ShiftSummary;
  loading: boolean;
  error: string | null;
  open: (cashStart: number) => Promise<void>;
  close: (cashCounted: number, note?: string) => Promise<void>;
  /** Пересчитать сводку — после каждого выписанного чека. */
  refresh: () => Promise<void>;
}

export const CashShiftContext = createContext<CashShiftValue | null>(null);

export function useCashShift(): CashShiftValue {
  const value = useContext(CashShiftContext);
  if (!value) throw new Error('useCashShift вне CashShiftProvider');
  return value;
}
