import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, MessageIcon, ShoppingBagIcon, TabBar, UserIcon, ts } from '@food/ui';
import { fetchWaiterCalls, subscribeWaiterCalls } from '@food/api';
import styles from './AppShell.module.css';

/** Разделы таб-бара = верхнеуровневые маршруты: адрес в строке и подсветка
 *  вкладки — одно состояние, иначе они разъезжаются на «назад» в браузере. */
const SECTIONS = ['/', '/messages', '/handout', '/profile'] as const;
type Section = (typeof SECTIONS)[number];

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [messages, setMessages] = useState(0);

  // Счётчик живёт в оболочке, а не на экране сообщений: он должен светиться
  // и тогда, когда официант стоит в зале.
  const count = useCallback(
    () =>
      void fetchWaiterCalls()
        .then((calls) => setMessages(calls.filter((call) => !call.resolvedAt).length))
        .catch(() => setMessages(0)),
    [],
  );

  useEffect(() => {
    count();
    return subscribeWaiterCalls(count);
  }, [count]);

  // Вложенные экраны заказа живут под своим разделом: со «Стол №12 → меню»
  // подсвеченной должна остаться «Главная», а не погаснуть весь таб-бар.
  const section: Section = SECTIONS.find((path) => path !== '/' && pathname.startsWith(path)) ?? '/';

  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        <Outlet />
      </div>
      <TabBar
        aria-label="Разделы приложения"
        value={section}
        onChange={(next) => navigate(next)}
        items={[
          { value: '/', label: 'Главная', icon: <HomeIcon size={20} /> },
          { value: '/messages', label: 'Сообщения', icon: <MessageIcon size={20} />, badge: messages || undefined },
          { value: '/handout', label: 'Выдача', icon: <ShoppingBagIcon size={20} /> },
          { value: '/profile', label: 'Кабинет', icon: <UserIcon size={20} /> },
        ]}
      />
    </div>
  );
}

/** Заглушка раздела, до которого ещё не дошли руки. Пишем честно, что здесь
 *  будет: пустой экран без объяснения официант читает как поломку. */
export function SectionStub({ title, text }: { title: string; text: string }) {
  return (
    <section className={styles.stub}>
      <h1 className={[styles.stubTitle, ts('heading-7/bold')].join(' ')}>{title}</h1>
      <p className={[styles.stubText, ts('body-m/regular')].join(' ')}>{text}</p>
    </section>
  );
}
