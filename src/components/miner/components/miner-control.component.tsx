import _ from 'lodash';
import React from 'react';
import {
  Picker,
  View,
  Button,
  ViewProps,
  Colors,
  Typography,
  Incubator,
  Card,
  Assets,
  Text,
} from 'react-native-ui-lib';
import uuid from 'react-native-uuid';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMiner } from '../../../core/hooks/use-miner.hook';
import { SessionDataContext } from '../../../core/session-data/session-data.context';
import { WorkingState } from '../../../core/session-data/session-data.interface';
import { SettingsActionType, SettingsContext } from '../../../core/settings';
import { useToaster } from '../../../core/hooks/use-toaster/use-toaster.hook';
import { CHROME } from '../../../core/theme/chrome';
import AddConfigurationsModal from '../../settings/modals/add-configuration.modal';
import { ConfigurationMode } from '../../../core/settings/settings.interface';

const TOUCH_MIN = 48;

const pickerValueToId = (value: any): string | undefined => {
  if (typeof value === 'string') {
    return value || undefined;
  }
  if (value && typeof value.value === 'string') {
    return value.value || undefined;
  }
  return undefined;
};

export const MinerControl: React.FC<ViewProps> = () => {
  const toaster = useToaster();
  const navigation = useNavigation<any>();
  const chrome = CHROME[useColorScheme() === 'dark' ? 'dark' : 'light'];

  const { workingState } = React.useContext(SessionDataContext);
  const { startWithSelectedConfiguration, stop: handleStop } = useMiner();

  const { settings, settingsDispatcher } = React.useContext(SettingsContext);
  const [selectedConfiguration, setSelectedConfiguration] = React.useState<string | undefined>(
    settings.selectedConfiguration,
  );
  const [showAddModal, setShowAddModal] = React.useState(false);

  const isWorking = React.useMemo<boolean>(
    () => workingState !== WorkingState.NOT_WORKING,
    [workingState],
  );

  const configsEmpty = _.isEmpty(settings.configurations);
  const selectedConfigExists = Boolean(
    settings.selectedConfiguration
      && settings.configurations.some((config) => config.id === settings.selectedConfiguration),
  );

  const handleStart = React.useCallback(() => {
    if (!selectedConfigExists) {
      toaster({
        message: configsEmpty
          ? 'Add a configuration first'
          : 'Select a valid configuration to start',
        preset: Incubator.ToastPresets.FAILURE,
      });
      return;
    }

    const result = startWithSelectedConfiguration();
    if (!result.ok) {
      toaster({
        message: result.error || 'Unable to start miner',
        preset: Incubator.ToastPresets.FAILURE,
      });
    }
  }, [selectedConfigExists, configsEmpty, startWithSelectedConfiguration, toaster]);

  React.useEffect(() => {
    if (selectedConfiguration !== settings.selectedConfiguration) {
      settingsDispatcher({
        type: SettingsActionType.SET_SELECTED_CONFIGURAION,
        value: selectedConfiguration,
      });
    }
  }, [selectedConfiguration, settings.selectedConfiguration, settingsDispatcher]);

  React.useEffect(() => {
    if (settings.selectedConfiguration !== selectedConfiguration) {
      setSelectedConfiguration(settings.selectedConfiguration);
    }
  }, [settings.selectedConfiguration, selectedConfiguration]);

  const handleAddConfiguration = React.useCallback((name: string, mode: ConfigurationMode) => {
    const id = `${uuid.v4()}`;
    const trimmed = (name || '').trim() || 'New configuration';
    settingsDispatcher({
      type: SettingsActionType.ADD_CONFIGURATION,
      value: {
        id,
        name: trimmed,
        mode,
      },
    });
    setSelectedConfiguration(id);
    setShowAddModal(false);
    toaster({
      message: `Added '${trimmed}'`,
      preset: Incubator.ToastPresets.SUCCESS,
    });
    navigation.navigate('Configuration', { id });
  }, [settingsDispatcher, toaster, navigation]);

  const cardBorderColor = React.useMemo<string>(() => {
    if (!selectedConfigExists) {
      if (configsEmpty) {
        return Colors.$outlineDanger;
      }
      return Colors.$outlineWarning;
    }
    if (workingState === WorkingState.MINING) {
      return Colors.$outlinePrimary;
    }
    if (workingState === WorkingState.PAUSED) {
      return Colors.$outlineWarning;
    }
    return Colors.$outlinePrimary;
  }, [selectedConfigExists, configsEmpty, workingState]);

  return (
    <>
      <AddConfigurationsModal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        onAdd={handleAddConfiguration}
      />
      <Card
        enableShadow
        backgroundColor={chrome.cardBG}
        selected={!isWorking}
        selectionOptions={{
          hideIndicator: true,
          color: cardBorderColor,
        }}
        containerStyle={{
          overflow: 'hidden',
          borderRadius: chrome.radius,
        }}
      >
        {workingState === WorkingState.NOT_WORKING && configsEmpty && (
          <View padding-16>
            <Text text70 $textDefault marginB-6>No configuration yet</Text>
            <Text text90 $textNeutral marginB-14>
              Add a profile to pick a pool and wallet, then you can start mining here.
            </Text>
            <Button
              size={Button.sizes.large}
              label="Add configuration"
              style={{ minHeight: TOUCH_MIN }}
              iconSource={Assets.icons.clipboard}
              iconStyle={{
                width: 14,
                height: 18,
                marginRight: 8,
                tintColor: Colors.$iconDefaultLight,
              }}
              onPress={() => setShowAddModal(true)}
            />
          </View>
        )}

        {workingState === WorkingState.NOT_WORKING && !configsEmpty && (
          <View padding-12>
            <Picker
              key={`cfg-picker-${selectedConfiguration || 'none'}-${settings.configurations.length}`}
              floatingPlaceholder
              placeholder={selectedConfiguration ? 'Selected configuration' : 'Select configuration'}
              topBarProps={{ title: 'Configurations' }}
              value={selectedConfiguration}
              getLabel={(value) => {
                const id = pickerValueToId(value);
                const found = settings.configurations.find((config) => config.id === id);
                return found?.name || 'Select configuration';
              }}
              showSearch
              searchPlaceholder="Search configurations"
              onChange={(value: any) => setSelectedConfiguration(pickerValueToId(value))}
              style={{ ...Typography.text70, color: Colors.$textDefault, minHeight: TOUCH_MIN }}
              floatingPlaceholderStyle={{ ...Typography.text80, color: Colors.$textNeutral }}
              migrate
              migrateTextField
            >
              {_.map(settings.configurations, (item) => (
                <Picker.Item
                  key={item?.id}
                  value={item?.id || ''}
                  label={item?.name}
                />
              ))}
            </Picker>
            <View row marginT-12>
              <Button
                flex
                outline
                marginR-8
                size={Button.sizes.large}
                style={{ minHeight: TOUCH_MIN }}
                label="Add"
                onPress={() => setShowAddModal(true)}
              />
              <Button
                flex
                size={Button.sizes.large}
                style={{ minHeight: TOUCH_MIN }}
                onPress={handleStart}
                label="Start"
                iconSource={Assets.icons.start}
                iconStyle={{
                  width: 8,
                  height: 10,
                  margin: 5,
                  marginRight: 10,
                  tintColor: Colors.$iconDefaultLight,
                }}
              />
            </View>
          </View>
        )}

        {isWorking && (
          <View padding-12>
            <Button
              size={Button.sizes.large}
              style={{ minHeight: TOUCH_MIN }}
              backgroundColor={Colors.$backgroundDangerHeavy}
              onPress={handleStop}
              label="Stop"
              iconSource={Assets.icons.stop}
              iconStyle={{
                width: 15,
                height: 15,
                margin: 5,
                marginRight: 10,
                tintColor: Colors.$iconDefaultLight,
              }}
              text65
            />
          </View>
        )}
      </Card>
    </>
  );
};
