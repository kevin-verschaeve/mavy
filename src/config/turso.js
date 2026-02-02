import { createClient } from '@libsql/client/web';

// Configuration Turso (utilise HTTPS pour compatibilité React Native)
export const tursoConfig = {
  url: process.env.EXPO_PUBLIC_TURSO_DATABASE_URL,
  authToken: process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN,
};

// Client Turso
let client = null;

export const getTursoClient = () => {
  if (!client) {
    client = createClient(tursoConfig);
  }
  return client;
};

// Initialiser la base de données avec les tables nécessaires
export const initDatabase = async () => {
  const db = getTursoClient();

  try {
    // Supprimer les anciennes tables si elles existent
    await db.execute('DROP TABLE IF EXISTS entries');
    await db.execute('DROP TABLE IF EXISTS actions');
    await db.execute('DROP TABLE IF EXISTS action_fields');
    await db.execute('DROP TABLE IF EXISTS categories');

    // Table des catégories
    await db.execute(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        created_at DATE DEFAULT (DATE('now'))
      )
    `);

    // Table des actions
    await db.execute(`
      CREATE TABLE actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        is_configurable INTEGER DEFAULT 0,
        created_at DATE DEFAULT (DATE('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Table des champs d'action (pour les actions configurables)
    await db.execute(`
      CREATE TABLE action_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_id INTEGER NOT NULL,
        field_name TEXT NOT NULL,
        field_type TEXT DEFAULT 'text',
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE
      )
    `);

    // Table des entrées (logs) - uniquement la date
    await db.execute(`
      CREATE TABLE entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_id INTEGER NOT NULL,
        notes TEXT,
        field_values TEXT,
        created_at DATE DEFAULT (DATE('now')),
        FOREIGN KEY (action_id) REFERENCES actions(id)
      )
    `);

    console.log('✅ Base de données initialisée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    return false;
  }
};
