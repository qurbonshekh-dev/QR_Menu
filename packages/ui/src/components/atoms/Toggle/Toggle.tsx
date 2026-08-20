import type { ElementType, InputHTMLAttributes } from 'react';
import styles from './Toggle.module.css';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/** Figma: `Toggle` (44×24, ручка 20px, включённый — brand.main). */
export function Toggle({ label, className, ...rest }: ToggleProps) {
  // Пустая подпись значит, что текст даёт родитель (FormRow) и он же <label> —
  // вкладывать label в label нельзя, поэтому обёртка становится span.
  const Wrap: ElementType = label ? 'label' : 'span';
  return (
    <Wrap className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{label}</span>
      <input type="checkbox" className={styles.input} {...rest} />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </Wrap>
  );
}
