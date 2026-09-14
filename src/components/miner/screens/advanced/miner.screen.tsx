import React from 'react';
import { ScrollView } from 'react-native';
import { View, Text, Colors } from 'react-native-ui-lib';
import { Battery } from '@brightlayer-ui/react-native-progress-icons';
import chroma from 'chroma-js';
import { SessionDataContext } from '../../../../core/session-data/session-data.context';
import { XMRigView } from '../../containers/xmrig-view';
import { MinerControl } from '../../components/miner-control.component';
import { PowerContext } from '../../../../core/power/power.context';

const MinerScreen = () => {
  const {
    workingState, minerData, hashrateTotals, CPUTemp,
  } = React.useContext(SessionDataContext);
  const powerContext = React.useContext(PowerContext);

  const battryColor = React.useMemo(() => {
    const cScale = chroma.scale([
      Colors.$backgroundDangerHeavy,
      Colors.$backgroundWarningHeavy,
      Colors.$backgroundSuccessHeavy,
    ]);
    return cScale(powerContext.batteryLevel / 100).hex();
  }, [powerContext.batteryLevel]);

  return (
    <View bg-screenBG flex>
      <View paddingV-12 paddingH-14>
        <MinerControl />
      </View>
      <View flex paddingH-14>
        <ScrollView nestedScrollEnabled>
          <View flex row spread centerV paddingB-8>
            <Text text60 $textDefault>Statistics</Text>
            <View row centerV>
              <Text text80 $textNeutral marginR-10>
                {CPUTemp.toFixed(1)}
                {' ℃'}
              </Text>
              <Battery
                percent={powerContext.batteryLevel}
                size={36}
                color={battryColor}
                charging={powerContext.isPowerConnected}
                outlined={false}
              />
            </View>
          </View>
          <XMRigView
            workingState={workingState}
            minerData={minerData}
            hashrateHistory={hashrateTotals}
          />
        </ScrollView>
      </View>
    </View>
  );
};

export default MinerScreen;
