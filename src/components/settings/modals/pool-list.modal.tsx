import _ from 'lodash';
import React from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Chip, Incubator, Picker, Typography, View,
} from 'react-native-ui-lib';
import { probePools, formatPoolStatusChip } from '../../../core/pools/pool-status';
import { rememberWallet } from '../../../core/pools/recent-wallets';
import { IConfiguratioPropertiesPool } from '../../../core/settings/settings.interface';
import { sheetBg, tokens } from '../../../core/theme/tokens';
import {
  C3Pool,
  HashVault,
  IPoolState,
  IPredefinedPool,
  IPredefinedPoolInfo,
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
const PROBE_INTERVAL_MS = 20_000;

const EMPTY_POOL: IConfiguratioPropertiesPool = {
  hostname: '',
  port: 0,
  username: '',
  password: '',
  sslEnabled: false,
};

const normalizePickerValue = (value: any): string | undefined => {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'object') {
    const nested = value.value ?? value.id;
    return nested == null ? undefined : `${nested}`;
  }
  return `${value}`;
};

const PoolListModal:React.FC<PoolListModalProps> = (
  {
    onAdd,
    onDismiss,
    visible,
    ...rest
  },
) => {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const footerBottomInset = Math.max(insets.bottom, tokens.spacing.sm);
  const footerHeight = FOOTER_BASE + footerBottomInset;

  const { dialogHeight, dialogWidth, dialogLeftInset } = React.useMemo(() => {
    const height = Math.min(Math.round(winH * 0.85), 640);
    const width = Math.min(Math.round(winW * 0.9), 420);
    const leftInset = Math.max(0, Math.round((winW - width) / 2));
    return { dialogHeight: height, dialogWidth: width, dialogLeftInset: leftInset };
  }, [winH, winW]);

  const bodyMaxHeight = Math.max(180, dialogHeight - HEADER_APPROX - footerHeight);
  const [selected, setSelected] = React.useState<string>();
  const [pool, setPool] = React.useState<IConfiguratioPropertiesPool>(EMPTY_POOL);
  const [statusMap, setStatusMap] = React.useState<Record<
    string,
    Awaited<ReturnType<typeof probePools>>[string]
  >>({});

  const pools = React.useMemo<IPredefinedPool[]>(() => predefinedPoolsList, []);

  React.useEffect(() => {
    if (visible) {
      setSelected(undefined);
      setPool({ ...EMPTY_POOL });
      setStatusMap({});
    }
  }, [visible]);

  React.useEffect(() => {
    if (!visible) {
      return undefined;
    }

    let cancelled = false;
    let running = false;
    const run = async () => {
      if (running) {
        return;
      }
      running = true;
      try {
        const results = await probePools(pools.map((item) => ({
          key: item.name,
          hostname: item.info.hostname,
          port: item.info.port,
        })));
        if (!cancelled) {
          setStatusMap(results);
        }
      } finally {
        running = false;
      }
    };

    run();
    const timer = setInterval(run, PROBE_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [visible, pools]);

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

  const poolInfo = React.useMemo<IPredefinedPoolInfo | undefined>(
    () => (selected ? predefinedPools[selected as PredefinedPoolName] : undefined),
    [selected],
  );
  const selectedStatus = selected ? statusMap[selected] : undefined;

  const canApply = Boolean(
    selected
      && pool.hostname?.trim()
      && Number(pool.port) > 0
      && pool.username?.trim(),
  );

  const hide = async (isOk: boolean = false) => {
    if (isOk && canApply) {
      if (pool.username) {
        await rememberWallet(pool.username);
      }
      onAdd(pool);
    }
    onDismiss?.();
  };

  return (
    <Incubator.Dialog
      onDismiss={onDismiss}
      visible={visible}
      center
      headerProps={{
        text: {
          title: 'Pool Presets',
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
              placeholder="Select a pool"
              topBarProps={{ title: 'Pools' }}
              value={selected}
              showSearch
              searchPlaceholder="Search pools"
              onChange={(value: any) => setSelected(normalizePickerValue(value))}
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
                label={formatPoolStatusChip(selectedStatus)}
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
            {selected === PredefinedPoolName.MoneroOcean && <MoneroOcean onChange={onChange} />}
            {selected === PredefinedPoolName.SupportXMR && <SupportXMR onChange={onChange} />}
            {selected === PredefinedPoolName.nanopool && <Nano onChange={onChange} />}
            {selected === PredefinedPoolName.C3Pool && <C3Pool onChange={onChange} />}
            {selected === PredefinedPoolName.XMRPoolEU && <XMRPoolEU onChange={onChange} />}
            {selected === PredefinedPoolName.HashVault && <HashVault onChange={onChange} />}
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
            disabled={!canApply}
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
