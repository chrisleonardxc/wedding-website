import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { groupPhotosByUploadGroup } from '../../../lib/galleryUtils';

// Define consistent paths
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'wedding.db');

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
  
  // Create photos table if it doesn't exist with upload_group column
  await db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      originalname TEXT NOT NULL,
      name TEXT NOT NULL,
      caption TEXT,
      upload_group TEXT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return db;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let db = null;
  
  try {
    db = await initDatabase();
    
    // Get all photos
    const photos = await db.all(`
      SELECT 
        id,
        filename,
        name,
        caption,
        upload_group,
        uploaded_at
      FROM photos
      ORDER BY uploaded_at DESC`);
      
    // Format the photos with URLs
    const formattedPhotos = photos.map(photo => ({
      id: photo.id,
      filename: photo.filename,
      url: `/uploads/${photo.filename}`,
      name: photo.name,
      caption: photo.caption,
      upload_group: photo.upload_group,
      uploaded_at: photo.uploaded_at
    }));

    // Group photos by upload_group using the utility function
    const photoGroups = groupPhotosByUploadGroup(formattedPhotos);
    
    // Log for debugging
    console.log(`Found ${photos.length} photos, grouped into ${photoGroups.length} groups`);
    
    res.status(200).json(photoGroups);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (db) {
      await db.close();
    }
  }
}