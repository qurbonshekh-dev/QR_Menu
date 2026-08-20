import { useNavigate, useParams } from 'react-router-dom';
import { Button, CheckDoubleIcon, ts } from '@food/ui';
import styles from './SentPage.module.css';

/** «Заказ принят» — экран из ТЗ. Номер заказа тот же, что видит кухня и гость:
 *  по нему официант ищет тикет, если что-то пошло не так. */
export function SentPage() {
  const { number = '' } = useParams();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <span className={styles.icon} aria-hidden="true">
        <CheckDoubleIcon size={32} />
      </span>
      <h1 className={[styles.title, ts('heading-6/bold')].join(' ')}>Заказ №{number} на кухне</h1>
      <p className={[styles.text, ts('body-m/regular')].join(' ')}>
        Тикет уже на доске поваров. Когда блюда будут готовы, стол сам загорится «Ждут подачу».
      </p>
      <Button block onClick={() => navigate('/')}>
        Вернуться в зал
      </Button>
    </div>
  );
}
