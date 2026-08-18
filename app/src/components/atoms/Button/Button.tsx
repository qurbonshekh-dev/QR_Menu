import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ts } from '../../../tokens/typography';
import styles from './Button.module.css';

export type ButtonVariant = 'main' | 'secondary' | 'disable';
export type ButtonSize = 'l' | 'm' | 's';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  /** Mirrors the Figma "Variant" property (Main / Secondary / Disable) — see directives/sync_to_figma.md. */
  variant?: ButtonVariant;
  /** Mirrors the Figma "Size" property (L / M / S). */
  size?: ButtonSize;
  icon?: ReactNode;
  /** Растянуть на всю ширину контейнера. */
  block?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'main',
  size = 'l',
  icon,
  block,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || variant === 'disable';
  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[variant],
        styles[size],
        block && styles.block,
        ts('action/semibold'),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...rest}
    >
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      {children}
    </button>
  );
}
