import { useNavigation, useRoute } from '@react-navigation/native';
import _ from 'lodash';
import React, { Suspense } from 'react';
import {
  Assets, Button, ButtonProps, Colors, FloatingButton, LoaderScreen, Text, View,
} from 'react-native-ui-lib';
import { SettingsActionType, SettingsContext } from '../../../core/settings';
import { Configuration, ConfigurationMode } from '../../../core/settings/settings.interface';

const ConfigurationEditSimple = React.lazy(() => import('../containers/configurations/edit-simple'));
const ConfigurationEditAdvance = React.lazy(() => import('../containers/configurations/edit-advance'));

const menuOpenButton: ButtonProps = {
  label: 'Menu',
  iconSource: Assets.icons.barsOpen,
  iconStyle: {
    width: 22,
    height: 22,
    margin: 0,
    tintColor: Colors.$iconDefaultLight,
  },
};

const menuCloseButton: ButtonProps = {
  label: 'Close',
  iconSource: Assets.icons.barsClose,
  iconStyle: {
    width: 15,
    height: 15,
    margin: 8,
    tintColor: Colors.$iconDefaultLight,
  },
};

const ConfigurationEditScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const routeId = `${(route.params as any)?.id || ''}`;

  const { settings, settingsDispatcher } = React.useContext(SettingsContext);
  const savedConfiguration = React.useMemo(() => settings.configurations.find(
    (item) => item.id === routeId,
  ), [settings.configurations, routeId]);

  const [configuration, setConfiguration] = React.useState<Configuration | undefined>(savedConfiguration);
  const [actionsVisible, setActionsVisible] = React.useState<boolean>(false);

  React.useEffect(() => {
    setConfiguration(savedConfiguration);
    setActionsVisible(false);
  }, [routeId]);

  React.useEffect(() => {
    if (!savedConfiguration && settings.ready) {
      navigation.goBack();
    }
  }, [savedConfiguration, settings.ready, navigation]);

  const hasChanges = React.useMemo(
    () => Boolean(configuration && savedConfiguration && !_.isEqual(configuration, savedConfiguration)),
    [configuration, savedConfiguration],
  );

  const handleUpdate = React.useCallback((data: Configuration) => {
    settingsDispatcher({
      type: SettingsActionType.UPDATE_CONFIGURATION,
      value: data,
    });
    navigation.goBack();
  }, [settingsDispatcher, navigation]);

  const handleDelete = React.useCallback(() => {
    if (configuration?.id) {
      settingsDispatcher({
        type: SettingsActionType.DELETE_CONFIGURATIONS,
        value: [configuration.id],
      });
    }
    setActionsVisible(false);
    navigation.goBack();
  }, [configuration?.id, settingsDispatcher, navigation]);

  if (!configuration) {
    return <LoaderScreen />;
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
        <View row centerV flex>
          <Text text60 numberOfLines={1}>{configuration.name}</Text>
        </View>
        <Button
          size={Button.sizes.small}
          onPress={() => setActionsVisible((visible) => !visible)}
          animateLayout
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...(actionsVisible ? menuCloseButton : menuOpenButton)}
        />
      </View>
      {hasChanges && (
        <View padding-10 paddingT-0 center>
          <Text text90 $textDanger>
            Unsaved changes — use Menu to save
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
        {configuration.mode === ConfigurationMode.SIMPLE && (
          <Suspense fallback={<LoaderScreen />}>
            <ConfigurationEditSimple
              configuration={configuration}
              onUpdate={setConfiguration}
            />
          </Suspense>
        )}
        {configuration.mode === ConfigurationMode.ADVANCE && (
          <Suspense fallback={<LoaderScreen />}>
            <ConfigurationEditAdvance
              configuration={configuration}
              onUpdate={setConfiguration}
            />
          </Suspense>
        )}
      </View>
      <FloatingButton
        duration={300}
        visible={actionsVisible}
        button={{
          size: Button.sizes.large,
          disabled: !hasChanges,
          onPress: () => handleUpdate(configuration),
          backgroundColor: Colors.$backgroundPrimaryHeavy,
          label: 'Save changes',
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
          label: 'Delete configuration',
          onPress: handleDelete,
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
