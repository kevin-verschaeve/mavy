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
  async create(categoryId, name, isConfigurable = false) {
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

      const result = await db.execute({
        sql: 'INSERT INTO actions (category_id, name, is_configurable) VALUES (?, ?, ?)',
        args: [categoryId, name, isConfigurable ? 1 : 0]
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
