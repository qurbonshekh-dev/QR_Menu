import { useNavigate } from 'react-router-dom';
import { AppHeader, Button, CartBar, DishCard, } from '../components';
import { dishImage, findDish, formatMeta } from '../data/menuRepository';
import { formatPrice } from '../data/format';
import { pluralItems } from '../data/plural';
import { useCart } from '../state/cartStore';
import { ts } from '../tokens/typography';
import styles from './CartPage.module.css';


export function CartPage() {
  const navigate = useNavigate();
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div className={styles.page}>
        <AppHeader title="Корзина" onBack={() => navigate('/')} />
        <div className={styles.empty}>
          <p className={[styles.emptyText, ts('body-m/regular')].join(' ')}>
            Пока пусто. Выберите блюда в меню — они появятся здесь.
          </p>
          <Button onClick={() => navigate('/')}>Открыть меню</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppHeader title="Корзина" subtitle={`${cart.totalCount} ${pluralItems(cart.totalCount)} в заказе`} onBack={() => navigate('/')} />

      <div className={styles.list}>
        {cart.items.map((item) => {
          const dish = findDish(item.dishId);
          if (!dish) return null;
          return (
            <DishCard
              key={dish.id}
              variant="row"
              title={dish.name}
              price={dish.price * item.quantity}
              meta={formatMeta(dish)}
              image={dishImage(dish.image)}
              quantity={item.quantity}
              onQuantityChange={(quantity) => cart.setQuantity(dish.id, quantity)}
              onOpen={() => navigate(`/dish/${dish.id}`)}
            />
          );
        })}
      </div>

      <CartBar
        summary="Итого"
        total={formatPrice(cart.totalPrice)}
        actionLabel="Оформить"
        onAction={() => navigate('/checkout')}
      />
    </div>
  );
}
