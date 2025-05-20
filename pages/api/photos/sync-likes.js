import { getDb } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { likes, unlikes } = req.body;
    
    if (!Array.isArray(likes) && !Array.isArray(unlikes)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
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
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Process likes (increment counters)
    if (Array.isArray(likes) && likes.length > 0) {
      for (const photoId of likes) {
        // Insert or update the like count
        await db.run(`
          INSERT INTO photo_likes (photo_id, likes_count, last_updated)
          VALUES (?, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(photo_id) DO UPDATE SET
          likes_count = likes_count + 1,
          last_updated = CURRENT_TIMESTAMP
        `, [photoId]);
      }
    }
    
    // Process unlikes (decrement counters)
    if (Array.isArray(unlikes) && unlikes.length > 0) {
      for (const photoId of unlikes) {
        // Update the like count, ensuring it doesn't go below 0
        await db.run(`
          UPDATE photo_likes
          SET likes_count = MAX(0, likes_count - 1),
              last_updated = CURRENT_TIMESTAMP
          WHERE photo_id = ?
        `, [photoId]);
      }
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Return success
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error syncing likes:', error);
    
    // Try to rollback if there was an error
    try {
      const db = await getDb();
      await db.run('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    
    res.status(500).json({ error: 'Failed to sync likes' });
  }
}