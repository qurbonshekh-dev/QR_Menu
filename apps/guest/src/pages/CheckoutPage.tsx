import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader, Button, FormRow, Radio, SegmentedControl, TextInput, Toggle, ts } from '@food/ui';
import { type DeliveryMethod, formatPrice, type PaymentMethod } from '@food/domain';
import { useCart } from '../state/cartStore';
import { useOrders } from '../state/ordersStore';
import styles from './CheckoutPage.module.css';

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const { placeOrder } = useOrders();
  const [delivery, setDelivery] = useState<DeliveryMethod>('delivery');
  const [payment, setPayment] = useState<PaymentMethod>('online');
  const [street, setStreet] = useState('');
  const [flat, setFlat] = useState('');
  const [callBack, setCallBack] = useState(true);
  const [streetError, setStreetError] = useState<string | undefined>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (delivery === 'delivery' && street.trim() === '') {
      setStreetError('Укажите улицу и дом');
      return;
    }
    // Заказ уходит в сессию стола — из неё живут «Мои заказы» и счёт на главной.
    const order = await placeOrder(cart.payableItems, cart.totalPrice, {
      servingMode: cart.servingMode,
      comment: cart.comment,
      split: cart.split,
    });
    cart.clear();
    navigate(`/order/${order.id}`, { state: { total: order.total, delivery, payment, callBack } });
  };

  return (
    <form className={styles.page} onSubmit={submit}>
      <AppHeader title="Оформление" onBack={() => navigate('/cart')} />

      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Способ получения</h2>
          <SegmentedControl
            aria-label="Способ получения"
            value={delivery}
            onChange={setDelivery}
            options={[
              { value: 'delivery', label: 'Доставка' },
              { value: 'pickup', label: 'Самовывоз' },
            ]}
          />
        </section>

        {delivery === 'delivery' ? (
          <section className={styles.section}>
            <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Адрес</h2>
            <TextInput
              label="Улица и дом"
              value={street}
              error={streetError}
              onChange={(event) => {
                setStreet(event.target.value);
                setStreetError(undefined);
              }}
            />
            <TextInput label="Квартира" value={flat} onChange={(event) => setFlat(event.target.value)} />
          </section>
        ) : null}

        <section className={styles.section}>
          <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Оплата</h2>
          <div className={styles.group}>
          <FormRow
            label="Онлайн картой"
            action={
              <Radio
                name="payment"
                label=""
                aria-label="Онлайн картой"
                checked={payment === 'online'}
                onChange={() => setPayment('online')}
              />
            }
          />
          <FormRow
            label="Курьеру при получении"
            action={
              <Radio
                name="payment"
                label=""
                aria-label="Курьеру при получении"
                checked={payment === 'courier'}
                onChange={() => setPayment('courier')}
              />
            }
          />
          </div>
        </section>

        <section className={styles.section}>
          {/* Комментарий кухне живёт в корзине — здесь он был про курьера. */}
          <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Детали</h2>
          <div className={styles.group}>
          <FormRow
            label="Перезвонить для подтверждения"
            action={
              <Toggle
                label=""
                aria-label="Перезвонить для подтверждения"
                checked={callBack}
                onChange={(event) => setCallBack(event.target.checked)}
              />
            }
          />
          </div>
        </section>
      </div>

      <div className={styles.footer}>
        <div className={styles.total}>
          <span className={[styles.totalLabel, ts('body-xs/medium')].join(' ')}>К оплате</span>
          <span className={[styles.totalValue, ts('heading-8/bold')].join(' ')}>{formatPrice(cart.totalPrice)}</span>
        </div>
        {/* Со стоп-листом в корзине оформлять нечего: часть заказа не готовят,
            а итог её уже не считает — сначала уберите. */}
        <Button
          type="submit"
          disabled={cart.payableItems.length === 0 || cart.hasUnavailable}
          variant={cart.payableItems.length === 0 || cart.hasUnavailable ? 'disable' : 'main'}
        >
          {cart.hasUnavailable ? 'Уберите закончившееся' : 'Оформить заказ'}
        </Button>
      </div>
    </form>
  );
}
