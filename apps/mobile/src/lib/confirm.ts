import { Alert, Platform } from 'react-native';

/**
 * Demande de confirmation avant une action sensible. Sur le web, `Alert.alert` n'affiche rien :
 * la boîte de dialogue native du navigateur est utilisée.
 */
export function confirmAction(options: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${options.title}\n\n${options.message}`) ?? false);
  }
  return new Promise((resolve) => {
    Alert.alert(
      options.title,
      options.message,
      [
        { text: options.cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: options.confirmLabel,
          style: options.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
