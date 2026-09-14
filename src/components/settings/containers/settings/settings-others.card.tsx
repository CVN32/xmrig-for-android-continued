import React from 'react';
import {
  Card, Slider, Text, View,
} from 'react-native-ui-lib';
import { useDebouncedCallback } from 'use-debounce';
import { SettingsCardProps } from '.';
import { ISettings } from '../../../../core/settings/settings.interface';
import { tokens } from '../../../../core/theme/tokens';

const SettingsOthersCard:React.FC<SettingsCardProps<ISettings>> = ({
  settings,
  onUpdate,
}) => {
  const debouncedUpdate = useDebouncedCallback(onUpdate, 1000);

  return (
    <Card enableShadow backgroundColor={tokens.bg.surface}>
      <View centerV spread padding-20 paddingB-5>
        <Card.Section
          style={{ flexShrink: 1 }}
          content={[
            {
              text: 'General',
              text65: true,
              color: tokens.text.primary,
            },
          ]}
        />
      </View>
      <View spread padding-20 paddingT-10>
        <View marginB-10>
          <View flex marginB-5>
            <Text text75 color={tokens.text.primary} flex column row>Print Time</Text>
            <Text text100 color={tokens.text.secondary} row>
              Print hashrate report every specified number of seconds
            </Text>
          </View>
          <View row flex centerV>
            <Slider
              containerStyle={{ flex: 1 }}
              minimumValue={0}
              maximumValue={300}
              step={10}
              value={settings.printTime}
              onValueChange={
              (value) => debouncedUpdate({ printTime: value })
            }
            />
            <Text marginL-10 color={tokens.text.primary}>
              {settings.printTime}
              s
            </Text>
          </View>
        </View>
        <View marginB-10>
          <View flex marginB-5>
            <Text text75 color={tokens.text.primary} flex column row>Donate Level</Text>
            <Text text100 color={tokens.text.secondary} row>
              Donate level percentage, min 1% (1 minute in 100 minutes)
            </Text>
          </View>
          <View row flex centerV>
            <Slider
              containerStyle={{ flex: 1 }}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={settings.donation}
              onValueChange={
              (value) => debouncedUpdate({ donation: value })
            }
            />
            <Text marginL-10 color={tokens.text.primary}>
              {settings.donation}
              %
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

export default SettingsOthersCard;
