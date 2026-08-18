import { createContext, useContext } from 'react';
import type { CartItem } from '../data/types';

export interface CartValue {
  items: CartItem[];
  /** Количество конкретного блюда в корзине (0, если его нет). */
  quantityOf: (dishId: string) => number;
  setQuantity: (dishId: string, quantity: number) => void;
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
