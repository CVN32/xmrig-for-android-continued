import React from 'react';
import { Incubator } from 'react-native-ui-lib';
import { IPool, poolFieldProps, sharedStyles, WalletAddressField } from '.';

const hostname = 'pool.minexmr.com';
const port = 4444;

export const MineXMR:React.FC<IPool> = ({ onChange }) => {
  const [wallet, setWallet] = React.useState<string>('');
  const [difficulty, setDifficulty] = React.useState<string>('');

  React.useEffect(() => {
    onChange({
      hostname,
      port,
      username: `${wallet}${difficulty ? '+' : ''}${difficulty}`,
      password: '',
    });
  }, [wallet, difficulty]);

  return (
    <>
      <WalletAddressField value={wallet} onChangeText={setWallet} />
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
