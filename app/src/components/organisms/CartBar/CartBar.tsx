import { Button } from '../../atoms/Button';
import { ts } from '../../../tokens/typography';
import styles from './CartBar.module.css';

export interface CartBarProps {
  /** Подпись слева, например «3 позиции». */
  summary: string;
  total: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}

/** Прилипший к низу экрана блок «итог + действие» — используется в меню и корзине. */
export function CartBar({ summary, total, actionLabel, onAction, disabled }: CartBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.info}>
        <span className={[styles.summary, ts('body-xs/medium')].join(' ')}>{summary}</span>
        <span className={[styles.total, ts('heading-8/bold')].join(' ')}>{total}</span>
      </div>
      <Button size="l" onClick={onAction} disabled={disabled} variant={disabled ? 'disable' : 'main'}>
        {actionLabel}
      </Button>
    </div>
  );
}
