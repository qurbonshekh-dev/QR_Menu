import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppShell, SectionStub } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import styles from './App.module.css';

/** HashRouter, как и у гостя: приложение раздаётся статикой, серверных
 *  rewrite-правил под BrowserRouter нет. */
function App() {
  return (
    <HashRouter>
      <div className={styles.viewport}>
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
            <Route
              path="/profile"
              element={<SectionStub title="Кабинет" text="Смены, статистика, чаевые, цели и ранги." />}
            />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
