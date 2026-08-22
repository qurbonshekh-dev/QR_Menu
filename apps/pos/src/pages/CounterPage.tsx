import { useEffect, useMemo, useState } from 'react';
import {
  closeBill,
  fetchMenu,
  placeCounterOrder,
  type PlacedOrderItem,
} from '@food/api';
import {
  canApproveMoney,
  cartKey,
  defaultSelections,
  describeCartModifiers,
  describeSelections,
  discountAmount,
  DISCOUNT_APPROVAL_PERCENT,
  extrasPrice,
  formatPrice,
  needsApproval,
  resolveDishPrice,
  type Dish,
  type DiscountMode,
  type DishExtra,
  type DishSelections,
  type Menu,
} from '@food/domain';
import { Button, Chip, OptionGroup, SearchField, TextInput, ts } from '@food/ui';
import { useAuth } from '@food/staff';
import { useCashShift } from '../state/cashShiftStore';
import styles from './CounterPage.module.css';

interface Line {
  key: string;
  dish: Dish;
  selections: DishSelections;
  extras: DishExtra[];
  quantity: number;
}

function linePrice(line: Line): number {
  return (resolveDishPrice(line.dish, line.selections) + extrasPrice(line.extras)) * line.quantity;
}

/**
 * Заказ у стойки: кофе с собой, бар. Каталог слева, чек справа — как у любой
 * кассы: гость стоит напротив, и кассир не должен переключать экраны, чтобы
 * добавить вторую позицию.
 */
