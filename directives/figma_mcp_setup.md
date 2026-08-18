# Цель: подключить Figma MCP к среде, проверить smoke-test.

## Шаги
1. Убедиться, что `.mcp.json` в корне содержит:
   ```json
   { "mcpServers": { "figma": { "type": "http", "url": "https://mcp.figma.com/mcp" } } }
   ```
2. После создания `.mcp.json` — попросить студента перезапустить Claude Code/Cursor/Antigravity (иначе MCP не подхватится).
3. На первый вызов любого `mcp__figma__*` — будет OAuth в браузере. Если ничего не открылось:
   - Вызвать `mcp__figma__authenticate`, отдать студенту полученный URL.
   - Если редирект упал на localhost — попросить URL из адресной строки и вызвать `complete_authentication`.
4. Smoke-test:
   - `mcp__figma__whoami` → должен вернуть email/handle
   - `mcp__figma__get_metadata` с nodeId `"0:1"` — структура файла
5. Если ошибка 401 — токен истёк, повторить authenticate.

## Tools шпаргалка
- `get_metadata`, `get_design_context`, `get_screenshot`, `get_variable_defs`, `whoami` — read
- `use_figma` — главный write через Figma Plugin API
- `generate_figma_design` — генерация дизайна по описанию
- `create_new_file` — новый Figma-файл

## Лимиты use_figma
- ~15KB кода на вызов → большие операции дробить
- `figma.currentPage` read-only → `await figma.setCurrentPageAsync(page)`
- `layoutSizingHorizontal "FILL"` — только ПОСЛЕ добавления ребёнка в родителя
- Шрифты — через `figma.loadFontAsync({ family, style })`. Inter "Semi Bold" с пробелом, не "SemiBold"
- Variable aliases — `{ type: "VARIABLE_ALIAS", id: targetVariableId }`
