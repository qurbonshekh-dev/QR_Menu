import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { findDish, resolveDishPrice } from '../data/menuRepository';
import type { CartItem, DishSelections } from '../data/types';
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

  const setQuantity = useCallback((key: string, quantity: number, dishId: string, selections?: DishSelections) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.key !== key);
      }
      if (current.some((item) => item.key === key)) {
        return current.map((item) => (item.key === key ? { ...item, quantity } : item));
      }
      return [...current, { key, dishId, quantity, selections }];
    });
  }, []);

  const value = useMemo<CartValue>(() => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => {
      const dish = findDish(item.dishId);
      const unitPrice = dish ? resolveDishPrice(dish, item.selections) : 0;
      return sum + unitPrice * item.quantity;
    }, 0);
    return {
      items,
      quantityOfKey: (key) => items.find((item) => item.key === key)?.quantity ?? 0,
      quantityOfDish: (dishId) => items.filter((item) => item.dishId === dishId).reduce((sum, item) => sum + item.quantity, 0),
      setQuantity,
      clear: () => setItems([]),
      totalCount,
      totalPrice,
    };
  }, [items, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
