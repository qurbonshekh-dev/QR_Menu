# QR Menu

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
