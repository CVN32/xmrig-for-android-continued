import React from 'react';
import { Incubator } from 'react-native-ui-lib';
import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';
import { useHashrateHistory } from '../hooks';
import {
  StartMode, IXMRigLogEvent, WorkingState, IHashrateHistory,
} from './session-data.interface';
import { SettingsActionType, SettingsContext } from '../settings';
import { cleanAnsiLogLineRegex, filterLogLineRegex } from '../utils/parsers';
import { Configuration, ConfigurationMode, ISimpleConfiguration } from '../settings/settings.interface';
import { LoggerContext } from '../logger';
import { PowerContext } from '../power/power.context';
import { IMinerSummary, useMinerSummary } from '../hooks/use-miner-summary.hook';
import { useMinerStatus } from '../hooks/use-miner-status.hook';
import { useThermal } from '../hooks/use-thermal.hook';
import { useToaster } from '../hooks/use-toaster/use-toaster.hook';

const { XMRigForAndroid } = NativeModules;

type SessionDataContextType = {
  working: StartMode,
  workingState: WorkingState,
  minerData: IMinerSummary | null,
  hashrateTotals: IHashrateHistory,
  minerActions: {
    pause: () => void,
    resume: () => void,
  },
  CPUTemp: number,
}

type AutoPauseReason = 'lowBattery' | 'charger' | 'thermal';

// @ts-ignore
export const SessionDataContext:React.Context<SessionDataContextType> = React.createContext();

