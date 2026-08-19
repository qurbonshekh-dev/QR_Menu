import type { ButtonHTMLAttributes } from 'react';
import { ts } from '../../../tokens/typography';
import styles from './OptionChip.module.css';

export type OptionChipLayout = 'detailed' | 'simple';

export interface OptionChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /** Mirrors the Figma "Layout" property: Detailed (подпись + значение, напр. размер) / Simple (одна строка). */
  layout?: OptionChipLayout;
  /** Mirrors the Figma "State" property (Default / Selected). */
  selected?: boolean;
  /** Верхняя мелкая подпись — только для layout="detailed". */
  caption?: string;
  label: string;
}

/**
 * Один пункт группы взаимоисключающих опций (размер, тесто и т.п.) —
 * composed внутри `OptionGroup`, сам по себе не задаёт ширину/трек.
 */
export function OptionChip({ layout = 'simple', selected, caption, label, className, ...rest }: OptionChipProps) {
  return (
    <button
      type="button"
      className={[styles.chip, styles[layout], selected && styles.selected, className].filter(Boolean).join(' ')}
      aria-pressed={selected}
      {...rest}
    >
      {layout === 'detailed' && caption ? (
        <span className={[styles.caption, ts('body-xs/medium')].join(' ')}>{caption}</span>
      ) : null}
      <span className={[styles.label, ts(selected || layout === 'detailed' ? 'body-s/bold' : 'body-s/medium')].join(' ')}>
        {label}
      </span>
    </button>
  );
}
