import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Chip, Picker, Text, Typography, View,
} from 'react-native-ui-lib';
import {
  formatPoolStatusChip,
  PoolProbeResult,
  probePools,
} from '../../../core/pools/pool-status';
import { rememberWallet } from '../../../core/pools/recent-wallets';
import { IConfiguratioPropertiesPool } from '../../../core/settings/settings.interface';
import { poolValidator } from '../../../core/utils/validators';
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

export type PoolListModalProps = {
  visible?: boolean;
  onDismiss?: () => void;
  onAdd: (pool: IConfiguratioPropertiesPool) => void;
}

const PROBE_INTERVAL_MS = 20_000;
const DIALOG_MAX_WIDTH = 420;
const DIALOG_MAX_HEIGHT = 640;

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

const PoolListModal:React.FC<PoolListModalProps> = ({
  onAdd,
  onDismiss,
  visible = false,
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const applyingRef = React.useRef(false);

  const dialogWidth = Math.min(
    DIALOG_MAX_WIDTH,
    Math.max(280, windowWidth - (tokens.spacing.lg * 2)),
  );
  const dialogHeight = Math.min(
    DIALOG_MAX_HEIGHT,
    Math.max(
      360,
      windowHeight
        - Math.max(insets.top, tokens.spacing.lg)
        - Math.max(insets.bottom, tokens.spacing.lg)
        - (tokens.spacing.lg * 2),
    ),
  );

  const [selected, setSelected] = React.useState<string>();
  const [pool, setPool] = React.useState<IConfiguratioPropertiesPool>({ ...EMPTY_POOL });
  const [statusMap, setStatusMap] = React.useState<Record<string, PoolProbeResult>>({});
  const [applying, setApplying] = React.useState(false);

  const pools = React.useMemo<IPredefinedPool[]>(() => predefinedPoolsList, []);

  React.useEffect(() => {
    if (visible) {
      applyingRef.current = false;
      setApplying(false);
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
      && poolValidator.validate(pool).error == null,
  );

  const handleDismiss = React.useCallback(() => {
    if (applyingRef.current) {
      return;
    }
    onDismiss?.();
  }, [onDismiss]);

  const handleSelect = React.useCallback((value: any) => {
    const nextSelected = normalizePickerValue(value);
    setSelected(nextSelected);
    // Never allow a just-changed preset to reuse the previously valid pool
    // while its own form is still mounting and publishing its state.
    setPool({ ...EMPTY_POOL });
  }, []);

  const handleApply = React.useCallback(async () => {
    if (!canApply || applyingRef.current) {
      return;
    }

    applyingRef.current = true;
    setApplying(true);

    try {
      const nextPool = {
        hostname: pool.hostname?.trim(),
        port: Number(pool.port),
        username: pool.username?.trim(),
        password: pool.password ?? '',
        sslEnabled: Boolean(pool.sslEnabled),
      };

      if (nextPool.username) {
        await rememberWallet(nextPool.username);
      }

      onAdd(nextPool);
      onDismiss?.();
    } finally {
      applyingRef.current = false;
      setApplying(false);
    }
  }, [canApply, onAdd, onDismiss, pool]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[
          styles.modalRoot,
          {
            paddingTop: Math.max(insets.top, tokens.spacing.lg),
            paddingBottom: Math.max(insets.bottom, tokens.spacing.lg),
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close pool presets"
          onPress={handleDismiss}
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            {
              width: dialogWidth,
              height: dialogHeight,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Pool Presets</Text>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
          >
            <View style={styles.pickerWrap}>
              <Picker
                floatingPlaceholder={selected == null}
                placeholder="Select a pool"
                topBarProps={{ title: 'Pools' }}
                value={selected}
                showSearch
                searchPlaceholder="Search pools"
                onChange={handleSelect}
                style={{ ...Typography.text60, color: tokens.text.primary }}
                floatingPlaceholderStyle={{
                  ...Typography.text70,
                  color: tokens.text.secondary,
                }}
                placeholderTextColor={tokens.text.secondary}
                migrate
                migrateTextField
              >
                {pools.map((item: IPredefinedPool) => (
                  <Picker.Item
                    key={item.name}
                    value={item.name}
                    label={item.info.displayName}
                  />
                ))}
              </Picker>
            </View>

            {poolInfo && (
              <View row paddingB-10 style={styles.chips}>
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

            <View paddingB-10>
              {selected === PredefinedPoolName.MoneroOcean && (
                <MoneroOcean key={selected} onChange={onChange} />
              )}
              {selected === PredefinedPoolName.SupportXMR && (
                <SupportXMR key={selected} onChange={onChange} />
              )}
              {selected === PredefinedPoolName.nanopool && (
                <Nano key={selected} onChange={onChange} />
              )}
              {selected === PredefinedPoolName.C3Pool && (
                <C3Pool key={selected} onChange={onChange} />
              )}
              {selected === PredefinedPoolName.XMRPoolEU && (
                <XMRPoolEU key={selected} onChange={onChange} />
              )}
              {selected === PredefinedPoolName.HashVault && (
                <HashVault key={selected} onChange={onChange} />
              )}
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, tokens.spacing.sm) },
            ]}
          >
            <Button
              flex
              outline
              disabled={applying}
              onPress={handleDismiss}
              label="Cancel"
              marginR-8
              color={tokens.text.primary}
              outlineColor={tokens.border.subtle}
              size={Button.sizes.large}
              style={styles.footerButton}
            />
            <Button
              flex
              disabled={!canApply || applying}
              onPress={handleApply}
              label={applying ? 'Applying…' : 'Apply'}
              backgroundColor={tokens.accent}
              size={Button.sizes.large}
              style={styles.footerButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  backdrop: {
    backgroundColor: tokens.bg.overlay,
  },
  dialog: {
    backgroundColor: sheetBg,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border.subtle,
  },
  header: {
    minHeight: 58,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.border.subtle,
  },
  headerTitle: {
    ...tokens.type.title,
    color: tokens.text.primary,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.lg,
  },
  pickerWrap: {
    minHeight: 56,
    justifyContent: 'center',
  },
  chips: {
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.border.subtle,
    backgroundColor: sheetBg,
  },
  footerButton: {
    minHeight: tokens.touch.min,
  },
});

export default PoolListModal;
