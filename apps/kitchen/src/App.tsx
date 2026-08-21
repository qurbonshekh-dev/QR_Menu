import { AuthProvider, LoginPage, NoAccessPage, useAuth } from '@food/staff';
import { ts } from '@food/ui';
import { KitchenPage } from './pages/KitchenPage';
import styles from './App.module.css';

/** Кухонный экран висит на стене, но данные за ним — те же заказы ресторана.
 *  Поэтому вход один раз при запуске планшета, дальше сессия живёт сама. */
function App() {
  return (
    <AuthProvider>
      <div className={styles.viewport}>
        <Station />
      </div>
    </AuthProvider>
  );
}

function Station() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <p className={[styles.state, ts('body-l/regular')].join(' ')}>Открываем смену…</p>;
  }
  if (status === 'guest') {
    return <LoginPage title="Вход на кухню" text="Логин и пароль выдаёт менеджер ресторана." />;
  }
  if (status === 'stranger') return <NoAccessPage />;

  return <KitchenPage />;
}

export default App;
