import { useCallback, useEffect, useState } from 'react';
import { Button, CheckDoubleIcon, ts } from '@food/ui';
import { fetchWaiterCalls, resolveWaiterCall, subscribeWaiterCalls, type WaiterCall } from '@food/api';
import styles from './MessagesPage.module.css';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** Центр сообщений: запросы гостей из зала. Единственная лента на смену —
 *  открытые сверху, закрытые ниже, чтобы «выполнено» было видно, а не забыто. */
export function MessagesPage() {
  const [calls, setCalls] = useState<WaiterCall[] | null>(null);

  const load = useCallback(() => void fetchWaiterCalls().then(setCalls).catch(() => setCalls([])), []);

  useEffect(() => {
    load();
    return subscribeWaiterCalls(load);
  }, [load]);

  const resolve = async (call: WaiterCall) => {
    // Отмечаем сразу, не дожидаясь ответа базы: официант уже идёт к столу,
    // а realtime всё равно принесёт настоящее состояние следом.
    setCalls((current) =>
      current?.map((row) => (row.id === call.id ? { ...row, resolvedAt: new Date().toISOString() } : row)) ?? null,
    );
    try {
      await resolveWaiterCall(call.id);
    } catch {
      load();
    }
  };

  const open = calls?.filter((call) => !call.resolvedAt) ?? [];
  const done = calls?.filter((call) => call.resolvedAt) ?? [];

  return (
    <section className={styles.page}>
      <h1 className={[styles.title, ts('heading-7/bold')].join(' ')}>Сообщения</h1>

      {calls === null ? <p className={[styles.muted, ts('body-s/regular')].join(' ')}>Загружаем ленту…</p> : null}

      {calls !== null && calls.length === 0 ? (
        <p className={[styles.muted, ts('body-m/regular')].join(' ')}>
          Гости пока ни о чём не просили. Запросы придут сюда сами.
        </p>
      ) : null}

      {open.map((call) => (
        <article key={call.id} className={[styles.card, styles.open].join(' ')}>
          <div className={styles.head}>
            <span className={[styles.table, ts('body-m/medium')].join(' ')}>Стол №{call.tableNumber}</span>
            <span className={[styles.time, ts('body-xs/regular')].join(' ')}>{formatTime(call.createdAt)}</span>
          </div>
          {/* Сообщение гостя — его слова, поэтому крупнее поводов из списка. */}
          {call.message ? (
            <p className={[styles.message, ts('body-l/medium')].join(' ')}>{call.message}</p>
          ) : null}
          {call.reasons.length || !call.message ? (
            <p className={[styles.reasons, ts('body-m/regular')].join(' ')}>
              {call.reasons.length ? call.reasons.join(' · ') : 'Просят подойти'}
            </p>
          ) : null}
          <Button size="m" onClick={() => void resolve(call)}>
            Выполнить
          </Button>
        </article>
      ))}

      {done.length ? (
        <h2 className={[styles.section, ts('body-s/medium')].join(' ')}>Выполнено</h2>
      ) : null}

      {done.map((call) => (
        <article key={call.id} className={styles.card}>
          <div className={styles.head}>
            <span className={[styles.table, ts('body-m/medium')].join(' ')}>Стол №{call.tableNumber}</span>
            <span className={[styles.time, ts('body-xs/regular')].join(' ')}>{formatTime(call.createdAt)}</span>
          </div>
          {call.message ? (
            <p className={[styles.message, ts('body-m/medium')].join(' ')}>{call.message}</p>
          ) : null}
          {call.reasons.length || !call.message ? (
            <p className={[styles.reasons, ts('body-m/regular')].join(' ')}>
              {call.reasons.length ? call.reasons.join(' · ') : 'Просили подойти'}
            </p>
          ) : null}
          <span className={styles.done} aria-label="Выполнено">
            <CheckDoubleIcon size={20} />
          </span>
        </article>
      ))}
    </section>
  );
}
