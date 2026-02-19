import { getTursoClient } from '../config/turso';
import { getCurrentUserId } from './userService';

export const categoryService = {
  // Récupérer toutes les catégories de l'utilisateur actuel
  async getAll() {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const result = await db.execute({
        sql: 'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
        args: [userId]
      });
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  },

  // Créer une nouvelle catégorie pour l'utilisateur actuel
  async create(name, icon = null, color = null) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const result = await db.execute({
        sql: 'INSERT INTO categories (user_id, name, icon, color) VALUES (?, ?, ?, ?)',
        args: [userId, name, icon, color]
      });
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw error;
    }
  },

  // Mettre à jour une catégorie (seulement si elle appartient à l'utilisateur)
  async update(id, name, icon = undefined) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      if (icon !== undefined) {
        await db.execute({
          sql: 'UPDATE categories SET name = ?, icon = ? WHERE id = ? AND user_id = ?',
          args: [name, icon, id, userId]
        });
      } else {
        await db.execute({
          sql: 'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?',
          args: [name, id, userId]
        });
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      throw error;
    }
  },

  // Supprimer une catégorie (seulement si elle appartient à l'utilisateur)
  async delete(id) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      await db.execute({
        sql: 'DELETE FROM categories WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      throw error;
    }
  }
};
