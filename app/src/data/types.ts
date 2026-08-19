/** Доменные типы меню. UI работает только с ними — источник данных подменяем
 *  в menuRepository (сейчас локальный JSON, дальше — API/Supabase). */

export interface Restaurant {
  id: string;
  name: string;
  /** Подпись в шапке: «Стол 12 · зал» — приходит из QR-кода. */
  tableLabel: string;
  /** UZS — узбекский сум, единственная валюта меню. Отображается как «2 101 с». */
  currency: 'UZS';
}

export interface Category {
  id: string;
  name: string;
}

/**
 * Один вариант в группе опций блюда. Форма поля зависит от layout родительской
 * группы: у "detailed" (размер) заполнены caption+price, у "simple" (тесто) —
 * только label.
 */
export interface DishOptionValue {
  id: string;
  /** Название размера — только у layout="detailed" (напр. «Новый стандарт»). */
  caption?: string;
  /** Видимый текст — только у layout="simple" (напр. «Тонкое»). */
  label?: string;
  /** Полная цена блюда при выборе этого варианта — только у layout="detailed", заменяет Dish.price. */
  price?: number;
}

/**
 * Группа взаимоисключающих опций блюда — Figma: `OptionGroup` (composed из
 * `OptionChip`, см. directives/build_react_ds.md). Layout=detailed — для
 * опций с ценой (размер), layout=simple — для опций без цены (тесто).
 */
export interface DishOptionGroup {
  id: string;
  title: string;
  layout: 'detailed' | 'simple';
  options: DishOptionValue[];
  defaultOptionId: string;
}

/** Выбор пользователя по группам опций конкретного блюда: groupId → optionId. */
export type DishSelections = Record<string, string>;

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
  /** Группы опций (размер, тесто и т.п.) — есть не у всех блюд, сейчас только у пиццы. */
  optionGroups?: DishOptionGroup[];
}

export interface Menu {
  restaurant: Restaurant;
  categories: Category[];
  dishes: Dish[];
}

export interface CartItem {
  /** Составной ключ строки корзины — dishId, если у блюда нет optionGroups,
   *  иначе dishId + сериализованный выбор (см. data/cartKey.ts). Разные
   *  размеры одной пиццы — разные строки корзины. */
  key: string;
  dishId: string;
  quantity: number;
  /** Выбор пользователя по группам опций — только у блюд с optionGroups. */
  selections?: DishSelections;
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
