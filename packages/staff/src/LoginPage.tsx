import { useState, type FormEvent } from 'react';
import { Button, TextInput, ts } from '@food/ui';
import { useAuth } from './authStore';
import styles from './LoginPage.module.css';

export interface LoginPageProps {
  /** Заголовок экрана: «Вход в смену» у официанта, «Панель управления» у админки. */
  title?: string;
  text?: string;
}

/** Вход сотрудника. Одна форма и одна кнопка: официант открывает приложение на
 *  ходу, и любое лишнее поле здесь стоит ему времени у стола. */
export function LoginPage({ title = 'Вход в смену', text = 'Логин и пароль выдаёт менеджер ресторана.' }: LoginPageProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не получилось войти');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.intro}>
          <h1 className={[styles.title, ts('heading-6/bold')].join(' ')}>{title}</h1>
          <p className={[styles.text, ts('body-m/regular')].join(' ')}>{text}</p>
        </div>

        <form className={styles.form} onSubmit={submit} noValidate>
          <TextInput
            label="Логин"
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextInput
            label="Пароль"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            // Ошибку вешаем на пароль: логин обычно набран верно, а Supabase
            // намеренно не говорит, что именно не подошло.
            error={error ?? undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" block disabled={busy || !email || !password}>
            {busy ? 'Входим…' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  );
}

/** Вход есть, а сотрудника с таким пользователем нет. Тупик объясняем словами:
 *  иначе человек будет ломиться в приложение, считая, что оно сломалось. */
export function NoAccessPage() {
  const { signOut } = useAuth();
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.intro}>
          <h1 className={[styles.title, ts('heading-6/bold')].join(' ')}>Нет доступа</h1>
          <p className={[styles.text, ts('body-m/regular')].join(' ')}>
            Учётная запись не привязана ни к одному сотруднику ресторана. Попросите менеджера
            добавить вас в штат и войдите ещё раз.
          </p>
        </div>
        <Button block variant="secondary" onClick={() => void signOut()}>
          Выйти
        </Button>
      </div>
    </div>
  );
}
