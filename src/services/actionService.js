import { getTursoClient } from '../config/turso';

export const actionService = {
  // Récupérer toutes les actions d'une catégorie
  async getByCategory(categoryId) {
    const db = getTursoClient();
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM actions WHERE category_id = ? ORDER BY name',
        args: [categoryId]
      });
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des actions:', error);
      throw error;
    }
  },

  // Créer une nouvelle action
  async create(categoryId, name, isConfigurable = false) {
    const db = getTursoClient();
    try {
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

  // Récupérer une action par ID
  async getById(id) {
    const db = getTursoClient();
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM actions WHERE id = ?',
        args: [id]
      });
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'action:', error);
      throw error;
    }
  },

  // Mettre à jour une action
  async update(id, name) {
    const db = getTursoClient();
    try {
      await db.execute({
        sql: 'UPDATE actions SET name = ? WHERE id = ?',
        args: [name, id]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'action:', error);
      throw error;
    }
  },

  // Supprimer une action
  async delete(id) {
    const db = getTursoClient();
    try {
      await db.execute({
        sql: 'DELETE FROM actions WHERE id = ?',
        args: [id]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'action:', error);
      throw error;
    }
  }
};
