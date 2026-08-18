# Цель: формальный аудит совпадения React ↔ Figma.

## Шаги
1. Прочитать список компонентов из `app/src/components/index.ts`.
2. Через `mcp__figma__get_metadata` получить список Component Set / Component на странице "02 — Components".
3. Сравнить:
   - Имя 1:1 (`Button === Button`, не `button-primary`)
   - Variant property names совпадают с React prop names
   - Variant value sets совпадают (например, `Variant=primary|secondary|ghost` для Button)
4. Прочитать `tokens.json` и сравнить с Figma Variables (через `mcp__figma__get_variable_defs`).
5. Записать отчёт в `artifacts/parity-report.md` в формате:
   ```
   ## Колонки
   - ✅ Совпадает
   - ⚠️ Расхождение (с описанием)
   - ❌ Только в коде / только в Figma

   ## TODO
   - список конкретных правок для приведения к 1:1
   ```

## Запускать
После каждой значимой итерации (новый компонент, изменение токена, рефакторинг).
