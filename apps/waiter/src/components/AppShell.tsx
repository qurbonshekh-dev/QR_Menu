import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, MessageIcon, ShoppingBagIcon, TabBar, UserIcon, ts } from '@food/ui';
import styles from './AppShell.module.css';

/** Разделы таб-бара = верхнеуровневые маршруты: адрес в строке и подсветка
 *  вкладки — одно состояние, иначе они разъезжаются на «назад» в браузере. */
const SECTIONS = ['/', '/messages', '/handout', '/profile'] as const;
type Section = (typeof SECTIONS)[number];

export interface AppShellProps {
  /** Непрочитанные запросы гостей — тот же счётчик, что и на карточке стола. */
  messages?: number;
}

export function AppShell({ messages }: AppShellProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
          { value: '/messages', label: 'Сообщения', icon: <MessageIcon size={20} />, badge: messages },
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
