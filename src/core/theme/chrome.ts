import { Colors } from 'react-native-ui-lib';

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
    screenBG: Colors.grey10,
    cardBG: Colors.grey20,
    textColor: Colors.grey70,
    mutedText: Colors.grey50,
    border: Colors.grey30,
    radius: 12,
    statusBarStyle: 'light-content' as const,
  },
};

export type ChromeScheme = keyof typeof CHROME;

export const applyColorScheme = (system: 'light' | 'dark' | null | undefined): ChromeScheme => {
  const scheme: ChromeScheme = system === 'dark' ? 'dark' : 'light';
  Colors.loadSchemes({
    light: {
      screenBG: CHROME.light.screenBG,
      textColor: CHROME.light.textColor,
      moonOrSun: Colors.yellow30,
      mountainForeground: Colors.green30,
      mountainBackground: Colors.green50,
      $backgroundDefault: Colors.grey70,
      $backgroundElevated: Colors.white,
      $textDefault: Colors.grey10,
      $textNeutral: Colors.grey30,
      $textNeutralLight: Colors.grey40,
    },
    dark: {
      screenBG: CHROME.dark.screenBG,
      textColor: CHROME.dark.textColor,
      moonOrSun: Colors.grey80,
      mountainForeground: Colors.violet10,
      mountainBackground: Colors.violet20,
      $backgroundDefault: Colors.grey10,
      $backgroundElevated: Colors.grey20,
      $textDefault: Colors.grey70,
      $textNeutral: Colors.grey50,
      $textNeutralLight: Colors.grey60,
    },
  });
  Colors.setScheme(scheme);
  return scheme;
};
