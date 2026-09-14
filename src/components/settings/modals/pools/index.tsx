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

// eslint-disable-next-line no-shadow
export enum PredefinedPoolName {
    MoneroOcean = 'moneroocean',
    MineXMR = 'minexmr',
    SupportXMR = 'supportxmr',
    nanopool = 'nanopool',
    C3Pool = 'c3pool',
    XMRPoolEU = 'xmrpooleu',
    HashVault = 'hashvalt',
    Hashcity = 'hashcity',
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
    displayName: 'MoneroOcean', fee: 0, method: 'PPLNS', threshold: 0.003,
    hostname: 'gulf.moneroocean.stream', port: 10032,
  },
  [PredefinedPoolName.MineXMR]: {
    displayName: 'MineXMR', fee: 1, method: 'PPLNS', threshold: 0.004,
    hostname: 'pool.minexmr.com', port: 4444,
  },
  [PredefinedPoolName.SupportXMR]: {
    displayName: 'SupportXMR', fee: 0.6, method: 'PPLNS', threshold: 0.01,
    hostname: 'pool.supportxmr.com', port: 3333,
  },
  [PredefinedPoolName.nanopool]: {
    displayName: 'nanopool', fee: 1, method: 'PPLNS', threshold: 0.1,
    hostname: 'xmr-eu1.nanopool.org', port: 14444,
  },
  [PredefinedPoolName.C3Pool]: {
    displayName: 'C3Pool', fee: 0, method: 'PPLNS', threshold: 0.003,
    hostname: 'auto.c3pool.org', port: 19999,
  },
  [PredefinedPoolName.XMRPoolEU]: {
    displayName: 'XMRPool EU', fee: 2.5, method: 'PPLNS', threshold: 2,
    hostname: 'xmrpool.eu', port: 5555,
  },
  [PredefinedPoolName.HashVault]: {
    displayName: 'HashVault', fee: 0.9, method: 'PPLNS', threshold: 0.1,
    hostname: 'pool.hashvault.pro', port: 80,
  },
  [PredefinedPoolName.Hashcity]: {
    displayName: 'HashCity', fee: 1, method: 'FPPS', threshold: 0.01,
    hostname: 'xmr.hashcity.org', port: 4444,
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
  MineXMR,
} from './minexmr';

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
  Hashcity,
} from './hashcity';

export {
  WalletAddressField,
} from './wallet-address-field';

/** Readable text/underline on dark elevated sheet (never light-gray-on-white). */
export const sharedStyles = StyleSheet.create({
  withUnderline: {
    borderBottomWidth: 1,
    borderColor: tokens.border.subtle,
    paddingBottom: 4,
  },
});

/** Spread onto Incubator.TextField inside pool preset forms. */
export const poolFieldProps = {
  ...textFieldDefaults,
};
