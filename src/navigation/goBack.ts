import { CommonActions } from '@react-navigation/native';

type BackNav = {
  canGoBack(): boolean;
  goBack(): void;
  dispatch(action: ReturnType<typeof CommonActions.reset>): void;
};

/**
 * Back that always works: when there is no screen underneath (the web app opened
 * on a deep link, or the tree was rebuilt after a language change) go to Home.
 */
export function goBackOrHome(navigation: BackNav): void {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));
}
