# Directive: quickstart (self-contained)

Стартовая директива для студента. **Самодостаточная** — ничего, кроме этого файла, не требуется. Студент кладёт его в пустую (или почти пустую) папку, открывает там Claude Code / Cursor / Antigravity, говорит «выполни quickstart» — Claude брифует студента, разворачивает скелет среды, ведёт по выбранной ветке, доводит до работающего демо и двусторонней parity React DS ↔ Figma DS.

**Дальше — инструкции для Claude. Студент их не читает.**

---

## Что Claude делает (overview)

1. Брифует студента — что у него уже есть на старте.
2. Разворачивает скелет среды (CLAUDE.md + все директивы + конфиги + скрипты).
3. Идёт по конкретной ветке в зависимости от ответа.
4. Подключает Figma MCP.
5. Доводит до состояния «React + Figma зеркальны, dev server работает».
6. Спрашивает, что дальше.

Не делай ничего деструктивного без подтверждения. Не перетирай существующие файлы — спрашивай.

---

## Шаг 0 — Брифинг

Сначала **прочитай** содержимое текущей папки (`ls -la`). Если там что-то есть — учти при опросе.

Через `AskUserQuestion` (multiSelect = true) задай:

> «Что у тебя уже есть на старте? (можно несколько вариантов)»
> - **Figma-файл** — есть готовый дизайн в Figma, поделюсь URL/fileKey
> - **Git-репозиторий** — есть React/Next/Vue проект, поделюсь URL
> - **Локальная папка с React** — компоненты лежат в этой или соседней папке
> - **HTML-страницы** — есть HTML+CSS файлы сайта, нужно превратить в компонентную ДС
> - **Только идея** — поднимаем с нуля, дам базу

В зависимости от выбора — задай **уточняющие вопросы** (по одному `AskUserQuestion` за раз):

- **Figma** → «Дай URL Figma-файла или fileKey» (текстовый ответ через `Other`).
- **Git** → «URL репозитория?» + «Какой пакетный менеджер? (npm/pnpm/yarn/bun)».
- **Локальная папка** → «Абсолютный путь к корню?» (если не текущая).
- **HTML** → «Где лежат HTML-файлы? Дай путь.» Затем скопировать их в `source/`.
- **Только идея** → ничего, идём в scratch-ветку.

Зафиксируй ответы в памяти (можешь сохранить в `artifacts/quickstart-context.json` для воспроизводимости).

---

## Шаг 1 — Развернуть скелет среды

Создай структуру (если каких-то директорий уже нет):

```
.
├── CLAUDE.md                  ← Layer 2: инструкция для агента
├── .mcp.json                  ← подключение Figma MCP
├── figma.config.json          ← fileKey + параметры
├── .gitignore
├── directives/                ← Layer 1: пошаговые инструкции
│   ├── quickstart.md          (этот файл — оставь как есть)
│   ├── figma_mcp_setup.md
│   ├── sync_to_figma.md
│   ├── parity_check.md
│   ├── extract_patterns.md    (если ветка HTML)
│   ├── build_tokens.md
│   ├── build_react_ds.md
│   └── demo_app.md
├── source/                    ← HTML и любые исходные ассеты
├── app/                       ← Layer 3 (часть): React + Vite + scripts
│   └── scripts/               ← парсеры, генераторы (если нужно)
└── artifacts/                 ← промежуточные данные (tokens, mirror, audit)
    └── .gitkeep
```

Перед созданием каждого файла — проверь, нет ли его уже. Если есть — спроси: «перетереть?». Если студент скажет нет — пропусти.

### 1.1 — CLAUDE.md (Layer 2)

Сгенерируй из этого темплейта, **подставив имя проекта** (спроси у студента, если ещё не знаешь):

