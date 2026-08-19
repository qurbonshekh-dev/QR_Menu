import { HashRouter, Route, Routes } from 'react-router-dom';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DishPage } from './pages/DishPage';
import { MenuPage } from './pages/MenuPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { CartProvider } from './state/CartContext';
import { TableSessionProvider } from './state/TableSessionContext';
import styles from './App.module.css';

/** HashRouter — приложение открывается по QR-ссылке и раздаётся как статика,
 *  без серверных rewrite-правил. */
function App() {
  return (
    <CartProvider>
      <HashRouter>
        <TableSessionProvider>
          <div className={styles.viewport}>
            <Routes>
              <Route path="/" element={<MenuPage />} />
              <Route path="/dish/:dishId" element={<DishPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order/:orderId" element={<OrderSuccessPage />} />
            </Routes>
          </div>
        </TableSessionProvider>
      </HashRouter>
    </CartProvider>
  );
}

export default App;
