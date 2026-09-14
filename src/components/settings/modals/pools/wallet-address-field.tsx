import React from 'react';
import { ScrollView } from 'react-native';
import Clipboard from '@react-native-community/clipboard';
import {
  Button, Chip, Incubator, Text, View,
} from 'react-native-ui-lib';
import { validateWalletAddress } from '../../../../core/utils';
import {
  loadRecentWallets,
  rememberWallet,
} from '../../../../core/pools/recent-wallets';
import { poolFieldProps, sharedStyles } from '.';
import { tokens } from '../../../../core/theme/tokens';

export type WalletAddressFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** When false, skip wallet regex validation (e.g. HashCity username). */
  requireWalletFormat?: boolean;
  label?: string;
};

/**
 * Wallet / username field with recent-address chips + paste-from-clipboard.
 * Local-only (AsyncStorage); no backend.
 */
export const WalletAddressField: React.FC<WalletAddressFieldProps> = ({
  value,
  onChangeText,
  requireWalletFormat = true,
  label = 'Wallet Address',
}) => {
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    let alive = true;
    loadRecentWallets().then((list) => {
      if (alive) {
        setRecent(list);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const applyWallet = React.useCallback(async (addr: string) => {
    onChangeText(addr);
    const next = await rememberWallet(addr);
    setRecent(next);
  }, [onChangeText]);

  const onPaste = React.useCallback(async () => {
    try {
      const clip = await Clipboard.getString();
      if (clip && clip.trim()) {
        await applyWallet(clip.trim());
      }
    } catch {
      // clipboard unavailable
    }
  }, [applyWallet]);

  const validators = requireWalletFormat
    ? ['required', (v: string) => validateWalletAddress(v)]
    : undefined;
  const validationMessage = requireWalletFormat
    ? ['Required', 'Wallet validation failed']
    : undefined;

  return (
    <View marginB-10>
      <View row spread centerV marginB-4>
        <Text text80 color={tokens.text.secondary}>{label}</Text>
        <Button
          label="Paste"
          size={Button.sizes.xSmall}
          backgroundColor={tokens.border.subtle}
          color={tokens.text.primary}
          onPress={onPaste}
        />
      </View>
      <Incubator.TextField
        value={value}
        onChangeText={onChangeText}
        onBlur={() => {
          if (value) {
            rememberWallet(value).then(setRecent);
          }
        }}
        validate={validators as any}
        validationMessage={validationMessage as any}
        validateOnChange={requireWalletFormat}
        enableErrors={requireWalletFormat}
        floatOnFocus
        showCharCounter
        maxLength={128}
        fieldStyle={sharedStyles.withUnderline}
        hint="46gPyHjLPPM8HaayVyvCDcF2..."
        placeholder="46gPyHjLPPM8HaayVyvCDcF2..."
        numberOfLines={1}
        textBreakStrategy="simple"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...poolFieldProps}
      />
      {recent.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: tokens.spacing.sm }}
        >
          {recent.map((addr) => (
            <Chip
              key={addr}
              label={`${addr.slice(0, 6)}…${addr.slice(-4)}`}
              marginR-8
              onPress={() => applyWallet(addr)}
              labelStyle={{ color: tokens.text.primary }}
              containerStyle={{
                borderColor: tokens.border.subtle,
                backgroundColor: tokens.bg.elevated,
              }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default WalletAddressField;
