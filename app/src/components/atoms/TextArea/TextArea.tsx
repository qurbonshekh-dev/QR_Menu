import { useId, type TextareaHTMLAttributes } from 'react';
import styles from './TextArea.module.css';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  /** Mirrors the Figma "Error" state — renders a red border + helper text. */
  error?: string;
}

/** Многострочный ввод — комментарий кухне. Тот же плавающий лейбл, что
 *  у `TextInput`, но с фиксированной высотой в несколько строк. */
export function TextArea({ label, error, disabled, className, rows = 3, ...rest }: TextAreaProps) {
  const id = useId();
  const controlClass = [styles.control, error && styles.error, disabled && styles.disabled]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <div className={controlClass}>
        <textarea
          id={id}
          className={styles.input}
          placeholder=" "
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          {...rest}
        />
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      </div>
      {error ? <p className={styles.helper}>{error}</p> : null}
    </div>
  );
}
