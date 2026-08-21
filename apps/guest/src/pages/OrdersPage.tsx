import { useNavigate } from 'react-router-dom';
import { AppHeader, Button, ts } from '@food/ui';
import {
  formatPrice,
  ORDER_STEPS,
  orderStatusLabel,
  orderStatusStep,
  orderSplitLines,
  type SessionOrderItem,
  type SplitState,
  splitTotals,
} from '@food/domain';
import { useOrders } from '../state/ordersStore';
import { useTableSession } from '../state/tableSessionStore';
import styles from './OrdersPage.module.css';

/**
 * Доли гостей по позициям заказа. Гость у позиции ищется по слагу блюда:
 * раскладку гость делал ключами строк корзины, а в заказе их нет.
 */
function shareTotals(items: SessionOrderItem[], split: SplitState): number[] {
  const { lines, assignments } = orderSplitLines(items, split);
  return splitTotals(lines, { mode: 'items', guests: split.guests, assignments });
}

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
              {/* Статус настоящий: его двигают повар и официант, а сюда он
                  приезжает по realtime — гость видит движение, не спрашивая. */}
              <span className={[styles.status, styles[order.status], ts('body-s/medium')].join(' ')}>
                {orderStatusLabel(order.status)}
              </span>
            </header>

            {/* Путь заказа полоской: «в очереди → готовится → несут → подано».
                Закрытый счёт шагов не имеет — это конец истории. */}
            {order.status !== 'paid' && order.status !== 'cancelled' ? (
              <div className={styles.steps} aria-label={`Статус: ${orderStatusLabel(order.status)}`}>
                {ORDER_STEPS.map((step, index) => (
                  <span
                    key={step}
                    className={[styles.step, index <= orderStatusStep(order.status) ? styles.stepDone : '']
                      .filter(Boolean)
                      .join(' ')}
                  />
                ))}
              </div>
            ) : null}

            <p className={[styles.orderMeta, ts('body-xs/regular')].join(' ')}>
              {order.servingMode === 'together' ? 'Подать всё вместе' : 'Подавать по мере готовности'}
              {order.split ? ` · счёт на ${order.split.guests}` : ''}
            </p>

            {order.comment ? (
              <p className={[styles.comment, ts('body-s/regular')].join(' ')}>Кухне: {order.comment}</p>
            ) : null}

            <ul className={styles.items}>
              {order.items.map((item) => (
                <li key={item.key} className={styles.item}>
                  <span className={styles.itemText}>
                    <span className={[styles.itemName, ts('body-s/regular')].join(' ')}>
                      {item.quantity} × {item.title}
                      {item.options ? <span className={styles.itemOptions}> · {item.options}</span> : null}
                      {/* Модификаторы гость оплачивает наравне с блюдом — значит и видеть
                          их должен: «+ бекон» это надбавка в счёте, а «− орегано» —
                          то, что он проверит, когда тарелку принесут. */}
                      {item.modifiers ? <span className={styles.itemOptions}> · {item.modifiers}</span> : null}
                    </span>
                    {/* У каждой тарелки свой статус: одну уже несут, другая ещё в очереди. */}
                    <span className={[styles.itemStatus, styles[item.status], ts('body-xs/regular')].join(' ')}>
                      {orderStatusLabel(item.status)}
                    </span>
                  </span>
                  <span className={[styles.itemPrice, ts('body-s/medium')].join(' ')}>
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            {order.split ? (
              <ul className={styles.shares}>
                {shareTotals(order.items, order.split).map((share, guest) => (
                  <li key={guest} className={styles.share}>
                    <span className={[styles.shareLabel, ts('body-xs/regular')].join(' ')}>Гость {guest + 1}</span>
                    <span className={[styles.shareValue, ts('body-xs/medium')].join(' ')}>{formatPrice(share)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
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
