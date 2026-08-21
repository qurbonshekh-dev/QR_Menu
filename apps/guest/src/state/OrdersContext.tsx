import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchTableOrders, placeOrder as placeOrderApi, setTableTip, subscribeTableOrders } from '@food/api';
import { describeCartModifiers, extrasPrice } from '@food/domain';
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
        // Позиции читаем из самого заказа: там снимок названия и цены на момент
        // оформления. Искать блюдо в меню нельзя — его могли переименовать.
        items: order.items,
        total: order.total,
        placedAt: order.placedAt,
        status: order.status,
        servingMode: order.servingMode,
        comment: order.comment,
      })),
    );
    setTipState(rows.at(-1)?.tip ?? 0);
  }, [tableNumber]);

  useEffect(() => {
    void refresh();
    // Кухня отметила блюдо готовым — «Мои заказы» меняются сами.
    return subscribeTableOrders(() => void refresh());
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
            modifiers: describeCartModifiers(item.removed, item.extras) ?? undefined,
            quantity: item.quantity,
            unitPrice: (dish ? resolveDishPrice(dish, item.selections) : 0) + extrasPrice(item.extras),
          };
        }),
      });

      await refresh();
      // Возвращаем заказ так, как его увидит гость на экране «принят»: позиции
      // уже снимком, а не строками корзины, и статус — начальный, из базы.
      return {
        id: String(placed.number),
        items: items.map((item) => {
          const dish = findDish(item.dishId);
          return {
            key: item.key,
            title: dish?.name ?? 'Блюдо',
            options: dish ? (describeSelections(dish, item.selections) ?? undefined) : undefined,
            modifiers: describeCartModifiers(item.removed, item.extras) ?? undefined,
            quantity: item.quantity,
            unitPrice: (dish ? resolveDishPrice(dish, item.selections) : 0) + extrasPrice(item.extras),
            status: 'queued' as const,
          };
        }),
        total,
        placedAt: placed.placedAt,
        status: 'queued',
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
