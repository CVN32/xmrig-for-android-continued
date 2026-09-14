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
      enableShadow={false}
      flex
      backgroundColor={chrome.cardBG}
      style={[
        {
          overflow: 'hidden',
          borderRadius: chrome.radius,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: chrome.border,
        },
        style,
        disabled ? styles.disabledCard : null,
      ]}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...cardProps}
    >
      <View centerV spread paddingH-12 paddingT-10 paddingB-4>
        {title && (
          <View row>
            <Card.Section
              content={[
                { text: title, text80: true, grey30: true },
              ]}
              style={{
                borderRadius: 0,
              }}
            />
          </View>
        )}
        { subTitle && (
          <View row paddingT-4>
            <Badge
              backgroundColor={Colors.blue70}
              labelStyle={{ color: Colors.blue10, fontSize: 11 }}
              label={subTitle}
              size={18}
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
