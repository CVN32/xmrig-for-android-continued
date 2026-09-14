import React from 'react';
import { Colors, LoaderScreen } from 'react-native-ui-lib';
import { StatusBar } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SettingsContext, SettingsContextProvider } from './core/settings';
import { AppNavigator } from './components';
import { SessionDataContextProvider } from './core/session-data/session-data.context';
import { PowerContextProvider } from './core/power/power.context';
import { LoggerContextProvider } from './core/logger';
import { ToasterProvider } from './core/hooks/use-toaster/toaset.context';
import { LoadAssets } from './assets';
import { applyColorScheme, CHROME } from './core/theme/chrome';
import { tokens } from './core/theme/tokens';

enableScreens(false);

const AppWithSettings:React.FC = () => {
  React.useEffect(() => {
    LoadAssets();
    // Consistent dark theme — ignore system light (white cards + faint text).
    applyColorScheme('dark');
  }, []);

  return (
    <SettingsContextProvider>
      <App />
    </SettingsContextProvider>
  );
};

const App = () => {
  const { settings } = React.useContext(SettingsContext);
  const chrome = CHROME.dark;

  const navTheme = React.useMemo(() => ({
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: tokens.accent,
      background: chrome.screenBG,
      card: chrome.cardBG,
      text: chrome.textColor,
      border: chrome.border,
      notification: tokens.accent,
    },
  }), [chrome]);

  if (settings.ready === false) {
    return <LoaderScreen message="Loading..." color={Colors.grey40} />;
  }
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <LoggerContextProvider>
        <PowerContextProvider>
          <SessionDataContextProvider>
            <SafeAreaView
              style={{ flex: 1, backgroundColor: chrome.screenBG }}
              edges={['top', 'left', 'right', 'bottom']}
            >
              <StatusBar
                barStyle="light-content"
                backgroundColor={chrome.screenBG}
                translucent={false}
              />
              <ToasterProvider>
                <NavigationContainer theme={navTheme}>
                  <AppNavigator />
                </NavigationContainer>
              </ToasterProvider>
            </SafeAreaView>
          </SessionDataContextProvider>
        </PowerContextProvider>
      </LoggerContextProvider>
    </SafeAreaProvider>
  );
};

export default AppWithSettings;
