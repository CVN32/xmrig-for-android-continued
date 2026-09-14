import React from 'react';
import { Colors, Incubator } from 'react-native-ui-lib';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToasterContextProps = {
  addToast: (props: Incubator.ToastProps) => void;
};

export const ToasterContext = React.createContext<ToasterContextProps>({
  addToast: () => {},
});

/** Approximate TabController.TabBar height; toast sits 8px above it + safe area. */
const TAB_BAR_HEIGHT = 56;
const TOAST_GAP = 8;

export const ToasterProvider: React.FC = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = React.useState<Incubator.ToastProps | null>(null);
  const [visible, setVisible] = React.useState(false);

  const clearToast = React.useCallback(() => {
    setVisible(false);
    setToast(null);
  }, []);

  const addToast = React.useCallback((props: Incubator.ToastProps) => {
    const isError = props.preset === Incubator.ToastPresets.FAILURE;
    // Replace queue — only one toast at a time
    setToast({
      ...props,
      position: 'bottom',
      // Normal: auto-dismiss ~2500ms; errors stay until dismissed
      autoDismiss: isError ? undefined : (props.autoDismiss ?? 2500),
      swipeable: true,
      onDismiss: () => {
        clearToast();
        if (props.onDismiss) {
          props.onDismiss();
        }
      },
      style: [
        {
          marginBottom: TAB_BAR_HEIGHT + insets.bottom + TOAST_GAP,
          borderWidth: 2,
          borderColor: Colors.$outlineNeutral,
        },
        props.style as object,
      ],
    });
    // Fix prior visible:false bug — toast must become visible when rendered
    setVisible(true);
  }, [clearToast, insets.bottom]);

  return (
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    <ToasterContext.Provider value={{ addToast }}>
      <>
        {children}
        {toast != null && (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <Incubator.Toast {...toast} visible={visible} />
        )}
      </>
    </ToasterContext.Provider>
  );
};
