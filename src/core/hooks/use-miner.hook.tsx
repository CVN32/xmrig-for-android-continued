import React from 'react';
import _ from 'lodash';
import { NativeModules } from 'react-native';
import { Incubator } from 'react-native-ui-lib';
import { SettingsActionType, SettingsContext } from '../settings';
import { Configuration } from '../settings/settings.interface';
import ConfigBuilder from '../xmrig-config/config-builder';
import { useToaster } from './use-toaster/use-toaster.hook';

const { XMRigForAndroid } = NativeModules;

export interface IMinerSendCompiguration {
  id: string,
  name: string,
  mode: string,
  xmrig_fork: string,
  config: string,
}

export const useMiner = () => {
  const toaster = useToaster();
  const { settings, settingsDispatcher } = React.useContext(SettingsContext);

  const startHandler = React.useCallback((config: IMinerSendCompiguration) => {
    if (!XMRigForAndroid?.start) {
      return;
    }
    XMRigForAndroid.start(JSON.stringify(config));
  }, []);

  const startWithSelectedConfigurationHandler = React.useCallback(() => {
    const selectedId = settings.selectedConfiguration
      ? String(settings.selectedConfiguration)
      : undefined;
    if (!selectedId) {
      return;
    }

    const cConfig: Configuration | undefined = settings.configurations.find(
      (config) => String(config.id) === selectedId,
    );

    if (!cConfig) {
      // Stale selection (deleted / mismatched id) — clear so picker recovers
      settingsDispatcher({
        type: SettingsActionType.SET_SELECTED_CONFIGURAION,
        value: undefined,
      });
      toaster({
        message: 'Selected configuration not found — pick another',
        position: 'top',
        preset: Incubator.ToastPresets.FAILURE,
      });
      return;
    }

    const sConfig = ConfigBuilder.build(cConfig);
    if (!sConfig) {
      toaster({
        message: 'Could not build miner config for this profile',
        position: 'top',
        preset: Incubator.ToastPresets.FAILURE,
      });
      return;
    }

    const sConfigPartial: Partial<IMinerSendCompiguration> = _.pick(
      cConfig,
      ['id', 'name', 'mode', 'xmrig_fork'],
    );
    sConfig.setProps({
      'donate-level': settings.donation,
      'print-time': settings.printTime,
    });

    startHandler({
      ...sConfigPartial,
      id: String(cConfig.id),
      config: sConfig.getConfigBase64(),
    } as IMinerSendCompiguration);
  }, [settings, settingsDispatcher, startHandler, toaster]);

  const stopHandler = React.useCallback(() => {
    XMRigForAndroid?.stop?.();
  }, []);

  return {
    start: startHandler,
    startWithSelectedConfiguration: startWithSelectedConfigurationHandler,
    stop: stopHandler,
  };
};
