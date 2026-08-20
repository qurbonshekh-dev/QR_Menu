// Generated from artifacts/tokens.json → typography.style — see directives/build_tokens.md.
// Style names mirror the Figma Text Styles 1:1 (Heading 1..9, Body XXS..XL, Action)
// so sync_to_figma / parity_check can match them by name without translation.
import type { CSSProperties } from 'react';

export type TextStyleName = keyof typeof textStyles;

const family = {
  heading: 'var(--font-heading)',
  body: 'var(--font-body)',
  action: 'var(--font-action)',
} as const;

export const textStyles = {
  'heading-1/extrabold': { family: family.heading, size: 48, line: 52, weight: 800 },
  'heading-2/extrabold': { family: family.heading, size: 44, line: 48, weight: 800 },
  'heading-2/medium': { family: family.heading, size: 44, line: 48, weight: 500 },
  'heading-3/bold': { family: family.heading, size: 40, line: 44, weight: 700 },
  'heading-4/bold': { family: family.heading, size: 36, line: 40, weight: 700 },
  'heading-5/bold': { family: family.heading, size: 32, line: 36, weight: 700 },
  'heading-6/bold': { family: family.heading, size: 28, line: 32, weight: 700 },
  'heading-7/bold': { family: family.heading, size: 24, line: 28, weight: 700 },
  'heading-8/bold': { family: family.heading, size: 20, line: 24, weight: 700 },
  'heading-9/extrabold': { family: family.heading, size: 16, line: 20, weight: 800 },
  'heading-9/medium': { family: family.heading, size: 16, line: 20, weight: 500 },
  'body-xl/regular': { family: family.body, size: 19, line: 32, weight: 400 },
  'body-xl/medium': { family: family.body, size: 19, line: 32, weight: 500 },
  'body-xl/bold': { family: family.body, size: 19, line: 32, weight: 700 },
  'body-l/regular': { family: family.body, size: 17, line: 28, weight: 400 },
  'body-l/medium': { family: family.body, size: 17, line: 28, weight: 500 },
  'body-l/bold': { family: family.body, size: 17, line: 28, weight: 700 },
  'body-m/regular': { family: family.body, size: 15, line: 24, weight: 400 },
  'body-m/medium': { family: family.body, size: 15, line: 24, weight: 500 },
  'body-m/bold': { family: family.body, size: 15, line: 24, weight: 700 },
  'body-s/regular': { family: family.body, size: 13, line: 20, weight: 400 },
  'body-s/medium': { family: family.body, size: 13, line: 20, weight: 500 },
  'body-s/bold': { family: family.body, size: 13, line: 20, weight: 700 },
  'body-xs/regular': { family: family.body, size: 11, line: 16, weight: 400 },
  'body-xs/medium': { family: family.body, size: 11, line: 16, weight: 500 },
  'body-xs/bold': { family: family.body, size: 11, line: 16, weight: 700 },
  'body-xxs/regular': { family: family.body, size: 9, line: 12, weight: 400 },
  'body-xxs/medium': { family: family.body, size: 9, line: 12, weight: 500 },
  'body-xxs/bold': { family: family.body, size: 9, line: 12, weight: 700 },
  'action/semibold': { family: family.action, size: 13, line: 20, weight: 600 },
  // Стили Action, встречающиеся в макете как raw-шрифт (в Figma ещё не заведены
  // как Text Style) — см. artifacts/tokens.json → _notes.
  'action/semibold-l': { family: family.action, size: 15, line: 24, weight: 600 },
  'action/semibold-s': { family: family.action, size: 11, line: 16, weight: 600 },
  'action/medium': { family: family.action, size: 13, line: 20, weight: 500 },
  'action/regular': { family: family.action, size: 11, line: 16, weight: 400 },
} as const;

/** Returns inline CSSProperties for a named text style — use when a CSS Module class isn't practical. */
export function textStyle(name: TextStyleName): CSSProperties {
  const s = textStyles[name];
  return {
    fontFamily: s.family,
    fontSize: s.size,
    lineHeight: `${s.line}px`,
    fontWeight: s.weight,
  };
}

/**
 * Имя глобального CSS-класса для текстового стиля (см. typography.css).
 * `ts('body-s/medium')` → `'ts-body-s-medium'`.
 */
export function ts(name: TextStyleName): string {
  return `ts-${name.replace('/', '-')}`;
}
