import type { ReactNode } from 'react';
import type { TableStatus } from '@food/domain';
import { tableStatusLabel } from '@food/domain';
import { CheckDoubleIcon, ClockCheckIcon, LoaderIcon, UserCheckIcon } from '../../atoms/Icon';
import { ts } from '../../../tokens/typography';
import styles from './StatusPill.module.css';

export interface StatusPillProps {
  /** Mirrors the Figma "Status" property: Free / Busy / Awaiting / Reserved. */
  status: TableStatus;
  /** Своя подпись вместо словарной («Свободен»). */
  label?: string;
  /** Иконка привязана к статусу — переопределяют только в виде исключения. */
  icon?: ReactNode;
}

/** Иконка у статуса своя и всегда одна и та же: официант читает плашку
 *  боковым зрением, и подмена значка сбивает узнавание. */
const STATUS_ICONS: Record<TableStatus, ReactNode> = {
  free: <CheckDoubleIcon size={16} />,
  busy: <UserCheckIcon size={16} />,
  awaiting: <LoaderIcon size={16} />,
  reserved: <ClockCheckIcon size={16} />,
};

/** Статус стола плашкой. Цвет берётся из статусных токенов, а не задаётся
 *  экраном, — иначе «свободен» позеленеет по-разному в трёх приложениях. */
export function StatusPill({ status, label, icon }: StatusPillProps) {
  return (
    <span className={[styles.pill, styles[status], ts('body-s/medium')].join(' ')}>
      {icon ?? STATUS_ICONS[status]}
      {label ?? tableStatusLabel(status)}
    </span>
  );
}
