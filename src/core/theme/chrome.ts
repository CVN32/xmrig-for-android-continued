import { Colors } from 'react-native-ui-lib';
import { tokens } from './tokens';

/** Opaque chrome — shared by App root, navigators, and cards. */
export const CHROME = {
  light: {
    screenBG: Colors.grey70,
    cardBG: Colors.white,
    textColor: Colors.grey10,
    mutedText: Colors.grey30,
    border: Colors.grey60,
    radius: 12,
    statusBarStyle: 'dark-content' as const,
  },
  dark: {
    screenBG: tokens.bg.app,
    cardBG: tokens.bg.surface,
    textColor: tokens.text.primary,
    mutedText: tokens.text.secondary,
    border: tokens.border.subtle,
    radius: 12,
    statusBarStyle: 'light-content' as const,
  },
};

export type ChromeScheme = keyof typeof CHROME;

export const applyColorScheme = (system: 'light' | 'dark' | null | undefined): ChromeScheme => {
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

  const scheme: ChromeScheme = system === 'dark' ? 'dark' : 'light';
  Colors.loadSchemes({
    light: {
      screenBG: CHROME.light.screenBG,
      textColor: CHROME.light.textColor,
      moonOrSun: Colors.yellow30,
      mountainForeground: Colors.green30,
      mountainBackground: Colors.green50,
      $backgroundDefault: Colors.grey70,
      // Sheets/modals: never white — use elevated dark token
      $backgroundElevated: tokens.bg.elevated,
      $textDefault: tokens.text.primary,
      $textNeutral: tokens.text.secondary,
      $textNeutralLight: tokens.text.disabled,
      $outlineDisabled: tokens.border.subtle,
    },
    dark: {
      screenBG: CHROME.dark.screenBG,
      textColor: CHROME.dark.textColor,
      moonOrSun: Colors.grey80,
      mountainForeground: Colors.violet10,
      mountainBackground: Colors.violet20,
      $backgroundDefault: tokens.bg.app,
      $backgroundElevated: tokens.bg.elevated,
      $textDefault: tokens.text.primary,
      $textNeutral: tokens.text.secondary,
      $textNeutralLight: tokens.text.disabled,
      $outlineDisabled: tokens.border.subtle,
    },
  });
  Colors.setScheme(scheme);
  return scheme;
};
