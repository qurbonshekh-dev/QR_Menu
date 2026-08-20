// Единственная точка доступа к тикетам. Экран не знает, откуда они приходят —
// сейчас это локальная имитация ленты, дальше сюда встаёт realtime-подписка
// Supabase на таблицу orders. Тот же шов, что menuRepository и floorRepository.
import type { KitchenTicket } from '@food/domain';

const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60000).toISOString();

/** Стартовая очередь. Времена разнесены нарочно: на экране сразу видны все три
 *  стадии старения тикета — зелёная, оранжевая и красная. */
function seedTickets(): KitchenTicket[] {
  return [
    {
      id: '5112',
      table: '7',
      placedAt: minutesAgo(17),
      servingMode: 'together',
      comment: 'Гость торопится — рейс через час',
      status: 'cooking',
      items: [
        { id: 'i-1', title: 'Пицца Пепперони', quantity: 1, options: '25 см · Тонкое' },
        { id: 'i-2', title: 'Цезарь с курицей', quantity: 2, comment: 'Без анчоусов' },
      ],
    },
    {
      id: '5114',
      table: '12',
      placedAt: minutesAgo(9),
      servingMode: 'ready',
      status: 'cooking',
      items: [
        { id: 'i-3', title: 'Том ям', quantity: 2 },
        { id: 'i-4', title: 'Курица терияки', quantity: 1, comment: 'Поострее' },
      ],
    },
    {
      id: '5117',
      table: '3',
      placedAt: minutesAgo(4),
      servingMode: 'ready',
      status: 'queued',
      items: [
        { id: 'i-5', title: 'Бургер с говядиной', quantity: 3 },
        { id: 'i-6', title: 'Лимонад домашний', quantity: 3 },
      ],
    },
    {
      id: '5118',
      table: '21',
      placedAt: minutesAgo(1),
      servingMode: 'together',
      comment: 'Детский стульчик, подать салат первым',
      status: 'queued',
      items: [
        { id: 'i-7', title: 'Пицца Маргарита', quantity: 1, options: '21 см · Традиционное' },
        { id: 'i-8', title: 'Греческий салат', quantity: 1 },
      ],
    },
  ];
}

/** Заготовки для имитации новых заказов — по одному раз в INCOMING_MS. */
const incoming: Omit<KitchenTicket, 'id' | 'placedAt'>[] = [
  {
    table: '9',
    servingMode: 'ready',
    status: 'queued',
    items: [
      { id: 'n-1', title: 'Паста карбонара', quantity: 2 },
      { id: 'n-2', title: 'Капучино', quantity: 2 },
    ],
  },
  {
    table: '15',
    servingMode: 'together',
    comment: 'Аллергия на орехи',
    status: 'queued',
    items: [
      { id: 'n-3', title: 'Салат с тунцом', quantity: 1 },
      { id: 'n-4', title: 'Крем-суп из тыквы', quantity: 1 },
      { id: 'n-5', title: 'Тирамису', quantity: 2 },
    ],
  },
];

const INCOMING_MS = 25_000;

/**
 * Подписка на ленту тикетов. Форма намеренно повторяет realtime-канал Supabase:
 * первый вызов отдаёт текущую очередь, дальше приходят новые заказы, а функция
 * отписки останавливает поток.
 */
export function subscribeTickets(onChange: (tickets: KitchenTicket[]) => void): () => void {
  let tickets = seedTickets();
  onChange(tickets);

  let index = 0;
  const timer = setInterval(() => {
    const template = incoming[index % incoming.length];
    index += 1;
    const ticket: KitchenTicket = {
      ...template,
      id: String(5120 + index),
      placedAt: new Date().toISOString(),
      items: template.items.map((item) => ({ ...item, id: `${item.id}-${index}` })),
    };
    tickets = [...tickets, ticket];
    onChange(tickets);
  }, INCOMING_MS);

  return () => clearInterval(timer);
}
