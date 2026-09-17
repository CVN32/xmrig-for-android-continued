import React from 'react';
import {
  Card, Slider, Switch, Text, View,
} from 'react-native-ui-lib';
import { useDebouncedCallback } from 'use-debounce';
import { IThermalSettings } from '../../../../core/settings/settings.interface';
import { tokens } from '../../../../core/theme/tokens';
import { SettingsCardProps } from '.';

const MIN_TEMP = 10;
const MAX_TEMP = 120;
const MIN_HYSTERESIS = 1;

const SettingsThermalCard:React.FC<SettingsCardProps<IThermalSettings>> = ({
  settings,
  onUpdate,
}) => {
  const debouncedUpdate = useDebouncedCallback(onUpdate, 1000);

  const pauseMinimum = Math.min(
    MAX_TEMP,
    Math.max(MIN_TEMP, settings.resumeCPUTemperatureNormalValue + MIN_HYSTERESIS),
  );
  const resumeMaximum = Math.max(
    MIN_TEMP,
    Math.min(MAX_TEMP, settings.pauseOnCPUTemperatureOverHeatValue - MIN_HYSTERESIS),
  );

  const updatePauseTemperature = (value: number) => {
    const nextPause = Math.max(value, pauseMinimum);
    const update: Partial<IThermalSettings> = {
      pauseOnCPUTemperatureOverHeatValue: nextPause,
    };
    if (settings.resumeCPUTemperatureNormalValue >= nextPause) {
      update.resumeCPUTemperatureNormalValue = Math.max(MIN_TEMP, nextPause - MIN_HYSTERESIS);
    }
    debouncedUpdate(update);
  };

  const updateResumeTemperature = (value: number) => {
    const nextResume = Math.min(value, resumeMaximum);
    debouncedUpdate({ resumeCPUTemperatureNormalValue: nextResume });
  };

  return (
    <Card enableShadow backgroundColor={tokens.bg.surface}>
      <View centerV spread padding-20 paddingB-5>
        <Card.Section
          style={{ flexShrink: 1 }}
          content={[
            {
              text: 'Thermal',
              text65: true,
              color: tokens.text.primary,
            },
            {
              text: 'Pause / Resume mining based on CPU Temperature to prevent overheating.',
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
          </View>
          <View row flex paddingL-10>
            <Text text80 color={tokens.text.secondary} flex column marginB-5>CPU is Over Heated</Text>
            <Switch
              value={settings.pauseOnCPUTemperatureOverHeat}
              onValueChange={(value) => onUpdate({ pauseOnCPUTemperatureOverHeat: value })}
            />
          </View>
          {settings.pauseOnCPUTemperatureOverHeat && (
            <View row flex paddingL-10 centerV>
              <Text text80 color={tokens.text.secondary} flex column marginB-5>Temperature</Text>
              <Slider
                containerStyle={{ flex: 1 }}
                minimumValue={pauseMinimum}
                maximumValue={MAX_TEMP}
                step={1}
                value={Math.max(settings.pauseOnCPUTemperatureOverHeatValue, pauseMinimum)}
                onValueChange={updatePauseTemperature}
                disabled={!settings.pauseOnCPUTemperatureOverHeat}
              />
              <Text marginL-10 color={tokens.text.primary}>
                {`${Math.round(Math.max(
                  settings.pauseOnCPUTemperatureOverHeatValue,
                  pauseMinimum,
                ))} ℃`}
              </Text>
            </View>
          )}
        </View>
        <View marginB-10>
          <View flex marginB-5>
            <Text text75 color={tokens.text.primary} flex column row>Resume mining on</Text>
          </View>
          <View row flex paddingL-10>
            <Text text80 color={tokens.text.secondary} flex column marginB-5>CPU Temp is Normal</Text>
            <Switch
              value={settings.resumeCPUTemperatureNormal}
              onValueChange={(value) => onUpdate({ resumeCPUTemperatureNormal: value })}
            />
          </View>
          {settings.resumeCPUTemperatureNormal && (
            <View row flex paddingL-10 centerV>
              <Text text80 color={tokens.text.secondary} flex column marginB-5>Temperature</Text>
              <Slider
                containerStyle={{ flex: 1 }}
                minimumValue={MIN_TEMP}
                maximumValue={resumeMaximum}
                step={1}
                value={Math.min(settings.resumeCPUTemperatureNormalValue, resumeMaximum)}
                onValueChange={updateResumeTemperature}
                disabled={!settings.resumeCPUTemperatureNormal}
              />
              <Text marginL-10 color={tokens.text.primary}>
                {`${Math.round(Math.min(
                  settings.resumeCPUTemperatureNormalValue,
                  resumeMaximum,
                ))} ℃`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

export default SettingsThermalCard;
