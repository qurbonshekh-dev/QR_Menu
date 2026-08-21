import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppHeader, Button, CheckIcon, ts, WalletIcon } from '@food/ui';
import { formatPrice } from '@food/domain';
import { payBillMock } from '@food/api';
import { useOrders } from '../state/ordersStore';
import { useTableSession } from '../state/tableSessionStore';
import styles from './PaymentPage.module.css';

/** Сколько «думает» шлюз. Мок, но не мгновенный: экран обработки из ТЗ имеет
 *  смысл только тогда, когда его успевают увидеть. */
const PROCESSING_MS = 1800;

/**
 * Мок платёжного шлюза (фаза 4 ТЗ): обработка → успех или отказ с повтором.
 * Отказ подмешивается случайно, потому что настоящий шлюз тоже отказывает,
 * и путь «не прошло → повторить» должен быть проверен, а не нарисован.
 */
const FAILURE_RATE = 0.2;

type Stage = 'processing' | 'done' | 'failed';

export function PaymentPage() {
  const navigate = useNavigate();
  const { tableNumber } = useTableSession();
  const { billTotal, tip } = useOrders();
  const amount = (useLocation().state as { amount?: number } | null)?.amount ?? billTotal;

  const [stage, setStage] = useState<Stage>('processing');
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(0);

  /**
   * Что оплачиваем — снимок на момент захода на экран. Успешный платёж закрывает
   * счёт стола, и чаевые в `useOrders` тут же обнуляются: если бы платёж зависел
   * от них, эффект перезапустился бы и провёл второй платёж — гость увидел бы
   * «За столом нет открытого счёта» поверх только что оплаченного счёта.
   */
  const [request] = useState(() => ({ tableNumber, tip }));
  /** Второй запуск, пока идёт первый, — это двойное списание в настоящем шлюзе. */
  const running = useRef(false);

  const pay = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setStage('processing');
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));

      if (Math.random() < FAILURE_RATE) {
        setError('Банк отклонил платёж. Попробуйте ещё раз или оплатите официанту');
        setStage('failed');
        return;
      }

      const result = await payBillMock(request.tableNumber, request.tip);
      setPaid(result.paid);
      setStage('done');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Платёж не прошёл');
      setStage('failed');
    } finally {
      running.current = false;
    }
    // `request` — снимок из useState, ссылка стабильна: платёж не перезапустится
    // сам, даже когда закрытый счёт обнулит чаевые в `useOrders`.
  }, [request]);

  useEffect(() => {
    void pay();
  }, [pay]);

  if (stage === 'processing') {
    return (
      <div className={styles.page}>
        <span className={[styles.icon, styles.pending].join(' ')} aria-hidden="true">
          <WalletIcon size={32} />
        </span>
        <h1 className={[styles.title, ts('heading-7/bold')].join(' ')}>Проводим оплату</h1>
        <p className={[styles.text, ts('body-m/regular')].join(' ')}>
          {formatPrice(amount)} · не закрывайте страницу
        </p>
        <div className={styles.track} aria-hidden="true">
          <span className={styles.trackFill} />
        </div>
      </div>
    );
  }

  if (stage === 'failed') {
    return (
      <div className={styles.page}>
        <AppHeader title="Оплата" onBack={() => navigate('/bill')} />
        <div className={styles.body}>
          <h1 className={[styles.title, ts('heading-7/bold')].join(' ')}>Платёж не прошёл</h1>
          <p className={[styles.text, ts('body-m/regular')].join(' ')}>{error}</p>
          <Button block onClick={() => void pay()}>
            Повторить оплату
          </Button>
          <Button block variant="secondary" onClick={() => navigate('/bill')}>
            Вернуться к счёту
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <span className={[styles.icon, styles.success].join(' ')} aria-hidden="true">
        <CheckIcon size={32} />
      </span>
      <h1 className={[styles.title, ts('heading-7/bold')].join(' ')}>Счёт оплачен</h1>
      <p className={[styles.text, ts('body-m/regular')].join(' ')}>
        {formatPrice(paid || amount)}
        {/* Чаевые берём из снимка: счёт закрыт, и в `useOrders` их больше нет. */}
        {request.tip > 0 ? ` · включая чаевые ${formatPrice(request.tip)}` : ''}
      </p>
      <p className={[styles.note, ts('body-s/regular')].join(' ')}>
        Это демонстрационный шлюз: деньги не списаны, но счёт стола закрыт.
      </p>
      <Button block onClick={() => navigate('/')}>
        На главную
      </Button>
    </div>
  );
}
