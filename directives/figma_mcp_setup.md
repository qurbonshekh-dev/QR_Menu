# Цель: подключиться к Figma и проверить доступ к файлу.

## Как это работает на практике (проверено)

Figma-инструменты приходят **не** из `.mcp.json`, а из плагина Figma в Claude Code.
Имена у них с хэш-префиксом сервера, например:

```
mcp__<serverHash>__use_figma
mcp__<serverHash>__get_design_context
```

`.mcp.json` в корне (`https://mcp.figma.com/mcp`) — это отдельный HTTP-сервер, который
требует OAuth и в текущей среде **не авторизован**. Он не нужен: всё, что мы делали,
сделано через плагин. Файл оставлен как есть, чтобы не ломать конфиг quickstart.

## Обязательные скиллы перед вызовом

Figma-инструменты требуют предварительной загрузки скиллов — без них будут
трудноуловимые ошибки:

| Задача | Скилл |
|---|---|
| Любой вызов `use_figma` (запись) | `figma-use` |
| Создание компонентов/переменных | `figma-generate-library` (вместе с `figma-use`) |
| Сборка экранов из инстансов | `figma-generate-design` (вместе с `figma-use`) |
| Чтение дизайна в код (`get_design_context`) | `figma-design-to-code` |

## Smoke-test

1. `get_metadata` без `nodeId` → список страниц документа.
2. `get_metadata` с `nodeId: "0:1"` → структура исходного Style Guide.
3. Проверить, что `fileKey` из `figma.config.json` совпадает: `FMWyIMVAGIPPpP6SsEvGd8`.

## Шпаргалка по инструментам

- **Чтение:** `get_metadata` (структура), `get_design_context` (код+скриншот+токены),
  `get_screenshot`, `get_variable_defs`, `search_design_system`, `get_libraries`
- **Запись:** `use_figma` — единственный универсальный write через Plugin API
- **Ассеты:** `download_assets` (выгрузить SVG/PNG из Figma), `upload_assets` (залить в Figma)

## Грабли `use_figma` (проверены на этом проекте)

- Скрипт **атомарен**: упал — не выполнилось ничего. Читать ошибку, чинить, повторять.
- `figma.currentPage` — только `await figma.setCurrentPageAsync(page)`, и **не чаще одного раза за вызов**.
- `layoutSizingHorizontal = 'FILL'` — только ПОСЛЕ `appendChild` в auto-layout родителя.
- `layoutPositioning = 'ABSOLUTE'` — только если родитель auto-layout (не обычный frame).
- Цвета в диапазоне 0–1, не 0–255.
- Шрифты: `await figma.loadFontAsync({ family, style })` перед ЛЮБОЙ записью текста.
  В нашем ДС стили без пробела: `SemiBold`, `ExtraBold` (у Inter — наоборот, с пробелом).
- `addComponentProperty(name, 'INSTANCE_SWAP', defaultValue)` — дефолт это **id компонента**, не `key`.
- Свойства инстанса адресуются полным ключом с суффиксом: `'Label#22:0'`, не `'Label'`.
- Текстовое свойство на Component Set **общее для всех вариантов** — разные подписи
  у Default/Selected на мастере невозможны (на инстансах переопределяется нормально).
- Instance swap **наследует размер слота**: Toggle 44×24 в слоте Radio 16×16 обрежется.
  Решение — отдельные варианты набора под каждую геометрию слота (см. `FormRow`).
- Возвращать все созданные id через `return` — иначе следующий вызов не сможет на них сослаться.
