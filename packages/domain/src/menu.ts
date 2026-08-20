/**
 * Чистые правила меню: цена с учётом выбора, подпись выбора, состав по умолчанию.
 * Живут в домене, потому что нужны трём приложениям сразу — гость выбирает блюдо
 * сам, официант выбирает за гостя, кухня печатает выбранное в тикете.
 */
import type { Dish, DishSelections } from './types';

/** Стоп-лист: поля нет — блюдо доступно. Явное `false` — кончилось. */
export function isDishAvailable(dish: Dish): boolean {
  return dish.available !== false;
}

/** Подпись под названием: «20 ккал | 590 гр». */
export function dishMeta(dish: Dish): string {
  return `${dish.calories} ккал | ${dish.weight} гр`;
}

/** Выбор по умолчанию для всех групп опций блюда. */
export function defaultSelections(dish: Dish): DishSelections {
  if (!dish.optionGroups) return {};
  return Object.fromEntries(dish.optionGroups.map((group) => [group.id, group.defaultOptionId]));
}

/** Цена блюда с учётом выбора: группа layout="detailed" (размер) **заменяет**
 *  базовую цену, layout="simple" (тесто) на цену не влияет. */
export function resolveDishPrice(dish: Dish, selections?: DishSelections): number {
  const sizeGroup = dish.optionGroups?.find((group) => group.layout === 'detailed');
  if (!sizeGroup) return dish.price;
  const optionId = selections?.[sizeGroup.id] ?? sizeGroup.defaultOptionId;
  const option = sizeGroup.options.find((o) => o.id === optionId);
  return option?.price ?? dish.price;
}

/** Короткое резюме выбора для строки корзины и тикета: «23 см · Тонкое». */
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
