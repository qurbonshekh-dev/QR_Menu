import type { StaffMember, StaffRole } from '@food/domain';
import { supabase } from './client';

export interface StaffAccount extends StaffMember {
  /** У сотрудника заведён вход в приложение. Нет входа — есть только имя в штате. */
  hasLogin: boolean;
}

export interface CreateStaffInput {
  name: string;
  role: StaffRole;
  email: string;
  password: string;
}

export async function fetchStaff(): Promise<StaffAccount[]> {
  const { data, error } = await supabase.from('staff').select('id, name, role, auth_user_id').order('name');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role as StaffRole,
    hasLogin: Boolean(row.auth_user_id),
  }));
}

/**
 * Учётные записи заводит edge-функция `staff-admin`: создание пользователя
 * требует service_role-ключа, а его место — на сервере, не в браузере.
 * Токен менеджера supabase-js подставляет в запрос сам.
 */
export async function createStaffAccount(input: CreateStaffInput): Promise<void> {
  await invokeStaffAdmin({ action: 'create', ...input });
}

/** Вход существующему сотруднику: строка в штате уже есть, не хватает только
 *  учётной записи. Заводить дубль ради логина нельзя — за старой строкой
 *  закреплены столы и заказы. */
export async function attachStaffLogin(staffId: string, email: string, password: string): Promise<void> {
  await invokeStaffAdmin({ action: 'attach', staffId, email, password });
}

export async function resetStaffPassword(staffId: string, password: string): Promise<void> {
  await invokeStaffAdmin({ action: 'reset-password', staffId, password });
}

async function invokeStaffAdmin(body: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>('staff-admin', { body });
  // Функция отвечает осмысленным текстом («почта занята»), а supabase-js на
  // не-200 отдаёт общий FunctionsHttpError — вытаскиваем текст из тела.
  if (error) {
    const detail = await readError(error);
    throw new Error(detail ?? 'Не получилось выполнить действие');
  }
  if (data?.error) throw new Error(data.error);
}

async function readError(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response }).context;
  if (!context || typeof context.json !== 'function') return (error as Error).message ?? null;
  try {
    const body = (await context.json()) as { error?: string };
    return body.error ?? null;
  } catch {
    return (error as Error).message ?? null;
  }
}
