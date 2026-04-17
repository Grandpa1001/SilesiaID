import Database from "better-sqlite3";

const DB_PATH = process.env.DATABASE_URL || "./silesia.db";
export const db = new Database(DB_PATH);

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS certs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_id      TEXT UNIQUE NOT NULL,
      nip          TEXT NOT NULL,
      tx_hash      TEXT,
      trust_level  INTEGER NOT NULL DEFAULT 1,
      company_name TEXT,
      company_status TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS verify_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_id     TEXT NOT NULL,
      verifier    TEXT,
      verified_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log("DB initialized");
}
