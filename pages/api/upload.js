import { createRouter } from "next-connect";
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import { initDb } from '../../lib/db';

// Promisify exec for async/await usage
const execPromise = promisify(exec);

// Define consistent paths
const dbPath =
  process.env.DB_PATH || path.join(process.cwd(), "data", "wedding.db");

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

// Helper function to determine if a file is a video
function isVideoFile(file) {
  const videoMimeTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/x-flv',
    'video/x-matroska'
  ];
  
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm'];
  
  return (
    videoMimeTypes.includes(file.mimetype) ||
    videoExtensions.includes(path.extname(file.originalname).toLowerCase())
  );
}

// Initialize database
async function initDatabase() {
  return await initDb();
}

// API route handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle the file upload with multer
    const multerUpload = upload.array('photos', 10); // Allow up to 10 files
    
    multerUpload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message });
      } else if (err) {
        // An unknown error occurred
        console.error('Unknown upload error:', err);
        return res.status(500).json({ error: 'File upload failed' });
      }
      
      // If no files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded' });
      }
      
      try {
        const db = await initDatabase();
        
        // Get form data
        const { name, caption } = req.body;
        
        // Generate a unique group ID for this upload batch
        const uploadGroupId = uuidv4();
        
        // Insert each file into the database
        for (const file of req.files) {
          const isVideo = isVideoFile(file);
          
          await db.run(
            `INSERT INTO photos (filename, originalname, name, caption, upload_group, is_video)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              file.filename,
              file.originalname,
              name || 'Anonymous',
              caption || '',
              uploadGroupId,
              isVideo ? 1 : 0
            ]
          );
        }
        
        return res.status(200).json({
          success: true,
          count: req.files.length,
          message: `${req.files.length} file(s) uploaded successfully`
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        
        // Clean up uploaded files if database operation fails
        for (const file of req.files) {
          const filePath = path.join(process.cwd(), 'public', 'uploads', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        
        return res.status(500).json({ error: 'Database operation failed' });
      } finally {
        db.close();
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Configure API route to handle large files
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};
