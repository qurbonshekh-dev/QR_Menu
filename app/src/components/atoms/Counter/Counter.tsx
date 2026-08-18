import { MinusIcon, PlusIcon } from '../Icon';
import { ts } from '../../../tokens/typography';
import styles from './Counter.module.css';

export type CounterVariant = 'main' | 'secondary';
export type CounterSize = 'm' | 's';

export interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  /** Mirrors the Figma "Variant" property: Main (brand pill) / Secondary (в строке корзины). */
  variant?: CounterVariant;
  /** Mirrors the Figma "Size" property: M (32px, карточка) / S (28px, компактная карточка). */
  size?: CounterSize;
  min?: number;
  max?: number;
  label?: string;
}

export function Counter({
  value,
  onChange,
  variant = 'main',
  size = 'm',
  min = 0,
  max = 99,
  label = 'количество',
}: CounterProps) {
  return (
    <div className={[styles.counter, styles[variant], styles[size]].join(' ')}>
      <button
        type="button"
        className={styles.step}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Уменьшить ${label}`}
      >
        <MinusIcon size={16} />
      </button>
      <span className={[styles.value, ts(size === 'm' ? 'action/semibold-l' : 'action/semibold')].join(' ')}>
        {value}
      </span>
      <button
        type="button"
        className={styles.step}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Увеличить ${label}`}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
