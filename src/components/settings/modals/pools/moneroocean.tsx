import React from 'react';
import { Incubator } from 'react-native-ui-lib';
import { IPool, poolFieldProps, sharedStyles, WalletAddressField } from '.';

const hostname = 'gulf.moneroocean.stream';
const port = 10128;

export const MoneroOcean:React.FC<IPool> = ({ onChange }) => {
  const [wallet, setWallet] = React.useState<string>('');
  const [worker, setWorker] = React.useState<string>('');
  const [difficulty, setDifficulty] = React.useState<string>('');

  React.useEffect(() => {
    onChange({
      hostname,
      port,
      username: `${wallet}${difficulty ? '+' : ''}${difficulty}`,
      password: `${worker}`,
    });
  }, [wallet, worker, difficulty, onChange]);

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
        marginB-10
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...poolFieldProps}
      />
      <Incubator.TextField
        label="Fixed Difficulty"
        value={difficulty}
        onChangeText={setDifficulty}
        floatOnFocus
        showCharCounter
        maxLength={128}
        fieldStyle={sharedStyles.withUnderline}
        hint="128000"
        placeholder="128000"
        keyboardType="numeric"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...poolFieldProps}
      />
    </>
  );
};
