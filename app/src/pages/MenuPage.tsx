import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartBar, Chip, DishCard, IconButton, SearchField, ShoppingBagIcon } from '../components';
import { dishImage, formatMeta, formatTableLabel, getMenu, resolveDishPrice } from '../data/menuRepository';
import type { Menu } from '../data/types';
import { formatPrice } from '../data/format';
import { pluralItems } from '../data/plural';
import { useCart } from '../state/cartStore';
import { useTableSession } from '../state/tableSessionStore';
import { ts } from '../tokens/typography';
import { AppHeader } from '../components';
import styles from './MenuPage.module.css';

export function MenuPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const { tableNumber } = useTableSession();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getMenu().then(setMenu);
  }, []);

  const dishes = useMemo(() => {
    if (!menu) return [];
    const search = query.trim().toLowerCase();
    return menu.dishes.filter((dish) => {
      // Поиск игнорирует выбранную категорию — иначе «Плов» в категории
      // «Десерты» выглядел бы как пустой результат по опечатке.
      if (search) {
        return (
          dish.name.toLowerCase().includes(search) ||
          dish.description.toLowerCase().includes(search) ||
          dish.ingredients.some((ingredient) => ingredient.toLowerCase().includes(search))
        );
      }
      return categoryId ? dish.categoryId === categoryId : true;
    });
  }, [menu, categoryId, query]);

  if (!menu) {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Загружаем меню…</p>;
  }

  return (
    <div className={styles.page}>
      <AppHeader
        title={menu.restaurant.name}
        subtitle={formatTableLabel(tableNumber, menu.restaurant)}
        onBack={() => navigate('/')}
        action={
          <IconButton aria-label="Корзина" count={cart.totalCount} onClick={() => navigate('/cart')}>
            <ShoppingBagIcon size={20} />
          </IconButton>
        }
      />

      <div className={styles.search}>
        <SearchField
          label="Поиск по меню"
          placeholder="Плов, самбуса, кебаб…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <nav className={styles.categories} aria-label="Категории меню">
        <Chip selected={categoryId === null} onClick={() => setCategoryId(null)}>
          Всё меню
        </Chip>
        {menu.categories.map((category) => (
          <Chip
            key={category.id}
            selected={categoryId === category.id}
            onClick={() => setCategoryId(category.id)}
          >
            {category.name}
          </Chip>
        ))}
      </nav>

      {dishes.length === 0 ? (
        <p className={[styles.empty, ts('body-m/regular')].join(' ')}>
          По запросу «{query.trim()}» ничего не нашлось.
        </p>
      ) : null}

      <div className={styles.grid}>
        {dishes.map((dish) => {
          // У блюд с опциями (пицца: размер/тесто) выбор делается на странице
          // блюда — «+» в сетке ведёт туда же, а не добавляет наугад.
          const hasOptions = Boolean(dish.optionGroups?.length);
          return (
            <DishCard
              key={dish.id}
              title={dish.name}
              price={resolveDishPrice(dish)}
              meta={formatMeta(dish)}
              image={dishImage(dish.image)}
              rating={dish.rating}
              quantity={cart.quantityOfDish(dish.id)}
              onQuantityChange={
                hasOptions ? () => navigate(`/dish/${dish.id}`) : (quantity) => cart.setQuantity(dish.id, quantity, dish.id)
              }
              onOpen={() => navigate(`/dish/${dish.id}`)}
            />
          );
        })}
      </div>

      {cart.totalCount > 0 ? (
        <CartBar
          summary={`${cart.totalCount} ${pluralItems(cart.totalCount)}`}
          total={formatPrice(cart.totalPrice)}
          actionLabel="Корзина"
          onAction={() => navigate('/cart')}
        />
      ) : null}
    </div>
  );
}

