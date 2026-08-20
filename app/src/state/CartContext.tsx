import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { findDish, isAvailable, resolveDishPrice } from '../data/menuRepository';
import type { CartItem, DishSelections, ServingMode, SplitState } from '../data/types';
import { CartContext, type CartValue } from './cartStore';

const STORAGE_KEY = 'qr-menu.cart';
const PREFS_KEY = 'qr-menu.cart-prefs';

interface CartPrefs {
  servingMode: ServingMode;
  comment: string;
  split: SplitState | null;
}

const DEFAULT_PREFS: CartPrefs = { servingMode: 'ready', comment: '', split: null };

function readPrefs(): CartPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<CartPrefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

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
  const [prefs, setPrefs] = useState<CartPrefs>(readPrefs);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

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

  const setServingMode = useCallback((servingMode: ServingMode) => {
    setPrefs((current) => ({ ...current, servingMode }));
  }, []);

  const setComment = useCallback((comment: string) => {
    setPrefs((current) => ({ ...current, comment }));
  }, []);

  const setSplit = useCallback((split: SplitState | null) => {
    setPrefs((current) => ({ ...current, split }));
  }, []);

  const value = useMemo<CartValue>(() => {
    // Позиции из стоп-листа остаются видимыми, но в счёт не идут: гость должен
    // сам решить, чем их заменить, а не обнаружить чужую сумму в итоге.
    const payable = items.filter((item) => {
      const dish = findDish(item.dishId);
      return dish ? isAvailable(dish) : false;
    });
    const totalCount = payable.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = payable.reduce((sum, item) => {
      const dish = findDish(item.dishId);
      const unitPrice = dish ? resolveDishPrice(dish, item.selections) : 0;
      return sum + unitPrice * item.quantity;
    }, 0);
    return {
      items,
      payableItems: payable,
      hasUnavailable: payable.length !== items.length,
      quantityOfKey: (key) => items.find((item) => item.key === key)?.quantity ?? 0,
      quantityOfDish: (dishId) => items.filter((item) => item.dishId === dishId).reduce((sum, item) => sum + item.quantity, 0),
      setQuantity,
      // Оформили или очистили корзину — пожелания кухне и раскладка счёта
      // относились к ней и вместе с ней уходят.
      clear: () => {
        setItems([]);
        setPrefs(DEFAULT_PREFS);
      },
      totalCount,
      totalPrice,
      servingMode: prefs.servingMode,
      setServingMode,
      comment: prefs.comment,
      setComment,
      split: prefs.split,
      setSplit,
    };
  }, [items, setQuantity, prefs, setServingMode, setComment, setSplit]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
