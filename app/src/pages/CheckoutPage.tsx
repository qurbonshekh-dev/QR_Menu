import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppHeader,
  Button,
  FormRow,
  Radio,
  SegmentedControl,
  TextInput,
  Toggle,
  } from '../components';
import type { DeliveryMethod, PaymentMethod } from '../data/types';
import { formatPrice } from '../data/format';
import { useCart } from '../state/cartStore';
import { ts } from '../tokens/typography';
import styles from './CheckoutPage.module.css';

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [delivery, setDelivery] = useState<DeliveryMethod>('delivery');
  const [payment, setPayment] = useState<PaymentMethod>('online');
  const [street, setStreet] = useState('');
  const [flat, setFlat] = useState('');
  const [comment, setComment] = useState('');
  const [callBack, setCallBack] = useState(true);
  const [streetError, setStreetError] = useState<string | undefined>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (delivery === 'delivery' && street.trim() === '') {
      setStreetError('Укажите улицу и дом');
      return;
    }
    const orderId = String(Math.floor(1000 + Math.random() * 9000));
    cart.clear();
    navigate(`/order/${orderId}`, { state: { total: cart.totalPrice, delivery, payment, callBack, comment } });
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
          <h2 className={[styles.sectionTitle, ts('heading-9/extrabold')].join(' ')}>Детали</h2>
          <TextInput label="Комментарий" value={comment} onChange={(event) => setComment(event.target.value)} />
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
        <Button type="submit" disabled={cart.items.length === 0} variant={cart.items.length === 0 ? 'disable' : 'main'}>
          Оформить заказ
        </Button>
      </div>
    </form>
  );
}
