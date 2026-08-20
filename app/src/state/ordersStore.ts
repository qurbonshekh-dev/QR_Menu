import { createContext, useContext } from 'react';
import type { CartItem, SessionOrder } from '../data/types';

export interface OrdersValue {
  orders: SessionOrder[];
  /** Кладёт оформленный заказ в сессию и возвращает его id. */
  placeOrder: (items: CartItem[], total: number) => SessionOrder;
  /** Сумма всех заказов сессии — блюда без чаевых. */
  sessionTotal: number;
  /** Чаевые, добавленные гостем к счёту стола. 0 — не оставлял. */
  tip: number;
  setTip: (amount: number) => void;
  /** Итог к оплате: заказы + чаевые. Именно его несёт официант. */
  billTotal: number;
}

export const OrdersContext = createContext<OrdersValue | null>(null);

export function useOrders(): OrdersValue {
  const value = useContext(OrdersContext);
  if (!value) {
    throw new Error('useOrders must be used inside <OrdersProvider>');
  }
  return value;
}
