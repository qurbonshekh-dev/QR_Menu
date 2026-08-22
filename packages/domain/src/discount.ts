/**
 * Скидка на чек. Ресторан даёт её процентом («минус десять за ожидание») или
 * суммой («округлим до сотни»), поэтому в домене живут оба способа и один
 * расчёт: считать процент в кассе, а сумму в отчёте значит развести два числа.
 */

export type DiscountMode = 'percent' | 'amount';

/**
 * Выше какого процента скидку подтверждает менеджер. Порог назначает ресторан;
 * двадцать — то, с чем можно начать: столько стоит извинение за долгое блюдо,
 * а всё, что больше, — уже решение о деньгах заведения.
 */
export const DISCOUNT_APPROVAL_PERCENT = 20;

/** Сумма скидки в сомони. Больше счёта не бывает: чек в минус не уходит. */
export function discountAmount(subtotal: number, mode: DiscountMode, value: number): number {
  if (!Number.isFinite(value) || value <= 0 || subtotal <= 0) return 0;
  const amount = mode === 'percent' ? (subtotal * value) / 100 : value;
  return Math.min(Math.round(amount), subtotal);
}

/** Сколько это в процентах — для порога подтверждения и для строки чека. */
export function discountPercent(subtotal: number, amount: number): number {
  if (subtotal <= 0 || amount <= 0) return 0;
  return Math.round((amount / subtotal) * 100);
}

/** Скидку выше порога кассир поставить не может — это решение менеджера. */
export function needsApproval(subtotal: number, amount: number): boolean {
  return discountPercent(subtotal, amount) > DISCOUNT_APPROVAL_PERCENT;
}
