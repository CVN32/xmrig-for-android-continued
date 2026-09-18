import React from 'react';
import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

const { XMRigForAndroid } = NativeModules;
const STATUS_SYNC_INTERVAL_MS = 2_000;

type IMinerStatusChangeEvent = {
  isWorking: boolean;
}

export const useMinerStatus = () => {
  const [isWorkingState, setIsWorkingState] = React.useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    const MinerEmitter = new NativeEventEmitter(XMRigForAndroid);

    const updateState = (value: unknown) => {
      if (mounted && typeof value === 'boolean') {
        setIsWorkingState(value);
      }
    };

    const refreshStatus = async () => {
      if (!XMRigForAndroid?.getMinerStatus) {
        return;
      }
      try {
        updateState(await XMRigForAndroid.getMinerStatus());
      } catch {
        // Event-based status updates remain the primary path.
      }
    };

    const onStatusChangeSub:EmitterSubscription = MinerEmitter.addListener(
      'onStatusChange',
      (event: IMinerStatusChangeEvent) => updateState(event?.isWorking),
    );

    refreshStatus();
    const statusTimer = setInterval(refreshStatus, STATUS_SYNC_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(statusTimer);
      onStatusChangeSub.remove();
    };
  }, []);

  return {
    isWorking: isWorkingState,
  };
};
