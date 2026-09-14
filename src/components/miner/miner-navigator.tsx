import React from 'react';
import { ViewProps } from 'react-native';
import { LazyLoader } from '../core/lazy-loader';

const MinerScreen = React.lazy(() => import('./screens/advanced/miner.screen'));

/**
 * Root tabs (Miner | Log | Settings) live in AppNavigator.
 * Kept as a thin Miner-screen wrapper for any legacy imports.
 */
export const TabNavigator: React.FC<ViewProps> = () => (
  <LazyLoader><MinerScreen /></LazyLoader>
);
