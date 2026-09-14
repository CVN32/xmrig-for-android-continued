import React from 'react';
import {
  Colors,
  TabController,
  View,
} from 'react-native-ui-lib';
import { ViewProps, useColorScheme } from 'react-native';
import { CHROME } from '../../core/theme/chrome';
import { LazyLoader } from '../core/lazy-loader';

const MinerScreen = React.lazy(() => import('./screens/advanced/miner.screen'));
const LogScreen = React.lazy(() => import('./screens/advanced/log.screen'));

const LazyMinerScreen = () => (<LazyLoader><MinerScreen /></LazyLoader>);
const LazyLogScreen = () => (<LazyLoader><LogScreen /></LazyLoader>);

export const TabNavigator:React.FC<ViewProps> = () => {
  const chrome = CHROME[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
  <TabController items={[{ label: 'Miner' }, { label: 'Log' }]}>
    <View flex>
      <TabController.TabPage index={0}><LazyMinerScreen /></TabController.TabPage>
      <TabController.TabPage index={1} lazy><LazyLogScreen /></TabController.TabPage>
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
