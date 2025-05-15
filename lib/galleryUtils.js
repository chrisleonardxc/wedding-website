// Helper functions for the photo gallery

/**
 * Sort photos by upload date (newest first)
 * @param {Array} photos - Array of photo objects
 * @returns {Array} Sorted array of photos
 */
export function sortPhotosByDate(photos) {
  if (!Array.isArray(photos)) return [];
  
  return [...photos].sort((a, b) => {
    const dateA = new Date(a.uploaded_at || 0);
    const dateB = new Date(b.uploaded_at || 0);
    return dateB - dateA; // Descending order (newest first)
  });
}

/**
 * Group photos by upload group
 * @param {Array} photos - Array of individual photo objects
 * @returns {Array} Array of photo group objects
 */
export function groupPhotosByUploadGroup(photos) {
  if (!Array.isArray(photos)) return [];
  
  const groups = {};
  
  // Group photos by upload_group
  photos.forEach(photo => {
    const groupId = photo.upload_group || 'ungrouped';
    
    if (!groups[groupId]) {
      groups[groupId] = {
        id: groupId,
        name: photo.name,
        caption: photo.caption,
        url: photo.url || `/uploads/${photo.filename}`,
        uploaded_at: photo.uploaded_at,
        photos: [],
        photoCount: 0
      };
    }
    
    groups[groupId].photos.push(photo);
    groups[groupId].photoCount++;
    
    // Update the group timestamp to the newest photo if applicable
    const photoDate = new Date(photo.uploaded_at || 0);
    const groupDate = new Date(groups[groupId].uploaded_at || 0);
    
    if (photoDate > groupDate) {
      groups[groupId].uploaded_at = photo.uploaded_at;
    }
  });
  
  // Convert to array and sort by date
  return sortPhotosByDate(Object.values(groups));
}

/**
 * Filter photos by photographer name
 * @param {Array} photos - Array of photo objects
 * @param {string} name - Name to filter by
 * @returns {Array} Filtered array of photos
 */
export function filterPhotosByName(photos, name) {
  if (!Array.isArray(photos) || !name) return photos;
  
  const searchTerm = name.toLowerCase();
  return photos.filter(photo => 
    photo.name && photo.name.toLowerCase().includes(searchTerm)
  );
}

/**
 * Filter photos by caption text
 * @param {Array} photos - Array of photo objects
 * @param {string} caption - Caption text to filter by
 * @returns {Array} Filtered array of photos
 */
export function filterPhotosByCaption(photos, caption) {
  if (!Array.isArray(photos) || !caption) return photos;
  
  const searchTerm = caption.toLowerCase();
  return photos.filter(photo => 
    photo.caption && photo.caption.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get photo statistics
 * @param {Array} photos - Array of photo objects
 * @returns {Object} Statistics object
 */
export function getPhotoStats(photos) {
  if (!Array.isArray(photos)) return { totalPhotos: 0, uniquePhotographers: 0 };
  
  const uniquePhotographers = new Set(
    photos.map(photo => photo.name).filter(Boolean)
  );
  
  return {
    totalPhotos: photos.length,
    uniquePhotographers: uniquePhotographers.size
  };
}