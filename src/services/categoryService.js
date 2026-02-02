import { getTursoClient } from '../config/turso';

export const categoryService = {
  // Récupérer toutes les catégories
  async getAll() {
    const db = getTursoClient();
    try {
      const result = await db.execute('SELECT * FROM categories ORDER BY name');
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  },

  // Créer une nouvelle catégorie
  async create(name, icon = '📌', color = '#3b82f6') {
    const db = getTursoClient();
    try {
      const result = await db.execute({
        sql: 'INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)',
        args: [name, icon, color]
      });
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw error;
    }
  },

  // Mettre à jour une catégorie
  async update(id, name) {
    const db = getTursoClient();
    try {
      await db.execute({
        sql: 'UPDATE categories SET name = ? WHERE id = ?',
        args: [name, id]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      throw error;
    }
  },

  // Supprimer une catégorie
  async delete(id) {
    const db = getTursoClient();
    try {
      await db.execute({
        sql: 'DELETE FROM categories WHERE id = ?',
        args: [id]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      throw error;
    }
  }
};
