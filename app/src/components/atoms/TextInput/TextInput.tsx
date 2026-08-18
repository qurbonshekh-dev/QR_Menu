import { useId, type InputHTMLAttributes } from 'react';
import styles from './TextInput.module.css';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Mirrors the Figma "Error" state — renders a red border + helper text. */
  error?: string;
}

export function TextInput({ label, error, disabled, className, ...rest }: TextInputProps) {
  const id = useId();
  const controlClass = [styles.control, error && styles.error, disabled && styles.disabled]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <div className={controlClass}>
        <input
          id={id}
          className={styles.input}
          placeholder=" "
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
