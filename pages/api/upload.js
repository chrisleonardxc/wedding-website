import { createRouter } from "next-connect";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";

// Promisify exec for async/await usage
const execPromise = promisify(exec);

// Define consistent paths
const dbPath =
  process.env.DB_PATH || path.join(process.cwd(), "data", "wedding.db");
const uploadDir = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Get original extension or default to jpg
    let ext = path.extname(file.originalname).toLowerCase();

    // Always save HEIC/HEIF files with .jpg extension since we'll convert them
    if (
      ext === ".heic" ||
      ext === ".heif" ||
      file.mimetype === "image/heic" ||
      file.mimetype === "image/heif"
    ) {
      ext = ".jpg";
    } else if (!ext || !ext.match(/\.(jpg|jpeg|png|gif)$/i)) {
      ext = ".jpg"; // Default extension for any non-standard image type
    }

    cb(null, uniqueSuffix + ext);
  },
});

// Helper function to run middleware
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Function to convert HEIC to JPEG using server-side tools
async function convertHeicToJpeg(filePath, originalExt) {
  // Check if the file is a HEIC/HEIF file based on extension or magic bytes
  const isHeicFile =
    originalExt === ".heic" ||
    originalExt === ".heif" ||
    (await checkHeicMagicBytes(filePath));

  if (isHeicFile) {
    try {
      // Try using heif-convert if available
      try {
        await execPromise("which heif-convert");
        const outputPath = filePath.replace(/\.(heic|heif)$/i, ".jpg");
        await execPromise(`heif-convert "${filePath}" "${outputPath}"`);

        // If conversion successful, use the new file
        if (fs.existsSync(outputPath)) {
          // If the original file doesn't already have a .jpg extension, remove it
          if (
            !filePath.toLowerCase().endsWith(".jpg") &&
            !filePath.toLowerCase().endsWith(".jpeg")
          ) {
            fs.unlinkSync(filePath);
          }
          return outputPath;
        }
      } catch (heifError) {
        console.log(
          "heif-convert not available or failed, trying ImageMagick..."
        );

        // Try ImageMagick as fallback
        try {
          await execPromise("which convert");
          const outputPath = filePath.replace(/\.(heic|heif)$/i, ".jpg");
          await execPromise(`convert "${filePath}" "${outputPath}"`);

          if (fs.existsSync(outputPath)) {
            // If the original file doesn't already have a .jpg extension, remove it
            if (
              !filePath.toLowerCase().endsWith(".jpg") &&
              !filePath.toLowerCase().endsWith(".jpeg")
            ) {
              fs.unlinkSync(filePath);
            }
            return outputPath;
          }
        } catch (imageMagickError) {
          console.error("ImageMagick conversion failed:", imageMagickError);
        }
      }
    } catch (error) {
      console.error("HEIC conversion error:", error);
    }
  }

  // Return original path if no conversion happened or needed
  return filePath;
}

// Function to check file magic bytes to identify HEIC files regardless of extension
async function checkHeicMagicBytes(filePath) {
  try {
    // Read the first few bytes of the file
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // HEIC files typically start with 'ftypheic' or 'ftypheix' after the first 4 bytes
    const heicSignature = buffer.toString("ascii", 4, 12);
    return (
      heicSignature.includes("ftyp") &&
      (heicSignature.includes("heic") || heicSignature.includes("heix"))
    );
  } catch (error) {
    console.error("Error checking file type:", error);
    return false;
  }
}

// Database initialization
async function initDb() {
  const sqlite3 = require("sqlite3").verbose();
  const { open } = require("sqlite");

  // Open the database
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Create tables if they don't exist
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

// Configure multer upload
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    // Accept more image formats including HEIC
    const allowedTypes = /jpeg|jpg|png|gif|heic|heif/i;

    // Check if the file has an extension
    let extname = path.extname(file.originalname).toLowerCase();
    if (!extname && file.mimetype.includes("image/")) {
      // If no extension but is an image type, accept it
      return cb(null, true);
    }

    // Remove the dot from the extension
    extname = extname.substring(1);

    // Check mimetype and extension
    const isAllowedExt = allowedTypes.test(extname);
    const isAllowedMime = file.mimetype.startsWith("image/");

    // Special case for HEIC files which might have different mimetypes
    const isHeic =
      extname === "heic" ||
      extname === "heif" ||
      file.mimetype === "image/heic" ||
      file.mimetype === "image/heif";

    if (isAllowedExt || isAllowedMime || isHeic) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// API route handler
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Starting photo upload process...");
    // Run the multer middleware for multiple files (up to 10)
    await runMiddleware(req, res, upload.array("photos", 10));

    if (!req.files || req.files.length === 0) {
      console.log("No files were uploaded");
      return res.status(400).json({ error: "No files uploaded" });
    }

    console.log(`${req.files.length} files uploaded successfully`);

    // Generate a unique upload group ID for this batch of photos
    const uploadGroupId = Date.now().toString();

    // Process HEIC files if any
    for (const file of req.files) {
      const originalExt = path.extname(file.originalname).toLowerCase();
      const filePath = path.join(uploadDir, file.filename);

      // Convert any HEIC/HEIF files to JPEG
      const convertedPath = await convertHeicToJpeg(filePath, originalExt);

      // Update filename if it changed during conversion
      if (convertedPath !== filePath) {
        file.filename = path.basename(convertedPath);
      }
    }

    console.log("Opening database connection...");
    const db = await initDb();
    console.log("Database connection established");

    // Insert each photo into the database
    const uploadedFiles = [];

    for (const file of req.files) {
      console.log("Processing file:", file.filename);

      const result = await db.run(
        "INSERT INTO photos (filename, originalname, name, caption, upload_group) VALUES (?, ?, ?, ?, ?)",
        [
          file.filename,
          file.originalname,
          req.body.name || "Anonymous",
          req.body.caption || "",
          uploadGroupId,
        ]
      );

      uploadedFiles.push({
        filename: file.filename,
        originalname: file.originalname,
        id: result.lastID,
      });
    }

    await db.close();
    console.log("Database connection closed");

    console.log("Upload process completed successfully");
    res.status(200).json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
      uploadGroupId,
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
