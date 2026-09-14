import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { CHROME } from '../../../core/theme/chrome';
import {
  Card, CardProps, ViewProps, Badge, View, Colors, BadgeProps,
} from 'react-native-ui-lib';

export type MinerCardProps = ViewProps & {
    title?: string;
    subTitle?: string;
    disabled?: boolean;
    cardProps?: CardProps;
    badgeProps?: BadgeProps;
};

export const MinerCard:React.FC<MinerCardProps> = ({
  style,
  children,
  title,
  subTitle,
  disabled = false,
  cardProps = {},
  badgeProps = {},
}) => {
  const chrome = CHROME[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
  <Card
    enableShadow
    flex
    backgroundColor={chrome.cardBG}
    style={[style, disabled ? styles.disabledCard : { overflow: 'hidden' }]}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...cardProps}
  >
    <View centerV spread padding-10 paddingB-5>
      {title && (
        <View row>
          <Card.Section
            content={[
              { text: title, text75: true, grey30: true },
            ]}
            style={{
              borderTopRightRadius: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          />
        </View>
      )}
      { subTitle && (
        <View row paddingT-5>
          <Badge
            backgroundColor={Colors.blue70}
            labelStyle={{ color: Colors.blue10 }}
            label={subTitle}
            size={16}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...badgeProps}
          />
        </View>
      )}
    </View>
    {children}
  </Card>
  );
};

const styles = StyleSheet.create({
  disabledCard: {
    opacity: 0.2,
  },
});
