# Цель: собрать единый `artifacts/tokens.json` + сгенерировать `app/src/tokens/{tokens.ts,tokens.css,typography.ts}`.

## Источники
- Если был `extract_patterns` → `artifacts/design-audit.json`.
- Если ветка Figma → `mcp__figma__get_variable_defs`.
- Если ветка Git/локалка → существующие токены (CSS variables в `:root`, `theme.ts`, `tailwind.config`, `styled-system`).
- Если scratch → стартовый шаблон из `quickstart.md`.

## Структура tokens.json
```json
{ "color": { "brand": {}, "neutral": {}, "accent": {}, "semantic": {} },
  "space": { "0": 0, "1": 4 },
  "radius": { "sm": 8 },
  "shadow": { "card": "...", "modal": "...", "focus": "..." },
  "typography": { "family": {}, "style": {} } }
```

## Генерация
- `tokens.css` — `:root { --color-...: #...; --space-...: ...px; ... }`, алиасы через `var()`.
- `tokens.ts` — TS объект с типами, для типобезопасного доступа в компонентах.
- `typography.ts` — функция className по styleName или CSS object.

Семантические цвета — алиасы на base. В CSS: `var(--color-bg-default) = var(--color-white)`.
