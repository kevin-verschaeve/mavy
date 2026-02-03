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
