
import fs from 'fs';
import path from 'path';
import { getDb } from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { groupId } = req.query;
  const { photoId, password } = req.body;

  if (!groupId) {
    return res.status(400).json({ error: 'Group ID is required' });
  }

  // Check password against the ADMIN_PASSWORD environment variable
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return res.status(500).json({ error: 'Admin access not configured' });
  }

  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  try {
    const db = await getDb();

    if (photoId) {
      // Delete single photo from group
      const photo = await db.get(
        'SELECT id, filename FROM photos WHERE id = ? AND upload_group = ?',
        [photoId, groupId]
      );

      if (!photo) {
        return res.status(404).json({ error: 'Photo not found in this group' });
      }

      // Start transaction
      await db.exec('BEGIN TRANSACTION');

      try {
        // Delete from database
        await db.run('DELETE FROM photos WHERE id = ?', [photoId]);
        await db.run('DELETE FROM photo_likes WHERE photo_id = ?', [photoId]);

        // Delete physical file
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const filePath = path.join(uploadDir, photo.filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        // Check if group is now empty
        const remainingPhotos = await db.get(
          'SELECT COUNT(*) as count FROM photos WHERE upload_group = ?',
          [groupId]
        );

        await db.exec('COMMIT');

        res.status(200).json({
          message: 'Photo deleted successfully',
          deletedPhotoId: photoId,
          groupEmpty: remainingPhotos.count === 0
        });

      } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
      }

    } else {
      // Delete entire group
      const photos = await db.all(
        'SELECT id, filename FROM photos WHERE upload_group = ?',
        [groupId]
      );

      if (photos.length === 0) {
        return res.status(404).json({ error: 'No photos found in this group' });
      }

      // Start transaction
      await db.exec('BEGIN TRANSACTION');

      try {
        const photoIds = photos.map(p => p.id);
        const placeholders = photoIds.map(() => '?').join(',');

        // Delete from database
        await db.run(
          `DELETE FROM photos WHERE upload_group = ?`,
          [groupId]
        );
        await db.run(
          `DELETE FROM photo_likes WHERE photo_id IN (${placeholders})`,
          photoIds
        );

        // Delete physical files
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const deletedFiles = [];

        for (const photo of photos) {
          try {
            const filePath = path.join(uploadDir, photo.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              deletedFiles.push(photo.filename);
            }
          } catch (fileError) {
            console.error(`Failed to delete file ${photo.filename}:`, fileError);
          }
        }

        await db.exec('COMMIT');

        res.status(200).json({
          message: `Successfully deleted group with ${photos.length} photos`,
          deletedGroupId: groupId,
          deletedPhotos: photoIds,
          deletedFiles
        });

      } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
      }
    }

  } catch (error) {
    console.error('Error deleting from group:', error);
    res.status(500).json({ error: 'Failed to delete from group' });
  }
}
