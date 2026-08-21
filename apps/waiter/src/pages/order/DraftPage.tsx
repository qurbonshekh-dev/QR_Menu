import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { AppHeader, Button, Counter, OptionGroup, SegmentedControl, TextArea, ts } from '@food/ui';
import {
  describeModifiers,
  draftLinePrice,
  draftLineTotal,
  draftTotal,
  formatPrice,
  SERVE_PRESETS,
  serveLabel,
  type DraftLine,
} from '@food/domain';
import { placeWaiterOrder } from '@food/api';
import { useAuth } from '@food/staff';
import { useDraft } from '../../state/draftStore';
import styles from './DraftPage.module.css';

const DRAG_THRESHOLD = 8;

interface Drag {
  key: string;
  x: number;
  y: number;
  active: boolean;
  over: number | null | undefined;
  width: number;
}

/**
 * Черновик заказа: тарелки, разложенные по гостям. Перетаскивание — из ТЗ,
 * и оно на pointer-событиях, как на кухонной доске: HTML5 drag-and-drop на
 * планшете не работает вовсе. Тянем за ручку, а не за всю строку, — иначе
 * список нельзя было бы прокрутить пальцем.
 */
export function DraftPage() {
  const { tableId = '' } = useParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const { draft, setQuantity, setGuest, setServeAfter, setServingMode, setComment, discard } = useDraft();

  const [drag, setDrag] = useState<Drag | null>(null);
  const [sending, setSending] = useState(false);
  // Заказ ушёл — черновика больше нет, но это не повод гнать официанта
  // обратно к вопросу «сколько гостей»: ему полагается экран «принято».
  const sentRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const dragRef = useRef<Drag | null>(null);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  // Уводим из эффекта, а не из рендера: навигация во время рендера — это
  // обновление роутера из чужого рендера, React на это ругается по делу.
  useEffect(() => {
    if (!draft && !sentRef.current) navigate(`/table/${tableId}/guests`, { replace: true });
  }, [draft, navigate, tableId]);

  if (!draft) return null;

  const groups: { guest: number | null; title: string; lines: DraftLine[] }[] = [
    ...Array.from({ length: draft.guests }, (_, index) => ({
      guest: index as number | null,
      title: `Гость №${index + 1}`,
      lines: draft.lines.filter((line) => line.guest === index),
    })),
    { guest: null, title: 'На стол', lines: draft.lines.filter((line) => line.guest === null) },
  ];

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, line: DraftLine) => {
    const row = event.currentTarget.closest('[data-row]') as HTMLElement | null;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      key: line.key,
      x: event.clientX,
      y: event.clientY,
      active: false,
      over: line.guest,
      width: row?.getBoundingClientRect().width ?? 240,
    });
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current) return;
    const moved = Math.abs(event.clientY - current.y) + Math.abs(event.clientX - current.x);
    if (!current.active && moved < DRAG_THRESHOLD) return;

    // Куда именно попал палец, знает только сам документ: список гостей
    // прокручивается, и считать координаты групп заранее бессмысленно.
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const zone = target?.closest('[data-guest]') as HTMLElement | null;
    const attr = zone?.dataset.guest;
    setDrag({
      ...current,
      x: event.clientX,
      y: event.clientY,
      active: true,
      over: attr === undefined ? current.over : attr === 'all' ? null : Number(attr),
    });
  };

  const endDrag = () => {
    const current = dragRef.current;
    setDrag(null);
    if (!current?.active) return;
    const line = draft.lines.find((row) => row.key === current.key);
    if (line && current.over !== undefined && current.over !== line.guest) {
      setGuest(line.key, current.over);
    }
  };

  const send = async () => {
    if (!me || sending) return;
    setSending(true);
    setError(null);
    try {
      const placed = await placeWaiterOrder({
        tableId: draft.tableId,
        waiterId: me.id,
        guests: draft.guests,
        servingMode: draft.servingMode,
        comment: draft.comment,
        total: draftTotal(draft.lines),
        items: draft.lines.map((line) => ({
          dishSlug: line.dishId,
          title: line.title,
          options: line.options,
          modifiers: describeModifiers(line) ?? undefined,
          comment: line.comment,
          quantity: line.quantity,
          unitPrice: draftLinePrice(line),
          guest: line.guest,
          serveAfterMinutes: line.serveAfterMinutes,
        })),
      });
      sentRef.current = true;
      discard();
      navigate(`/table/${tableId}/sent/${placed.number}`, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не получилось отправить заказ');
      setSending(false);
    }
  };

  const dragged = drag?.active ? draft.lines.find((line) => line.key === drag.key) : undefined;

  return (
    <div className={styles.page}>
      <AppHeader
        title={`Заказ · стол №${draft.tableNumber}`}
        subtitle="Перетащите блюдо к нужному гостю"
        onBack={() => navigate(`/table/${tableId}/menu`)}
      />

      <div className={styles.body}>
        {groups.map((group) => (
          <section
            key={group.guest ?? 'all'}
            data-guest={group.guest === null ? 'all' : group.guest}
            className={[styles.group, drag?.active && drag.over === group.guest ? styles.over : '']
              .filter(Boolean)
              .join(' ')}
          >
            <div className={styles.groupHead}>
              <span className={[styles.groupTitle, ts('body-s/medium')].join(' ')}>{group.title}</span>
              <span className={[styles.groupTotal, ts('body-s/bold')].join(' ')}>
                {formatPrice(group.lines.reduce((sum, line) => sum + draftLineTotal(line), 0))}
              </span>
            </div>

            {group.lines.length === 0 ? (
              <p className={[styles.empty, ts('body-xs/regular')].join(' ')}>Пусто — перетащите блюдо сюда</p>
            ) : (
              group.lines.map((line) => {
                const modifiers = describeModifiers(line);
                return (
                  <div key={line.key} data-row className={styles.row}>
                    <button
                      type="button"
                      className={styles.grip}
                      aria-label={`Передвинуть «${line.title}» другому гостю`}
                      onPointerDown={(event) => startDrag(event, line)}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                    >
                      <span aria-hidden="true">⠿</span>
                    </button>

                    <div className={styles.rowBody}>
                      <span className={[styles.rowTitle, ts('body-m/medium')].join(' ')}>{line.title}</span>
                      {line.options || modifiers ? (
                        <span className={[styles.rowMeta, ts('body-xs/regular')].join(' ')}>
                          {[line.options, modifiers].filter(Boolean).join(' · ')}
                        </span>
                      ) : null}
                      {line.comment ? (
                        <span className={[styles.rowMeta, ts('body-xs/regular')].join(' ')}>{line.comment}</span>
                      ) : null}
                      <button
                        type="button"
                        className={[styles.serve, ts('body-xs/medium')].join(' ')}
                        onClick={() => setExpanded(expanded === line.key ? null : line.key)}
                      >
                        {serveLabel(line.serveAfterMinutes)}
                      </button>
                      {expanded === line.key ? (
                        <OptionGroup
                          aria-label="Время подачи"
                          value={line.serveAfterMinutes === undefined ? 'ready' : String(line.serveAfterMinutes)}
                          onChange={(id) => {
                            setServeAfter(line.key, id === 'ready' ? undefined : Number(id));
                            setExpanded(null);
                          }}
                          options={SERVE_PRESETS.map((preset) => ({
                            id: preset.minutes === undefined ? 'ready' : String(preset.minutes),
                            label: preset.label,
                          }))}
                        />
                      ) : null}
                    </div>

                    <div className={styles.rowTail}>
                      <span className={[styles.rowPrice, ts('body-s/medium')].join(' ')}>
                        {formatPrice(draftLineTotal(line))}
                      </span>
                      <Counter
                        value={line.quantity}
                        onChange={(next) => setQuantity(line.key, next)}
                        size="s"
                        variant="secondary"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </section>
        ))}

        <section className={styles.settings}>
          <h2 className={[styles.settingsTitle, ts('body-m/medium')].join(' ')}>Как подавать</h2>
          <SegmentedControl
            aria-label="Порядок подачи"
            value={draft.servingMode}
            onChange={setServingMode}
            options={[
              { value: 'ready', label: 'По готовности' },
              { value: 'together', label: 'Всё вместе' },
            ]}
          />
          <TextArea
            label="Комментарий кухне"
            value={draft.comment ?? ''}
            onChange={(event) => setComment(event.target.value)}
          />
        </section>
      </div>

      <div className={styles.footer}>
        {error ? <p className={[styles.error, ts('body-s/regular')].join(' ')}>{error}</p> : null}
        <Button block onClick={() => void send()} disabled={sending || draft.lines.length === 0}>
          {sending ? 'Отправляем…' : `Отправить на кухню · ${formatPrice(draftTotal(draft.lines))}`}
        </Button>
      </div>

      {/* Копия строки под пальцем рисуется поверх страницы: внутри группы её
          резали бы границы и прокрутка. */}
      {dragged && drag
        ? createPortal(
            <div
              className={styles.ghost}
              style={{ left: drag.x - drag.width / 2, top: drag.y - 24, width: drag.width }}
            >
              <span className={ts('body-m/medium')}>{dragged.title}</span>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
