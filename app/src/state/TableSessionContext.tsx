import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TableSessionContext, type TableSessionValue } from './tableSessionStore';

/** Стол по умолчанию, когда ссылка открыта без ?table= (демо/разработка). */
const DEFAULT_TABLE_NUMBER = '12';

/** sessionStorage, а не localStorage: стол переживает перезагрузку вкладки (и
 *  остаётся согласован с заказами сессии из state/OrdersContext), но не переживает
 *  её закрытие — запомненный чужой стол из прошлого визита хуже дефолта. */
const STORAGE_KEY = 'qr-menu.table';

function readStorage(): { tableNumber: string; restaurantId: string | null } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { tableNumber: string; restaurantId: string | null }) : null;
  } catch {
    return null;
  }
}

export function TableSessionProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();

  // Стол читается из URL один раз и дальше живёт в сессии: внутренние переходы
  // (`/menu`, `/cart`) query не переносят, а useSearchParams привязан к текущему
  // location — без этого стол молча схлопывался бы в дефолт после первого же
  // перехода с главной, и счёт оказался бы выписан на чужой стол.
  const [table, setTable] = useState(() => {
    const stored = readStorage();
    const fromUrl = searchParams.get('table');
    return fromUrl !== null
      ? { tableNumber: fromUrl, restaurantId: searchParams.get('restaurant') }
      : (stored ?? { tableNumber: DEFAULT_TABLE_NUMBER, restaurantId: null });
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(table));
  }, [table]);

  // Повторный скан QR в той же вкладке меняет стол — но только если параметр в
  // ссылке действительно есть, иначе это обычная внутренняя навигация.
  const urlTable = searchParams.get('table');
  const urlRestaurant = searchParams.get('restaurant');
  useEffect(() => {
    if (urlTable === null) return;
    setTable((current) =>
      current.tableNumber === urlTable && current.restaurantId === urlRestaurant
        ? current
        : { tableNumber: urlTable, restaurantId: urlRestaurant },
    );
  }, [urlTable, urlRestaurant]);

  const setTableNumber = useCallback((next: string) => {
    setTable((current) => ({ ...current, tableNumber: next }));
  }, []);

  const value = useMemo<TableSessionValue>(
    () => ({ tableNumber: table.tableNumber, restaurantId: table.restaurantId, setTableNumber }),
    [table, setTableNumber],
  );

  return <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>;
}
