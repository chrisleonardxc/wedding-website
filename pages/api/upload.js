import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import { getDb, closeDb } from "../../lib/db";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "wedding.db");

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate a unique filename with original extension
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueId}${ext}`);
    },
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return new Promise((resolve, reject) => {
    upload.array('photos', 10)(req, res, async (err) => {
      let db;
      
      try {
        if (err) {
          console.error('Multer error:', err);
          res.status(400).json({ error: err.message });
          return resolve();
        }

        // Initialize database connection after multer processing
        db = await getDb();

        const { name, caption } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
          res.status(400).json({ error: 'No files uploaded' });
          return resolve();
        }

        if (!name) {
          res.status(400).json({ error: 'Name is required' });
          return resolve();
        }

        // Generate a unique upload group ID
        const uploadGroup = uuidv4();

        // Insert each file into the database
        const insertPromises = files.map(async (file) => {
          // Check if file is a video
          const isVideo = file.mimetype.startsWith('video/') || 
                         /\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i.test(file.originalname);

          return db.run(
            `INSERT INTO photos (filename, originalname, name, caption, upload_group, uploaded_at, is_video) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              file.filename,
              file.originalname,
              name,
              caption || '',
              uploadGroup,
              new Date().toISOString(),
              isVideo ? 1 : 0
            ]
          );
        });

        await Promise.all(insertPromises);

        res.status(200).json({
          message: 'Files uploaded successfully',
          count: files.length,
          uploadGroup: uploadGroup
        });

        resolve();

      } catch (dbError) {
        console.error('Database error:', dbError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Database operation failed' });
        }
        resolve();
      } finally {
        // Close database connection if it exists
        if (db) {
          await closeDb(db);
        }
      }
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
