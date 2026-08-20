import type { ElementType, InputHTMLAttributes } from 'react';
import styles from './Radio.module.css';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/** Figma: `Checkbox` (16×16, круглый — по факту radio: точка внутри brand-кольца). */
export function Radio({ label, className, ...rest }: RadioProps) {
  // Пустая подпись значит, что текст даёт родитель (FormRow) и он же <label> —
  // вкладывать label в label нельзя, поэтому обёртка становится span.
  const Wrap: ElementType = label ? 'label' : 'span';
  return (
    <Wrap className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <input type="radio" className={styles.input} {...rest} />
      <span className={styles.mark} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </Wrap>
  );
}
