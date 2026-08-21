import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppHeader, Badge, Button, Counter, FormRow, OptionGroup, StarIcon, Toggle, ts } from '@food/ui';
import {
  cartKey,
  type Dish,
  type DishExtra,
  type DishSelections,
  extrasPrice,
  formatPrice,
} from '@food/domain';
import { defaultSelections, dishImage, formatMeta, getDish, isAvailable, resolveDishPrice } from '../data/menuRepository';
import { useCart } from '../state/cartStore';
import styles from './DishPage.module.css';

interface EditState {
  /** Выбор редактируемой строки корзины — приходит по «Изменить». */
  selections?: DishSelections;
  /** Модификаторы редактируемой строки: «без лука» правится там же, где размер. */
  removed?: string[];
  extras?: DishExtra[];
  /** Ключ строки до правки: размер сменили — ключ станет другим, старую строку убираем. */
  cartKey?: string;
}

export function DishPage() {
  const { dishId = '' } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const edit = (useLocation().state ?? {}) as EditState;
  const [dish, setDish] = useState<Dish | null | undefined>(undefined);
  const [selections, setSelections] = useState<DishSelections>({});
  const [removed, setRemoved] = useState<string[]>(edit.removed ?? []);
  const [extras, setExtras] = useState<DishExtra[]>(edit.extras ?? []);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    getDish(dishId).then((found) => {
      setDish(found ?? null);
      // Пришли по «Изменить» — открываем блюдо с тем выбором, который уже
      // лежит в корзине, иначе правка молча сбросила бы его на дефолт.
      if (found) setSelections(edit.selections ?? defaultSelections(found));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishId]);

  const hasOptions = Boolean(dish?.optionGroups?.length);
  const key = useMemo(
    () => (dish ? cartKey(dish.id, hasOptions ? selections : undefined, removed, extras) : ''),
    [dish, hasOptions, selections, removed, extras],
  );

  // Смена размера/теста указывает на другую строку корзины — подтягиваем её
  // текущее количество, чтобы счётчик не врал.
  useEffect(() => {
    if (!dish) return;
    setQuantity(Math.max(1, cart.quantityOfKey(key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (dish === undefined) {
    return <p className={[styles.state, ts('body-m/regular')].join(' ')}>Загружаем блюдо…</p>;
  }

  if (dish === null) {
    return (
      <div className={styles.page}>
        <AppHeader title="Блюдо не найдено" onBack={() => navigate('/menu')} />
        <div className={styles.body}>
          <Button onClick={() => navigate('/menu')}>Вернуться в меню</Button>
        </div>
      </div>
    );
  }

  const inCart = cart.quantityOfKey(key) > 0;
  const unitPrice = resolveDishPrice(dish, selections) + extrasPrice(extras);

  const toggleRemoved = (ingredient: string) =>
    setRemoved((current) =>
      current.includes(ingredient) ? current.filter((item) => item !== ingredient) : [...current, ingredient],
    );

  const toggleExtra = (extra: DishExtra) =>
    setExtras((current) =>
      current.some((item) => item.id === extra.id)
        ? current.filter((item) => item.id !== extra.id)
        : [...current, extra],
    );
  const available = isAvailable(dish);
  const editing = Boolean(edit.cartKey);

  return (
    <div className={styles.page}>
      <AppHeader title={dish.name} onBack={() => navigate(-1)} />

      <div className={styles.media}>
        <img className={styles.image} src={dishImage(dish.image)} alt={dish.name} />
        {dish.rating !== undefined ? (
          <span className={styles.rating}>
            <Badge tone="overlay">
              {dish.rating.toFixed(1)}
              <StarIcon size={12} className={styles.star} />
            </Badge>
          </span>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.headline}>
          <p className={[styles.price, ts('heading-7/bold')].join(' ')}>{formatPrice(unitPrice)}</p>
          <p className={[styles.meta, ts('body-s/medium')].join(' ')}>{formatMeta(dish)}</p>
        </div>

        <p className={[styles.description, ts('body-m/regular')].join(' ')}>{dish.description}</p>

        {dish.optionGroups?.map((group) => (
          <section key={group.id} className={styles.section}>
            <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>{group.title}</h2>
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
          </section>
        ))}

        {/* КБЖУ: калории были и раньше, белки-жиры-углеводы обещаны ТЗ. */}
        {dish.protein !== undefined || dish.fat !== undefined || dish.carbs !== undefined ? (
          <section className={styles.section}>
            <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>КБЖУ на порцию</h2>
            <div className={styles.macros}>
              {[
                { label: 'ккал', value: dish.calories },
                { label: 'белки', value: dish.protein },
                { label: 'жиры', value: dish.fat },
                { label: 'углеводы', value: dish.carbs },
              ].map((macro) => (
                <span key={macro.label} className={styles.macro}>
                  <span className={[styles.macroValue, ts('body-m/bold')].join(' ')}>
                    {macro.value ?? '—'}
                    {macro.label === 'ккал' ? '' : ' г'}
                  </span>
                  <span className={[styles.macroLabel, ts('body-xs/regular')].join(' ')}>{macro.label}</span>
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {dish.ingredients.length ? (
          <section className={styles.section}>
            <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Состав</h2>
            {/* Убрать можно только то, что в блюде и так есть, — поэтому список
                состава и список «убрать» это одно и то же. */}
            <div className={styles.rows}>
              {dish.ingredients.map((ingredient) => (
                <FormRow
                  key={ingredient}
                  label={
                    removed.includes(ingredient) ? (
                      <span className={styles.removed}>{ingredient}</span>
                    ) : (
                      ingredient
                    )
                  }
                  action={
                    <Toggle
                      label=""
                      aria-label={`Убрать «${ingredient}»`}
                      checked={!removed.includes(ingredient)}
                      onChange={() => toggleRemoved(ingredient)}
                    />
                  }
                />
              ))}
            </div>
            <p className={[styles.hint, ts('body-xs/regular')].join(' ')}>
              Выключите то, чего не хотите, — кухня увидит это в заказе.
            </p>
          </section>
        ) : null}

        {dish.extras?.length ? (
          <section className={styles.section}>
            <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Добавить</h2>
            <div className={styles.rows}>
              {dish.extras.map((extra) => (
                <FormRow
                  key={extra.id}
                  label={`${extra.name} · ${formatPrice(extra.price)}`}
                  action={
                    <Toggle
                      label=""
                      aria-label={`Добавить «${extra.name}»`}
                      checked={extras.some((item) => item.id === extra.id)}
                      onChange={() => toggleExtra(extra)}
                    />
                  }
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className={styles.actions}>
        <Counter
          value={quantity}
          onChange={setQuantity}
          min={1}
          variant="main"
          size="l"
          label={`«${dish.name}»`}
        />
        <Button
          block
          disabled={!available}
          variant={available ? 'main' : 'disable'}
          onClick={() => {
            // Размер сменили — строка корзины получает другой ключ, поэтому
            // прежнюю убираем, чтобы правка не превратилась в дубль.
            if (edit.cartKey && edit.cartKey !== key) {
              cart.setQuantity(edit.cartKey, 0, dish.id, edit.selections);
            }
            cart.setQuantity(key, quantity, dish.id, hasOptions ? selections : undefined, removed, extras);
            navigate('/cart');
          }}
        >
          {!available
            ? 'Нет в наличии'
            : editing
              ? 'Сохранить изменения'
              : inCart
                ? 'Обновить корзину'
                : `В корзину · ${formatPrice(unitPrice * quantity)}`}
        </Button>
      </div>
    </div>
  );
}
