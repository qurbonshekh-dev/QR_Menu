import { HomePage } from './pages/HomePage';
import styles from './App.module.css';

/** Приложение официанта — телефон в кармане, поэтому та же mobile-first рамка,
 *  что и у гостя. Роутер появится вместе со вторым экраном. */
function App() {
  return (
    <div className={styles.viewport}>
      <HomePage />
    </div>
  );
}

export default App;
