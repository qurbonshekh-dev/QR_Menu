import { createContext, useContext } from 'react';
import type { CartItem, DishSelections, ServingMode, SplitState } from '../data/types';

export interface CartValue {
  items: CartItem[];
  /** Позиции, которые реально идут в счёт: без стоп-листа. Именно они уходят
   *  в заказ и в раскладку по гостям — totalPrice считается по ним же. */
  payableItems: CartItem[];
  /** В корзине есть закончившиеся блюда — оформление заблокировано. */
  hasUnavailable: boolean;
  /** Количество строки корзины по составному ключу (см. data/cartKey.ts), 0 — если её нет. */
  quantityOfKey: (key: string) => number;
  /** Суммарное количество блюда по всем его строкам (разным размерам/тесту), для бейджей на карточке в сетке меню. */
  quantityOfDish: (dishId: string) => number;
  /** Создаёт/обновляет/удаляет (при quantity<=0) строку корзины. */
  setQuantity: (key: string, quantity: number, dishId: string, selections?: DishSelections) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
  /** Пожелания кухне — часть собираемого заказа, не отдельная сущность. */
  servingMode: ServingMode;
  setServingMode: (mode: ServingMode) => void;
  comment: string;
  setComment: (comment: string) => void;
  /** Раскладка счёта по гостям. null — не делили. */
  split: SplitState | null;
  setSplit: (split: SplitState | null) => void;
}

export const CartContext = createContext<CartValue | null>(null);

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  return value;
}
