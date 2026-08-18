// Единственная точка доступа к данным меню. Экраны не знают, откуда данные —
// сейчас это локальный JSON, дальше сюда подставляется API/Supabase без правок UI.
import dish1 from '../assets/dishes/dish-1.png';
import dish2 from '../assets/dishes/dish-2.png';
import dish3 from '../assets/dishes/dish-3.png';
import dish4 from '../assets/dishes/dish-4.png';
import dish5 from '../assets/dishes/dish-5.png';
import rawMenu from './menu.json';
import type { Dish, Menu } from './types';

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

export function getDish(id: string): Promise<Dish | undefined> {
  return delay(menu.dishes.find((dish) => dish.id === id));
}

/** Синхронный доступ — нужен корзине, чтобы посчитать итог без ожидания. */
export function findDish(id: string): Dish | undefined {
  return menu.dishes.find((dish) => dish.id === id);
}

export function formatMeta(dish: Dish): string {
  return `${dish.calories} ккал | ${dish.weight} гр`;
}
