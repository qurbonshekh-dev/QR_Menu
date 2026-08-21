/** Доменные типы меню. UI работает только с ними — источник данных подменяем
 *  в menuRepository (сейчас локальный JSON, дальше — API/Supabase). */

/** Официант, закреплённый за столом. Пока статичен для всего ресторана —
 *  привязка «стол → официант» появится вместе с бэкендом. */
export interface Waiter {
  name: string;
}

export interface Restaurant {
  id: string;
  name: string;
  /** Название зала — статическая часть подписи, комбинируется с номером
   *  стола из URL/QR в formatTableLabel (напр. «основной зал»). */
  zoneLabel: string;
  /** TJS — таджикский сомони, единственная валюта меню. Отображается как «55 с.». */
  currency: 'TJS';
  waiter: Waiter;
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

/** Платная добавка к блюду: «+ сыр чеддер». В отличие от группы опций, добавок
 *  можно выбрать сколько угодно, и каждая прибавляется к цене. */
export interface DishExtra {
  id: string;
  name: string;
  /** Надбавка к цене блюда, а не цена блюда — в отличие от опции размера. */
  price: number;
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
  /** Группы опций (размер, тесто и т.п.) — есть не у всех блюд, сейчас только у пиццы. */
  optionGroups?: DishOptionGroup[];
  /** Стоп-лист: блюдо кончилось. Нет поля — доступно (в моке так у большинства). */
  available?: boolean;
  /** Платные добавки. Убрать ингредиент отдельного списка не требует — убирают
   *  из `ingredients`, добавить можно только то, что кухня готова положить. */
  extras?: DishExtra[];
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

/** Как подавать заказ — вопрос кухне, а не курьеру: dine-in-модель из ТЗ. */
export type ServingMode = 'ready' | 'together';

/** Как гости делят счёт: поровну или по позициям. */
export type SplitMode = 'equal' | 'items';

export interface SplitState {
  mode: SplitMode;
  /** Сколько гостей за столом делят заказ. */
  guests: number;
  /** Ключ строки корзины → индекс гостя (0-based). Ключа нет — позиция общая
   *  и делится между всеми поровну. */
  assignments: Record<string, number>;
}

/**
 * Заказ, оформленный в текущей сессии за столом. Живёт в sessionStorage до
 * закрытия вкладки: бэкенда нет, статус двигать некому — поэтому он всегда
 * 'placed', реальные статусы («готовится», «подан») придут в фазе 5.
 */
export interface SessionOrder {
  id: string;
  items: CartItem[];
  total: number;
  /** Пожелания кухне, снятые с корзины в момент оформления. */
  servingMode: ServingMode;
  comment?: string;
  /** Раскладка счёта по гостям, если её настраивали. */
  split?: SplitState;
  /** ISO-время оформления — для подписи «в 19:40». */
  placedAt: string;
  status: 'placed';
}
