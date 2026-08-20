import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  Button,
  ClockIcon,
  IconButton,
  ReceiptIcon,
  StatusPill,
  TableIcon,
  TableStatusChip,
  UsersIcon,
  ts,
} from '@food/ui';
import { formatPrice, formatShift, pluralGuests, type FloorTable } from '@food/domain';
import {
  currentShift,
  fetchFloor,
  fetchTableService,
  initials,
  resolveWaiterCalls,
  subscribeFloor,
  type FloorSnapshot,
  type TableService,
} from '../data/floorRepository';
import { OrderComposition } from '../components/OrderComposition';
import { useAuth } from '@food/staff';
import styles from './HomePage.module.css';

export function HomePage() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [floor, setFloor] = useState<FloorSnapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shiftActive, setShiftActive] = useState(false);
  // Состав держим вместе с id стола: иначе при переключении на секунду
  // светятся позиции предыдущего стола, пока не пришёл ответ.
  const [service, setService] = useState<{ tableId: string; data: TableService } | null>(null);
  // Счётчик обновлений зала: по нему перечитывается и состав выбранного стола —
  // кухня отметила блюдо готовым, и строка гостя должна стать «Нужно подать».
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!me) return;
    let first = true;
    const load = () =>
      void fetchFloor(me).then((snapshot) => {
        setFloor(snapshot);
        if (first) {
          first = false;
          // Открываем на столе, который ждёт подачу: официант заходит в приложение
          // именно из-за него, а не чтобы полюбоваться списком.
          const calling = snapshot.tables.find((table) => table.status === 'awaiting');
          setSelectedId((calling ?? snapshot.tables[0])?.id ?? null);
        }
      });

    load();
    // Кухня отметила заказ готовым — стол загорается сам, без обновления экрана.
    return subscribeFloor(() => {
      load();
      setVersion((current) => current + 1);
    });
  }, [me]);

  useEffect(() => {
    if (!selectedId) return;
    let current = true;
    // Состав грузим отдельно от зала: он нужен только для открытого стола,
    // тянуть позиции всех столов лентой — лишний трафик на каждом обновлении.
    void fetchTableService(selectedId).then((data) => {
      if (current) setService({ tableId: selectedId, data });
    });
    return () => {
      current = false;
    };
  }, [selectedId, version]);

  if (!floor) {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Открываем смену…</p>;
  }

  const selected: FloorTable | undefined =
    floor.tables.find((table) => table.id === selectedId) ?? floor.tables[0];
  const composition = service && service.tableId === selected?.id ? service.data : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={[styles.avatar, ts('action/semibold')].join(' ')} aria-hidden="true">
          {initials(floor.waiter)}
        </span>
        <div className={styles.identity}>
          <p className={[styles.name, ts('heading-9/extrabold')].join(' ')}>{floor.waiter.name}</p>
          <p className={[styles.shift, ts('body-xs/regular')].join(' ')}>{formatShift(currentShift)}</p>
        </div>
        <IconButton aria-label="Уведомления" variant="muted" count={floor.tables.reduce((sum, t) => sum + t.alerts, 0)}>
          <BellIcon size={20} />
        </IconButton>
      </header>

      <section className={styles.tips}>
        <div className={styles.tipsText}>
          <span className={[styles.tipsLabel, ts('body-s/regular')].join(' ')}>Чаевые за смену</span>
          <span className={[styles.tipsValue, ts('heading-7/bold')].join(' ')}>{formatPrice(floor.tips)}</span>
        </div>
        {/* Вывод чаевых — это платёжный шлюз, которого ещё нет (фаза 4 ТЗ). */}
        <Button variant="secondary" size="m" disabled>
          Вывести
        </Button>
      </section>

      <div className={styles.shiftAction}>
        <Button block onClick={() => setShiftActive((current) => !current)}>
          {shiftActive ? 'Завершить смену' : 'Начать смену'}
        </Button>
      </div>

      <section className={styles.tables}>
        <h2 className={[styles.sectionTitle, ts('heading-7/bold')].join(' ')}>Мои столы</h2>
        <div className={styles.lane}>
          {floor.tables.map((table) => (
            <TableStatusChip
              key={table.id}
              number={table.number}
              status={table.status}
              alerts={table.alerts}
              selected={table.id === selected?.id}
              onClick={() => setSelectedId(table.id)}
            />
          ))}
        </div>
      </section>

      {selected ? (
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardTitle}>
              <TableIcon size={24} className={styles.cardIcon} />
              <span className={ts('heading-7/bold')}>Стол №{selected.number}</span>
            </span>
            <StatusPill status={selected.status} />
          </div>

          <div className={styles.facts}>
            <span className={[styles.fact, ts('body-s/regular')].join(' ')}>
              <ClockIcon size={16} className={styles.factIcon} />
              {selected.reservedAt ? `Бронь в ${selected.reservedAt}` : 'Брони нет'}
            </span>
            <span className={[styles.fact, ts('body-s/regular')].join(' ')}>
              <UsersIcon size={16} className={styles.factIcon} />
              На {selected.seats} {pluralGuests(selected.seats)}
            </span>
            {composition && composition.total > 0 ? (
              <span className={[styles.fact, ts('body-s/regular')].join(' ')}>
                <ReceiptIcon size={16} className={styles.factIcon} />
                {formatPrice(composition.total)}
              </span>
            ) : null}
          </div>

          {/* Пока состав не пришёл, не показываем ни позиций, ни «пусто»:
              ложное «ничего не заказали» официант читает как факт. */}
          {composition ? (
            composition.items.length ? (
              <OrderComposition items={composition.items} guests={composition.guests} />
            ) : (
              <p className={[styles.empty, ts('body-s/regular')].join(' ')}>
                {selected.status === 'free' ? 'Стол свободен — заказов нет.' : 'Гости ещё ничего не заказали.'}
              </p>
            )
          ) : null}

          <div className={styles.cardActions}>
            <Button
              block
              disabled={!shiftActive}
              onClick={() => {
                // Официант подошёл к столу: закрываем его вызовы и идём набирать
                // заказ. Одно движение — потому что за столом он делает именно это.
                void resolveWaiterCalls(selected.id);
                navigate(`/table/${selected.id}/guests`);
              }}
            >
              {selected.status === 'awaiting' ? 'Отнести и дозаказать' : 'Принять заказ'}
            </Button>
            <Button block variant="secondary" disabled={!shiftActive}>
              Забронировать стол
            </Button>
          </div>

          {!shiftActive ? (
            <p className={[styles.hint, ts('body-xs/regular')].join(' ')} role="status">
              Начните смену, чтобы принимать заказы.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
