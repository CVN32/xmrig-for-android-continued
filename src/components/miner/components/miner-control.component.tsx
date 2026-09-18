import _ from 'lodash';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, useColorScheme } from 'react-native';
import uuid from 'react-native-uuid';
import {
  Assets,
  Button,
  Colors,
  Incubator,
  Picker,
  Text,
  Typography,
  View,
  ViewProps,
} from 'react-native-ui-lib';
import { useMiner } from '../../../core/hooks/use-miner.hook';
import { useToaster } from '../../../core/hooks/use-toaster/use-toaster.hook';
import { SessionDataContext } from '../../../core/session-data/session-data.context';
import { WorkingState } from '../../../core/session-data/session-data.interface';
import { SettingsActionType, SettingsContext } from '../../../core/settings';
import {
  ConfigurationMode,
  ISimpleConfiguration,
} from '../../../core/settings/settings.interface';
import { CHROME } from '../../../core/theme/chrome';
import { tokens } from '../../../core/theme/tokens';
import AddConfigurationsModal from '../../settings/modals/add-configuration.modal';

const START_PENDING_TIMEOUT_MS = 6_000;

const pickerValueToId = (value: any): string | undefined => {
  if (typeof value === 'string') {
    return value || undefined;
  }
  if (value && typeof value === 'object') {
    const nested = value.value ?? value.id;
    return typeof nested === 'string' && nested ? nested : undefined;
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
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [startRequested, setStartRequested] = React.useState(false);

  const { selectedConfiguration } = settings;
  const selectedConfig = settings.configurations.find(
    (config) => config.id === selectedConfiguration,
  );
  const selectedSimpleConfig = selectedConfig?.mode === ConfigurationMode.SIMPLE
    ? selectedConfig as ISimpleConfiguration
    : undefined;
  const configuredPool = selectedSimpleConfig?.properties?.pool;
  const configuredPoolEndpoint = configuredPool?.hostname
    ? `${configuredPool.hostname}${configuredPool.port ? `:${configuredPool.port}` : ''}`
    : undefined;

  const isWorking = workingState !== WorkingState.NOT_WORKING;
  const showStopControl = isWorking || startRequested;
  const configsEmpty = _.isEmpty(settings.configurations);
  const selectedConfigExists = Boolean(selectedConfig);

  React.useEffect(() => {
    if (isWorking) {
      setStartRequested(false);
      return undefined;
    }
    if (!startRequested) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setStartRequested(false);
    }, START_PENDING_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [isWorking, startRequested]);

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
      return;
    }

    // Native process startup is asynchronous. Switch controls immediately so
    // the user can always cancel a queued/starting miner.
    setStartRequested(true);
  }, [selectedConfigExists, configsEmpty, startWithSelectedConfiguration, toaster]);

  const handleStopPress = React.useCallback(() => {
    setStartRequested(false);
    handleStop();
  }, [handleStop]);

  const handleSelectConfiguration = React.useCallback((value: any) => {
    settingsDispatcher({
      type: SettingsActionType.SET_SELECTED_CONFIGURAION,
      value: pickerValueToId(value),
    });
  }, [settingsDispatcher]);

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
    setShowAddModal(false);
    toaster({
      message: `Added '${trimmed}'`,
      preset: Incubator.ToastPresets.SUCCESS,
    });
    navigation.navigate('Configuration', { id });
  }, [settingsDispatcher, toaster, navigation]);

  const borderColor = React.useMemo(() => {
    if (configsEmpty) {
      return Colors.$outlineDanger;
    }
    if (!selectedConfigExists) {
      return Colors.$outlineWarning;
    }
    return chrome.border;
  }, [chrome.border, configsEmpty, selectedConfigExists]);

  return (
    <>
      <AddConfigurationsModal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        onAdd={handleAddConfiguration}
      />

      <View
        style={[
          styles.card,
          {
            backgroundColor: chrome.cardBG,
            borderColor,
            borderRadius: chrome.radius,
          },
        ]}
      >
        {configsEmpty ? (
          <View padding-16>
            <Text style={{ ...tokens.type.section, color: chrome.textColor }}>
              No configuration yet
            </Text>
            <Text
              style={{
                ...tokens.type.caption,
                color: chrome.mutedText,
                marginTop: tokens.spacing.xs,
                marginBottom: tokens.spacing.md,
              }}
            >
              Add a profile with a pool and wallet before starting the miner.
            </Text>
            <Button
              size={Button.sizes.large}
              label="Add configuration"
              style={{ minHeight: tokens.touch.min }}
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
        ) : (
          <View padding-16>
            {!showStopControl && (
              <>
                <Text
                  style={{
                    ...tokens.type.caption,
                    color: chrome.mutedText,
                    marginBottom: tokens.spacing.xs,
                  }}
                >
                  Selected configuration
                </Text>
                <Picker
                  key={`cfg-picker-${selectedConfiguration || 'none'}-${settings.configurations.length}`}
                  placeholder="Select configuration"
                  topBarProps={{ title: 'Configurations' }}
                  value={selectedConfiguration}
                  getLabel={(value) => {
                    const id = pickerValueToId(value);
                    const found = settings.configurations.find((config) => config.id === id);
                    return found?.name || 'Select configuration';
                  }}
                  showSearch
                  searchPlaceholder="Search configurations"
                  onChange={handleSelectConfiguration}
                  style={{
                    ...Typography.text60,
                    color: Colors.$textDefault,
                    minHeight: tokens.touch.min,
                  }}
                  placeholderTextColor={chrome.mutedText}
                  migrate
                  migrateTextField
                >
                  {_.map(settings.configurations, (item) => (
                    <Picker.Item
                      key={item.id}
                      value={item.id}
                      label={item.name}
                    />
                  ))}
                </Picker>

                {configuredPoolEndpoint && (
                  <Text
                    numberOfLines={1}
                    style={{
                      ...tokens.type.caption,
                      color: chrome.mutedText,
                      marginTop: tokens.spacing.xs,
                    }}
                  >
                    {configuredPoolEndpoint}
                  </Text>
                )}

                <View row marginT-16>
                  <Button
                    flex
                    outline
                    marginR-8
                    size={Button.sizes.large}
                    style={{ minHeight: tokens.touch.min }}
                    label="Add"
                    onPress={() => setShowAddModal(true)}
                  />
                  <Button
                    flex
                    disabled={!selectedConfigExists}
                    size={Button.sizes.large}
                    style={{ minHeight: tokens.touch.min }}
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
              </>
            )}

            {showStopControl && (
              <>
                <View row spread centerV marginB-12>
                  <View flex marginR-12>
                    <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>
                      {startRequested && !isWorking ? 'Starting miner' : 'Active configuration'}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        ...tokens.type.section,
                        color: chrome.textColor,
                        marginTop: tokens.spacing.xs,
                      }}
                    >
                      {selectedConfig?.name || 'Configuration'}
                    </Text>
                    {configuredPoolEndpoint && (
                      <Text
                        numberOfLines={1}
                        style={{
                          ...tokens.type.caption,
                          color: chrome.mutedText,
                          marginTop: 2,
                        }}
                      >
                        {configuredPoolEndpoint}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: startRequested && !isWorking
                          ? Colors.$backgroundWarningHeavy
                          : tokens.success,
                      },
                    ]}
                  />
                </View>
                <Button
                  size={Button.sizes.large}
                  style={{ minHeight: tokens.touch.min }}
                  backgroundColor={Colors.$backgroundDangerHeavy}
                  onPress={handleStopPress}
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
              </>
            )}
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
