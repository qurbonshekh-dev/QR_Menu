import type { ReactNode } from 'react';
import { ChevronLeftIcon } from '../../atoms/Icon';
import { IconButton } from '../../atoms/IconButton';
import { ts } from '../../../tokens/typography';
import styles from './AppHeader.module.css';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Правый слот — обычно иконка корзины со счётчиком. */
  action?: ReactNode;
}

export function AppHeader({ title, subtitle, onBack, action }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      {onBack ? (
        <IconButton aria-label="Назад" onClick={onBack}>
          <ChevronLeftIcon size={20} />
        </IconButton>
      ) : null}
      <div className={styles.titles}>
        <h1 className={[styles.title, ts('heading-8/bold')].join(' ')}>{title}</h1>
        {subtitle ? <p className={[styles.subtitle, ts('body-s/regular')].join(' ')}>{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
