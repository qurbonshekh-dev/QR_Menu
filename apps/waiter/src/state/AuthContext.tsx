import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { StaffMember } from '@food/domain';
import { fetchMe, signIn as signInApi, signOut as signOutApi, subscribeAuth } from '@food/api';
import { AuthContext, type AuthStatus, type AuthValue } from './authStore';

/**
 * Кто работает в смене. Сессию хранит сам Supabase (localStorage) и сам её
 * обновляет по таймеру — поэтому состояние здесь только зеркалит его события,
 * а не пытается вести собственный учёт входов.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [me, setMe] = useState<StaffMember | null>(null);

  useEffect(() => {
    let alive = true;

    const load = () =>
      void fetchMe()
        .then((staff) => {
          if (!alive) return;
          setMe(staff);
          setStatus(staff ? 'staff' : 'guest');
        })
        .catch(() => {
          if (!alive) return;
          setMe(null);
          // Ошибка запроса — это не «не вошёл»: показываем экран входа,
          // но сессию не трогаем, её починит следующий успешный запрос.
          setStatus('guest');
        });

    load();
    const unsubscribe = subscribeAuth(load);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInApi(email, password);
    const staff = await fetchMe();
    setMe(staff);
    setStatus(staff ? 'staff' : 'stranger');
  }, []);

  const signOut = useCallback(async () => {
    await signOutApi();
    setMe(null);
    setStatus('guest');
  }, []);

  const value = useMemo<AuthValue>(() => ({ status, me, signIn, signOut }), [status, me, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
