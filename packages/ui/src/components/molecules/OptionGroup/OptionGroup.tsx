import { OptionChip, type OptionChipLayout } from '../../atoms/OptionChip';
import styles from './OptionGroup.module.css';

export interface OptionGroupOption {
  id: string;
  /** Верхняя мелкая подпись — используется только при layout="detailed". */
  caption?: string;
  label: string;
}

export interface OptionGroupProps {
  options: OptionGroupOption[];
  value: string;
  onChange: (id: string) => void;
  /** Mirrors the Figma "Layout" property, применяется ко всем чипам группы. */
  layout?: OptionChipLayout;
  'aria-label': string;
}

/**
 * Трек взаимоисключающих опций (размер, тесто и т.п.) — Figma: `OptionGroup`
 * (composed из инстансов `OptionChip`, кол-во опций произвольное, поэтому
 * не зафиксировано как Component Set с вариантами).
 */
export function OptionGroup({ options, value, onChange, layout = 'simple', 'aria-label': ariaLabel }: OptionGroupProps) {
  return (
    <div className={styles.track} role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <OptionChip
          key={option.id}
          layout={layout}
          caption={option.caption}
          label={option.label}
          selected={option.id === value}
          role="radio"
          aria-checked={option.id === value}
          onClick={() => onChange(option.id)}
        />
      ))}
    </div>
  );
}
