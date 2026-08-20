import { ts } from '../../../tokens/typography';
import styles from './SegmentedControl.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
}

/** Figma: `Tabs` — контейнер bg default, активный сегмент — белая плашка. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div className={styles.control} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={[styles.segment, selected && styles.selected, ts('action/semibold')]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
