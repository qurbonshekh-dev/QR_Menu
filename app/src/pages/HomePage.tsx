import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionTile,
  AppHeader,
  Badge,
  Button,
  Chip,
  HeartIcon,
  IconButton,
  MenuListIcon,
  PencilIcon,
  ReceiptIcon,
  ShoppingBagIcon,
  StarIcon,
  TableCard,
  TextInput,
  UserIcon,
  WalletIcon,
} from '../components';
import { formatTableLabel, getRestaurant, waiterInitial } from '../data/menuRepository';
import type { Restaurant } from '../data/types';
import { formatPrice } from '../data/format';
import { useCart } from '../state/cartStore';
import { useOrders } from '../state/ordersStore';
import { useTableSession } from '../state/tableSessionStore';
import { ts } from '../tokens/typography';
import styles from './HomePage.module.css';

/** Сколько держится подтверждение вызова официанта. Бэкенда нет — это честная
 *  локальная заглушка, а не «отправлено на кухню». */
const WAITER_CALL_MS = 30_000;

/** Поводы позвать официанта. Взяты из блок-схемы продукта, но живут не в отзыве,
 *  а в самом вызове: официанту полезнее знать, зачем его зовут. */
const WAITER_REASONS = ['Принести приборы', 'Принести меню', 'Принести воду', 'Помочь с заказом'];

export function HomePage() {
  const navigate = useNavigate();
  const cart = useCart();
  const { orders, billTotal, tip } = useOrders();
  const { tableNumber, setTableNumber } = useTableSession();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [tableDraft, setTableDraft] = useState<string | null>(null);
  const [callDraft, setCallDraft] = useState<string[] | null>(null);
  const [calledReasons, setCalledReasons] = useState<string[]>([]);
  const callTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getRestaurant().then(setRestaurant);
  }, []);

  useEffect(() => () => {
    if (callTimer.current) clearTimeout(callTimer.current);
  }, []);

  const saveTable = (event: FormEvent) => {
    event.preventDefault();
    const next = (tableDraft ?? '').trim();
    if (next) setTableNumber(next);
    setTableDraft(null);
  };

  const callWaiter = (reasons: string[]) => {
    setCalledReasons(reasons);
    setWaiterCalled(true);
    setCallDraft(null);
    if (callTimer.current) clearTimeout(callTimer.current);
    callTimer.current = setTimeout(() => setWaiterCalled(false), WAITER_CALL_MS);
  };

  const toggleReason = (reason: string) => {
    setCallDraft((current) => {
      const reasons = current ?? [];
      return reasons.includes(reason) ? reasons.filter((item) => item !== reason) : [...reasons, reason];
    });
  };

  if (!restaurant) {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Открываем стол…</p>;
  }

  const hasOrders = orders.length > 0;

  return (
    <div className={styles.page}>
      <AppHeader
        title={restaurant.name}
        subtitle={formatTableLabel(tableNumber, restaurant)}
      />

      <section className={styles.welcome}>
        <h2 className={[styles.welcomeTitle, ts('heading-6/bold')].join(' ')}>Добро пожаловать</h2>
        <p className={[styles.welcomeText, ts('body-m/regular')].join(' ')}>
          Заказывайте прямо с телефона — не надо никого ждать.
        </p>
      </section>

      <nav className={styles.tabs} aria-label="Разделы">
        <Chip selected>Главная</Chip>
        <Chip disabled>Акции и другое</Chip>
      </nav>

      <div className={styles.grid}>
        <div className={styles.tableSlot}>
          <TableCard
            tableNumber={tableNumber}
            waiterName={restaurant.waiter.name}
            waiterInitial={waiterInitial(restaurant.waiter)}
            action={
              <IconButton
                aria-label="Изменить номер стола"
                variant="muted"
                onClick={() => setTableDraft(tableNumber)}
              >
                <PencilIcon size={16} />
              </IconButton>
            }
          />
        </div>

        <ActionTile
          title="Меню"
          caption="Посмотреть меню"
          icon={<MenuListIcon size={20} />}
          onClick={() => navigate('/menu')}
        />

        <ActionTile
          title="Официант"
          caption={waiterCalled ? `${restaurant.waiter.name} идёт к вам` : 'Позвать официанта'}
          icon={<UserIcon size={20} />}
          onClick={() => setCallDraft([])}
        />

        {callDraft !== null ? (
          <section className={styles.call} aria-label="Вызов официанта">
            <p className={[styles.callTitle, ts('body-s/regular')].join(' ')}>
              Что-то нужно? Отметьте — официант возьмёт с собой.
            </p>
            <div className={styles.callReasons}>
              {WAITER_REASONS.map((reason) => (
                <Chip
                  key={reason}
                  selected={callDraft.includes(reason)}
                  aria-pressed={callDraft.includes(reason)}
                  onClick={() => toggleReason(reason)}
                >
                  {reason}
                </Chip>
              ))}
            </div>
            <div className={styles.callActions}>
              <Button size="m" onClick={() => callWaiter(callDraft)}>
                Позвать
              </Button>
              <Button size="m" variant="secondary" onClick={() => setCallDraft(null)}>
                Отмена
              </Button>
            </div>
          </section>
        ) : null}

        {tableDraft !== null ? (
          <form className={styles.tableEdit} onSubmit={saveTable}>
            <TextInput
              label="Номер стола"
              value={tableDraft}
              inputMode="numeric"
              autoFocus
              onChange={(event) => setTableDraft(event.target.value)}
            />
            <Button type="submit" size="m">
              Сохранить
            </Button>
          </form>
        ) : null}
      </div>

      <p className={styles.live} role="status" aria-live="polite">
        {waiterCalled
          ? `Официант ${restaurant.waiter.name} идёт к столу ${tableNumber}.` +
            (calledReasons.length ? ` Просьба: ${calledReasons.join(', ').toLowerCase()}.` : '')
          : ''}
      </p>

      <div className={styles.rows}>
        <ActionTile
          variant="wide"
          title="Оплатить счёт"
          caption={
            hasOrders
              ? tip > 0
                ? `${formatPrice(billTotal)} · с чаевыми`
                : formatPrice(billTotal)
              : 'Вы ещё не заказывали'
          }
          icon={<WalletIcon size={20} />}
          disabled={!hasOrders}
          onClick={() => navigate('/bill')}
        />

        <ActionTile
          variant="wide"
          title="Мои заказы"
          caption={hasOrders ? `Заказов за столом: ${orders.length}` : 'Пока пусто'}
          icon={<ReceiptIcon size={20} />}
          onClick={() => navigate('/orders')}
        />

        <ActionTile
          variant="wide"
          title="Оставить чаевые"
          caption={
            tip > 0
              ? `Добавлено к счёту: ${formatPrice(tip)}`
              : hasOrders
                ? 'Поддержать официанта или кухню'
                : 'Появятся вместе со счётом'
          }
          icon={<HeartIcon size={20} />}
          disabled={!hasOrders}
          onClick={() => navigate('/bill', { state: { tab: 'tip' } })}
        />

        <ActionTile
          variant="wide"
          title="Отзыв о ресторане"
          caption="Оценить кухню и сервис"
          icon={<StarIcon size={16} />}
          disabled
          badge={<Badge tone="overlay">скоро</Badge>}
        />
      </div>

      {cart.totalCount > 0 ? (
        <div className={styles.fab}>
          <IconButton aria-label="Корзина" count={cart.totalCount} onClick={() => navigate('/cart')}>
            <ShoppingBagIcon size={24} />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}
