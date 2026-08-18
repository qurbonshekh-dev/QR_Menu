/** Доменные типы меню. UI работает только с ними — источник данных подменяем
 *  в menuRepository (сейчас локальный JSON, дальше — API/Supabase). */

export interface Restaurant {
  id: string;
  name: string;
  /** Подпись в шапке: «Стол 12 · зал» — приходит из QR-кода. */
  tableLabel: string;
  currency: 'RUB';
}

export interface Category {
  id: string;
  name: string;
}

export interface Dish {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  /** Ключ картинки; резолвится в URL в menuRepository. */
  image: string;
  calories: number;
  weight: number;
  rating?: number;
  /** Состав — показывается на странице блюда. */
  ingredients: string[];
}

export interface Menu {
  restaurant: Restaurant;
  categories: Category[];
  dishes: Dish[];
}

export interface CartItem {
  dishId: string;
  quantity: number;
}

export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'online' | 'courier';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  address?: string;
  comment?: string;
}
