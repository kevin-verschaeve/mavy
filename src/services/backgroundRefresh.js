/**
 * Rafraîchissement des rappels en arrière-plan.
 *
 * Les notifications sont planifiées localement à partir de la base Turso : sans
 * ce rafraîchissement, une entrée enregistrée depuis un autre appareil — ou une
 * échéance périodique qui glisse — ne serait prise en compte qu'à la prochaine
 * ouverture de l'app. La tâche recalcule et reprogramme le tout.
 *
 * L'OS décide seul du moment d'exécution (iOS est notoirement imprévisible) :
 * c'est un filet de sécurité, pas une garantie. La replanification à l'ouverture
 * de l'app reste le chemin principal.
 *
 * La définition de la tâche doit être enregistrée au chargement du module, hors
 * de tout composant React, pour être connue de l'OS au réveil de l'app.
 */
import { rescheduleAll } from './notificationService';

export const BACKGROUND_REFRESH_TASK = 'mavy-refresh-rappels';

/** Intervalle souhaité entre deux exécutions, en minutes (l'OS peut l'allonger). */
const REFRESH_INTERVAL_MINUTES = 60 * 12;

/**
 * `expo-task-manager` et `expo-background-task` demandent un build natif :
 * absents d'Expo Go, ils sont chargés paresseusement comme `expo-notifications`.
 */
let modules;
let modulesUnavailable = false;

function getModules() {
  if (modulesUnavailable) return null;
  if (!modules) {
    try {
      modules = {
        TaskManager: require('expo-task-manager'),
        BackgroundTask: require('expo-background-task'),
      };
    } catch (error) {
      console.warn('Tâche de fond indisponible : rappels rafraîchis à l\'ouverture seulement', error);
      modulesUnavailable = true;
      return null;
    }
  }
  return modules;
}

// Enregistrement de la tâche au chargement du module : l'OS doit la connaître
// avant tout réveil de l'app, donc pas dans un `useEffect`.
const available = getModules();
if (available && !available.TaskManager.isTaskDefined(BACKGROUND_REFRESH_TASK)) {
  available.TaskManager.defineTask(BACKGROUND_REFRESH_TASK, async () => {
    try {
      await rescheduleAll();
      return available.BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.warn('Rafraîchissement en arrière-plan échoué', error);
      return available.BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/**
 * Déclare la tâche auprès de l'OS. Sans effet si elle est déjà enregistrée,
 * si les modules natifs manquent, ou si l'utilisateur a désactivé le
 * rafraîchissement en arrière-plan dans les réglages système.
 */
export async function registerBackgroundRefresh() {
  const loaded = getModules();
  if (!loaded) return false;

  const { TaskManager, BackgroundTask } = loaded;

  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      return false;
    }

    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_REFRESH_TASK)) {
      return true;
    }

    await BackgroundTask.registerTaskAsync(BACKGROUND_REFRESH_TASK, {
      minimumInterval: REFRESH_INTERVAL_MINUTES,
    });
    return true;
  } catch (error) {
    console.warn('Enregistrement de la tâche de fond impossible', error);
    return false;
  }
}
