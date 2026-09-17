import React from 'react';
import _ from 'lodash';
import { NativeModules } from 'react-native';
import { SettingsContext } from '../settings';
import { Configuration } from '../settings/settings.interface';
import ConfigBuilder from '../xmrig-config/config-builder';

const { XMRigForAndroid } = NativeModules;

export interface IMinerSendCompiguration {
  id: string,
  name: string,
  mode: string,
  xmrig_fork: string,
  config: string,
}

export type MinerStartResult = {
  ok: boolean;
  error?: string;
}

export const useMiner = () => {
  const { settings } = React.useContext(SettingsContext);

  const startHandler = React.useCallback((config: IMinerSendCompiguration): MinerStartResult => {
    if (!XMRigForAndroid?.start) {
      return { ok: false, error: 'Native miner module is unavailable' };
    }
    try {
      XMRigForAndroid.start(JSON.stringify(config));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to start miner',
      };
    }
  }, []);

  const startWithSelectedConfigurationHandler = React.useCallback((): MinerStartResult => {
    if (!settings.selectedConfiguration) {
      return { ok: false, error: 'Select a configuration to start' };
    }

    const cConfig:Configuration | undefined = settings.configurations.find(
      (config) => config.id === settings.selectedConfiguration,
    );
    if (!cConfig) {
      return { ok: false, error: 'Selected configuration no longer exists' };
    }

    try {
      const sConfig = ConfigBuilder.build(cConfig);
      const sConfigPartial: Partial<IMinerSendCompiguration> = _.pick(
        cConfig,
        ['id', 'name', 'mode', 'xmrig_fork'],
      );
      sConfig.setProps({
        'donate-level': settings.donation,
        'print-time': settings.printTime,
      });

      return startHandler({
        ...sConfigPartial,
        config: sConfig.getConfigBase64(),
      } as IMinerSendCompiguration);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Invalid miner configuration',
      };
    }
  }, [settings, startHandler]);

  const stopHandler = React.useCallback(() => {
    XMRigForAndroid?.stop?.();
  }, []);

  return {
    start: startHandler,
    startWithSelectedConfiguration: startWithSelectedConfigurationHandler,
    stop: stopHandler,
  };
};
