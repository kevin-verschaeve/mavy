import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@mavy_user_id';

// Profils disponibles
export const USERS = {
  KEVIN: { id: 1, name: 'Kevin' },
  FANNY: { id: 2, name: 'Fanny' },
};

/**
 * Récupère l'ID de l'utilisateur actuellement sélectionné
 * @returns {Promise<number|null>} L'ID de l'utilisateur ou null si aucun profil n'est sélectionné
 */
export const getCurrentUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem(USER_KEY);
    return userId ? parseInt(userId, 10) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du user_id:', error);
    return null;
  }
};

/**
 * Définit l'utilisateur actuel
 * @param {number} userId - L'ID de l'utilisateur (1 pour Kevin, 2 pour Fanny)
 * @returns {Promise<boolean>} true si la sauvegarde a réussi
 */
export const setCurrentUserId = async (userId) => {
  try {
    await AsyncStorage.setItem(USER_KEY, userId.toString());
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du user_id:', error);
    return false;
  }
};

/**
 * Récupère les informations de l'utilisateur actuel
 * @returns {Promise<{id: number, name: string}|null>}
 */
export const getCurrentUser = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  return Object.values(USERS).find(user => user.id === userId) || null;
};

/**
 * Supprime le profil sélectionné (pour changer de profil)
 * @returns {Promise<boolean>}
 */
export const clearCurrentUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du user_id:', error);
    return false;
  }
};
