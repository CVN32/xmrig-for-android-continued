/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { StyleSheet } from 'react-native';
import { View, ViewProps } from 'react-native-ui-lib';
import { AnsiComponent } from 'react-native-ansi-view';
import _ from 'lodash';
import { ILoggerLine } from '../../../core/logger';
import { tokens } from '../../../core/theme/tokens';

type LogViewProps = ViewProps & {
  data: ILoggerLine[];
}

export const XMRigLogView:React.FC<LogViewProps> = ({
  data,
}) => (
  <View style={styles.logSurface}>
    {_.takeRight(data, 100).map((value, index) => (
      <AnsiComponent
        textStyle={styles.logTextDefault}
        containerStyle={styles.logContainer}
        ansi={value.message}
        key={`key-${value.id}-${index}`}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  logSurface: {
    flexGrow: 1,
    backgroundColor: '#090B0F',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border.subtle,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.spacing.sm,
    overflow: 'hidden',
  },
  logContainer: {
    backgroundColor: '#090B0F',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: 0,
  },
  logTextDefault: {
    color: 'white',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 17,
  },
});
