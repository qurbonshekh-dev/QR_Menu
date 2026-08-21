/**
 * Обслуживание стола глазами официанта: что заказано, кем из гостей и что из
 * этого уже отдано. Кухня двигает тикет целиком, официант носит тарелки
 * конкретному гостю — поэтому у его экрана свой словарь поверх тех же заказов.
 */

/** Что официанту делать с позицией: несут её с кухни, ждёт на раздаче, уже на столе. */
export type ServiceItemStatus = 'cooking' | 'to-serve' | 'served';

const STATUS_LABELS: Record<ServiceItemStatus, string> = {
  cooking: 'Готовится',
  'to-serve': 'Нужно подать',
  served: 'Подано',
};

export function serviceItemStatusLabel(status: ServiceItemStatus): string {
  return STATUS_LABELS[status];
}

/**
 * Статус тарелки на языке официанта. У позиции он теперь свой (`order_items.status`),
 * а статус заказа остаётся запасным вариантом — для строк, заведённых до того,
 * как статус переехал на позицию.
 */
export function serviceItemStatus(status: string): ServiceItemStatus {
  if (status === 'served') return 'served';
  if (status === 'ready') return 'to-serve';
  return 'cooking';
}

export interface ServiceItem {
  id: string;
  /** Номер заказа: одинаковые позиции из разных заказов иначе неотличимы. */
  orderNumber: number;
  title: string;
  quantity: number;
  /** Выбор гостя: «25 см · Тонкое». */
  options?: string;
  /** Пожелание по позиции — официант читает его вслух повару или гостю. */
  comment?: string;
  /** Модификаторы: «без лука · + сыр чеддер». */
  modifiers?: string;
  /** Курс подачи в минутах; undefined — по готовности. */
  serveAfterMinutes?: number;
  unitPrice: number;
  status: ServiceItemStatus;
  /** Индекс гостя (0-based) из раскладки счёта; undefined — позиция общая. */
  guest?: number;
}

export interface ServiceGuestGroup {
  /** Индекс гостя (0-based) или null — позиции, не закреплённые ни за кем. */
  guest: number | null;
  title: string;
  items: ServiceItem[];
  total: number;
}

export function serviceItemTotal(item: ServiceItem): number {
  return item.quantity * item.unitPrice;
}

/**
 * Раскладка позиций стола по гостям. Считает только то, что гость сам закрепил
 * в делении счёта: неназначенные позиции идут отдельной группой «Общие», а не
 * делятся поровну. Официанту нужно знать, кому нести тарелку, — выдуманная
 * доля от общего блюда на этот вопрос не отвечает (для денег есть splitTotals).
 *
 * Пустые группы не показываем: заголовок гостя без позиций официанту не нужен.
 */
export function groupItemsByGuest(items: ServiceItem[], guests: number): ServiceGuestGroup[] {
  const total = (list: ServiceItem[]) => list.reduce((sum, item) => sum + serviceItemTotal(item), 0);

  if (guests <= 1) {
    return items.length ? [{ guest: null, title: 'Позиции стола', items, total: total(items) }] : [];
  }

  const groups: ServiceGuestGroup[] = [];
  const taken = new Set<string>();
  for (let guest = 0; guest < guests; guest += 1) {
    const own = items.filter((item) => item.guest === guest);
    if (!own.length) continue;
    for (const item of own) taken.add(item.id);
    groups.push({ guest, title: `Гость №${guest + 1}`, items: own, total: total(own) });
  }

  // Всё, что не попало ни к одному гостю, — общее. Считаем именно так, а не по
  // `guest === undefined`: индекс за пределами числа гостей иначе выбросил бы
  // позицию с экрана, а не показал её как общую.
  const shared = items.filter((item) => !taken.has(item.id));
  if (shared.length) groups.push({ guest: null, title: 'Общие позиции', items: shared, total: total(shared) });

  return groups;
}