```markdown
# <PROJECT_NAME>

## Проект

Среда parity React DS ↔ Figma DS. Цель — поддерживать одностороннее или двустороннее соответствие между React-кодовой базой и Figma-файлом: токены, переменные, стили, компоненты, варианты.

## Неразрывная связь (parity)

React-компонент = Figma-компонент = токен. Любое расхождение между кодом и Figma — баг, решается правкой обоих, не одного.

| Сущность | React | Figma |
|----------|-------|-------|
| Цвет | `tokens.color.[group].[name]` / CSS var | Variable `Colors/[Group]/[Name]` |
| Шрифт | Text style из `typography.ts` | Text Style с тем же именем |
| Spacing | `tokens.space.[n]` | Variable `Spacing/[N]` |
| Radius | `tokens.radius.[size]` | Variable `Radius/[Size]` |
| Shadow | `tokens.shadow.[name]` | Effect Style с тем же именем |
| Компонент | `<Button variant="primary"/>` | Component `Button` + variant `Primary` |

## Архитектура (3 слоя)

- **Layer 1 — Directives** (`directives/`) — markdown-инструкции по каждому шагу пайплайна.
- **Layer 2 — Orchestration** (основной агент) — читает нужную директиву, принимает решения, вызывает MCP/скрипты.
- **Layer 3 — Execution** — скрипты парсинга, генератор токенов, Figma MCP-вызовы.

## Стек

- React + Vite + TypeScript
- CSS Variables + CSS Modules
- Figma MCP (`mcp__figma__*`)
- (опционально) Node + cheerio для парсинга HTML

## Структура

См. `directives/quickstart.md` секция «Шаг 1».

## Директивы

- `quickstart` — точка входа (этот пайплайн)
- `figma_mcp_setup` — подключение Figma MCP
- `extract_patterns` — парсинг HTML → design-audit.json (опционально)
- `build_tokens` — design-audit.json → tokens.json + tokens.css/ts
- `build_react_ds` — создание/обновление React-компонентов
- `sync_to_figma` — заливка ДС в Figma через use_figma батчами
- `parity_check` — формальная сверка React ↔ Figma
- `demo_app` — сборка демо-страницы из инстансов

## Правила

- Никакого хардкода цветов / размеров / шрифтов вне `tokens.ts`. Только переменные.
- Имена компонентов в React и Figma — 1:1. Variant property = React prop.
- Каждый новый компонент — мгновенно зеркалится. Не копить долги синхронизации.
- `parity_check` после каждой значимой итерации.
- При создании Figma-нод **никогда не вызывать `node.resize(W, 0)`** на auto-layout. Для HUG — `primaryAxisSizingMode = "AUTO"` без resize по этой оси.
- Каждый TEXT-нод в Figma подвязывается к локальному Text Style через `setTextStyleIdAsync` (не raw fontName + fontSize).

## MCP

- Figma MCP (`mcp__figma__*`) — чтение и запись Figma.

## Credentials

- `figma.config.json` — публичные параметры (fileKey, team id).
- Личные токены — в `.env` (gitignored).
```

### 1.2 — Директивы (Layer 1)

Каждая директива создаётся как отдельный файл в `directives/`. Темплейты дальше — это **спецификации**, ты по ним генеришь полноценный файл (опираясь на свой опыт работы с Figma MCP и React). Если что-то нужно расширить — расширяй.

