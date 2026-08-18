import type { InputHTMLAttributes } from 'react';
import styles from './Toggle.module.css';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/** Figma: `Toggle` (44×24, ручка 20px, включённый — brand.main). */
export function Toggle({ label, className, ...rest }: ToggleProps) {
  return (
    <label className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      <input type="checkbox" className={styles.input} {...rest} />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </label>
  );
}
