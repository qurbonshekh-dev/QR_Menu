import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchTableOrders, placeOrder as placeOrderApi, setTableTip } from '@food/api';
import { describeSelections, findDish, resolveDishPrice } from '../data/menuRepository';
import type { CartItem, SessionOrder } from '@food/domain';
import { OrdersContext, type OrderMeta, type OrdersValue } from './ordersStore';
import { useTableSession } from './tableSessionStore';

/**
 * Заказы стола приходят из Supabase, а не из памяти вкладки: гость может
 * перезагрузить страницу или открыть меню с другого телефона за тем же столом —
 * счёт всё равно один.
 */
export function OrdersProvider({ children }: { children: ReactNode }) {
  const { tableNumber } = useTableSession();
  const [orders, setOrders] = useState<SessionOrder[]>([]);
  const [tip, setTipState] = useState(0);

  const refresh = useCallback(async () => {
    const rows = await fetchTableOrders(tableNumber);
    setOrders(
      rows.map((order) => ({
        id: String(order.number),
        items: order.items.map((item) => ({
          key: item.key,
          dishId: item.key,
          quantity: item.quantity,
        })),
        total: order.total,
        placedAt: order.placedAt,
        status: 'placed',
        servingMode: order.servingMode,
        comment: order.comment,
      })),
    );
    setTipState(rows.at(-1)?.tip ?? 0);
  }, [tableNumber]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const placeOrder = useCallback(
    async (items: CartItem[], total: number, meta: OrderMeta): Promise<SessionOrder> => {
      const placed = await placeOrderApi({
        tableNumber,
        total,
        servingMode: meta.servingMode,
        comment: meta.comment,
        split: meta.split,
        // Название и выбор копируются в заказ: кухня читает тикет, а не каталог.
        items: items.map((item) => {
          const dish = findDish(item.dishId);
          return {
            dishSlug: item.dishId,
            title: dish?.name ?? 'Блюдо',
            options: dish ? (describeSelections(dish, item.selections) ?? undefined) : undefined,
            quantity: item.quantity,
            unitPrice: dish ? resolveDishPrice(dish, item.selections) : 0,
          };
        }),
      });

      await refresh();
      return {
        id: String(placed.number),
        items,
        total,
        placedAt: placed.placedAt,
        status: 'placed',
        servingMode: meta.servingMode,
        comment: meta.comment,
        split: meta.split ?? undefined,
      };
    },
    [tableNumber, refresh],
  );

  const setTip = useCallback(
    (amount: number) => {
      setTipState(amount);
      void setTableTip(tableNumber, amount);
    },
    [tableNumber],
  );

  const value = useMemo<OrdersValue>(() => {
    const sessionTotal = orders.reduce((sum, order) => sum + order.total, 0);
    return { orders, placeOrder, sessionTotal, tip, setTip, billTotal: sessionTotal + tip };
  }, [orders, placeOrder, tip, setTip]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
