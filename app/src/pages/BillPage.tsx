import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ActionTile,
  AppHeader,
  Badge,
  Button,
  OptionGroup,
  SegmentedControl,
  TextInput,
  UserIcon,
  WalletIcon,
} from '../components';
import { getWaiter } from '../data/menuRepository';
import { formatPrice } from '../data/format';
import { useOrders } from '../state/ordersStore';
import { useTableSession } from '../state/tableSessionStore';
import { ts } from '../tokens/typography';
import styles from './BillPage.module.css';

type BillTab = 'bill' | 'tip';

/** Проценты чаевых. Сумма считается от заказов стола, а не от фиксированной
 *  цифры — в отличие от макета-референса, где все пресеты давали одно число. */
const TIP_PERCENTS = [10, 15, 20, 25];

/** Округление: «1 757 с» выглядит как ошибка расчёта, но и грубая сотня на
 *  маленьком счёте превращает 10% в 8% — поэтому шаг зависит от суммы. */
function tipFromPercent(base: number, percent: number): number {
  const exact = (base * percent) / 100;
  const step = exact >= 1000 ? 100 : 10;
  return Math.round(exact / step) * step;
}

export function BillPage() {
  const navigate = useNavigate();
  const { orders, sessionTotal, tip, setTip, billTotal } = useOrders();
  const { tableNumber } = useTableSession();
  // Плитка «Оставить чаевые» на главной открывает сразу нужную вкладку.
  const requestedTab = (useLocation().state as { tab?: BillTab } | null)?.tab;
  const [tab, setTab] = useState<BillTab>(requestedTab === 'tip' ? 'tip' : 'bill');
  const [customTip, setCustomTip] = useState('');
  const [billRequested, setBillRequested] = useState(false);
  const waiter = getWaiter();

  if (orders.length === 0) {
    return (
      <div className={styles.page}>
        <AppHeader title="Счёт" onBack={() => navigate('/')} />
        <div className={styles.empty}>
          <p className={[styles.emptyText, ts('body-m/regular')].join(' ')}>
            Счёта пока нет — за столом ещё ничего не заказано.
          </p>
          <Button onClick={() => navigate('/menu')}>Открыть меню</Button>
        </div>
      </div>
    );
  }

  const presets = TIP_PERCENTS.map((percent) => ({
    id: String(percent),
    caption: `${percent}%`,
    label: formatPrice(tipFromPercent(sessionTotal, percent)),
  }));
  // Выбранный пресет подсвечен, только если сумма совпала: после «своей суммы»
  // подсветка обязана слететь, иначе гость видит два выбора сразу.
  const activePreset =
    TIP_PERCENTS.find((percent) => tipFromPercent(sessionTotal, percent) === tip && tip > 0) ?? null;

  // Своя сумма применяется на вводе, а не по blur: итог обязан пересчитываться
  // на глазах, иначе гость жмёт «Добавить к счёту» с непонятной суммой.
  const changeCustomTip = (raw: string) => {
    setCustomTip(raw);
    const amount = Number(raw.replace(/\s/g, ''));
    setTip(Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0);
  };

  return (
    <div className={styles.page}>
      <AppHeader title="Счёт" subtitle={`Стол ${tableNumber}`} onBack={() => navigate('/')} />

      <div className={styles.tabs}>
        <SegmentedControl
          aria-label="Счёт и чаевые"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'bill', label: 'Счёт' },
            { value: 'tip', label: 'Чаевые' },
          ]}
        />
      </div>

      {tab === 'bill' ? (
        <>
          <section className={styles.summary}>
            <span className={[styles.summaryLabel, ts('body-s/regular')].join(' ')}>К оплате за стол</span>
            <span className={[styles.summaryValue, ts('heading-5/bold')].join(' ')}>{formatPrice(billTotal)}</span>
            <span className={[styles.summaryMeta, ts('body-xs/regular')].join(' ')}>
              {orders.length === 1 ? 'Один заказ' : `Заказов: ${orders.length}`} · без налогов и сервисного сбора
            </span>
          </section>

          <ul className={styles.breakdown}>
            {orders.map((order) => (
              <li key={order.id} className={styles.row}>
                <span className={[styles.rowLabel, ts('body-s/regular')].join(' ')}>Заказ №{order.id}</span>
                <span className={[styles.rowValue, ts('body-s/medium')].join(' ')}>{formatPrice(order.total)}</span>
              </li>
            ))}
            {tip > 0 ? (
              <li className={styles.row}>
                <span className={[styles.rowLabel, ts('body-s/regular')].join(' ')}>Чаевые официанту</span>
                <span className={[styles.rowValue, ts('body-s/medium')].join(' ')}>{formatPrice(tip)}</span>
              </li>
            ) : null}
          </ul>

          <div className={styles.actions}>
            <ActionTile
              variant="wide"
              title="Попросить счёт у официанта"
              caption={
                billRequested
                  ? `${waiter.name} несёт счёт на ${formatPrice(billTotal)}`
                  : tip > 0
                    ? 'Наличными или картой на месте, с чаевыми'
                    : 'Наличными или картой на месте'
              }
              icon={<UserIcon size={20} />}
              onClick={() => setBillRequested(true)}
            />

            {/* Платёжный шлюз — фаза 4 из docs/tz.md. Пока честная заглушка,
                а не кнопка, которая делает вид, что списала деньги. */}
            <ActionTile
              variant="wide"
              title="Оплатить онлайн"
              caption="Картой прямо в приложении"
              icon={<WalletIcon size={20} />}
              disabled
              badge={<Badge tone="overlay">скоро</Badge>}
            />
          </div>
        </>
      ) : (
        <div className={styles.tip}>
          <p className={[styles.tipIntro, ts('body-m/regular')].join(' ')}>
            Официант — {waiter.name}. Чаевые добавим к счёту стола, отдельная оплата не нужна.
          </p>

          <OptionGroup
            aria-label="Размер чаевых"
            layout="detailed"
            options={presets}
            value={activePreset === null ? '' : String(activePreset)}
            onChange={(id) => {
              setCustomTip('');
              const percent = Number(id);
              const amount = tipFromPercent(sessionTotal, percent);
              // Повторный тап по выбранному проценту снимает чаевые.
              setTip(amount === tip ? 0 : amount);
            }}
          />

          <TextInput
            label="Своя сумма"
            inputMode="numeric"
            value={customTip}
            onChange={(event) => changeCustomTip(event.target.value)}
          />

          <div className={styles.tipTotals}>
            <div className={styles.row}>
              <span className={[styles.rowLabel, ts('body-s/regular')].join(' ')}>Заказы</span>
              <span className={[styles.rowValue, ts('body-s/medium')].join(' ')}>{formatPrice(sessionTotal)}</span>
            </div>
            <div className={styles.row}>
              <span className={[styles.rowLabel, ts('body-s/regular')].join(' ')}>Чаевые</span>
              <span className={[styles.rowValue, ts('body-s/medium')].join(' ')}>{formatPrice(tip)}</span>
            </div>
          </div>

          <div className={styles.tipFooter}>
            <div className={styles.total}>
              <span className={[styles.totalLabel, ts('body-xs/medium')].join(' ')}>Итого к оплате</span>
              <span className={[styles.totalValue, ts('heading-8/bold')].join(' ')}>{formatPrice(billTotal)}</span>
            </div>
            <Button block onClick={() => setTab('bill')}>
              Добавить к счёту
            </Button>
            {tip > 0 ? (
              <Button
                block
                variant="secondary"
                onClick={() => {
                  setCustomTip('');
                  setTip(0);
                }}
              >
                Убрать чаевые
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <p className={styles.live} role="status" aria-live="polite">
        {billRequested ? `Официант ${waiter.name} предупреждён и несёт счёт на ${formatPrice(billTotal)}.` : ''}
      </p>
    </div>
  );
}
