# Цель: создать/обновить React-компоненты под токены.

## Структура компонента
```
packages/ui/src/components/<tier>/<Name>/
  <Name>.tsx
  <Name>.module.css
  index.ts
```

## Tier
- atoms — Button, Input, Badge, Icon, Avatar, Tag, Logo, Divider, Spinner, Link
- molecules — FormField, SearchBar, CardHeader, ListItem, Tabs, Toggle
- organisms — кастомные блоки уровня страницы

## Правила
- Только токены через `var(--color-...)`, `var(--space-...)`, `var(--radius-...)`. Никакого хардкода.
- Props именуются как Figma variant property (Variant, Size, Tone, State).
- Variant value strings — те же, что в Figma (primary, secondary, и т.д.).
- Экспорт через `index.ts`. Главный реестр — `packages/ui/src/components/index.ts`.
