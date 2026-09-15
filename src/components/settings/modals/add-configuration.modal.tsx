import React from 'react';
import { StyleSheet } from 'react-native';
import {
  Text,
  View,
  Colors,
  Incubator,
  RadioGroup,
  RadioButton,
  Button,
} from 'react-native-ui-lib';
import { SettingsContext } from '../../../core/settings';
import { ConfigurationMode } from '../../../core/settings/settings.interface';
import { getConfigurationNameValidator, getConfigurationValidator } from '../../../core/utils/validators';
import { sheetBg, textFieldDefaults, tokens } from '../../../core/theme/tokens';

export type AddConfigurationsModalProps = Incubator.DialogProps & {
    onAdd: (name: string, mode: ConfigurationMode) => void;
}

const AddConfigurationsModal:React.FC<AddConfigurationsModalProps> = (
  {
    onAdd,
    onDismiss,
    visible,
    ...rest
  },
) => {
  const { settings } = React.useContext(SettingsContext);
  const existsNames = React.useMemo<string[]>(
    () => settings.configurations.map(
      (c) => c.name,
    ),
    [settings.configurations],
  );

  const [name, setName] = React.useState('');
  const [configMode, setConfigMode] = React.useState<ConfigurationMode>(ConfigurationMode.SIMPLE);

  React.useEffect(() => {
    if (visible) {
      setName('');
      setConfigMode(ConfigurationMode.SIMPLE);
    }
  }, [visible]);

  const trimmedName = name.trim();
  const isValid = React.useMemo(() => getConfigurationValidator(existsNames).validate({
    name: trimmedName,
    mode: configMode,
  }).error == null, [trimmedName, configMode, existsNames]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Incubator.Dialog
      onDismiss={onDismiss}
      visible={visible}
      center
      headerProps={{
        text: {
          title: 'New Configuration',
          titleStyle: {
            color: tokens.text.primary,
            fontSize: tokens.type.title.fontSize,
            fontWeight: tokens.type.title.fontWeight,
          },
        },
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
      containerStyle={{
        width: '90%',
        maxWidth: 420,
        alignSelf: 'center',
        minWidth: 280,
        minHeight: 320,
        backgroundColor: sheetBg,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <View spread flex-1 style={{ backgroundColor: sheetBg }}>
        <View padding-20 style={{ flexGrow: 1 }}>
          <Incubator.TextField
            placeholder="Name"
            floatingPlaceholder
            value={name}
            onChangeText={(text) => setName(text)}
            validate={
              (value: string) => getConfigurationNameValidator(existsNames)
                .validate((value || '').trim())
                .error === null
            }
            validationMessage={
              getConfigurationNameValidator(existsNames).validate(trimmedName).error?.message
            }
            validateOnChange
            enableErrors
            floatOnFocus
            showCharCounter
            maxLength={30}
            fieldStyle={styles.withUnderline}
            hint="Friendly configuration name"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...textFieldDefaults}
          />
          <Text text85 color={tokens.text.secondary} marginT-10 marginB-15>Editor Mode</Text>
          <RadioGroup
            initialValue={configMode}
            onValueChange={(value: ConfigurationMode) => setConfigMode(value)}
          >
            <RadioButton
              label="Simple Mode"
              value={ConfigurationMode.SIMPLE}
              marginB-10
              labelStyle={{ color: tokens.text.primary }}
            />
            <RadioButton
              label="Advanced Mode"
              value={ConfigurationMode.ADVANCE}
              labelStyle={{ color: tokens.text.primary }}
            />
          </RadioGroup>
        </View>
        <View>
          <View height={1.5} style={{ backgroundColor: tokens.border.subtle }} />
          <View paddingV-15 paddingH-20 right row>
            <Button
              disabled={!isValid}
              onPress={() => onAdd(trimmedName, configMode)}
              marginR-10
              label="Add"
              size={Button.sizes.medium}
              backgroundColor={tokens.accent}
            />
            <Button
              onPress={onDismiss}
              label="Cancel"
              backgroundColor={tokens.danger}
              size={Button.sizes.medium}
            />
          </View>
        </View>
      </View>
    </Incubator.Dialog>
  );
};

const styles = StyleSheet.create({
  withUnderline: {
    borderBottomWidth: 1,
    borderColor: tokens.border.subtle,
    paddingBottom: 4,
  },
});

export default AddConfigurationsModal;
