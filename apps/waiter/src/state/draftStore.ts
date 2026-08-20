import { createContext, useContext } from 'react';
import type { DraftLine, ServingMode } from '@food/domain';

/** Черновик заказа за конкретным столом: официант набирает его, стоя рядом. */
export interface DraftState {
  tableId: string;
  tableNumber: string;
  /** Сколько гостей за столом — первый вопрос из ТЗ, от него зависит раскладка. */
  guests: number;
  lines: DraftLine[];
  servingMode: ServingMode;
  comment?: string;
}

export interface DraftValue {
  draft: DraftState | null;
  start: (tableId: string, tableNumber: string, guests: number) => void;
  /** Ключ строки считается сам: одинаковые блюда с одними модификаторами
   *  для одного гостя складываются в одну строку. */
  addLine: (line: Omit<DraftLine, 'key'>) => void;
  setQuantity: (key: string, quantity: number) => void;
  setGuest: (key: string, guest: number | null) => void;
  setServeAfter: (key: string, minutes: number | undefined) => void;
  setServingMode: (mode: ServingMode) => void;
  setComment: (comment: string) => void;
  discard: () => void;
}

export const DraftContext = createContext<DraftValue | null>(null);

export function useDraft(): DraftValue {
  const value = useContext(DraftContext);
  if (!value) {
    throw new Error('useDraft must be used inside <DraftProvider>');
  }
  return value;
}
