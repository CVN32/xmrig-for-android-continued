import React from 'react';
import {
  Card, Switch, Text, View,
} from 'react-native-ui-lib';
import { SettingsCardProps } from '.';
import { IPowerSettings } from '../../../../core/settings/settings.interface';
import { tokens } from '../../../../core/theme/tokens';

const SettingsPowerCard:React.FC<SettingsCardProps<IPowerSettings>> = ({
  settings,
  onUpdate,
}) => (
  <Card enableShadow backgroundColor={tokens.bg.surface}>
    <View centerV spread padding-20 paddingB-5>
      <Card.Section
        style={{ flexShrink: 1 }}
        content={[
          {
            text: 'Power',
            text65: true,
            color: tokens.text.primary,
          },
          {
            text: 'Pause / Resume mining based on Battery level/device Charging.',
            text90: true,
            color: tokens.text.secondary,
          },
        ]}
      />
    </View>
    <View spread padding-20 paddingT-10>
      <View marginB-10>
        <View flex marginB-5>
          <Text text75 color={tokens.text.primary} flex column row>Pause mining on</Text>
          <Text text100 color={tokens.text.secondary} row>
            Will pause the miner, can be resumed from the same point
          </Text>
        </View>
        <View row flex paddingL-10 marginB-5>
          <Text text80 color={tokens.text.secondary} flex column marginB-5>Charger Disconnected</Text>
          <Switch
            value={settings.pauseOnChargerDisconnected}
            onValueChange={(value) => onUpdate({ pauseOnChargerDisconnected: value })}
          />
        </View>
        <View row flex paddingL-10>
          <Text text80 color={tokens.text.secondary} flex column marginB-5>Low Battery</Text>
          <Switch
            value={settings.pauseOnLowBattery}
            onValueChange={(value) => onUpdate({ pauseOnLowBattery: value })}
          />
        </View>
      </View>
      <View marginB-10>
        <View flex marginB-5>
          <Text text75 color={tokens.text.primary} flex column row>Resume mining on</Text>
          <Text text100 color={tokens.text.secondary} row>
            Will resume the mining, will be resumed only if paused
          </Text>
        </View>
        <View row flex paddingL-10 marginB-5>
          <Text text80 color={tokens.text.secondary} flex column marginB-5>Charger Connected</Text>
          <Switch
            value={settings.resumeOnChargerConnected}
            onValueChange={(value) => onUpdate({ resumeOnChargerConnected: value })}
          />
        </View>
        <View row flex paddingL-10>
          <Text text80 color={tokens.text.secondary} flex column marginB-5>Battery Ok</Text>
          <Switch
            value={settings.resumeOnBatteryOk}
            onValueChange={(value) => onUpdate({ resumeOnBatteryOk: value })}
          />
        </View>
      </View>
    </View>
  </Card>
);

export default SettingsPowerCard;