#### `directives/figma_mcp_setup.md`
```
# Цель: подключить Figma MCP к среде, проверить smoke-test.

## Шаги
1. Убедиться, что .mcp.json в корне содержит:
   { "mcpServers": { "figma": { "type": "http", "url": "https://mcp.figma.com/mcp" } } }
2. После создания .mcp.json — попросить студента перезапустить Claude Code/Cursor/Antigravity (иначе MCP не подхватится).
3. На первый вызов любого mcp__figma__* — будет OAuth в браузере. Если ничего не открылось:
   - Вызвать mcp__figma__authenticate, отдать студенту полученный URL.
   - Если редирект упал на localhost — попросить URL из адресной строки и вызвать complete_authentication.
4. Smoke-test:
   - mcp__figma__whoami → должен вернуть email/handle
   - mcp__figma__get_metadata с nodeId "0:1" — структура файла
5. Если ошибка 401 — токен истёк, повторить authenticate.

## Tools шпаргалка
- get_metadata, get_design_context, get_screenshot, get_variable_defs, whoami — read
- use_figma — главный write через Figma Plugin API
- generate_figma_design — генерация дизайна по описанию
- create_new_file — новый Figma-файл

## Лимиты use_figma
- ~15KB кода на вызов → большие операции дробить
- figma.currentPage read-only → await figma.setCurrentPageAsync(page)
- layoutSizingHorizontal "FILL" — только ПОСЛЕ добавления ребёнка в родителя
- Шрифты — через figma.loadFontAsync({ family, style }). Inter "Semi Bold" с пробелом, не "SemiBold"
- Variable aliases — { type: "VARIABLE_ALIAS", id: targetVariableId }
```

#### `directives/sync_to_figma.md`
```
# Цель: зеркально воссоздать в Figma то, что есть в коде. Через mcp__figma__use_figma батчами.

## Предусловия
- figma_mcp_setup пройден
- artifacts/tokens.json есть и актуален
- figma.config.json содержит реальный fileKey
- React-компоненты в app/src/components/{atoms,molecules,organisms}/

## Батчи (порядок важен — id из предыдущего нужны для следующего)

Батч 0 — pages "01 — Tokens", "02 — Components", "03 — Demo". Переключиться на Tokens.
Батч 1 — Variable Collections: Colors (modes Light), Spacing (Default), Radius (Default).
Батч 2 — Base Color Variables: Brand/*, Neutral/*, Accent/* — hex из tokens.color.brand|neutral|accent.
Батч 3 — Semantic Color aliases: Semantic/Bg/Default и т.д. как VARIABLE_ALIAS на base.
Батч 4 — Spacing/* и Radius/* как FLOAT Variables.
Батч 5 — Text Styles из tokens.typography.style. Каждый создаётся, потом будет применяться через setTextStyleIdAsync. Если шрифт не зарегистрирован в файле — fallback на Inter, помечать в figma-mirror.json.
Батч 6 — Effect Styles: Shadow/Card, Shadow/Modal, Shadow/Focus.
Батч 7+ — Component Sets: atoms → molecules → organisms. Variant property names = React prop names 1:1. Все цвета/радиусы через Variables, тексты — через setTextStyleIdAsync, тени — через Effect Styles.
Финал — на 03 — Demo собрать demo-frame ТОЛЬКО из инстансов.

## После каждого батча
Обновить artifacts/figma-mirror.json (id всего созданного), чтобы можно было продолжить с середины.

## Идемпотентность
Перед созданием искать по имени, совпало → update. Удалять — только с подтверждения студента.

## Грабли (не повторять)
1. node.resize(W, 0) на auto-layout — баг. Для HUG: primaryAxisSizingMode "AUTO" без resize по оси.
2. TEXT нода без setTextStyleIdAsync — теряет parity. Маппинг (size, weight) → style:
   - size 12 → Caption
   - Bold/SemiBold → ближайший Heading/* по size
   - Regular/Medium → ближайший Body/* по size
3. SVG-иконки — через figma.createNodeFromSvg(svg), не через vectorPaths (последний strict).
4. await внутри функции → функция должна быть async.
5. figma.combineAsVariants(arr, page) — только COMPONENT в массиве, не FRAME.

## Token Reference (опционально, но рекомендуется)
После Variables/Styles собрать на 01 — Tokens визуализацию: секции Colors (свотчи), Typography (samples), Spacing (шкала), Radius (квадраты), Shadows (карточки).
```

