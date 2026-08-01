/**
 * Utilitaires de formatage de dates
 */

/**
 * Formate une date en texte relatif (Aujourd'hui, Hier, Il y a X jours, etc.)
 * @param {string|Date} dateString - La date à formater
 * @returns {string} - La date formatée en texte relatif
 */
export function formatRelativeDate(dateString) {
  if (!dateString) return 'Jamais';

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} ans`;
}

/**
 * Formate l'intervalle de temps entre deux dates (ex: "3 jours", "2 semaines")
 * @param {string|Date} dateString1 - Première date
 * @param {string|Date} dateString2 - Deuxième date
 * @returns {string} - L'intervalle formaté
 */
export function formatElapsedBetween(dateString1, dateString2) {
  const date1 = new Date(dateString1);
  const date2 = new Date(dateString2);
  const diffTime = Math.abs(date1 - date2);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Même jour';
  if (diffDays === 1) return '1 jour';
  if (diffDays < 7) return `${diffDays} jours`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 semaine' : `${weeks} semaines`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 mois' : `${months} mois`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 an' : `${years} ans`;
}

/**
 * Formate un nombre de jours en durée lisible (ex: "3 jours", "2 semaines", "1 an")
 * @param {number} days - Nombre de jours
 * @returns {string} - La durée formatée
 */
export function formatDayCount(days) {
  if (days < 1) return "aujourd'hui";
  if (days === 1) return '1 jour';
  if (days < 7) return `${days} jours`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? '1 semaine' : `${weeks} semaines`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? '1 mois' : `${months} mois`;
  }
  const years = days / 365;
  return years === 1 ? '1 an' : `${Number.isInteger(years) ? years : years.toFixed(1).replace('.0', '')} ans`;
}

/**
 * Formate une date en format lisible (ex: "15 janvier 2024")
 * @param {string|Date} dateString - La date à formater
 * @returns {string} - La date formatée
 */
export function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate une date en format court (ex: "15/01/2024")
 * @param {string|Date} dateString - La date à formater
 * @returns {string} - La date formatée
 */
export function formatShortDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
}

/**
 * Formate une date avec l'heure (ex: "15 janvier 2024 à 14:30")
 * @param {string|Date} dateString - La date à formater
 * @returns {string} - La date et l'heure formatées
 */
export function formatDateTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
