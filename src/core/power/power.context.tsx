import React from 'react';
import { EmitterSubscription, NativeEventEmitter, NativeModules } from 'react-native';
import { PowerEvent, PowerEventAction } from './power.interface';

const { XMRigForAndroid } = NativeModules;

type PowerContextType = {
    ready: boolean;
    batteryLevel: number;
    isLowBattery: boolean;
    isPowerConnected: boolean;
}

// @ts-ignore
export const PowerContext:React.Context<PowerContextType> = React.createContext();

export const PowerContextProvider:React.FC = ({ children }) => {
  const [ready, setReady] = React.useState<boolean>(false);
  const [batteryLevel, setBatteryLevel] = React.useState<number>(0);
  const [isLowBattery, setIsLowBattery] = React.useState<boolean>(false);
  const [isPowerConnected, setIsPowerConnected] = React.useState<boolean>(false);

  React.useEffect(() => {
    const MinerEmitter = new NativeEventEmitter(XMRigForAndroid);

    const onPowerEventSub:EmitterSubscription = MinerEmitter.addListener('onPower', (event: PowerEvent) => {
      switch (event.action) {
        case PowerEventAction.BATTERY_CHANGED:
          if (event.value != null && Number.isFinite(event.value)) {
            setBatteryLevel(Math.max(0, Math.min(100, event.value)));
          }
          setReady(true);
          break;
        case PowerEventAction.BATTERY_LOW:
          setIsLowBattery(true);
          setReady(true);
          break;
        case PowerEventAction.BATTERY_OKAY:
          setIsLowBattery(false);
          setReady(true);
          break;
        case PowerEventAction.POWER_CONNECTED:
          setIsPowerConnected(true);
          setReady(true);
          break;
        case PowerEventAction.POWER_DISCONNECTED:
          setIsPowerConnected(false);
          setReady(true);
          break;
        default:
      }
    });

    return () => {
      onPowerEventSub.remove();
    };
  }, []);

  const value = React.useMemo(() => ({
    ready,
    batteryLevel,
    isLowBattery,
    isPowerConnected,
  }), [ready, batteryLevel, isLowBattery, isPowerConnected]);

  return (
    <PowerContext.Provider value={value}>
      {children}
    </PowerContext.Provider>
  );
};
