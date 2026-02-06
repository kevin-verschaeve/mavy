CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at DATE DEFAULT (DATE('now'))
);

CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_configurable INTEGER DEFAULT 0,
    created_at DATE DEFAULT (DATE('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS action_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    field_type TEXT DEFAULT 'text',
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL,
    notes TEXT,
    field_values TEXT,
    created_at DATE DEFAULT (DATE('now')),
    FOREIGN KEY (action_id) REFERENCES actions(id)
);
