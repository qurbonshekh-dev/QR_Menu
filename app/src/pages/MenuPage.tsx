import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartBar, Chip, DishCard, IconButton, ShoppingBagIcon, } from '../components';
import { dishImage, formatMeta, getMenu } from '../data/menuRepository';
import type { Menu } from '../data/types';
import { formatPrice } from '../data/format';
import { pluralItems } from '../data/plural';
import { useCart } from '../state/cartStore';
import { ts } from '../tokens/typography';
import { AppHeader } from '../components';
import styles from './MenuPage.module.css';

export function MenuPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    getMenu().then(setMenu);
  }, []);

  const dishes = useMemo(() => {
    if (!menu) return [];
    return categoryId ? menu.dishes.filter((dish) => dish.categoryId === categoryId) : menu.dishes;
  }, [menu, categoryId]);

  if (!menu) {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Загружаем меню…</p>;
  }

  return (
    <div className={styles.page}>
      <AppHeader
        title={menu.restaurant.name}
        subtitle={menu.restaurant.tableLabel}
        action={
          <IconButton aria-label="Корзина" count={cart.totalCount} onClick={() => navigate('/cart')}>
            <ShoppingBagIcon size={20} />
          </IconButton>
        }
      />

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

      <div className={styles.grid}>
        {dishes.map((dish) => (
          <DishCard
            key={dish.id}
            title={dish.name}
            price={dish.price}
            meta={formatMeta(dish)}
            image={dishImage(dish.image)}
            rating={dish.rating}
            quantity={cart.quantityOf(dish.id)}
            onQuantityChange={(quantity) => cart.setQuantity(dish.id, quantity)}
            onOpen={() => navigate(`/dish/${dish.id}`)}
          />
        ))}
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

