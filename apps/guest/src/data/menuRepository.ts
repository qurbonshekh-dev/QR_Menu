// Единственная точка доступа к данным меню. Экраны не знают, откуда данные:
// теперь это Supabase через @food/api, раньше был локальный JSON — ни один
// экран при переезде не изменился.
import dish1 from '../assets/dishes/dish-1.png';
import dish2 from '../assets/dishes/dish-2.png';
import dish3 from '../assets/dishes/dish-3.png';
import dish4 from '../assets/dishes/dish-4.png';
import dish5 from '../assets/dishes/dish-5.png';
import { fetchMenu } from '@food/api';
import { dishMeta, isDishAvailable } from '@food/domain';
import type { Dish, Menu, Restaurant, Waiter } from '@food/domain';

// Правила выбора и цены живут в домене: ими пользуются и официант, и кухня.
// Экраны гостя ходят сюда, поэтому реэкспортируем под прежними именами.
export { defaultSelections, describeSelections, resolveDishPrice } from '@food/domain';

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

// Меню кэшируется в модуле: корзина считает итог синхронно, а ходить в сеть
// на каждый пересчёт нечего — каталог за визит не меняется.
let cache: Menu | null = null;
let pending: Promise<Menu> | null = null;

export function getMenu(): Promise<Menu> {
  if (cache) return Promise.resolve(cache);
  pending ??= fetchMenu().then((menu) => {
    cache = menu;
    pending = null;
    return menu;
  });
  return pending;
}

/** Ресторан без блюд — нужен экранам, которым каталог не требуется (главная, счёт). */
export async function getRestaurant(): Promise<Restaurant> {
  const menu = await getMenu();
  return menu.restaurant;
}

/** Официант стола. Пока один на весь ресторан — см. Waiter в types.ts. */
export function getWaiter(): Waiter {
  return cache?.restaurant.waiter ?? { name: 'Официант' };
}

export async function getDish(id: string): Promise<Dish | undefined> {
  const menu = await getMenu();
  return menu.dishes.find((dish) => dish.id === id);
}

/** Синхронный доступ — нужен корзине, чтобы посчитать итог без ожидания.
 *  Работает по кэшу: к моменту, когда в корзине что-то есть, меню загружено. */
export function findDish(id: string): Dish | undefined {
  return cache?.dishes.find((dish) => dish.id === id);
}

/** Стоп-лист: поля нет — блюдо доступно. Явное `false` — кончилось. */
export function isAvailable(dish: Dish): boolean {
  return isDishAvailable(dish);
}

export function formatMeta(dish: Dish): string {
  return dishMeta(dish);
}

/** Собирает подпись под именем ресторана из номера стола (сессия) и
 *  статичного zoneLabel ресторана: «Стол 12 · основной зал». */
export function formatTableLabel(tableNumber: string, restaurant: Restaurant): string {
  return `Стол ${tableNumber} · ${restaurant.zoneLabel}`;
}

/** Инициал для аватара официанта — фото официантов в моке нет. */
export function waiterInitial(waiter: Waiter): string {
  return waiter.name.trim().charAt(0).toUpperCase();
}
