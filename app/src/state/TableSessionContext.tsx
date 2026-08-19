import { useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TableSessionContext, type TableSessionValue } from './tableSessionStore';

/** Стол по умолчанию, когда ссылка открыта без ?table= (демо/разработка). */
const DEFAULT_TABLE_NUMBER = '12';

export function TableSessionProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();

  const value = useMemo<TableSessionValue>(
    () => ({
      tableNumber: searchParams.get('table') ?? DEFAULT_TABLE_NUMBER,
      restaurantId: searchParams.get('restaurant'),
    }),
    [searchParams],
  );

  return <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>;
}
