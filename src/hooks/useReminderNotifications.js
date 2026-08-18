/**
 * Maintient les notifications de rappel à jour.
 *
 * Les notifications locales sont planifiées à partir de la base : elles se
 * périment dès qu'une entrée est enregistrée ou qu'un rappel change. On
 * replanifie donc à chaque retour au premier plan, en complément de la tâche
 * de fond (`backgroundRefresh`), qui couvre les longues périodes sans ouverture.
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
  cancelAll,
  configureNotificationHandler,
  rescheduleAll,
} from '../services/notificationService';
import { registerBackgroundRefresh } from '../services/backgroundRefresh';

configureNotificationHandler();

/**
 * @param {number|null} userId - Le profil courant ; les rappels lui sont propres
 */
export function useReminderNotifications(userId) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Retour à l'écran de sélection : les rappels du profil quitté ne doivent
    // pas continuer à sonner sur celui qui suit.
    if (!userId) {
      cancelAll().catch(() => {});
      return;
    }

    let cancelled = false;

    const sync = () => {
      // Pas de `await` : la planification ne doit jamais retarder l'affichage
      rescheduleAll().catch(() => {});
    };

    sync();
    registerBackgroundRefresh().catch(() => {});

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = nextState;

      // Une entrée a pu être enregistrée ailleurs pendant l'absence
      if (wasBackground && nextState === 'active' && !cancelled) {
        sync();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [userId]);
}
