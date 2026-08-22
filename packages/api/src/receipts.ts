import { supabase, currentRestaurantId } from './client';

/**
 * Деньги: кассовая смена, чек и платежи по нему.
 *
 * Чек выписывает серверная функция `close_bill` — одна на всех, кто закрывает
 * счёт (касса, официант, гостевая оплата). Если бы каждый писал `paid` сам,
 * выручка существовала бы только как сумма заказов, и Z-отчёт разошёлся бы
 * с кассой на первой же смене.
 */

/** Чем расплатились. Возврат — это отрицательная сумма, а не отдельный метод. */
export type PaymentMethod = 'cash' | 'card' | 'qr';

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  /** Сдача — только для наличных: в отчёте она не выручка, а движение ящика. */
  changeGiven?: number;
  /** Идентификатор транзакции у провайдера — для QR и карты. */
  providerRef?: string;
  status?: 'pending' | 'paid' | 'failed';
}

export interface CloseBillInput {
  orderIds: string[];
  payments?: PaymentInput[];
  cashierId?: string;
  cashShiftId?: string;
  discount?: number;
  discountReason?: string;
  tip?: number;
}

/** Незакрытые заказы стола — из них и собирается чек. Касса спрашивает их
 *  отдельно: в составе стола (`fetchTableService`) лежат позиции, а чек
 *  выписывается по заказам. */
export async function fetchOpenOrderIds(tableId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', tableId)
    .in('status', ['queued', 'cooking', 'ready', 'served']);
  if (error) throw error;
  return (data ?? []).map((order) => order.id);
}

/** Закрывает счёт и возвращает id выписанного чека. */
export async function closeBill(input: CloseBillInput): Promise<string> {
  const { data, error } = await supabase.rpc('close_bill', {
    p_order_ids: input.orderIds,
    p_payments: (input.payments ?? []).map((payment) => ({
      method: payment.method,
      amount: payment.amount,
      change_given: payment.changeGiven ?? 0,
      provider_ref: payment.providerRef ?? null,
      status: payment.status ?? 'paid',
    })),
    p_cashier_id: input.cashierId,
    p_cash_shift_id: input.cashShiftId,
    p_discount: input.discount ?? 0,
    p_discount_reason: input.discountReason,
    p_tip: input.tip,
  });
  if (error) throw error;
  return data as string;
}

export interface CashShift {
  id: string;
  cashierId: string;
  cashierName?: string;
  openedAt: string;
  closedAt?: string;
  cashStart: number;
  cashCounted?: number;
  note?: string;
}

function toShift(row: {
  id: string;
  cashier_id: string;
  opened_at: string;
  closed_at: string | null;
  cash_start: number;
  cash_counted: number | null;
  note: string | null;
  staff?: { name: string } | null;
}): CashShift {
  return {
    id: row.id,
    cashierId: row.cashier_id,
    cashierName: row.staff?.name,
    openedAt: row.opened_at,
    closedAt: row.closed_at ?? undefined,
    cashStart: Number(row.cash_start),
    cashCounted: row.cash_counted === null ? undefined : Number(row.cash_counted),
    note: row.note ?? undefined,
  };
}

/** Открытая смена ресторана — она одна: две кассы в зале потребовали бы
 *  привязки чека к рабочему месту, а его в схеме нет. */
