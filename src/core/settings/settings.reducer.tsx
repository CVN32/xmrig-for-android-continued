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

export const SettingsReducer:Reducer<ISettings, ISettingsReducerAction> = (
  prevState: ISettings,
  action: ISettingsReducerAction,
) => {
  switch (action.type) {
    case SettingsActionType.SET:
      return {
        ...action.value as ISettings,
      } as ISettings;
    case SettingsActionType.UPDATE:
      return merge(
        prevState,
        action.value,
      );
    case SettingsActionType.ADD_CONFIGURATION:
      // eslint-disable-next-line no-case-declarations
      const newConfig = (action.value as Configuration).mode === ConfigurationMode.SIMPLE
        ? {
          ...defaultConfiguration,
          ...defaultSimpleConfiguration,
          ...action.value as Configuration,
        }
        : {
          ...defaultConfiguration,
          ...action.value as Configuration,
        };

      // Always coerce id to string and select the new profile atomically
      // (avoids picker N/A / not-found from a separate SELECTED dispatch race).
      // eslint-disable-next-line no-case-declarations
      const newId = String((newConfig as Configuration).id || uuid.v4());
      return {
        ...prevState,
        configurations: [
          ...prevState.configurations,
          {
            ...newConfig,
            id: newId,
          },
        ],
        selectedConfiguration: newId,
      } as ISettings;
    case SettingsActionType.UPDATE_CONFIGURATION:
      return {
        ...prevState,
        configurations: prevState.configurations.map((config) => {
          if (String(config.id) === String((action.value as IConfiguration).id)) {
            return {
              ...(action.value as Configuration),
              id: String((action.value as IConfiguration).id),
            };
          }
          return config;
        }),
      } as ISettings;
    case SettingsActionType.DELETE_CONFIGURATIONS:
      return {
        ...prevState,
        configurations: prevState.configurations.filter(
          (config) => !(action.value as string[]).map(String).includes(String(config.id)),
        ),
        selectedConfiguration: (action.value as string[]).map(String).includes(
          String(prevState.selectedConfiguration),
        )
          ? undefined
          : prevState.selectedConfiguration,
      } as ISettings;
    case SettingsActionType.SET_SELECTED_CONFIGURAION:
      return {
        ...prevState,
        selectedConfiguration: action.value == null || action.value === ''
          ? undefined
          : String(action.value),
      } as ISettings;
    default:
  }
  return prevState;
};
