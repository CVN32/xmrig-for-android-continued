import React, { useEffect } from 'react';
import {
  TabController,
  View,
  Text,
  ViewProps,
} from 'react-native-ui-lib';

import SplashScreen from 'react-native-splash-screen';
import { createStackNavigator } from '@react-navigation/stack';
import { LazyLoader } from './lazy-loader';
import ConfigurationEditScreen from '../settings/screens/configuration-edit.screen';
import { version } from '../../version';
import { CHROME } from '../../core/theme/chrome';
import { tokens } from '../../core/theme/tokens';

const Stack = createStackNavigator();

const MinerScreen = React.lazy(() => import('../miner/screens/advanced/miner.screen'));
const LogScreen = React.lazy(() => import('../miner/screens/advanced/log.screen'));
const Settings = React.lazy(() => import('../settings/settings-view'));

const LazyMinerScreen = () => (<LazyLoader><MinerScreen /></LazyLoader>);
const LazyLogScreen = () => (<LazyLoader><LogScreen /></LazyLoader>);
const LazySettings = () => (<LazyLoader><Settings /></LazyLoader>);

/** Single bottom tab bar: Miner | Log | Settings (no top tabs). */
const AppTabs: React.FC<ViewProps> = () => {
  const chrome = CHROME.dark;
  return (
    <View flex backgroundColor={chrome.screenBG}>
      <TabController items={[{ label: 'Miner' }, { label: 'Log' }, { label: 'Settings' }]}>
        <View flex backgroundColor={chrome.screenBG}>
          <TabController.TabPage index={0}><LazyMinerScreen /></TabController.TabPage>
          <TabController.TabPage index={1} lazy><LazyLogScreen /></TabController.TabPage>
          <TabController.TabPage index={2} lazy><LazySettings /></TabController.TabPage>
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
            indicatorStyle={{ backgroundColor: tokens.accent }}
          />
        </View>
      </TabController>
    </View>
  );
};

export const AppNavigator: React.FC<ViewProps> = () => {
  const chrome = CHROME.dark;

  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerStyle: { backgroundColor: chrome.screenBG },
        headerTintColor: chrome.textColor,
        cardStyle: { backgroundColor: chrome.screenBG },
      }}
    >
      <Stack.Screen
        name="Main"
        component={AppTabs}
        options={{
          title: 'XMRig Continued',
          headerTitleContainerStyle: { marginLeft: 8 },
          headerRightContainerStyle: { marginRight: 12 },
          headerShadowVisible: false,
          headerRight: () => (
            <Text text90 color={chrome.textColor} style={{ opacity: 0.7 }}>
              v
              {version}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="Configuration"
        component={ConfigurationEditScreen}
        getId={({ params }: any) => params.id}
        options={{ title: 'XMRig Continued | Configurations' }}
      />
    </Stack.Navigator>
  );
};
