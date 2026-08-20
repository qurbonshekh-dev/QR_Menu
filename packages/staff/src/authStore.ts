import { createContext, useContext } from 'react';
import type { StaffMember } from '@food/domain';

/**
 * `loading` — сессию ещё проверяем (она переживает перезапуск приложения),
 * `guest` — не вошёл, `staff` — вошёл и найден в штате,
 * `stranger` — вход есть, а строки в `staff` нет: в приложении персонала
 * такому пользователю делать нечего, и молчать об этом нельзя.
 */
export type AuthStatus = 'loading' | 'guest' | 'staff' | 'stranger';

export interface AuthValue {
  status: AuthStatus;
  me: StaffMember | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
