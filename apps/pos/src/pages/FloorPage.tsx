import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  closeBill,
  fetchAllTables,
  fetchOpenOrderIds,
  fetchTableService,
  subscribeFloor,
  type TableService,
} from '@food/api';
import { formatPrice, pluralGuests, tableStatusLabel, type FloorTable } from '@food/domain';
import { Button, TableStatusChip, TextInput, ts } from '@food/ui';
import { useAuth } from '@food/staff';
import { useCashShift } from '../state/cashShiftStore';
import styles from './FloorPage.module.css';

/**
 * Зал глазами кассы: весь ресторан сразу, без деления на «мои столы», и сводка
 * смены на виду — кассир отвечает на «сколько сегодня» чаще, чем открывает
 * что-либо ещё.
 */
export function FloorPage() {
  const { me } = useAuth();
  const { shift, summary, open, close, refresh } = useCashShift();
  const [tables, setTables] = useState<FloorTable[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [service, setService] = useState<TableService | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState('');

  const load = useCallback(async () => {
    setTables(await fetchAllTables());
  }, []);

  useEffect(() => {
    void load();
    // Статусы двигают официант и кухня — касса обязана видеть это без обновления.
    return subscribeFloor(() => void load());
  }, [load]);

  const selected = useMemo(
    () => tables.find((table) => table.id === selectedId) ?? null,
    [tables, selectedId],
  );

  useEffect(() => {
    if (!selected) {
      setService(null);
      return;
    }
    void fetchTableService(selected.id).then(setService);
  }, [selected, tables]);

  const pay = async () => {
    if (!selected || !service || service.items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      // Полная модалка расчёта (сдача, карта, разделение) — следующий этап;
      // сейчас касса закрывает счёт наличными, но уже чеком, а не статусом.
      const orderIds = await fetchOpenOrderIds(selected.id);
      await closeBill({
        orderIds,
        payments: [{ method: 'cash', amount: service.total }],
        cashierId: me?.id,
        cashShiftId: shift?.id,
      });
      await Promise.all([load(), refresh()]);
      setService(null);
      setSelectedId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось закрыть счёт');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.summary}>
        <Stat label="Выручка за смену" value={formatPrice(summary.revenue)} big />
        <Stat label="Чеков" value={String(summary.receipts)} />
        <Stat label="Средний чек" value={formatPrice(summary.average)} />
        <Stat label="Наличными" value={formatPrice(summary.byMethod.cash)} />
        <Stat label="Картой" value={formatPrice(summary.byMethod.card)} />
        <Stat label="По QR" value={formatPrice(summary.byMethod.qr)} />

        <div className={styles.shiftBox}>
          {shift ? (
            <>
              <span className={[styles.shiftLabel, ts('body-xs/regular')].join(' ')}>
                Смена открыта{shift.cashierName ? ` · ${shift.cashierName}` : ''} · в ящике должно быть{' '}
                {formatPrice(summary.cashExpected)}
              </span>
              <div className={styles.shiftRow}>
                <TextInput
                  label="Насчитали в ящике"
                  inputMode="numeric"
                  value={shiftForm}
                  onChange={(event) => setShiftForm(event.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    void close(Number(shiftForm) || 0);
                    setShiftForm('');
                  }}
                >
                  Закрыть смену
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className={[styles.shiftLabel, ts('body-xs/regular')].join(' ')}>
                Смена закрыта — чеки не попадут в отчёт, пока её не откроют.
              </span>
              <div className={styles.shiftRow}>
                <TextInput
                  label="Наличных на начало"
                  inputMode="numeric"
                  value={shiftForm}
                  onChange={(event) => setShiftForm(event.target.value)}
                />
                <Button
                  onClick={() => {
                    void open(Number(shiftForm) || 0);
                    setShiftForm('');
                  }}
                >
                  Открыть смену
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <section className={styles.map} aria-label="Карта зала">
          {tables.map((table) => (
            <TableStatusChip
              key={table.id}
              number={table.number}
              status={table.status}
              alerts={table.alerts}
              selected={table.id === selectedId}
              onClick={() => setSelectedId(table.id === selectedId ? null : table.id)}
            />
          ))}
        </section>

        <aside className={styles.panel} aria-label="Счёт стола">
          {!selected ? (
            <p className={[styles.hint, ts('body-m/regular')].join(' ')}>
              Выберите стол — покажем его счёт и закроем его чеком.
            </p>
          ) : (
            <>
              <h2 className={[styles.panelTitle, ts('heading-7/bold')].join(' ')}>Стол №{selected.number}</h2>
              <p className={[styles.panelMeta, ts('body-s/regular')].join(' ')}>
                {tableStatusLabel(selected.status)}
                {selected.guests ? ` · ${selected.guests} ${pluralGuests(selected.guests)}` : ''}
              </p>

              {service && service.items.length > 0 ? (
                <>
                  <ul className={styles.lines}>
                    {service.items.map((item) => (
                      <li key={item.id} className={styles.line}>
                        <span className={[styles.lineTitle, ts('body-s/regular')].join(' ')}>
                          {item.quantity} × {item.title}
                          {item.options ? <span className={styles.lineNote}> · {item.options}</span> : null}
                          {item.modifiers ? <span className={styles.lineNote}> · {item.modifiers}</span> : null}
                        </span>
                        <span className={[styles.linePrice, ts('body-s/medium')].join(' ')}>
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.total}>
                    <span className={ts('body-m/regular')}>Итого</span>
                    <span className={ts('heading-8/bold')}>{formatPrice(service.total)}</span>
                  </div>

                  {error ? <p className={[styles.error, ts('body-s/regular')].join(' ')}>{error}</p> : null}

                  <Button block disabled={busy} onClick={() => void pay()}>
                    {busy ? 'Закрываем…' : `Оплатить наличными · ${formatPrice(service.total)}`}
                  </Button>
                </>
              ) : (
                <p className={[styles.hint, ts('body-m/regular')].join(' ')}>
                  За столом нет открытого счёта.
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={styles.stat}>
      <span className={[styles.statLabel, ts('body-xs/regular')].join(' ')}>{label}</span>
      <span className={[styles.statValue, ts(big ? 'heading-7/bold' : 'heading-9/extrabold')].join(' ')}>
        {value}
      </span>
    </div>
  );
}