export function CounterPage() {
  const { me } = useAuth();
  const { shift, refresh } = useCashShift();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [tuning, setTuning] = useState<Dish | null>(null);
  const [discountMode, setDiscountMode] = useState<DiscountMode>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    void fetchMenu().then(setMenu);
  }, []);

  const dishes = useMemo(() => {
    if (!menu) return [];
    const text = query.trim().toLowerCase();
    return menu.dishes.filter((dish) => {
      if (dish.available === false) return false;
      if (category !== 'all' && dish.categoryId !== category) return false;
      if (!text) return true;
      return dish.name.toLowerCase().includes(text);
    });
  }, [menu, category, query]);

  const subtotal = lines.reduce((sum, line) => sum + linePrice(line), 0);
  const discount = discountAmount(subtotal, discountMode, Number(discountValue.replace(',', '.')));
  const total = subtotal - discount;
  const approvalNeeded = needsApproval(subtotal, discount);
  const canDiscount = !approvalNeeded || (me ? canApproveMoney(me.role) : false);

  const add = (dish: Dish, selections: DishSelections = defaultSelections(dish), extras: DishExtra[] = []) => {
    const key = cartKey(dish.id, selections, [], extras);
    setDone(null);
    setLines((current) => {
      const found = current.find((line) => line.key === key);
      if (found) {
        return current.map((line) => (line.key === key ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...current, { key, dish, selections, extras, quantity: 1 }];
    });
  };

  const changeQuantity = (key: string, delta: number) => {
    setLines((current) =>
      current
        .map((line) => (line.key === key ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0),
    );
  };

  const pay = async () => {
    if (lines.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const items: PlacedOrderItem[] = lines.map((line) => ({
        dishSlug: line.dish.id,
        title: line.dish.name,
        options: describeSelections(line.dish, line.selections) ?? undefined,
        modifiers: describeCartModifiers([], line.extras) ?? undefined,
        quantity: line.quantity,
        unitPrice: resolveDishPrice(line.dish, line.selections) + extrasPrice(line.extras),
      }));

      // Сначала заказ — он уходит на кухню, — и сразу чек: у стойки гость
      // расплачивается вперёд, а не после еды.
      const order = await placeCounterOrder({ items, total: subtotal, staffId: me?.id });
      await closeBill({
        orderIds: [order.id],
        payments: [{ method: 'cash', amount: total }],
        cashierId: me?.id,
        cashShiftId: shift?.id,
        discount,
        discountReason: discount > 0 ? discountReason.trim() || 'Без причины' : undefined,
      });

      await refresh();
      setLines([]);
      setDiscountValue('');
      setDiscountReason('');
      setDone(order.number);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось пробить чек');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.catalog} aria-label="Меню">
        <div className={styles.search}>
          <SearchField
            label="Поиск по меню"
            placeholder="Капучино, самбуса…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className={styles.categories}>
          <Chip selected={category === 'all'} onClick={() => setCategory('all')}>
            Всё меню
          </Chip>
          {(menu?.categories ?? []).map((item) => (
            <Chip key={item.id} selected={category === item.id} onClick={() => setCategory(item.id)}>
              {item.name}
            </Chip>
          ))}
        </div>

        <div className={styles.grid}>
          {dishes.map((dish) => (
            <button
              key={dish.id}
              type="button"
              className={styles.tile}
              onClick={() => (dish.optionGroups?.length || dish.extras?.length ? setTuning(dish) : add(dish))}
            >
              <span className={[styles.tileName, ts('body-m/medium')].join(' ')}>{dish.name}</span>
              <span className={[styles.tilePrice, ts('body-s/regular')].join(' ')}>
                {formatPrice(dish.price)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <aside className={styles.check} aria-label="Текущий чек">
        <h2 className={[styles.checkTitle, ts('heading-7/bold')].join(' ')}>Чек</h2>

        {lines.length === 0 ? (
          <p className={[styles.hint, ts('body-m/regular')].join(' ')}>
            {done ? `Заказ №${done} пробит. Начните следующий — просто выберите блюдо.` : 'Выберите блюда слева.'}
          </p>
        ) : (
          <ul className={styles.lines}>
            {lines.map((line) => (
              <li key={line.key} className={styles.line}>
                <div className={styles.lineHead}>
                  <span className={[styles.lineTitle, ts('body-s/medium')].join(' ')}>{line.dish.name}</span>
                  <span className={[styles.linePrice, ts('body-s/medium')].join(' ')}>
                    {formatPrice(linePrice(line))}
                  </span>
                </div>
                {describeSelections(line.dish, line.selections) || line.extras.length > 0 ? (
                  <span className={[styles.lineNote, ts('body-xs/regular')].join(' ')}>
                    {[describeSelections(line.dish, line.selections), describeCartModifiers([], line.extras)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                ) : null}
                <div className={styles.counter}>
                  <button type="button" className={styles.step} onClick={() => changeQuantity(line.key, -1)}>
                    −
                  </button>
                  <span className={ts('body-s/medium')}>{line.quantity}</span>
                  <button type="button" className={styles.step} onClick={() => changeQuantity(line.key, 1)}>
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.discount}>
          <div className={styles.discountRow}>
            <Chip selected={discountMode === 'percent'} onClick={() => setDiscountMode('percent')}>
              Скидка %
            </Chip>
            <Chip selected={discountMode === 'amount'} onClick={() => setDiscountMode('amount')}>
              Скидка с.
            </Chip>
            <TextInput
              label={discountMode === 'percent' ? 'Процент' : 'Сумма'}
              inputMode="numeric"
              value={discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
            />
          </div>
          {discount > 0 ? (
            <TextInput
              label="За что скидка"
              value={discountReason}
              onChange={(event) => setDiscountReason(event.target.value)}
            />
          ) : null}
          {approvalNeeded && !canDiscount ? (
            <p className={[styles.error, ts('body-xs/regular')].join(' ')}>
              Скидку больше {DISCOUNT_APPROVAL_PERCENT}% ставит менеджер.
            </p>
          ) : null}
        </div>

        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span className={ts('body-s/regular')}>Позиции</span>
            <span className={ts('body-s/medium')}>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 ? (
            <div className={styles.totalRow}>
              <span className={ts('body-s/regular')}>Скидка</span>
              <span className={ts('body-s/medium')}>−{formatPrice(discount)}</span>
            </div>
          ) : null}
          <div className={styles.totalRow}>
            <span className={ts('body-m/regular')}>К оплате</span>
            <span className={ts('heading-8/bold')}>{formatPrice(total)}</span>
          </div>
        </div>

        {error ? <p className={[styles.error, ts('body-s/regular')].join(' ')}>{error}</p> : null}
        {!shift ? (
          <p className={[styles.warn, ts('body-xs/regular')].join(' ')}>
            Смена не открыта — чек не попадёт в отчёт. Откройте её на экране зала.
          </p>
        ) : null}

        <Button block disabled={busy || lines.length === 0 || !canDiscount} onClick={() => void pay()}>
          {busy ? 'Пробиваем…' : `Оплатить наличными · ${formatPrice(total)}`}
        </Button>
      </aside>

      {tuning ? (
        <DishSheet
          dish={tuning}
          onClose={() => setTuning(null)}
          onAdd={(selections, extras) => {
            add(tuning, selections, extras);
            setTuning(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** Выбор размера и добавок — то же, что видит гость, только в один экран:
 *  у стойки очередь, и листать блюдо кассиру некогда. */
function DishSheet({
  dish,
  onAdd,
  onClose,
}: {
  dish: Dish;
  onAdd: (selections: DishSelections, extras: DishExtra[]) => void;
  onClose: () => void;
}) {
  const [selections, setSelections] = useState<DishSelections>(() => defaultSelections(dish));
  const [extras, setExtras] = useState<DishExtra[]>([]);

  const price = resolveDishPrice(dish, selections) + extrasPrice(extras);

  return (
    <div className={styles.sheetBackdrop} role="dialog" aria-label={dish.name}>
      <div className={styles.sheet}>
        <h3 className={[styles.sheetTitle, ts('heading-8/bold')].join(' ')}>{dish.name}</h3>

        {(dish.optionGroups ?? []).map((group) => (
          <div key={group.id} className={styles.group}>
            <span className={[styles.sheetLabel, ts('body-s/medium')].join(' ')}>{group.title}</span>
            <OptionGroup
              aria-label={group.title}
              layout={group.layout}
              value={selections[group.id] ?? group.defaultOptionId}
              onChange={(optionId) => setSelections((current) => ({ ...current, [group.id]: optionId }))}
              options={group.options.map((option) => ({
                id: option.id,
                caption: option.caption,
                label: group.layout === 'detailed' ? formatPrice(option.price ?? dish.price) : (option.label ?? ''),
              }))}
            />
          </div>
        ))}

        {(dish.extras ?? []).length > 0 ? (
          <div className={styles.extras}>
            <span className={[styles.sheetLabel, ts('body-s/medium')].join(' ')}>Добавить</span>
            <div className={styles.extrasRow}>
              {(dish.extras ?? []).map((extra) => (
                <Chip
                  key={extra.id}
                  selected={extras.some((item) => item.id === extra.id)}
                  onClick={() =>
                    setExtras((current) =>
                      current.some((item) => item.id === extra.id)
                        ? current.filter((item) => item.id !== extra.id)
                        : [...current, extra],
                    )
                  }
                >
                  {extra.name} · {formatPrice(extra.price)}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        <div className={styles.sheetActions}>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={() => onAdd(selections, extras)}>В чек · {formatPrice(price)}</Button>
        </div>
      </div>
    </div>
  );
}
