import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
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
import { createPortal } from 'react-dom';
import { subscribeTickets } from '../data/ticketsRepository';
import styles from './KitchenPage.module.css';

/** Колонки доски — те же три состояния, что у тикета в домене. */
const COLUMNS: TicketStatus[] = ['queued', 'cooking', 'ready'];

/** Правка статуса поверх ленты: сама лента статусы не двигает — это делает повар. */
interface Move {
  status: TicketStatus;
  readyAt?: string;
}

/** Тащим на pointer-событиях, а не на HTML5 drag-and-drop: последний мышиный,
 *  на планшете его просто нет. Порог в 8 px и условие |dx| > |dy| отделяют
 *  перетаскивание от вертикального скролла колонки. */
interface Drag {
  id: string;
  from: TicketStatus;
  dx: number;
  dy: number;
  active: boolean;
  over: TicketStatus | null;
  /** Где карточка лежала в момент захвата: тащим копию поверх страницы, потому
   *  что колонка скроллится и обрезала бы оригинал на своей границе. */
  rect: { left: number; top: number; width: number };
}

const DRAG_THRESHOLD = 8;

function columnAt(x: number, y: number): TicketStatus | null {
  for (const element of document.elementsFromPoint(x, y)) {
    const status = element.getAttribute?.('data-status');
    if (status) return status as TicketStatus;
  }
  return null;
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

  const [drag, setDrag] = useState<Drag | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const onPointerDown = (ticket: KitchenTicket) => (event: ReactPointerEvent<HTMLDivElement>) => {
    // Кнопки внутри карточки остаются кнопками — иначе «Готово» превратится
    // в микроперетаскивание и перестанет нажиматься.
    if ((event.target as HTMLElement).closest('button')) return;
    const box = event.currentTarget.getBoundingClientRect();
    dragStart.current = { x: event.clientX, y: event.clientY };
    // Захват указателя — удобство (события продолжают идти, если палец ушёл
    // с карточки), а не условие работы. Он падает, когда указателя с таким id
    // уже нет, и без try обрывал бы весь жест.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* указатель уже отпущен — тащим без захвата */
    }
    setDrag({
      id: ticket.id,
      from: ticket.status,
      dx: 0,
      dy: 0,
      active: false,
      over: null,
      rect: { left: box.left, top: box.top, width: box.width },
    });
  };

  const onPointerMove = (ticket: KitchenTicket) => (event: ReactPointerEvent<HTMLDivElement>) => {
    setDrag((current) => {
      if (!current || current.id !== ticket.id) return current;
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      const active = current.active || (Math.abs(dx) > DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy));
      return {
        ...current,
        dx,
        dy,
        active,
        over: active ? columnAt(event.clientX, event.clientY) : null,
      };
    });
  };

  const onPointerUp = (ticket: KitchenTicket) => (event: ReactPointerEvent<HTMLDivElement>) => {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* захвата не было — отпускать нечего */
    }
    setDrag((current) => {
      if (current?.active && current.over && current.over !== current.from) {
        move(ticket, current.over);
      }
      return null;
    });
  };

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
          <section
            key={column.status}
            data-status={column.status}
            className={[styles.column, drag?.active && drag.over === column.status && drag.from !== column.status && styles.over]
              .filter(Boolean)
              .join(' ')}
            aria-label={ticketStatusLabel(column.status)}
          >
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
                const dragging = drag?.active && drag.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    className={[styles.draggable, dragging && styles.placeholder].filter(Boolean).join(' ')}
                    onPointerDown={onPointerDown(ticket)}
                    onPointerMove={onPointerMove(ticket)}
                    onPointerUp={onPointerUp(ticket)}
                    onPointerCancel={() => setDrag(null)}
                  >
                  <TicketCard
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
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Копия тикета под пальцем. Живёт в портале: внутри колонки её резал
          overflow, а слой поверх страницы ничем не ограничен. */}
      {drag?.active
        ? createPortal(
            <div
              className={styles.floating}
              style={{ left: drag.rect.left + drag.dx, top: drag.rect.top + drag.dy, width: drag.rect.width }}
            >
              {(() => {
                const ticket = tickets.find((item) => item.id === drag.id);
                if (!ticket) return null;
                const ready = ticket.status === 'ready';
                const since = ready ? (ticket.readyAt ?? ticket.placedAt) : ticket.placedAt;
                return (
                  <TicketCard
                    ticket={ticket}
                    age={ticketAge(since, now, ready ? READY_AGE_THRESHOLDS : undefined)}
                    elapsed={formatElapsed(since, now)}
                    action={null}
                  />
                );
              })()}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
