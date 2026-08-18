// Generated from artifacts/tokens.json — see directives/build_tokens.md.
// Typed access to the same values that live in tokens.css as CSS variables.
// Prefer var(--...) in CSS/CSS Modules; use this module only where JS needs
// the raw value (e.g. computing something outside of styles).

export const tokens = {
  color: {
    brand: {
      main: '#FFDB00',
      /** Текст/иконки поверх brand.main — в макете это всегда text.dark.1, не белый. */
      contrast: '#0D0E11',
    },
    neutral: {
      white: '#FFFFFF',
      50: '#F8F8F8',
      100: '#EEEEEE',
      200: '#D0D0D0',
      300: '#B9B9B9',
      900: '#373737',
      base: '#22272F',
      'gray-900': '#101828',
      overlay: 'rgba(89,89,89,0.3)',
    },
    accent: {
      danger: '#F5222D',
      'danger-bg': '#FFF1F0',
      success: '#52C41A',
      'success-bg': '#F6FFED',
      warning: '#FADB14',
      'volcano-bg': '#FFF2E8',
    },
    text: {
      dark: {
        1: '#0D0E11',
        2: '#6F7073',
        3: '#9A9DA3',
      },
    },
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  shadow: {
    card: '0 1px 2px 0 rgba(16,24,40,0.06), 0 1px 3px 0 rgba(16,24,40,0.10)',
    modal: '0 0 4px -4px rgba(12,12,13,0.05), 0 16px 32px -4px rgba(12,12,13,0.10)',
    focus: '0 0 0 3px rgba(55,55,55,0.45)',
  },
  typography: {
    family: {
      heading: "'Wix Madefor Display', system-ui, sans-serif",
      body: "'Wix Madefor Display', system-ui, sans-serif",
      action: "'Onest', system-ui, sans-serif",
    },
  },
} as const;

/** CSS var reference for a spacing step, e.g. cssSpace(4) -> "var(--space-4)". */
export function cssSpace(step: keyof typeof tokens.space): string {
  return `var(--space-${step})`;
}

/** CSS var reference for a radius size, e.g. cssRadius('lg') -> "var(--radius-lg)". */
export function cssRadius(size: keyof typeof tokens.radius): string {
  return `var(--radius-${size})`;
}
