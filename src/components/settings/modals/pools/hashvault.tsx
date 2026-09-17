import React from 'react';
import { Incubator } from 'react-native-ui-lib';
import { IPool, poolFieldProps, sharedStyles, WalletAddressField } from '.';

const hostname = 'pool.hashvault.pro';
const port = 443;

export const HashVault:React.FC<IPool> = ({ onChange }) => {
  const [wallet, setWallet] = React.useState<string>('');
  const [worker, setWorker] = React.useState<string>('');

  React.useEffect(() => {
    onChange({
      hostname,
      port,
      username: `${wallet}`,
      password: `${worker}`,
    });
  }, [wallet, worker, onChange]);

  return (
    <>
      <WalletAddressField value={wallet} onChangeText={setWallet} />
      <Incubator.TextField
        label="Worker Name"
        value={worker}
        onChangeText={setWorker}
        floatOnFocus
        showCharCounter
        maxLength={128}
        fieldStyle={sharedStyles.withUnderline}
        hint="Worker1"
        placeholder="Worker1"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...poolFieldProps}
      />
    </>
  );
};
