import React from 'react';
import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

const { XMRigForAndroid } = NativeModules;

type IThermalEvent = {
  cpuTemperature: number;
}

export const useThermal = () => {
  const [cpuTemperature, setCpuTemperature] = React.useState<number>(Number.NaN);

  React.useEffect(() => {
    const MinerEmitter = new NativeEventEmitter(XMRigForAndroid);

    const onThermalSub:EmitterSubscription = MinerEmitter.addListener('onThermal', (event: IThermalEvent) => {
      const next = Number(event.cpuTemperature);
      setCpuTemperature(Number.isFinite(next) ? next : Number.NaN);
    });

    return () => {
      onThermalSub.remove();
    };
  }, []);

  return {
    cpuTemperature,
  };
};
