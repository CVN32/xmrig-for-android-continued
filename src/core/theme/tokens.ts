/** Design tokens — dark-first elevated UI (sheets/modals). */
export const tokens = {
  bg: {
    app: '#0F1115',
    surface: '#171A21',
    elevated: '#1E2330',
    overlay: 'rgba(0, 0, 0, 0.72)',
  },
  text: {
    primary: '#E8EAED',
    secondary: '#9AA3B2',
    disabled: '#5C6575',
  },
  border: {
    subtle: '#2A3140',
  },
  accent: '#3B82F6',
  danger: '#EF4444',
  success: '#22C55E',
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  touch: {
    min: 48,
  },
  type: {
    title: { fontSize: 18, fontWeight: '600' as const },
    section: { fontSize: 14, fontWeight: '600' as const },
    body: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
    mono: { fontSize: 13, fontWeight: '500' as const },
  },
};

/** Alias: sheets/modals always use elevated, never white. */
export const sheetBg = tokens.bg.elevated;

/**
 * Spread onto Incubator.TextField for high-contrast typed value +
 * floating placeholder on dark surfaces (app-wide default).
 */
export const textFieldDefaults = {
  color: tokens.text.primary,
  labelColor: tokens.text.secondary,
  placeholderTextColor: tokens.text.disabled,
  floatingPlaceholderColor: {
    default: tokens.text.secondary,
    focus: tokens.accent,
  },
};
