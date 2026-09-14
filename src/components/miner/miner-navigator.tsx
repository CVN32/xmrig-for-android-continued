import React from 'react';
import {
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
        backgroundColor={chrome.cardBG}
        style={{
          overflow: 'hidden',
          borderTopWidth: 1,
          borderColor: chrome.border,
        }}
      >
        <TabController.TabBar
          enableShadow={false}
          backgroundColor={chrome.cardBG}
          labelColor={chrome.mutedText}
          selectedLabelColor={chrome.textColor}
        />
      </View>
    </TabController>
  );
};