export async function fetchOpenCashShift(): Promise<CashShift | null> {
  const restaurantId = await currentRestaurantId();
  const { data, error } = await supabase
    .from('cash_shifts')
    .select('id, cashier_id, opened_at, closed_at, cash_start, cash_counted, note, staff (name)')
    .eq('restaurant_id', restaurantId)
    .is('closed_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? toShift(data) : null;
}

export async function openCashShift(cashierId: string, cashStart: number): Promise<CashShift> {
  const restaurantId = await currentRestaurantId();
  const { data, error } = await supabase
    .from('cash_shifts')
    .insert({ restaurant_id: restaurantId, cashier_id: cashierId, cash_start: cashStart })
    .select('id, cashier_id, opened_at, closed_at, cash_start, cash_counted, note')
    .single();
  if (error) throw error;
  return toShift(data);
}

/** Закрытие смены с инкассацией: сколько денег насчитали в ящике. */
export async function closeCashShift(shiftId: string, cashCounted: number, note?: string): Promise<void> {
  const { error } = await supabase
    .from('cash_shifts')
    .update({ closed_at: new Date().toISOString(), cash_counted: cashCounted, note: note ?? null })
    .eq('id', shiftId);
  if (error) throw error;
}

/** Сводка смены: то, из чего собираются X- и Z-отчёты. */
export interface ShiftSummary {
  receipts: number;
  revenue: number;
  average: number;
  /** Выручка по методам оплаты — возвраты уже вычтены. */
  byMethod: Record<PaymentMethod, number>;
  refunds: number;
  tips: number;
  discounts: number;
  /** Сколько наличных должно быть в ящике: старт + наличная выручка. */
  cashExpected: number;
}

const EMPTY_SUMMARY: ShiftSummary = {
  receipts: 0,
  revenue: 0,
  average: 0,
  byMethod: { cash: 0, card: 0, qr: 0 },
  refunds: 0,
  tips: 0,
  discounts: 0,
  cashExpected: 0,
};

export async function fetchShiftSummary(shift: CashShift | null): Promise<ShiftSummary> {
  if (!shift) return EMPTY_SUMMARY;

  const { data, error } = await supabase
    .from('receipts')
    .select('total, tip, discount, status, receipt_payments (method, amount, status)')
    .eq('cash_shift_id', shift.id);
  if (error) throw error;

  const summary: ShiftSummary = {
    ...EMPTY_SUMMARY,
    byMethod: { cash: 0, card: 0, qr: 0 },
    cashExpected: shift.cashStart,
  };

  for (const receipt of data ?? []) {
    if (receipt.status === 'void') continue;
    summary.receipts += 1;
    summary.revenue += Number(receipt.total);
    summary.tips += Number(receipt.tip);
    summary.discounts += Number(receipt.discount);

    for (const payment of receipt.receipt_payments ?? []) {
      if (payment.status !== 'paid') continue;
      const amount = Number(payment.amount);
      const method = payment.method as PaymentMethod;
      summary.byMethod[method] = (summary.byMethod[method] ?? 0) + amount;
      // Возврат — отрицательный платёж: в выручку он входит со своим знаком,
      // а в строку «возвраты» — по модулю, иначе отчёт читается как ребус.
      if (amount < 0) summary.refunds += -amount;
    }
  }

  summary.average = summary.receipts > 0 ? Math.round(summary.revenue / summary.receipts) : 0;
  summary.cashExpected = shift.cashStart + summary.byMethod.cash;
  return summary;
}

export interface ReceiptLine {
  title: string;
  options?: string;
  modifiers?: string;
  quantity: number;
  unitPrice: number;
}

export interface Receipt {
  id: string;
  number: number;
  tableNumber?: string;
  channel: string;
  subtotal: number;
  discount: number;
  discountReason?: string;
  tip: number;
  total: number;
  status: string;
  createdAt: string;
  items: ReceiptLine[];
  payments: { method: PaymentMethod; amount: number; changeGiven: number }[];
}

export async function fetchReceipt(receiptId: string): Promise<Receipt | null> {
  const { data, error } = await supabase
    .from('receipts')
    .select(
      'id, number, table_number, channel, subtotal, discount, discount_reason, tip, total, status, created_at, receipt_items (title, options, modifiers, quantity, unit_price, sort_order), receipt_payments (method, amount, change_given)',
    )
    .eq('id', receiptId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    number: data.number,
    tableNumber: data.table_number ?? undefined,
    channel: data.channel,
    subtotal: Number(data.subtotal),
    discount: Number(data.discount),
    discountReason: data.discount_reason ?? undefined,
    tip: Number(data.tip),
    total: Number(data.total),
    status: data.status,
    createdAt: data.created_at,
    items: [...(data.receipt_items ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        title: item.title,
        options: item.options ?? undefined,
        modifiers: item.modifiers ?? undefined,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
      })),
    payments: (data.receipt_payments ?? []).map((payment) => ({
      method: payment.method as PaymentMethod,
      amount: Number(payment.amount),
      changeGiven: Number(payment.change_given),
    })),
  };
}
