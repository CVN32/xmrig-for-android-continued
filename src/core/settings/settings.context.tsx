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
  Configuration,
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

const migrateConfiguration = (item: Configuration): Configuration => {
  const mode = item.mode as any === 'advance' ? ConfigurationMode.ADVANCE : item.mode;

  if (mode === ConfigurationMode.SIMPLE) {
    return merge(
      {
        ...defaultSimpleConfiguration,
        ...defaultConfiguration,
      },
      {
        ...item,
        mode,
      },
    ) as Configuration;
  }

  return {
    ...defaultConfiguration,
    ...item,
    mode,
  } as Configuration;
};

export const SettingsContextProvider:React.FC = ({ children }) => {
  const [settings, settingsDispatcher] = useReducer(SettingsReducer, initialState);
  const [storageReady, setStorageReady] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    SettingsStorageInit(initialState)
      .then((value:ISettings) => {
        if (!mounted) {
          return;
        }

        const configurations = Array.isArray(value.configurations)
          ? value.configurations.map(migrateConfiguration)
          : [];

        settingsDispatcher({
          type: SettingsActionType.SET,
          value: {
            ...initialState,
            ...value,
            configurations,
            ready: true,
          },
        });
      })
      .catch((error) => {
        console.error('Unable to load settings; using defaults', error);
        if (mounted) {
          settingsDispatcher({
            type: SettingsActionType.SET,
            value: {
              ...initialState,
              ready: true,
            },
          });
        }
      })
      .finally(() => {
        if (mounted) {
          setStorageReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (storageReady && settings.ready) {
      SettingsStorageSave(settings).catch((error) => {
        console.error('Unable to save settings', error);
      });
    }
  }, [settings, storageReady]);

  const contextValue = useMemo(
    () => ({ settings, settingsDispatcher }),
    [settings, settingsDispatcher],
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
