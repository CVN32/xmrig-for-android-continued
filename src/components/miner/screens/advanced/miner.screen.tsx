import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { View, Text, Colors } from 'react-native-ui-lib';
import { Battery } from '@brightlayer-ui/react-native-progress-icons';
import chroma from 'chroma-js';
import _ from 'lodash';
// @ts-ignore
import { hashrateToString } from 'hashrate';
import { SessionDataContext } from '../../../../core/session-data/session-data.context';
import { WorkingState } from '../../../../core/session-data/session-data.interface';
import { SettingsContext } from '../../../../core/settings';
import { XMRigView } from '../../containers/xmrig-view';
import { MinerControl } from '../../components/miner-control.component';
import { PowerContext } from '../../../../core/power/power.context';
import { CHROME } from '../../../../core/theme/chrome';
import { tokens } from '../../../../core/theme/tokens';

const formatUptime = (seconds?: number): string | null => {
  if (seconds == null || seconds <= 0 || Number.isNaN(seconds)) {
    return null;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
};

const MinerScreen = () => {
  const chrome = CHROME[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const {
    workingState, minerData, hashrateTotals, CPUTemp,
  } = React.useContext(SessionDataContext);
  const powerContext = React.useContext(PowerContext);
  const { settings } = React.useContext(SettingsContext);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const statusLabel = React.useMemo(() => {
    if (workingState === WorkingState.MINING) {
      return 'Running';
    }
    if (workingState === WorkingState.PAUSED) {
      return 'Paused';
    }
    return 'Stopped';
  }, [workingState]);

  const uptimeStr = formatUptime(minerData?.connection?.uptime ?? minerData?.uptime);
  const pool = minerData?.connection?.pool;
  const selectedConfig = settings.configurations.find(
    (c) => c.id === settings.selectedConfiguration,
  );

  const liveHashrate = hashrateToString(_.last(hashrateTotals.historyCurrent) || 0, true);
  const accepted = minerData?.connection?.accepted ?? 0;
  const rejected = minerData?.connection?.rejected ?? 0;

  const batteryColor = React.useMemo(() => {
    const cScale = chroma.scale([
      Colors.$backgroundDangerHeavy,
      Colors.$backgroundWarningHeavy,
      Colors.$backgroundSuccessHeavy,
    ]);
    return cScale(powerContext.batteryLevel / 100).hex();
  }, [powerContext.batteryLevel]);

  const statusDot = React.useMemo(() => {
    if (workingState === WorkingState.MINING) {
      return tokens.success;
    }
    if (workingState === WorkingState.PAUSED) {
      return tokens.accent;
    }
    return tokens.text.disabled;
  }, [workingState]);

  const statusMeta = [uptimeStr, pool].filter(Boolean).join(' · ');
  const summaryLine = [selectedConfig?.name, minerData?.worker_id]
    .filter(Boolean)
    .join(' · ') || 'No configuration selected';

  return (
    <View flex backgroundColor={chrome.screenBG}>
      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={{
          paddingHorizontal: tokens.spacing.lg,
          paddingBottom: tokens.spacing.xl,
        }}
      >
        <View
          row
          centerV
          style={{
            minHeight: 48,
            paddingVertical: tokens.spacing.sm,
            marginTop: tokens.spacing.sm,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              marginRight: tokens.spacing.sm,
              backgroundColor: statusDot,
            }}
          />
          <Text
            numberOfLines={1}
            style={{
              ...tokens.type.body,
              color: chrome.textColor,
              flex: 1,
            }}
          >
            {statusLabel}
            {statusMeta ? ` · ${statusMeta}` : ''}
          </Text>
          {powerContext.ready ? (
            <Battery
              percent={powerContext.batteryLevel}
              size={28}
              color={batteryColor}
              charging={powerContext.isPowerConnected}
              outlined={false}
            />
          ) : (
            <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>
              Battery —
            </Text>
          )}
        </View>

        <View
          style={{
            backgroundColor: chrome.cardBG,
            borderRadius: chrome.radius,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: chrome.border,
            padding: tokens.spacing.lg,
            marginBottom: tokens.spacing.md,
          }}
        >
          <View row>
            <View flex marginR-8>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>Hashrate</Text>
              <Text
                style={{
                  ...tokens.type.title,
                  color: chrome.textColor,
                  marginTop: tokens.spacing.xs,
                }}
              >
                {`${liveHashrate}/s`}
              </Text>
            </View>
            <View flex>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>Shares</Text>
              <Text
                style={{
                  ...tokens.type.title,
                  color: chrome.textColor,
                  marginTop: tokens.spacing.xs,
                }}
              >
                {`${accepted} / ${rejected}`}
              </Text>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText, marginTop: 2 }}>
                accepted / rejected
              </Text>
            </View>
          </View>
          <View
            row
            style={{
              marginTop: tokens.spacing.md,
              paddingTop: tokens.spacing.md,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: chrome.border,
            }}
          >
            <View flex marginR-8>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>CPU Temp</Text>
              <Text
                style={{
                  ...tokens.type.section,
                  color: chrome.textColor,
                  marginTop: tokens.spacing.xs,
                }}
              >
                {`${Number.isFinite(CPUTemp) ? CPUTemp.toFixed(1) : '—'} ℃`}
              </Text>
            </View>
            <View flex>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>Algo</Text>
              <Text
                style={{
                  ...tokens.type.section,
                  color: chrome.textColor,
                  marginTop: tokens.spacing.xs,
                }}
              >
                {minerData?.algo || '—'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: tokens.spacing.md }}>
          <MinerControl />
        </View>

        <View
          style={{
            backgroundColor: chrome.cardBG,
            borderRadius: chrome.radius,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: chrome.border,
            marginBottom: tokens.spacing.lg,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={() => setDetailsOpen((v) => !v)}
            accessibilityRole="button"
            style={{
              minHeight: 48,
              paddingHorizontal: tokens.spacing.lg,
              paddingVertical: tokens.spacing.md,
              justifyContent: 'center',
            }}
          >
            <View row spread centerV>
              <Text style={{ ...tokens.type.section, color: chrome.textColor }}>
                Worker & config
              </Text>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>
                {detailsOpen ? 'Hide' : 'Show'}
              </Text>
            </View>
            {!detailsOpen && (
              <Text
                numberOfLines={1}
                style={{
                  ...tokens.type.caption,
                  color: chrome.mutedText,
                  marginTop: tokens.spacing.xs,
                }}
              >
                {summaryLine}
              </Text>
            )}
          </Pressable>
          {detailsOpen && (
            <View
              style={{
                paddingHorizontal: tokens.spacing.lg,
                paddingBottom: tokens.spacing.md,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: chrome.border,
              }}
            >
              <View style={{ marginTop: tokens.spacing.md }}>
                <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>Configuration</Text>
                <Text
                  style={{
                    ...tokens.type.body,
                    color: chrome.textColor,
                    marginBottom: tokens.spacing.sm,
                  }}
                >
                  {selectedConfig?.name || '—'}
                </Text>
                <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>Worker</Text>
                <Text
                  style={{
                    ...tokens.type.body,
                    color: chrome.textColor,
                    marginBottom: tokens.spacing.sm,
                  }}
                >
                  {minerData?.worker_id || '—'}
                </Text>
                <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>Pool</Text>
                <Text
                  style={{
                    ...tokens.type.body,
                    color: chrome.textColor,
                    marginBottom: tokens.spacing.sm,
                  }}
                >
                  {pool || '—'}
                </Text>
              </View>
              <XMRigView
                workingState={workingState}
                minerData={minerData}
                hashrateHistory={hashrateTotals}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default MinerScreen;
