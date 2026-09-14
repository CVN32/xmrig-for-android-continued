import { useNavigation, useRoute } from '@react-navigation/native';
import React, { Suspense } from 'react';
import {
  Assets, Button, ButtonProps, Colors, FloatingButton, LoaderScreen, Text, View,
} from 'react-native-ui-lib';
import { SettingsActionType, SettingsContext } from '../../../core/settings';
import { Configuration, ConfigurationMode } from '../../../core/settings/settings.interface';

const ConfigurationEditSimple = React.lazy(() => import('../containers/configurations/edit-simple'));
const ConfigurationEditAdvance = React.lazy(() => import('../containers/configurations/edit-advance'));

const actionsButtonDefault: ButtonProps = {
  label: 'Menu',
  iconSource: Assets.icons.barsOpen,
  iconStyle: {
    width: 22,
    height: 22,
    margin: 0,
    tintColor: Colors.$iconDefaultLight,
  },
};

const ConfigurationEditScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const [changesCount, setChangesCount] = React.useState<number>(0);

  const { settings, settingsDispatcher } = React.useContext(SettingsContext);
  const configIdRaw = (route.params as any)?.id;
  const configId = configIdRaw != null && configIdRaw !== ''
    ? String(configIdRaw)
    : undefined;
  const savedConfiguration = React.useMemo(() => {
    if (!configId) {
      return undefined;
    }
    return settings.configurations.find((item) => String(item.id) === configId);
  }, [settings.configurations, configId]);
  const [configuration, setConfiguration] = React.useState<Configuration>();
  React.useEffect(() => {
    setConfiguration(savedConfiguration);
  }, [configId, savedConfiguration]);

  React.useEffect(() => {
    if (configuration !== savedConfiguration) {
      setChangesCount((val) => val + 1);
    } else {
      setChangesCount(0);
    }
  }, [configuration]);

  const handleUpdate = (data: Configuration) => {
    settingsDispatcher({
      type: SettingsActionType.UPDATE_CONFIGURATION,
      value: {
        ...data,
        id: data?.id != null ? String(data.id) : data.id,
      },
    });
    navigation.goBack();
  };

  const [actionsVisible, setActionVisible] = React.useState<boolean>(false);
  const [actionsButtonProps, setActionButtonProps] = React.useState<ButtonProps>({
    ...actionsButtonDefault,
  });
  React.useEffect(() => {
    if (actionsVisible) {
      setActionButtonProps({
        ...actionsButtonDefault,
      });
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

  // Defer "not found" briefly so navigate-right-after-ADD does not flash empty
  // while the SettingsContext commit with the new id is still landing.
  const [missingConfirmed, setMissingConfirmed] = React.useState(false);
  React.useEffect(() => {
    if (!configId || !settings.ready) {
      setMissingConfirmed(false);
      return undefined;
    }
    if (savedConfiguration) {
      setMissingConfirmed(false);
      return undefined;
    }
    const t = setTimeout(() => setMissingConfirmed(true), 100);
    return () => clearTimeout(t);
  }, [configId, savedConfiguration, settings.ready]);

  if (!settings.ready || (!savedConfiguration && configId && !missingConfirmed)) {
    return (
      <View bg-screenBG flex center>
        <LoaderScreen />
      </View>
    );
  }

  // Missing / deleted config — friendly empty, no crash
  if (!configId || !savedConfiguration) {
    return (
      <View bg-screenBG flex center paddingH-24>
        <Text text60 $textDefault center marginB-8>Configuration not found</Text>
        <Text text80 $textNeutral center marginB-24>
          This profile may have been deleted or the link is outdated.
        </Text>
        <Button
          size={Button.sizes.medium}
          label="Go back"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View bg-screenBG flex>
      <View
        row
        spread
        paddingV-10
        paddingH-10
        paddingB-5
        centerV
      >
        <View row centerV>
          <Text text60>{configuration?.name}</Text>
        </View>
        <Button
          size={Button.sizes.small}
          onPress={() => setActionVisible(!actionsVisible)}
          animateLayout
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...actionsButtonProps}
        />
      </View>
      {changesCount > 0 && (
        <View padding-10 paddingT-0 center>
          <Text text90 $textDanger>
            Please save changes (
            {changesCount}
            ) using the Menu button
          </Text>
        </View>
      )}
      <View
        flex
        paddingH-10
        paddingB-10
        useSafeArea
        style={{ zIndex: 0 }}
      >
        {configuration?.mode === ConfigurationMode.SIMPLE && (
          <Suspense fallback={<LoaderScreen />}>
            <ConfigurationEditSimple
              configuration={configuration}
              onUpdate={setConfiguration}
            />
          </Suspense>
        )}
        {configuration?.mode === ConfigurationMode.ADVANCE && (
          <Suspense fallback={<LoaderScreen />}>
            <ConfigurationEditAdvance
              configuration={configuration}
              onUpdate={setConfiguration}
            />
          </Suspense>
        )}
      </View>
      <FloatingButton
        duration={500}
        visible={actionsVisible}
        button={{
          size: Button.sizes.large,
          disabled: changesCount === 0,
          onPress: () => {
            if (configuration) {
              handleUpdate(configuration);
              setChangesCount(0);
            }
            setActionVisible(false);
          },
          backgroundColor: Colors.$backgroundPrimaryHeavy,
          label: `Save ${changesCount} Changes`,
          iconSource: Assets.icons.save,
          iconStyle: {
            display: 'flex',
            width: 16,
            height: 20,
            tintColor: Colors.$iconDefaultLight,
          },
        }}
        secondaryButton={{
          size: Button.sizes.medium,
          label: 'Delete Configuration',
          onPress: () => {
            if (configuration?.id) {
              settingsDispatcher({
                type: SettingsActionType.DELETE_CONFIGURATIONS,
                value: [String(configuration.id)],
              });
            }
            setActionVisible(false);
            navigation.goBack();
          },
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

export default ConfigurationEditScreen;
