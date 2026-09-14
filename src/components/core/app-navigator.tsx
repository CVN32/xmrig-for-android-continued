import React, { useEffect } from 'react';
import {
  TabController,
  View,
  Text,
  ViewProps,
} from 'react-native-ui-lib';
import { useColorScheme } from 'react-native';

import SplashScreen from 'react-native-splash-screen';
import { createStackNavigator } from '@react-navigation/stack';
import { LazyLoader } from './lazy-loader';
import ConfigurationEditScreen from '../settings/screens/configuration-edit.screen';
import { version } from '../../version';
import { CHROME } from '../../core/theme/chrome';

const Stack = createStackNavigator();

const Settings = React.lazy(() => import('../settings/settings-view'));
const Miner = React.lazy(() => import('../miner/miner-view'));

const LazySettings = () => (<LazyLoader><Settings /></LazyLoader>);
const LazyMiner = () => (<LazyLoader><Miner /></LazyLoader>);

const AppTabs:React.FC<ViewProps> = () => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const chrome = CHROME[scheme];
  return (
    <View flex backgroundColor={chrome.screenBG}>
      <TabController items={[{ label: 'Miner' }, { label: 'Settings' }]}>
        <TabController.TabBar
          enableShadow
          backgroundColor={chrome.screenBG}
          labelColor={chrome.textColor}
          selectedLabelColor={chrome.textColor}
        />
        <View flex backgroundColor={chrome.screenBG}>
          <TabController.TabPage index={0}><LazyMiner /></TabController.TabPage>
          <TabController.TabPage index={1} lazy><LazySettings /></TabController.TabPage>
        </View>
      </TabController>
    </View>
  );
};

export const AppNavigator:React.FC<ViewProps> = () => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const chrome = CHROME[scheme];

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