export const SessionDataContextProvider:React.FC = ({ children }) => {
  const toaster = useToaster();
  const { settings, settingsDispatcher } = React.useContext(SettingsContext);
  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;

  const { log } = React.useContext(LoggerContext);
  const {
    ready: powerReady,
    isLowBattery,
    isPowerConnected,
  } = React.useContext(PowerContext);

  const hashrateHistory = useHashrateHistory([0, 0]);
  const hashrateHistory10s = useHashrateHistory([0, 0]);
  const hashrateHistory60s = useHashrateHistory([0, 0]);
  const hashrateHistory15m = useHashrateHistory([0, 0]);
  const hashrateHistoryMax = useHashrateHistory([0, 0]);

  const [workingState, setWorkingState] = React.useState<WorkingState>(WorkingState.NOT_WORKING);
  const { minerData } = useMinerSummary();
  const { isWorking } = useMinerStatus();
  const { cpuTemperature } = useThermal();
  const autoPauseReasons = React.useRef<Set<AutoPauseReason>>(new Set());

  const working = React.useMemo<StartMode>(
    () => (isWorking ? StartMode.START : StartMode.STOP),
    [isWorking],
  );

  const pauseMiner = React.useCallback(() => XMRigForAndroid?.pauseMiner(), []);
  const resumeMiner = React.useCallback(() => XMRigForAndroid?.resumeMiner(), []);

  React.useEffect(() => {
    hashrateHistory.add(parseFloat(`${minerData?.hashrate?.total?.[0]}`) || 0);
    hashrateHistory10s.add(parseFloat(`${minerData?.hashrate?.total?.[0]}`) || 0);
    hashrateHistory60s.add(parseFloat(`${minerData?.hashrate?.total?.[1]}`) || 0);
    hashrateHistory15m.add(parseFloat(`${minerData?.hashrate?.total?.[2]}`) || 0);
    hashrateHistoryMax.add(parseFloat(`${minerData?.hashrate?.highest}`) || 0);
  }, [minerData]);

  React.useEffect(() => {
    if (!isWorking) {
      setWorkingState(WorkingState.NOT_WORKING);
      autoPauseReasons.current.clear();
      hashrateHistory.reset();
      hashrateHistory10s.reset();
      hashrateHistory60s.reset();
      hashrateHistory15m.reset();
      hashrateHistoryMax.reset();
    } else if (minerData?.paused) {
      setWorkingState(WorkingState.PAUSED);
    } else {
      setWorkingState(WorkingState.MINING);
    }
  }, [isWorking, minerData?.paused]);

  React.useEffect(() => {
    const MinerEmitter = new NativeEventEmitter(XMRigForAndroid);

    const onLogSub:EmitterSubscription = MinerEmitter.addListener('onLog', (data:IXMRigLogEvent) => {
      const cleanData = [...data.log.filter((item) => !filterLogLineRegex.test(item))];
      cleanData.forEach((itemLog) => log(itemLog.replace(cleanAnsiLogLineRegex, '$2').toString()));
    });

    const onConfigUpdateSub:EmitterSubscription = MinerEmitter.addListener('onConfigUpdate', (data) => {
      const currentSettings = settingsRef.current;
      const cConfig:Configuration | undefined = currentSettings.configurations.find(
        (config) => config.id === currentSettings.selectedConfiguration,
      );
      if (!cConfig || typeof data?.config !== 'string') {
        return;
      }

      if (cConfig.mode === ConfigurationMode.SIMPLE) {
        try {
          const parsedConfig = JSON.parse(data.config);
          settingsDispatcher({
            type: SettingsActionType.UPDATE_CONFIGURATION,
            value: {
              ...cConfig,
              properties: {
                ...(cConfig as ISimpleConfiguration).properties,
                algo_perf: parsedConfig['algo-perf'],
              },
            },
          });
        } catch (e) {
          console.warn('Unable to parse miner config update', e);
        }
      } else if (cConfig.mode === ConfigurationMode.ADVANCE) {
        settingsDispatcher({
          type: SettingsActionType.UPDATE_CONFIGURATION,
          value: {
            ...cConfig,
            config: data.config,
          },
        });
      }
    });

    return () => {
      onLogSub.remove();
      onConfigUpdateSub.remove();
    };
  }, [log, settingsDispatcher]);

  const previousLowBattery = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (!powerReady) {
      return;
    }
    if (previousLowBattery.current != null && previousLowBattery.current !== isLowBattery) {
      toaster({
        message: isLowBattery ? 'Battery is low' : 'Battery level is normal',
        position: 'top',
        preset: isLowBattery ? Incubator.ToastPresets.FAILURE : Incubator.ToastPresets.SUCCESS,
      });
    }
    previousLowBattery.current = isLowBattery;
  }, [powerReady, isLowBattery, toaster]);

  const previousPowerConnected = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (!powerReady) {
      return;
    }
    if (previousPowerConnected.current != null && previousPowerConnected.current !== isPowerConnected) {
      toaster({
        message: isPowerConnected ? 'Charger is connected' : 'Charger is disconnected',
        position: 'top',
        preset: isPowerConnected ? Incubator.ToastPresets.SUCCESS : Incubator.ToastPresets.FAILURE,
      });
    }
    previousPowerConnected.current = isPowerConnected;
  }, [powerReady, isPowerConnected, toaster]);

  React.useEffect(() => {
    if (!isWorking) {
      autoPauseReasons.current.clear();
      return;
    }

    const lowBatteryBlocked = powerReady
      && settings.power.pauseOnLowBattery
      && isLowBattery;
    const chargerBlocked = powerReady
      && settings.power.pauseOnChargerDisconnected
      && !isPowerConnected;
    const thermalBlocked = Number.isFinite(cpuTemperature)
      && settings.thermal.pauseOnCPUTemperatureOverHeat
      && cpuTemperature >= settings.thermal.pauseOnCPUTemperatureOverHeatValue;

    const activeReasons: AutoPauseReason[] = [];
    if (lowBatteryBlocked) activeReasons.push('lowBattery');
    if (chargerBlocked) activeReasons.push('charger');
    if (thermalBlocked) activeReasons.push('thermal');

    if (activeReasons.length > 0) {
      activeReasons.forEach((reason) => autoPauseReasons.current.add(reason));
      if (workingState === WorkingState.MINING) {
        pauseMiner();
      }
      return;
    }

    if (workingState === WorkingState.MINING) {
      // The miner is running again (for example after a manual resume), so old
      // auto-pause causes must not trigger a later surprise resume.
      autoPauseReasons.current.clear();
      return;
    }

    if (workingState !== WorkingState.PAUSED || autoPauseReasons.current.size === 0) {
      return;
    }

    const reasons = Array.from(autoPauseReasons.current);
    const allowedToResume = reasons.every((reason) => {
      switch (reason) {
        case 'lowBattery':
          return !isLowBattery && settings.power.resumeOnBatteryOk;
        case 'charger':
          return isPowerConnected && settings.power.resumeOnChargerConnected;
        case 'thermal':
          return Number.isFinite(cpuTemperature)
            && cpuTemperature <= settings.thermal.resumeCPUTemperatureNormalValue
            && settings.thermal.resumeCPUTemperatureNormal;
        default:
          return false;
      }
    });

    if (allowedToResume) {
      autoPauseReasons.current.clear();
      resumeMiner();
    }
  }, [
    isWorking,
    workingState,
    powerReady,
    isLowBattery,
    isPowerConnected,
    cpuTemperature,
    settings.power.pauseOnLowBattery,
    settings.power.pauseOnChargerDisconnected,
    settings.power.resumeOnBatteryOk,
    settings.power.resumeOnChargerConnected,
    settings.thermal.pauseOnCPUTemperatureOverHeat,
    settings.thermal.pauseOnCPUTemperatureOverHeatValue,
    settings.thermal.resumeCPUTemperatureNormal,
    settings.thermal.resumeCPUTemperatureNormalValue,
    pauseMiner,
    resumeMiner,
  ]);

  const value = React.useMemo<SessionDataContextType>(() => ({
    working,
    workingState,
    minerData,
    hashrateTotals: {
      historyCurrent: hashrateHistory.history,
      history10s: hashrateHistory10s.history,
      history60s: hashrateHistory60s.history,
      history15m: hashrateHistory15m.history,
      historyMax: hashrateHistoryMax.history,
    },
    minerActions: {
      pause: pauseMiner,
      resume: resumeMiner,
    },
    CPUTemp: cpuTemperature,
  }), [
    working,
    workingState,
    minerData,
    hashrateHistory.history,
    hashrateHistory10s.history,
    hashrateHistory60s.history,
    hashrateHistory15m.history,
    hashrateHistoryMax.history,
    pauseMiner,
    resumeMiner,
    cpuTemperature,
  ]);

  return (
    <SessionDataContext.Provider value={value}>
      {children}
    </SessionDataContext.Provider>
  );
};
