import { useId, type InputHTMLAttributes } from 'react';
import { SearchIcon } from '../../atoms/Icon';
import { ts } from '../../../tokens/typography';
import styles from './SearchField.module.css';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  /** Видимая подпись для скринридера — на экране её заменяет placeholder. */
  label: string;
}

/** Figma: `SearchField` — поле поиска по меню, 44px, иконка слева. */
export function SearchField({ label, className, ...rest }: SearchFieldProps) {
  const id = useId();
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <SearchIcon size={20} className={styles.icon} />
      <label htmlFor={id} className={styles.srOnly}>
        {label}
      </label>
      <input id={id} type="search" className={[styles.input, ts('body-s/medium')].join(' ')} {...rest} />
    </div>
  );
}
