import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { findDish } from '../data/menuRepository';
import type { CartItem } from '../data/types';
import { CartContext, type CartValue } from './cartStore';

const STORAGE_KEY = 'qr-menu.cart';

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const setQuantity = useCallback((dishId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.dishId !== dishId);
      }
      if (current.some((item) => item.dishId === dishId)) {
        return current.map((item) => (item.dishId === dishId ? { ...item, quantity } : item));
      }
      return [...current, { dishId, quantity }];
    });
  }, []);

  const value = useMemo<CartValue>(() => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (findDish(item.dishId)?.price ?? 0) * item.quantity, 0);
    return {
      items,
      quantityOf: (dishId) => items.find((item) => item.dishId === dishId)?.quantity ?? 0,
      setQuantity,
      clear: () => setItems([]),
      totalCount,
      totalPrice,
    };
  }, [items, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