#### `directives/parity_check.md`
```
# Цель: формальный аудит совпадения React ↔ Figma.

## Шаги
1. Прочитать список компонентов из app/src/components/index.ts.
2. Через mcp__figma__get_metadata получить список Component Set / Component на странице "02 — Components".
3. Сравнить:
   - Имя 1:1 (Button === Button, не button-primary)
   - Variant property names совпадают с React prop names
   - Variant value sets совпадают (например, Variant=primary|secondary|ghost для Button)
4. Прочитать tokens.json и сравнить с Figma Variables (через mcp__figma__get_variable_defs).
5. Записать отчёт в artifacts/parity-report.md в формате:
   ## Колонки
   - ✅ Совпадает
   - ⚠️ Расхождение (с описанием)
   - ❌ Только в коде / только в Figma
   ## TODO
   - список конкретных правок для приведения к 1:1

## Запускать
После каждой значимой итерации (новый компонент, изменение токена, рефакторинг).
```

#### `directives/extract_patterns.md` (создаётся только если ветка HTML)
```
# Цель: распарсить HTML-дампы → artifacts/design-audit.json со структурой паттернов.

## Шаги
1. Поставить cheerio: cd app && npm i -D cheerio.
2. Создать app/scripts/extract-patterns.mjs — Node-скрипт:
   - читает все *.html в source/
   - извлекает inline styles, computed styles из связанных css файлов
   - группирует цвета (по частоте), радиусы, отступы, шрифты, тени
   - собирает повторяющиеся блоки (карточки, кнопки, списки) — кандидаты в компоненты
3. Запустить скрипт: node app/scripts/extract-patterns.mjs.
4. Записать в artifacts/design-audit.json структуру:
   {
     "colors": { "freq": [...], "palette": {...} },
     "typography": { "families": [...], "sizes": [...] },
     "spacing": { "values": [...] },
     "radii": { "values": [...] },
     "shadows": { "values": [...] },
     "components": [{ "type": "card", "html": "..." }, ...]
   }

## После
→ build_tokens, который из design-audit.json соберёт tokens.json.
```

#### `directives/build_tokens.md`
```
# Цель: собрать единый artifacts/tokens.json + сгенерировать app/src/tokens/{tokens.ts,tokens.css,typography.ts}.

## Источники
- Если был extract_patterns → artifacts/design-audit.json.
- Если ветка Figma → mcp__figma__get_variable_defs.
- Если ветка Git/локалка → существующие токены (CSS variables в :root, theme.ts, tailwind.config, styled-system).
- Если scratch → стартовый шаблон из quickstart.md.

## Структура tokens.json
{ "color": { "brand": {...}, "neutral": {...}, "accent": {...}, "semantic": {...} },
  "space": { "0":0, "1":4, ... },
  "radius": { "sm":8, ... },
  "shadow": { "card": "...", "modal": "...", "focus": "..." },
  "typography": { "family": {...}, "style": {...} } }

## Генерация
- tokens.css — :root { --color-...: #...; --space-...: ...px; ... }, алиасы через var().
- tokens.ts — TS объект с типами, для типобезопасного доступа в компонентах.
- typography.ts — функция className по styleName или CSS object.

Семантические цвета — алиасы на base. В CSS: var(--color-bg-default) = var(--color-white).
```

#### `directives/build_react_ds.md`
```
# Цель: создать/обновить React-компоненты под токены.

## Структура компонента
app/src/components/<tier>/<Name>/
  <Name>.tsx
  <Name>.module.css
  index.ts

## Tier
- atoms — Button, Input, Badge, Icon, Avatar, Tag, Logo, Divider, Spinner, Link
- molecules — FormField, SearchBar, CardHeader, ListItem, Tabs, Toggle
- organisms — кастомные блоки уровня страницы

## Правила
- Только токены через var(--color-...), var(--space-...), var(--radius-...). Никакого хардкода.
- Props именуются как Figma variant property (Variant, Size, Tone, State).
- Variant value strings — те же, что в Figma (primary, secondary, и т.д.).
- Экспорт через index.ts. Главный реестр — app/src/components/index.ts.
```

