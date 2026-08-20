import type { ReactNode } from 'react';
import { ts } from '../../../tokens/typography';
import styles from './Badge.module.css';

export type BadgeTone = 'overlay' | 'brand' | 'muted';

export interface BadgeProps {
  /** Mirrors the Figma "Tone" property: Overlay (поверх фото) / Brand / Muted. */
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'overlay', children }: BadgeProps) {
  return <span className={[styles.badge, styles[tone], ts('body-xs/medium')].join(' ')}>{children}</span>;
}
