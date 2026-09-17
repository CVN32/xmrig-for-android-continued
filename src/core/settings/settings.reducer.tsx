import { Reducer } from 'react';
import uuid from 'react-native-uuid';
import merge from 'lodash/fp/merge';
import { SettingsActionType } from './settings.actions';
import { defaultConfiguration, defaultSimpleConfiguration } from './settings.context';
import {
  Configuration,
  ConfigurationMode,
  IConfiguration,
  ISettings,
  ISettingsReducerAction,
} from './settings.interface';

const normalizeSelectedConfiguration = (
  configurations: Configuration[],
  selectedConfiguration?: unknown,
): string | undefined => {
  const selectedId = typeof selectedConfiguration === 'string'
    ? selectedConfiguration
    : undefined;

  if (selectedId && configurations.some((config) => config.id === selectedId)) {
    return selectedId;
  }

  return configurations[0]?.id ? `${configurations[0].id}` : undefined;
};

export const SettingsReducer:Reducer<ISettings, ISettingsReducerAction> = (
  prevState: ISettings,
  action: ISettingsReducerAction,
) => {
  switch (action.type) {
    case SettingsActionType.SET: {
      const nextState = action.value as ISettings;
      const configurations = nextState.configurations || [];
      return {
        ...nextState,
        configurations,
        selectedConfiguration: normalizeSelectedConfiguration(
          configurations,
          nextState.selectedConfiguration,
        ),
      } as ISettings;
    }
    case SettingsActionType.UPDATE: {
      const nextState = merge(prevState, action.value) as ISettings;
      return {
        ...nextState,
        selectedConfiguration: normalizeSelectedConfiguration(
          nextState.configurations,
          nextState.selectedConfiguration,
        ),
      };
    }
    case SettingsActionType.ADD_CONFIGURATION: {
      const incoming = action.value as Configuration;
      const newConfig = incoming.mode === ConfigurationMode.SIMPLE
        ? {
          ...defaultConfiguration,
          ...defaultSimpleConfiguration,
          ...incoming,
        }
        : {
          ...defaultConfiguration,
          ...incoming,
        };

      const createdId = `${newConfig.id || uuid.v4()}`;
      const createdName = (newConfig.name || '').trim() || 'New configuration';
      return {
        ...prevState,
        selectedConfiguration: createdId,
        configurations: [
          ...prevState.configurations,
          {
            ...newConfig,
            id: createdId,
            name: createdName,
          },
        ],
      } as ISettings;
    }
    case SettingsActionType.UPDATE_CONFIGURATION: {
      const incoming = action.value as IConfiguration;
      const configurations = prevState.configurations.map((config) => {
        if (config.id === incoming.id) {
          return {
            ...config,
            ...incoming,
            id: config.id,
            name: (incoming.name || config.name || '').trim() || 'New configuration',
          } as Configuration;
        }
        return config;
      });
      return {
        ...prevState,
        configurations,
        selectedConfiguration: normalizeSelectedConfiguration(
          configurations,
          prevState.selectedConfiguration,
        ),
      } as ISettings;
    }
    case SettingsActionType.DELETE_CONFIGURATIONS: {
      const deletedIds = new Set((action.value as string[]).map((id) => `${id}`));
      const configurations = prevState.configurations.filter(
        (config) => !deletedIds.has(`${config.id}`),
      );
      return {
        ...prevState,
        configurations,
        selectedConfiguration: normalizeSelectedConfiguration(
          configurations,
          prevState.selectedConfiguration,
        ),
      } as ISettings;
    }
    case SettingsActionType.SET_SELECTED_CONFIGURAION: {
      const rawValue = action.value as any;
      const selectedId = typeof rawValue === 'string'
        ? rawValue
        : rawValue?.value;
      return {
        ...prevState,
        selectedConfiguration: normalizeSelectedConfiguration(
          prevState.configurations,
          selectedId,
        ),
      } as ISettings;
    }
    default:
      return prevState;
  }
};
