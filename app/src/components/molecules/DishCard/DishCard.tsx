import { Badge } from '../../atoms/Badge';
import { Counter } from '../../atoms/Counter';
import { PlusIcon, StarIcon } from '../../atoms/Icon';
import { formatPrice } from '../../../data/format';
import { ts } from '../../../tokens/typography';
import styles from './DishCard.module.css';

export type DishCardVariant = 'grid' | 'row';

export interface DishCardProps {
  title: string;
  price: number;
  /** Подпись под названием: «20 ккал | 590 гр». */
  meta?: string;
  image: string;
  rating?: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  /** Клик по карточке — переход на страницу блюда. */
  onOpen?: () => void;
  /** Mirrors the Figma "Variant" property: Grid (витрина) / Row (строка корзины). */
  variant?: DishCardVariant;
}

export function DishCard({
  title,
  price,
  meta,
  image,
  rating,
  quantity,
  onQuantityChange,
  onOpen,
  variant = 'grid',
}: DishCardProps) {
  const media = (
    <div className={styles.media}>
      <img className={styles.image} src={image} alt="" loading="lazy" />
      {rating !== undefined && variant === 'grid' ? (
        <span className={styles.rating}>
          <Badge tone="overlay">
            {rating.toFixed(1)}
            <StarIcon size={12} className={styles.star} />
          </Badge>
        </span>
      ) : null}
    </div>
  );

  if (variant === 'row') {
    return (
      <article className={[styles.card, styles.row].join(' ')}>
        {media}
        <div className={styles.rowBody}>
          <div className={styles.rowText} onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined}>
            <p className={[styles.price, ts('action/semibold-s')].join(' ')}>{formatPrice(price)}</p>
            <p className={[styles.title, ts('action/regular')].join(' ')}>{title}</p>
            {meta ? <p className={[styles.meta, ts('body-xxs/medium')].join(' ')}>{meta}</p> : null}
          </div>
          <Counter value={quantity} onChange={onQuantityChange} variant="secondary" size="m" label={`«${title}»`} />
        </div>
      </article>
    );
  }

  return (
    <article className={[styles.card, styles.grid].join(' ')}>
      <button type="button" className={styles.openArea} onClick={onOpen} aria-label={`Открыть «${title}»`}>
        {media}
        <div className={styles.gridText}>
          <p className={[styles.price, ts('action/semibold')].join(' ')}>{formatPrice(price)}</p>
          <p className={[styles.title, ts('body-xs/regular')].join(' ')}>{title}</p>
          {meta ? <p className={[styles.meta, ts('body-xxs/medium')].join(' ')}>{meta}</p> : null}
        </div>
      </button>
      <div className={styles.gridAction}>
        {quantity > 0 ? (
          <Counter value={quantity} onChange={onQuantityChange} variant="main" size="m" label={`«${title}»`} />
        ) : (
          <button
            type="button"
            className={[styles.add, ts('action/semibold-s')].join(' ')}
            onClick={() => onQuantityChange(1)}
          >
            <PlusIcon size={16} />
            В корзину
          </button>
        )}
      </div>
    </article>
  );
}
