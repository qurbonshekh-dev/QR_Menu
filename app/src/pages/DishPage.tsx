import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader, Badge, Button, Counter, StarIcon, } from '../components';
import { dishImage, formatMeta, getDish } from '../data/menuRepository';
import type { Dish } from '../data/types';
import { formatPrice } from '../data/format';
import { useCart } from '../state/cartStore';
import { ts } from '../tokens/typography';
import styles from './DishPage.module.css';

export function DishPage() {
  const { dishId = '' } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [dish, setDish] = useState<Dish | null | undefined>(undefined);
  const [quantity, setQuantity] = useState(() => Math.max(1, cart.quantityOf(dishId)));

  useEffect(() => {
    getDish(dishId).then((found) => setDish(found ?? null));
  }, [dishId]);

  if (dish === undefined) {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Загружаем блюдо…</p>;
  }

  if (dish === null) {
    return (
      <div className={styles.page}>
        <AppHeader title="Блюдо не найдено" onBack={() => navigate('/')} />
        <div className={styles.body}>
          <Button onClick={() => navigate('/')}>Вернуться в меню</Button>
        </div>
      </div>
    );
  }

  const inCart = cart.quantityOf(dish.id);

  return (
    <div className={styles.page}>
      <AppHeader title={dish.name} onBack={() => navigate(-1)} />

      <div className={styles.media}>
        <img className={styles.image} src={dishImage(dish.image)} alt={dish.name} />
        {dish.rating !== undefined ? (
          <span className={styles.rating}>
            <Badge tone="overlay">
              {dish.rating.toFixed(1)}
              <StarIcon size={12} className={styles.star} />
            </Badge>
          </span>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.headline}>
          <p className={[styles.price, ts('heading-7/bold')].join(' ')}>{formatPrice(dish.price)}</p>
          <p className={[styles.meta, ts('body-s/medium')].join(' ')}>{formatMeta(dish)}</p>
        </div>

        <p className={[styles.description, ts('body-m/regular')].join(' ')}>{dish.description}</p>

        <section className={styles.section}>
          <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Состав</h2>
          <ul className={styles.ingredients}>
            {dish.ingredients.map((ingredient) => (
              <li key={ingredient} className={ts('body-s/regular')}>
                {ingredient}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.actions}>
        <Counter value={quantity} onChange={setQuantity} min={1} variant="secondary" label={`«${dish.name}»`} />
        <Button
          block
          onClick={() => {
            cart.setQuantity(dish.id, quantity);
            navigate('/cart');
          }}
        >
          {inCart ? 'Обновить корзину' : `В корзину · ${formatPrice(dish.price * quantity)}`}
        </Button>
      </div>
    </div>
  );
}
