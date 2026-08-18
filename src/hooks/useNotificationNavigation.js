/**
 * Ouvre la bonne catégorie quand l'utilisateur tape une notification de rappel.
 *
 * Deux chemins à couvrir : l'app était déjà lancée (listener), ou elle a été
 * démarrée par le tap (dernière réponse enregistrée par le système).
 */
import { useEffect } from 'react';

/**
 * @param {object} navigationRef - La ref passée au `NavigationContainer`
 * @param {boolean} isReady - `true` quand la navigation est montée
 */
export function useNotificationNavigation(navigationRef, isReady) {
  useEffect(() => {
    if (!isReady) return;

    let Notifications;
    try {
      Notifications = require('expo-notifications');
    } catch {
      // Module absent (Expo Go) : le tap ouvre l'app sans navigation ciblée
      return;
    }

    let cancelled = false;

    const openCategory = (response) => {
      const data = response?.notification?.request?.content?.data;
      if (!data?.categoryId || !navigationRef.current) return;

      navigationRef.current.navigate('Category', {
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        colorIndex: 0,
      });
    };

    // Cas où le tap a démarré l'app à froid
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!cancelled && response) openCategory(response);
      })
      .catch(() => {});

    const subscription = Notifications.addNotificationResponseReceivedListener(openCategory);

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [navigationRef, isReady]);
}
