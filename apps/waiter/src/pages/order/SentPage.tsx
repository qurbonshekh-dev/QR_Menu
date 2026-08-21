import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, CheckDoubleIcon, ts } from '@food/ui';
import { formatPrice, pluralItems } from '@food/domain';
import styles from './SentPage.module.css';

interface SentState {
  total?: number;
  items?: { title: string; quantity: number }[];
  minutes?: number;
}

/** «Заказ принят» — экран из ТЗ: номер заказа, ориентировочное время готовки
 *  и сводка, чтобы официант проговорил её гостю, не возвращаясь в черновик. */
export function SentPage() {
  const { number = '' } = useParams();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as SentState;
  const count = (state.items ?? []).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={styles.page}>
      <span className={styles.icon} aria-hidden="true">
        <CheckDoubleIcon size={32} />
      </span>
      <h1 className={[styles.title, ts('heading-6/bold')].join(' ')}>Заказ №{number} на кухне</h1>

      {state.minutes ? (
        <p className={[styles.text, ts('body-m/regular')].join(' ')}>
          Ориентировочно {state.minutes} минут. Когда блюда будут готовы, стол загорится «Ждут подачу».
        </p>
      ) : (
        <p className={[styles.text, ts('body-m/regular')].join(' ')}>
          Тикет уже на доске поваров. Когда блюда будут готовы, стол загорится «Ждут подачу».
        </p>
      )}

      {state.items?.length ? (
        <div className={styles.summary}>
          <div className={styles.summaryHead}>
            <span className={[styles.summaryTitle, ts('body-s/regular')].join(' ')}>
              {count} {pluralItems(count)}
            </span>
            <span className={[styles.summaryTotal, ts('body-s/bold')].join(' ')}>
              {formatPrice(state.total ?? 0)}
            </span>
          </div>
          {state.items.map((item) => (
            <div key={item.title} className={styles.summaryRow}>
              <span className={ts('body-m/regular')}>{item.title}</span>
              <span className={[styles.summaryQuantity, ts('body-m/medium')].join(' ')}>× {item.quantity}</span>
            </div>
          ))}
        </div>
      ) : null}

      <Button block onClick={() => navigate('/')}>
        Вернуться в зал
      </Button>
    </div>
  );
}
