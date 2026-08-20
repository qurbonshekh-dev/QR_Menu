import type { ReactNode } from 'react';
import type { TableStatus } from '@food/domain';
import { tableStatusLabel } from '@food/domain';
import { ts } from '../../../tokens/typography';
import styles from './StatusPill.module.css';

export interface StatusPillProps {
  /** Mirrors the Figma "Status" property: Free / Busy / Attention / Reserved. */
  status: TableStatus;
  /** Своя подпись вместо словарной («Свободен»). */
  label?: string;
  icon?: ReactNode;
}

/** Статус стола плашкой. Цвет берётся из статусных токенов, а не задаётся
 *  экраном, — иначе «свободен» позеленеет по-разному в трёх приложениях. */
export function StatusPill({ status, label, icon }: StatusPillProps) {
  return (
    <span className={[styles.pill, styles[status], ts('body-s/medium')].join(' ')}>
      {icon}
      {label ?? tableStatusLabel(status)}
    </span>
  );
}
