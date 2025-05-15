import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Define consistent paths
const dbPath = path.join(process.cwd(), 'data', 'wedding.db');

// Initialize database function
async function initDatabase() {
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Check if is_video column exists
  const tableInfo = await db.all("PRAGMA table_info(photos)");
  const hasIsVideoColumn = tableInfo.some(column => column.name === 'is_video');
  
  // Create photos table if it doesn't exist with upload_group column
  await db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      originalname TEXT NOT NULL,
      name TEXT NOT NULL,
      caption TEXT,
      upload_group TEXT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_video INTEGER DEFAULT 0
    )
  `);
  
  // Add is_video column if it doesn't exist
  if (!hasIsVideoColumn) {
    await db.exec(`ALTER TABLE photos ADD COLUMN is_video INTEGER DEFAULT 0;`);
    console.log('Added is_video column to photos table');
  }
  
  return db;
}

export default async function handler(req, res) {
  const { groupId } = req.query;
  
  if (!groupId) {
    return res.status(400).json({ error: 'Group ID is required' });
  }
  
  if (req.method === 'GET') {
    try {
      const db = await initDatabase();
      
      // Get all photos in this group
      const photos = await db.all(`
        SELECT id, filename, originalname, name, caption, upload_group, uploaded_at, is_video
        FROM photos
        WHERE upload_group = ?
        ORDER BY uploaded_at DESC
      `, [groupId]);
      
      // Process photos to include full URLs
      const processedPhotos = photos.map(photo => ({
        ...photo,
        url: `/uploads/${photo.filename}`
      }));
      
      res.status(200).json(processedPhotos);
    } catch (error) {
      console.error('Error fetching group photos:', error);
      res.status(500).json({ error: 'Failed to fetch group photos' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}