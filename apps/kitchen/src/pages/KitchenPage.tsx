import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, CheckDoubleIcon, TicketCard, UndoIcon, ts } from '@food/ui';
import {
  allDayCount,
  formatElapsed,
  ticketAge,
  ticketStatusLabel,
  READY_AGE_THRESHOLDS,
  type KitchenTicket,
  type TicketStatus,
} from '@food/domain';
import { subscribeTickets } from '../data/ticketsRepository';
import styles from './KitchenPage.module.css';

/** Колонки доски — те же три состояния, что у тикета в домене. */
const COLUMNS: TicketStatus[] = ['queued', 'cooking', 'ready'];

/** Правка статуса поверх ленты: сама лента статусы не двигает — это делает повар. */
interface Move {
  status: TicketStatus;
  readyAt?: string;
}

/** Таймер один на весь экран: тикетов много, и каждый со своим интервалом
 *  превратил бы страницу в секундомерную ферму. */
function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function KitchenPage() {
  const [feed, setFeed] = useState<KitchenTicket[]>([]);
  const [moves, setMoves] = useState<Record<string, Move>>({});
  const [served, setServed] = useState<string[]>([]);
  const now = useNow();

  useEffect(() => subscribeTickets(setFeed), []);

  const tickets = useMemo(
    () =>
      feed
        .filter((ticket) => !served.includes(ticket.id))
        .map((ticket) => ({ ...ticket, ...moves[ticket.id] }))
        .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()),
    [feed, moves, served],
  );

  const board = useMemo(
    () => COLUMNS.map((status) => ({ status, items: tickets.filter((ticket) => ticket.status === status) })),
    [tickets],
  );

  const move = useCallback((ticket: KitchenTicket, status: TicketStatus) => {
    setMoves((current) => ({
      ...current,
      [ticket.id]: { status, readyAt: status === 'ready' ? new Date().toISOString() : undefined },
    }));
  }, []);

  const serve = useCallback((ticket: KitchenTicket) => {
    setServed((current) => [...current, ticket.id]);
  }, []);

  // Нумерация сквозная по двум рабочим колонкам — цифра написана на карточке,
  // поэтому повар жмёт ровно то, что видит. Готовые тикеты клавиш не имеют.
  const hotkeyOrder = useMemo(
    () => tickets.filter((ticket) => ticket.status !== 'ready'),
    [tickets],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const index = Number(event.key);
      if (!Number.isInteger(index) || index < 1 || index > 9) return;
      const ticket = hotkeyOrder[index - 1];
      if (ticket) move(ticket, ticket.status === 'queued' ? 'cooking' : 'ready');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkeyOrder, move]);

  const active = tickets.filter((ticket) => ticket.status !== 'ready');
  const allDay = allDayCount(active);
  const oldest = active[0];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <span className={[styles.statValue, ts('heading-5/bold')].join(' ')}>{active.length}</span>
            <span className={[styles.statLabel, ts('body-s/regular')].join(' ')}>в работе</span>
          </span>
          <span className={styles.stat}>
            <span className={[styles.statValue, ts('heading-5/bold')].join(' ')}>
              {oldest ? formatElapsed(oldest.placedAt, now) : '—'}
            </span>
            <span className={[styles.statLabel, ts('body-s/regular')].join(' ')}>самый долгий</span>
          </span>
        </div>

        {/* All-day: сколько одинаковых позиций ещё готовить — повар работает партией. */}
        <div className={styles.allDay} aria-label="Осталось приготовить">
          {allDay.map((entry) => (
            <span key={entry.title} className={[styles.allDayItem, ts('body-m/medium')].join(' ')}>
              {entry.title}
              <span className={[styles.allDayCount, ts('body-m/bold')].join(' ')}>{entry.quantity}</span>
            </span>
          ))}
        </div>
      </header>

      <div className={styles.board}>
        {board.map((column) => (
          <section key={column.status} className={styles.column} aria-label={ticketStatusLabel(column.status)}>
            <header className={styles.columnHead}>
              <span className={[styles.columnTitle, ts('heading-8/bold')].join(' ')}>
                {ticketStatusLabel(column.status)}
              </span>
              <span className={[styles.columnCount, ts('heading-8/bold')].join(' ')}>{column.items.length}</span>
            </header>

            <div className={styles.columnBody}>
              {column.items.length === 0 ? (
                <p className={[styles.columnEmpty, ts('body-m/regular')].join(' ')}>Пусто</p>
              ) : null}

              {column.items.map((ticket) => {
                const ready = ticket.status === 'ready';
                // В «Готово» цвет считается от момента готовности: там важно не
                // сколько блюдо готовили, а сколько оно стоит и стынет.
                const since = ready ? (ticket.readyAt ?? ticket.placedAt) : ticket.placedAt;
                const hotkeyIndex = hotkeyOrder.findIndex((item) => item.id === ticket.id);
                return (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    age={ticketAge(since, now, ready ? READY_AGE_THRESHOLDS : undefined)}
                    elapsed={formatElapsed(since, now)}
                    hotkey={!ready && hotkeyIndex >= 0 && hotkeyIndex < 9 ? hotkeyIndex + 1 : undefined}
                    action={
                      ready ? (
                        <div className={styles.readyActions}>
                          <Button block onClick={() => serve(ticket)}>
                            Выдано
                          </Button>
                          <Button
                            block
                            variant="secondary"
                            icon={<UndoIcon size={16} />}
                            onClick={() => move(ticket, 'cooking')}
                          >
                            Вернуть
                          </Button>
                        </div>
                      ) : (
                        <Button
                          block
                          icon={ticket.status === 'cooking' ? <CheckDoubleIcon size={16} /> : undefined}
                          onClick={() => move(ticket, ticket.status === 'queued' ? 'cooking' : 'ready')}
                        >
                          {ticket.status === 'queued' ? 'В работу' : 'Готово'}
                        </Button>
                      )
                    }
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
