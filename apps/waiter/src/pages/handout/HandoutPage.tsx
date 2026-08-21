import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, SegmentedControl, ts } from '@food/ui';
import {
  DELIVERY_FLOW,
  type DeliveryKind,
  type DeliveryStatus,
  deliveryStatusLabel,
  deliveryTotal,
  formatAddress,
  formatPrice,
  nextDeliveryStatus,
  orderStatusLabel,
  pluralItems,
} from '@food/domain';
import { type Delivery, fetchDeliveries, setDeliveryStatus, subscribeDeliveries } from '@food/api';
import styles from './HandoutPage.module.css';

type Tab = DeliveryKind | 'hall';

/** «Все» — не статус, а отсутствие фильтра, поэтому живёт отдельно от списка. */
type Filter = DeliveryStatus | 'all';

const FILTERS: Filter[] = ['all', ...DELIVERY_FLOW, 'cancelled'];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Выдача из раздела 4 ТЗ: доставка, самовывоз и заказы зала одним списком.
 * Путь по статусам ведёт менеджер, а статус кухни показан фактом — двигать
 * его отсюда нельзя, иначе у тикета появится второй хозяин.
 */
export function HandoutPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('delivery');
  const [filter, setFilter] = useState<Filter>('all');
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);

  const load = useCallback(
    () => void fetchDeliveries().then(setDeliveries).catch(() => setDeliveries([])),
    [],
  );

  useEffect(() => {
    load();
    return subscribeDeliveries(load);
  }, [load]);

  const move = async (delivery: Delivery, status: DeliveryStatus) => {
    setDeliveries(
      (current) => current?.map((row) => (row.id === delivery.id ? { ...row, status } : row)) ?? null,
    );
    try {
      await setDeliveryStatus(delivery.id, status);
    } finally {
      load();
    }
  };

  const rows = (deliveries ?? [])
    .filter((row) => row.kind === tab)
    .filter((row) => filter === 'all' || row.status === filter);

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <h1 className={[styles.title, ts('heading-7/bold')].join(' ')}>Выдача</h1>
        <Button size="m" onClick={() => navigate('/handout/new')}>
          Новый заказ
        </Button>
      </header>

      <SegmentedControl
        aria-label="Тип выдачи"
        value={tab}
        onChange={(value) => setTab(value as Tab)}
        options={[
          { value: 'delivery', label: 'Доставка' },
          { value: 'pickup', label: 'Самовывоз' },
          { value: 'hall', label: 'В зале' },
        ]}
      />

      {tab === 'hall' ? (
        <p className={[styles.muted, ts('body-m/regular')].join(' ')}>
          Заказы зала живут на главной: там они привязаны к столам, а здесь у них не было бы ни
          адреса, ни курьера.
        </p>
      ) : (
        <>
          <div className={styles.filters}>
            {FILTERS.map((value) => (
              <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>
                {value === 'all' ? 'Все' : deliveryStatusLabel(value, tab)}
              </Chip>
            ))}
          </div>

          {deliveries === null ? (
            <p className={[styles.muted, ts('body-s/regular')].join(' ')}>Загружаем ленту…</p>
          ) : null}

          {deliveries !== null && rows.length === 0 ? (
            <p className={[styles.muted, ts('body-m/regular')].join(' ')}>
              {filter === 'all'
                ? tab === 'delivery'
                  ? 'Доставок пока нет.'
                  : 'Заказов на самовывоз пока нет.'
                : 'В этом статусе пусто.'}
            </p>
          ) : null}

          {rows.map((delivery) => {
            const next = nextDeliveryStatus(delivery.status);
            const count = delivery.items.reduce((sum, item) => sum + item.quantity, 0);
            const total = deliveryTotal({
              items: delivery.itemsTotal,
              deliveryFee: delivery.deliveryFee,
              serviceFee: delivery.serviceFee,
              discount: delivery.discount,
              tip: delivery.tip,
            });

            return (
              <article key={delivery.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>
                    <span className={[styles.number, ts('body-m/medium')].join(' ')}>
                      Заказ №{delivery.number}
                    </span>
                    <span className={[styles.time, ts('body-xs/regular')].join(' ')}>
                      {formatTime(delivery.createdAt)} · {count} {pluralItems(count)}
                    </span>
                  </span>
                  <span className={[styles.status, styles[delivery.status], ts('body-s/medium')].join(' ')}>
                    {deliveryStatusLabel(delivery.status, delivery.kind)}
                  </span>
                </div>

                {/* Статус кухни — факт, а не кнопка: тикет двигает повар. */}
                <p className={[styles.kitchen, ts('body-xs/regular')].join(' ')}>
                  Кухня: {orderStatusLabel(delivery.kitchenStatus).toLowerCase()}
                </p>

                <ul className={styles.items}>
                  {delivery.items.map((item) => (
                    <li key={item.key} className={styles.item}>
                      <span className={ts('body-s/regular')}>
                        {item.quantity} × {item.title}
                        {item.options || item.modifiers ? (
                          <span className={styles.itemMeta}>
                            {' · '}
                            {[item.options, item.modifiers].filter(Boolean).join(' · ')}
                          </span>
                        ) : null}
                      </span>
                      <span className={[styles.itemPrice, ts('body-s/medium')].join(' ')}>
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className={styles.money}>
                  <div className={styles.moneyRow}>
                    <dt className={ts('body-s/regular')}>Блюда</dt>
                    <dd className={ts('body-s/medium')}>{formatPrice(delivery.itemsTotal)}</dd>
                  </div>
                  {delivery.kind === 'delivery' ? (
                    <div className={styles.moneyRow}>
                      <dt className={ts('body-s/regular')}>Доставка</dt>
                      <dd className={ts('body-s/medium')}>{formatPrice(delivery.deliveryFee)}</dd>
                    </div>
                  ) : null}
                  {delivery.serviceFee > 0 ? (
                    <div className={styles.moneyRow}>
                      <dt className={ts('body-s/regular')}>Сервисный сбор</dt>
                      <dd className={ts('body-s/medium')}>{formatPrice(delivery.serviceFee)}</dd>
                    </div>
                  ) : null}
                  {delivery.discount > 0 ? (
                    <div className={styles.moneyRow}>
                      <dt className={ts('body-s/regular')}>
                        Скидка{delivery.promoCode ? ` · ${delivery.promoCode}` : ''}
                      </dt>
                      <dd className={[styles.discount, ts('body-s/medium')].join(' ')}>
                        −{formatPrice(delivery.discount)}
                      </dd>
                    </div>
                  ) : null}
                  {delivery.tip > 0 ? (
                    <div className={styles.moneyRow}>
                      <dt className={ts('body-s/regular')}>Чаевые</dt>
                      <dd className={ts('body-s/medium')}>{formatPrice(delivery.tip)}</dd>
                    </div>
                  ) : null}
                  <div className={[styles.moneyRow, styles.moneyTotal].join(' ')}>
                    <dt className={ts('body-m/medium')}>Итого</dt>
                    <dd className={ts('body-m/bold')}>{formatPrice(total)}</dd>
                  </div>
                </dl>

                <div className={styles.contacts}>
                  <p className={[styles.contactLine, ts('body-s/regular')].join(' ')}>
                    {delivery.customerName ?? 'Гость'} ·{' '}
                    <a className={styles.phone} href={`tel:${delivery.customerPhone}`}>
                      {delivery.customerPhone}
                    </a>
                  </p>
                  {delivery.kind === 'delivery' ? (
                    <p className={[styles.contactLine, ts('body-s/regular')].join(' ')}>
                      {formatAddress(delivery) || 'Адрес не указан'}
                    </p>
                  ) : null}
                  {delivery.leaveAtDoor || delivery.callOnArrival || delivery.courierComment ? (
                    <p className={[styles.contactLine, ts('body-xs/regular')].join(' ')}>
                      {[
                        delivery.leaveAtDoor ? 'Оставить у двери' : null,
                        delivery.callOnArrival ? 'Позвонить по прибытии' : null,
                        delivery.courierComment,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  ) : null}
                  <p className={[styles.payment, ts('body-s/medium')].join(' ')}>
                    {delivery.payment === 'online'
                      ? 'Оплачено онлайн'
                      : delivery.changeFrom
                        ? `Курьеру наличными · сдача с ${formatPrice(delivery.changeFrom)}`
                        : 'Курьеру наличными'}
                  </p>
                </div>

                <div className={styles.actions}>
                  {next ? (
                    <Button block onClick={() => void move(delivery, next)}>
                      {deliveryStatusLabel(next, delivery.kind)}
                    </Button>
                  ) : null}
                  {delivery.status !== 'cancelled' && delivery.status !== 'delivered' ? (
                    <Button block variant="secondary" onClick={() => void move(delivery, 'cancelled')}>
                      Отменить
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </>
      )}
    </section>
  );
}
