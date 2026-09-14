import { Colors } from 'react-native-ui-lib';
import { tokens } from './tokens';

/** Opaque chrome — dark-first (avoid white cards + light-gray text). */
const darkChrome = {
  screenBG: tokens.bg.app,
  cardBG: tokens.bg.surface,
  textColor: tokens.text.primary,
  mutedText: tokens.text.secondary,
  border: tokens.border.subtle,
  radius: 12,
  statusBarStyle: 'light-content' as const,
};

export const CHROME = {
  light: { ...darkChrome },
  dark: { ...darkChrome },
};

export type ChromeScheme = keyof typeof CHROME;

/**
 * Always pin ui-lib semantic colors to the dark elevated palette.
 * Field testing showed light cards + light $text* = invisible section titles.
 */
export const applyColorScheme = (
  _system?: 'light' | 'dark' | null,
): ChromeScheme => {
  Colors.loadColors({
    bgApp: tokens.bg.app,
    bgSurface: tokens.bg.surface,
    bgElevated: tokens.bg.elevated,
    textPrimary: tokens.text.primary,
    textSecondary: tokens.text.secondary,
    textDisabled: tokens.text.disabled,
    borderSubtle: tokens.border.subtle,
    accent: tokens.accent,
    danger: tokens.danger,
    success: tokens.success,
  });

  const schemeColors = {
    screenBG: tokens.bg.app,
    textColor: tokens.text.primary,
    moonOrSun: Colors.grey80,
    mountainForeground: Colors.violet10,
    mountainBackground: Colors.violet20,
    $backgroundDefault: tokens.bg.app,
    $backgroundElevated: tokens.bg.elevated,
    $backgroundNeutralLight: tokens.bg.surface,
    $backgroundNeutral: tokens.bg.surface,
    $textDefault: tokens.text.primary,
    $textNeutral: tokens.text.secondary,
    $textNeutralLight: tokens.text.secondary,
    $outlineDisabled: tokens.border.subtle,
  };

  Colors.loadSchemes({
    light: schemeColors,
    dark: schemeColors,
  });
  Colors.setScheme('dark');
  return 'dark';
};
