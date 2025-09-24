
import fs from 'fs';
import { getDb } from '../../../lib/db';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { photoIds, groupId, password } = req.body;

  if (!photoIds && !groupId) {
    return res.status(400).json({ error: 'Either photoIds or groupId is required' });
  }

  // Add password validation
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  try {
    const db = await getDb();
    
    let photosToDelete = [];

    if (groupId) {
      // Delete entire group
      photosToDelete = await db.all(
        'SELECT id, filename FROM photos WHERE upload_group = ?',
        [groupId]
      );
    } else if (photoIds && Array.isArray(photoIds)) {
      // Delete specific photos
      const placeholders = photoIds.map(() => '?').join(',');
      photosToDelete = await db.all(
        `SELECT id, filename FROM photos WHERE id IN (${placeholders})`,
        photoIds
      );
    }

    if (photosToDelete.length === 0) {
      return res.status(404).json({ error: 'No photos found to delete' });
    }

    // Start transaction
    await db.exec('BEGIN TRANSACTION');

    try {
      // Delete from database
      const photoIdsToDelete = photosToDelete.map(p => p.id);
      const placeholders = photoIdsToDelete.map(() => '?').join(',');
      
      // Delete from photos table
      await db.run(
        `DELETE FROM photos WHERE id IN (${placeholders})`,
        photoIdsToDelete
      );

      // Delete from photo_likes table
      await db.run(
        `DELETE FROM photo_likes WHERE photo_id IN (${placeholders})`,
        photoIdsToDelete
      );

      // Delete physical files
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const deletedFiles = [];
      const failedFiles = [];

      for (const photo of photosToDelete) {
        try {
          const filePath = path.join(uploadDir, photo.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedFiles.push(photo.filename);
          }
        } catch (fileError) {
          console.error(`Failed to delete file ${photo.filename}:`, fileError);
          failedFiles.push(photo.filename);
        }
      }

      // Commit transaction
      await db.exec('COMMIT');

      res.status(200).json({
        message: `Successfully deleted ${photoIdsToDelete.length} photos`,
        deletedPhotos: photoIdsToDelete,
        deletedFiles,
        failedFiles: failedFiles.length > 0 ? failedFiles : undefined
      });

    } catch (error) {
      // Rollback transaction
      await db.exec('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting photos:', error);
    res.status(500).json({ error: 'Failed to delete photos' });
  }
}
