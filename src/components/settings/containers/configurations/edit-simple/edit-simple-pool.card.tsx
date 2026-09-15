import { merge } from 'lodash/fp';
import React from 'react';
import {
  Button,
  Card, Colors, Chip, Incubator, SkeletonView, Switch, Text, View,
} from 'react-native-ui-lib';
import { ScrollView, StyleSheet } from 'react-native';
import Clipboard from '@react-native-community/clipboard';
import { EditSimpleCardProps } from './index';
import {
  hostnameValidator, passwordValidator, poolValidator, portValidator, usernameValidator,
} from '../../../../../core/utils/validators';
import { IConfiguratioPropertiesPool } from '../../../../../core/settings/settings.interface';
import PoolListModal from '../../../modals/pool-list.modal';
import { textFieldDefaults, tokens } from '../../../../../core/theme/tokens';
import {
  loadRecentWallets,
  rememberWallet,
} from '../../../../../core/pools/recent-wallets';

export const EditSimplePoolCard: React.FC<EditSimpleCardProps> = (
  { setLocalState, localState },
) => {
  const [valid, setValid] = React.useState<boolean>(
    poolValidator.validate(localState.properties?.pool || {}).error == null,
  );

  React.useEffect(() => {
    setValid(
      poolValidator.validate(localState.properties?.pool || {}).error == null,
    );
  }, [localState.properties]);

  const [showPoolListDialog, setShowPoolListDialog] = React.useState<boolean>(false);
  const [poolEpoch, setPoolEpoch] = React.useState(0);
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

  const setUsername = React.useCallback((text: string) => {
    setLocalState((oldState) => merge(
      oldState,
      {
        properties: {
          pool: {
            username: text,
          },
        },
      },
    ));
  }, [setLocalState]);

  const applyWallet = React.useCallback(async (addr: string) => {
    setUsername(addr);
    const next = await rememberWallet(addr);
    setRecent(next);
  }, [setUsername]);

  const onPasteUsername = React.useCallback(async () => {
    try {
      const clip = await Clipboard.getString();
      if (clip && clip.trim()) {
        await applyWallet(clip.trim());
      }
    } catch {
      // ignore
    }
  }, [applyWallet]);

  return (
    <>
      <PoolListModal
        onAdd={(pool: IConfiguratioPropertiesPool) => {
          // Replace the whole pool object — lodash merge can leave stale
          // TextField-internal state when only nested keys change.
          setLocalState((oldState) => ({
            ...oldState,
            properties: {
              ...oldState.properties,
              pool: {
                hostname: pool.hostname ?? '',
                port: pool.port ?? 0,
                username: pool.username ?? '',
                password: pool.password ?? '',
                sslEnabled: pool.sslEnabled ?? false,
              },
            },
          }));
          setPoolEpoch((n) => n + 1);
          if (pool.username) {
            rememberWallet(pool.username).then(setRecent);
          }
        }}
        onDismiss={() => setShowPoolListDialog(false)}
        visible={showPoolListDialog}
      />
      <Card
        enableShadow
        backgroundColor={tokens.bg.surface}
        selected={!valid}
        selectionOptions={{
          hideIndicator: true,
          color: Colors.$outlineDanger,
        }}
      >
        <View centerV spread padding-20 paddingB-5>
          <View row centerV>
            <Card.Section
              style={{ flexShrink: 1 }}
              content={[
                { text: 'Pool', text65: true, color: tokens.text.primary },
                {
                  text: 'Pools connection details provided by the pool. We provide presets for some popular pools.',
                  text90: true,
                  color: tokens.text.secondary,
                },
              ]}
            />
            <View paddingL-10>
              <Button size={Button.sizes.small} label="Presets" onPress={() => setShowPoolListDialog(true)} />
            </View>
          </View>
        </View>
        <View spread padding-20 paddingT-10>
          <View flex row>
            <View flex-2 marginR-20>
              <Incubator.TextField
                key={`pool-host-${poolEpoch}`}
                placeholder="Hostname / IP"
                floatingPlaceholder
                value={localState.properties?.pool?.hostname ?? ''}
                onChangeText={(text) => setLocalState((oldState) => merge(
                  oldState,
                  {
                    properties: {
                      pool: {
                        hostname: text,
                      },
                    },
                  },
                ))}
                validate={
                  (value: string) => hostnameValidator
                    .validate(value)
                    .error == null
                }
                validationMessage={
                  hostnameValidator
                    .validate(localState.properties?.pool?.hostname)
                    .error?.message
                }
                validateOnChange
                enableErrors
                floatOnFocus
                showCharCounter
                maxLength={128}
                fieldStyle={styles.withUnderline}
                hint="pool.domain.tld"
                keyboardType="url"
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...textFieldDefaults}
              />
            </View>
            <View flex-1>
              <Incubator.TextField
                key={`pool-port-${poolEpoch}`}
                placeholder="Port"
                floatingPlaceholder
                value={localState.properties?.pool?.port != null
                  ? String(localState.properties.pool.port)
                  : ''}
                onChangeText={(text) => setLocalState((oldState) => merge(
                  oldState,
                  {
                    properties: {
                      pool: {
                        port: text,
                      },
                    },
                  },
                ))}
                validate={
                  (value: string) => portValidator
                    .validate(value)
                    .error == null
                }
                validationMessage={
                  portValidator
                    .validate(localState.properties?.pool?.port)
                    .error?.message
                }
                validateOnChange
                enableErrors
                floatOnFocus
                showCharCounter
                maxLength={5}
                fieldStyle={styles.withUnderline}
                hint="80"
                keyboardType="numeric"
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...textFieldDefaults}
              />
            </View>
          </View>
          <View row spread centerV marginB-4>
            <Text text80 color={tokens.text.secondary}>Username / Wallet</Text>
            <Button
              label="Paste"
              size={Button.sizes.xSmall}
              backgroundColor={tokens.border.subtle}
              color={tokens.text.primary}
              onPress={onPasteUsername}
            />
          </View>
          <Incubator.TextField
            key={`pool-user-${poolEpoch}`}
            placeholder="Wallet address or username"
            value={localState.properties?.pool?.username}
            onChangeText={setUsername}
            onBlur={() => {
              const u = localState.properties?.pool?.username;
              if (u) {
                rememberWallet(u).then(setRecent);
              }
            }}
            validate={
              (value: string) => usernameValidator
                .validate(value)
                .error == null
            }
            validationMessage={
              usernameValidator
                .validate(localState.properties?.pool?.username)
                .error?.message
            }
            validateOnChange
            enableErrors
            floatOnFocus
            showCharCounter
            maxLength={128}
            fieldStyle={styles.withUnderline}
            hint="Mostly used for wallet"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...textFieldDefaults}
          />
          {recent.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
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
          <Incubator.TextField
            key={`pool-pass-${poolEpoch}`}
            placeholder="Password"
            floatingPlaceholder
            value={localState.properties?.pool?.password ?? ''}
            onChangeText={(text) => setLocalState((oldState) => merge(
              oldState,
              {
                properties: {
                  pool: {
                    password: text,
                  },
                },
              },
            ))}
            validate={
              (value: string) => passwordValidator
                .validate(value)
                .error == null
            }
            validationMessage={
              passwordValidator
                .validate(localState.properties?.pool?.password)
                .error?.message
            }
            validateOnChange
            enableErrors
            floatOnFocus
            showCharCounter
            maxLength={128}
            fieldStyle={styles.withUnderline}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...textFieldDefaults}
          />
          <View row flex paddingT-20>
            <Text text80 color={tokens.text.secondary} flex column>SSL</Text>
            <Switch
              value={localState.properties?.pool?.sslEnabled}
              onValueChange={(value) => setLocalState((oldState) => merge(
                oldState,
                {
                  properties: {
                    pool: {
                      sslEnabled: value,
                    },
                  },
                },
              ))}
            />
          </View>
        </View>
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  withUnderline: {
    borderBottomWidth: 1,
    borderColor: tokens.border.subtle,
    paddingBottom: 4,
  },
});

const EditSimplePoolCardSkeleton: React.FC<EditSimpleCardProps> = (props) => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  React.useEffect(() => {
    const interval = setTimeout(() => setLoaded(true), 500);
    return () => {
      clearTimeout(interval);
      setLoaded(false);
    };
  }, []);

  return (
    <SkeletonView
      template={SkeletonView.templates.TEXT_CONTENT}
      customValue={props}
      showContent={loaded}
      renderContent={
        // eslint-disable-next-line react/jsx-props-no-spreading
        (customProps: EditSimpleCardProps) => (<EditSimplePoolCard {...customProps} />)
      }
      times={3}
    />
  );
};

export default EditSimplePoolCardSkeleton;
