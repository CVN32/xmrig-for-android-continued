import React, {
  createContext,
  Context,
  useReducer,
  Dispatch,
  useEffect,
  useState,
  useMemo,
} from 'react';
import uuid from 'react-native-uuid';
import merge from 'lodash/fp/merge';
import { SettingsActionType } from './settings.actions';
import {
  Algorithems,
  ConfigurationMode,
  IConfiguration,
  ISettings,
  ISettingsReducerAction,
  ISimpleConfiguration,
  RandomXMode,
  XMRigFork,
} from './settings.interface';
import { SettingsReducer } from './settings.reducer';
import { SettingsStorageInit, SettingsStorageSave } from './settings.storage';

const initialState: ISettings = {
  ready: false,
  uuid: uuid.v4().toString(),
  configurations: [],
  selectedConfiguration: undefined,
  power: {
    pauseOnChargerDisconnected: false,
    pauseOnLowBattery: false,
    resumeOnBatteryOk: false,
    resumeOnChargerConnected: false,
  },
  thermal: {
    pauseOnCPUTemperatureOverHeat: false,
    pauseOnCPUTemperatureOverHeatValue: 90.0,
    resumeCPUTemperatureNormal: false,
    resumeCPUTemperatureNormalValue: 80.0,
  },
  donation: 5,
  printTime: 60,
};

export const defaultConfiguration: Partial<IConfiguration> = {
  xmrig_fork: XMRigFork.ORIGINAL,
};

const defaultAlgorithems = Algorithems.reduce((acc, item) => ({
  ...acc,
  [item]: true,
}), {});

export const defaultSimpleConfiguration: Partial<ISimpleConfiguration> = {
  properties: {
    cpu: {
      yield: true,
      random_x_mode: RandomXMode.LIGHT,
      max_threads_hint: 100,
    },
    algos: {
      ...defaultAlgorithems,
      'cn/gpu': false,
      'cn-heavy': false,
      'cn-heavy/0': false,
      'cn-heavy/tube': false,
      'cn-heavy/xhv': false,
      astrobwt: false,
      panthera: false,
    },
    algo_perf: {},
  },
};

type SettingsContextProps = {
  settings: ISettings,
  settingsDispatcher: Dispatch<ISettingsReducerAction>,
}

// @ts-ignore
export const SettingsContext:Context<SettingsContextProps> = createContext();

export const SettingsContextProvider:React.FC = ({ children }) => {
  const [settings, settingsDispatcher] = useReducer(SettingsReducer, initialState);
  const [asyncLoaderState, setAsyncLoaderState] = useState<boolean>(false);

  useEffect(() => {
    SettingsStorageInit(initialState)
      .then((value:ISettings) => {
        const configurations = Array.isArray(value?.configurations)
          ? value.configurations
          : [];
        const normalizedConfigurations = configurations.map((item) => {
          const withId = {
            ...item,
            id: item?.id != null ? String(item.id) : String(uuid.v4()),
          };
          if (withId.mode === ConfigurationMode.SIMPLE) {
            return merge(
              {
                ...defaultSimpleConfiguration,
                ...defaultConfiguration,
              },
              withId,
            );
          }

          return {
            ...defaultConfiguration,
            ...withId,
            mode: withId.mode as any === 'advance' ? ConfigurationMode.ADVANCE : withId.mode,
          };
        });
        const selectedRaw = value?.selectedConfiguration != null
          && value.selectedConfiguration !== ''
          ? String(value.selectedConfiguration)
          : undefined;
        const selectedConfiguration = selectedRaw
          && normalizedConfigurations.some((c) => String(c.id) === selectedRaw)
          ? selectedRaw
          : undefined;
        const fixValue:ISettings = {
          ...value,
          configurations: normalizedConfigurations,
          selectedConfiguration,
        };
        settingsDispatcher({
          type: SettingsActionType.SET,
          value: {
            ...initialState,
            ...fixValue,
            ready: true,
          },
        });
        setAsyncLoaderState(true);
      })
      .catch((_e) => {
        // Do not hang on init failure — surface defaults with ready:true
        settingsDispatcher({
          type: SettingsActionType.SET,
          value: {
            ...initialState,
            ready: true,
          },
        });
        setAsyncLoaderState(true);
      });
  }, []);

  useEffect(() => {
    if (asyncLoaderState) {
      SettingsStorageSave(settings);
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={
        useMemo(
          () => (
            { settings, settingsDispatcher }
          ),
          [settings, settingsDispatcher],
        )
      }
    >
      {children}
    </SettingsContext.Provider>
  );
};
