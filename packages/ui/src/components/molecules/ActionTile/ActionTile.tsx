import type { ReactNode } from 'react';
import { ts } from '../../../tokens/typography';
import styles from './ActionTile.module.css';

export type ActionTileVariant = 'tile' | 'wide';

export interface ActionTileProps {
  title: string;
  /** Вторая строка: подсказка («Посмотреть меню») или состояние («Вы ещё не заказывали»). */
  caption?: string;
  icon: ReactNode;
  /** Mirrors the Figma "Variant" property: Tile (половина сетки) / Wide (во всю ширину). */
  variant?: ActionTileVariant;
  /** Заглушка будущей функции — плитка видна, но не кликабельна. */
  disabled?: boolean;
  /** Правый слот под заголовком — обычно <Badge>скоро</Badge>. */
  badge?: ReactNode;
  onClick?: () => void;
}

export function ActionTile({
  title,
  caption,
  icon,
  variant = 'tile',
  disabled,
  badge,
  onClick,
}: ActionTileProps) {
  return (
    <button
      type="button"
      className={[styles.root, styles[variant], disabled && styles.disabled].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      <span className={styles.head}>
        <span className={[styles.title, ts('heading-9/extrabold')].join(' ')}>{title}</span>
        <span className={styles.trailing}>
          {badge}
          <span className={styles.icon}>{icon}</span>
        </span>
      </span>
      {caption ? <span className={[styles.caption, ts('body-s/regular')].join(' ')}>{caption}</span> : null}
    </button>
  );
}
