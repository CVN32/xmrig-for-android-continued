import React from 'react';
import {
  Card, Chip, Colors, Text, View, Button,
} from 'react-native-ui-lib';
import { usePoolStatus } from '../../../../core/hooks/use-pool-status.hook';
import { PoolProbeResult, PoolProbeStatus } from '../../../../core/pools/pool-status';

const chipColor = (status: PoolProbeStatus): string => {
  switch (status) {
    case 'online':
      return Colors.$backgroundSuccessHeavy || '#2e7d32';
    case 'checking':
      return Colors.$backgroundWarningHeavy || '#f9a825';
    case 'offline':
    case 'error':
    default:
      return Colors.$backgroundDangerHeavy || '#c62828';
  }
};

const statusLabel = (r: PoolProbeResult): string => {
  if (r.status === 'checking') {
    return 'Checking';
  }
  if (r.status === 'online') {
    return `Online · ${r.latencyMs ?? '?'}ms`;
  }
  if (r.status === 'offline') {
    return 'Offline';
  }
  return r.error ? `Error · ${r.error}` : 'Error';
};

const SettingsPoolStatusCard: React.FC = () => {
  const { results, refreshing, refresh } = usePoolStatus(true);

  return (
    <Card enableShadow>
      <View centerV spread padding-20 paddingB-5 row>
        <Card.Section
          style={{ flexShrink: 1, flex: 1 }}
          content={[
            { text: 'Pool status', text65: true, $textDefault: true },
            {
              text: 'Live reachability of predefined pools (informational — does not affect mining).',
              text90: true,
              $textNeutral: true,
            },
          ]}
        />
        <Button
          size={Button.sizes.xSmall}
          label={refreshing ? '…' : 'Refresh'}
          disabled={refreshing}
          onPress={refresh}
          marginL-8
        />
      </View>
      <View padding-16 paddingT-4>
        {results.map((r) => (
          <View key={r.id} row centerV spread marginB-8>
            <View flex marginR-8>
              <Text text80 $textDefault numberOfLines={1}>{r.displayName}</Text>
              <Text text100 $textNeutral numberOfLines={1}>{r.hostname}</Text>
            </View>
            <Chip
              label={statusLabel(r)}
              backgroundColor={chipColor(r.status)}
              labelStyle={{ color: Colors.white, fontSize: 11 }}
              containerStyle={{ maxWidth: 160 }}
            />
          </View>
        ))}
        <Text text100 $textNeutral marginT-4>
          Note: HashVault preset key remains &quot;hashvalt&quot; for saved-config compatibility.
        </Text>
      </View>
    </Card>
  );
};

export default SettingsPoolStatusCard;
