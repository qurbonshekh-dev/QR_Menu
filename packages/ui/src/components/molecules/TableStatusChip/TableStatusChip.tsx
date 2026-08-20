import type { TableStatus } from '@food/domain';
import { ts } from '../../../tokens/typography';
import styles from './TableStatusChip.module.css';

export interface TableStatusChipProps {
  /** Номер стола — то, что написано на QR-наклейке. */
  number: string;
  /** Mirrors the Figma "Status" property: Free / Busy / Attention / Reserved. */
  status: TableStatus;
  /** Mirrors the Figma "State" property — выбранный стол залит цветом статуса. */
  selected?: boolean;
  /** Счётчик событий, требующих внимания. 0 — бейдж не рисуем. */
  alerts?: number;
  onClick?: () => void;
}

/**
 * Стол в ленте зала: номер в кольце цвета статуса. Выбранный залит целиком —
 * официант ведёт пальцем по ленте, и заливка отвечает «ты здесь» быстрее рамки.
 */
export function TableStatusChip({ number, status, selected, alerts = 0, onClick }: TableStatusChipProps) {
  return (
    <button
      type="button"
      className={[styles.chip, styles[status], selected && styles.selected].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Стол ${number}`}
    >
      <span className={[styles.caption, ts('body-xs/regular')].join(' ')}>Стол</span>
      <span className={styles.ringWrap}>
        <span className={styles.ring}>
          <span className={[styles.number, ts('heading-9/extrabold')].join(' ')}>{number}</span>
        </span>
        {alerts > 0 ? <span className={[styles.badge, ts('body-xxs/bold')].join(' ')}>{alerts}</span> : null}
      </span>
    </button>
  );
}
