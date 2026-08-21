import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppHeader,
  Button,
  Counter,
  FormRow,
  SearchField,
  SegmentedControl,
  TextArea,
  TextInput,
  Toggle,
  ts,
} from '@food/ui';
import {
  type DeliveryKind,
  deliveryTotal,
  formatPrice,
  type Menu,
  pluralItems,
  resolveDishPrice,
} from '@food/domain';
import { createDelivery } from '@food/api';
import { getMenu } from '../../data/menuRepository';
import styles from './NewDeliveryPage.module.css';

/** Стоимость доставки по умолчанию. Зон доставки в базе нет, тарифной сетки —
 *  тоже, поэтому это просто заполненное поле, которое менеджер правит руками. */
const DEFAULT_DELIVERY_FEE = 15;

interface Line {
  slug: string;
  title: string;
  price: number;
  quantity: number;
}

/**
 * Приём заказа на доставку. Гость звонит или пишет — приложения для внешних
 * заказов у ресторана нет, поэтому заводит его менеджер, и форма спрашивает
 * ровно то, без чего курьер не уедет.
 */
export function NewDeliveryPage() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [query, setQuery] = useState('');
  const [lines, setLines] = useState<Line[]>([]);

  const [kind, setKind] = useState<DeliveryKind>('delivery');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [flat, setFlat] = useState('');
  const [courierComment, setCourierComment] = useState('');
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [callOnArrival, setCallOnArrival] = useState(false);
  const [payment, setPayment] = useState<'online' | 'cash'>('online');
  const [changeFrom, setChangeFrom] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(String(DEFAULT_DELIVERY_FEE));
  const [discount, setDiscount] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getMenu().then(setMenu);
  }, []);

  const dishes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const all = menu?.dishes ?? [];
    if (!needle) return all.slice(0, 8);
    return all.filter((dish) => dish.name.toLowerCase().includes(needle));
  }, [menu, query]);

  const setLine = (slug: string, title: string, price: number, quantity: number) =>
    setLines((current) => {
      if (quantity <= 0) return current.filter((line) => line.slug !== slug);
      if (current.some((line) => line.slug === slug)) {
        return current.map((line) => (line.slug === slug ? { ...line, quantity } : line));
      }
      return [...current, { slug, title, price, quantity }];
    });

  const itemsTotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = deliveryTotal({
    items: itemsTotal,
    deliveryFee: kind === 'delivery' ? Number(deliveryFee) || 0 : 0,
    serviceFee: 0,
    discount: Number(discount) || 0,
    tip: 0,
  });

  const ready = phone.trim().length >= 6 && lines.length > 0 && (kind === 'pickup' || street.trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await createDelivery({
        kind,
        customerName: name,
        customerPhone: phone,
        street,
        house,
        entrance,
        floor,
        flat,
        courierComment,
        leaveAtDoor,
        callOnArrival,
        payment,
        changeFrom: payment === 'cash' && changeFrom ? Number(changeFrom) : undefined,
        deliveryFee: kind === 'delivery' ? Number(deliveryFee) || 0 : 0,
        discount: Number(discount) || 0,
        promoCode,
        itemsTotal,
        items: lines.map((line) => ({
          dishSlug: line.slug,
          title: line.title,
          quantity: line.quantity,
          unitPrice: line.price,
          guest: null,
        })),
      });
      navigate('/handout', { replace: true, state: { created: created.number } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не получилось создать заказ');
      setSending(false);
    }
  };

  return (
    <form className={styles.page} onSubmit={submit}>
      <AppHeader title="Новый заказ" subtitle="Доставка или самовывоз" onBack={() => navigate('/handout')} />

      <div className={styles.body}>
        <SegmentedControl
          aria-label="Тип заказа"
          value={kind}
          onChange={(value) => setKind(value as DeliveryKind)}
          options={[
            { value: 'delivery', label: 'Доставка' },
            { value: 'pickup', label: 'Самовывоз' },
          ]}
        />

        <section className={styles.section}>
          <h2 className={[styles.sectionTitle, ts('body-m/medium')].join(' ')}>Гость</h2>
          <TextInput label="Имя" value={name} onChange={(e) => setName(e.target.value)} />
          <TextInput
            label="Телефон"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </section>

        {kind === 'delivery' ? (
          <section className={styles.section}>
            <h2 className={[styles.sectionTitle, ts('body-m/medium')].join(' ')}>Адрес</h2>
            <TextInput label="Улица" value={street} onChange={(e) => setStreet(e.target.value)} />
            <div className={styles.row}>
              <TextInput label="Дом" value={house} onChange={(e) => setHouse(e.target.value)} />
              <TextInput label="Подъезд" value={entrance} onChange={(e) => setEntrance(e.target.value)} />
            </div>
            <div className={styles.row}>
              <TextInput label="Этаж" value={floor} onChange={(e) => setFloor(e.target.value)} />
              <TextInput label="Квартира" value={flat} onChange={(e) => setFlat(e.target.value)} />
            </div>
            <TextArea
              label="Комментарий курьеру"
              rows={2}
              value={courierComment}
              onChange={(e) => setCourierComment(e.target.value)}
            />
            <div className={styles.rows}>
              <FormRow
                label="Оставить у двери"
                action={
                  <Toggle
                    label=""
                    checked={leaveAtDoor}
                    onChange={(e) => setLeaveAtDoor(e.target.checked)}
                  />
                }
              />
              <FormRow
                label="Позвонить по прибытии"
                action={
                  <Toggle
                    label=""
                    checked={callOnArrival}
                    onChange={(e) => setCallOnArrival(e.target.checked)}
                  />
                }
              />
            </div>
          </section>
        ) : null}

        <section className={styles.section}>
          <h2 className={[styles.sectionTitle, ts('body-m/medium')].join(' ')}>Состав заказа</h2>
          <SearchField
            label="Поиск по меню"
            placeholder="Найти блюдо"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={styles.rows}>
            {dishes.map((dish) => {
              const price = resolveDishPrice(dish);
              const line = lines.find((item) => item.slug === dish.id);
              return (
                <div key={dish.id} className={styles.dish}>
                  <span className={styles.dishText}>
                    <span className={ts('body-m/regular')}>{dish.name}</span>
                    <span className={[styles.dishPrice, ts('body-xs/regular')].join(' ')}>
                      {formatPrice(price)}
                    </span>
                  </span>
                  <Counter
                    value={line?.quantity ?? 0}
                    onChange={(quantity) => setLine(dish.id, dish.name, price, quantity)}
                    size="s"
                    variant="secondary"
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={[styles.sectionTitle, ts('body-m/medium')].join(' ')}>Деньги</h2>
          {kind === 'delivery' ? (
            <TextInput
              label="Стоимость доставки"
              inputMode="numeric"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
            />
          ) : null}
          <div className={styles.row}>
            <TextInput
              label="Скидка"
              inputMode="numeric"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
            <TextInput label="Промокод" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
          </div>
          <SegmentedControl
            aria-label="Оплата"
            value={payment}
            onChange={(value) => setPayment(value as 'online' | 'cash')}
            options={[
              { value: 'online', label: 'Онлайн' },
              { value: 'cash', label: kind === 'pickup' ? 'На месте' : 'Курьеру' },
            ]}
          />
          {payment === 'cash' ? (
            <TextInput
              label="Подготовить сдачу с"
              inputMode="numeric"
              value={changeFrom}
              onChange={(e) => setChangeFrom(e.target.value)}
            />
          ) : null}
        </section>

        {error ? <p className={[styles.error, ts('body-s/regular')].join(' ')}>{error}</p> : null}
      </div>

      <div className={styles.footer}>
        <div className={styles.total}>
          <span className={[styles.totalLabel, ts('body-xs/medium')].join(' ')}>
            {count} {pluralItems(count)}
          </span>
          <span className={[styles.totalValue, ts('heading-8/bold')].join(' ')}>{formatPrice(total)}</span>
        </div>
        <Button type="submit" block disabled={!ready || sending}>
          {sending ? 'Создаём…' : 'Принять заказ'}
        </Button>
      </div>
    </form>
  );
}
