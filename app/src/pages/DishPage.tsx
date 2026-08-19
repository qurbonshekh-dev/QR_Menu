import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader, Badge, Button, Counter, OptionGroup, StarIcon } from '../components';
import { cartKey } from '../data/cartKey';
import { formatPrice } from '../data/format';
import { defaultSelections, dishImage, formatMeta, getDish, resolveDishPrice } from '../data/menuRepository';
import type { Dish, DishSelections } from '../data/types';
import { useCart } from '../state/cartStore';
import { ts } from '../tokens/typography';
import styles from './DishPage.module.css';

export function DishPage() {
  const { dishId = '' } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [dish, setDish] = useState<Dish | null | undefined>(undefined);
  const [selections, setSelections] = useState<DishSelections>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    getDish(dishId).then((found) => {
      setDish(found ?? null);
      if (found) setSelections(defaultSelections(found));
    });
  }, [dishId]);

  const hasOptions = Boolean(dish?.optionGroups?.length);
  const key = useMemo(
    () => (dish ? cartKey(dish.id, hasOptions ? selections : undefined) : ''),
    [dish, hasOptions, selections],
  );

  // Смена размера/теста указывает на другую строку корзины — подтягиваем её
  // текущее количество, чтобы счётчик не врал.
  useEffect(() => {
    if (!dish) return;
    setQuantity(Math.max(1, cart.quantityOfKey(key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

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

  const inCart = cart.quantityOfKey(key) > 0;
  const unitPrice = resolveDishPrice(dish, selections);

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
          <p className={[styles.price, ts('heading-7/bold')].join(' ')}>{formatPrice(unitPrice)}</p>
          <p className={[styles.meta, ts('body-s/medium')].join(' ')}>{formatMeta(dish)}</p>
        </div>

        <p className={[styles.description, ts('body-m/regular')].join(' ')}>{dish.description}</p>

        {dish.optionGroups?.map((group) => (
          <section key={group.id} className={styles.section}>
            <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>{group.title}</h2>
            <OptionGroup
              aria-label={group.title}
              layout={group.layout}
              value={selections[group.id] ?? group.defaultOptionId}
              onChange={(optionId) => setSelections((current) => ({ ...current, [group.id]: optionId }))}
              options={group.options.map((option) => ({
                id: option.id,
                caption: option.caption,
                label: group.layout === 'detailed' ? formatPrice(option.price ?? dish.price) : (option.label ?? ''),
              }))}
            />
          </section>
        ))}

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
            cart.setQuantity(key, quantity, dish.id, hasOptions ? selections : undefined);
            navigate('/cart');
          }}
        >
          {inCart ? 'Обновить корзину' : `В корзину · ${formatPrice(unitPrice * quantity)}`}
        </Button>
      </div>
    </div>
  );
}
