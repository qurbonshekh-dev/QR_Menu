import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  Button,
  Chip,
  ClockIcon,
  IconButton,
  ReceiptIcon,
  StatusPill,
  TableIcon,
  TextInput,
  TableStatusChip,
  UsersIcon,
  ts,
} from '@food/ui';
import { formatPrice, formatShift, pluralGuests, type FloorTable } from '@food/domain';
import {
  cancelReservation,
  closeTableBill,
  currentShift,
  fetchFloor,
  mergeTables,
  moveTableOrders,
  fetchTableService,
  initials,
  reserveTable,
  resolveWaiterCalls,
  serveOrderItem,
  serveReadyOrders,
  unmergeTable,
  subscribeFloor,
  type FloorSnapshot,
  type TableService,
} from '../data/floorRepository';
import { OrderComposition } from '../components/OrderComposition';
import { useAuth } from '@food/staff';
import styles from './HomePage.module.css';

/** Бронь по умолчанию — через час, округлённая до получаса: за столом никто
 *  не бронирует «на 19:07». */
function defaultBookingTime(): string {
  const at = new Date(Date.now() + 60 * 60 * 1000);
  at.setMinutes(at.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (at.getMinutes() === 0) at.setHours(at.getHours() + 1);
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
}

/** «19:30» → дата. Время уже прошло — значит, бронь на завтра: столы бронируют
 *  вперёд, а не назад. */
function bookingTime(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const at = new Date();
  at.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  if (at.getTime() < Date.now()) at.setDate(at.getDate() + 1);
  return at;
}

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
  // Форма брони раскрывается прямо в карточке: официант ставит бронь у стола,
  // отдельный экран ради одного поля времени только удлинил бы путь.
  const [bookingAt, setBookingAt] = useState<string | null>(null);
  // Закрытие счёта спрашиваем дважды: заказы уходят из зала безвозвратно,
  // а официант жмёт кнопки на ходу.
  const [closing, setClosing] = useState(false);
  // Пересадка и объединение спрашивают один и тот же вопрос — «какой стол?»,
  // поэтому это один список с двумя режимами, а не два экрана.
  const [picking, setPicking] = useState<'move' | 'merge' | null>(null);

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

  // Есть ли что нести прямо сейчас: хотя бы одна позиция ждёт подачи.
  const waiting = composition?.items.some((item) => item.status === 'to-serve') ?? false;

  /** Любое действие по столу перечитывает зал: realtime тоже принесёт событие,
   *  но ждать его, стоя у стола, официант не должен. */
  const act = async (action: Promise<void>) => {
    await action;
    setVersion((current) => current + 1);
    if (me) setFloor(await fetchFloor(me));
  };

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
              onClick={() => {
                // Переключили стол — незавершённые подтверждения с прошлого
                // не должны переезжать на новый.
                setSelectedId(table.id);
                setClosing(false);
                setBookingAt(null);
                setPicking(null);
              }}
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
            {selected.mergedWith?.length ? (
              <span className={[styles.fact, ts('body-s/regular')].join(' ')}>
                <TableIcon size={16} className={styles.factIcon} />
                Со столом {selected.mergedWith.map((table) => `№${table.number}`).join(', ')}
              </span>
            ) : null}
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
              <OrderComposition
                items={composition.items}
                guests={composition.guests}
                onServe={(item) => void act(serveOrderItem(item.id))}
              />
            ) : (
              <p className={[styles.empty, ts('body-s/regular')].join(' ')}>
                {selected.status === 'free' ? 'Стол свободен — заказов нет.' : 'Гости ещё ничего не заказали.'}
              </p>
            )
          ) : null}

          <div className={styles.cardActions}>
            {/* Блюда готовы — сначала отдать их, а уже потом всё остальное.
                Спрашиваем состав, а не цвет стола: статус стола может отстать
                (его двигает триггер), а тарелка на раздаче уже стоит. */}
            {waiting ? (
              <Button block onClick={() => void act(serveReadyOrders(selected.id))}>
                Отдал гостям
              </Button>
            ) : null}

            <Button
              block
              variant={waiting ? 'secondary' : 'main'}
              onClick={() => {
                // Официант подошёл к столу: закрываем его вызовы и идём набирать
                // заказ. Одно движение — потому что за столом он делает именно это.
                void resolveWaiterCalls(selected.id);
                navigate(`/table/${selected.id}/guests`);
              }}
            >
              {composition && composition.items.length ? 'Добавить позиции' : 'Принять заказ'}
            </Button>

            {composition && composition.items.length ? (
              closing ? (
                <div className={styles.booking}>
                  <p className={[styles.hint, ts('body-s/regular')].join(' ')}>
                    Закрыть счёт на {formatPrice(composition.total)}? Стол станет свободным.
                  </p>
                  <Button
                    block
                    onClick={() => {
                      void act(closeTableBill(selected.id));
                      setClosing(false);
                    }}
                  >
                    Да, счёт закрыт
                  </Button>
                  <Button block variant="secondary" onClick={() => setClosing(false)}>
                    Отмена
                  </Button>
                </div>
              ) : (
                <Button block variant="secondary" onClick={() => setClosing(true)}>
                  Закрыть счёт · {formatPrice(composition.total)}
                </Button>
              )
            ) : null}

            {picking ? (
              <div className={styles.booking}>
                <p className={[styles.hint, ts('body-s/regular')].join(' ')}>
                  {picking === 'move' ? 'Куда пересаживаем гостей?' : 'С каким столом объединить?'}
                </p>
                <div className={styles.lane}>
                  {floor.tables
                    .filter((table) => table.id !== selected.id)
                    .filter((table) => (picking === 'move' ? table.status === 'free' : true))
                    .map((table) => (
                      <Chip
                        key={table.id}
                        onClick={() => {
                          void act(
                            picking === 'move'
                              ? moveTableOrders(selected.id, table.id)
                              : mergeTables(selected.id, table.id),
                          );
                          if (picking === 'move') setSelectedId(table.id);
                          setPicking(null);
                        }}
                      >
                        №{table.number}
                      </Chip>
                    ))}
                </div>
                <Button block variant="secondary" onClick={() => setPicking(null)}>
                  Отмена
                </Button>
              </div>
            ) : (
              <>
                {composition && composition.items.length ? (
                  <Button block variant="secondary" onClick={() => setPicking('move')}>
                    Пересадить за другой стол
                  </Button>
                ) : null}
                <Button block variant="secondary" onClick={() => setPicking('merge')}>
                  Объединить столы
                </Button>
              </>
            )}

            {selected.mergedWith?.map((table) => (
              <Button
                key={table.id}
                block
                variant="secondary"
                onClick={() => void act(unmergeTable(table.id))}
              >
                Отсоединить стол №{table.number}
              </Button>
            ))}

            {selected.status === 'reserved' ? (
              <Button block variant="secondary" onClick={() => void act(cancelReservation(selected.id))}>
                Снять бронь
              </Button>
            ) : null}

            {selected.status === 'free' ? (
              bookingAt === null ? (
                <Button block variant="secondary" onClick={() => setBookingAt(defaultBookingTime())}>
                  Забронировать стол
                </Button>
              ) : (
                <div className={styles.booking}>
                  <TextInput
                    label="Время брони"
                    type="time"
                    value={bookingAt}
                    onChange={(event) => setBookingAt(event.target.value)}
                  />
                  <Button
                    block
                    onClick={() => {
                      void act(reserveTable(selected.id, bookingTime(bookingAt)));
                      setBookingAt(null);
                    }}
                  >
                    Забронировать на {bookingAt}
                  </Button>
                  <Button block variant="secondary" onClick={() => setBookingAt(null)}>
                    Отмена
                  </Button>
                </div>
              )
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
