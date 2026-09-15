import _ from 'lodash';
import React from 'react';
import { Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Chip, Incubator, Picker, Typography, View,
} from 'react-native-ui-lib';
import { IConfiguratioPropertiesPool } from '../../../core/settings/settings.interface';
import { sheetBg, tokens } from '../../../core/theme/tokens';
import {
  formatPoolStatusChip,
  PoolProbeResult,
  probePool,
} from '../../../core/pools/pool-status';
import { rememberWallet } from '../../../core/pools/recent-wallets';
import {
  C3Pool,
  Hashcity,
  HashVault,
  IPoolState,
  IPredefinedPool,
  IPredefinedPoolInfo,
  MineXMR,
  MoneroOcean,
  Nano,
  PredefinedPoolName,
  predefinedPools,
  predefinedPoolsList,
  SupportXMR,
  XMRPoolEU,
} from './pools';

export type PoolListModalProps = Incubator.DialogProps & {
  onAdd: (pool: IConfiguratioPropertiesPool) => void;
}

const FOOTER_BASE = 56;
const HEADER_APPROX = 52;
const PROBE_INTERVAL_MS = 20000;

const PoolListModal:React.FC<PoolListModalProps> = (
  {
    onAdd,
    onDismiss,
    visible,
    ...rest
  },
) => {
  const insets = useSafeAreaInsets();
  const footerBottomInset = Math.max(insets.bottom, tokens.spacing.sm);
  const footerHeight = FOOTER_BASE + footerBottomInset;

  const { dialogHeight, dialogWidth, dialogLeftInset } = React.useMemo(() => {
    const { height: winH, width: winW } = Dimensions.get('window');
    const height = Math.min(Math.round(winH * 0.85), 640);
    const width = Math.min(Math.round(winW * 0.9), 420);
    // Incubator.Dialog wraps content in an absolutely-positioned PanView that
    // ignores flex alignItems — inset from the left to visually center.
    const leftInset = Math.max(0, Math.round((winW - width) / 2));
    return { dialogHeight: height, dialogWidth: width, dialogLeftInset: leftInset };
  }, []);

  const bodyMaxHeight = Math.max(180, dialogHeight - HEADER_APPROX - footerHeight);

  const [selected, setSelected] = React.useState<string>();
  const [pool, setPool] = React.useState<IConfiguratioPropertiesPool>({
    hostname: '',
    port: 0,
    username: '',
    password: '',
    sslEnabled: false,
  });

  const [statusMap, setStatusMap] = React.useState<Record<string, PoolProbeResult>>({});

  const onChange = React.useCallback(
    (state: IPoolState) => setPool({
      hostname: state.hostname,
      port: state.port,
      username: state.username,
      password: state.password,
      sslEnabled: false,
    }),
    [],
  );

  const pools = React.useMemo<IPredefinedPool[]>(() => predefinedPoolsList, []);
  const poolInfo = React.useMemo<IPredefinedPoolInfo | undefined>(
    () => (selected ? predefinedPools[selected as PredefinedPoolName] : undefined),
    [selected],
  );

  React.useEffect(() => {
    if (!visible) {
      return undefined;
    }
    let cancelled = false;

    const run = async () => {
      const targets = pools.map((p) => ({
        key: p.name,
        hostname: p.info.hostname,
        port: p.info.port,
      }));
      const ordered = selected
        ? [
          ...targets.filter((t) => t.key === selected),
          ...targets.filter((t) => t.key !== selected),
        ]
        : targets;

      for (let i = 0; i < ordered.length; i += 1) {
        if (cancelled) {
          return;
        }
        const t = ordered[i];
        // eslint-disable-next-line no-await-in-loop
        const result = await probePool(t.hostname, t.port);
        if (cancelled) {
          return;
        }
        setStatusMap((prev) => {
          const prevResult = prev[t.key];
          if (
            prevResult
            && prevResult.online === result.online
            && prevResult.latencyMs === result.latencyMs
          ) {
            return prev;
          }
          return { ...prev, [t.key]: result };
        });
      }
    };

    run();
    const id = setInterval(run, PROBE_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [visible, pools, selected]);

  const selectedStatus = selected ? statusMap[selected] : undefined;
  const statusLabel = React.useMemo(
    () => formatPoolStatusChip(selectedStatus),
    [selectedStatus],
  );

  const hide = async (isOk: boolean = false) => {
    if (isOk === true) {
      if (pool.username) {
        await rememberWallet(pool.username);
      }
      onAdd(pool);
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Incubator.Dialog
      onDismiss={onDismiss}
      visible={visible}
      center
      headerProps={{
        text: {
          title: 'Pools Presets',
          titleStyle: {
            color: tokens.text.primary,
            fontSize: tokens.type.title.fontSize,
            fontWeight: tokens.type.title.fontWeight,
          },
        },
      }}
      containerStyle={{
        width: dialogWidth,
        marginLeft: dialogLeftInset,
        alignSelf: 'center',
        height: dialogHeight,
        backgroundColor: sheetBg,
        borderRadius: 12,
        overflow: 'hidden',
        flexDirection: 'column',
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    >
      <View
        style={{
          backgroundColor: sheetBg,
          height: dialogHeight - HEADER_APPROX,
          flexDirection: 'column',
        }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={{ flexGrow: 1, flexShrink: 1, maxHeight: bodyMaxHeight }}
          contentContainerStyle={{
            paddingHorizontal: tokens.spacing.lg,
            paddingTop: tokens.spacing.sm,
            paddingBottom: tokens.spacing.lg,
          }}
        >
          <View height={50} paddingT-10>
            <Picker
              floatingPlaceholder={selected == null}
              placeholder="Select a Pool"
              topBarProps={{ title: 'Pools' }}
              value={selected}
              showSearch
              searchPlaceholder="Search a Configurations"
              onChange={(value: any) => setSelected(value)}
              style={{ ...Typography.text60, color: tokens.text.primary }}
              floatingPlaceholderStyle={{
                ...Typography.text70,
                color: tokens.text.secondary,
              }}
              placeholderTextColor={tokens.text.secondary}
              migrate
              migrateTextField
            >
              {_.map(pools, (item: IPredefinedPool) => (
                <Picker.Item
                  key={item.name}
                  value={item.name}
                  label={item.info.displayName}
                />
              ))}
            </Picker>
          </View>

          {poolInfo && (
            <View row paddingB-10 style={{ flexWrap: 'wrap' }}>
              <Chip
                size={10}
                label={`${poolInfo.fee}% fee`}
                marginR-8
                marginB-6
                labelStyle={{ color: tokens.text.primary }}
                containerStyle={{ borderColor: tokens.border.subtle }}
              />
              <Chip
                size={10}
                label={`${poolInfo.threshold} min. payout`}
                marginR-8
                marginB-6
                labelStyle={{ color: tokens.text.primary }}
                containerStyle={{ borderColor: tokens.border.subtle }}
              />
              <Chip
                size={10}
                label={poolInfo.method}
                marginR-8
                marginB-6
                labelStyle={{ color: tokens.text.primary }}
                containerStyle={{ borderColor: tokens.border.subtle }}
              />
              <Chip
                size={10}
                label={statusLabel}
                marginB-6
                labelStyle={{
                  color: selectedStatus?.online ? tokens.success : tokens.text.secondary,
                }}
                containerStyle={{
                  borderColor: selectedStatus?.online
                    ? tokens.success
                    : tokens.border.subtle,
                }}
              />
            </View>
          )}

          <View spread paddingB-10>
            {selected && selected === PredefinedPoolName.MoneroOcean
              && <MoneroOcean onChange={onChange} />}
            {selected && selected === PredefinedPoolName.MineXMR
              && <MineXMR onChange={onChange} /> }
            {selected && selected === PredefinedPoolName.SupportXMR
              && <SupportXMR onChange={onChange} /> }
            {selected && selected === PredefinedPoolName.nanopool
              && <Nano onChange={onChange} /> }
            {selected && selected === PredefinedPoolName.C3Pool
              && <C3Pool onChange={onChange} /> }
            {selected && selected === PredefinedPoolName.XMRPoolEU
              && <XMRPoolEU onChange={onChange} /> }
            {selected && selected === PredefinedPoolName.HashVault
              && <HashVault onChange={onChange} /> }
            {selected && selected === PredefinedPoolName.Hashcity
              && <Hashcity onChange={onChange} /> }
          </View>
        </ScrollView>

        <View
          style={{
            height: footerHeight,
            flexGrow: 0,
            flexShrink: 0,
            paddingBottom: footerBottomInset,
            paddingHorizontal: tokens.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: tokens.border.subtle,
            backgroundColor: sheetBg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onPress={onDismiss}
            label="Cancel"
            marginR-10
            backgroundColor={tokens.border.subtle}
            color={tokens.text.primary}
            size={Button.sizes.medium}
          />
          <Button
            onPress={() => { hide(true); }}
            label="Apply"
            backgroundColor={tokens.accent}
            size={Button.sizes.medium}
          />
        </View>
      </View>
    </Incubator.Dialog>
  );
};

export default PoolListModal;