#### `directives/demo_app.md`
```
# Цель: собрать демо-страницу из существующих компонентов.

## Где
- app/src/pages/<Name>.tsx + .module.css.
- В Figma на 03 — Demo — frame с тем же именем, собранный ТОЛЬКО из инстансов.

## Подключение
- Добавить в app/src/App.tsx и в навигацию (если AppShell).
```

### 1.3 — Конфиги

#### `.mcp.json`
```json
{
  "mcpServers": {
    "figma": { "type": "http", "url": "https://mcp.figma.com/mcp" }
  }
}
```

#### `figma.config.json`
```json
{
  "fileKey": "TBD",
  "fileUrl": "TBD",
  "collections": { "colors": "Colors", "spacing": "Spacing", "radius": "Radius", "typography": "Typography" },
  "pages": { "tokens": "01 — Tokens", "library": "02 — Components", "demo": "03 — Demo" },
  "modes": { "colors": ["Light"] }
}
```

#### `.gitignore`
```
node_modules/
dist/
.env
.env.local
artifacts/figma-mirror.json
```

### 1.4 — Стартовый `tokens.json`

**Никогда не зашивай конкретные цвета / радиусы / spacing вне источника правды.** Они зависят от проекта и должны прийти из:
- Figma (`get_variable_defs`) — ветка A,
- CSS / theme.ts / tailwind.config студента — ветки B/C,
- HTML-парсера (`extract_patterns`) — ветка D,
- ответов студента через `AskUserQuestion` — ветка E.

Ниже — **только схема и правила заполнения**, не дефолтные значения. Шкалы (spacing, radius) и список typography styles — структурно одинаковые во всех проектах, цвета — всегда индивидуальные.

#### Схема

```json
{
  "color": {
    "brand":    { "<token>": "<hex>" },
    "neutral":  { "<token>": "<hex>" },
    "accent":   { "<token>": "<hex>" },
    "semantic": { "<role>/<state>": "{color.<group>.<token>}" }
  },
  "space":      { "<key>": "<px>" },
  "radius":     { "<key>": "<px>" },
  "shadow":     { "<key>": "<css-shadow>" },
  "typography": {
    "family": { "heading": "<font-stack>", "body": "<font-stack>" },
    "style":  { "<group>/<size>": { "family":"heading|body","size":"<px>","line":"<px>","weight":"<num>","tracking":"<num?>" } }
  }
}
```

#### Правила заполнения

1. **Цвета** — обязательно три группы (`brand` / `neutral` / `accent`) + `semantic` как алиасы.
   - `brand` — фирменные (1–3 цвета).
   - `neutral` — серая шкала (3–9 ступеней) + black + white.
   - `accent` — link / success / danger / warning / info (то, что реально используется; не плодить лишнее).
   - `semantic` — **только алиасы** через `{color.group.token}`. Никаких хексов.

2. **Spacing** — 4-pt grid. Минимально достаточный набор: `0, 1, 2, 3, 4, 5, 6, 7, 8` (= 0/4/8/12/16/20/24/32/40px). Если нужны более крупные шаги — добавлять по факту, а не «на будущее».

3. **Radius** — 4–6 ключей (`sm` / `md` / `lg` / `xl` / `2xl` / `full`). `full` = 9999.

4. **Shadow** — 2–4 уровня (например `card` / `modal` / `focus`). Значения — валидные CSS box-shadow строки.

5. **Typography** — 11 базовых стилей (`heading/3xl…sm`, `body/xl…sm`, `caption`) — **этот набор копируй как есть**, он соответствует Text Styles, которые делает `sync_to_figma`. Размеры/высоты строки — пусть студент решает (или импорт из Figma / CSS). Шрифты — стек семейств; если у студента кастомный шрифт, не зарегистрированный в Figma, в `sync_to_figma` сработает fallback на Inter.

#### Если ветка E (scratch) и студент не знает, с чего начать

