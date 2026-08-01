import { getTursoClient } from '../config/turso';
import { getCurrentUserId } from './userService';

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
      return result.lastInsertRowid;
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
  // consommé dès qu'une entrée atteint l'échéance. Sans effet sur les rappels périodiques.
  async consumeReminderDate(action) {
    if (!action?.reminder_date) return false;

    const [y, m, d] = action.reminder_date.split('-').map(Number);
    const dueDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today < dueDate) return false;

    await this.clearReminderDate(action.id);
    return true;
  },

  // Consommer un rappel à date fixe : one-shot, effacé dès qu'une entrée le satisfait
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
