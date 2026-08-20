import { HashRouter, Route, Routes } from 'react-router-dom';
import { ts } from '@food/ui';
import { AuthProvider, LoginPage, NoAccessPage, useAuth } from '@food/staff';
import { AppShell, SectionStub } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { DraftPage } from './pages/order/DraftPage';
import { GuestsPage } from './pages/order/GuestsPage';
import { OrderDishPage } from './pages/order/OrderDishPage';
import { OrderMenuPage } from './pages/order/OrderMenuPage';
import { SentPage } from './pages/order/SentPage';
import { DraftProvider } from './state/DraftContext';
import styles from './App.module.css';

/** HashRouter, как и у гостя: приложение раздаётся статикой, серверных
 *  rewrite-правил под BrowserRouter нет. */
function App() {
  return (
    <AuthProvider>
      <DraftProvider>
        <HashRouter>
          <div className={styles.viewport}>
            <Shift />
          </div>
        </HashRouter>
      </DraftProvider>
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

      {/* Приём заказа идёт без таб-бара: официант ведёт один разговор с гостем,
          и уйти из него посреди набора можно только осознанно — кнопкой назад. */}
      <Route path="/table/:tableId/guests" element={<GuestsPage />} />
      <Route path="/table/:tableId/menu" element={<OrderMenuPage />} />
      <Route path="/table/:tableId/dish/:slug" element={<OrderDishPage />} />
      <Route path="/table/:tableId/draft" element={<DraftPage />} />
      <Route path="/table/:tableId/sent/:number" element={<SentPage />} />
    </Routes>
  );
}

export default App;
