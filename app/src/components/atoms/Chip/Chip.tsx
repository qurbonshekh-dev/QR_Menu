import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ts } from '../../../tokens/typography';
import styles from './Chip.module.css';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Mirrors the Figma "State" property (Default / Selected / Disabled — через нативный disabled). */
  selected?: boolean;
  children: ReactNode;
}

export function Chip({ selected, children, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={[styles.chip, selected && styles.selected, ts('body-s/medium'), className]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={selected}
      {...rest}
    >
      {children}
    </button>
  );
}
