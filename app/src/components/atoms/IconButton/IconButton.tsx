import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ts } from '../../../tokens/typography';
import styles from './IconButton.module.css';

export type IconButtonVariant = 'surface' | 'muted' | 'overlay';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Mirrors the Figma "Variant" property: Surface / Muted / Overlay (поверх фото). */
  variant?: IconButtonVariant;
  /** Счётчик в правом верхнем углу — как у иконки корзины в Style Guide. */
  count?: number;
  /** Обязателен: у кнопки нет текстовой подписи. */
  'aria-label': string;
  children: ReactNode;
}

export function IconButton({ variant = 'surface', count, children, className, ...rest }: IconButtonProps) {
  return (
    <button type="button" className={[styles.button, styles[variant], className].filter(Boolean).join(' ')} {...rest}>
      {children}
      {count ? <span className={[styles.count, ts('action/semibold-s')].join(' ')}>{count}</span> : null}
    </button>
  );
}
