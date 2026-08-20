import type { ReactNode } from 'react';
import { TableIcon } from '../../atoms/Icon';
import { ts } from '../../../tokens/typography';
import styles from './TableCard.module.css';

export interface TableCardProps {
  /** Номер стола из QR-ссылки — см. state/TableSessionContext. */
  tableNumber: string;
  /** Имя официанта; аватар собирается из первой буквы — фото в моке нет. */
  waiterName: string;
  waiterInitial: string;
  /** Правый верхний слот — обычно IconButton с карандашом. */
  action?: ReactNode;
}

export function TableCard({ tableNumber, waiterName, waiterInitial, action }: TableCardProps) {
  return (
    <section className={styles.card} aria-label={`Стол ${tableNumber}`}>
      <div className={styles.head}>
        <span className={[styles.label, ts('body-s/regular')].join(' ')}>Ваш стол</span>
        {action}
      </div>

      <p className={styles.number}>
        <span className={ts('heading-5/bold')}>{tableNumber}</span>
        <TableIcon size={24} className={styles.tableIcon} />
      </p>

      <div className={styles.waiter}>
        <span className={[styles.avatar, ts('action/semibold')].join(' ')} aria-hidden="true">
          {waiterInitial}
        </span>
        <span className={styles.waiterText}>
          <span className={[styles.label, ts('body-xs/regular')].join(' ')}>Ваш официант</span>
          <span className={[styles.waiterName, ts('body-m/bold')].join(' ')}>{waiterName}</span>
        </span>
      </div>
    </section>
  );
}
