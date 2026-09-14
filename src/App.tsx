import React from 'react';
import { Colors, LoaderScreen } from 'react-native-ui-lib';
import { Appearance, StatusBar, useColorScheme } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { SettingsContext, SettingsContextProvider } from './core/settings';
import { AppNavigator } from './components';
import { SessionDataContextProvider } from './core/session-data/session-data.context';
import { PowerContextProvider } from './core/power/power.context';
import { LoggerContextProvider } from './core/logger';
import { ToasterProvider } from './core/hooks/use-toaster/toaset.context';
import { LoadAssets } from './assets';
import { applyColorScheme, CHROME } from './core/theme/chrome';

enableScreens(false);

const AppWithSettings:React.FC = () => {
  React.useEffect(() => {
    LoadAssets();
    applyColorScheme(Appearance.getColorScheme());
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      applyColorScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  return (
    <SettingsContextProvider>
      <App />
    </SettingsContextProvider>
  );
};

const App = () => {
  const { settings } = React.useContext(SettingsContext);
  const systemScheme = useColorScheme();
  const scheme = systemScheme === 'dark' ? 'dark' : 'light';
  const chrome = CHROME[scheme];

  if (settings.ready === false) {
    return <LoaderScreen message="Loading..." color={Colors.grey40} />;
  }
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <LoggerContextProvider>
        <PowerContextProvider>
          <SessionDataContextProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: chrome.screenBG }} edges={['top', 'left', 'right']}>
              <StatusBar barStyle={chrome.statusBarStyle} backgroundColor={chrome.screenBG} translucent={false} />
              <ToasterProvider>
                <NavigationContainer>
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
