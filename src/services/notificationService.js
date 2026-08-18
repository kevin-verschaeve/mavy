/**
 * Notifications locales de rappel.
 *
 * Deux notifications par action à rappel : une à l'entrée dans la fenêtre
 * d'alerte (« bientôt »), une le jour de l'échéance (« c'est aujourd'hui »).
 * Rien n'est envoyé depuis un serveur : tout est planifié localement, donc
 * replanifié intégralement à chaque ouverture de l'app et par la tâche de fond.
 *
 * Les notifications locales ne fonctionnent plus dans Expo Go sur Android depuis
 * le SDK 53 : le module est chargé en `require` paresseux et toutes les fonctions
 * se dégradent en no-op silencieux si l'import échoue (cf. `getModule`).
 */
import { Platform } from 'react-native';
import { actionService } from './actionService';
import { computeDueDate, formatDayCount, MS_PER_DAY } from '../utils/dateUtils';

/** Heure d'envoi des rappels, en heure locale. 9h : le matin, pas la nuit. */
export const NOTIFICATION_HOUR = 9;

/** Identifiant du canal Android. */
const ANDROID_CHANNEL_ID = 'rappels';

/**
 * Plafond de notifications programmées simultanément.
 * iOS n'en garde que 64 et supprime les autres sans prévenir : on s'aligne sur
 * cette limite pour garder la main sur ce qui est conservé (les plus proches).
 */
const MAX_SCHEDULED_NOTIFICATIONS = 64;

/**
 * `expo-notifications` est absent d'Expo Go (Android) et peut manquer d'un build
 * natif à jour. On l'importe paresseusement pour que l'app démarre quand même.
 */
let notificationsModule;
let moduleUnavailable = false;

function getModule() {
  if (moduleUnavailable) return null;
  if (!notificationsModule) {
    try {
      notificationsModule = require('expo-notifications');
    } catch (error) {
      console.warn('expo-notifications indisponible : rappels désactivés', error);
      moduleUnavailable = true;
      return null;
    }
  }
  return notificationsModule;
}

/**
 * Affiche les notifications même quand l'app est au premier plan.
 * À appeler une fois au démarrage, avant toute planification.
 */
export function configureNotificationHandler() {
  const Notifications = getModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Demande la permission d'envoyer des notifications, et crée le canal Android.
 * @returns {Promise<boolean>} - `true` si les notifications sont utilisables
 */
export async function ensurePermissions() {
  const Notifications = getModule();
  if (!Notifications) return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Rappels',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: null,
      });
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;

    // `getPermissionsAsync` renvoie `denied` après un refus définitif : redemander
    // n'ouvrirait aucune boîte de dialogue, autant ne pas insister.
    if (status === 'denied') return false;

    const { status: requested } = await Notifications.requestPermissionsAsync();
    return requested === 'granted';
  } catch (error) {
    console.warn('Permissions de notification indisponibles', error);
    return false;
  }
}

/**
 * Construit le titre et le corps d'une notification.
 * @param {object} action - La ligne renvoyée par `getAllWithReminders`
 * @param {boolean} isDue - `true` pour la notif du jour de l'échéance
 * @param {number} daysUntilDue - Jours restants avant l'échéance
 */
function buildContent(action, isDue, daysUntilDue) {
  const category = action.category_name ? ` · ${action.category_name}` : '';

  let body;
  if (daysUntilDue < 0) {
    body = `En retard de ${formatDayCount(-daysUntilDue)}${category}`;
  } else if (isDue) {
    body = `C'est aujourd'hui${category}`;
  } else {
    body = `Dans ${formatDayCount(daysUntilDue)}${category}`;
  }

  return {
    title: action.name,
    body,
    // `categoryName` est embarqué : l'écran Catégorie le lit dans ses params,
    // ce qui évite une requête au moment du tap sur la notification.
    data: {
      actionId: Number(action.id),
      categoryId: Number(action.category_id),
      categoryName: action.category_name,
    },
    ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
  };
}

