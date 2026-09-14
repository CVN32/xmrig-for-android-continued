import _ from 'lodash';
import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Chip, Colors, Incubator, Picker, Typography, View,
} from 'react-native-ui-lib';
import { IConfiguratioPropertiesPool } from '../../../core/settings/settings.interface';
import { sheetBg, tokens } from '../../../core/theme/tokens';
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

const PoolListModal:React.FC<PoolListModalProps> = (
  {
    onAdd,
    onDismiss,
    ...rest
  },
) => {
  const insets = useSafeAreaInsets();
  const footerBottomInset = Math.max(insets.bottom, tokens.spacing.sm);

  const [selected, setSelected] = React.useState<string>();
  const [pool, setPool] = React.useState<IConfiguratioPropertiesPool>({
    hostname: '',
    port: 0,
    username: '',
    password: '',
    sslEnabled: false,
  });

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
  const poolInfo = React.useMemo<IPredefinedPoolInfo>(
    () => predefinedPools[selected as PredefinedPoolName],
    [selected],
  );

  const hide = (isOk: boolean = false) => {
    if (isOk === true) {
      onAdd(pool);
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Incubator.Dialog
      onDismiss={onDismiss}
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
        width: '90%',
        maxWidth: 420,
        maxHeight: '85%',
        backgroundColor: sheetBg,
        borderRadius: 12,
        overflow: 'hidden',
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    >
      <View style={{ backgroundColor: sheetBg, maxHeight: '100%' }}>
        {/* Scrollable body — preset picker + custom fields */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={{ maxHeight: 420 }}
          contentContainerStyle={{
            paddingHorizontal: tokens.spacing.lg,
            paddingTop: tokens.spacing.sm,
            paddingBottom: tokens.spacing.lg,
          }}
        >
          <View height={50} paddingT-10>
            <Picker
              floatingPlaceholder={selected === null}
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
            <View row paddingB-10 spread>
              <Chip
                size={10}
                label={`${poolInfo.fee}% fee`}
                labelStyle={{ color: tokens.text.primary }}
                containerStyle={{ borderColor: tokens.border.subtle }}
              />
              <Chip
                size={10}
                label={`${poolInfo.threshold} min. payout`}
                marginH-10
                labelStyle={{ color: tokens.text.primary }}
                containerStyle={{ borderColor: tokens.border.subtle }}
              />
              <Chip
                size={10}
                label={poolInfo.method}
                labelStyle={{ color: tokens.text.primary }}
                containerStyle={{ borderColor: tokens.border.subtle }}
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

        {/* Fixed footer — Cancel + Apply always visible */}
        <View
          style={{
            height: 56 + footerBottomInset,
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
            onPress={() => hide(true)}
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
