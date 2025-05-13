import { open } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const dbPath =
  process.env.DB_PATH || path.join(process.cwd(), "data", "wedding.db");
const uploadDir = path.join(process.cwd(), "public", "uploads");

// Initialize database
async function initDb() {
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let db = null;

  try {
    console.log("API: Fetching photos from database");
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    db = await initDb();

    // Get all photos without grouping for now
    const photos = await db.all(`
      SELECT 
        id,
        filename,
        name,
        caption,
        upload_group,
        uploaded_at
      FROM photos
      ORDER BY uploaded_at DESC
    `);

    // Format the response
    const formattedPhotos = photos.map((photo) => ({
      id: photo.id,
      url: `/uploads/${photo.filename}`,
      name: photo.name,
      caption: photo.caption,
      upload_group: photo.upload_group,
      uploaded_at: photo.uploaded_at,
    }));

    console.log("API: Returning photos with URLs");
    res.status(200).json(formattedPhotos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return res.status(500).json({ error: "Failed to fetch photos" });
  } finally {
    if (db) {
      await db.close();
    }
  }
}