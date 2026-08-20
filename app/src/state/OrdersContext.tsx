import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, SessionOrder } from '../data/types';
import { OrdersContext, type OrdersValue } from './ordersStore';

/** sessionStorage, а не localStorage: заказ имеет смысл только пока гость сидит
 *  за столом. Закрыл вкладку — сессия окончена, а чужой заказ из прошлого визита
 *  в счёте был бы хуже пустого экрана. */
const STORAGE_KEY = 'qr-menu.orders';
const TIP_STORAGE_KEY = 'qr-menu.tip';

function readStorage(): SessionOrder[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionOrder[]) : [];
  } catch {
    return [];
  }
}

function readTip(): number {
  const raw = Number(sessionStorage.getItem(TIP_STORAGE_KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<SessionOrder[]>(readStorage);
  const [tip, setTip] = useState<number>(readTip);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    sessionStorage.setItem(TIP_STORAGE_KEY, String(tip));
  }, [tip]);

  const placeOrder = useCallback((items: CartItem[], total: number) => {
    const order: SessionOrder = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      items,
      total,
      placedAt: new Date().toISOString(),
      status: 'placed',
    };
    setOrders((current) => [...current, order]);
    return order;
  }, []);

  const value = useMemo<OrdersValue>(() => {
    const sessionTotal = orders.reduce((sum, order) => sum + order.total, 0);
    return {
      orders,
      placeOrder,
      sessionTotal,
      tip,
      setTip,
      billTotal: sessionTotal + tip,
    };
  }, [orders, placeOrder, tip]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
