import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, CheckDoubleIcon, TicketCard, UndoIcon, ts } from '@food/ui';
import {
  allDayCount,
  formatElapsed,
  ticketAge,
  type KitchenTicket,
} from '@food/domain';
import { subscribeTickets } from '../data/ticketsRepository';
import styles from './KitchenPage.module.css';

/** Сколько снятых тикетов держим под рукой для возврата. Ошибочный бамп —
 *  ежедневная история, поэтому recall есть в каждом KDS. */
const RECALL_DEPTH = 4;

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
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [bumped, setBumped] = useState<KitchenTicket[]>([]);
  const now = useNow();

  useEffect(() => subscribeTickets(setTickets), []);

  const queue = useMemo(
    () =>
      tickets
        .filter((ticket) => !bumped.some((done) => done.id === ticket.id))
        .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()),
    [tickets, bumped],
  );

  const bump = useCallback((ticket: KitchenTicket) => {
    setBumped((current) => [ticket, ...current].slice(0, RECALL_DEPTH));
  }, []);

  const recall = useCallback((ticket: KitchenTicket) => {
    setBumped((current) => current.filter((done) => done.id !== ticket.id));
  }, []);

  // Клавиши 1–9 снимают тикет по позиции: у повара мокрые руки, а физического
  // bump-бара у нас нет.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const index = Number(event.key);
      if (!Number.isInteger(index) || index < 1 || index > 9) return;
      const ticket = queue[index - 1];
      if (ticket) bump(ticket);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [queue, bump]);

  const allDay = allDayCount(queue);
  const oldest = queue[0];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <span className={[styles.statValue, ts('heading-5/bold')].join(' ')}>{queue.length}</span>
            <span className={[styles.statLabel, ts('body-s/regular')].join(' ')}>в работе</span>
          </span>
          <span className={styles.stat}>
            <span className={[styles.statValue, ts('heading-5/bold')].join(' ')}>
              {oldest ? formatElapsed(oldest.placedAt, now) : '—'}
            </span>
            <span className={[styles.statLabel, ts('body-s/regular')].join(' ')}>самый долгий</span>
          </span>
        </div>

        {/* All-day: сколько одинаковых позиций во всей очереди — повар готовит партией. */}
        <div className={styles.allDay} aria-label="Всего в очереди">
          {allDay.map((entry) => (
            <span key={entry.title} className={[styles.allDayItem, ts('body-m/medium')].join(' ')}>
              {entry.title}
              <span className={[styles.allDayCount, ts('body-m/bold')].join(' ')}>{entry.quantity}</span>
            </span>
          ))}
        </div>
      </header>

      {queue.length === 0 ? (
        <p className={[styles.empty, ts('heading-7/bold')].join(' ')}>Очередь пуста</p>
      ) : (
        <div className={[styles.grid, bumped.length > 0 && styles.withRecall].filter(Boolean).join(' ')}>
          {queue.map((ticket, index) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              age={ticketAge(ticket.placedAt, now)}
              elapsed={formatElapsed(ticket.placedAt, now)}
              hotkey={index < 9 ? index + 1 : undefined}
              action={
                <Button block icon={<CheckDoubleIcon size={16} />} onClick={() => bump(ticket)}>
                  Готово
                </Button>
              }
            />
          ))}
        </div>
      )}

      {bumped.length > 0 ? (
        <footer className={styles.recall}>
          <span className={[styles.recallLabel, ts('body-s/regular')].join(' ')}>Только что сняли</span>
          {bumped.map((ticket) => (
            <Button key={ticket.id} variant="secondary" size="m" icon={<UndoIcon size={16} />} onClick={() => recall(ticket)}>
              Стол {ticket.table} · №{ticket.id}
            </Button>
          ))}
        </footer>
      ) : null}
    </div>
  );
}