Запусти `AskUserQuestion`:
> «Какие цвета задают тон проекта?»
> - Brand color (основной) → текстовый ответ (hex)
> - Принцип нейтральной шкалы → 5 ступеней / 7 / 9
> - Нужны ли accent-цвета (success/danger/warning) → да / нет

И собери `tokens.json` под эти ответы. Если совсем нечего сказать — предложи минималистичный generic-набор (черный/белый + шкала серых + один синий accent) и явно пометь его как **placeholder, который студент потом заменит**.

### 1.5 — Сообщить студенту, что MCP подцепится после рестарта

Если только что создали `.mcp.json` — попроси студента **перезапустить Claude Code / Cursor / Antigravity**, иначе Figma MCP не подключится. Подожди подтверждения.

---

## Шаг 2 — Подключить Figma MCP

Прочитай `directives/figma_mcp_setup.md`. Выполни:
1. `mcp__figma__authenticate` — открой URL для студента.
2. После Allow — `mcp__figma__whoami` (должен вернуть email).
3. Если у студента уже есть Figma file — спроси fileKey и подставь в `figma.config.json`. Если нет — попроси создать новый Design file и дать fileKey.
4. `mcp__figma__get_metadata` с nodeId `0:1` — проверка чтения.

---

## Шаг 3 — Конкретная ветка

### Ветка A — «Только Figma»

Сценарий: студент даёт Figma URL, хочет получить React-приложение.

1. Подключиться к Figma (Шаг 2 уже сделан).
2. `mcp__figma__get_variable_defs` для node `0:1` → если есть Variables → синтезировать `artifacts/tokens.json` из них (иначе попроси выделить ключевые цвета через скриншот, сделай вручную).
3. Scaffold Vite app:
   ```bash
   [ -s ~/.nvm/nvm.sh ] && . ~/.nvm/nvm.sh && nvm use 20
   npm create vite@latest app -- --template react-ts
   cd app && npm install && cd ..
   ```
4. Запусти `build_tokens` — генерируй `app/src/tokens/{tokens.ts,tokens.css,typography.ts}` из `tokens.json`.
5. Получи список компонентов из Figma (`get_metadata` страницы Components, если есть). Спроси у студента приоритет (что генерить в первую очередь).
6. Для каждого компонента: `mcp__figma__get_design_context` с nodeId → код+скриншот → адаптируй под наши токены (CSS Vars), создай в `app/src/components/<tier>/<Name>/`.
7. Собери стартовую `App.tsx` и `pages/Dashboard.tsx` с инстансами созданных компонентов.
8. Запусти `parity_check`.

### Ветка B — «Git URL»

1. `git clone <url> .` (в текущую папку, если она пустая — иначе в подпапку и переезд).
2. Определи пакетный менеджер по lock-файлу (package-lock.json → npm, pnpm-lock → pnpm, yarn.lock → yarn, bun.lockb → bun). Установи зависимости.
3. Найди существующие токены: ищи в порядке приоритета:
   - `**/tokens.json`, `**/design-tokens.json`
   - `**/tailwind.config.{js,ts,cjs,mjs}` → секция theme
   - `**/theme.{ts,js}` (Chakra/Mantine/MUI)
   - `**/styled-system/`
   - CSS `:root { --color-... }` через grep
4. Сгенерируй `artifacts/tokens.json` по найденному (приведи к нашей схеме).
5. Найди существующие компоненты (по структуре папок и default exports).
6. Запусти `sync_to_figma`.
7. Запусти `parity_check`.

### Ветка C — «Локальная папка»

То же, что B, но без git clone. Если студент дал путь — `cd <path>` (или предложи перенести файлы в текущую папку, чтобы среда была единой).

### Ветка D — «HTML-страницы»

Сценарий: есть HTML+CSS файлы сайта, нужно превратить в компонентную ДС.

