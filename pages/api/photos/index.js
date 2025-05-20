import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getDb } from '../../../lib/db';
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
  if (req.method === 'GET') {
    try {
      const db = await getDb();
      
      // Ensure the likes table exists
      await db.exec(`
        CREATE TABLE IF NOT EXISTS photo_likes (
          photo_id TEXT NOT NULL,
          likes_count INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (photo_id)
        );
      `);
      
      // Get all photos with like counts
      const photos = await db.all(`
        SELECT p.id, p.filename, p.originalname, p.name, p.caption, 
               p.upload_group, p.uploaded_at, p.is_video,
               COALESCE(l.likes_count, 0) as likes_count
        FROM photos p
        LEFT JOIN photo_likes l ON p.id = l.photo_id
        ORDER BY p.uploaded_at DESC
      `);
      
      // Process photos to include full URLs
      const processedPhotos = photos.map(photo => ({
        ...photo,
        url: `/uploads/${photo.filename}`
      }));
      
      // Group photos by upload group
      const photoGroups = groupPhotosByUploadGroup(processedPhotos);
      
      // Calculate total likes for each group
      const groupsWithLikes = photoGroups.map(group => {
        const totalLikes = group.photos.reduce((sum, photo) => sum + (photo.likes_count || 0), 0);
        return {
          ...group,
          total_likes: totalLikes
        };
      });
      
      res.status(200).json(groupsWithLikes);
    } catch (error) {
      console.error('Error fetching photos:', error);
      res.status(500).json({ error: 'Failed to fetch photos' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}