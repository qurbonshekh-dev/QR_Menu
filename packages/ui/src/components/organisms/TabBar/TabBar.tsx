import type { ReactNode } from 'react';
import { ts } from '../../../tokens/typography';
import styles from './TabBar.module.css';

export interface TabBarItem<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  /** Счётчик на иконке: непрочитанные сообщения, готовые к выдаче заказы. */
  badge?: number;
}

export interface TabBarProps<T extends string> {
  items: TabBarItem<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
}

/** Нижняя навигация приложений персонала: смена рабочего места одним пальцем,
 *  без возврата в меню. Гостевое приложение её не использует — там линейный путь. */
export function TabBar<T extends string>({ items, value, onChange, 'aria-label': ariaLabel }: TabBarProps<T>) {
  return (
    <nav className={styles.bar} aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            className={[styles.tab, active && styles.active].filter(Boolean).join(' ')}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(item.value)}
          >
            <span className={styles.icon}>
              {item.icon}
              {item.badge ? <span className={[styles.badge, ts('body-xxs/bold')].join(' ')}>{item.badge}</span> : null}
            </span>
            <span className={[styles.label, ts('body-xxs/medium')].join(' ')}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
