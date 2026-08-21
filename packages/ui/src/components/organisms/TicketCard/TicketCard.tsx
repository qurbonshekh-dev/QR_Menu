import type { ReactNode } from 'react';
import type { KitchenTicket } from '@food/domain';
import { serveLabel } from '@food/domain';
import { ts } from '../../../tokens/typography';
import styles from './TicketCard.module.css';

export interface TicketCardProps {
  ticket: KitchenTicket;
  /** Время на экране, «12:04». Считает экран, а не карточка: тикетов много,
   *  таймер должен быть один на всех. */
  elapsed: string;
  /** Номер для клавиатурного бампа — цифра на шапке. */
  hotkey?: number;
  /** Тикет просрочен: цвет шапки занят стадией, поэтому возраст показываем
   *  тёмной плашкой таймера — её видно и на красном, и на жёлтом, и на зелёном. */
  overdue?: boolean;
  action: ReactNode;
}

const SERVING_LABELS = {
  ready: 'По мере готовности',
  together: 'Подать всё вместе',
} as const;

/**
 * Тикет на кухонном экране. Читается с полутора-трёх метров, поэтому крупный
 * шрифт и никакого мелкого мяса: только то, что повар делает руками.
 */
export function TicketCard({ ticket, elapsed, hotkey, overdue, action }: TicketCardProps) {
  return (
    <article className={[styles.card, styles[ticket.status]].join(' ')}>
      <header className={styles.head}>
        <span className={styles.headLeft}>
          {hotkey ? <span className={[styles.hotkey, ts('body-s/bold')].join(' ')}>{hotkey}</span> : null}
          <span className={[styles.table, ts('heading-8/bold')].join(' ')}>Стол {ticket.table}</span>
        </span>
        <span className={[styles.elapsed, overdue && styles.overdue, ts('heading-8/bold')].filter(Boolean).join(' ')}>
          {elapsed}
        </span>
      </header>

      <p className={[styles.serving, ts('body-s/medium')].join(' ')}>
        №{ticket.id} · {SERVING_LABELS[ticket.servingMode]}
      </p>

      <ul className={styles.items}>
        {ticket.items.map((item) => (
          <li key={item.id} className={styles.item}>
            <span className={[styles.quantity, ts('body-l/bold')].join(' ')}>{item.quantity}</span>
            <span className={styles.itemText}>
              <span className={[styles.title, ts('body-l/medium')].join(' ')}>{item.title}</span>
              {item.options ? (
                <span className={[styles.options, ts('body-s/regular')].join(' ')}>{item.options}</span>
              ) : null}
              {item.modifiers ? (
                <span className={[styles.itemComment, ts('body-s/bold')].join(' ')}>{item.modifiers}</span>
              ) : null}
              {item.comment ? (
                <span className={[styles.itemComment, ts('body-s/bold')].join(' ')}>{item.comment}</span>
              ) : null}
              {item.serveAfterMinutes !== undefined ? (
                <span className={[styles.options, ts('body-s/regular')].join(' ')}>
                  {serveLabel(item.serveAfterMinutes)}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      {ticket.comment ? (
        <p className={[styles.comment, ts('body-s/bold')].join(' ')}>{ticket.comment}</p>
      ) : null}

      <div className={styles.action}>{action}</div>
    </article>
  );
}
