import sqlite3 from 'sqlite3';
import path from 'path';
import { open } from 'sqlite';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'wedding.db');

/**
 * Initialize and open a connection to the SQLite database
 * @returns {Promise<sqlite.Database>} Database connection
 */
export async function initDb() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Open the database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Check if tables exist and what columns they have
    const tableInfo = await db.all("PRAGMA table_info(photos)").catch(() => []);
    const hasIsVideoColumn = tableInfo.some(column => column.name === 'is_video');
    
    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        originalname TEXT,
        name TEXT,
        caption TEXT,
        upload_group TEXT,
        uploaded_at TEXT,
        is_video INTEGER DEFAULT 0
      );
    `);
    
    // Only add is_video column if it doesn't exist
    if (tableInfo.length > 0 && !hasIsVideoColumn) {
      await db.exec(`ALTER TABLE photos ADD COLUMN is_video INTEGER DEFAULT 0;`);
      console.log('Added is_video column to photos table');
    }
    
    // Create likes table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS photo_likes (
        photo_id TEXT NOT NULL,
        likes_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (photo_id)
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
