import { merge } from 'lodash/fp';
import React from 'react';
import {
  Assets,
  Card, Colors, Icon, RadioButton, RadioGroup, SkeletonView, Text, View,
} from 'react-native-ui-lib';
import { EditSimpleCardProps } from './index';
import { ISimpleConfiguration, XMRigFork } from '../../../../../core/settings/settings.interface';
import { tokens } from '../../../../../core/theme/tokens';

const radioLabelStyle = { color: tokens.text.primary };

export const EditSimpleForkCard: React.FC<EditSimpleCardProps> = (
  { setLocalState, localState },
) => (
  <Card enableShadow backgroundColor={tokens.bg.surface}>
    <View centerV spread padding-20 paddingB-5>
      <View row>
        <Card.Section
          style={{ flexShrink: 1 }}
          content={[
            { text: 'General', text65: true, color: tokens.text.primary },
            {
              text: "You can choose between original XMRig and MoneroOcean's fork that supports algo switching.",
              text90: true,
              color: tokens.text.secondary,
            },
          ]}
        />
      </View>
    </View>

    <View spread padding-20 paddingT-10>
      <RadioGroup
        onValueChange={(value: XMRigFork) => {
          setLocalState((oldState: ISimpleConfiguration) => merge(
            oldState,
            {
              xmrig_fork: value,
            },
          ));
        }}
        initialValue={localState.xmrig_fork}
      >
        <View row spread>
          <RadioButton label="Original" value={XMRigFork.ORIGINAL} labelStyle={radioLabelStyle} />
          <RadioButton label="MoneroOcean" value={XMRigFork.MONEROOCEAN} labelStyle={radioLabelStyle} />
        </View>
      </RadioGroup>
      {localState.xmrig_fork === XMRigFork.MONEROOCEAN && (
        <View row centerV marginT-10>
          <Icon source={Assets.icons.warning} tintColor={Colors.$textDanger} marginR-10 />
          <View flex>
            <Text text90L color={tokens.danger} textBreakStrategy="balanced" underline>
              Warning: Benchmarking may stuck on some algos.
            </Text>
            <Text text100L color={tokens.text.secondary} textBreakStrategy="balanced">
              You can disable specific algorithems using
              "Algorithems" section below or by using custom
              configuration file in "Advanced Mode".
            </Text>
          </View>
        </View>
      )}
    </View>
  </Card>
);

const EditSimpleForkCardSkeleton: React.FC<EditSimpleCardProps> = (props) => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  React.useEffect(() => {
    const interval = setTimeout(() => setLoaded(true), 600);
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
        (customProps: EditSimpleCardProps) => (<EditSimpleForkCard {...customProps} />)
      }
      times={2}
    />
  );
};

export default EditSimpleForkCardSkeleton;
