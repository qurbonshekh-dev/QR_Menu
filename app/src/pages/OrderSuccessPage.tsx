import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, CheckIcon, } from '../components';
import { formatPrice } from '../data/format';
import { ts } from '../tokens/typography';
import styles from './OrderSuccessPage.module.css';

interface OrderState {
  total?: number;
  callBack?: boolean;
}

export function OrderSuccessPage() {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as OrderState;

  return (
    <div className={styles.page}>
      <div className={styles.icon}>
        <CheckIcon size={32} />
      </div>
      <h1 className={[styles.title, ts('heading-7/bold')].join(' ')}>Заказ №{orderId} принят</h1>
      <p className={[styles.text, ts('body-m/regular')].join(' ')}>
        {state.callBack
          ? 'Мы перезвоним для подтверждения в течение пары минут.'
          : 'Повар уже приступил — статус придёт в SMS.'}
      </p>
      {state.total ? (
        <p className={[styles.total, ts('heading-8/bold')].join(' ')}>{formatPrice(state.total)}</p>
      ) : null}
      <Button onClick={() => navigate('/')}>Вернуться в меню</Button>
    </div>
  );
}
