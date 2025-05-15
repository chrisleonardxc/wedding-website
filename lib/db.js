import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Define the database path
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'wedding.db');

/**
 * Initialize and open a connection to the SQLite database
 * @returns {Promise<sqlite.Database>} Database connection
 */
export async function initDb() {
  try {
    // Open the database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        originalname TEXT,
        name TEXT,
        caption TEXT,
        upload_group TEXT,
        uploaded_at TEXT
      );
    `);
    
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Get a database connection
 * @returns {Promise<sqlite.Database>} Database connection
 */
export async function getDb() {
  return initDb();
}

/**
 * Close a database connection
 * @param {sqlite.Database} db - Database connection to close
 */
export async function closeDb(db) {
  if (db) {
    try {
      await db.close();
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}