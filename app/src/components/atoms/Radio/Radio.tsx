import type { InputHTMLAttributes } from 'react';
import styles from './Radio.module.css';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/** Figma: `Checkbox` (16×16, круглый — по факту radio: точка внутри brand-кольца). */
export function Radio({ label, className, ...rest }: RadioProps) {
  return (
    <label className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <input type="radio" className={styles.input} {...rest} />
      <span className={styles.mark} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </label>
  );
}
