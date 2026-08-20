import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader, CartBar, Chip, DishCard, SearchField, ts } from '@food/ui';
import { draftTotal, formatPrice, isDishAvailable, pluralGuests, pluralItems, type Menu } from '@food/domain';
import { dishImage, dishMeta, getMenu } from '../../data/menuRepository';
import { useDraft } from '../../state/draftStore';
import styles from './OrderMenuPage.module.css';

/** Каталог глазами официанта. Отличие от гостевого меню одно, но важное:
 *  количество здесь не меняется прямо в карточке — у каждой тарелки есть гость,
 *  модификаторы и время подачи, а это разговор на странице блюда. */
export function OrderMenuPage() {
  const { tableId = '' } = useParams();
  const navigate = useNavigate();
  const { draft } = useDraft();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void getMenu().then(setMenu);
  }, []);

  const dishes = useMemo(() => {
    if (!menu) return [];
    const needle = query.trim().toLowerCase();
    return menu.dishes.filter((dish) => {
      if (category && dish.categoryId !== category) return false;
      if (!needle) return true;
      return dish.name.toLowerCase().includes(needle);
    });
  }, [menu, category, query]);

  const lines = draft?.lines ?? [];
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className={styles.page}>
      <AppHeader
        title={draft ? `Стол №${draft.tableNumber}` : 'Заказ'}
        subtitle={draft ? `${draft.guests} ${pluralGuests(draft.guests)}` : undefined}
        onBack={() => navigate('/')}
      />

      <div className={styles.controls}>
        <SearchField
          label="Поиск по меню"
          placeholder="Найти блюдо"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className={styles.categories}>
          <Chip selected={category === null} onClick={() => setCategory(null)}>
            Всё меню
          </Chip>
          {menu?.categories.map((item) => (
            <Chip key={item.id} selected={category === item.id} onClick={() => setCategory(item.id)}>
              {item.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {dishes.map((dish) => (
          <DishCard
            key={dish.id}
            title={dish.name}
            price={dish.price}
            meta={dishMeta(dish)}
            image={dishImage(dish.image)}
            rating={dish.rating}
            unavailable={!isDishAvailable(dish)}
            quantity={0}
            // Плюс на карточке ведёт туда же, куда и сама карточка: выбрать
            // гостя и модификаторы всё равно придётся.
            onQuantityChange={() => navigate(`/table/${tableId}/dish/${dish.id}`)}
            onOpen={() => navigate(`/table/${tableId}/dish/${dish.id}`)}
          />
        ))}
        {menu && dishes.length === 0 ? (
          <p className={[styles.empty, ts('body-s/regular')].join(' ')}>Ничего не нашлось</p>
        ) : null}
      </div>

      {count > 0 ? (
        <CartBar
          summary={`${count} ${pluralItems(count)}`}
          total={formatPrice(draftTotal(lines))}
          actionLabel="К заказу"
          onAction={() => navigate(`/table/${tableId}/draft`)}
        />
      ) : null}
    </div>
  );
}
