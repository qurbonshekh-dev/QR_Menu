import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  closeCashShift,
  fetchOpenCashShift,
  fetchShiftSummary,
  openCashShift,
  type CashShift,
  type ShiftSummary,
} from '@food/api';
import { CashShiftContext, type CashShiftValue } from './cashShiftStore';

const EMPTY: ShiftSummary = {
  receipts: 0,
  revenue: 0,
  average: 0,
  byMethod: { cash: 0, card: 0, qr: 0 },
  refunds: 0,
  tips: 0,
  discounts: 0,
  cashExpected: 0,
};

/**
 * Кассовая смена — общее состояние всей кассы: и зал, и стойка выписывают чеки
 * в неё, и сводка обязана меняться сразу. Держим её здесь, а не в каждом
 * экране: два счётчика выручки разошлись бы на первом же чеке.
 */
export function CashShiftProvider({ cashierId, children }: { cashierId: string; children: ReactNode }) {
  const [shift, setShift] = useState<CashShift | null>(null);
  const [summary, setSummary] = useState<ShiftSummary>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const current = await fetchOpenCashShift();
      setShift(current);
      setSummary(await fetchShiftSummary(current));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось прочитать смену');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const open = useCallback(
    async (cashStart: number) => {
      await openCashShift(cashierId, cashStart);
      await refresh();
    },
    [cashierId, refresh],
  );

  const close = useCallback(
    async (cashCounted: number, note?: string) => {
      if (!shift) return;
      await closeCashShift(shift.id, cashCounted, note);
      await refresh();
    },
    [shift, refresh],
  );

  const value = useMemo<CashShiftValue>(
    () => ({ shift, summary, loading, error, open, close, refresh }),
    [shift, summary, loading, error, open, close, refresh],
  );

  return <CashShiftContext.Provider value={value}>{children}</CashShiftContext.Provider>;
}
