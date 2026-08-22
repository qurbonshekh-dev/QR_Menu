import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { AuthProvider, LoginPage, NoAccessPage, useAuth } from '@food/staff';
import { canUsePos, formatPrice, STAFF_ROLE_LABELS } from '@food/domain';
import { ts } from '@food/ui';
import { CashShiftProvider } from './state/CashShiftContext';
import { useCashShift } from './state/cashShiftStore';
import { FloorPage } from './pages/FloorPage';
import { CounterPage } from './pages/CounterPage';
import styles from './App.module.css';

/**
 * Касса — стационарный экран в ландшафте: навигация слева колонкой, а не
 * табами внизу. Внизу её держать нельзя — на планшете 1024×768 туда попадает
 * рука, которая лежит на столе рядом с ящиком.
 */
function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Gate />
      </HashRouter>
    </AuthProvider>
  );
}

function Gate() {
  const { status, me } = useAuth();

  if (status === 'loading') {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Проверяем доступ…</p>;
  }
  if (status === 'guest') {
    return <LoginPage title="Касса" text="Логин и пароль выдаёт менеджер ресторана." />;
  }
  if (status === 'stranger') return <NoAccessPage />;
  // Кассу открываем кассиру, менеджеру и администратору: подменить кассира
  // в обед — обычное дело. Официанту и повару тут делать нечего.
  if (!me || !canUsePos(me.role)) return <WrongRole />;

  return (
    <CashShiftProvider cashierId={me.id}>
      <div className={styles.app}>
        {/* Шапка как на кухне: узкая полоса сверху, а не колонка сбоку — на
            планшете 1024×768 ширина дороже высоты, и отдавать 130 px под
            навигацию значит отнять их у карты зала. */}
        <header className={styles.header}>
          <nav className={styles.tabs} aria-label="Разделы кассы">
            <NavLink
              to="/floor"
              className={({ isActive }) => [styles.tab, ts('body-l/medium'), isActive && styles.tabActive].filter(Boolean).join(' ')}
            >
              Зал
            </NavLink>
            <NavLink
              to="/counter"
              className={({ isActive }) => [styles.tab, ts('body-l/medium'), isActive && styles.tabActive].filter(Boolean).join(' ')}
            >
              Стойка
            </NavLink>
          </nav>

          <ShiftStats />

          <div className={styles.who}>
            <span className={[styles.whoName, ts('body-m/medium')].join(' ')}>{me.name}</span>
            <span className={[styles.whoRole, ts('body-xs/regular')].join(' ')}>
              {STAFF_ROLE_LABELS[me.role]}
            </span>
          </div>
          <SignOut />
        </header>

        <main className={styles.screen}>
          <Routes>
            <Route path="/floor" element={<FloorPage />} />
            <Route path="/counter" element={<CounterPage />} />
            <Route path="*" element={<Navigate to="/floor" replace />} />
          </Routes>
        </main>
      </div>
    </CashShiftProvider>
  );
}

/** Выручка смены на виду всегда: кассир отвечает на «сколько сегодня» чаще,
 *  чем открывает что-либо ещё — как повар смотрит на «в работе». */
function ShiftStats() {
  const { shift, summary } = useCashShift();
  return (
    <div className={styles.stats}>
      <span className={styles.stat}>
        <span className={[styles.statValue, ts('heading-5/bold')].join(' ')}>
          {formatPrice(summary.revenue)}
        </span>
        <span className={[styles.statLabel, ts('body-s/regular')].join(' ')}>
          выручка{shift ? '' : ' · смена закрыта'}
        </span>
      </span>
      <span className={styles.stat}>
        <span className={[styles.statValue, ts('heading-5/bold')].join(' ')}>{summary.receipts}</span>
        <span className={[styles.statLabel, ts('body-s/regular')].join(' ')}>чеков</span>
      </span>
      <span className={styles.stat}>
        <span className={[styles.statValue, ts('heading-5/bold')].join(' ')}>
          {formatPrice(summary.average)}
        </span>
        <span className={[styles.statLabel, ts('body-s/regular')].join(' ')}>средний чек</span>
      </span>
    </div>
  );
}

function SignOut() {
  const { signOut } = useAuth();
  return (
    <button type="button" className={[styles.signOut, ts('body-xs/regular')].join(' ')} onClick={() => void signOut()}>
      Выйти
    </button>
  );
}

function WrongRole() {
  const { me, signOut } = useAuth();
  return (
    <div className={styles.notice}>
      <h1 className={[styles.noticeTitle, ts('heading-6/bold')].join(' ')}>Касса не ваше рабочее место</h1>
      <p className={[styles.noticeText, ts('body-m/regular')].join(' ')}>
        {me?.name}, роль «{me ? STAFF_ROLE_LABELS[me.role] : ''}» не открывает кассу. Зал — в приложении
        официанта, доска заказов — на экране кухни.
      </p>
      <button type="button" className={[styles.link, ts('action/semibold')].join(' ')} onClick={() => void signOut()}>
        Выйти
      </button>
    </div>
  );
}

export default App;
