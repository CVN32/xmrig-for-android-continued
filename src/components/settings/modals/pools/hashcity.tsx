import React from 'react';
import { Incubator } from 'react-native-ui-lib';
import { IPool, poolFieldProps, sharedStyles, WalletAddressField } from '.';

const hostname = 'xmr.hashcity.org';
const port = 4444;

export const Hashcity:React.FC<IPool> = ({ onChange }) => {
  const [username, setUsername] = React.useState<string>('');
  const [worker, setWorker] = React.useState<string>('');

  React.useEffect(() => {
    const tmpWorker = worker.length > 0 ? `.${worker}` : '';

    onChange({
      hostname,
      port,
      username: `${username}${tmpWorker}`,
      password: '',
    });
  }, [username, worker]);

  return (
    <>
      <WalletAddressField
        label="Username"
        value={username}
        onChangeText={setUsername}
        requireWalletFormat={false}
      />
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
