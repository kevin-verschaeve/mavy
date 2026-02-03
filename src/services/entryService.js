import { getTursoClient } from '../config/turso';
import { getCurrentUserId } from './userService';

export const entryService = {
  // Créer une nouvelle entrée (quand on clique sur un bouton d'action)
  async create(actionId, notes = '', fieldValues = null) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      // Vérifier que l'action appartient à l'utilisateur
      const actionCheck = await db.execute({
        sql: `
          SELECT a.id FROM actions a
          JOIN categories c ON a.category_id = c.id
          WHERE a.id = ? AND c.user_id = ?
        `,
        args: [actionId, userId]
      });

      if (actionCheck.rows.length === 0) {
        throw new Error('Action non trouvée ou accès non autorisé');
      }

      const fieldValuesJson = fieldValues ? JSON.stringify(fieldValues) : null;
      const result = await db.execute({
        sql: 'INSERT INTO entries (action_id, notes, field_values) VALUES (?, ?, ?)',
        args: [actionId, notes, fieldValuesJson]
      });
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Erreur lors de la création de l\'entrée:', error);
      throw error;
    }
  },

  // Récupérer toutes les entrées d'une action avec les détails
  async getByAction(actionId) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const result = await db.execute({
        sql: `
          SELECT
            e.id,
            e.notes,
            e.field_values,
            e.created_at,
            a.name as action_name,
            c.name as category_name,
            c.icon as category_icon
          FROM entries e
          JOIN actions a ON e.action_id = a.id
          JOIN categories c ON a.category_id = c.id
          WHERE e.action_id = ? AND c.user_id = ?
          ORDER BY e.created_at DESC
        `,
        args: [actionId, userId]
      });
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des entrées:', error);
      throw error;
    }
  },

  // Récupérer toutes les entrées récentes (toutes catégories confondues)
  async getRecent(limit = 50) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const result = await db.execute({
        sql: `
          SELECT
            e.id,
            e.notes,
            e.created_at,
            a.name as action_name,
            c.name as category_name,
            c.icon as category_icon,
            c.color as category_color
          FROM entries e
          JOIN actions a ON e.action_id = a.id
          JOIN categories c ON a.category_id = c.id
          WHERE c.user_id = ?
          ORDER BY e.created_at DESC
          LIMIT ?
        `,
        args: [userId, limit]
      });
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des entrées récentes:', error);
      throw error;
    }
  },

  // Mettre à jour une entrée (modification de la date)
  async update(id, newDate) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      // Convertir la date en format YYYY-MM-DD
      const dateOnly = newDate.split('T')[0];

      await db.execute({
        sql: `
          UPDATE entries
          SET created_at = ?
          WHERE id = ? AND action_id IN (
            SELECT a.id FROM actions a
            JOIN categories c ON a.category_id = c.id
            WHERE c.user_id = ?
          )
        `,
        args: [dateOnly, id, userId]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'entrée:', error);
      throw error;
    }
  },

  // Mettre à jour les valeurs des champs configurables d'une entrée
  async updateFieldValues(id, fieldValues) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const fieldValuesJson = fieldValues ? JSON.stringify(fieldValues) : null;
      await db.execute({
        sql: `
          UPDATE entries
          SET field_values = ?
          WHERE id = ? AND action_id IN (
            SELECT a.id FROM actions a
            JOIN categories c ON a.category_id = c.id
            WHERE c.user_id = ?
          )
        `,
        args: [fieldValuesJson, id, userId]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des champs:', error);
      throw error;
    }
  },

  // Supprimer une entrée
  async delete(id) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      await db.execute({
        sql: `
          DELETE FROM entries
          WHERE id = ? AND action_id IN (
            SELECT a.id FROM actions a
            JOIN categories c ON a.category_id = c.id
            WHERE c.user_id = ?
          )
        `,
        args: [id, userId]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'entrée:', error);
      throw error;
    }
  },

  // Récupérer la dernière entrée d'une action
  async getLastEntry(actionId) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const result = await db.execute({
        sql: `
          SELECT e.* FROM entries e
          JOIN actions a ON e.action_id = a.id
          JOIN categories c ON a.category_id = c.id
          WHERE e.action_id = ? AND c.user_id = ?
          ORDER BY e.created_at DESC
          LIMIT 1
        `,
        args: [actionId, userId]
      });
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la dernière entrée:', error);
      throw error;
    }
  }
};
