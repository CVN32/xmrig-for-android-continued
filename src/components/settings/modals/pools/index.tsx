import { StyleSheet } from 'react-native';
import { textFieldDefaults, tokens } from '../../../../core/theme/tokens';

export type IPoolState = {
    hostname: string;
    port: number;
    username: string;
    password: string;
}

export type IPool = {
    onChange: (state: IPoolState) => void
}

// Keep this list limited to presets that are currently known to be operating.
// A stale preset is worse than no preset because it produces a valid-looking
// configuration that can never submit a share.
export enum PredefinedPoolName {
    MoneroOcean = 'moneroocean',
    SupportXMR = 'supportxmr',
    nanopool = 'nanopool',
    C3Pool = 'c3pool',
    XMRPoolEU = 'xmrpooleu',
    HashVault = 'hashvault',
}

export type IPredefinedPoolInfo = {
    displayName: string;
    fee: number;
    method: 'PPS' | 'FPPS' | 'PPLNS' ;
    threshold: number;
    hostname: string;
    port: number;
}

export type IPredefinedPool = {
    name: PredefinedPoolName;
    info: IPredefinedPoolInfo;
}

export type IPredefinedPools = Record<PredefinedPoolName, IPredefinedPoolInfo>;

export const predefinedPools:IPredefinedPools = {
  [PredefinedPoolName.MoneroOcean]: {
    displayName: 'MoneroOcean',
    fee: 0,
    method: 'PPLNS',
    threshold: 0.003,
    hostname: 'gulf.moneroocean.stream',
    port: 10128,
  },
  [PredefinedPoolName.SupportXMR]: {
    displayName: 'SupportXMR',
    fee: 0.6,
    method: 'PPLNS',
    threshold: 0.1,
    hostname: 'pool.supportxmr.com',
    port: 3333,
  },
  [PredefinedPoolName.nanopool]: {
    displayName: 'Nanopool',
    fee: 1,
    method: 'PPLNS',
    threshold: 0.11,
    hostname: 'xmr-eu1.nanopool.org',
    port: 10300,
  },
  [PredefinedPoolName.C3Pool]: {
    displayName: 'C3Pool',
    fee: 0,
    method: 'PPLNS',
    threshold: 0.001,
    hostname: 'auto.c3pool.org',
    port: 19999,
  },
  [PredefinedPoolName.XMRPoolEU]: {
    displayName: 'XMRPool EU',
    fee: 0.9,
    method: 'PPLNS',
    threshold: 0.07,
    hostname: 'xmrpool.eu',
    port: 5555,
  },
  [PredefinedPoolName.HashVault]: {
    displayName: 'HashVault',
    fee: 0.9,
    method: 'PPLNS',
    threshold: 0.001,
    hostname: 'pool.hashvault.pro',
    port: 443,
  },
};

export const predefinedPoolsList: IPredefinedPool[] = Object
  .keys(predefinedPools)
  .map((poolName: string) => ({
    name: poolName as PredefinedPoolName,
    info: predefinedPools[poolName as PredefinedPoolName],
  }));

export {
  MoneroOcean,
} from './moneroocean';

export {
  SupportXMR,
} from './supportxmr';

export {
  Nano,
} from './nano';

export {
  C3Pool,
} from './c3pool';

export {
  XMRPoolEU,
} from './xmrpool-eu';

export {
  HashVault,
} from './hashvault';

export {
  WalletAddressField,
} from './wallet-address-field';

export const sharedStyles = StyleSheet.create({
  withUnderline: {
    borderBottomWidth: 1,
    borderColor: tokens.border.subtle,
    paddingBottom: 4,
  },
});

export const poolFieldProps = {
  ...textFieldDefaults,
};
