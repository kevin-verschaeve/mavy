import { getTursoClient } from '../config/turso';
import { getCurrentUserId } from './userService';

export const entryService = {
  // Créer une nouvelle entrée (quand on clique sur un bouton d'action).
  // `createdAt` (format `YYYY-MM-DD`) permet d'antidater une action faite hier :
  // absent, la base applique son défaut `DATE('now')`.
  async create(actionId, notes = '', fieldValues = null, createdAt = null) {
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
      const result = createdAt
        ? await db.execute({
            sql: 'INSERT INTO entries (action_id, notes, field_values, created_at) VALUES (?, ?, ?, ?)',
            args: [actionId, notes, fieldValuesJson, createdAt]
          })
        : await db.execute({
            sql: 'INSERT INTO entries (action_id, notes, field_values) VALUES (?, ?, ?)',
            args: [actionId, notes, fieldValuesJson]
          });
      // libsql renvoie un BigInt : non sérialisable dans les params de navigation
      return Number(result.lastInsertRowid);
    } catch (error) {
      console.error('Erreur lors de la création de l\'entrée:', error);
      throw error;
    }
  },

  // Récupérer une page d'entrées d'une action, de la plus récente à la plus
  // ancienne. Une action tenue depuis des années accumule des centaines de
  // lignes : l'écran d'historique les charge par paquets (scroll infini) plutôt
  // que de tout rapatrier à chaque ouverture.
  // `id` départage les entrées de même date, sinon leur ordre relatif varie d'une
  // page à l'autre et une entrée peut être sautée ou dupliquée à la jointure.
  async getByAction(actionId, { limit = 30, offset = 0 } = {}) {
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
            a.is_configurable,
            c.name as category_name,
            c.icon as category_icon
          FROM entries e
          JOIN actions a ON e.action_id = a.id
          JOIN categories c ON a.category_id = c.id
          WHERE e.action_id = ? AND c.user_id = ?
          ORDER BY e.created_at DESC, e.id DESC
          LIMIT ? OFFSET ?
        `,
        args: [actionId, userId, limit, offset]
      });
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des entrées:', error);
      throw error;
    }
  },

  // Nombre total d'entrées d'une action : l'écran d'historique n'en charge
  // qu'une page, mais affiche le total dans son en-tête.
  async countByAction(actionId) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const result = await db.execute({
        sql: `
          SELECT COUNT(*) AS total
          FROM entries e
          JOIN actions a ON e.action_id = a.id
          JOIN categories c ON a.category_id = c.id
          WHERE e.action_id = ? AND c.user_id = ?
        `,
        args: [actionId, userId]
      });
      return Number(result.rows[0]?.total ?? 0);
    } catch (error) {
      console.error('Erreur lors du comptage des entrées:', error);
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

  // Récupérer, en une seule requête, la dernière entrée de chaque action d'une
  // catégorie. Remplace la boucle `getLastEntry` par action : chaque appel étant
  // un aller-retour réseau vers Turso, une catégorie de 15 actions coûtait 15
  // latences en série au lieu d'une.
  // Retourne un objet indexé par `action_id`, dans la forme attendue par les
  // cartes : `{ [actionId]: { created_at } | null }`.
  async getLastEntriesByCategory(categoryId) {
    const db = getTursoClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      throw new Error('Aucun utilisateur sélectionné');
    }

    try {
      const result = await db.execute({
        sql: `
          SELECT
            a.id AS action_id,
            MAX(e.created_at) AS created_at
          FROM actions a
          JOIN categories c ON a.category_id = c.id
          LEFT JOIN entries e ON e.action_id = a.id
          WHERE a.category_id = ? AND c.user_id = ?
          GROUP BY a.id
        `,
        args: [categoryId, userId]
      });

      const byAction = {};
      for (const row of result.rows) {
        // `LEFT JOIN` : une action sans entrée remonte avec `created_at` à NULL
        byAction[row.action_id] = row.created_at ? { created_at: row.created_at } : null;
      }
      return byAction;
    } catch (error) {
      console.error('Erreur lors de la récupération des dernières entrées:', error);
      throw error;
    }
  }
};
