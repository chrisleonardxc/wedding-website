import { groupPhotosByUploadGroup } from '../../../lib/galleryUtils';
import { getDb } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const db = await getDb();
      
      // Get pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      // Ensure the likes table exists
      await db.exec(`
        CREATE TABLE IF NOT EXISTS photo_likes (
          photo_id TEXT NOT NULL,
          likes_count INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (photo_id)
        );
      `);
      
      // Get total count of photo groups (not individual photos)
      const totalGroupsResult = await db.get(`
        SELECT COUNT(DISTINCT upload_group) as total
        FROM photos
      `);
      const totalGroups = totalGroupsResult.total;
      
      // Get paginated photo groups by getting distinct upload_groups first
      const groupsQuery = `
        SELECT DISTINCT upload_group, 
               MIN(uploaded_at) as group_uploaded_at
        FROM photos 
        GROUP BY upload_group
        ORDER BY group_uploaded_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const paginatedGroups = await db.all(groupsQuery, [limit, offset]);
      
      if (paginatedGroups.length === 0) {
        return res.status(200).json({
          photoGroups: [],
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalGroups / limit),
            totalGroups: totalGroups,
            hasNextPage: false,
            hasPrevPage: page > 1
          }
        });
      }
      
      // Get all photos for the paginated groups
      const groupIds = paginatedGroups.map(g => g.upload_group);
      const placeholders = groupIds.map(() => '?').join(',');
      
      const photos = await db.all(`
        SELECT p.id, p.filename, p.originalname, p.name, p.caption, 
               p.upload_group, p.uploaded_at, p.is_video,
               COALESCE(l.likes_count, 0) as likes_count
        FROM photos p
        LEFT JOIN photo_likes l ON p.id = l.photo_id
        WHERE p.upload_group IN (${placeholders})
        ORDER BY p.uploaded_at DESC
      `, groupIds);
      
      // Process photos to include full URLs and ensure proper media type handling
      const processedPhotos = photos.map(photo => ({
        ...photo,
        url: `/uploads/${photo.filename}`,
        is_video: Boolean(photo.is_video)
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
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalGroups / limit);
      
      res.status(200).json({
        photoGroups: groupsWithLikes,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalGroups: totalGroups,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: limit
        }
      });
    } catch (error) {
      console.error('Error fetching photos:', error);
      res.status(500).json({ error: 'Failed to fetch photos' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
