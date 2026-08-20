import type { ReactNode } from 'react';
import { ts } from '../../../tokens/typography';
import styles from './FormRow.module.css';

export interface FormRowProps {
  label: ReactNode;
  /** Правый слот: Toggle, Radio, цена, шеврон. */
  action?: ReactNode;
  /** Вся строка кликабельна (выбор способа оплаты и т.п.). */
  onClick?: () => void;
}

/** Figma: строка списка внутри `Select` — белая плашка, radius 16, padding 12. */
export function FormRow({ label, action, onClick }: FormRowProps) {
  const content = (
    <>
      {/* Body M — строка-переключатель читается наравне с текстом экрана;
          прежний action/semibold-s (11px) был мельче всего остального. */}
      <span className={ts('body-m/regular')}>{label}</span>
      {action}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={[styles.row, styles.clickable].join(' ')} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={styles.row}>{content}</div>;
}