/**
 * Renvoie la `Date` d'envoi (à `NOTIFICATION_HOUR`) pour un jour donné,
 * ou `null` si cet instant est déjà passé — on ne planifie pas dans le passé.
 * @param {Date} day - Le jour d'envoi, à minuit local
 * @param {Date} now - L'instant courant
 */
function scheduleInstant(day, now) {
  const at = new Date(day);
  at.setHours(NOTIFICATION_HOUR, 0, 0, 0);
  return at > now ? at : null;
}

/**
 * Prochain passage à `NOTIFICATION_HOUR` : aujourd'hui s'il est encore à venir,
 * sinon demain. Sert aux actions déjà en retard, dont toutes les dates de
 * déclenchement sont dans le passé — sans ça, l'utilisateur le plus concerné
 * serait précisément celui qu'on ne préviendrait jamais.
 * @param {Date} now - L'instant courant
 */
function nextSendInstant(now) {
  const at = new Date(now);
  at.setHours(NOTIFICATION_HOUR, 0, 0, 0);
  if (at <= now) {
    at.setDate(at.getDate() + 1);
  }
  return at;
}

/**
 * Calcule les notifications à programmer pour une liste d'actions.
 * Fonction pure : sortie testable sans toucher au module natif.
 * @param {Array<object>} actions - Lignes de `getAllWithReminders`
 * @param {Date} now - L'instant courant
 * @returns {Array<{content: object, date: Date}>}
 */
export function planNotifications(actions, now = new Date()) {
  const planned = [];

  for (const action of actions) {
    const due = computeDueDate(action, action.last_entry_at);
    if (!due) continue;

    const daysUntilDue = Math.round(
      (due.dueDate - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / MS_PER_DAY
    );

    // Action déjà en retard : les deux dates de déclenchement sont passées.
    // Un unique rappel de rattrapage au prochain créneau, sans quoi une action
    // oubliée resterait silencieuse pour toujours.
    if (daysUntilDue < 0) {
      planned.push({
        content: buildContent(action, false, daysUntilDue),
        date: nextSendInstant(now),
      });
      continue;
    }

    // Entrée dans la fenêtre d'alerte : « pensez-y, ça arrive »
    const warnAt = scheduleInstant(due.warnDate, now);
    if (warnAt) {
      planned.push({
        content: buildContent(action, false, due.warnDays),
        date: warnAt,
      });
    }

    // Jour de l'échéance : « c'est aujourd'hui »
    const dueAt = scheduleInstant(due.dueDate, now);
    if (dueAt) {
      planned.push({
        content: buildContent(action, true, daysUntilDue),
        date: dueAt,
      });
    }
  }

  // iOS ne conserve que les 64 notifications programmées les plus proches et
  // jette silencieusement le reste. On trie donc par date et on tronque nous-mêmes :
  // ce qui est coupé est de toute façon lointain, et sera reprogrammé bien avant
  // son échéance (à la prochaine ouverture ou par la tâche de fond).
  return planned
    .sort((a, b) => a.date - b.date)
    .slice(0, MAX_SCHEDULED_NOTIFICATIONS);
}

/**
 * Recalcule toutes les échéances et reprogramme l'intégralité des notifications.
 *
 * On efface tout avant de replanifier : c'est le seul moyen fiable de refléter
 * une action supprimée, un rappel modifié ou une entrée enregistrée depuis un
 * autre appareil. Les notifications déjà délivrées ne sont pas touchées.
 *
 * @returns {Promise<number>} - Le nombre de notifications programmées
 */
export async function rescheduleAll() {
  const Notifications = getModule();
  if (!Notifications) return 0;

  const granted = await ensurePermissions();
  if (!granted) return 0;

  try {
    const actions = await actionService.getAllWithReminders();
    const planned = planNotifications(actions);

    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const { content, date } of planned) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
    }

    return planned.length;
  } catch (error) {
    // Un échec de replanification ne doit jamais empêcher l'app de démarrer
    console.warn('Replanification des rappels impossible', error);
    return 0;
  }
}

/** Annule toutes les notifications programmées (changement de profil, par ex.). */
export async function cancelAll() {
  const Notifications = getModule();
  if (!Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Annulation des rappels impossible', error);
  }
}
