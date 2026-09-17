import React from 'react';
import { EmitterSubscription, NativeEventEmitter, NativeModules } from 'react-native';
import { PowerEvent, PowerEventAction } from './power.interface';

const { XMRigForAndroid } = NativeModules;

type PowerContextType = {
    batteryLevel: number;
    isLowBattery: boolean;
    isPowerConnected: boolean;
}

// @ts-ignore
export const PowerContext:React.Context<PowerContextType> = React.createContext();

export const PowerContextProvider:React.FC = ({ children }) => {
  const [batteryLevel, setBatteryLevel] = React.useState<number>(0);
  const [isLowBattery, setIsLowBattery] = React.useState<boolean>(false);
  const [isPowerConnected, setIsPowerConnected] = React.useState<boolean>(false);

  React.useEffect(() => {
    const minerEmitter = new NativeEventEmitter(XMRigForAndroid);

    const onPowerEventSub:EmitterSubscription = minerEmitter.addListener('onPower', (event: PowerEvent) => {
      switch (event.action) {
        case PowerEventAction.BATTERY_CHANGED:
          if (typeof event.value === 'number' && Number.isFinite(event.value)) {
            setBatteryLevel(Math.max(0, Math.min(100, event.value)));
          }
          break;
        case PowerEventAction.BATTERY_LOW:
          setIsLowBattery(true);
          break;
        case PowerEventAction.BATTERY_OKAY:
          setIsLowBattery(false);
          break;
        case PowerEventAction.POWER_CONNECTED:
          setIsPowerConnected(true);
          break;
        case PowerEventAction.POWER_DISCONNECTED:
          setIsPowerConnected(false);
          break;
        default:
      }
    });

    return () => {
      onPowerEventSub.remove();
    };
  }, []);

  const contextValue = React.useMemo(() => ({
    batteryLevel,
    isLowBattery,
    isPowerConnected,
  }), [batteryLevel, isLowBattery, isPowerConnected]);

  return (
    <PowerContext.Provider value={contextValue}>
      {children}
    </PowerContext.Provider>
  );
};
