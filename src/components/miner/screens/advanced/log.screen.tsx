import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  View,
  Text,
  ViewProps,
  Incubator,
  Button,
  FloatingButton,
  Colors,
  Assets,
  ButtonProps,
} from 'react-native-ui-lib';
import Anser from 'anser';
import Clipboard from '@react-native-community/clipboard';
import { XMRigLogView } from '../../containers/xmrig-log';
import { ILoggerLine, LoggerActionType, LoggerContext } from '../../../../core/logger';
import { useToaster } from '../../../../core/hooks/use-toaster/use-toaster.hook';
import { CHROME } from '../../../../core/theme/chrome';
import { tokens } from '../../../../core/theme/tokens';

const actionsButtonDefault: ButtonProps = {
  label: 'Menu',
  iconSource: Assets.icons.barsOpen,
  iconStyle: {
    width: 20,
    height: 20,
    margin: 0,
    tintColor: Colors.$iconDefaultLight,
  },
};

const LogScreen:React.FC<ViewProps> = () => {
  const { loggerState, loggerDispatcher } = React.useContext(LoggerContext);
  const toaster = useToaster();
  const chrome = CHROME.dark;

  const copyToClipboard = () => {
    Clipboard.setString(
      loggerState
        .map((item: ILoggerLine) => `${item.ts} ${Anser.ansiToText(item.message)}`)
        .join('\n'),
    );
    toaster({
      message: 'The Log has been copied to clipboard',
      position: 'top',
      preset: Incubator.ToastPresets.SUCCESS,
    });
    setActionVisible(false);
  };

  const clearLog = () => {
    loggerDispatcher({
      type: LoggerActionType.RESET,
    });
    setActionVisible(false);
  };

  const [actionsVisible, setActionVisible] = React.useState<boolean>(false);
  const [actionsButtonProps, setActionButtonProps] = React.useState<ButtonProps>({});

  React.useEffect(() => {
    if (actionsVisible) {
      setActionButtonProps(actionsButtonDefault);
    } else {
      setActionButtonProps({
        iconSource: Assets.icons.barsClose,
        iconStyle: {
          width: 15,
          height: 15,
          margin: 8,
          tintColor: Colors.$iconDefaultLight,
        },
      });
    }
  }, [actionsVisible]);

  return (
    <View flex backgroundColor={chrome.screenBG}>
      <View style={styles.header}>
        <View flex>
          <Text style={{ ...tokens.type.title, color: chrome.textColor }}>
            Miner Log
          </Text>
          <Text
            style={{
              ...tokens.type.caption,
              color: chrome.mutedText,
              marginTop: tokens.spacing.xs,
            }}
          >
            Showing the latest {Math.min(loggerState.length, 100)} rows
          </Text>
        </View>
        <Button
          size={Button.sizes.small}
          onPress={() => setActionVisible(!actionsVisible)}
          animateLayout
          backgroundColor={tokens.bg.elevated}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...actionsButtonProps}
        />
      </View>

      <View flex style={styles.logFrame}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          contentContainerStyle={styles.logScrollContent}
        >
          <XMRigLogView data={loggerState} />
        </ScrollView>
      </View>

      <FloatingButton
        duration={250}
        visible={actionsVisible}
        button={{
          size: Button.sizes.large,
          onPress: copyToClipboard,
          backgroundColor: Colors.$backgroundPrimaryHeavy,
          label: 'Copy to Clipboard',
          iconSource: Assets.icons.clipboard,
          iconStyle: {
            display: 'flex',
            width: 16,
            height: 20,
            tintColor: Colors.$iconDefaultLight,
          },
        }}
        secondaryButton={{
          size: Button.sizes.medium,
          label: 'Clear',
          onPress: clearLog,
          backgroundColor: Colors.$backgroundDangerHeavy,
          link: false,
          animateLayout: true,
          iconSource: Assets.icons.trash,
          iconStyle: {
            display: 'flex',
            width: 16,
            height: 20,
            tintColor: Colors.$iconDefaultLight,
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  logFrame: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
  },
  logScrollContent: {
    flexGrow: 1,
  },
});

export default LogScreen;
