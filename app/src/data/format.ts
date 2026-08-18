const priceFormat = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

/** Цена в рублях без копеек: 620 → «620 ₽». */
export function formatPrice(value: number): string {
  return priceFormat.format(value);
}
