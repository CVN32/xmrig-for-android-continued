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
import { useMiner } from '../../../core/hooks/use-miner.hook';
import { SessionDataContext } from '../../../core/session-data/session-data.context';
import { WorkingState } from '../../../core/session-data/session-data.interface';
import { SettingsActionType, SettingsContext } from '../../../core/settings';
import { useToaster } from '../../../core/hooks/use-toaster/use-toaster.hook';
import { CHROME } from '../../../core/theme/chrome';
import AddConfigurationsModal from '../../settings/modals/add-configuration.modal';
import { ConfigurationMode } from '../../../core/settings/settings.interface';

export const MinerControl:React.FC<ViewProps> = () => {
  const toaster = useToaster();
  const chrome = CHROME[useColorScheme() === 'dark' ? 'dark' : 'light'];

  const { workingState } = React.useContext(SessionDataContext);
  const { startWithSelectedConfiguration, stop: handleStop } = useMiner();

  const { settings, settingsDispatcher } = React.useContext(SettingsContext);
  const [showAddModal, setShowAddModal] = React.useState(false);

  // Single source of truth: settings.selectedConfiguration (always string | undefined)
  const selectedId = settings.selectedConfiguration
    ? String(settings.selectedConfiguration)
    : undefined;

  const selectedLabel = React.useMemo(() => {
    if (!selectedId) {
      return undefined;
    }
    const found = settings.configurations.find(
      (config) => String(config.id) === selectedId,
    );
    return found?.name;
  }, [settings.configurations, selectedId]);

  const isWorking = React.useMemo<boolean>(
    () => workingState !== WorkingState.NOT_WORKING,
    [workingState],
  );

  const configsEmpty = _.isEmpty(settings.configurations);

  const handleStart = React.useCallback(() => {
    if (!selectedId) {
      if (configsEmpty) {
        toaster({
          message: 'Add a configuration first',
          position: 'top',
          preset: Incubator.ToastPresets.FAILURE,
        });
      } else {
        toaster({
          message: 'Select a configuration to start',
          position: 'top',
          preset: Incubator.ToastPresets.FAILURE,
        });
      }
    } else {
      startWithSelectedConfiguration();
    }
  }, [selectedId, configsEmpty, startWithSelectedConfiguration, toaster]);

  const handlePickerChange = React.useCallback((value: any) => {
    const id = value == null || value === '' ? undefined : String(value);
    settingsDispatcher({
      type: SettingsActionType.SET_SELECTED_CONFIGURAION,
      value: id,
    });
  }, [settingsDispatcher]);

  const handleAddConfiguration = React.useCallback((name: string, mode: ConfigurationMode) => {
    const id = String(uuid.v4());
    // ADD_CONFIGURATION also sets selectedConfiguration to this id
    settingsDispatcher({
      type: SettingsActionType.ADD_CONFIGURATION,
      value: {
        id,
        name,
        mode,
      },
    });
    setShowAddModal(false);
    toaster({
      message: `Added '${name}' — edit it from Configurations when ready`,
      position: 'top',
      preset: Incubator.ToastPresets.SUCCESS,
    });
  }, [settingsDispatcher, toaster]);

  const cardBorderColor = React.useMemo<string>(() => {
    if (!selectedId) {
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
  }, [selectedId, configsEmpty, workingState]);

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
          borderRadius: 12,
        }}
      >
        {workingState === WorkingState.NOT_WORKING && configsEmpty && (
          <View padding-16>
            <Text text70 $textDefault marginB-6>No configuration yet</Text>
            <Text text90 $textNeutral marginB-14>
              Add a profile to pick a pool and wallet, then you can start mining here.
            </Text>
            <Button
              size={Button.sizes.medium}
              label="Add configuration"
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
          <View row centerV padding-12>
            <View flex marginR-10>
              <Picker
                floatingPlaceholder
                placeholder={selectedId ? 'Selected configuration' : 'Select configuration'}
                topBarProps={{ title: 'Configurations' }}
                value={selectedId}
                getLabel={
                  (value) => {
                    const id = value == null ? '' : String(value);
                    const found = settings.configurations.find(
                      (config) => String(config.id) === id,
                    );
                    // Prefer live name; never sticky N/A when id exists in list
                    if (found?.name) {
                      return found.name;
                    }
                    if (selectedId && id === selectedId && selectedLabel) {
                      return selectedLabel;
                    }
                    return id ? `Config ${id.slice(0, 8)}` : 'Select configuration';
                  }
                }
                showSearch
                searchPlaceholder="Search configurations"
                onChange={handlePickerChange}
                style={{ ...Typography.text70, color: Colors.$textDefault }}
                floatingPlaceholderStyle={{ ...Typography.text80, color: Colors.$textNeutral }}
                migrate
                migrateTextField
              >
                {_.map(settings.configurations, (item) => (
                  <Picker.Item
                    key={String(item?.id)}
                    value={String(item?.id || '')}
                    label={item?.name || String(item?.id || '')}
                  />
                ))}
              </Picker>
            </View>
            <Button
              size={Button.sizes.small}
              outline
              marginR-8
              label="Add"
              onPress={() => setShowAddModal(true)}
            />
            <Button
              size={Button.sizes.small}
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
        )}

        {isWorking && (
          <View padding-12>
            <Button
              size={Button.sizes.medium}
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
