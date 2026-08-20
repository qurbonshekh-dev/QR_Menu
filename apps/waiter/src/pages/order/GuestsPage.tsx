import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader, Button, OptionGroup, ts } from '@food/ui';
import { pluralGuests, type FloorTable } from '@food/domain';
import { fetchTable } from '@food/api';
import { useDraft } from '../../state/draftStore';
import styles from './GuestsPage.module.css';

/** Больше пяти гостей за столом бывает, но пресетами это не набрать —
 *  дальше считаем «шесть и больше» и уточняем счётчиком в заказе. */
const PRESETS = ['1', '2', '3', '4', '5', '6'];

/** Первый шаг приёма заказа: сколько гостей. От этого зависит вся раскладка —
 *  кому какая тарелка, — поэтому спрашиваем до меню, а не после. */
export function GuestsPage() {
  const { tableId = '' } = useParams();
  const navigate = useNavigate();
  const { start } = useDraft();
  const [table, setTable] = useState<FloorTable | null>(null);
  const [guests, setGuests] = useState('2');

  useEffect(() => {
    void fetchTable(tableId).then(setTable);
  }, [tableId]);

  const begin = () => {
    if (!table) return;
    start(table.id, table.number, Number(guests));
    navigate(`/table/${table.id}/menu`);
  };

  return (
    <div className={styles.page}>
      <AppHeader
        title={table ? `Стол №${table.number}` : 'Стол'}
        subtitle={table ? `${table.seats} ${pluralGuests(table.seats)} за столом` : undefined}
        onBack={() => navigate('/')}
      />

      <div className={styles.body}>
        <h2 className={[styles.question, ts('heading-8/bold')].join(' ')}>Сколько гостей?</h2>
        <OptionGroup
          aria-label="Количество гостей"
          value={guests}
          onChange={setGuests}
          options={PRESETS.map((value) => ({
            id: value,
            label: value === '6' ? '6+' : value,
          }))}
        />
        <p className={[styles.hint, ts('body-s/regular')].join(' ')}>
          По гостям разложим блюда: кому что нести и как делить счёт.
        </p>
      </div>

      <div className={styles.action}>
        <Button block onClick={begin} disabled={!table}>
          Собрать заказ
        </Button>
      </div>
    </div>
  );
}
