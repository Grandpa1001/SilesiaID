import Database from "better-sqlite3";

const DB_PATH = process.env.DATABASE_URL || "./silesia.db";
export const db = new Database(DB_PATH);

function runMigrations() {
  const migrations: { name: string; sql: string }[] = [
    {
      name: "add_user_wallet",
      sql: "ALTER TABLE certs ADD COLUMN user_wallet TEXT",
    },
    {
      name: "add_revoked",
      sql: "ALTER TABLE certs ADD COLUMN revoked INTEGER NOT NULL DEFAULT 0",
    },
  ];
  for (const m of migrations) {
    const done = db.prepare("SELECT name FROM _migrations WHERE name = ?").get(m.name);
    if (!done) {
      try {
        db.exec(m.sql);
      } catch {
        // column already exists
      }
      db.prepare("INSERT OR IGNORE INTO _migrations (name) VALUES (?)").run(m.name);
    }
  }
}

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS certs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_id      TEXT UNIQUE NOT NULL,
      nip          TEXT NOT NULL,
      user_wallet  TEXT,
      tx_hash      TEXT,
      trust_level  INTEGER NOT NULL DEFAULT 1,
      company_name TEXT,
      company_status TEXT,
      revoked      INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- migrations for existing db
    CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY);


    CREATE TABLE IF NOT EXISTS verify_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_id     TEXT NOT NULL,
      verifier    TEXT,
      verified_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  runMigrations();
  console.log("DB initialized");
}
