import { getTursoClient } from '../config/turso';
import { getCurrentUserId } from './userService';
import { entrySatisfiesReminderDate } from '../utils/dateUtils';

export const actionService = {
  // Récupérer toutes les actions d'une catégorie (filtrées par user_id via la catégorie)
  async getByCategory(categoryId) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const result = await db.execute({
        sql: `
          SELECT a.* FROM actions a
          JOIN categories c ON a.category_id = c.id
          WHERE a.category_id = ? AND c.user_id = ?
          ORDER BY a.name
        `,
        args: [categoryId, userId]
      });
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des actions:', error);
      throw error;
    }
  },

  // Créer une nouvelle action (la catégorie doit appartenir à l'utilisateur)
  async create(categoryId, name, isConfigurable = false, reminderIntervalDays = null, reminderWarnDays = null, reminderDate = null) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      // Vérifier que la catégorie appartient à l'utilisateur
      const categoryCheck = await db.execute({
        sql: 'SELECT id FROM categories WHERE id = ? AND user_id = ?',
        args: [categoryId, userId]
      });

      if (categoryCheck.rows.length === 0) {
        throw new Error('Catégorie non trouvée ou accès non autorisé');
      }

      // Les deux modes de rappel sont exclusifs : une date fixe annule l'intervalle
      const intervalDays = reminderDate ? null : reminderIntervalDays;

      const result = await db.execute({
        sql: 'INSERT INTO actions (category_id, name, is_configurable, reminder_interval_days, reminder_warn_days, reminder_date) VALUES (?, ?, ?, ?, ?, ?)',
        args: [categoryId, name, isConfigurable ? 1 : 0, intervalDays, reminderWarnDays, reminderDate]
      });
      // libsql renvoie un BigInt : non sérialisable dans les params de navigation
      return Number(result.lastInsertRowid);
    } catch (error) {
      console.error('Erreur lors de la création de l\'action:', error);
      throw error;
    }
  },

  // Récupérer une action par ID (filtrée par user_id)
  async getById(id) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const result = await db.execute({
        sql: `
          SELECT a.* FROM actions a
          JOIN categories c ON a.category_id = c.id
          WHERE a.id = ? AND c.user_id = ?
        `,
        args: [id, userId]
      });
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'action:', error);
      throw error;
    }
  },

  // Mettre à jour une action (seulement si elle appartient à l'utilisateur via sa catégorie)
  async update(id, name) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      await db.execute({
        sql: `
          UPDATE actions
          SET name = ?
          WHERE id = ? AND category_id IN (
            SELECT id FROM categories WHERE user_id = ?
          )
        `,
        args: [name, id, userId]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'action:', error);
      throw error;
    }
  },

  // Mettre à jour le rappel d'une action (périodique ou date fixe, jamais les deux)
  async updateReminder(id, intervalDays, warnDays, reminderDate = null) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      // Les deux modes de rappel sont exclusifs : une date fixe annule l'intervalle
      const finalIntervalDays = reminderDate ? null : intervalDays;

      await db.execute({
        sql: `
          UPDATE actions
          SET reminder_interval_days = ?, reminder_warn_days = ?, reminder_date = ?
          WHERE id = ? AND category_id IN (
            SELECT id FROM categories WHERE user_id = ?
          )
        `,
        args: [finalIntervalDays, warnDays, reminderDate, id, userId]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rappel:', error);
      throw error;
    }
  },

  // À appeler après chaque nouvelle entrée : un rappel à date fixe est un one-shot,
  // consommé dès qu'une entrée tombe dans la fenêtre d'alerte (faire l'action en
  // avance doit éteindre le rappel). Sans effet sur les rappels périodiques.
  async consumeReminderDate(action, entryDate = new Date()) {
    if (!action?.reminder_date) return false;

    if (!entrySatisfiesReminderDate(action.reminder_date, entryDate, action.reminder_warn_days)) {
      return false;
    }

    await this.clearReminderDate(action.id);
    return true;
  },

  // Consommer un rappel à date fixe : one-shot, effacé dès qu'une entrée le satisfait.
  // L'effacement est définitif : `reminder_date` est mis à NULL, donc ramener plus tard
  // une entrée à une date antérieure ne ressuscite pas le rappel. Choix assumé — le
  // rendre réversible demanderait de conserver la date et d'ajouter un flag `consumed`.
  async clearReminderDate(id) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      await db.execute({
        sql: `
          UPDATE actions
          SET reminder_date = NULL, reminder_warn_days = NULL
          WHERE id = ? AND category_id IN (
            SELECT id FROM categories WHERE user_id = ?
          )
        `,
        args: [id, userId]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du rappel à date fixe:', error);
      throw error;
    }
  },

  // Supprimer une action (seulement si elle appartient à l'utilisateur via sa catégorie)
  async delete(id) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      await db.execute({
        sql: `
          DELETE FROM actions
          WHERE id = ? AND category_id IN (
            SELECT id FROM categories WHERE user_id = ?
          )
        `,
        args: [id, userId]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'action:', error);
      throw error;
    }
  }
};