1. Скопируй HTML+ассеты в `source/` (если ещё не там).
2. Создай `directives/extract_patterns.md` (если ещё нет).
3. Создай `app/scripts/extract-patterns.mjs` — Node + cheerio парсер:
   - читает `source/*.html`,
   - извлекает inline styles + computed styles из связанных CSS,
   - группирует цвета по частоте, отступы, радиусы, шрифты,
   - детектирует повторяющиеся блоки → кандидаты в компоненты.
4. `cd app && npm i -D cheerio && node scripts/extract-patterns.mjs` → `artifacts/design-audit.json`.
5. Запусти `build_tokens` → `artifacts/tokens.json` + `app/src/tokens/*`.
6. Запусти `build_react_ds` — создай атомы → молекулы → organisms по паттернам из audit.
7. Запусти `sync_to_figma` (создаст зеркальный Figma-файл).
8. Запусти `parity_check`.

### Ветка E — «Только идея» (scratch)

1. Scaffold Vite app (как в A.3).
2. Собери `artifacts/tokens.json` через опрос студента (см. 1.4 «Если ветка E и студент не знает, с чего начать») — узнай brand color, плотность серой шкалы, нужны ли accent-цвета. Не зашивай дефолты молча — фиксируй выбор студента или явно помечай placeholder.
3. Сгенерируй `tokens.css` + `tokens.ts` + `typography.ts` из получившегося `tokens.json`.
4. Создай минимальный набор атомов (`Button`, `Input`, `Badge`, `Icon`, `Avatar`) — все на CSS Vars, без хардкода.
5. Сделай `App.tsx` — простая страница-демо с этими атомами.
6. Запусти `sync_to_figma` (зальёт всё в свежий Figma-файл).
7. `parity_check`.

### Гибрид (несколько вариантов отмечено)

Иди по веткам последовательно: сначала наиболее «полная» (Git/Local/HTML — у них есть код), потом импорт из Figma (если выбран), потом scratch для недостающего.

---

## Шаг 4 — Запустить React app

```bash
cd app
[ -s ~/.nvm/nvm.sh ] && . ~/.nvm/nvm.sh && nvm use 20
npm run dev
```

Если `npm: command not found` в твоём фоновом запуске — `nvm` не подцепился. Используй явный PATH:
```bash
PATH=$(ls -d ~/.nvm/versions/node/v*/bin | tail -1):$PATH npm run dev
```

Сообщи студенту URL (обычно http://localhost:5173/).

---

## Шаг 5 — Развилка дальше (через AskUserQuestion)

> «Среда готова. Что дальше?»
> - **A. Figma → React** — у меня есть Figma-фрейм, хочу получить React-компонент.
> - **B. React → Figma** — буду писать в коде, хочу автозеркало.
> - **C. Расширить ДС** — добавим новые atoms / molecules / organisms.
> - **D. Демо-страница** — соберём конкретный экран из существующих компонентов.
> - **E. Поправить parity** — есть отчёт parity_check, хочу довести до 1:1.

Каждая ветка использует уже созданные директивы. Выполняй прямо.

---

## Что ОБЯЗАТЕЛЬНО держать в голове

1. **Никакого хардкода** цветов / размеров / шрифтов вне `tokens.ts`.
2. **Имена 1:1.** Компонент в React и Figma называется одинаково. Variant property = React prop.
3. **Каждая итерация — мгновенное зеркалирование.** Не копить долги.
4. **`parity_check` после каждой значимой итерации.**
5. **Не вызывать `resize(W, 0)` на auto-layout. Не создавать TEXT без `setTextStyleIdAsync`.**
6. **Шаг 1.5: после создания `.mcp.json` — рестарт IDE.**

---

## После полного прохождения студент имеет

- Воспроизводимую среду на своём железе с **CLAUDE.md + 3 слоями (директивы + оркестрация + скрипты)**.
- Свой Figma-файл с зеркальной ДС и Token Reference страницей.
- Понимание двух workflow (Figma↔React).
- Привычку синкать сразу, а не копить долг.
- Отчёт `parity-report.md` с известными расхождениями.
