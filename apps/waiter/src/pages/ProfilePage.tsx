import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, TextInput, ts } from '@food/ui';
import { formatPrice, rankOf, shiftDay, shiftTime } from '@food/domain';
import {
  addGoal,
  endShift,
  fetchStaffStats,
  removeGoal,
  startShift,
  type StaffStats,
} from '@food/api';
import { useAuth } from '@food/staff';
import styles from './ProfilePage.module.css';

const ROLE_LABELS: Record<string, string> = {
  waiter: 'Официант',
  manager: 'Менеджер',
  cook: 'Повар',
};

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

/** Кабинет из раздела 1 ТЗ: смена, заработок, цели и ранг. Всё считается от
 *  заказов и чаевых в базе — отдельного кошелька нет, деньги в приложении
 *  не двигаются. */
export function ProfilePage() {
  const { me, signOut } = useAuth();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!me) return;
    void fetchStaffStats(me.id).then(setStats).catch(() => setStats(null));
  }, [me]);

  useEffect(load, [load]);

  const act = async (action: Promise<void>) => {
    setBusy(true);
    try {
      await action;
      load();
    } finally {
      setBusy(false);
    }
  };

  const submitGoal = async (event: FormEvent) => {
    event.preventDefault();
    if (!me || busy) return;
    const target = Number(goalTarget.replace(/\s/g, ''));
    if (!goalTitle.trim() || !Number.isFinite(target) || target <= 0) return;
    await act(addGoal(me.id, goalTitle.trim(), target));
    setGoalTitle('');
    setGoalTarget('');
  };

  const rank = rankOf(stats?.ordersTotal ?? 0);
  const shift = stats?.today;
  const shiftLive = Boolean(shift?.startedAt && !shift.endedAt);
  const maxTip = Math.max(1, ...(stats?.tipsByDay ?? []).map((entry) => entry.amount));

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={[styles.title, ts('heading-7/bold')].join(' ')}>{me?.name}</h1>
          <p className={[styles.subtitle, ts('body-s/regular')].join(' ')}>
            {me ? (ROLE_LABELS[me.role] ?? me.role) : ''} · {rank.current.name} {rank.current.share}%
          </p>
        </div>
        <Button variant="secondary" size="m" onClick={() => void signOut()}>
          Выйти
        </Button>
      </header>

      {/* Ранг: официант видит, сколько осталось до следующей доли. */}
      <section className={styles.card}>
        <div className={styles.rowBetween}>
          <span className={[styles.cardTitle, ts('body-m/medium')].join(' ')}>
            {rank.current.name} · {rank.current.share}%
          </span>
          <span className={[styles.muted, ts('body-s/regular')].join(' ')}>
            {rank.next ? `до «${rank.next.name}» ${formatPrice(rank.next.from - (stats?.ordersTotal ?? 0))}` : 'выше некуда'}
          </span>
        </div>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.trackFill} style={{ width: `${Math.round(rank.progress * 100)}%` }} />
        </div>
        <span className={[styles.muted, ts('body-xs/regular')].join(' ')}>
          Принято заказов на {formatPrice(stats?.ordersTotal ?? 0)}
        </span>
      </section>

      <section className={styles.card}>
        <span className={[styles.cardTitle, ts('body-m/medium')].join(' ')}>Смена сегодня</span>
        {shift ? (
          <>
            <span className={[styles.big, ts('heading-8/bold')].join(' ')}>
              {shiftTime(shift.startsAt)}–{shiftTime(shift.endsAt)}
            </span>
            <span className={[styles.muted, ts('body-s/regular')].join(' ')}>
              {shift.endedAt
                ? `Завершена в ${shiftTime(shift.endedAt)}`
                : shift.startedAt
                  ? `Начата в ${shiftTime(shift.startedAt)}`
                  : 'Ещё не начата'}
            </span>
            {!shift.endedAt ? (
              <Button
                block
                variant={shiftLive ? 'secondary' : 'main'}
                disabled={busy}
                onClick={() => void act(shiftLive ? endShift(shift.id) : startShift(shift.id))}
              >
                {shiftLive ? 'Завершить смену' : 'Начать смену'}
              </Button>
            ) : null}
          </>
        ) : (
          <span className={[styles.muted, ts('body-s/regular')].join(' ')}>
            На сегодня смены нет — график составляет менеджер.
          </span>
        )}
      </section>

      <section className={styles.card}>
        <span className={[styles.cardTitle, ts('body-m/medium')].join(' ')}>Чаевые</span>
        <div className={styles.rowBetween}>
          <span className={[styles.big, ts('heading-7/bold')].join(' ')}>{formatPrice(stats?.tipsToday ?? 0)}</span>
          <span className={[styles.muted, ts('body-s/regular')].join(' ')}>
            за всё время {formatPrice(stats?.tipsTotal ?? 0)}
          </span>
        </div>

        {/* График по дням: столбики из токенов, без графической библиотеки —
            семь чисел не стоят ещё одной зависимости. */}
        <div className={styles.chart} aria-label="Чаевые по дням">
          {(stats?.tipsByDay ?? []).map((entry) => (
            <div key={entry.day} className={styles.bar}>
              <div
                className={styles.barFill}
                style={{ height: `${Math.max(4, Math.round((entry.amount / maxTip) * 100))}%` }}
                title={`${entry.day}: ${entry.amount}`}
              />
              <span className={[styles.barLabel, ts('body-xxs/regular')].join(' ')}>
                {WEEKDAYS[new Date(entry.day).getDay()]}
              </span>
            </div>
          ))}
        </div>

        {/* Вывод чаевых — платёжный шлюз, которого нет (фаза 4 ТЗ). */}
        <Button block variant="secondary" disabled>
          Вывести на карту
        </Button>
      </section>

      <section className={styles.card}>
        <span className={[styles.cardTitle, ts('body-m/medium')].join(' ')}>Мои цели</span>
        {stats?.goals.length ? (
          stats.goals.map((goal) => {
            const share = Math.min(1, (stats.tipsTotal || 0) / goal.target);
            return (
              <div key={goal.id} className={styles.goal}>
                <div className={styles.rowBetween}>
                  <span className={ts('body-m/medium')}>{goal.title}</span>
                  <button
                    type="button"
                    className={[styles.link, ts('body-s/regular')].join(' ')}
                    onClick={() => void act(removeGoal(goal.id))}
                  >
                    Убрать
                  </button>
                </div>
                <div className={styles.track} aria-hidden="true">
                  <div className={styles.trackFill} style={{ width: `${Math.round(share * 100)}%` }} />
                </div>
                <span className={[styles.muted, ts('body-xs/regular')].join(' ')}>
                  {formatPrice(stats.tipsTotal)} из {formatPrice(goal.target)}
                </span>
              </div>
            );
          })
        ) : (
          <span className={[styles.muted, ts('body-s/regular')].join(' ')}>
            Цели нет. Накопления считаются от чаевых за всё время.
          </span>
        )}

        <form className={styles.goalForm} onSubmit={submitGoal}>
          <TextInput label="На что копим" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
          <TextInput
            label="Сколько нужно"
            inputMode="numeric"
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
          />
          <Button type="submit" block disabled={busy || !goalTitle.trim() || !goalTarget.trim()}>
            Добавить цель
          </Button>
        </form>
      </section>

      <section className={styles.card}>
        <span className={[styles.cardTitle, ts('body-m/medium')].join(' ')}>Ближайшие смены</span>
        {stats?.upcoming.length ? (
          stats.upcoming.map((item) => (
            <div key={item.id} className={styles.rowBetween}>
              <span className={ts('body-m/regular')}>{shiftDay(item.startsAt)}</span>
              <span className={[styles.muted, ts('body-s/regular')].join(' ')}>
                {shiftTime(item.startsAt)}–{shiftTime(item.endsAt)}
              </span>
            </div>
          ))
        ) : (
          <span className={[styles.muted, ts('body-s/regular')].join(' ')}>График пока пуст.</span>
        )}
      </section>
    </section>
  );
}
