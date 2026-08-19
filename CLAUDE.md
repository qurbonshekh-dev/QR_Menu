# QR Menu

## Что это

Два проекта в одном репозитории, связанных правилом parity:

1. **Приложение** — гостевое QR-меню ресторана: гость сканирует QR за столом, выбирает блюда,
   оформляет заказ. Mobile-first web app. Живёт в `app/`.
2. **Дизайн-система** — React-компоненты и Figma-компоненты, зеркальные друг другу 1:1.
   Токены, стили и компоненты существуют в обеих средах одновременно.

Ссылки:

- Прод: https://qr-menu-pi-sage.vercel.app (автодеплой с `git push` в `main`)
- Репозиторий: https://github.com/qurbonshekh-dev/QR_Menu
- Figma: https://www.figma.com/design/FMWyIMVAGIPPpP6SsEvGd8/DS
- ТЗ на продукт: `docs/tz.md`

## Текущее состояние

**Работает:** меню (категории + поиск) → карточка блюда (у пиццы выбор размера и теста) →
корзина → оформление → подтверждение заказа. Данные — локальный мок, бэкенда нет.

**Дизайн-система:** 16 React-компонентов, все зеркалированы в Figma. Ноль хардкода —
каждый цвет/отступ/радиус через CSS-переменную, каждый текст через Text Style.

**Валюта:** узбекский сум, формат «2 101 с». Форматирование — только через `formatPrice()`
из `app/src/data/format.ts`. Внутри неразрывный пробел (`Intl`), это ломает поиск подстроки
вида `'2 501'` в тестах — искать по индексу, а не по тексту.

## Дорожная карта (из `docs/tz.md`)

Решение: сейчас **только фронтенд**. Бэкенд и админка ресторана — отдельным этапом позже.

| # | Фаза | Статус |
|---|---|---|
| 1 | Вход по QR — restaurant/table из URL | ✅ сделано |
| 2 | Глубина каталога — КБЖУ (белки/жиры/углеводы) + модификаторы-чекбоксы («без лука») | ⬜ |
| 3 | Чекаут → dine-in: убрать доставку/адрес, добавить телефон + мок-OTP | ⬜ |
| 4 | Мок платёжный шлюз: экран обработки, успех/ошибка с повтором | ⬜ |
| 5 | Статус заказа (в очереди→готовится→готов→подан) + дозаказ / вызов официанта / счёт | ⬜ |
| 6 | PWA — manifest, иконки, устанавливаемость | ⬜ |

**Важно про фазу 3:** текущий чекаут — это доставка (адрес, курьер), что противоречит
модели «заказ за столом» из ТЗ. Пользователь решил заменить полностью на dine-in.

## Структура

```
app/src/
  components/          ДС. Реестр — components/index.ts (сверяется с Figma 1:1)
    atoms/             Badge Button Chip Counter Icon IconButton OptionChip Radio TextInput Toggle
    molecules/         DishCard FormRow OptionGroup SearchField SegmentedControl
    organisms/         AppHeader CartBar
  data/                Слой данных: types, menu.json (мок), menuRepository (единственная точка доступа)
  state/               CartContext + cartStore, TableSessionContext + tableSessionStore
  pages/               MenuPage DishPage CartPage CheckoutPage OrderSuccessPage
  tokens/              tokens.css/ts (переменные), typography.css/ts (34 Text Style)
artifacts/             tokens.json (источник токенов), figma-mirror.json (карта id), parity-report.md
directives/            Инструкции пайплайна (quickstart, sync_to_figma, parity_check, ...)
docs/tz.md             ТЗ на продукт
```

## Ключевые архитектурные решения

**`menuRepository.ts` — шов для бэкенда.** Экраны не знают, откуда данные. Чтобы перейти
на API/Supabase, меняется только этот файл. Все хелперы цены/меты/опций живут там же.

**Ключ строки корзины — составной.** `cartKey(dishId, selections)` из `data/cartKey.ts`:
пицца 21 см и 25 см — две разные строки корзины, не одна. `CartItem.key` — это то, по чему
корзина различает позиции, `dishId` — только ссылка на блюдо.

**Опции блюда.** `DishOptionGroup` с `layout: 'detailed' | 'simple'`. `detailed` — размер
(есть `caption` и `price`, выбранная цена **заменяет** базовую через `resolveDishPrice`),
`simple` — тесто (только `label`, на цену не влияет). Пока только single-select;
модификаторы-чекбоксы из фазы 2 потребуют третьего layout.

**Стол из URL, без persistence.** `?table=7` → «Стол 7 · основной зал». Нет параметра —
всегда дефолт «12». Сознательно **не** храним в localStorage: без бэкенда привязки заказа
к столу всё равно нет, а запомненный чужой стол хуже дефолта. `TableSessionProvider`
обязан быть **внутри** `<HashRouter>` — ему нужен роутер-контекст для `useSearchParams`.

**HashRouter, не BrowserRouter.** Приложение раздаётся как статика без серверных rewrite.
Поэтому URL вида `/#/?table=7` — query идёт после хэша.

## Правила parity

React-компонент = Figma-компонент = токен. Расхождение — баг, чинится с обеих сторон.

| Сущность | React | Figma |
|---|---|---|
| Цвет | CSS var `--color-*` | Variable `Colors/*` |
| Шрифт | класс `.ts-*` из `typography.css` | Text Style с тем же именем |
| Spacing / Radius | `--space-*` / `--radius-*` | Variable `Spacing/*` / `Radius/*` |
| Тень | `--shadow-*` | Effect Style `Shadow/*` |
| Компонент | `<Button variant="main"/>` | Component Set `Button`, свойство `Variant=Main` |

- Никакого хардкода цветов/размеров/шрифтов вне `tokens.*`.
- Имена 1:1. Figma-свойства в TitleCase (`Variant`), React-пропы в camelCase (`variant`) —
  это единственное согласованное расхождение.
- Новый компонент зеркалится сразу, долги синхронизации не копим.
- После значимой итерации — обновить `artifacts/parity-report.md`.

## Figma: карта файла

Страница `Page 1` — **исходный Style Guide дизайнера, не редактируем.** Это источник истины
по визуалу; все рубли и старые значения там остаются как есть.

Наши страницы: `01 — Foundations`, `02 — Icons`, `03 — Controls`, `04 — Inputs`,
`05 — Cards & Layout`, `06 — Screens`.

Точные id всех переменных, компонентов, свойств, экранов и image-хэшей —
в `artifacts/figma-mirror.json`. **Читать оттуда, не угадывать.** Перед `use_figma`
обязательно загрузить скилл `figma-use` (детали и грабли — `directives/figma_mcp_setup.md`).

## Команды

```bash
npm --prefix app run dev      # дев-сервер (host:true — доступен с телефона в той же Wi-Fi)
npm --prefix app run build    # tsc -b + vite build
npx --prefix app tsc -b       # только типы
npx --prefix app oxlint src   # линт
```

Деплой: `git push origin main` → Vercel собирает автоматически (Root Directory = `app`).

## Известные ограничения мока

- 5 фотографий растянуты на 14 блюд — у чизкейка фото бургера. Ждёт реальных фото.
- Нет налогов/сервисного сбора, авторизации, статусов заказа — это фазы 3–5.
