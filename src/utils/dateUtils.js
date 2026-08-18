/**
 * Utilitaires de formatage de dates
 */

/**
 * Convertit une Date en chaîne `YYYY-MM-DD` dans le fuseau **local**.
 * Ne pas utiliser `toISOString()` ici : il convertit en UTC et décale la date
 * d'un jour pour tout ce qui est saisi le soir en France (UTC+1/+2).
 * @param {Date} date - La date à convertir
 * @returns {string} - La date au format `YYYY-MM-DD`
 */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse une chaîne `YYYY-MM-DD` en Date à minuit dans le fuseau **local**.
 * `new Date('2026-03-15')` serait interprété en UTC : on décompose à la main.
 * @param {string} dateString - La date au format `YYYY-MM-DD`
 * @returns {Date} - La date à minuit local
 */
export function parseISODate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Fenêtre d'alerte par défaut, en jours, quand l'action n'en définit pas. */
export const DEFAULT_WARN_DAYS = 30;

/**
 * Un rappel à date fixe est satisfait dès qu'une entrée tombe dans sa fenêtre
 * d'alerte : faire son contrôle technique deux semaines en avance doit éteindre
 * le rappel, pas le laisser en « warning » jusqu'à l'échéance théorique.
 * @param {string} reminderDate - L'échéance au format `YYYY-MM-DD`
 * @param {string|Date} entryDate - La date de l'entrée
 * @param {number|string|null} warnDays - La fenêtre d'alerte de l'action
 * @returns {boolean} - `true` si l'entrée consomme le rappel
 */
export function entrySatisfiesReminderDate(reminderDate, entryDate, warnDays) {
  if (!reminderDate || !entryDate) return false;

  const dueDate = parseISODate(reminderDate);
  const windowStart = new Date(dueDate);
  windowStart.setDate(windowStart.getDate() - (warnDays ? Number(warnDays) : DEFAULT_WARN_DAYS));

  // `created_at` peut être une date seule (`YYYY-MM-DD`) : `new Date()` la lirait
  // en UTC et la décalerait d'un jour. On repasse par le parseur local.
  const entry = typeof entryDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entryDate)
    ? parseISODate(entryDate)
    : new Date(entryDate);
  entry.setHours(0, 0, 0, 0);

  return entry >= windowStart;
}

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
 * Formate une date en format court (ex: "15/01/2024")
 * @param {string|Date} dateString - La date à formater
 * @returns {string} - La date formatée
 */
export function formatShortDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
}
