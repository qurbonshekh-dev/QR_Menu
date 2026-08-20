import { HashRouter, Route, Routes } from 'react-router-dom';
import { ts } from '@food/ui';
import { AppShell, SectionStub } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { LoginPage, NoAccessPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthProvider } from './state/AuthContext';
import { useAuth } from './state/authStore';
import styles from './App.module.css';

/** HashRouter, как и у гостя: приложение раздаётся статикой, серверных
 *  rewrite-правил под BrowserRouter нет. */
function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className={styles.viewport}>
          <Shift />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

/** Смена начинается со входа: зал, сообщения и выдача — это данные ресторана,
 *  а не публичная витрина. Пока сессия проверяется, не показываем ни то ни другое:
 *  мигнувший экран входа у вошедшего официанта читается как «выкинуло». */
function Shift() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Проверяем смену…</p>;
  }
  if (status === 'guest') return <LoginPage />;
  if (status === 'stranger') return <NoAccessPage />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/messages"
          element={
            <SectionStub
              title="Сообщения"
              text="Здесь будут запросы гостей из зала и системные сообщения смены."
            />
          }
        />
        <Route
          path="/handout"
          element={
            <SectionStub
              title="Выдача"
              text="Доставка и самовывоз. Раздел появится после того, как заработает зал."
            />
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
