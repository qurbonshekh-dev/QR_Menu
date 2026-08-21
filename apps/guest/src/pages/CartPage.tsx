import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, Button, CartBar, DishCard, FormRow, IconButton, Radio, TextArea, TrashIcon, ts } from '@food/ui';
import { type Dish, formatPrice, pluralDishes } from '@food/domain';
import {
  describeSelections,
  dishImage,
  findDish,
  formatMeta,
  getMenu,
  isAvailable,
  resolveDishPrice,
} from '../data/menuRepository';
import { useCart } from '../state/cartStore';
import { useOrders } from '../state/ordersStore';
import styles from './CartPage.module.css';

/** Категории, из которых предлагаем добавить к заказу. Рекомендаций как таковых
 *  нет — движка персонализации не существует, поэтому показываем честную
 *  подборку напитков и десертов, которых ещё нет в корзине. */
const SUGGESTION_CATEGORIES = ['drinks', 'desserts'];
const SUGGESTION_LIMIT = 6;

export function CartPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const { placeOrder } = useOrders();
  const [suggestions, setSuggestions] = useState<Dish[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMenu().then((menu) => {
      setSuggestions(
        menu.dishes.filter((dish) => SUGGESTION_CATEGORIES.includes(dish.categoryId) && isAvailable(dish)),
      );
    });
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className={styles.page}>
        <AppHeader title="Корзина" onBack={() => navigate('/menu')} />
        <div className={styles.empty}>
          <p className={[styles.emptyText, ts('body-m/regular')].join(' ')}>
            Пока пусто. Выберите блюда в меню — они появятся здесь.
          </p>
          <Button onClick={() => navigate('/menu')}>Открыть меню</Button>
        </div>
      </div>
    );
  }

  const stopListed = cart.items.filter((item) => {
    const dish = findDish(item.dishId);
    return dish ? !isAvailable(dish) : false;
  });

  const inCart = new Set(cart.items.map((item) => item.dishId));
  const offers = suggestions.filter((dish) => !inCart.has(dish.id)).slice(0, SUGGESTION_LIMIT);

  const blocked = cart.payableItems.length === 0 || cart.hasUnavailable;

  /**
   * Заказ уходит прямо отсюда: гость сидит за столом, адрес и способ оплаты
   * спрашивать не у кого и незачем. Всё, что нужно кухне — блюда, подача и
   * комментарий, — уже собрано на этом экране.
   */
  const submit = async () => {
    if (sending || blocked) return;
    setSending(true);
    setError(null);
    try {
      const order = await placeOrder(cart.payableItems, cart.totalPrice, {
        servingMode: cart.servingMode,
        comment: cart.comment,
        split: cart.split,
      });
      cart.clear();
      navigate(`/order/${order.id}`, { state: { total: order.total } });
    } catch {
      // Причин ровно две — нет связи или стола с таким номером нет в базе, —
      // и гостю за столом обе выглядят одинаково: заказ не ушёл.
      setError('Заказ не ушёл. Попробуйте ещё раз или позовите официанта');
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <AppHeader
        title="Корзина"
        subtitle={`Стол · ${cart.totalCount} ${pluralDishes(cart.totalCount)}`}
        onBack={() => navigate('/menu')}
        action={
          <IconButton aria-label="Очистить корзину" variant="muted" onClick={() => cart.clear()}>
            <TrashIcon size={20} />
          </IconButton>
        }
      />

      <p className={[styles.headline, ts('heading-7/bold')].join(' ')}>
        {cart.totalCount} {pluralDishes(cart.totalCount)} на {formatPrice(cart.totalPrice)}
      </p>

      <div className={styles.list}>
        {cart.items.map((item) => {
          const dish = findDish(item.dishId);
          if (!dish) return null;
          const available = isAvailable(dish);
          const unitPrice = resolveDishPrice(dish, item.selections);
          const selectionLabel = describeSelections(dish, item.selections);
          const hasOptions = Boolean(dish.optionGroups?.length);
          return (
            <DishCard
              key={item.key}
              variant="row"
              unavailable={!available}
              title={dish.name}
              price={unitPrice * item.quantity}
              meta={available ? (selectionLabel ?? formatMeta(dish)) : 'Закончилось — уберите из заказа'}
              image={dishImage(dish.image)}
              quantity={item.quantity}
              onQuantityChange={(quantity) => cart.setQuantity(item.key, quantity, item.dishId, item.selections)}
              // «Изменить» имеет смысл только там, где есть что менять — у блюд
              // с размером/тестом. Текущий выбор уезжает на страницу блюда,
              // иначе он молча сбрасывался бы на дефолтный.
              onEdit={
                available && hasOptions
                  ? () => navigate(`/dish/${dish.id}`, { state: { selections: item.selections, cartKey: item.key } })
                  : undefined
              }
              onOpen={() => navigate(`/dish/${dish.id}`)}
            />
          );
        })}
      </div>

      {stopListed.length > 0 ? (
        <p className={[styles.warning, ts('body-s/regular')].join(' ')} role="status">
          {stopListed.length === 1 ? 'Одно блюдо закончилось' : `Блюд закончилось: ${stopListed.length}`} — оно не войдёт
          в счёт. Уберите его, чтобы оформить заказ.
        </p>
      ) : null}

      <section className={styles.section}>
        <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Подача блюд</h2>
        <div className={styles.group}>
          <FormRow
            label="Подавать по мере готовности"
            action={
              <Radio
                name="serving"
                label=""
                aria-label="Подавать по мере готовности"
                checked={cart.servingMode === 'ready'}
                onChange={() => cart.setServingMode('ready')}
              />
            }
          />
          <FormRow
            label="Подать все блюда вместе"
            action={
              <Radio
                name="serving"
                label=""
                aria-label="Подать все блюда вместе"
                checked={cart.servingMode === 'together'}
                onChange={() => cart.setServingMode('together')}
              />
            }
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Комментарий кухне</h2>
        <TextArea
          label="Напишите, чего не хватает"
          value={cart.comment}
          onChange={(event) => cart.setComment(event.target.value)}
        />
      </section>

      {offers.length > 0 ? (
        <section className={styles.section}>
          <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Добавить к заказу</h2>
          <div className={styles.offers}>
            {offers.map((dish) => (
              <div key={dish.id} className={styles.offer}>
                <DishCard
                  title={dish.name}
                  price={resolveDishPrice(dish)}
                  meta={formatMeta(dish)}
                  image={dishImage(dish.image)}
                  rating={dish.rating}
                  quantity={cart.quantityOfDish(dish.id)}
                  onQuantityChange={(quantity) => cart.setQuantity(dish.id, quantity, dish.id)}
                  onOpen={() => navigate(`/dish/${dish.id}`)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.splitRow}>
        <Button
          block
          variant="secondary"
          onClick={() => navigate('/split')}
        >
          {cart.split ? `Счёт разделён на ${cart.split.guests}` : 'Разделить корзину'}
        </Button>
      </div>

      {error ? (
        <p className={[styles.warning, ts('body-s/regular')].join(' ')} role="status">
          {error}
        </p>
      ) : null}

      <CartBar
        summary="Итого"
        total={formatPrice(cart.totalPrice)}
        actionLabel={sending ? 'Отправляем…' : cart.hasUnavailable ? 'Уберите закончившееся' : 'Оформить заказ'}
        onAction={() => void submit()}
        disabled={sending || blocked}
      />
    </div>
  );
}
