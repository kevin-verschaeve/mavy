import { getTursoClient } from '../config/turso';

export const actionFieldService = {
  // Récupérer tous les champs d'une action
  async getByAction(actionId) {
    const db = getTursoClient();
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM action_fields WHERE action_id = ? ORDER BY display_order',
        args: [actionId]
      });
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des champs:', error);
      throw error;
    }
  },

  // Créer un nouveau champ
  async create(actionId, fieldName, fieldType = 'text', displayOrder = 0) {
    const db = getTursoClient();
    try {
      const result = await db.execute({
        sql: 'INSERT INTO action_fields (action_id, field_name, field_type, display_order) VALUES (?, ?, ?, ?)',
        args: [actionId, fieldName, fieldType, displayOrder]
      });
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Erreur lors de la création du champ:', error);
      throw error;
    }
  },

  // Mettre à jour un champ
  async update(id, fieldName, fieldType) {
    const db = getTursoClient();
    try {
      await db.execute({
        sql: 'UPDATE action_fields SET field_name = ?, field_type = ? WHERE id = ?',
        args: [fieldName, fieldType, id]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du champ:', error);
      throw error;
    }
  },

  // Supprimer un champ
  async delete(id) {
    const db = getTursoClient();
    try {
      await db.execute({
        sql: 'DELETE FROM action_fields WHERE id = ?',
        args: [id]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du champ:', error);
      throw error;
    }
  },

  // Supprimer tous les champs d'une action
  async deleteByAction(actionId) {
    const db = getTursoClient();
    try {
      await db.execute({
        sql: 'DELETE FROM action_fields WHERE action_id = ?',
        args: [actionId]
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des champs:', error);
      throw error;
    }
  }
};
