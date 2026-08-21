import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, SegmentedControl, TextInput, ts } from '@food/ui';
import type { StaffRole } from '@food/domain';
import {
  attachStaffLogin,
  createStaffAccount,
  fetchStaff,
  resetStaffPassword,
  type StaffAccount,
} from '@food/api';
import { useAuth } from '@food/staff';
import styles from './StaffPage.module.css';

const ROLE_LABELS: Record<StaffRole, string> = {
  waiter: 'Официант',
  cook: 'Повар',
  manager: 'Менеджер',
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'waiter' as StaffRole };

/** Сотрудники ресторана и их входы. Пароль здесь набирает менеджер и передаёт
 *  сотруднику лично: почтовой рассылки у ресторана нет, а повар без почты — норма. */
export function StaffPage() {
  const { me, signOut } = useAuth();
  const [staff, setStaff] = useState<StaffAccount[] | null>(null);
  // Кому заводим вход: null — новый сотрудник, иначе существующий из списка.
  const [attachTo, setAttachTo] = useState<StaffAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => void fetchStaff().then(setStaff).catch(() => setStaff([])), []);
  useEffect(load, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      if (attachTo) {
        await attachStaffLogin(attachTo.id, form.email, form.password);
        setDone(`${attachTo.name} может входить с логином ${form.email}`);
        setAttachTo(null);
      } else {
        await createStaffAccount(form);
        setDone(`${form.name} может входить с логином ${form.email}`);
      }
      setForm(EMPTY_FORM);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не получилось создать сотрудника');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (member: StaffAccount) => {
    const next = window.prompt(`Новый пароль для ${member.name} (от 8 символов)`);
    if (!next) return;
    setError(null);
    setDone(null);
    try {
      await resetStaffPassword(member.id, next);
      setDone(`Пароль ${member.name} обновлён`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не получилось сменить пароль');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={[styles.title, ts('heading-7/bold')].join(' ')}>Сотрудники</h1>
          <p className={[styles.subtitle, ts('body-s/regular')].join(' ')}>{me?.name} · менеджер</p>
        </div>
        <Button variant="secondary" size="m" onClick={() => void signOut()}>
          Выйти
        </Button>
      </header>

      <section className={styles.list}>
        {staff === null ? (
          <p className={[styles.muted, ts('body-s/regular')].join(' ')}>Загружаем штат…</p>
        ) : (
          staff.map((member) => (
            <div key={member.id} className={styles.row}>
              <span className={styles.rowText}>
                <span className={[styles.rowName, ts('body-m/medium')].join(' ')}>{member.name}</span>
                <span className={[styles.rowMeta, ts('body-xs/regular')].join(' ')}>
                  {ROLE_LABELS[member.role]} · {member.hasLogin ? 'вход заведён' : 'входа нет'}
                </span>
              </span>
              <button
                type="button"
                className={[styles.link, ts('action/semibold')].join(' ')}
                onClick={() => {
                  if (member.hasLogin) {
                    void resetPassword(member);
                    return;
                  }
                  setAttachTo(member);
                  setForm({ ...EMPTY_FORM, name: member.name, role: member.role });
                  setDone(null);
                  setError(null);
                }}
              >
                {member.hasLogin ? 'Сменить пароль' : 'Завести вход'}
              </button>
            </div>
          ))
        )}
      </section>

      <form className={styles.form} onSubmit={submit} noValidate>
        <h2 className={[styles.formTitle, ts('heading-9/extrabold')].join(' ')}>
          {attachTo ? `Вход для ${attachTo.name}` : 'Новый сотрудник'}
        </h2>

        {attachTo ? null : (
          <SegmentedControl
            aria-label="Роль сотрудника"
            value={form.role}
            onChange={(role) => setForm((current) => ({ ...current, role }))}
            options={[
              { value: 'waiter', label: 'Официант' },
              { value: 'cook', label: 'Повар' },
              { value: 'manager', label: 'Менеджер' },
            ]}
          />
        )}

        {attachTo ? null : (
          <TextInput
            label="Имя"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        )}
        <TextInput
          label="Логин (почта)"
          type="email"
          autoComplete="off"
          autoCapitalize="none"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <TextInput
          label="Пароль"
          type="password"
          autoComplete="new-password"
          value={form.password}
          error={error ?? undefined}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />

        <Button type="submit" block disabled={busy || !form.name || !form.email || form.password.length < 8}>
          {busy ? 'Создаём…' : attachTo ? 'Завести вход' : 'Создать учётную запись'}
        </Button>

        {attachTo ? (
          <Button
            block
            variant="secondary"
            onClick={() => {
              setAttachTo(null);
              setForm(EMPTY_FORM);
            }}
          >
            Отмена
          </Button>
        ) : null}

        {done ? (
          <p className={[styles.done, ts('body-s/regular')].join(' ')} role="status">
            {done}
          </p>
        ) : null}
      </form>
    </div>
  );
}
