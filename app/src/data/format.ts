// Intl.NumberFormat не знает узбекский сум как валюту с нужным нам видом
// («2 101 с», не «UZS 2 101,00»), поэтому форматируем вручную:
// группировка по разрядам через toLocaleString + суффикс "с".
const grouping = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** Цена в сумах без копеек: 2101 → «2 101 с». */
export function formatPrice(value: number): string {
  return `${grouping.format(value)} с`;
}
