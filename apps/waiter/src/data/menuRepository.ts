// Каталог для приёма заказа. Тот же шов, что у гостя: экран не знает, откуда
// данные. Правила цены и выбора не дублируются — они в домене.
import dish1 from '../assets/dishes/dish-1.png';
import dish2 from '../assets/dishes/dish-2.png';
import dish3 from '../assets/dishes/dish-3.png';
import dish4 from '../assets/dishes/dish-4.png';
import dish5 from '../assets/dishes/dish-5.png';
import { fetchMenu } from '@food/api';
import type { Dish, Menu } from '@food/domain';

export { defaultSelections, describeSelections, dishMeta, isDishAvailable, resolveDishPrice } from '@food/domain';

// Пять демо-фотографий на четырнадцать блюд — те же, что у гостя. Уедут вместе
// с реальными фото в хранилище; пока копия проще общего пакета ради пяти png.
const images: Record<string, string> = {
  'dish-1': dish1,
  'dish-2': dish2,
  'dish-3': dish3,
  'dish-4': dish4,
  'dish-5': dish5,
};

export function dishImage(key: string): string {
  return images[key] ?? dish1;
}

// Каталог за смену не меняется — держим в модуле, чтобы возврат из блюда
// в меню не перезагружал список.
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

export function findDish(slug: string): Dish | undefined {
  return cache?.dishes.find((dish) => dish.id === slug);
}
