import { HashRouter, Route, Routes } from 'react-router-dom';
import { BillPage } from './pages/BillPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DishPage } from './pages/DishPage';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrdersPage } from './pages/OrdersPage';
import { SplitPage } from './pages/SplitPage';
import { CartProvider } from './state/CartContext';
import { OrdersProvider } from './state/OrdersContext';
import { TableSessionProvider } from './state/TableSessionContext';
import styles from './App.module.css';

/** HashRouter — приложение открывается по QR-ссылке и раздаётся как статика,
 *  без серверных rewrite-правил. */
function App() {
  return (
    <CartProvider>
      <HashRouter>
        <TableSessionProvider>
          <OrdersProvider>
            <div className={styles.viewport}>
              <Routes>
                {/* QR ведёт на «/» — это хаб стола, каталог живёт на «/menu». */}
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/dish/:dishId" element={<DishPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/split" element={<SplitPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order/:orderId" element={<OrderSuccessPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/bill" element={<BillPage />} />
              </Routes>
            </div>
          </OrdersProvider>
        </TableSessionProvider>
      </HashRouter>
    </CartProvider>
  );
}

export default App;
