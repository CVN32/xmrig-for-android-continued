import React from 'react';
import { useNavigation } from '@react-navigation/native';
import uuid from 'react-native-uuid';
import {
  Assets, Button, Colors, Text, View,
} from 'react-native-ui-lib';
import { SettingsActionType, SettingsContext } from '../../../core/settings';
import { ConfigurationsListView } from '../containers/configurations/list-view';
import AddConfigurationsModal from '../modals/add-configuration.modal';

const ConfigurationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { settings, settingsDispatcher } = React.useContext(SettingsContext);
  const [showAddNewDialogVisible, setShowAddNewDialogVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<string[]>([]);

  const isEmpty = !settings.configurations || settings.configurations.length === 0;
  const openAdd = React.useCallback(() => setShowAddNewDialogVisible(true), []);

  return (
    <View bg-screenBG flex>
      <AddConfigurationsModal
        onAdd={(name, mode) => {
          const id = `${uuid.v4()}`;
          settingsDispatcher({
            type: SettingsActionType.ADD_CONFIGURATION,
            value: {
              id,
              name,
              mode,
            },
          });
          setShowAddNewDialogVisible(false);
          navigation.navigate('Configuration', { id });
        }}
        onDismiss={() => setShowAddNewDialogVisible(false)}
        visible={showAddNewDialogVisible}
      />
      <View
        row
        spread
        paddingV-12
        paddingH-14
        centerV
      >
        <Text text60 $textDefault>Configurations</Text>
        <Button
          size={Button.sizes.small}
          label="Add"
          iconSource={Assets.icons.clipboard}
          iconStyle={{
            width: 14,
            height: 18,
            marginRight: 6,
            tintColor: Colors.$iconDefaultLight,
          }}
          onPress={openAdd}
        />
      </View>

      {isEmpty ? (
        <View flex center paddingH-24>
          <Text text50 $textDefault center marginB-8>No configurations yet</Text>
          <Text text80 $textNeutral center marginB-24>
            Create a mining profile to choose a pool, wallet, and algorithm, then start from the Miner tab.
          </Text>
          <Button
            size={Button.sizes.large}
            label="Add configuration"
            iconSource={Assets.icons.clipboard}
            iconStyle={{
              width: 16,
              height: 20,
              marginRight: 8,
              tintColor: Colors.$iconDefaultLight,
            }}
            onPress={openAdd}
          />
        </View>
      ) : (
        <View
          flex
          paddingH-14
          paddingB-14
          useSafeArea
          style={{ zIndex: 0 }}
        >
          <ConfigurationsListView
            configurations={settings.configurations}
            onSelected={setSelected}
          />
          {selected.length > 0 && (
            <View paddingT-12>
              <Button
                size={Button.sizes.large}
                label={`Delete (${selected.length}) selected`}
                backgroundColor={Colors.$backgroundDangerHeavy}
                iconSource={Assets.icons.trash}
                iconStyle={{
                  width: 16,
                  height: 20,
                  marginRight: 8,
                  tintColor: Colors.$iconDefaultLight,
                }}
                onPress={() => {
                  settingsDispatcher({
                    type: SettingsActionType.DELETE_CONFIGURATIONS,
                    value: selected,
                  });
                  setSelected([]);
                }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ConfigurationsScreen;
