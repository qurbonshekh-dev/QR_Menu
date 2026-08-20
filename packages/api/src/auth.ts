import type { StaffMember, StaffRole } from '@food/domain';
import { supabase } from './client';

/**
 * Вход сотрудника. Гостевое меню публичное по природе — входить там некому,
 * поэтому авторизация живёт только в приложениях персонала.
 */

const ROLES: StaffRole[] = ['waiter', 'manager', 'cook'];

function toRole(value: string): StaffRole {
  return (ROLES as string[]).includes(value) ? (value as StaffRole) : 'waiter';
}

export class AuthError extends Error {}

/**
 * Supabase на неверный пароль и на несуществующий логин отвечает одинаково
 * («Invalid login credentials») — специально, чтобы по ответу нельзя было
 * перебирать логины. Пересказываем это одной фразой из ТЗ.
 */
export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (!error) return;

  if (error.message.toLowerCase().includes('invalid login credentials')) {
    throw new AuthError('Логин или пароль не подходят');
  }
  if (error.message.toLowerCase().includes('email not confirmed')) {
    throw new AuthError('Учётная запись не подтверждена — обратитесь к менеджеру');
  }
  throw new AuthError('Не получилось войти. Проверьте связь и попробуйте ещё раз');
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Кто вошёл. Возвращает не пользователя Auth, а сотрудника: приложению нужны
 * имя и роль, а не адрес почты. Нет строки в `staff` — вход есть, а доступа нет:
 * такому пользователю в приложении персонала делать нечего.
 */
export async function fetchMe(): Promise<StaffMember | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('staff')
    .select('id, name, role')
    .eq('auth_user_id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return { id: data.id, name: data.name, role: toRole(data.role) };
}

/** Подписка на вход и выход: сессия живёт дольше вкладки, её может обновить
 *  фоновый рефреш токена, и экран обязан на это реагировать сам. */
export function subscribeAuth(onChange: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange(() => onChange());
  return () => data.subscription.unsubscribe();
}
