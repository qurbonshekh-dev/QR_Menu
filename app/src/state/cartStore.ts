import { createContext, useContext } from 'react';
import type { CartItem, DishSelections } from '../data/types';

export interface CartValue {
  items: CartItem[];
  /** Количество строки корзины по составному ключу (см. data/cartKey.ts), 0 — если её нет. */
  quantityOfKey: (key: string) => number;
  /** Суммарное количество блюда по всем его строкам (разным размерам/тесту), для бейджей на карточке в сетке меню. */
  quantityOfDish: (dishId: string) => number;
  /** Создаёт/обновляет/удаляет (при quantity<=0) строку корзины. */
  setQuantity: (key: string, quantity: number, dishId: string, selections?: DishSelections) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
}

export const CartContext = createContext<CartValue | null>(null);

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  return value;
}
