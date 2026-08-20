import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { draftLineKey, type DraftLine, type ServingMode } from '@food/domain';
import { DraftContext, type DraftState, type DraftValue } from './draftStore';

const STORAGE_KEY = 'waiter.draft';

/**
 * Черновик переживает перезагрузку вкладки, но не смену: sessionStorage, а не
 * localStorage. Набранный вчера и забытый заказ хуже пустого экрана — официант
 * отправит его на кухню, не глядя.
 */
function read(): DraftState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DraftState) : null;
  } catch {
    return null;
  }
}

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<DraftState | null>(read);

  useEffect(() => {
    if (draft) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [draft]);

  const start = useCallback((tableId: string, tableNumber: string, guests: number) => {
    setDraft({ tableId, tableNumber, guests, lines: [], servingMode: 'ready' });
  }, []);

  const addLine = useCallback((line: Omit<DraftLine, 'key'>) => {
    const key = draftLineKey(line.dishId, line.options, line.removed, line.extras, line.guest);
    setDraft((current) => {
      if (!current) return current;
      const existing = current.lines.find((row) => row.key === key);
      // Та же тарелка тому же гостю — не новая строка, а +1 к количеству:
      // на кухне это одна позиция, и в счёте тоже.
      const lines = existing
        ? current.lines.map((row) =>
            row.key === key ? { ...row, quantity: row.quantity + line.quantity } : row,
          )
        : [...current.lines, { ...line, key }];
      return { ...current, lines };
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            lines:
              quantity > 0
                ? current.lines.map((row) => (row.key === key ? { ...row, quantity } : row))
                : current.lines.filter((row) => row.key !== key),
          }
        : current,
    );
  }, []);

  const setGuest = useCallback((key: string, guest: number | null) => {
    setDraft((current) => {
      if (!current) return current;
      const moved = current.lines.find((row) => row.key === key);
      if (!moved) return current;

      const nextKey = draftLineKey(moved.dishId, moved.options, moved.removed, moved.extras, guest);
      const rest = current.lines.filter((row) => row.key !== key);
      const twin = rest.find((row) => row.key === nextKey);

      // Перенесли к гостю, у которого уже есть такая же тарелка, — складываем,
      // иначе у него окажутся две одинаковые строки по одной штуке.
      const lines = twin
        ? rest.map((row) =>
            row.key === nextKey ? { ...row, quantity: row.quantity + moved.quantity } : row,
          )
        : [...rest, { ...moved, key: nextKey, guest }];

      return { ...current, lines };
    });
  }, []);

  const setServeAfter = useCallback((key: string, minutes: number | undefined) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            lines: current.lines.map((row) =>
              row.key === key ? { ...row, serveAfterMinutes: minutes } : row,
            ),
          }
        : current,
    );
  }, []);

  const setServingMode = useCallback((servingMode: ServingMode) => {
    setDraft((current) => (current ? { ...current, servingMode } : current));
  }, []);

  const setComment = useCallback((comment: string) => {
    setDraft((current) => (current ? { ...current, comment } : current));
  }, []);

  const discard = useCallback(() => setDraft(null), []);

  const value = useMemo<DraftValue>(
    () => ({ draft, start, addLine, setQuantity, setGuest, setServeAfter, setServingMode, setComment, discard }),
    [draft, start, addLine, setQuantity, setGuest, setServeAfter, setServingMode, setComment, discard],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}
