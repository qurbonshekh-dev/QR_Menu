// Единственная точка доступа к данным меню. Экраны не знают, откуда данные —
// сейчас это локальный JSON, дальше сюда подставляется API/Supabase без правок UI.
import dish1 from '../assets/dishes/dish-1.png';
import dish2 from '../assets/dishes/dish-2.png';
import dish3 from '../assets/dishes/dish-3.png';
import dish4 from '../assets/dishes/dish-4.png';
import dish5 from '../assets/dishes/dish-5.png';
import rawMenu from './menu.json';
import type { Dish, DishSelections, Menu, Restaurant, Waiter } from './types';

const images: Record<string, string> = {
  'dish-1': dish1,
  'dish-2': dish2,
  'dish-3': dish3,
  'dish-4': dish4,
  'dish-5': dish5,
};

/** Ключ картинки из JSON → бандленный URL. */
export function dishImage(key: string): string {
  return images[key] ?? dish1;
}

const menu = rawMenu as Menu;

/** Имитация сетевой задержки, чтобы экраны сразу умели показывать загрузку. */
function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function getMenu(): Promise<Menu> {
  return delay(menu);
}

/** Ресторан без блюд — нужен экранам, которым каталог не требуется (главная, счёт). */
export function getRestaurant(): Promise<Restaurant> {
  return delay(menu.restaurant);
}

/** Официант стола. Пока один на весь ресторан — см. Waiter в types.ts. */
export function getWaiter(): Waiter {
  return menu.restaurant.waiter;
}

export function getDish(id: string): Promise<Dish | undefined> {
  return delay(menu.dishes.find((dish) => dish.id === id));
}

/** Синхронный доступ — нужен корзине, чтобы посчитать итог без ожидания. */
export function findDish(id: string): Dish | undefined {
  return menu.dishes.find((dish) => dish.id === id);
}

/** Стоп-лист: поля нет — блюдо доступно. Явное `false` — кончилось. */
export function isAvailable(dish: Dish): boolean {
  return dish.available !== false;
}

export function formatMeta(dish: Dish): string {
  return `${dish.calories} ккал | ${dish.weight} гр`;
}

/** Собирает подпись под именем ресторана из номера стола (сессия) и
 *  статичного zoneLabel ресторана: «Стол 12 · основной зал». */
export function formatTableLabel(tableNumber: string, restaurant: Restaurant): string {
  return `Стол ${tableNumber} · ${restaurant.zoneLabel}`;
}

/** Выбор по умолчанию для всех групп опций блюда (defaultOptionId каждой группы). */
export function defaultSelections(dish: Dish): DishSelections {
  if (!dish.optionGroups) return {};
  return Object.fromEntries(dish.optionGroups.map((group) => [group.id, group.defaultOptionId]));
}

/** Цена блюда с учётом выбора: если есть группа layout="detailed" (размер),
 *  её выбранный вариант заменяет базовую цену; иначе — Dish.price. */
export function resolveDishPrice(dish: Dish, selections?: DishSelections): number {
  const sizeGroup = dish.optionGroups?.find((group) => group.layout === 'detailed');
  if (!sizeGroup) return dish.price;
  const optionId = selections?.[sizeGroup.id] ?? sizeGroup.defaultOptionId;
  const option = sizeGroup.options.find((o) => o.id === optionId);
  return option?.price ?? dish.price;
}

/** Короткое текстовое резюме выбора для строки корзины: «23 см · Тонкое». */
export function describeSelections(dish: Dish, selections?: DishSelections): string | null {
  if (!dish.optionGroups || !selections) return null;
  const parts = dish.optionGroups
    .map((group) => {
      const option = group.options.find((o) => o.id === selections[group.id]);
      return option?.caption ?? option?.label ?? null;
    })
    .filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(' · ') : null;
}

/** Инициал для аватара официанта — фото официантов в моке нет. */
export function waiterInitial(waiter: Waiter): string {
  return waiter.name.trim().charAt(0).toUpperCase();
}
