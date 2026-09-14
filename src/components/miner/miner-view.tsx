import React from 'react';
import { ViewProps } from 'react-native-ui-lib';
import { LazyLoader } from '../core/lazy-loader';

const MinerScreen = React.lazy(() => import('./screens/advanced/miner.screen'));

/** Miner tab content only — Log/Settings are siblings in AppNavigator. */
export const MinerView: React.FC<ViewProps> = () => (
  <LazyLoader><MinerScreen /></LazyLoader>
);

export default MinerView;
