import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, Button, Chip, Counter, SegmentedControl, ts } from '@food/ui';
import {
  countShared,
  extrasPrice,
  formatPrice,
  pluralGuests,
  type SplitLine,
  type SplitMode,
  type SplitState,
  splitTotals,
} from '@food/domain';
import { describeSelections, findDish, resolveDishPrice } from '../data/menuRepository';
import { useCart } from '../state/cartStore';
import styles from './SplitPage.module.css';

const MIN_GUESTS = 2;
const MAX_GUESTS = 6;

const DEFAULT_SPLIT: SplitState = { mode: 'equal', guests: 2, assignments: {} };

export function SplitPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [draft, setDraft] = useState<SplitState>(cart.split ?? DEFAULT_SPLIT);

  const lines: SplitLine[] = cart.payableItems.flatMap((item) => {
    const dish = findDish(item.dishId);
    if (!dish) return [];
    // Цену считаем ровно как корзина — вместе с добавками: иначе сумма долей
    // расходится с итогом счёта прямо на глазах у гостя.
    const unitPrice = resolveDishPrice(dish, item.selections) + extrasPrice(item.extras);
    return [{ key: item.key, total: unitPrice * item.quantity }];
  });

  if (lines.length === 0) {
    return (
      <div className={styles.page}>
        <AppHeader title="Разделить счёт" onBack={() => navigate('/cart')} />
        <div className={styles.empty}>
          <p className={[styles.emptyText, ts('body-m/regular')].join(' ')}>
            Делить пока нечего — в корзине пусто.
          </p>
          <Button onClick={() => navigate('/menu')}>Открыть меню</Button>
        </div>
      </div>
    );
  }

  // Цену строки берём из той же раскладки, что и доли: два разных расчёта
  // одного числа расходятся на первой же добавке.
  const lineTotals = new Map(lines.map((line) => [line.key, line.total]));
  const totals = splitTotals(lines, draft);
  const sharedCount = countShared(lines, draft);

  const assign = (key: string, guest: number) => {
    setDraft((current) => {
      const assignments = { ...current.assignments };
      // Повторный тап по тому же гостю возвращает позицию в общие.
      if (assignments[key] === guest) delete assignments[key];
      else assignments[key] = guest;
      return { ...current, assignments };
    });
  };

  const changeGuests = (guests: number) => {
    setDraft((current) => ({
      ...current,
      guests,
      // Гостя убрали — его позиции снова становятся общими, иначе они
      // повисли бы на несуществующем госте и пропали из раскладки.
      assignments: Object.fromEntries(
        Object.entries(current.assignments).filter(([, guest]) => guest < guests),
      ),
    }));
  };

  return (
    <div className={styles.page}>
      <AppHeader
        title="Разделить счёт"
        subtitle="Раскладку покажете официанту"
        onBack={() => navigate('/cart')}
      />

      <section className={styles.section}>
        <div className={styles.guests}>
          <span className={[styles.guestsLabel, ts('body-m/medium')].join(' ')}>
            {draft.guests} {pluralGuests(draft.guests)} за столом
          </span>
          <Counter
            value={draft.guests}
            min={MIN_GUESTS}
            max={MAX_GUESTS}
            onChange={changeGuests}
            variant="main"
            size="l"
            label="гостей"
          />
        </div>

        <SegmentedControl
          aria-label="Как делим счёт"
          value={draft.mode}
          onChange={(mode: SplitMode) => setDraft((current) => ({ ...current, mode }))}
          options={[
            { value: 'equal', label: 'Поровну' },
            { value: 'items', label: 'По блюдам' },
          ]}
        />
      </section>

      {draft.mode === 'items' ? (
        <section className={styles.section}>
          <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Чьё блюдо</h2>
          <p className={[styles.hint, ts('body-s/regular')].join(' ')}>
            Отметьте гостя у позиции. Неотмеченные делятся на всех — сейчас таких {sharedCount}.
          </p>
          <ul className={styles.lines}>
            {cart.payableItems.map((item) => {
              const dish = findDish(item.dishId);
              if (!dish) return null;
              const selections = describeSelections(dish, item.selections);
              const owner = draft.assignments[item.key];
              return (
                <li key={item.key} className={styles.line}>
                  <div className={styles.lineHead}>
                    <span className={[styles.lineName, ts('body-s/medium')].join(' ')}>
                      {item.quantity} × {dish.name}
                      {selections ? <span className={styles.lineOptions}> · {selections}</span> : null}
                    </span>
                    <span className={[styles.linePrice, ts('body-s/medium')].join(' ')}>
                      {formatPrice(lineTotals.get(item.key) ?? 0)}
                    </span>
                  </div>
                  <div className={styles.owners}>
                    {Array.from({ length: draft.guests }, (_, guest) => (
                      <Chip
                        key={guest}
                        selected={owner === guest}
                        aria-label={`Гость ${guest + 1}`}
                        onClick={() => assign(item.key, guest)}
                      >
                        Г{guest + 1}
                      </Chip>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className={styles.section}>
        <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Кто сколько платит</h2>
        <ul className={styles.totals}>
          {totals.map((total, guest) => (
            <li key={guest} className={styles.total}>
              <span className={[styles.totalLabel, ts('body-s/regular')].join(' ')}>Гость {guest + 1}</span>
              <span className={[styles.totalValue, ts('heading-9/extrabold')].join(' ')}>{formatPrice(total)}</span>
            </li>
          ))}
        </ul>
        <p className={[styles.hint, ts('body-xs/regular')].join(' ')}>
          Итого {formatPrice(cart.totalPrice)} — остаток от деления добавлен первым гостям, чтобы сумма долей
          сходилась со счётом.
        </p>
      </section>

      <div className={styles.footer}>
        <Button block onClick={() => { cart.setSplit(draft); navigate('/cart'); }}>
          Сохранить раскладку
        </Button>
        {cart.split ? (
          <Button block variant="secondary" onClick={() => { cart.setSplit(null); navigate('/cart'); }}>
            Не делить
          </Button>
        ) : null}
      </div>
    </div>
  );
}
