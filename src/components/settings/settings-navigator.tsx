import React from 'react';
import {
  Colors,
  TabController,
  View,
} from 'react-native-ui-lib';
import { ViewProps, useColorScheme } from 'react-native';
import { CHROME } from '../../core/theme/chrome';
import { LazyLoader } from '../core/lazy-loader';

const ConfigurationsScreen = React.lazy(() => import('./screens/configurations.screen'));
const LazyConfigurationsScreen = () => (<LazyLoader><ConfigurationsScreen /></LazyLoader>);

const SettingsScreen = React.lazy(() => import('./screens/settings.screen'));
const LazySettingsScreen = () => (<LazyLoader><SettingsScreen /></LazyLoader>);

export const TabNavigator:React.FC<ViewProps> = () => {
  const chrome = CHROME[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
  <TabController items={[{ label: 'Configurations' }, { label: 'Settings' }]}>
    <View flex>
      <TabController.TabPage index={0}><LazyConfigurationsScreen /></TabController.TabPage>
      <TabController.TabPage index={1} lazy><LazySettingsScreen /></TabController.TabPage>
    </View>
    <View
      br30
      backgroundColor={chrome.cardBG}
      style={{
        overflow: 'hidden',
        borderColor: Colors.blue40,
        borderTopWidth: 2,
        borderLeftWidth: 0.3,
        borderRightWidth: 0.3,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }}
    >
      <TabController.TabBar
        enableShadow
        backgroundColor={chrome.cardBG}
        labelColor={chrome.textColor}
        selectedLabelColor={chrome.textColor}
      />
    </View>
  </TabController>
);
};
