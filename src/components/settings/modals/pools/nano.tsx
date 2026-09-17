import React from 'react';
import { Incubator } from 'react-native-ui-lib';
import {
  IPool, poolFieldProps, sharedStyles, WalletAddressField,
} from '.';

const hostname = 'xmr-eu1.nanopool.org';
const port = 10300;

export const Nano:React.FC<IPool> = ({ onChange }) => {
  const [wallet, setWallet] = React.useState<string>('');
  const [worker, setWorker] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');

  React.useEffect(() => {
    const tmpWorker = worker.length > 0 ? `.${worker}` : '';
    const tmpEMail = email.length > 0 ? `/${email}` : '';

    onChange({
      hostname,
      port,
      username: `${wallet}${tmpWorker}${tmpEMail}`,
      password: 'x',
    });
  }, [wallet, worker, email, onChange]);

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
        label="Email"
        value={email}
        onChangeText={setEmail}
        floatOnFocus
        showCharCounter
        maxLength={128}
        fieldStyle={sharedStyles.withUnderline}
        hint="example@example.com"
        placeholder="example@example.com"
        keyboardType="email-address"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...poolFieldProps}
      />
    </>
  );
};
