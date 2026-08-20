import type { Dish, DishOptionGroup, Menu, Restaurant } from '@food/domain';
import { supabase } from './client';

/** Меню целиком одним запросом: категорий и блюд десятки, а не тысячи, —
 *  экономить тут нечего, зато экран получает всё сразу и без «мигания». */
export async function fetchMenu(): Promise<Menu> {
  const [restaurantResult, categoriesResult, dishesResult] = await Promise.all([
    supabase.from('restaurants').select('id, name, zone_label, currency').limit(1).single(),
    supabase.from('menu_categories').select('id, slug, name, sort_order').order('sort_order'),
    supabase
      .from('dishes')
      .select('id, slug, name, description, price, image_key, calories, weight, rating, ingredients, available, sort_order, category_id, dish_option_groups (id, slug, title, layout, sort_order, dish_options (id, slug, caption, label, price, is_default, sort_order))')
      .order('sort_order'),
  ]);

  if (restaurantResult.error) throw restaurantResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (dishesResult.error) throw dishesResult.error;

  const restaurant: Restaurant = {
    id: restaurantResult.data.id,
    name: restaurantResult.data.name,
    zoneLabel: restaurantResult.data.zone_label,
    currency: 'TJS',
    // Официант стола придёт из dining_tables.waiter_id, когда гость будет
    // открывать меню по своему столу; пока берём первого в смене.
    waiter: { name: await fetchFirstWaiterName() },
  };

  const categoryById = new Map(categoriesResult.data.map((row) => [row.id, row.slug]));

  const dishes: Dish[] = dishesResult.data.map((row) => {
    const groups = (row.dish_option_groups ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((group): DishOptionGroup => {
        const options = (group.dish_options ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
        const fallback = options[0];
        return {
          id: group.slug,
          title: group.title,
          layout: group.layout === 'detailed' ? 'detailed' : 'simple',
          defaultOptionId: (options.find((option) => option.is_default) ?? fallback)?.slug ?? '',
          options: options.map((option) => ({
            id: option.slug,
            caption: option.caption ?? undefined,
            label: option.label ?? undefined,
            price: option.price ?? undefined,
          })),
        };
      });

    return {
      id: row.slug,
      categoryId: categoryById.get(row.category_id) ?? '',
      name: row.name,
      description: row.description,
      price: row.price,
      image: row.image_key ?? 'dish-1',
      calories: row.calories ?? 0,
      weight: row.weight ?? 0,
      rating: row.rating ?? undefined,
      ingredients: row.ingredients,
      available: row.available,
      optionGroups: groups.length > 0 ? groups : undefined,
    };
  });

  return {
    restaurant,
    categories: categoriesResult.data.map((row) => ({ id: row.slug, name: row.name })),
    dishes,
  };
}

async function fetchFirstWaiterName(): Promise<string> {
  const { data } = await supabase.from('staff').select('name').eq('role', 'waiter').limit(1).single();
  return data?.name ?? 'Официант';
}
