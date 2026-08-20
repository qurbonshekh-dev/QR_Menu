import { Button, ts } from '@food/ui';
import { formatShift } from '@food/domain';
import { currentShift } from '../data/floorRepository';
import { useAuth } from '@food/staff';
import styles from './ProfilePage.module.css';

const ROLE_LABELS: Record<string, string> = {
  waiter: 'Официант',
  manager: 'Менеджер',
  cook: 'Повар',
};

/** Кабинет пока отвечает на один вопрос — кто вошёл и как выйти. Смены,
 *  статистика, цели и ранги из раздела 1 ТЗ приедут этапом 6. */
export function ProfilePage() {
  const { me, signOut } = useAuth();

  return (
    <section className={styles.page}>
      <h1 className={[styles.title, ts('heading-7/bold')].join(' ')}>Кабинет</h1>

      <div className={styles.card}>
        <span className={[styles.name, ts('heading-9/extrabold')].join(' ')}>{me?.name}</span>
        <span className={[styles.meta, ts('body-s/regular')].join(' ')}>
          {me ? (ROLE_LABELS[me.role] ?? me.role) : ''} · {formatShift(currentShift)}
        </span>
      </div>

      <p className={[styles.text, ts('body-s/regular')].join(' ')}>
        График смен, статистика заказов, цели и ранги появятся здесь следующим этапом.
      </p>

      <Button block variant="secondary" onClick={() => void signOut()}>
        Выйти из смены
      </Button>
    </section>
  );
}
