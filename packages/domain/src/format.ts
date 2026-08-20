// Intl.NumberFormat не знает таджикский сомони в нужном нам виде («55 с.»,
// а не «TJS 55,00»), поэтому форматируем вручную: группировка по разрядам
// через toLocaleString + суффикс «с.» — так сомони пишут в меню Душанбе.
const grouping = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** Цена в сомони без дирамов: 55 → «55 с.», 1240 → «1 240 с.». */
export function formatPrice(value: number): string {
  return `${grouping.format(value)} с.`;
}
