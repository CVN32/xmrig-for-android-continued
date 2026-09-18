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
import {
  ConfigurationMode,
  ISimpleConfiguration,
} from '../../../../core/settings/settings.interface';
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

type DetailRowProps = {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
};

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  mono,
  last,
}) => {
  const chrome = CHROME.dark;
  return (
    <View
      row
      style={[
        styles.detailRow,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: chrome.border,
        },
      ]}
    >
      <Text
        style={{
          ...tokens.type.caption,
          color: chrome.mutedText,
          width: 112,
          paddingRight: tokens.spacing.md,
        }}
      >
        {label}
      </Text>
      <Text
        flex
        selectable
        numberOfLines={3}
        style={{
          ...(mono ? tokens.type.mono : tokens.type.body),
          color: chrome.textColor,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  );
};

DetailRow.defaultProps = {
  mono: false,
  last: false,
};

const MinerScreen = () => {
  const chrome = CHROME[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const scrollRef = React.useRef<ScrollView>(null);
  const shouldRevealDetails = React.useRef(false);
  const {
    workingState, minerData, hashrateTotals, CPUTemp,
  } = React.useContext(SessionDataContext);
  const powerContext = React.useContext(PowerContext);
  const { settings } = React.useContext(SettingsContext);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const selectedConfig = settings.configurations.find(
    (configuration) => configuration.id === settings.selectedConfiguration,
  );
  const simpleConfig = selectedConfig?.mode === ConfigurationMode.SIMPLE
    ? selectedConfig as ISimpleConfiguration
    : undefined;
  const configuredPool = simpleConfig?.properties?.pool;
  const configuredPoolEndpoint = configuredPool?.hostname
    ? `${configuredPool.hostname}${configuredPool.port ? `:${configuredPool.port}` : ''}`
    : null;
  const configuredSsl = configuredPool
    ? (configuredPool.sslEnabled ? 'Enabled' : 'Disabled')
    : '—';

  const processWorking = workingState !== WorkingState.NOT_WORKING;
  const livePool = processWorking ? minerData?.connection?.pool : undefined;
  const uptimeStr = processWorking
    ? formatUptime(minerData?.connection?.uptime ?? minerData?.uptime)
    : null;

  const statusLabel = React.useMemo(() => {
    if (workingState === WorkingState.PAUSED) {
      return 'Paused';
    }
    if (workingState === WorkingState.MINING) {
      return livePool ? 'Running' : 'Starting / reconnecting';
    }
    return 'Stopped';
  }, [workingState, livePool]);

  const liveHashrate = hashrateToString(
    processWorking ? (_.last(hashrateTotals.historyCurrent) || 0) : 0,
    true,
  );
  const accepted = processWorking ? (minerData?.connection?.accepted ?? 0) : 0;
  const rejected = processWorking ? (minerData?.connection?.rejected ?? 0) : 0;

  const batteryColor = React.useMemo(() => {
    const cScale = chroma.scale([
      Colors.$backgroundDangerHeavy,
      Colors.$backgroundWarningHeavy,
      Colors.$backgroundSuccessHeavy,
    ]);
    return cScale(powerContext.batteryLevel / 100).hex();
  }, [powerContext.batteryLevel]);

  const statusDot = React.useMemo(() => {
    if (workingState === WorkingState.PAUSED) {
      return Colors.$backgroundWarningHeavy;
    }
    if (workingState === WorkingState.MINING) {
      return livePool ? tokens.success : tokens.accent;
    }
    return tokens.text.disabled;
  }, [workingState, livePool]);

  const statusMeta = [uptimeStr, livePool].filter(Boolean).join(' · ');
  const summaryLine = [
    selectedConfig?.name,
    configuredPoolEndpoint,
  ].filter(Boolean).join(' · ') || 'No configuration selected';

  const toggleDetails = React.useCallback(() => {
    setDetailsOpen((open) => {
      if (!open) {
        shouldRevealDetails.current = true;
      }
      return !open;
    });
  }, []);

  const handleContentSizeChange = React.useCallback(() => {
    if (detailsOpen && shouldRevealDetails.current) {
      shouldRevealDetails.current = false;
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [detailsOpen]);

  return (
    <View flex backgroundColor={chrome.screenBG}>
      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        removeClippedSubviews={false}
        onContentSizeChange={handleContentSizeChange}
        contentContainerStyle={styles.screenContent}
      >
        <View style={styles.statusBar}>
          <View row centerV flex>
            <View style={[styles.statusDot, { backgroundColor: statusDot }]} />
            <View flex>
              <Text style={{ ...tokens.type.section, color: chrome.textColor }}>
                {statusLabel}
              </Text>
              {statusMeta ? (
                <Text
                  numberOfLines={1}
                  style={{
                    ...tokens.type.caption,
                    color: chrome.mutedText,
                    marginTop: 2,
                  }}
                >
                  {statusMeta}
                </Text>
              ) : null}
            </View>
          </View>
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
          style={[
            styles.card,
            {
              backgroundColor: chrome.cardBG,
              borderColor: chrome.border,
              borderRadius: chrome.radius,
            },
          ]}
        >
          <View row>
            <View flex marginR-12>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>Hashrate</Text>
              <Text style={[styles.metricValue, { color: chrome.textColor }]}>
                {`${liveHashrate}/s`}
              </Text>
            </View>
            <View flex>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>Shares</Text>
              <Text style={[styles.metricValue, { color: chrome.textColor }]}>
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
              marginTop: tokens.spacing.lg,
              paddingTop: tokens.spacing.lg,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: chrome.border,
            }}
          >
            <View flex marginR-12>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>CPU Temp</Text>
              <Text style={[styles.secondaryMetric, { color: chrome.textColor }]}>
                {`${Number.isFinite(CPUTemp) ? CPUTemp.toFixed(1) : '—'} ℃`}
              </Text>
            </View>
            <View flex>
              <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>Algorithm</Text>
              <Text style={[styles.secondaryMetric, { color: chrome.textColor }]}>
                {processWorking ? (minerData?.algo || '—') : '—'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: tokens.spacing.md }}>
          <MinerControl />
        </View>

        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: chrome.cardBG,
              borderColor: chrome.border,
              borderRadius: chrome.radius,
            },
          ]}
        >
          <Pressable
            onPress={toggleDetails}
            accessibilityRole="button"
            accessibilityLabel="Worker and configuration details"
            accessibilityState={{ expanded: detailsOpen }}
            android_ripple={{ color: tokens.border.subtle }}
            style={styles.detailsHeader}
          >
            <View flex marginR-12>
              <Text style={{ ...tokens.type.section, color: chrome.textColor }}>
                Worker & configuration
              </Text>
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
            </View>
            <View
              style={[
                styles.showButton,
                {
                  borderColor: chrome.border,
                  backgroundColor: tokens.bg.elevated,
                },
              ]}
            >
              <Text style={{ ...tokens.type.caption, color: chrome.textColor }}>
                {detailsOpen ? 'Hide' : 'Show'}
              </Text>
            </View>
          </Pressable>

          {detailsOpen && (
            <View
              style={[
                styles.detailsBody,
                {
                  borderTopColor: chrome.border,
                },
              ]}
            >
              <View
                style={[
                  styles.configSummary,
                  {
                    backgroundColor: tokens.bg.elevated,
                    borderColor: chrome.border,
                  },
                ]}
              >
                <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>
                  Selected profile
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    ...tokens.type.title,
                    color: chrome.textColor,
                    marginTop: tokens.spacing.xs,
                  }}
                >
                  {selectedConfig?.name || 'No configuration selected'}
                </Text>
              </View>

              <View style={styles.detailTable}>
                <DetailRow label="Mode" value={selectedConfig?.mode || '—'} />
                <DetailRow
                  label="Configured pool"
                  value={configuredPoolEndpoint || '—'}
                  mono
                />
                <DetailRow
                  label="Wallet / user"
                  value={configuredPool?.username || '—'}
                  mono
                />
                <DetailRow label="SSL" value={configuredSsl} />
                <DetailRow
                  label="Active worker"
                  value={processWorking ? (minerData?.worker_id || '—') : '—'}
                />
                <DetailRow
                  label="Active pool"
                  value={livePool || '—'}
                  mono
                  last
                />
              </View>

              {processWorking && minerData ? (
                <View style={{ marginTop: tokens.spacing.md }}>
                  <XMRigView
                    minerData={minerData}
                    hashrateHistory={hashrateTotals}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.infoBanner,
                    {
                      backgroundColor: tokens.bg.elevated,
                      borderColor: chrome.border,
                    },
                  ]}
                >
                  <Text style={{ ...tokens.type.caption, color: chrome.mutedText }}>
                    Live worker statistics will appear here after the miner connects.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: 56,
  },
  statusBar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: tokens.spacing.md,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  metricValue: {
    ...tokens.type.title,
    fontSize: 22,
    marginTop: tokens.spacing.xs,
  },
  secondaryMetric: {
    ...tokens.type.section,
    fontSize: 16,
    marginTop: tokens.spacing.xs,
  },
  detailsCard: {
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: tokens.spacing.lg,
    overflow: 'hidden',
  },
  detailsHeader: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  showButton: {
    minWidth: 64,
    minHeight: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  detailsBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: tokens.spacing.lg,
  },
  configSummary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  detailTable: {
    marginBottom: tokens.spacing.sm,
  },
  detailRow: {
    minHeight: 48,
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  infoBanner: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
});

export default MinerScreen;
