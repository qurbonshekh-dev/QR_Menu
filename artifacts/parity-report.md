# Parity Report — QR Menu

Обновлено: 2026-08-18, после двусторонней синхронизации (код → Figma).
Файл: `FMWyIMVAGIPPpP6SsEvGd8`. Карта id — `artifacts/figma-mirror.json`.

## Состояние

| Слой | React | Figma | Статус |
|---|---|---|---|
| Токены | `tokens.json` → `tokens.css` / `tokens.ts` | коллекции `Colors` (Light), `Spacing`, `Radius` | ✅ |
| Текстовые стили | 34 в `typography.ts` + классы `.ts-*` | 34 Text Styles, имена 1:1 | ✅ |
| Эффекты | `shadow.card` / `.modal` / `.focus` | `Shadow/Card` / `Shadow/Modal` / `Shadow/Focus` | ✅ |
| Компоненты | 14 в `app/src/components` | 14 Component Set'ов + 8 `Icon/*` | ✅ |
| Экраны | 5 в `app/src/pages` | 5 фреймов 375×812 на `06 — Screens` | ✅ |

Страница `Page 1` со Style Guide дизайнера не изменялась — она остаётся источником истины по визуалу.

## Исправленные расхождения

1. **Бренд-цвет.** Прошлая ревизия завела `Brand/Main = #FF5E26` (оранжевый) — такого значения в файле нет. Теперь `Brand/Main` — алиас на исходную переменную дизайнера `Main_1 = #FFDB00`, а текст поверх неё берётся из `Brand/Contrast` → `Text/Dark/1`. Поправлено с обеих сторон.
2. **`Shadow/Focus`** хранил оранжевое кольцо от того же бага — перекрашен в нейтральное, синхронно с `tokens.json`.
3. **Отчёт о страницах.** Записи о страницах `01 — Tokens` / `02 — Components` / `03 — Demo` были недостоверны (в файле их не было). Структура пересоздана и зафиксирована в `figma-mirror.json`.
4. **Мёртвые id.** `figma-mirror.json` содержал VariableID/NodeID удалённых узлов — перезаписан фактическими.

## Компоненты 1:1

| Компонент | React | Figma | Свойства |
|---|---|---|---|
| `Icon/*` | `atoms/Icon` (8 глифов) | 8 компонентов, геометрия из экспорта Style Guide | — |
| `Button` | `atoms/Button` | Set `21:56`, 9 вариантов | `Variant`=variant, `Size`=size, `Label`, `Show icon` |
| `Counter` | `atoms/Counter` | Set `23:56`, 4 варианта | `Variant`, `Size`, `Value` |
| `Chip` | `atoms/Chip` | Set `25:38`, 2 варианта | `State`=selected, `Label` |
| `IconButton` | `atoms/IconButton` | Set `25:51`, 3 варианта | `Variant`, `Icon` (instance swap) |
| `Toggle` | `atoms/Toggle` | Set `25:58`, 2 варианта | `State`=checked |
| `Radio` | `atoms/Radio` | Set `25:64`, 2 варианта | `State`=checked |
| `TextInput` | `atoms/TextInput` | Set `26:21`, 4 состояния | `State`, `Label` |
| `SegmentedControl` | `molecules/SegmentedControl` | Set `27:14`, 2 варианта | `Selected` |
| `FormRow` | `molecules/FormRow` | Set `39:11`, 2 варианта | `Action`=Radio/Toggle, `Label` |
| `Badge` | `atoms/Badge` | Set `28:13`, 3 варианта | `Tone`, `Label` |
| `DishCard` | `molecules/DishCard` | Set `30:74`, 4 варианта | `Variant`, `Action`, `Price`, `Title`, `Meta` |
| `AppHeader` | `organisms/AppHeader` | `32:44` | `Title`, `Subtitle`, `Show back`, `Show action` |
| `CartBar` | `organisms/CartBar` | `32:57` | `Summary`, `Total` |

## Экраны

`Menu` (34:2), `Dish` (35:113), `Cart` (36:136), `Checkout` (37:202), `Order Success` (36:217) — 375×812, собраны только из инстансов (70 инстансов суммарно).
Автопроверка на последнем прогоне: **0** текстовых нод мимо Text Style, **0** заливок мимо переменной.

## Осознанные расхождения

1. **Регистр свойств.** Figma — `Variant`/`Size`/`State`/`Action` (TitleCase), React — `variant`/`size` (lowerCamel). Значения совпадают по смыслу.
2. **`FormRow` — два варианта вместо одного слота.** В React правый слот принимает любой ReactNode. В Figma instance swap наследует размер слота (Toggle 44×24 обрезался до Radio 16×16), поэтому слот разведён на варианты `Action=Radio` / `Action=Toggle`. Расхождение уровня инструмента, не дизайна.
3. **Иконка в `Button`.** В Style Guide — 20px, в компоненте и в коде — 16px (единственный размер, экспортированный как переиспользуемый вектор). Визуально 2px разницы.
4. **Пилюли состава на экране блюда** — паттерн уровня экрана (radius full, `Neutral/50`, Body S Regular), не компонент `Chip` (у того другой паддинг и вес шрифта). Совпадает с кодом.
5. **`Button` M gap.** В макете 6px, в коде и компоненте `Spacing/2` (8px) ради 4pt-сетки.
6. **`shadow.focus`** — придуман в коде: в исходном ДС состояний фокуса нет. Помечен placeholder'ом в описании стиля.
7. **Экраны в Figma показывают один экран без прокрутки** — в меню видно 4 карточки из 12, в корзине 3 позиции. В приложении список скроллится.

## TODO

1. Подтвердить у дизайнера: `Shadow/Focus`, переменную для `Neutral/Overlay`, состояния hover/pressed (в ДС их нет ни у одного компонента).
2. Опубликовать библиотеку (сейчас компоненты локальные — `get_libraries` показывает, что к файлу не подключено ни одной библиотеки).
3. Code Connect: связать 14 компонентов с `app/src/components` — контекст свежий, маппинг тривиальный.
4. Заменить mock-меню (`app/src/data/menu.json`) на реальный источник через `menuRepository`.
