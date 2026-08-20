import { useNavigate } from 'react-router-dom';
import { AppHeader, Badge, Button } from '../components';
import { describeSelections, findDish, resolveDishPrice } from '../data/menuRepository';
import { formatPrice } from '../data/format';
import { useOrders } from '../state/ordersStore';
import { useTableSession } from '../state/tableSessionStore';
import { ts } from '../tokens/typography';
import styles from './OrdersPage.module.css';

/** Время оформления: «19:40». Дата не нужна — сессия живёт один визит. */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { orders, sessionTotal, tip, billTotal } = useOrders();
  const { tableNumber } = useTableSession();

  if (orders.length === 0) {
    return (
      <div className={styles.page}>
        <AppHeader title="Мои заказы" onBack={() => navigate('/')} />
        <div className={styles.empty}>
          <p className={[styles.emptyText, ts('body-m/regular')].join(' ')}>
            За этим столом вы ещё ничего не заказывали.
          </p>
          <Button onClick={() => navigate('/menu')}>Открыть меню</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppHeader title="Мои заказы" subtitle={`Стол ${tableNumber}`} onBack={() => navigate('/')} />

      <div className={styles.list}>
        {orders.map((order) => (
          <section key={order.id} className={styles.order}>
            <header className={styles.orderHead}>
              <div>
                <p className={[styles.orderTitle, ts('heading-9/extrabold')].join(' ')}>Заказ №{order.id}</p>
                <p className={[styles.orderMeta, ts('body-xs/regular')].join(' ')}>
                  в {formatTime(order.placedAt)} · {formatPrice(order.total)}
                </p>
              </div>
              {/* Статусов «готовится / подан» не будет до фазы 5 — бэкенда, который
                  их двигает, пока нет, поэтому показываем честное «принят». */}
              <Badge tone="muted">принят</Badge>
            </header>

            <ul className={styles.items}>
              {order.items.map((item) => {
                const dish = findDish(item.dishId);
                if (!dish) return null;
                const selections = describeSelections(dish, item.selections);
                return (
                  <li key={item.key} className={styles.item}>
                    <span className={[styles.itemName, ts('body-s/regular')].join(' ')}>
                      {item.quantity} × {dish.name}
                      {selections ? <span className={styles.itemOptions}> · {selections}</span> : null}
                    </span>
                    <span className={[styles.itemPrice, ts('body-s/medium')].join(' ')}>
                      {formatPrice(resolveDishPrice(dish, item.selections) * item.quantity)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className={styles.footer}>
        {tip > 0 ? (
          <div className={styles.total}>
            <span className={[styles.totalLabel, ts('body-xs/medium')].join(' ')}>
              Заказы {formatPrice(sessionTotal)} · чаевые
            </span>
            <span className={[styles.totalLabel, ts('body-xs/medium')].join(' ')}>{formatPrice(tip)}</span>
          </div>
        ) : null}
        <div className={styles.total}>
          <span className={[styles.totalLabel, ts('body-xs/medium')].join(' ')}>Счёт за стол</span>
          <span className={[styles.totalValue, ts('heading-8/bold')].join(' ')}>{formatPrice(billTotal)}</span>
        </div>
        <Button block onClick={() => navigate('/bill')}>
          Оплатить счёт
        </Button>
      </div>
    </div>
  );
}
