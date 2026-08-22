import { AuthProvider, LoginPage, NoAccessPage, useAuth } from '@food/staff';
import { ts } from '@food/ui';
import { StaffPage } from './pages/StaffPage';
import styles from './App.module.css';

/** Панель ресторана: пока в ней один раздел — сотрудники и их учётные записи.
 *  Роутер появится вместе со вторым разделом, как это было у официанта. */
function App() {
  return (
    <AuthProvider>
      <div className={styles.viewport}>
        <Gate />
      </div>
    </AuthProvider>
  );
}

function Gate() {
  const { status, me } = useAuth();

  if (status === 'loading') {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Проверяем доступ…</p>;
  }
  if (status === 'guest') {
    return <LoginPage title="Панель ресторана" text="Вход только для менеджера." />;
  }
  if (status === 'stranger') return <NoAccessPage />;

  // Роль проверяет и edge-функция, но показывать менеджерский экран повару
  // всё равно нельзя: человек будет жать кнопки, которые ответят отказом.
  if (me?.role !== 'manager' && me?.role !== 'admin') return <NotManager />;

  return <StaffPage />;
}

function NotManager() {
  const { me, signOut } = useAuth();
  return (
    <div className={styles.notice}>
      <h1 className={[styles.noticeTitle, ts('heading-6/bold')].join(' ')}>Панель для менеджера</h1>
      <p className={[styles.noticeText, ts('body-m/regular')].join(' ')}>
        {me?.name}, ваша роль не даёт доступа к учётным записям персонала. Рабочее место официанта —
        в приложении зала, повара — на экране кухни.
      </p>
      <button type="button" className={[styles.link, ts('action/semibold')].join(' ')} onClick={() => void signOut()}>
        Выйти
      </button>
    </div>
  );
}

export default App;
