import { useEffect, useState } from 'react';
import {
  BellIcon,
  Button,
  ChartIcon,
  ClockIcon,
  HomeIcon,
  IconButton,
  MessageIcon,
  ShoppingBagIcon,
  StatusPill,
  TabBar,
  TableIcon,
  TableStatusChip,
  UsersIcon,
  ts,
} from '@food/ui';
import { formatPrice, formatShift, pluralGuests, type FloorTable } from '@food/domain';
import { getFloor, initials, type FloorSnapshot } from '../data/floorRepository';
import styles from './HomePage.module.css';

type Tab = 'home' | 'messages' | 'handout' | 'stats';

export function HomePage() {
  const [floor, setFloor] = useState<FloorSnapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shiftActive, setShiftActive] = useState(false);
  const [tab, setTab] = useState<Tab>('home');

  useEffect(() => {
    getFloor().then((snapshot) => {
      setFloor(snapshot);
      setShiftActive(snapshot.shift.active);
      // Открываем на столе, который ждёт подачу: официант заходит в приложение
      // именно из-за него, а не чтобы полюбоваться списком.
      const calling = snapshot.tables.find((table) => table.status === 'awaiting');
      setSelectedId((calling ?? snapshot.tables[0])?.id ?? null);
    });
  }, []);

  if (!floor) {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Открываем смену…</p>;
  }

  const selected: FloorTable | undefined =
    floor.tables.find((table) => table.id === selectedId) ?? floor.tables[0];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={[styles.avatar, ts('action/semibold')].join(' ')} aria-hidden="true">
          {initials(floor.waiter)}
        </span>
        <div className={styles.identity}>
          <p className={[styles.name, ts('heading-9/extrabold')].join(' ')}>{floor.waiter.name}</p>
          <p className={[styles.shift, ts('body-xs/regular')].join(' ')}>{formatShift(floor.shift)}</p>
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
          </div>

          <div className={styles.cardActions}>
            <Button block disabled={!shiftActive}>
              {selected.status === 'awaiting' ? 'Отнести заказ' : 'Принять заказ'}
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

      <TabBar
        aria-label="Разделы приложения"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'home', label: 'Главная', icon: <HomeIcon size={20} /> },
          { value: 'messages', label: 'Сообщения', icon: <MessageIcon size={20} /> },
          { value: 'handout', label: 'Выдача', icon: <ShoppingBagIcon size={20} />, badge: 1 },
          { value: 'stats', label: 'Статистика', icon: <ChartIcon size={20} /> },
        ]}
      />
    </div>
  );
}
