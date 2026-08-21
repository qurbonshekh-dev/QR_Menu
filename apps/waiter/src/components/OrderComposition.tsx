import {
  formatPrice,
  groupItemsByGuest,
  serveLabel,
  serviceItemStatusLabel,
  serviceItemTotal,
  type ServiceItem,
} from '@food/domain';
import { Button, ts } from '@food/ui';
import styles from './OrderComposition.module.css';

export interface OrderCompositionProps {
  items: ServiceItem[];
  /** Сколько гостей делят счёт: 1 — списком, больше — по гостям. */
  guests: number;
  /** Официант отдал эту тарелку. Нет обработчика — строки только читаются. */
  onServe?: (item: ServiceItem) => void;
}

/**
 * Состав заказа стола, разложенный по гостям. Официант держит в руках тарелки,
 * а не заказ целиком, поэтому строка отвечает на два вопроса сразу: чьё это
 * блюдо и нужно ли его нести прямо сейчас.
 */
export function OrderComposition({ items, guests, onServe }: OrderCompositionProps) {
  const groups = groupItemsByGuest(items, guests);
  if (!groups.length) return null;

  // Номер заказа в подписи нужен, только когда заказов несколько: у одного он
  // ничего не различает и превращается в шум.
  const showOrderNumbers = new Set(items.map((item) => item.orderNumber)).size > 1;

  return (
    <section className={styles.block}>
      <h3 className={[styles.title, ts('body-m/medium')].join(' ')}>Состав заказа</h3>

      {groups.map((group) => (
        <div key={group.guest ?? 'shared'} className={styles.group}>
          <div className={styles.groupHead}>
            <span className={[styles.groupTitle, ts('body-s/regular')].join(' ')}>{group.title}</span>
            <span className={[styles.groupTotal, ts('body-s/bold')].join(' ')}>{formatPrice(group.total)}</span>
          </div>

          <ul className={styles.items}>
            {group.items.map((item, index) => {
              const caption = [
                showOrderNumbers ? `Заказ №${item.orderNumber}` : null,
                item.options,
                item.modifiers,
                item.comment,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <li
                  key={item.id}
                  className={[styles.row, item.status === 'to-serve' ? styles.urgent : ''].join(' ')}
                >
                  <span className={[styles.index, ts('body-s/medium')].join(' ')} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles.body}>
                    <span className={[styles.name, ts('body-m/medium')].join(' ')}>
                      {item.title} × {item.quantity}
                    </span>
                    {caption ? (
                      <span className={[styles.caption, ts('body-xs/regular')].join(' ')}>{caption}</span>
                    ) : null}
                    {/* Время подачи — обещание гостю, а не деталь: держим его
                        отдельной строкой, а не в общей подписи. */}
                    <span className={[styles.serve, ts('body-xs/regular')].join(' ')}>
                      {serveLabel(item.serveAfterMinutes)}
                    </span>
                  </span>
                  <span className={styles.tail}>
                    {/* Готовую тарелку официант закрывает по одной: одну донёс —
                        одну отметил, а не «весь стол разом». */}
                    {item.status === 'to-serve' && onServe ? (
                      <Button size="s" onClick={() => onServe(item)}>
                        Подал
                      </Button>
                    ) : (
                      <span className={[styles.status, styles[item.status], ts('body-s/medium')].join(' ')}>
                        {serviceItemStatusLabel(item.status)}
                      </span>
                    )}
                    <span className={[styles.price, ts('body-xs/regular')].join(' ')}>
                      {formatPrice(serviceItemTotal(item))}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
