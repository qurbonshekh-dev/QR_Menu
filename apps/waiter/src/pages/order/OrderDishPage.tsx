import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader, Button, Counter, FormRow, OptionGroup, TextArea, Toggle, ts } from '@food/ui';
import {
  defaultSelections,
  describeSelections,
  formatPrice,
  resolveDishPrice,
  SERVE_PRESETS,
  type Dish,
  type DishExtra,
  type DishSelections,
} from '@food/domain';
import { dishImage, getMenu } from '../../data/menuRepository';
import { useDraft } from '../../state/draftStore';
import styles from './OrderDishPage.module.css';

/** Блюдо глазами официанта: размер и тесто как у гостя, плюс три вещи, которых
 *  у гостя нет, — кому нести, что убрать/добавить и когда подать. */
export function OrderDishPage() {
  const { tableId = '', slug = '' } = useParams();
  const navigate = useNavigate();
  const { draft, addLine } = useDraft();

  const [dish, setDish] = useState<Dish | null>(null);
  const [selections, setSelections] = useState<DishSelections>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [extras, setExtras] = useState<DishExtra[]>([]);
  const [guest, setGuest] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState('');
  const [serveAfter, setServeAfter] = useState<number | undefined>(undefined);

  useEffect(() => {
    void getMenu().then((menu) => {
      const found = menu.dishes.find((item) => item.id === slug) ?? null;
      setDish(found);
      if (found) setSelections(defaultSelections(found));
    });
  }, [slug]);

  const basePrice = useMemo(() => (dish ? resolveDishPrice(dish, selections) : 0), [dish, selections]);
  const price = basePrice + extras.reduce((sum, extra) => sum + extra.price, 0);

  if (!draft) {
    // Черновика нет — значит, экран открыли по прямой ссылке; вернуть в зал
    // честнее, чем показывать блюдо, которое некуда добавить.
    navigate(`/table/${tableId}/guests`, { replace: true });
    return null;
  }

  const toggleRemoved = (ingredient: string) =>
    setRemoved((current) =>
      current.includes(ingredient)
        ? current.filter((item) => item !== ingredient)
        : [...current, ingredient],
    );

  const toggleExtra = (extra: DishExtra) =>
    setExtras((current) =>
      current.some((item) => item.id === extra.id)
        ? current.filter((item) => item.id !== extra.id)
        : [...current, extra],
    );

  const add = () => {
    if (!dish) return;
    addLine({
      dishId: dish.id,
      title: dish.name,
      basePrice,
      quantity,
      guest,
      options: describeSelections(dish, selections) ?? undefined,
      removed,
      extras,
      comment: comment.trim() || undefined,
      serveAfterMinutes: serveAfter,
    });
    navigate(`/table/${tableId}/menu`);
  };

  return (
    <div className={styles.page}>
      <AppHeader
        title={dish?.name ?? 'Блюдо'}
        subtitle={dish ? `${dish.calories} ккал | ${dish.weight} гр` : undefined}
        onBack={() => navigate(`/table/${tableId}/menu`)}
      />

      {dish ? (
        <div className={styles.body}>
          <img className={styles.photo} src={dishImage(dish.image)} alt="" />

          {dish.optionGroups?.map((group) => (
            <section key={group.id} className={styles.block}>
              <h2 className={[styles.blockTitle, ts('body-m/medium')].join(' ')}>{group.title}</h2>
              <OptionGroup
                aria-label={group.title}
                layout={group.layout}
                value={selections[group.id] ?? group.defaultOptionId}
                onChange={(id) => setSelections((current) => ({ ...current, [group.id]: id }))}
                options={group.options.map((option) => ({
                  id: option.id,
                  caption: option.caption,
                  label: option.price ? formatPrice(option.price) : (option.label ?? ''),
                }))}
              />
            </section>
          ))}

          {dish.ingredients.length ? (
            <section className={styles.block}>
              <h2 className={[styles.blockTitle, ts('body-m/medium')].join(' ')}>Убрать из блюда</h2>
              <div className={styles.rows}>
                {dish.ingredients.map((ingredient) => (
                  <FormRow
                    key={ingredient}
                    label={ingredient}
                    action={
                      <Toggle
                        label=""
                        checked={removed.includes(ingredient)}
                        onChange={() => toggleRemoved(ingredient)}
                      />
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          {dish.extras?.length ? (
            <section className={styles.block}>
              <h2 className={[styles.blockTitle, ts('body-m/medium')].join(' ')}>Добавить</h2>
              <div className={styles.rows}>
                {dish.extras.map((extra) => (
                  <FormRow
                    key={extra.id}
                    label={`${extra.name} · ${formatPrice(extra.price)}`}
                    action={
                      <Toggle
                        label=""
                        checked={extras.some((item) => item.id === extra.id)}
                        onChange={() => toggleExtra(extra)}
                      />
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.block}>
            <h2 className={[styles.blockTitle, ts('body-m/medium')].join(' ')}>Кому</h2>
            <OptionGroup
              aria-label="Кому из гостей"
              value={guest === null ? 'all' : String(guest)}
              onChange={(id) => setGuest(id === 'all' ? null : Number(id))}
              options={[
                { id: 'all', label: 'На стол' },
                ...Array.from({ length: draft.guests }, (_, index) => ({
                  id: String(index),
                  label: `Гость ${index + 1}`,
                })),
              ]}
            />
          </section>

          <section className={styles.block}>
            <h2 className={[styles.blockTitle, ts('body-m/medium')].join(' ')}>Когда подать</h2>
            <OptionGroup
              aria-label="Время подачи"
              value={serveAfter === undefined ? 'ready' : String(serveAfter)}
              onChange={(id) => setServeAfter(id === 'ready' ? undefined : Number(id))}
              options={SERVE_PRESETS.map((preset) => ({
                id: preset.minutes === undefined ? 'ready' : String(preset.minutes),
                label: preset.label,
              }))}
            />
          </section>

          <section className={styles.block}>
            <TextArea
              label="Комментарий кухне"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </section>
        </div>
      ) : (
        <p className={[styles.state, ts('body-m/regular')].join(' ')}>Открываем блюдо…</p>
      )}

      <div className={styles.footer}>
        <Counter value={quantity} onChange={setQuantity} min={1} size="l" variant="secondary" />
        <Button block onClick={add} disabled={!dish}>
          Добавить · {formatPrice(price * quantity)}
        </Button>
      </div>
    </div>
  );
}
